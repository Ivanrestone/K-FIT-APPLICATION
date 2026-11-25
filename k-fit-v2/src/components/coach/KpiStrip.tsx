// components/coach/dashboard/KpiStrip.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "./theme";

export type Kpi = {
  key: string;
  label: string;
  value: number | string;
  color: string;
  onPress: () => void;
};

export function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <View style={styles.row}>
      {items.map((kpi) => (
        <Pressable
          key={kpi.key}
          onPress={kpi.onPress}
          accessibilityRole="button"
          accessibilityLabel={`${kpi.label}: ${kpi.value}`}
          style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
        >
          <Text style={[styles.value, { color: kpi.color }]}>{kpi.value}</Text>
          <Text style={styles.label} numberOfLines={1}>
            {kpi.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  cell: {
    width: "48%",
    flexGrow: 1,
    minWidth: 130,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  pressed: { transform: [{ scale: 0.96 }], backgroundColor: Theme.surfaceAlt },
  value: { fontSize: 20, fontWeight: "900", lineHeight: 24 },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: Theme.textMuted,
    marginTop: 2,
  },
});
