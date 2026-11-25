import { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import type { TrafficPoint } from "@/hooks/useAdminDashboard";
import { GlassCard } from "./GlassCard";
import { Theme } from "./theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

type Props = {
  todayData: TrafficPoint[];
  weekData: TrafficPoint[];
};

export function TrafficChart({ todayData, weekData }: Props) {
  const [isToday, setIsToday] = useState(true);
  const data = isToday ? todayData : weekData;
  const chartWidth = Math.max(SCREEN_WIDTH - 88, 210);
  const hasData = data.some((point) => point.value > 0);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.title}>Gym traffic</Text>
          <Text style={styles.subtitle}>
            {isToday
              ? "Check-ins by 3-hour interval"
              : "Check-ins by day this week"}
          </Text>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, isToday && styles.toggleBtnActive]}
            onPress={() => setIsToday(true)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityState={{ selected: isToday }}
          >
            <Text
              style={[styles.toggleText, isToday && styles.toggleTextActive]}
            >
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !isToday && styles.toggleBtnActive]}
            onPress={() => setIsToday(false)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityState={{ selected: !isToday }}
          >
            <Text
              style={[styles.toggleText, !isToday && styles.toggleTextActive]}
            >
              Week
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {hasData ? (
          <LineChart
            data={data}
            width={chartWidth}
            height={176}
            initialSpacing={8}
            spacing={(chartWidth - 36) / Math.max(data.length - 1, 1)}
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
            textShiftY={-8}
            yAxisTextStyle={{ color: Theme.textMuted, fontSize: 9 }}
            pointerConfig={{
              pointerStripHeight: 150,
              pointerStripColor: "rgba(255, 215, 0, 0.4)",
              pointerStripWidth: 2,
              pointerColor: Theme.accent,
              radius: 5,
              pointerLabelWidth: 60,
              pointerLabelHeight: 35,
              autoAdjustPointerLabelPosition: true,
              pointerLabelComponent: (items: any) => (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipValue}>{items[0].value}</Text>
                  <Text style={styles.tooltipLabel}>{items[0].label}</Text>
                </View>
              ),
            }}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No check-ins for this period</Text>
            <Text style={styles.emptySubtitle}>
              Attendance trends will appear here as members visit.
            </Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16, padding: 18, paddingBottom: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  heading: { flex: 1 },
  title: { color: Theme.text, fontSize: 16, fontWeight: "800" },
  subtitle: { color: Theme.textMuted, fontSize: 10, marginTop: 4 },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: Theme.surfaceHigh,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: Theme.accent },
  toggleText: { color: Theme.textMuted, fontSize: 10, fontWeight: "700" },
  toggleTextActive: { color: Theme.accentText, fontWeight: "800" },
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
  tooltip: {
    backgroundColor: Theme.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    elevation: 5,
  },
  tooltipValue: { color: Theme.accentText, fontSize: 13, fontWeight: "900" },
  tooltipLabel: {
    color: Theme.accentText,
    fontSize: 9,
    fontWeight: "700",
    opacity: 0.7,
  },
});
