import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSoundEffects } from "../shared/SoundEffectsProvider";
import { Theme } from "./theme";

type Action = {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  onPress: () => void;
};

interface QuickActionsGridProps {
  onLogWorkout: () => void;
}

export function QuickActionsGrid({ onLogWorkout }: QuickActionsGridProps) {
  const playSound = useSoundEffects();
  const actions: Action[] = [
    {
      key: "workout",
      label: "Log workout",
      icon: "dumbbell",
      color: Theme.accent,
      onPress: onLogWorkout,
    },
    {
      key: "assigned-workouts",
      label: "Training plans",
      icon: "clipboard-text-outline",
      color: Theme.info,
      onPress: () => router.push("/member/workouts"),
    },
    {
      key: "attendance",
      label: "Attendance",
      icon: "clipboard-list",
      color: Theme.success,
      onPress: () => router.push("/member/attendance"),
    },
    {
      key: "membership",
      label: "Membership",
      icon: "credit-card",
      color: Theme.info,
      onPress: () => router.push("/member/membership"),
    },
    {
      key: "coach",
      label: "Apply as coach",
      icon: "account-search",
      color: Theme.warning,
      onPress: () => router.push("/member/apply-coach"),
    },
  ];

  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.key}
          style={styles.actionItem}
          onPress={() => {
            playSound("tap");
            action.onPress();
          }}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${action.color}18` },
            ]}
          >
            <MaterialCommunityIcons
              name={action.icon}
              size={21}
              color={action.color}
            />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {action.label}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={Theme.textMuted}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: Theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  actionItem: {
    width: "47%",
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: Theme.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.border,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: Theme.text,
  },
});
