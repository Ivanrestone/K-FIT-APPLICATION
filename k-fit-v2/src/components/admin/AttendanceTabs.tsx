import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme } from "./theme";

type Props = {
  activeTab: "all" | "checkedIn" | "checkedOut";
  setActiveTab: (t: "all" | "checkedIn" | "checkedOut") => void;
  counts: { all: number; checkedIn: number; checkedOut: number };
};

export function AttendanceTabs({ activeTab, setActiveTab, counts }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "all" && styles.tabActive]}
        onPress={() => setActiveTab("all")}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === "all" }}
      >
        <Text style={[styles.text, activeTab === "all" && styles.textActive]}>
          All ({counts.all})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "checkedIn" && styles.tabActive]}
        onPress={() => setActiveTab("checkedIn")}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === "checkedIn" }}
      >
        <Text
          style={[styles.text, activeTab === "checkedIn" && styles.textActive]}
        >
          Inside ({counts.checkedIn})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "checkedOut" && styles.tabActive]}
        onPress={() => setActiveTab("checkedOut")}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === "checkedOut" }}
      >
        <Text
          style={[styles.text, activeTab === "checkedOut" && styles.textActive]}
        >
          Completed ({counts.checkedOut})
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#111214",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 5,
    marginBottom: 22,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 3,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  tabActive: { backgroundColor: Theme.accent },
  text: {
    fontSize: 10,
    fontWeight: "800",
    color: Theme.textMuted,
    textAlign: "center",
  },
  textActive: { color: Theme.accentText },
});
