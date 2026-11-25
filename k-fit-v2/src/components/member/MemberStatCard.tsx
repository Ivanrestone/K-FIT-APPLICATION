// src/components/member/MemberStatCard.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface MemberStatCardProps {
  icon: IconName;
  label: string;
  value: string | number;
  subLabel?: string;
  color?: string;
}

export const MemberStatCard = ({
  icon,
  label,
  value,
  subLabel,
  color = "#FFD700",
}: MemberStatCardProps) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "31.5%",
    backgroundColor: "#121212",
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#222222",
  },
  iconBox: {
    padding: 10,
    borderRadius: 14,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  value: { fontSize: 22, fontWeight: "900", color: "#FFFFFF", marginBottom: 2 },
  label: { fontSize: 10, color: "#9CA3AF", fontWeight: "600" },
  subLabel: {
    fontSize: 9,
    color: "#9CA3AF",
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
  },
});
