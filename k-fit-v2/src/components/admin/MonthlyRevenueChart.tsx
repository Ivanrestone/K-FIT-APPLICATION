import type { TrafficPoint } from "@/hooks/useAdminDashboard";
import { BarChart } from "react-native-gifted-charts";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { GlassCard } from "./GlassCard";
import { Theme } from "./theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

type Props = {
  data: TrafficPoint[];
  loading: boolean;
  error: string | null;
};

export function MonthlyRevenueChart({ data, loading, error }: Props) {
  const chartWidth = Math.max(SCREEN_WIDTH - 88, 220);
  const hasRevenue = data.some((month) => month.value > 0);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Revenue</Text>
        <Text style={styles.subtitle}>Paid revenue · PHP · last 6 months</Text>
      </View>

      <View style={styles.chartContainer}>
        {loading ? (
          <Text style={styles.emptyTitle}>Loading revenue...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : hasRevenue ? (
          <BarChart
            data={data}
            width={chartWidth}
            height={184}
            barWidth={22}
            spacing={14}
            roundedTop
            frontColor={Theme.accent}
            noOfSections={4}
            yAxisLabelPrefix="₱"
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
            <Text style={styles.emptyTitle}>No paid revenue in this period</Text>
            <Text style={styles.emptySubtitle}>
              Monthly earnings will appear here after payments are recorded.
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
    minHeight: 184,
  },
  axisText: { color: Theme.textMuted, fontSize: 9 },
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
