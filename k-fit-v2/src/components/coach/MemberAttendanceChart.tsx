import type { DashboardChartPoint } from "@/hooks/useCoachDashboard";
import { LineChart } from "react-native-gifted-charts";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Theme } from "./theme";

type Props = {
  data: DashboardChartPoint[];
  error: string | null;
};

export function MemberAttendanceChart({ data, error }: Props) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - 88, 210);
  const hasData = data.some((point) => point.value > 0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Member Attendance</Text>
        <Text style={styles.subtitle}>
          Assigned-member check-ins · last 7 days
        </Text>
      </View>

      <View style={styles.chartContainer}>
        {error ? (
          <View style={styles.emptyState}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : hasData ? (
          <LineChart
            data={data}
            width={chartWidth}
            height={168}
            initialSpacing={8}
            spacing={(chartWidth - 36) / Math.max(data.length - 1, 1)}
            color={Theme.accent}
            thickness={3}
            dataPointsColor={Theme.accent}
            dataPointsRadius={4}
            areaChart
            startFillColor="rgba(255, 214, 0, 0.2)"
            endFillColor="rgba(255, 214, 0, 0)"
            startOpacity={0.8}
            endOpacity={0.1}
            curved
            xAxisColor="transparent"
            yAxisColor="transparent"
            rulesType="dashed"
            rulesColor="rgba(255,255,255,0.06)"
            yAxisLabelWidth={28}
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No recent check-ins</Text>
            <Text style={styles.emptySubtitle}>
              Attendance trends will appear when assigned members visit.
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
    minHeight: 168,
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
