import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "./theme";

const DAYS = [
  { name: "Monday", label: "M" },
  { name: "Tuesday", label: "T" },
  { name: "Wednesday", label: "W" },
  { name: "Thursday", label: "T" },
  { name: "Friday", label: "F" },
  { name: "Saturday", label: "S" },
  { name: "Sunday", label: "S" },
];

type Props = {
  days: number[];
  selectedIdx: number;
  onSelectDay: (idx: number) => void;
};

export function WeeklyChart({ days, selectedIdx, onSelectDay }: Props) {
  const counts = DAYS.map((_, index) => days[index] ?? 0);
  const maxCount = Math.max(...counts, 1);
  const total = counts.reduce((sum, count) => sum + count, 0);
  const selectedIndex = Math.max(0, Math.min(selectedIdx, DAYS.length - 1));
  const selectedCount = counts[selectedIndex];
  const todayIndex = (new Date().getDay() + 6) % 7;

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.eyebrow}>THIS WEEK</Text>
          <Text style={styles.selectedDay}>{DAYS[selectedIndex].name}</Text>
        </View>
        <View style={styles.totalWrap}>
          <Text style={styles.total}>{total}</Text>
          <Text style={styles.totalLabel}>
            {total === 1 ? "check-in" : "check-ins"}
          </Text>
        </View>
      </View>

      <Text style={styles.selectedSummary}>
        {selectedCount === 0
          ? "No check-ins on this day"
          : `${selectedCount} ${selectedCount === 1 ? "check-in" : "check-ins"}`}
      </Text>

      <View style={styles.chartRow}>
        {DAYS.map((day, index) => {
          const count = counts[index];
          const height = count === 0 ? 4 : Math.max((count / maxCount) * 76, 10);
          const selected = selectedIndex === index;

          return (
            <Pressable
              key={day.name}
              style={({ pressed }) => [
                styles.column,
                selected && styles.selectedColumn,
                pressed && styles.pressed,
              ]}
              onPress={() => onSelectDay(index)}
              accessibilityRole="button"
              accessibilityLabel={`${day.name}, ${count} ${count === 1 ? "check-in" : "check-ins"}`}
              accessibilityState={{ selected }}
            >
              <Text style={styles.count}>{count || ""}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor:
                        count > 0 ? Theme.accent : Theme.surfaceHigh,
                    },
                    selected && count > 0 && styles.selectedBar,
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  index === todayIndex && styles.todayLabel,
                  selected && styles.selectedDayLabel,
                ]}
              >
                {day.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 2 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "800",
    color: Theme.textMuted,
    letterSpacing: 0.8,
  },
  selectedDay: {
    fontSize: 16,
    fontWeight: "800",
    color: Theme.text,
    marginTop: 3,
  },
  totalWrap: { alignItems: "flex-end" },
  total: { fontSize: 22, fontWeight: "900", color: Theme.accent },
  totalLabel: { fontSize: 10, fontWeight: "600", color: Theme.textMuted },
  selectedSummary: {
    fontSize: 11,
    color: Theme.textMuted,
    marginTop: 4,
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    marginTop: 16,
    gap: 4,
  },
  column: {
    flex: 1,
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 5,
  },
  selectedColumn: { backgroundColor: Theme.surfaceHigh },
  pressed: { opacity: 0.75 },
  count: {
    height: 14,
    fontSize: 9,
    fontWeight: "700",
    color: Theme.textMuted,
  },
  barTrack: {
    height: 76,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: { width: "70%", maxWidth: 24, borderRadius: 6 },
  selectedBar: { borderWidth: 1, borderColor: Theme.text },
  dayLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Theme.textMuted,
    marginTop: 6,
  },
  todayLabel: { color: Theme.accent },
  selectedDayLabel: { color: Theme.text },
});
