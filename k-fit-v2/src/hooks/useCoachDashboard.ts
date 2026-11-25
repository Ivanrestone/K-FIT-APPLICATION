// hooks/useCoachDashboard.ts
import type { TickerItem } from "@/components/AnnouncementTicker";
import type {
  CoachActivity,
  TodaySession,
} from "@/components/coach";
import { birthdayTickerItems, getTodaysBirthdays } from "@/lib/birthdays";
import { isUuid } from "@/lib/uuid";
import { useCallback, useEffect, useState } from "react";

export type DashboardData = {
  stats: {
    upcoming: number;
    scheduled: number;
    completed: number;
    todaySessions: number;
    activeClients: number;
    pendingRequests: number;
  };
  todaySessions: TodaySession[];
  recentActivity: CoachActivity[];
  recentActivityError: string | null;
  nextSession: { id: string; date: string; memberName: string | null } | null;
  weekly: { days: number[]; total: number; lastWeekTotal: number };
  memberAttendance: DashboardChartPoint[];
  memberAttendanceError: string | null;
  memberProgress: DashboardChartPoint[];
  memberProgressError: string | null;
  announcements: TickerItem[];
};

export type DashboardChartPoint = { value: number; label: string };

/** Monday 00:00 of the week containing `d`. */
const startOfWeek = (d = new Date()) => {
  const s = new Date(d);
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  s.setHours(0, 0, 0, 0);
  return s;
};

