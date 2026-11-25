// components/coach/dashboard/WeeklyLoadChart.tsx
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Theme } from "./theme";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const CHART_HEIGHT = 72;

type Props = {
  /** Sessions per day, Monday → Sunday. */
  days: number[];
  total: number;
  lastWeekTotal: number;
};

export function WeeklyLoadChart({ days, total, lastWeekTotal }: Props) {
  const max = Math.max(...days, 1);
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
  const delta =
    lastWeekTotal > 0
      ? Math.round(((total - lastWeekTotal) / lastWeekTotal) * 100)
      : null;
  const up = (delta ?? 0) >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleRow}>
            <Ionicons name="trending-up" size={16} color={Theme.accent} />
            <Text style={styles.title}>Weekly Coaching Load</Text>
          </View>
          <Text style={styles.subtitle}>
            {total} {total === 1 ? "session" : "sessions"} this week
          </Text>
        </View>

        {delta !== null && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: up
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(239,68,68,0.15)",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: up ? Theme.success : Theme.error },
              ]}
            >
              {up ? "+" : ""}
              {delta}% vs last wk
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chart}>
        {days.map((count, i) => {
          const height = Math.max((count / max) * CHART_HEIGHT, 4);
          const isToday = i === todayIndex;
          return (
            <View key={i} style={styles.col}>
              <View style={styles.barArea}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: isToday
                        ? Theme.accent
                        : "rgba(255,214,0,0.35)",
                    },
                  ]}
                />
              </View>
              <Text style={[styles.day, isToday && { color: Theme.accent }]}>
                {DAY_LABELS[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 15, fontWeight: "800", color: Theme.text },
  subtitle: { fontSize: 11, color: Theme.textMuted, marginTop: 3 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  chart: { flexDirection: "row", gap: 8, marginTop: 16 },
  col: { flex: 1, alignItems: "center", gap: 6 },
  barArea: {
    height: CHART_HEIGHT,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: { width: "100%", maxWidth: 24, borderRadius: 6 },
  day: { fontSize: 10, fontWeight: "800", color: Theme.textMuted },
});
