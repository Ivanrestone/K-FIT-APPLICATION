import type { DashboardChartPoint } from "@/hooks/useCoachDashboard";
import { BarChart } from "react-native-gifted-charts";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Theme } from "./theme";

type Props = {
  data: DashboardChartPoint[];
  error: string | null;
};

export function MemberProgressChart({ data, error }: Props) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - 88, 220);
  const hasData = data.some((member) => member.value > 0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Member Progress</Text>
        <Text style={styles.subtitle}>
          Training volume by member · last 30 days · kg
        </Text>
      </View>

      <View style={styles.chartContainer}>
        {error ? (
          <View style={styles.emptyState}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : hasData ? (
          <BarChart
            data={data}
            width={chartWidth}
            height={176}
            barWidth={24}
            spacing={12}
            roundedTop
            frontColor={Theme.accent}
            noOfSections={4}
            yAxisLabelWidth={34}
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            xAxisColor="transparent"
            yAxisColor="transparent"
            rulesColor="rgba(255,255,255,0.06)"
            isAnimated
            animationDuration={450}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No workout logs yet</Text>
            <Text style={styles.emptySubtitle}>
              Progress appears after assigned members record workouts.
            </Text>
          </View>
        )}
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
  header: { marginBottom: 12 },
  title: { color: Theme.text, fontSize: 15, fontWeight: "800" },
  subtitle: { color: Theme.textMuted, fontSize: 10, marginTop: 4 },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 176,
  },
  axisText: { color: Theme.textMuted, fontSize: 9 },
  emptyState: { alignItems: "center", paddingHorizontal: 12, paddingVertical: 24 },
  emptyTitle: { color: Theme.text, fontSize: 12, fontWeight: "700" },
  emptySubtitle: {
    color: Theme.textMuted,
    fontSize: 10,
    marginTop: 5,
    textAlign: "center",
  },
  errorText: {
    color: Theme.error,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
});
