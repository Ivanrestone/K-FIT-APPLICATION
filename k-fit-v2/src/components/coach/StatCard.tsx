import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export const StatCard = ({ title, value, icon, color, trend }: any) => (
  <View style={styles.statCard}>
    <View style={styles.statTop}>
      <View style={[styles.statIconBg, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.trendBadge}>
        <Text style={styles.trendText}>{trend}</Text>
      </View>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  statCard: {
    width: "48%",
    backgroundColor: "#121212",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#222222",
  },
  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  statIconBg: { padding: 10, borderRadius: 14 },
  trendBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  trendText: { color: "#9CA3AF", fontSize: 9, fontWeight: "700" },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  statTitle: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
});
