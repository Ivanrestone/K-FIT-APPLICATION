import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme } from "./theme";

type Props = {
  activeTab: "pending" | "approved" | "rejected";
  setActiveTab: (t: "pending" | "approved" | "rejected") => void;
  counts: { pending: number; approved: number; rejected: number };
};

export function CoachApplicationTabs({
  activeTab,
  setActiveTab,
  counts,
}: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "pending" && styles.tabActive]}
        onPress={() => setActiveTab("pending")}
      >
        <Text
          style={[styles.text, activeTab === "pending" && styles.textActive]}
        >
          Pending ({counts.pending})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "approved" && styles.tabActive]}
        onPress={() => setActiveTab("approved")}
      >
        <Text
          style={[styles.text, activeTab === "approved" && styles.textActive]}
        >
          Approved ({counts.approved})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "rejected" && styles.tabActive]}
        onPress={() => setActiveTab("rejected")}
      >
        <Text
          style={[styles.text, activeTab === "rejected" && styles.textActive]}
        >
          Rejected ({counts.rejected})
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Theme.surface,
    borderRadius: 24,
    padding: 6,
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 20 },
  tabActive: { backgroundColor: Theme.accent },
  text: { fontSize: 12, fontWeight: "700", color: Theme.textMuted },
  textActive: { color: Theme.accentText },
});