async function loadDashboard(coachId: string): Promise<DashboardData> {
  const { getSupabaseClient } = await import("@/lib/supabase");
  const supabase = getSupabaseClient() as any; // avoids the 'never' typing issues

  const now = new Date().toISOString();
  const weekStart = startOfWeek();
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const trendStart = new Date();
  trendStart.setHours(0, 0, 0, 0);
  trendStart.setDate(trendStart.getDate() - 6);
  const trendEnd = new Date();
  trendEnd.setHours(0, 0, 0, 0);
  trendEnd.setDate(trendEnd.getDate() + 1);
  const progressStart = new Date(trendEnd);
  progressStart.setDate(progressStart.getDate() - 30);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const countAppointments = (status?: string, from?: string) => {
    let q = supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", coachId);
    if (status) q = q.eq("status", status);
    if (from) q = q.gte("appointment_date", from);
    return q;
  };

  const assignedClientsPromise = supabase
    .from("coach_clients")
    .select("member_id")
    .eq("coach_id", coachId)
    .eq("status", "active");

  const countClients = (status: string) =>
    supabase
      .from("coach_clients")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", coachId)
      .eq("status", status);

  const todaySessionsCountPromise = supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("coach_id", coachId)
    .eq("status", "scheduled")
    .gte("appointment_date", todayStart.toISOString())
    .lt("appointment_date", tomorrowStart.toISOString());

  const todaySessionsPromise = supabase
    .from("appointments")
    .select("id, member_id, appointment_date, end_time, notes")
    .eq("coach_id", coachId)
    .eq("status", "scheduled")
    .gte("appointment_date", todayStart.toISOString())
    .lt("appointment_date", tomorrowStart.toISOString())
    .order("appointment_date", { ascending: true })
    .limit(10);

  // Next appointment + member name are chained, but run alongside everything else.
  const nextPromise = (async () => {
    const { data: appt, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, appointment_date, member_id")
      .eq("coach_id", coachId)
      .eq("status", "scheduled")
      .gte("appointment_date", now)
      .order("appointment_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (appointmentError) throw appointmentError;
    if (!appt) return null;

    const { data: member, error: memberError } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", appt.member_id)
      .single();
    if (memberError) throw memberError;

    const memberName =
      [member?.first_name, member?.last_name].filter(Boolean).join(" ") || null;
    return {
      id: appt.id as string,
      date: appt.appointment_date as string,
      memberName,
    };
  })();

  const announcementsPromise = (async () => {
    const [{ data, error }, birthdays] = await Promise.all([
      supabase
        .from("announcements")
        .select("title, body, created_at")
        .in("audience", ["all", "coaches"])
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
      getTodaysBirthdays(),
    ]);
    if (error) throw error;
    return [
      ...birthdayTickerItems(birthdays),
      ...((data as TickerItem[]) || []),
    ];
  })();

  // Last week + this week in one query, bucketed locally.
  const weeklyPromise = supabase
    .from("appointments")
    .select("appointment_date, status")
    .eq("coach_id", coachId)
    .neq("status", "cancelled")
    .gte("appointment_date", lastWeekStart.toISOString())
    .lt("appointment_date", weekEnd.toISOString());

  const [
    upcoming,
    scheduled,
    completed,
    active,
    pending,
    assignedClients,
    nextSession,
    announcements,
    weeklyRes,
    todaySessionsCount,
    todayRows,
  ] = await Promise.all([
    countAppointments("scheduled", now),
    countAppointments("scheduled"),
    countAppointments("completed"),
    countClients("active"),
    countClients("pending"),
    assignedClientsPromise,
    nextPromise,
    announcementsPromise,
    weeklyPromise,
    todaySessionsCountPromise,
    todaySessionsPromise,
  ]);
  const countResults = [
    upcoming,
    scheduled,
    completed,
    active,
    pending,
    todaySessionsCount,
  ];
  for (const result of countResults) {
    if (result.error) throw result.error;
  }
  if (assignedClients.error) throw assignedClients.error;
  if (weeklyRes.error) throw weeklyRes.error;
  if (todayRows.error) throw todayRows.error;

  const days = [0, 0, 0, 0, 0, 0, 0];
  let lastWeekTotal = 0;
  for (const row of (weeklyRes.data as { appointment_date: string }[]) || []) {
    const d = new Date(row.appointment_date);
    if (d >= weekStart) days[(d.getDay() + 6) % 7] += 1;
    else lastWeekTotal += 1;
  }

  const memberIds = [
    ...new Set(
      ((assignedClients.data || []) as { member_id: string | null }[])
        .map((client) => client.member_id)
        .filter(isUuid),
    ),
  ];
  const userIds = [
    ...new Set([
      ...memberIds,
      ...((todayRows.data || []) as { member_id: string }[]).map(
        (session) => session.member_id,
      ),
    ]),
  ].filter(isUuid);
  const memberAttendance = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(trendStart);
    date.setDate(date.getDate() + index);
    return {
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      value: 0,
    };
  });
  const memberVolumes = new Map<string, number>();
  const membersById = new Map<
    string,
    { id: string; first_name: string | null; last_name: string | null }
  >();
  let memberAttendanceError: string | null = null;
  let memberProgressError: string | null = null;
  let recentActivityError: string | null = null;
  let recentWorkoutRows: {
    member_id: string | null;
    exercise_name: string;
    logged_at: string;
  }[] = [];
  let recentSessionRows: {
    id: string;
    member_id: string | null;
    appointment_date: string;
    status: "completed" | "cancelled";
  }[] = [];
  let recentClientRows: {
    id: string;
    member_id: string | null;
    status: "active" | "pending";
    created_at: string | null;
  }[] = [];

  {
    const [
      attendanceRes,
      workoutRes,
      membersRes,
      recentWorkoutRes,
      recentSessionsRes,
      recentClientsRes,
    ] = await Promise.all([
      memberIds.length > 0
        ? supabase
            .from("attendance")
            .select("check_in")
            .in("member_id", memberIds)
            .gte("check_in", trendStart.toISOString())
            .lt("check_in", trendEnd.toISOString())
        : Promise.resolve({ data: [], error: null }),
      memberIds.length > 0
        ? supabase
            .from("workout_logs")
            .select("member_id, total_volume")
            .in("member_id", memberIds)
            .gte("logged_at", progressStart.toISOString())
        : Promise.resolve({ data: [], error: null }),
      userIds.length > 0
        ? supabase
            .from("users")
            .select("id, first_name, last_name")
            .in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
      memberIds.length > 0
        ? supabase
            .from("workout_logs")
            .select("member_id, exercise_name, logged_at")
            .in("member_id", memberIds)
            .gte("logged_at", progressStart.toISOString())
            .order("logged_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("appointments")
        .select("id, member_id, appointment_date, status")
        .eq("coach_id", coachId)
        .in("status", ["completed", "cancelled"])
        .gte("appointment_date", progressStart.toISOString())
        .lt("appointment_date", now)
        .order("appointment_date", { ascending: false })
        .limit(5),
      supabase
        .from("coach_clients")
        .select("id, member_id, status, created_at")
        .eq("coach_id", coachId)
        .in("status", ["active", "pending"])
        .order("created_at", { ascending: false, nullsFirst: false })
        .limit(5),
    ]);

    if (membersRes.error) throw membersRes.error;

    if (attendanceRes.error) {
      console.error(
        "Error loading assigned-member attendance:",
        attendanceRes.error,
      );
      memberAttendanceError = "Unable to load member attendance. Pull to refresh.";
    } else {
      for (const row of (attendanceRes.data || []) as { check_in: string }[]) {
        const checkIn = new Date(row.check_in);
        const checkInDay = new Date(
          checkIn.getFullYear(),
          checkIn.getMonth(),
          checkIn.getDate(),
        );
        const index = Math.round(
          (checkInDay.getTime() - trendStart.getTime()) / 86_400_000,
        );
        if (index >= 0 && index < memberAttendance.length) {
          memberAttendance[index].value += 1;
        }
      }
    }

    if (workoutRes.error) {
      if (workoutRes.error.code === "PGRST205") {
        console.warn(
          "Workout tracking requires the workout logs database migration.",
        );
      } else {
        console.error(
          "Error loading assigned-member workout progress:",
          workoutRes.error,
        );
      }
      memberProgressError =
        workoutRes.error.code === "PGRST205"
          ? "Workout tracking is not set up yet. Apply the workout logs database migration."
          : "Unable to load member workout progress. Pull to refresh.";
      if (workoutRes.error.code === "PGRST205") {
        recentActivityError =
          "Workout activity is unavailable until the workout logs migration is applied.";
      }
    } else {
      for (const row of (workoutRes.data || []) as {
        member_id: string;
        total_volume: number | string | null;
      }[]) {
        const volume = Number(row.total_volume);
        if (Number.isFinite(volume) && volume > 0) {
          memberVolumes.set(
            row.member_id,
            (memberVolumes.get(row.member_id) || 0) + volume,
          );
        }
      }
    }

    if (
      recentWorkoutRes.error &&
      recentWorkoutRes.error.code !== "PGRST205"
    ) {
      console.error(
        "Error loading recent workout activity:",
        recentWorkoutRes.error,
      );
      recentActivityError = "Some recent workout activity could not be loaded.";
    } else {
      recentWorkoutRows = recentWorkoutRes.data || [];
    }
    if (recentWorkoutRes.error?.code === "PGRST205") {
      recentActivityError =
        "Workout activity is unavailable until the workout logs migration is applied.";
    }

    if (recentSessionsRes.error) {
      console.error("Error loading recent sessions:", recentSessionsRes.error);
      recentActivityError = "Some recent activity could not be loaded.";
    } else {
      recentSessionRows = recentSessionsRes.data || [];
    }

    if (
      recentClientsRes.error?.code === "42703" &&
      recentClientsRes.error.message.includes("coach_clients.created_at")
    ) {
      const { data, error } = await supabase
        .from("coach_clients")
        .select("id, member_id, status")
        .eq("coach_id", coachId)
        .in("status", ["active", "pending"])
        .limit(5);

      if (error) {
        console.error("Error loading recent client activity:", error);
        recentActivityError = "Some recent activity could not be loaded.";
      } else {
        recentClientRows = (data || []).map((row: {
          id: string;
          member_id: string | null;
          status: "active" | "pending";
        }) => ({ ...row, created_at: null }));
        recentActivityError =
          "Client activity dates are unavailable until the database migration is applied.";
      }
    } else if (recentClientsRes.error) {
      console.error(
        "Error loading recent client activity:",
        recentClientsRes.error,
      );
      recentActivityError = "Some recent activity could not be loaded.";
    } else {
      recentClientRows = recentClientsRes.data || [];
    }

    for (const member of (membersRes.data || []) as {
      id: string;
      first_name: string | null;
      last_name: string | null;
    }[]) {
      membersById.set(member.id, member);
    }
  }

  const activityMemberIds = [
    ...new Set([
      ...recentWorkoutRows.map((row) => row.member_id),
      ...recentSessionRows.map((row) => row.member_id),
      ...recentClientRows.map((row) => row.member_id),
    ]),
  ].filter((memberId): memberId is string =>
    isUuid(memberId) && !membersById.has(memberId),
  );
  if (activityMemberIds.length > 0) {
    const { data: activityMembers, error: activityMembersError } =
      await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("id", activityMemberIds);
    if (activityMembersError) {
      console.error("Error loading recent activity names:", activityMembersError);
      recentActivityError = "Some recent activity details could not be loaded.";
    } else {
      for (const member of (activityMembers || []) as {
        id: string;
        first_name: string | null;
        last_name: string | null;
      }[]) {
        membersById.set(member.id, member);
      }
    }
  }

  const memberProgress = [...memberVolumes.entries()]
    .map(([memberId, value]) => {
      const member = membersById.get(memberId);
      const firstName = member?.first_name?.trim();
      const lastInitial = member?.last_name?.trim().charAt(0);
      const name = [firstName, lastInitial ? `${lastInitial}.` : ""]
        .filter(Boolean)
        .join(" ");
      return { label: name || "Member", value: Math.round(value) };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const memberName = (memberId: string | null) => {
    const member = isUuid(memberId) ? membersById.get(memberId) : undefined;
    return (
      [member?.first_name, member?.last_name].filter(Boolean).join(" ") ||
      "Member"
    );
  };
  const todaySessions: TodaySession[] = ((todayRows.data || []) as {
    id: string;
    member_id: string;
    appointment_date: string;
    end_time: string;
    notes: string | null;
  }[]).map((session) => ({
    id: session.id,
    date: session.appointment_date,
    endDate: session.end_time,
    memberName: memberName(session.member_id),
    notes: session.notes,
  }));
  const recentActivity: CoachActivity[] = [
    ...recentWorkoutRows.map((row) => ({
      id: `workout-${row.member_id}-${row.logged_at}`,
      kind: "workout" as const,
      title: "Workout recorded",
      detail: `${row.exercise_name} · ${memberName(row.member_id)}`,
      date: row.logged_at,
    })),
    ...recentSessionRows.map((row) => ({
      id: `session-${row.id}`,
      kind: "session" as const,
      title:
        row.status === "completed"
          ? "Training session completed"
          : "Training session cancelled",
      detail: memberName(row.member_id),
      date: row.appointment_date,
    })),
    ...recentClientRows.map((row) => ({
      id: `client-${row.id}`,
      kind: "client" as const,
      title:
        row.status === "pending"
          ? "New coaching request"
          : "Client relationship recorded",
      detail: memberName(row.member_id),
      date: row.created_at,
    })),
  ]
    .sort((a, b) => {
      const aDate = a.date ? new Date(a.date).getTime() : Number.NEGATIVE_INFINITY;
      const bDate = b.date ? new Date(b.date).getTime() : Number.NEGATIVE_INFINITY;
      return bDate - aDate;
    })
    .slice(0, 6);

  return {
    stats: {
      upcoming: upcoming.count || 0,
      scheduled: scheduled.count || 0,
      completed: completed.count || 0,
      todaySessions: todaySessionsCount.count || 0,
      activeClients: active.count || 0,
      pendingRequests: pending.count || 0,
    },
    todaySessions,
    recentActivity,
    recentActivityError,
    nextSession,
    weekly: { days, total: days.reduce((a, b) => a + b, 0), lastWeekTotal },
    memberAttendance,
    memberAttendanceError,
    memberProgress,
    memberProgressError,
    announcements,
  };
}

export function useCoachDashboard() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (existingUser?: any) => {
    try {
      let current = existingUser;
      if (!current) {
        const { requireRole } = await import("@/lib/auth");
        current = await requireRole("coach");
        if (!current) return;
        setUser(current);
      }
      setData(await loadDashboard(current.id));
    } catch (error) {
      console.error("Error loading coach dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load(user);
  }, [load, user]);

  return { user, data, loading, refreshing, refresh };
}
