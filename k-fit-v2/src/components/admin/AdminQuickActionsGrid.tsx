import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AnimatedQuickAction } from "./AnimatedQuickAction";

export function AdminQuickActionsGrid() {
  const quickActions = [
    {
      label: "Members",
      icon: "account-group",
      onPress: () => router.push("/admin/members"),
    },
    {
      label: "Announcements",
      icon: "bullhorn",
      onPress: () => router.push("/admin/announcements"),
    },
    {
      label: "Coach Apps",
      icon: "account-plus",
      onPress: () => router.push("/admin/coach-applications"),
    },
    {
      label: "Payments",
      icon: "credit-card",
      onPress: () => router.push("/admin/payments"),
    },
    {
      label: "Attendance",
      icon: "clipboard-check",
      onPress: () => router.push("/admin/attendance"),
    },
    {
      label: "Challenges",
      icon: "trophy",
      onPress: () => router.push("/admin/challenges"),
    },
    {
      label: "KP Points",
      icon: "star-circle",
      onPress: () => router.push("/admin/points"),
    },
    {
      label: "My Profile",
      icon: "account-circle",
      onPress: () => router.push("/admin/profile"),
    },
  ] as const;

  const scanAction = {
    label: "Scan QR",
    center: true as const,
    onPress: () => router.push("/admin/scan-qr"),
  };

  const gridItems = [
    ...quickActions.slice(0, 4),
    scanAction,
    ...quickActions.slice(4),
  ];

  return (
    <View style={styles.actionsGrid}>
      {gridItems.map((action) => (
        <AnimatedQuickAction
          key={action.label}
          action={action}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
});
