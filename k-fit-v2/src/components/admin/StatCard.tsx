import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "./theme";

interface StatCardProps {
  title: string;
  value: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  detail: string;
  onPress: () => void;
}

export function StatCard({
  title,
  value,
  icon,
  color,
  detail,
  onPress,
}: StatCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value}. ${detail}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBg, { backgroundColor: `${color}18` }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <MaterialCommunityIcons
          name="arrow-top-right"
          size={16}
          color={Theme.textMuted}
        />
      </View>
      <Text style={styles.value}>{value.toLocaleString()}</Text>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.detailBadge, { backgroundColor: `${color}18` }]}>
        <Text style={[styles.detailText, { color }]} numberOfLines={1}>
          {detail}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    padding: 14,
    width: "48%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  pressed: { backgroundColor: Theme.surfaceHigh, transform: [{ scale: 0.98 }] },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { color: Theme.text, fontSize: 24, fontWeight: "900" },
  title: { color: Theme.textMuted, fontSize: 11, marginTop: 3, fontWeight: "600" },
  detailBadge: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 9,
  },
  detailText: { fontSize: 9, fontWeight: "800" },
});
