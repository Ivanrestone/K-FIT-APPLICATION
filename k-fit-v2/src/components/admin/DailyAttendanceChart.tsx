import type { TrafficPoint } from "@/hooks/useAdminDashboard";
import { LineChart } from "react-native-gifted-charts";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { GlassCard } from "./GlassCard";
import { Theme } from "./theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

type Props = {
  data: TrafficPoint[];
  loading: boolean;
  error: string | null;
};

export function DailyAttendanceChart({ data, loading, error }: Props) {
  const currentWeekday = (new Date().getDay() + 6) % 7;
  const chartData = data.slice(0, currentWeekday + 1);
  const chartWidth = Math.max(SCREEN_WIDTH - 88, 210);
  const hasData = chartData.some((point) => point.value > 0);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Gym Attendance</Text>
        <Text style={styles.subtitle}>Daily check-ins this week so far</Text>
      </View>

      <View style={styles.chartContainer}>
        {loading ? (
          <Text style={styles.emptyTitle}>Loading attendance...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : hasData ? (
          <LineChart
            data={chartData}
            width={chartWidth}
            height={176}
            initialSpacing={8}
            spacing={(chartWidth - 36) / Math.max(chartData.length - 1, 1)}
            color={Theme.accent}
            thickness={3}
            dataPointsColor={Theme.accent}
            dataPointsRadius={4}
            areaChart
            startFillColor="rgba(255, 215, 0, 0.22)"
            endFillColor="rgba(255, 215, 0, 0)"
            startOpacity={0.8}
            endOpacity={0.1}
            curved
            xAxisColor="transparent"
            yAxisColor="transparent"
            rulesType="dashed"
            rulesColor="rgba(255,255,255,0.06)"
            yAxisLabelWidth={30}
            textColor={Theme.textMuted}
            textFontSize={9}
            yAxisTextStyle={{ color: Theme.textMuted, fontSize: 9 }}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No check-ins this week</Text>
            <Text style={styles.emptySubtitle}>
              Daily attendance trends will appear here as members visit.
            </Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16, padding: 18, paddingBottom: 12 },
  header: { marginBottom: 16 },
  title: { color: Theme.text, fontSize: 16, fontWeight: "800" },
  subtitle: { color: Theme.textMuted, fontSize: 10, marginTop: 4 },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 176,
  },
  emptyState: { alignItems: "center", paddingHorizontal: 16, paddingVertical: 24 },
  emptyTitle: { color: Theme.text, fontSize: 12, fontWeight: "700" },
  emptySubtitle: {
    color: Theme.textMuted,
    fontSize: 10,
    marginTop: 5,
    textAlign: "center",
  },
  errorText: {
    color: Theme.error,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
