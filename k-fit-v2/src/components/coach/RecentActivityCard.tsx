import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Theme } from "./theme";

export type CoachActivity = {
  id: string;
  kind: "workout" | "session" | "client";
  title: string;
  detail: string;
  date: string | null;
};

function ActivityIcon({ kind }: { kind: CoachActivity["kind"] }) {
  if (kind === "workout") {
    return (
      <MaterialCommunityIcons
        name="dumbbell"
        size={16}
        color={Theme.accent}
      />
    );
  }
  if (kind === "session") {
    return <Ionicons name="calendar-outline" size={16} color={Theme.info} />;
  }
  return <Ionicons name="person-add-outline" size={16} color={Theme.warning} />;
}

type Props = {
  items: CoachActivity[];
  error?: string | null;
};

export function RecentActivityCard({ items, error }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Recent activity</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!error && items.length === 0 ? (
        <Text style={styles.emptyText}>No recent activity records found.</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.activityRow}>
            <View style={styles.iconBox}>
              <ActivityIcon kind={item.kind} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.activityTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.detail} numberOfLines={1}>
                {item.detail}
              </Text>
            </View>
            <Text style={styles.date}>
              {item.date
                ? new Date(item.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : "Date unavailable"}
            </Text>
          </View>
        ))
      )}
      <Text style={styles.note}>
        Only recorded client, workout, and session activity is shown. Challenge
        and chat records are not configured in the database.
      </Text>
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
  title: { color: Theme.text, fontSize: 15, fontWeight: "800", marginBottom: 8 },
  error: {
    color: Theme.textMuted,
    fontSize: 11,
    lineHeight: 16,
    paddingVertical: 8,
  },
  emptyText: {
    color: Theme.textMuted,
    fontSize: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  activityRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: Theme.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1 },
  activityTitle: { color: Theme.text, fontSize: 11, fontWeight: "700" },
  detail: { color: Theme.textMuted, fontSize: 10, marginTop: 3 },
  date: { color: Theme.textMuted, fontSize: 9 },
  note: {
    color: Theme.textMuted,
    fontSize: 9,
    lineHeight: 14,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    paddingTop: 10,
    marginTop: 2,
  },
});
