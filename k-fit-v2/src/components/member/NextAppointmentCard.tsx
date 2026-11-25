import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme } from "./theme";

type Props = {
  appointmentDate: string | null;
};

export function NextAppointmentCard({ appointmentDate }: Props) {
  const formattedAppointmentDate = appointmentDate
    ? new Date(appointmentDate).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const hasAppointment = formattedAppointmentDate !== null;

  return (
    <TouchableOpacity
      style={[styles.sessionCard, !hasAppointment && styles.emptyCard]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={
        formattedAppointmentDate
          ? `Upcoming session on ${formattedAppointmentDate}. Open schedule.`
          : "No upcoming sessions. Open schedule."
      }
      onPress={() => router.push("/member/appointments")}
    >
      <View style={styles.sessionLeft}>
        <View style={[styles.sessionIcon, !hasAppointment && styles.emptyIcon]}>
          <Ionicons
            name={hasAppointment ? "calendar" : "calendar-outline"}
            size={20}
            color={hasAppointment ? Theme.info : Theme.accent}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.sessionTitle,
              !hasAppointment && styles.emptyTitle,
            ]}
          >
            {hasAppointment ? "Upcoming Session" : "No upcoming session"}
          </Text>
          <Text style={styles.sessionTime}>
            {formattedAppointmentDate
              ? formattedAppointmentDate
              : "Tap to view your schedule"}
          </Text>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={hasAppointment ? Theme.info : Theme.textMuted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  emptyCard: {
    backgroundColor: Theme.surface,
    borderColor: Theme.border,
  },
  sessionLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: { backgroundColor: Theme.accentSoft },
  sessionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Theme.info,
    marginBottom: 2,
  },
  emptyTitle: { color: Theme.text },
  sessionTime: { fontSize: 12, color: Theme.text, fontWeight: "500" },
});
