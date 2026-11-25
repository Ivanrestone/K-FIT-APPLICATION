import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useSoundEffects } from "@/components/shared/SoundEffectsProvider";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Theme = {
  background: "#080808",
  surface: "#121212",
  surfaceHigh: "#1A1A1A",
  surfaceElevated: "#262626",
  text: "#FFFFFF",
  textSecondary: "#E0E0E0",
  textMuted: "#9CA3AF",
  accent: "#FFD700",
  accentSoft: "rgba(255, 215, 0, 0.12)",
  accentBorder: "rgba(255, 215, 0, 0.28)",
  onAccent: "#000000",
  border: "#222222",
  success: "#10B981",
  successSoft: "rgba(16, 185, 129, 0.15)",
  successBorder: "rgba(16, 185, 129, 0.3)",
  danger: "#EF4444",
  dangerSoft: "rgba(239, 68, 68, 0.12)",
  dangerBorder: "rgba(239, 68, 68, 0.35)",
};

interface Appointment {
  id: string;
  coach_id: string;
  member_id: string;
  appointment_date: string;
  end_time: string;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled";
  coachName?: string;
}

export default function MemberAppointmentsScreen() {
  const playSound = useSoundEffects();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "history">("all");
  const [now, setNow] = useState(0);

  const checkAuth = async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    const role = currentUser?.user_metadata?.role || "member";
    if (role !== "member" && role !== "coach") {
      if (role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/login");
      }
    } else {
      const { getMembershipAccess } = await import("@/lib/membership");
      const access = await getMembershipAccess(currentUser.id);
      if (access === "none") {
        setLoading(false);
        router.replace("/member/membership");
        return;
      }
      setNow(new Date().getTime());
      await fetchAppointments(currentUser.id);
    }
  };

  const fetchAppointments = async (memberId: string) => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("appointments")
        .select(
          "id, coach_id, member_id, appointment_date, end_time, notes, status",
        )
        .eq("member_id", memberId)
        .order("appointment_date", { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error);
        return;
      }

      const rows = (data || []) as Appointment[];
      const coachIds = [
        ...new Set(rows.map((a) => a.coach_id).filter(Boolean)),
      ];

      const { data: coachData } = coachIds.length
        ? await supabase
            .from("users")
            .select("id, first_name, last_name")
            .in("id", coachIds)
        : { data: [] as any[] };

      const coaches = (coachData || []) as {
        id: string;
        first_name: string | null;
        last_name: string | null;
      }[];

      setAppointments(
        rows.map((a) => {
          const c = coaches.find((coach) => coach.id === a.coach_id);
          return {
            ...a,
            coachName: c
              ? `${c.first_name || ""} ${c.last_name || ""}`.trim()
              : undefined,
          };
        }),
      );
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (appointment: Appointment) => {
    playSound("warning");
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Appointment",
          style: "destructive",
          onPress: async () => {
            setCancelling(appointment.id);
            try {
              const { getSupabaseClient } = await import("@/lib/supabase");
              const { error } = await (
                getSupabaseClient().from("appointments") as any
              )
                .update({ status: "cancelled" })
                .eq("id", appointment.id);

              if (error) {
                playSound("warning");
                Alert.alert(
                  "Error",
                  error.message || "Failed to cancel appointment",
                );
              } else {
                playSound("success");
                setAppointments((prev) =>
                  prev.map((a) =>
                    a.id === appointment.id
                      ? { ...a, status: "cancelled" as const }
                      : a,
                  ),
                );
              }
            } catch (error: any) {
              playSound("warning");
              Alert.alert(
                "Error",
                error.message || "Failed to cancel appointment",
              );
            } finally {
              setCancelling(null);
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons
          name="calendar-clock"
          size={36}
          color={Theme.accent}
        />
        <Text style={styles.loadingText}>Loading appointments…</Text>
      </View>
    );
  }

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const isUpcoming = (appointment: Appointment) =>
    appointment.status === "scheduled" &&
    new Date(appointment.appointment_date).getTime() > now;
  const upcoming = appointments
    .filter(isUpcoming)
    .sort(
      (a, b) =>
        new Date(a.appointment_date).getTime() -
        new Date(b.appointment_date).getTime(),
    );
  const history = appointments
    .filter((appointment) => !isUpcoming(appointment))
    .sort(
      (a, b) =>
        new Date(b.appointment_date).getTime() -
        new Date(a.appointment_date).getTime(),
    );

  const filteredList =
    filter === "all"
      ? appointments
      : filter === "upcoming"
        ? upcoming
        : history;

  const renderAppointmentCard = (appointment: Appointment) => {
    const appointmentIsUpcoming = isUpcoming(appointment);
    const isCancelling = cancelling === appointment.id;

    let badgeBg = Theme.accentSoft;
    let badgeTextColor = Theme.accent;
    let badgeBorder = Theme.accentBorder;
    let badgeLabel = "PAST";

    if (appointment.status === "cancelled") {
      badgeBg = Theme.dangerSoft;
      badgeTextColor = Theme.danger;
      badgeBorder = Theme.dangerBorder;
      badgeLabel = "CANCELLED";
    } else if (appointment.status === "completed") {
      badgeBg = Theme.successSoft;
      badgeTextColor = Theme.success;
      badgeBorder = Theme.successBorder;
      badgeLabel = "COMPLETED";
    } else if (appointmentIsUpcoming) {
      badgeBg = Theme.successSoft;
      badgeTextColor = Theme.success;
      badgeBorder = Theme.successBorder;
      badgeLabel = "UPCOMING";
    }

    return (
      <View key={appointment.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardType}>COACH SESSION</Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: badgeBg, borderColor: badgeBorder },
            ]}
          >
            <Text style={[styles.badgeText, { color: badgeTextColor }]}>
              {badgeLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>
          {appointment.notes?.trim() || "Personal training session"}
        </Text>
        <Text style={styles.cardSubtitle}>
          {appointment.coachName
            ? `With ${appointment.coachName}`
            : "Scheduled by your coach"}
        </Text>

        <View style={styles.cardActionRow}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color={Theme.accent} />
            <Text style={styles.timeText}>
              {new Date(appointment.appointment_date).toLocaleDateString(
                undefined,
                { weekday: "short", month: "short", day: "numeric" },
              )}{" "}
              • {fmtTime(appointment.appointment_date)} –{" "}
              {fmtTime(appointment.end_time)}
            </Text>
          </View>

          {appointmentIsUpcoming ? (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.actionBtnDanger,
                isCancelling && styles.disabledBtn,
              ]}
              onPress={() => handleCancel(appointment)}
              disabled={isCancelling}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Cancel session with ${appointment.coachName || "your coach"}`}
            >
              <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>
                {isCancelling ? "Cancelling…" : "Cancel booking"}
              </Text>
            </TouchableOpacity>
          ) : appointment.status === "cancelled" ? (
            <View
              style={[
                styles.iconOnlyBtn,
                {
                  backgroundColor: Theme.dangerSoft,
                  borderColor: Theme.dangerBorder,
                },
              ]}
            >
              <Ionicons name="close-circle" size={20} color={Theme.danger} />
            </View>
          ) : appointment.status === "completed" ? (
            <View
              style={[
                styles.iconOnlyBtn,
                {
                  backgroundColor: Theme.successSoft,
                  borderColor: Theme.successBorder,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={Theme.success}
              />
            </View>
          ) : (
            <View
              style={[
                styles.iconOnlyBtn,
                {
                  backgroundColor: Theme.surface,
                  borderColor: Theme.border,
                },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={Theme.textMuted}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Member view: coaches create sessions; members review and cancel. */}
        <View style={styles.pageTitleRow}>
          <View>
            <Text style={styles.pageLabel}>MY SCHEDULE</Text>
            <Text style={styles.pageTitle}>My sessions</Text>
          </View>
          <View style={styles.upcomingPill}>
            <Ionicons name="calendar-outline" size={15} color={Theme.accent} />
            <Text style={styles.upcomingPillText}>
              {upcoming.length} upcoming
            </Text>
          </View>
        </View>
        <Text style={styles.pageIntro}>
          Your coach schedules sessions. Review bookings here and cancel future
          ones if plans change.
        </Text>

        {/* Segmented Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              filter === "all" && styles.segmentBtnActive,
            ]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.segmentText,
                filter === "all" && styles.segmentTextActive,
              ]}
            >
              All ({appointments.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              filter === "upcoming" && styles.segmentBtnActive,
            ]}
            onPress={() => setFilter("upcoming")}
          >
            <Text
              style={[
                styles.segmentText,
                filter === "upcoming" && styles.segmentTextActive,
              ]}
            >
              Upcoming ({upcoming.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              filter === "history" && styles.segmentBtnActive,
            ]}
            onPress={() => setFilter("history")}
          >
            <Text
              style={[
                styles.segmentText,
                filter === "history" && styles.segmentTextActive,
              ]}
            >
              History ({history.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        {filteredList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={40}
                color={Theme.textMuted}
              />
            </View>
            <Text style={styles.emptyText}>
              {filter === "upcoming"
                ? "No upcoming sessions"
                : filter === "history"
                  ? "No past sessions"
                  : "No sessions scheduled yet"}
            </Text>
            <Text style={styles.emptyHint}>
              {filter === "all" && appointments.length === 0
                ? "Your coach will add sessions here once you are assigned."
                : "Sessions in this view will appear here."}
            </Text>
          </View>
        ) : (
          filteredList.map(renderAppointmentCard)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: "Poppins-Regular",
    color: Theme.textMuted,
    fontSize: 15,
    marginTop: 8,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 120,
  },

  /* Page Title Row */
  pageTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pageLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 10,
    color: Theme.accent,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 2,
  },
  pageTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 24,
    color: Theme.text,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  upcomingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.accentBorder,
  },
  upcomingPillText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    color: Theme.accent,
    fontWeight: "700",
  },
  pageIntro: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Theme.textMuted,
    lineHeight: 18,
    marginBottom: 18,
  },

  /* Segmented Control */
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: Theme.surface,
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: Theme.accent,
  },
  segmentText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Theme.textMuted,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: Theme.onAccent,
    fontWeight: "800",
  },

  /* Cards */
  card: {
    backgroundColor: Theme.surface,
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardType: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    color: Theme.accent,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 17,
    color: Theme.text,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Theme.textMuted,
    marginBottom: 16,
  },
  cardActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    color: Theme.text,
    fontWeight: "500",
  },

  /* Action Buttons */
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnDanger: {
    backgroundColor: Theme.dangerSoft,
    borderColor: Theme.dangerBorder,
  },
  actionBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
    fontWeight: "800",
  },
  actionBtnTextDanger: {
    color: Theme.danger,
  },
  disabledBtn: {
    opacity: 0.6,
  },

  /* Minimal Icon-Only Buttons for History */
  iconOnlyBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Empty */
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 80,
  },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 17,
    color: Theme.text,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyHint: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Theme.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
