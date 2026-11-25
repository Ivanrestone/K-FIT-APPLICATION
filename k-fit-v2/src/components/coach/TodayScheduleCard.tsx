import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "./theme";

export type TodaySession = {
  id: string;
  date: string;
  endDate: string;
  memberName: string;
  notes: string | null;
};

type Props = {
  sessions: TodaySession[];
  onViewAll: () => void;
};

export function TodayScheduleCard({ sessions, onViewAll }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>TODAY</Text>
          <Text style={styles.title}>Training schedule</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all appointments"
          onPress={onViewAll}
          style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
        >
          <Text style={styles.viewAllText}>View all</Text>
          <Ionicons name="chevron-forward" size={14} color={Theme.accent} />
        </Pressable>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="calendar-clear-outline"
            size={18}
            color={Theme.textMuted}
          />
          <Text style={styles.emptyText}>No training sessions scheduled today.</Text>
        </View>
      ) : (
        sessions.slice(0, 5).map((session) => (
          <View key={session.id} style={styles.sessionRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.time}>
                {new Date(session.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text style={styles.endTime}>
                {new Date(session.endDate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={styles.sessionDivider} />
            <View style={styles.sessionInfo}>
              <Text style={styles.memberName} numberOfLines={1}>
                {session.memberName}
              </Text>
              <Text style={styles.sessionLabel} numberOfLines={1}>
                {session.notes || "Training session"}
              </Text>
            </View>
            <View style={styles.statusDot} />
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 15,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  eyebrow: {
    color: Theme.accent,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: { color: Theme.text, fontSize: 15, fontWeight: "800", marginTop: 3 },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 2, padding: 6 },
  viewAllText: { color: Theme.accent, fontSize: 11, fontWeight: "700" },
  pressed: { opacity: 0.65 },
  empty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 54,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    marginTop: 6,
  },
  emptyText: { color: Theme.textMuted, fontSize: 12 },
  sessionRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  timeColumn: { width: 62 },
  time: { color: Theme.text, fontSize: 12, fontWeight: "800" },
  endTime: { color: Theme.textMuted, fontSize: 10, marginTop: 3 },
  sessionDivider: {
    width: 2,
    height: 30,
    backgroundColor: Theme.accent,
    borderRadius: 2,
  },
  sessionInfo: { flex: 1 },
  memberName: { color: Theme.text, fontSize: 12, fontWeight: "700" },
  sessionLabel: { color: Theme.textMuted, fontSize: 10, marginTop: 3 },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Theme.accent,
  },
});
