import type { TickerItem } from "@/components/AnnouncementTicker";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const REVENUE_MONTH_COUNT = 6;
const ANALYTICS_REFRESH_INTERVAL_MS = 30_000;
let analyticsChannelSequence = 0;

export type AdminAttendanceEntry = {
  id: string;
  memberName: string | null;
  memberEmail: string | null;
  checkIn: string;
  checkOut: string | null;
};

export type TrafficPoint = {
  value: number;
  label: string;
};

export type MembershipStatusCounts = {
  active: number;
  inactive: number;
  expired: number;
};

type AnalyticsErrors = {
  attendance: string | null;
  revenue: string | null;
  membership: string | null;
};

function startOfWeek(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return start;
}

function emptyDailyAttendance() {
  return WEEK_LABELS.map((label) => ({ label, value: 0 }));
}

function emptyMonthlyRevenue(now = new Date()) {
  const firstMonth = new Date(
    now.getFullYear(),
    now.getMonth() - REVENUE_MONTH_COUNT + 1,
    1,
  );

  return Array.from({ length: REVENUE_MONTH_COUNT }, (_, index) => {
    const month = new Date(
      firstMonth.getFullYear(),
      firstMonth.getMonth() + index,
      1,
    );
    return {
      label: month.toLocaleDateString(undefined, { month: "short" }),
      value: 0,
    };
  });
}

