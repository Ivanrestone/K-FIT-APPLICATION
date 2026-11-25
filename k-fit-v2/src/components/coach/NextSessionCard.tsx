// components/coach/dashboard/NextSessionCard.tsx
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatSessionTime, getInitials, minutesUntil } from "./format";
import { Theme } from "./theme";

type Props = {
  session: { date: string; memberName: string | null } | null;
  onStart: () => void;
  onOpenSchedule: () => void;
};

export function NextSessionCard({ session, onStart, onOpenSchedule }: Props) {
  if (!session) {
    return (
      <View style={[styles.card, styles.emptyRow]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>NEXT UP</Text>
          <Text style={styles.emptyText}>No upcoming sessions scheduled.</Text>
        </View>
        <Pressable style={styles.secondaryBtn} onPress={onOpenSchedule}>
          <Text style={styles.secondaryText}>Open schedule</Text>
        </Pressable>
      </View>
    );
  }

  const mins = minutesUntil(session.date);
  const soon = mins >= 0 && mins <= 120;
  const name = session.memberName || "Member";

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          <View style={styles.liveDot} />
          <Text style={styles.label}>NEXT UP</Text>
        </View>
        {soon && (
          <View style={styles.soonBadge}>
            <Text style={styles.soonText}>
              {mins <= 1 ? "Starting now" : `In ${mins} min`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contentRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.time}>{formatSessionTime(session.date)}</Text>
        </View>
        <Pressable
          onPress={onStart}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.startBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="play" size={14} color="#000" />
          <Text style={styles.startText}>Open</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.accentSoft,
    borderWidth: 1,
    borderColor: Theme.accentBorder,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.accent,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: Theme.accent,
    letterSpacing: 1,
  },
  soonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255, 214, 0, 0.15)",
  },
  soonText: { fontSize: 10, fontWeight: "800", color: Theme.accent },
  contentRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Theme.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "900", color: "#000" },
  name: { fontSize: 16, fontWeight: "800", color: Theme.text },
  time: { fontSize: 12, color: Theme.textMuted, marginTop: 3 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Theme.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  startText: { fontSize: 13, fontWeight: "800", color: "#000" },
  emptyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  emptyText: { fontSize: 13, color: Theme.textMuted, marginTop: 4 },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Theme.surfaceAlt,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  secondaryText: { fontSize: 12, fontWeight: "700", color: Theme.text },
});
