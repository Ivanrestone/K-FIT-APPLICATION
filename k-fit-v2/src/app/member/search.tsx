// app/member/search.tsx
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function MemberSearchScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={48} color="#FFD700" />
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>Search functionality coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080808",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  title: { color: "#FFFFFF", fontSize: 24, fontWeight: "900" },
  subtitle: { color: "#9CA3AF", fontSize: 14 },
});
