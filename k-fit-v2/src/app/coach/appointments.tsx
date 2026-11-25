import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { isUuid } from "@/lib/uuid";

const Theme = {
  background: "#080808",
  surface: "#121212",
  surfaceHigh: "#1A1A1A",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD700",
  accentText: "#000000",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  border: "#222222",
};

interface Appointment {
  id: string;
  coach_id: string;
  member_id: string;
  appointment_date: string;
  end_time: string;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  member?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

type AppointmentAction = "complete" | "cancel";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: "rgba(255, 215, 0, 0.15)", text: Theme.accent },
  completed: { bg: "rgba(16, 185, 129, 0.15)", text: Theme.success },
  cancelled: { bg: "rgba(239, 68, 68, 0.15)", text: Theme.error },
};

// --- Animated Card ---
function localDateValue(value: string) {
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function localTimeValue(value: string) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

const AppointmentCard = ({
  appointment,
  onComplete,
  onCancel,
  processing,
  now,
}: {
  appointment: Appointment;
  onComplete: () => void;
  onCancel: () => void;
  processing: boolean;
  now: number;
}) => {
  const [enterAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [enterAnim]);

  const status = STATUS_COLORS[appointment.status] || {
    bg: Theme.surfaceHigh,
    text: Theme.textMuted,
  };
  const initials = (appointment.member?.first_name || "?")
    .charAt(0)
    .toUpperCase();
  const fullName = [
    appointment.member?.first_name,
    appointment.member?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const date = new Date(appointment.appointment_date);
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTimeStr = new Date(appointment.end_time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const startsAt = new Date(appointment.appointment_date).getTime();
  const canReschedule =
    appointment.status === "scheduled" && startsAt > now;
  const canComplete =
    appointment.status === "scheduled" && startsAt <= now;

  return (
    <Animated.View
      style={{
        opacity: enterAnim,
        transform: [
          {
            translateY: enterAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{fullName || "Unknown Member"}</Text>
            <Text style={styles.cardEmail} numberOfLines={1}>
              {appointment.member?.email}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.text }]}>
              {appointment.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Date & Time */}
        <View style={styles.datetimeRow}>
          <View style={styles.datetimeIcon}>
            <Ionicons name="calendar" size={16} color={Theme.accent} />
          </View>
          <View style={styles.datetimeText}>
            <Text style={styles.dateText}>{dateStr}</Text>
            <Text style={styles.timeText}>
              {timeStr} — {endTimeStr}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {appointment.notes && (
          <View style={styles.notesContainer}>
            <MaterialCommunityIcons
              name="text-box-outline"
              size={14}
              color={Theme.textMuted}
            />
            <Text style={styles.notesText}>{appointment.notes}</Text>
          </View>
        )}

        {(canReschedule || canComplete) && (
          <View style={styles.actions}>
            {canReschedule && (
              <>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[
                    styles.secondaryAction,
                    processing && styles.disabledAction,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/coach/schedule-appointment",
                      params: {
                        member_id: appointment.member_id,
                        member_name: fullName || "Member",
                        appointment_id: appointment.id,
                        appointment_date: localDateValue(
                          appointment.appointment_date,
                        ),
                        start_time: localTimeValue(
                          appointment.appointment_date,
                        ),
                        end_time: localTimeValue(appointment.end_time),
                        notes: appointment.notes ?? "",
                      },
                    })
                  }
                  disabled={processing}
                >
                  <Text style={styles.secondaryActionText}>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[
                    styles.cancelAction,
                    processing && styles.disabledAction,
                  ]}
                  onPress={onCancel}
                  disabled={processing}
                >
                  <Text style={styles.cancelActionText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
            {canComplete && (
              <TouchableOpacity
                accessibilityRole="button"
                style={[
                  styles.completeAction,
                  processing && styles.disabledAction,
                ]}
                onPress={onComplete}
                disabled={processing}
              >
                <Text style={styles.completeActionText}>Mark completed</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export default function CoachAppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [fadeAnim] = useState(() => new Animated.Value(0));

  const fetchAppointments = useCallback(async (coachId: string) => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data: appointmentsData, error: appointmentsError } =
        await supabase
          .from("appointments")
          .select("*")
          .eq("coach_id", coachId)
          .order("appointment_date", { ascending: true });

      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
        throw appointmentsError;
      } else {
        const validAppointments = (appointmentsData || []).filter(
          (appointment: any) => isUuid(appointment.member_id),
        );
        if (validAppointments.length !== (appointmentsData || []).length) {
          console.warn("Skipping appointments with invalid member IDs.");
        }
        const appointmentsWithMembers = await Promise.all(
          validAppointments.map(async (appointment: any) => {
            const { data: memberData, error: memberError } = await supabase
              .from("users")
              .select("email, first_name, last_name")
              .eq("id", appointment.member_id)
              .maybeSingle();
            if (memberError) throw memberError;
            return { ...appointment, member: memberData };
          }),
        );
        setAppointments(appointmentsWithMembers);
      }
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      Alert.alert("Error", "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
      return;
    }

    const role = currentUser.user_metadata?.role || "member";
    if (role !== "coach") {
      if (role === "admin") router.replace("/admin/dashboard");
      else if (role === "member") router.replace("/member/dashboard");
      else router.replace("/login");
      return;
    }

    setCoachId(currentUser.id);
    setNow(new Date().getTime());
    await fetchAppointments(currentUser.id);
  }, [fetchAppointments]);

  const manageAppointment = async (
    appointment: Appointment,
    action: AppointmentAction,
  ) => {
    if (!coachId) return;
    setProcessingId(appointment.id);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient() as any;
      const { error } = await supabase.rpc("manage_coach_appointment", {
        p_appointment_id: appointment.id,
        p_action: action,
      });
      if (error) throw error;
      await fetchAppointments(coachId);
    } catch (error: any) {
      console.error(`Unable to ${action} appointment:`, error);
      Alert.alert(
        "Unable to update appointment",
        error?.message ||
          "Apply migration 20261125000000_coach_portal.sql and try again.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const cancelAppointment = (appointment: Appointment) => {
    Alert.alert(
      "Cancel session",
      "This will cancel the scheduled training session.",
      [
        { text: "Keep session", style: "cancel" },
        {
          text: "Cancel session",
          style: "destructive",
          onPress: () => void manageAppointment(appointment, "cancel"),
        },
      ],
    );
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      void checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
  }, [checkAuth]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading Appointments...</Text>
      </View>
    );
  }

  const upcoming = appointments
    .filter(
      (appointment) =>
        appointment.status === "scheduled" &&
        new Date(appointment.appointment_date).getTime() > now,
    )
    .sort(
      (a, b) =>
        new Date(a.appointment_date).getTime() -
        new Date(b.appointment_date).getTime(),
    );
  const past = appointments
    .filter(
      (appointment) =>
        appointment.status !== "scheduled" ||
        new Date(appointment.appointment_date).getTime() <= now,
    )
    .sort(
      (a, b) =>
        new Date(b.appointment_date).getTime() -
        new Date(a.appointment_date).getTime(),
    );

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.title}>Appointments</Text>
            <TouchableOpacity
              style={styles.newSessionButton}
              onPress={() => router.push("/coach/clients")}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Choose a client and schedule a session"
            >
              <Ionicons name="add" size={17} color={Theme.accentText} />
              <Text style={styles.newSessionButtonText}>New session</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerStats}>
            <View style={styles.statPill}>
              <View style={[styles.dot, { backgroundColor: Theme.accent }]} />
              <Text style={styles.statText}>{upcoming.length} Upcoming</Text>
            </View>
            <View style={styles.statPill}>
              <View
                style={[styles.dot, { backgroundColor: Theme.textMuted }]}
              />
              <Text style={styles.statText}>{past.length} Past</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {appointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons
                  name="calendar-blank-outline"
                  size={48}
                  color="#333"
                />
              </View>
              <Text style={styles.emptyText}>No appointments scheduled</Text>
            </View>
          ) : (
            <>
              {upcoming.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>Upcoming</Text>
                    <View style={styles.sectionLine} />
                  </View>
                  {upcoming.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onComplete={() =>
                        void manageAppointment(appointment, "complete")
                      }
                      onCancel={() => cancelAppointment(appointment)}
                      processing={processingId === appointment.id}
                      now={now}
                    />
                  ))}
                </>
              )}
              {past.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>Past</Text>
                    <View style={styles.sectionLine} />
                  </View>
                  {past.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onComplete={() =>
                        void manageAppointment(appointment, "complete")
                      }
                      onCancel={() => cancelAppointment(appointment)}
                      processing={processingId === appointment.id}
                      now={now}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  loadingText: {
    fontSize: 14,
    color: Theme.accent,
    fontWeight: "600",
    marginTop: 12,
  },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.5,
  },
  newSessionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Theme.accent,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
  },
  newSessionButtonText: {
    color: Theme.accentText,
    fontSize: 11,
    fontWeight: "800",
  },
  headerStats: { flexDirection: "row", gap: 8, marginTop: 10 },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statText: { color: Theme.textMuted, fontSize: 11, fontWeight: "600" },

  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Theme.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  // Empty State
  emptyContainer: { alignItems: "center", paddingVertical: 60, gap: 16 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.border,
  },
  emptyText: { fontSize: 14, color: Theme.textMuted, fontWeight: "500" },

  // Card
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "900", color: Theme.accent },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Theme.text },
  cardEmail: { fontSize: 13, color: Theme.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 16,
  },

  datetimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  datetimeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  datetimeText: { flex: 1 },
  dateText: { fontSize: 14, fontWeight: "700", color: Theme.text },
  timeText: {
    fontSize: 13,
    color: Theme.accent,
    marginTop: 2,
    fontWeight: "600",
  },

  notesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: Theme.textMuted,
    lineHeight: 18,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  secondaryAction: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surfaceHigh,
  },
  secondaryActionText: { color: Theme.text, fontSize: 12, fontWeight: "700" },
  cancelAction: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.24)",
  },
  cancelActionText: { color: Theme.error, fontSize: 12, fontWeight: "700" },
  completeAction: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: Theme.accent,
  },
  completeActionText: {
    color: Theme.accentText,
    fontSize: 12,
    fontWeight: "800",
  },
  disabledAction: { opacity: 0.55 },
});
