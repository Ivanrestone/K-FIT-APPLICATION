import type { MembershipStatusCounts } from "@/hooks/useAdminDashboard";
import { PieChart } from "react-native-gifted-charts";
import { StyleSheet, Text, View } from "react-native";
import { GlassCard } from "./GlassCard";
import { Theme } from "./theme";

type Props = {
  counts: MembershipStatusCounts;
  loading: boolean;
  error: string | null;
};

const STATUS_COLORS = {
  active: Theme.success,
  inactive: Theme.textMuted,
  expired: Theme.error,
};

export function MembershipStatusChart({ counts, loading, error }: Props) {
  const data = [
    { label: "Active", value: counts.active, color: STATUS_COLORS.active },
    { label: "Inactive", value: counts.inactive, color: STATUS_COLORS.inactive },
    { label: "Expired", value: counts.expired, color: STATUS_COLORS.expired },
  ];
  const chartData = data
    .filter((status) => status.value > 0)
    .map((status) => ({ ...status, text: status.label }));
  const total = data.reduce((sum, status) => sum + status.value, 0);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Membership Status</Text>
        <Text style={styles.subtitle}>Current membership distribution</Text>
      </View>

      {loading ? (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Loading memberships...</Text>
        </View>
      ) : error ? (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : total > 0 ? (
        <>
          <View style={styles.chartContainer}>
            <PieChart
              data={chartData}
              donut
              radius={82}
              innerRadius={62}
              innerCircleColor={Theme.surface}
              showText={false}
              isAnimated
              animationDuration={450}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <Text style={styles.total}>{total.toLocaleString()}</Text>
                  <Text style={styles.centerCaption}>memberships</Text>
                </View>
              )}
            />
          </View>
          <View style={styles.legend}>
            {data.map((status) => (
              <View key={status.label} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: status.color },
                  ]}
                />
                <Text style={styles.legendLabel}>{status.label}</Text>
                <Text style={styles.legendValue}>
                  {status.value.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>No membership records found</Text>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16, padding: 18 },
  header: { marginBottom: 8 },
  title: { color: Theme.text, fontSize: 16, fontWeight: "800" },
  subtitle: { color: Theme.textMuted, fontSize: 10, marginTop: 4 },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 190,
  },
  centerLabel: { alignItems: "center", justifyContent: "center" },
  total: { color: Theme.text, fontSize: 23, fontWeight: "800" },
  centerCaption: { color: Theme.textMuted, fontSize: 9, marginTop: 2 },
  legend: { gap: 10, marginTop: 6 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { color: Theme.textMuted, flex: 1, fontSize: 11 },
  legendValue: { color: Theme.text, fontSize: 11, fontWeight: "700" },
  messageContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 190,
    paddingHorizontal: 16,
  },
  messageText: { color: Theme.textMuted, fontSize: 12, textAlign: "center" },
  errorText: {
    color: Theme.error,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
