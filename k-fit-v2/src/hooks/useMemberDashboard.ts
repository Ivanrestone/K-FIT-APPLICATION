import type { TickerItem } from "@/components/AnnouncementTicker";
import { getCurrentUser } from "@/lib/auth";
import { birthdayTickerItems, getTodaysBirthdays } from "@/lib/birthdays";
import { getSupabaseClient } from "@/lib/supabase";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

export type MemberDashboardChartPoint = { value: number; label: string };

function startOfWeek(date = new Date()) {
  const start = new Date(date);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return start;
}

export function useMemberDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<TickerItem[]>([]);
  const [stats, setStats] = useState({
    attendanceCount: 0,
    weeklyAttendance: [0, 0, 0, 0, 0, 0, 0],
    attendanceTrend: [] as MemberDashboardChartPoint[],
    upcomingAppointments: 0,
    workoutsCompleted: null as number | null,
    workoutProgress: [] as MemberDashboardChartPoint[],
    workoutLogError: null as string | null,
    activeTrainingPlans: null as number | null,
    assignedPlanCompletions: null as number | null,
    trainingPlanError: null as string | null,
    membershipActive: false,
    membershipStatus: "Inactive",
    membershipEndDate: null as string | null,
    nextAppointment: null as {
      appointment_date: string;
      notes: string | null;
      coach_id: string;
    } | null,
  });

  const fetchStats = useCallback(async (userId: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const supabase = getSupabaseClient();
      const weekStart = startOfWeek();
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const trendStart = new Date(today);
      trendStart.setDate(trendStart.getDate() - 6);
      const trendEnd = new Date(today);
      trendEnd.setDate(trendEnd.getDate() + 1);
      const progressStart = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      const todayDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-");
      const [
        attendanceRes,
        weeklyAttendanceRes,
        attendanceTrendRes,
        appointmentsRes,
        membershipRes,
        announcementRes,
        nextApptRes,
        workoutLogsRes,
        trainingPlansRes,
        trainingCompletionsRes,
      ] = await Promise.all([
        supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .eq("member_id", userId),
        supabase
          .from("attendance")
          .select("check_in")
          .eq("member_id", userId)
          .gte("check_in", weekStart.toISOString())
          .lt("check_in", weekEnd.toISOString()),
        supabase
          .from("attendance")
          .select("check_in")
          .eq("member_id", userId)
          .gte("check_in", trendStart.toISOString())
          .lt("check_in", trendEnd.toISOString()),
        supabase
          .from("appointments")
          .select("id")
          .eq("member_id", userId)
          .eq("status", "scheduled")
          .gte("appointment_date", new Date().toISOString()),
        supabase
          .from("memberships")
          .select("status, end_date")
          .eq("member_id", userId)
          .order("end_date", { ascending: false })
          .limit(1),
        supabase
          .from("announcements")
          .select("title, body, created_at")
          .in("audience", ["all", "members"])
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("appointments")
          .select("appointment_date, notes, coach_id")
          .eq("member_id", userId)
          .eq("status", "scheduled")
          .gte("appointment_date", new Date().toISOString())
          .order("appointment_date", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("workout_logs")
          .select("logged_at, total_volume")
          .eq("member_id", userId),
        supabase
          .from("coach_training_plans")
          .select("id", { count: "exact", head: true })
          .eq("member_id", userId)
          .eq("status", "active"),
        supabase
          .from("coach_training_completions")
          .select("id", { count: "exact", head: true })
          .eq("member_id", userId),
      ]);

      if (attendanceRes.error) throw attendanceRes.error;
      if (weeklyAttendanceRes.error) throw weeklyAttendanceRes.error;
      if (attendanceTrendRes.error) throw attendanceTrendRes.error;
      if (workoutLogsRes.error) {
        if (workoutLogsRes.error.code === "PGRST205") {
          console.warn(
            "Workout tracking requires the workout logs database migration.",
          );
        } else {
          console.error(
            "Error fetching member workout progress:",
            workoutLogsRes.error,
          );
        }
      }
      const otherResults = [
        appointmentsRes,
        membershipRes,
        announcementRes,
        nextApptRes,
      ];
      for (const result of otherResults) {
        if (result.error) throw result.error;
      }

      const weeklyAttendance = Array.from({ length: 7 }, () => 0);
      const weeklyCheckIns: { check_in: string }[] =
        weeklyAttendanceRes.data || [];
      for (const row of weeklyCheckIns) {
        const checkIn = new Date(row.check_in);
        weeklyAttendance[(checkIn.getDay() + 6) % 7] += 1;
      }

      const attendanceTrend = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(trendStart);
        date.setDate(date.getDate() + index);
        return {
          label: date.toLocaleDateString(undefined, { weekday: "short" }),
          value: 0,
        };
      });
      for (const row of (attendanceTrendRes.data || []) as {
        check_in: string;
      }[]) {
        const checkIn = new Date(row.check_in);
        const checkInDay = new Date(
          checkIn.getFullYear(),
          checkIn.getMonth(),
          checkIn.getDate(),
        );
        const index = Math.round(
          (checkInDay.getTime() - trendStart.getTime()) / 86_400_000,
        );
        if (index >= 0 && index < attendanceTrend.length) {
          attendanceTrend[index].value += 1;
        }
      }

      const monthPoints = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(
          progressStart.getFullYear(),
          progressStart.getMonth() + index,
          1,
        );
        return {
          label: date.toLocaleDateString(undefined, { month: "short" }),
          value: 0,
        };
      });
      const workoutDays = new Set<string>();
      const workoutLogs = (workoutLogsRes.error
        ? []
        : workoutLogsRes.data || []) as {
        logged_at: string;
        total_volume: number | string | null;
      }[];
      for (const row of workoutLogs) {
        const loggedAt = new Date(row.logged_at);
        if (!Number.isNaN(loggedAt.getTime())) {
          workoutDays.add(
            `${loggedAt.getFullYear()}-${loggedAt.getMonth()}-${loggedAt.getDate()}`,
          );
        }
        if (loggedAt < progressStart || loggedAt >= trendEnd) continue;

        const monthIndex =
          (loggedAt.getFullYear() - progressStart.getFullYear()) * 12 +
          loggedAt.getMonth() -
          progressStart.getMonth();
        const volume = Number(row.total_volume);
        if (
          monthIndex >= 0 &&
          monthIndex < monthPoints.length &&
          Number.isFinite(volume) &&
          volume > 0
        ) {
          monthPoints[monthIndex].value += volume;
        }
      }

      const membership = membershipRes.data?.[0] as
        | { status: string | null; end_date: string | null }
        | undefined;
      const membershipEndDate = membership?.end_date ?? null;
      const storedMembershipStatus = String(
        membership?.status || "inactive",
      ).toLowerCase();
      const membershipStatus =
        membershipEndDate && membershipEndDate < todayDate
          ? "Expired"
          : storedMembershipStatus === "active"
            ? "Active"
            : storedMembershipStatus === "pending"
              ? "Pending"
              : "Inactive";
      const membershipActive = membershipStatus === "Active";
      const workoutLogError = workoutLogsRes.error
        ? workoutLogsRes.error.code === "PGRST205"
          ? "Workout tracking is not set up yet. Apply the workout logs database migration."
          : "Unable to load workout progress. Pull to refresh."
        : null;
      const trainingPlanError = trainingPlansRes.error || trainingCompletionsRes.error
        ? [trainingPlansRes.error, trainingCompletionsRes.error].some(
              (error) => error?.code === "PGRST205",
            )
          ? "Assigned workout plans are not set up yet. Apply migration 20261125000000_coach_portal.sql."
          : "Unable to load assigned workout plans."
        : null;
      if (trainingPlanError) {
        console.error(
          "Unable to load member training plan summaries:",
          trainingPlansRes.error ?? trainingCompletionsRes.error,
        );
      }

      setStats({
        attendanceCount: attendanceRes.count || 0,
        weeklyAttendance,
        attendanceTrend,
        upcomingAppointments: appointmentsRes.data?.length || 0,
        workoutsCompleted: workoutLogError ? null : workoutDays.size,
        workoutProgress: monthPoints,
        workoutLogError,
        activeTrainingPlans: trainingPlanError
          ? null
          : trainingPlansRes.count || 0,
        assignedPlanCompletions: trainingPlanError
          ? null
          : trainingCompletionsRes.count || 0,
        trainingPlanError,
        membershipActive,
        membershipStatus,
        membershipEndDate,
        nextAppointment: nextApptRes.data || null,
      });

      const birthdays = await getTodaysBirthdays();
      setAnnouncements([
        ...birthdayTickerItems(birthdays),
        ...((announcementRes.data || []) as TickerItem[]),
      ]);
    } catch (error) {
      console.error("Error fetching stats:", error);
      Alert.alert(
        "Unable to load dashboard",
        error instanceof Error
          ? error.message
          : "Please try refreshing your dashboard.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
      return;
    }

    const role = currentUser?.user_metadata?.role || "member";
    if (role === "admin") {
      router.replace("/admin/dashboard");
      return;
    }
    if (role === "coach") {
      router.replace("/coach/dashboard");
      return;
    }
    if (role !== "member") {
      router.replace("/login");
      return;
    }

    setUser(currentUser);
    await fetchStats(currentUser.id);
  }, [fetchStats]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
  }, [checkAuth]);

  const refresh = () => {
    if (user) fetchStats(user.id, true);
  };

  const logWorkout = async (workout: any) => {
    if (!user) {
      Alert.alert("Error", "You must be signed in to log a workout.");
      return false;
    }
    try {
      const supabase = getSupabaseClient();
      const totalVolume = workout.sets * workout.reps * workout.weight;
      const { error } = await supabase.from("workout_logs").insert({
        member_id: user.id,
        exercise_name: workout.name,
        sets: workout.sets,
        reps: workout.reps,
        weight_kg: workout.weight,
        total_volume: totalVolume,
        logged_at: new Date().toISOString(),
      } as any);

      if (error) throw error;
      Alert.alert(
        "✅ Success",
        `Logged ${workout.name}: +${totalVolume.toLocaleString()} kg volume!`,
      );
      fetchStats(user.id); // refresh stats after logging
      return true;
    } catch (error) {
      console.error("Failed to log workout:", error);
      const isMissingWorkoutTable =
        error !== null &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "PGRST205";
      Alert.alert(
        "Error",
        isMissingWorkoutTable
          ? "Workout tracking is not set up yet. Apply the workout logs database migration."
          : "Failed to save workout. Please try again.",
      );
      return false;
    }
  };

  return {
    user,
    stats,
    loading,
    refreshing,
    refresh,
    announcements,
    logWorkout,
  };
}
