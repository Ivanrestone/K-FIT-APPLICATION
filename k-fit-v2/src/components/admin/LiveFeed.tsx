import type { AdminAttendanceEntry } from "@/hooks/useAdminDashboard";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GlassCard } from "./GlassCard";
import { Theme } from "./theme";

type Props = {
  items: AdminAttendanceEntry[];
  onViewAll: () => void;
};

function formatActivityTime(item: AdminAttendanceEntry) {
  const timestamp = item.checkOut || item.checkIn;
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LiveFeed({ items, onViewAll }: Props) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.title}>Recent check-ins</Text>
          <Text style={styles.subtitle}>Latest recorded gym activity</Text>
        </View>
        <Pressable
          onPress={onViewAll}
          accessibilityRole="button"
          accessibilityLabel="View all attendance records"
          style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
        >
          <Text style={styles.viewAllText}>View all</Text>
          <Ionicons name="chevron-forward" size={14} color={Theme.accent} />
        </Pressable>
      </View>

      {items.length > 0 ? (
        <View style={styles.list}>
          {items.map((item) => {
            const checkedIn = !item.checkOut;
            const name =
              item.memberName || item.memberEmail || "Unknown member";

            return (
              <View key={item.id} style={styles.item}>
                <View
                  style={[
                    styles.avatar,
                    checkedIn ? styles.avatarActive : styles.avatarComplete,
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      checkedIn
                        ? styles.avatarTextActive
                        : styles.avatarTextComplete,
                    ]}
                  >
                    {name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.status}>
                    {checkedIn ? "Currently in gym" : "Checked out"}
                  </Text>
                </View>
                <View style={styles.activityMeta}>
                  <Text
                    style={[
                      styles.activityType,
                      checkedIn ? styles.textIn : styles.textOut,
                    ]}
                  >
                    {checkedIn ? "IN" : "OUT"}
                  </Text>
                  <Text style={styles.time}>{formatActivityTime(item)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={24} color={Theme.textMuted} />
          <Text style={styles.emptyText}>No attendance records yet.</Text>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  heading: { flex: 1 },
  title: { color: Theme.text, fontSize: 16, fontWeight: "800" },
  subtitle: { color: Theme.textMuted, fontSize: 11, marginTop: 3 },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  viewAllText: { color: Theme.accent, fontSize: 11, fontWeight: "800" },
  pressed: { opacity: 0.7 },
  list: { gap: 8 },
  item: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Theme.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActive: { backgroundColor: "rgba(16, 185, 129, 0.14)" },
  avatarComplete: { backgroundColor: "rgba(255, 215, 0, 0.12)" },
  avatarText: { fontSize: 15, fontWeight: "900" },
  avatarTextActive: { color: Theme.success },
  avatarTextComplete: { color: Theme.accent },
  memberInfo: { flex: 1, minWidth: 0 },
  name: { color: Theme.text, fontSize: 12, fontWeight: "700" },
  status: { color: Theme.textMuted, fontSize: 10, marginTop: 3 },
  activityMeta: { alignItems: "flex-end", minWidth: 48 },
  activityType: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  textIn: { color: Theme.success },
  textOut: { color: Theme.accent },
  time: { color: Theme.textMuted, fontSize: 10, marginTop: 3 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    gap: 8,
  },
  emptyText: { color: Theme.textMuted, fontSize: 12 },
});
