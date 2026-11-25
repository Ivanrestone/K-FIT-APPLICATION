import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BOTTOM_NAV_CLEARANCE } from "@/components/navigation/FloatingTabBar";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";

const Theme = {
  background: "#080808",
  surface: "#141418",
  surfaceHigh: "#1C1C22",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD600",
  accentText: "#000000",
  border: "#27272F",
};

type Member = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
};

type AttendanceRecord = { id: string; check_in: string };
type WorkoutRecord = {
  id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number | string;
  total_volume: number | string;
  logged_at: string;
};
type AppointmentRecord = {
  id: string;
  appointment_date: string;
  end_time: string;
  status: string;
  notes: string | null;
};
type PlanRecord = {
  id: string;
  name: string;
  category: string;
  status: string;
  scheduled_for: string | null;
};
type CompletionRecord = { id: string; completed_at: string };

function initials(member: Member) {
  return [member.first_name, member.last_name]
    .filter(Boolean)
    .map((part) => part?.trim().charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function nameOf(member: Member) {
  return (
    [member.first_name, member.last_name].filter(Boolean).join(" ") ||
    member.email ||
    "Member"
  );
}

function localDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CoachClientDetailsScreen() {
  const params = useLocalSearchParams<{ member_id?: string | string[] }>();
  const memberId = typeof params.member_id === "string" ? params.member_id : "";
  const [coachId, setCoachId] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const fullName = member ? nameOf(member) : "Client profile";
  const totalWorkoutVolume = useMemo(
    () =>
      workouts.reduce((total, workout) => {
        const volume = Number(workout.total_volume);
        return total + (Number.isFinite(volume) ? volume : 0);
      }, 0),
    [workouts],
  );

  const loadClient = useCallback(async (currentCoachId: string) => {
    if (!memberId) {
      setAccessDenied(true);
      return;
    }

    const supabase = getSupabaseClient() as any;
    const { data: assignment, error: assignmentError } = await supabase
      .from("coach_clients")
      .select("id")
      .eq("coach_id", currentCoachId)
      .eq("member_id", memberId)
      .eq("status", "active")
      .maybeSingle();

    if (assignmentError) throw assignmentError;
    if (!assignment) {
      setAccessDenied(true);
      setMember(null);
      return;
    }

    setAccessDenied(false);
    const { data: memberData, error: memberError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .eq("id", memberId)
      .single();
    if (memberError) throw memberError;
    setMember(memberData);

    const results = await Promise.all([
      supabase
        .from("attendance")
        .select("id, check_in")
        .eq("member_id", memberId)
        .order("check_in", { ascending: false })
        .limit(10),
      supabase
        .from("workout_logs")
        .select(
          "id, exercise_name, sets, reps, weight_kg, total_volume, logged_at",
        )
        .eq("member_id", memberId)
        .order("logged_at", { ascending: false })
        .limit(10),
      supabase
        .from("appointments")
        .select("id, appointment_date, end_time, status, notes")
        .eq("coach_id", currentCoachId)
        .eq("member_id", memberId)
        .order("appointment_date", { ascending: false })
        .limit(10),
      supabase
        .from("coach_training_plans")
        .select("id, name, category, status, scheduled_for")
        .eq("coach_id", currentCoachId)
        .eq("member_id", memberId)
        .eq("status", "active")
        .order("updated_at", { ascending: false }),
      supabase
        .from("coach_training_completions")
        .select("id, completed_at")
        .eq("coach_id", currentCoachId)
        .eq("member_id", memberId)
        .order("completed_at", { ascending: false })
        .limit(10),
    ]);

    const nextWarnings: string[] = [];
    if (results[0].error) {
      console.error("Unable to load client attendance:", results[0].error);
      nextWarnings.push("Attendance history is unavailable.");
    }
    if (results[1].error) {
      console.error("Unable to load client workouts:", results[1].error);
      nextWarnings.push(
        results[1].error.code === "PGRST205"
          ? "Workout history needs the workout logs database migration."
          : "Workout history is unavailable.",
      );
    }
    if (results[2].error) {
      console.error("Unable to load client sessions:", results[2].error);
      nextWarnings.push("Training session history is unavailable.");
    }
    if (results[3].error || results[4].error) {
      const error = results[3].error ?? results[4].error;
      console.error("Unable to load client training plans:", error);
      nextWarnings.push(
        error?.code === "PGRST205"
          ? "Assigned plans need migration 20261125000000_coach_portal.sql."
          : "Assigned training plans are unavailable.",
      );
    }

    setAttendance(results[0].data ?? []);
    setWorkouts(results[1].data ?? []);
    setAppointments(results[2].data ?? []);
    setPlans(results[3].data ?? []);
    setCompletions(results[4].data ?? []);
    setWarnings(nextWarnings);
  }, [memberId]);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.replace("/login");
          return;
        }
        if (currentUser.user_metadata?.role !== "coach") {
          router.replace(
            currentUser.user_metadata?.role === "admin"
              ? "/admin/dashboard"
              : "/member/dashboard",
          );
          return;
        }
        if (!active) return;
        setCoachId(currentUser.id);
        await loadClient(currentUser.id);
      } catch (error) {
        console.error("Error loading assigned client profile:", error);
        if (active) {
          Alert.alert(
            "Unable to load client profile",
            error instanceof Error ? error.message : "Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void initialize();
    return () => {
      active = false;
    };
  }, [loadClient]);

  const refresh = async () => {
    if (!coachId) return;
    setRefreshing(true);
    try {
      await loadClient(coachId);
    } catch (error) {
      console.error("Error refreshing assigned client profile:", error);
      Alert.alert(
        "Unable to refresh profile",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading client profile...</Text>
      </View>
    );
  }

  if (accessDenied || !member) {
    return (
      <View style={[styles.centered, styles.denied]}>
        <MaterialCommunityIcons
          name="account-lock-outline"
          size={44}
          color={Theme.accent}
        />
        <Text style={styles.deniedTitle}>Client access unavailable</Text>
        <Text style={styles.deniedText}>
          This profile is available only to the client&apos;s currently assigned
          coach.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/coach/clients")}
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>Back to clients</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={Theme.accent}
            colors={[Theme.accent]}
            progressBackgroundColor={Theme.surface}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingRow}>
          <TouchableOpacity
            style={styles.backIcon}
            accessibilityRole="button"
            accessibilityLabel="Back to clients"
            onPress={() => router.replace("/coach/clients")}
          >
            <Ionicons name="arrow-back" size={19} color={Theme.text} />
          </TouchableOpacity>
          <View style={styles.headingCopy}>
            <Text style={styles.eyebrow}>ASSIGNED CLIENT</Text>
            <Text style={styles.title}>Progress profile</Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(member) || "M"}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.memberName}>{fullName}</Text>
            {!!member.email && (
              <Text style={styles.email}>{member.email}</Text>
            )}
            <View style={styles.assignedBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.assignedText}>ACTIVE ASSIGNMENT</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() =>
              router.push({
                pathname: "/coach/schedule-appointment",
                params: { member_id: member.id, member_name: fullName },
              })
            }
            accessibilityRole="button"
          >
            <Ionicons
              name="calendar-outline"
              size={17}
              color={Theme.accentText}
            />
            <Text style={styles.primaryActionText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() =>
              router.push({
                pathname: "/coach/workouts",
                params: { member_id: member.id, member_name: fullName },
              })
            }
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="dumbbell"
              size={17}
              color={Theme.accent}
            />
            <Text style={styles.secondaryActionText}>Training plan</Text>
          </TouchableOpacity>
        </View>

        {warnings.map((warning) => (
          <View key={warning} style={styles.warningBanner}>
            <Ionicons
              name="information-circle-outline"
              size={17}
              color={Theme.accent}
            />
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        ))}

        <View style={styles.metricsRow}>
          <MetricCard label="Check-ins" value={attendance.length} />
          <MetricCard label="Workout logs" value={workouts.length} />
          <MetricCard label="Plan completions" value={completions.length} />
        </View>
        {totalWorkoutVolume > 0 && (
          <Text style={styles.volumeText}>
            Logged training volume (shown records):{" "}
            {Math.round(totalWorkoutVolume).toLocaleString()}
          </Text>
        )}

        <Section title="Active training plans">
          {plans.length === 0 ? (
            <EmptyText>
              No active training plans are assigned to this client.
            </EmptyText>
          ) : (
            plans.map((plan) => (
              <View key={plan.id} style={styles.listRow}>
                <View style={styles.rowIcon}>
                  <MaterialCommunityIcons
                    name="dumbbell"
                    size={17}
                    color={Theme.accent}
                  />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{plan.name}</Text>
                  <Text style={styles.rowSubtitle}>{plan.category}</Text>
                </View>
                <Text style={styles.statusLabel}>{plan.status}</Text>
              </View>
            ))
          )}
        </Section>

        <Section title="Recent workout logs">
          {workouts.length === 0 ? (
            <EmptyText>No recorded workout logs are available.</EmptyText>
          ) : (
            workouts.map((workout) => (
              <View key={workout.id} style={styles.historyRow}>
                <View style={styles.rowIcon}>
                  <MaterialCommunityIcons
                    name="weight-lifter"
                    size={17}
                    color={Theme.accent}
                  />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{workout.exercise_name}</Text>
                  <Text style={styles.rowSubtitle}>
                    {workout.sets} sets × {workout.reps} reps
                    {Number(workout.weight_kg) > 0
                      ? ` · ${workout.weight_kg} kg`
                      : ""}
                  </Text>
                </View>
                <Text style={styles.historyDate}>
                  {new Date(workout.logged_at).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </Section>

        <Section title="Training session history">
          {appointments.length === 0 ? (
            <EmptyText>No session records are available.</EmptyText>
          ) : (
            appointments.map((appointment) => (
              <View key={appointment.id} style={styles.historyRow}>
                <View style={styles.rowIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={17}
                    color={Theme.accent}
                  />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>
                    {appointment.status.charAt(0).toUpperCase() +
                      appointment.status.slice(1)}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {localDate(appointment.appointment_date)}
                  </Text>
                  {!!appointment.notes && (
                    <Text style={styles.notes} numberOfLines={2}>
                      {appointment.notes}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </Section>

        <View style={styles.limitedDataNote}>
          <Ionicons
            name="shield-checkmark-outline"
            size={17}
            color={Theme.textMuted}
          />
          <Text style={styles.limitedDataText}>
            Membership status, fitness goals, and body measurements are not
            exposed in the current coach data model. No health data is inferred.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function EmptyText({ children }: { children: string }) {
  return <Text style={styles.emptyText}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.background,
  },
  denied: { padding: 28 },
  content: {
    padding: 18,
    paddingTop: 22,
    paddingBottom: BOTTOM_NAV_CLEARANCE + 24,
  },
  loadingText: { marginTop: 12, color: Theme.accent, fontWeight: "600" },
  deniedTitle: {
    marginTop: 15,
    color: Theme.text,
    fontSize: 20,
    fontWeight: "900",
  },
  deniedText: {
    color: Theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 7,
  },
  backButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: Theme.accent,
    borderRadius: 12,
  },
  backButtonText: { color: Theme.accentText, fontSize: 13, fontWeight: "800" },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  headingCopy: { flex: 1 },
  eyebrow: {
    color: Theme.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  title: { color: Theme.text, fontSize: 23, fontWeight: "900", marginTop: 3 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 18,
    padding: 15,
    marginTop: 17,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: Theme.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Theme.accentText, fontSize: 19, fontWeight: "900" },
  profileInfo: { flex: 1 },
  memberName: { color: Theme.text, fontSize: 17, fontWeight: "800" },
  email: { color: Theme.textMuted, fontSize: 12, marginTop: 3 },
  assignedBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ADE80" },
  assignedText: { color: "#4ADE80", fontSize: 9, fontWeight: "900" },
  actionRow: { flexDirection: "row", gap: 9, marginTop: 12 },
  primaryAction: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: Theme.accent,
    borderRadius: 13,
  },
  primaryActionText: { color: Theme.accentText, fontSize: 12, fontWeight: "900" },
  secondaryAction: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 13,
  },
  secondaryActionText: { color: Theme.text, fontSize: 12, fontWeight: "800" },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,214,0,0.22)",
    backgroundColor: "rgba(255,214,0,0.07)",
    marginTop: 10,
  },
  warningText: { flex: 1, color: Theme.textMuted, fontSize: 11, lineHeight: 16 },
  metricsRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  metricCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 72,
    borderRadius: 14,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    paddingHorizontal: 4,
  },
  metricValue: { color: Theme.accent, fontSize: 20, fontWeight: "900" },
  metricLabel: { color: Theme.textMuted, fontSize: 9, textAlign: "center", marginTop: 3 },
  volumeText: { color: Theme.textMuted, fontSize: 11, marginTop: 8 },
  section: { marginTop: 20 },
  sectionTitle: {
    color: Theme.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 9,
  },
  sectionCard: {
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  listRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  rowIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.surfaceHigh,
    borderRadius: 11,
  },
  rowCopy: { flex: 1 },
  rowTitle: { color: Theme.text, fontSize: 12, fontWeight: "700" },
  rowSubtitle: { color: Theme.textMuted, fontSize: 10, marginTop: 3 },
  statusLabel: {
    color: Theme.accent,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  historyDate: { color: Theme.textMuted, fontSize: 9 },
  notes: { color: Theme.textMuted, fontSize: 10, lineHeight: 15, marginTop: 6 },
  emptyText: { color: Theme.textMuted, fontSize: 12, lineHeight: 18, paddingVertical: 15 },
  limitedDataNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    marginTop: 18,
  },
  limitedDataText: { flex: 1, color: Theme.textMuted, fontSize: 10, lineHeight: 15 },
});