export function useAdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    memberCount: 0,
    pendingApplications: 0,
    attendanceCount: 0,
    paymentCount: 0,
    registeredTodayCount: 0,
    loggedInTodayCount: 0,
  });
  const [attendance, setAttendance] = useState<AdminAttendanceEntry[]>([]);
  const [dailyAttendance, setDailyAttendance] = useState<TrafficPoint[]>(
    emptyDailyAttendance,
  );
  const [monthlyRevenue, setMonthlyRevenue] = useState<TrafficPoint[]>(() =>
    emptyMonthlyRevenue(),
  );
  const [membershipStatus, setMembershipStatus] =
    useState<MembershipStatusCounts>({
      active: 0,
      inactive: 0,
      expired: 0,
    });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsErrors, setAnalyticsErrors] = useState<AnalyticsErrors>({
    attendance: null,
    revenue: null,
    membership: null,
  });
  const [announcements, setAnnouncements] = useState<TickerItem[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);

      const [
        membersRes,
        appsRes,
        attendanceTodayRes,
        paymentsRes,
        recentAttendanceRes,
        announcementsRes,
        registeredTodayRes,
      ] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase
          .from("coach_applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .gte("check_in", todayStart.toISOString())
          .lt("check_in", tomorrowStart.toISOString()),
        supabase.from("payments").select("id", { count: "exact", head: true }),
        supabase
          .from("attendance")
          .select("id, member_id, check_in, check_out")
          .order("check_in", { ascending: false })
          .limit(5),
        supabase
          .from("announcements")
          .select("title, body, created_at")
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("role", "member")
          .gte("created_at", todayStart.toISOString())
          .lt("created_at", tomorrowStart.toISOString()),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (appsRes.error) throw appsRes.error;
      if (attendanceTodayRes.error) throw attendanceTodayRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (recentAttendanceRes.error) throw recentAttendanceRes.error;
      if (announcementsRes.error) throw announcementsRes.error;
      if (registeredTodayRes.error) throw registeredTodayRes.error;

      const loggedInTodayRes = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "member")
        .gte("last_login_at", todayStart.toISOString())
        .lt("last_login_at", tomorrowStart.toISOString());
      if (loggedInTodayRes.error) {
        console.warn(
          "Could not load today's member logins. Apply the member login tracking migration to enable this metric:",
          loggedInTodayRes.error.message,
        );
      }

      const recentRows: {
        id: string;
        member_id: string | null;
        check_in: string;
        check_out: string | null;
      }[] = recentAttendanceRes.data || [];
      const memberIds = [
        ...new Set(
          recentRows
            .map((row) => row.member_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      const usersRes = memberIds.length
        ? await supabase
            .from("users")
            .select("id, email, first_name, last_name")
            .in("id", memberIds)
        : { data: [], error: null };
      if (usersRes.error) throw usersRes.error;

      const users: {
        id: string;
        email: string | null;
        first_name: string | null;
        last_name: string | null;
      }[] = usersRes.data || [];
      const usersById = new Map(users.map((row) => [row.id, row]));
      const nextAttendance = recentRows.map((row) => {
        const member = row.member_id ? usersById.get(row.member_id) : null;
        const memberName = member
          ? [member.first_name, member.last_name].filter(Boolean).join(" ")
          : "";

        return {
          id: row.id,
          memberName: memberName || null,
          memberEmail: member?.email || null,
          checkIn: row.check_in,
          checkOut: row.check_out,
        };
      });

      setStats({
        memberCount: membersRes.count || 0,
        pendingApplications: appsRes.count || 0,
        attendanceCount: attendanceTodayRes.count || 0,
        paymentCount: paymentsRes.count || 0,
        registeredTodayCount: registeredTodayRes.count || 0,
        loggedInTodayCount: loggedInTodayRes.error ? 0 : loggedInTodayRes.count || 0,
      });
      setAttendance(nextAttendance);
      setAnnouncements((announcementsRes.data || []) as TickerItem[]);
    } catch (error) {
      console.error(
        "Error fetching admin dashboard:",
        error instanceof Error ? error.message : JSON.stringify(error),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async (showInitialLoading = false) => {
    if (showInitialLoading) setAnalyticsLoading(true);

    try {
      const supabase = getSupabaseClient();
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const weekStart = startOfWeek(todayStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const firstRevenueMonth = new Date(
        now.getFullYear(),
        now.getMonth() - REVENUE_MONTH_COUNT + 1,
        1,
      );
      const todayDate = todayStart.toISOString().slice(0, 10);

      const [
        attendanceRes,
        paidPaymentsRes,
        legacyPaidPaymentsRes,
        totalMembershipsRes,
        activeMembershipsRes,
        expiredMembershipsRes,
      ] = await Promise.all([
        supabase
          .from("attendance")
          .select("check_in")
          .gte("check_in", weekStart.toISOString())
          .lt("check_in", weekEnd.toISOString()),
        supabase
          .from("payments")
          .select("id, amount, paid_at, created_at")
          .eq("status", "paid")
          .gte("paid_at", firstRevenueMonth.toISOString()),
        supabase
          .from("payments")
          .select("id, amount, paid_at, created_at")
          .eq("status", "paid")
          .is("paid_at", null)
          .gte("created_at", firstRevenueMonth.toISOString()),
        supabase.from("memberships").select("id", { count: "exact", head: true }),
        supabase
          .from("memberships")
          .select("id", { count: "exact", head: true })
          .eq("status", "active")
          .or(`start_date.is.null,start_date.lte.${todayDate}`)
          .or(`end_date.is.null,end_date.gte.${todayDate}`),
        supabase
          .from("memberships")
          .select("id", { count: "exact", head: true })
          .or(`status.eq.expired,end_date.lt.${todayDate}`),
      ]);

      if (attendanceRes.error) {
        console.error("Error loading daily attendance analytics:", attendanceRes.error);
        setAnalyticsErrors((current) => ({
          ...current,
          attendance: "Unable to load daily attendance data.",
        }));
      } else {
        const nextAttendance = emptyDailyAttendance();
        const rows: { check_in: string }[] = attendanceRes.data || [];
        for (const row of rows) {
          const checkIn = new Date(row.check_in);
          nextAttendance[(checkIn.getDay() + 6) % 7].value += 1;
        }
        setDailyAttendance(nextAttendance);
        setAnalyticsErrors((current) => ({ ...current, attendance: null }));
      }

      const paymentError =
        paidPaymentsRes.error || legacyPaidPaymentsRes.error;
      if (paymentError) {
        console.error("Error loading monthly revenue analytics:", paymentError);
        setAnalyticsErrors((current) => ({
          ...current,
          revenue: "Unable to load monthly revenue data.",
        }));
      } else {
        const nextRevenue = emptyMonthlyRevenue(now);
        const firstMonthIndex =
          firstRevenueMonth.getFullYear() * 12 + firstRevenueMonth.getMonth();
        const paymentRows = [
          ...(paidPaymentsRes.data || []),
          ...(legacyPaidPaymentsRes.data || []),
        ] as {
          amount: number | string;
          paid_at: string | null;
          created_at: string;
        }[];

        for (const payment of paymentRows) {
          const revenueDate = new Date(payment.paid_at || payment.created_at);
          const monthIndex =
            revenueDate.getFullYear() * 12 +
            revenueDate.getMonth() -
            firstMonthIndex;
          const amount = Number(payment.amount);
          if (
            !Number.isFinite(revenueDate.getTime()) ||
            revenueDate > now ||
            monthIndex < 0 ||
            monthIndex >= nextRevenue.length ||
            !Number.isFinite(amount)
          ) {
            continue;
          }
          nextRevenue[monthIndex].value += amount;
        }

        setMonthlyRevenue(nextRevenue);
        setAnalyticsErrors((current) => ({ ...current, revenue: null }));
      }

      const membershipError =
        totalMembershipsRes.error ||
        activeMembershipsRes.error ||
        expiredMembershipsRes.error;
      if (membershipError) {
        console.error("Error loading membership status analytics:", membershipError);
        setAnalyticsErrors((current) => ({
          ...current,
          membership: "Unable to load membership status data.",
        }));
      } else {
        const total = totalMembershipsRes.count || 0;
        const active = activeMembershipsRes.count || 0;
        const expired = expiredMembershipsRes.count || 0;
        setMembershipStatus({
          active,
          inactive: Math.max(total - active - expired, 0),
          expired,
        });
        setAnalyticsErrors((current) => ({ ...current, membership: null }));
      }
    } catch (error) {
      console.error("Error fetching admin dashboard analytics:", error);
      const message = "Unable to load analytics. Please try again.";
      setAnalyticsErrors({
        attendance: message,
        revenue: message,
        membership: message,
      });
    } finally {
      if (showInitialLoading) setAnalyticsLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
      return;
    }

    const role = currentUser?.user_metadata?.role || "member";
    if (role !== "admin") {
      if (role === "member") router.replace("/member/dashboard");
      else if (role === "coach") router.replace("/coach/dashboard");
      else router.replace("/login");
      return;
    }

    setUser(currentUser);
    await Promise.all([fetchStats(), fetchAnalytics(true)]);
  }, [fetchAnalytics, fetchStats]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
  }, [checkAuth]);

  useEffect(() => {
    if (!user) return;

    let disposed = false;
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    let removeChannel: (() => void) | null = null;
    const poll = setInterval(
      () => void fetchAnalytics(),
      ANALYTICS_REFRESH_INTERVAL_MS,
    );
    const scheduleRefresh = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        refreshTimeout = null;
        if (!disposed) void fetchAnalytics();
      }, 300);
    };

    try {
      const supabase = getSupabaseClient();
      const channel = supabase.channel(
        `admin-dashboard-analytics-${user.id}-${Date.now()}-${++analyticsChannelSequence}`,
      );
      for (const table of ["attendance", "payments", "memberships"] as const) {
        channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          scheduleRefresh,
        );
      }
      removeChannel = () => {
        void supabase.removeChannel(channel);
      };
      channel.subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Admin analytics realtime subscription failed:", status);
        }
      });
    } catch (error) {
      console.error("Unable to initialize admin analytics realtime:", error);
    }

    return () => {
      disposed = true;
      clearInterval(poll);
      if (refreshTimeout) clearTimeout(refreshTimeout);
      removeChannel?.();
    };
  }, [fetchAnalytics, user]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchStats(), fetchAnalytics()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAnalytics, fetchStats]);

  return {
    user,
    stats,
    attendance,
    dailyAttendance,
    monthlyRevenue,
    membershipStatus,
    analyticsLoading,
    analyticsErrors,
    announcements,
    loading,
    refreshing,
    refresh,
  };
}
