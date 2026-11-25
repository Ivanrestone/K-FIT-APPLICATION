// components/coach/dashboard/QuickActionsGrid.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSoundEffects } from "../shared/SoundEffectsProvider";
import { Theme } from "./theme";

type Action = {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route:
    | "/coach/appointments"
    | "/coach/clients"
    | "/coach/workouts"
    | "/coach/requests"
    | "/coach/announcements"
    | "/coach/membership"
    | "/coach/challenges"
    | "/coach/profile";
};

// QR lives in the bottom bar's center button, so it is not repeated here.
const ACTIONS: Action[] = [
  {
    key: "appointments",
    label: "Appointments",
    icon: "calendar-clock",
    route: "/coach/appointments",
  },
  {
    key: "clients",
    label: "My Clients",
    icon: "account-group",
    route: "/coach/clients",
  },
  {
    key: "workouts",
    label: "Training Plans",
    icon: "dumbbell",
    route: "/coach/workouts",
  },
  {
    key: "requests",
    label: "Requests",
    icon: "account-plus",
    route: "/coach/requests",
  },
  {
    key: "announcements",
    label: "Announcements",
    icon: "bullhorn",
    route: "/coach/announcements",
  },
  {
    key: "membership",
    label: "Membership",
    icon: "credit-card",
    route: "/coach/membership",
  },
  {
    key: "challenges",
    label: "Challenges",
    icon: "trophy-outline",
    route: "/coach/challenges",
  },
  {
    key: "profile",
    label: "My Profile",
    icon: "account-circle",
    route: "/coach/profile",
  },
];

export function QuickActionsGrid() {
  const playSound = useSoundEffects();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.grid}>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.key}
            onPress={() => {
              playSound("tap");
              router.push(a.route);
            }}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            style={styles.item}
          >
            {({ pressed }) => (
              <>
                <View style={[styles.circle, pressed && styles.circlePressed]}>
                  <MaterialCommunityIcons
                    name={a.icon}
                    size={24}
                    color={Theme.accent}
                  />
                </View>
                <Text style={styles.label} numberOfLines={1}>
                  {a.label}
                </Text>
              </>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: Theme.text,
    marginBottom: 16,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  item: {
    width: "33.33%",
    alignItems: "center",
    paddingHorizontal: 6,
    marginBottom: 18,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: Theme.surfaceAlt,
    borderWidth: 1,
    borderColor: Theme.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  circlePressed: {
    transform: [{ scale: 0.94 }],
    borderColor: Theme.accentBorder,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: Theme.textMuted,
    textAlign: "center",
  },
});
