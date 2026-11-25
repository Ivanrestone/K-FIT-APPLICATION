import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "./theme";

type Props = {
  activePlans: number | null;
  completedWorkouts: number | null;
  error: string | null;
  onPress: () => void;
};

export function AssignedTrainingCard({
  activePlans,
  completedWorkouts,
  error,
  onPress,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open assigned training plans"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <MaterialCommunityIcons
          name="clipboard-text-outline"
          size={20}
          color={Theme.accent}
        />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Assigned training</Text>
        <Text style={styles.subtitle}>
          {error
            ? error
            : `${activePlans ?? "—"} active plans · ${
                completedWorkouts ?? "—"
              } completed sessions`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Theme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    minHeight: 72,
    padding: 14,
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  pressed: { opacity: 0.75 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,215,0,0.1)",
  },
  copy: { flex: 1 },
  title: { color: Theme.text, fontSize: 13, fontWeight: "800" },
  subtitle: { color: Theme.textMuted, fontSize: 10, lineHeight: 15, marginTop: 4 },
});
