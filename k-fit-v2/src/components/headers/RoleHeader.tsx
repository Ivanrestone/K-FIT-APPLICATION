import { AccountDropdown } from "@/components/headers/dropdowns/AccountDropdown";
import {
  type AccountMenuSection,
  type AccountRole,
} from "@/components/account/types";
import { useHeaderAccount } from "@/hooks/useHeaderAccount";
import { logout } from "@/lib/auth";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AccountTheme } from "../account/theme";

type Props = {
  role: AccountRole;
  portalLabel: string;
  subtitle: string;
  unreadCount?: number;
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
};

const SETTINGS_ROUTES: Record<AccountRole, string> = {
  admin: "/admin/settings",
  coach: "/coach/settings",
  member: "/member/settings",
};

const NOTIFICATION_ROUTES: Record<AccountRole, string> = {
  admin: "/admin/notifications",
  coach: "/coach/announcements",
  member: "/member/notifications",
};

const ROLE_MENUS: Record<
  AccountRole,
  (navigate: (path: string) => void, logoutAction: () => void) => AccountMenuSection[]
> = {
  admin: (navigate, logoutAction) => [
    {
      title: "ADMINISTRATION",
      items: [
        {
          title: "My Profile",
          description: "View your admin account information",
          icon: "person-outline",
          onPress: () => navigate("/admin/profile"),
        },
        {
          title: "Coach Applications",
          description: "Review and process applications",
          icon: "person-add-outline",
          onPress: () => navigate("/admin/coach-applications"),
        },
        {
          title: "Announcements",
          description: "Manage gym-wide updates",
          icon: "megaphone-outline",
          onPress: () => navigate("/admin/announcements"),
        },
        {
          title: "Access Grants",
          description: "Manage approved signup emails",
          icon: "key-outline",
          onPress: () => navigate("/admin/access-grants"),
        },
        {
          title: "System Settings",
          description: "Account and supported preferences",
          icon: "settings-outline",
          onPress: () => navigate(SETTINGS_ROUTES.admin),
        },
      ],
    },
    {
      title: "SUPPORT",
      items: [
        {
          title: "Help & FAQs",
          description: "Browse answers and guidance",
          icon: "help-circle-outline",
          onPress: () => navigate("/help-center"),
        },
        {
          title: "About K-FIT",
          description: "App information and team details",
          icon: "information-circle-outline",
          onPress: () => navigate("/about"),
        },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        {
          title: "Log out",
          description: "Sign out of this account",
          icon: "log-out-outline",
          danger: true,
          onPress: logoutAction,
        },
      ],
    },
  ],
  coach: (navigate, logoutAction) => [
    {
      title: "COACHING",
      items: [
        {
          title: "My Profile",
          description: "Update your coaching details and preferences",
          icon: "person-outline",
          onPress: () => navigate("/coach/profile"),
        },
        {
          title: "Gym Notices",
          description: "Review permitted gym announcements",
          icon: "megaphone-outline",
          onPress: () => navigate("/coach/announcements"),
        },
        {
          title: "Training Plans",
          description: "Create and assign member workout plans",
          icon: "barbell-outline",
          onPress: () => navigate("/coach/workouts"),
        },
        {
          title: "Settings",
          description: "Account and supported preferences",
          icon: "settings-outline",
          onPress: () => navigate(SETTINGS_ROUTES.coach),
        },
      ],
    },
    {
      title: "SUPPORT",
      items: [
        {
          title: "Help & FAQs",
          description: "Browse answers and guidance",
          icon: "help-circle-outline",
          onPress: () => navigate("/help-center"),
        },
        {
          title: "About K-FIT",
          description: "App information and team details",
          icon: "information-circle-outline",
          onPress: () => navigate("/about"),
        },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        {
          title: "Log out",
          description: "Sign out of this account",
          icon: "log-out-outline",
          danger: true,
          onPress: logoutAction,
        },
      ],
    },
  ],
  member: (navigate, logoutAction) => [
    {
      title: "MY ACCOUNT",
      items: [
        {
          title: "My Profile",
          description: "View and update personal information",
          icon: "person-outline",
          onPress: () => navigate("/member/profile"),
        },
        {
          title: "Membership & Billing",
          description: "View membership and payment records",
          icon: "card-outline",
          onPress: () => navigate("/member/membership"),
        },
        {
          title: "Attendance & Gate Logs",
          description: "Review recorded gym check-ins",
          icon: "time-outline",
          onPress: () => navigate("/member/attendance"),
        },
        {
          title: "Training Plans",
          description: "View workouts assigned by your coach",
          icon: "barbell-outline",
          onPress: () => navigate("/member/workouts"),
        },
        {
          title: "Settings",
          description: "Account and supported preferences",
          icon: "settings-outline",
          onPress: () => navigate(SETTINGS_ROUTES.member),
        },
      ],
    },
    {
      title: "SUPPORT",
      items: [
        {
          title: "Help & FAQs",
          description: "Browse answers and guidance",
          icon: "help-circle-outline",
          onPress: () => navigate("/help-center"),
        },
        {
          title: "About K-FIT",
          description: "App information and team details",
          icon: "information-circle-outline",
          onPress: () => navigate("/about"),
        },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        {
          title: "Log out",
          description: "Sign out of this account",
          icon: "log-out-outline",
          danger: true,
          onPress: logoutAction,
        },
      ],
    },
  ],
};

export function RoleHeader({
  role,
  portalLabel,
  subtitle,
  unreadCount = 0,
  onSearchPress,
  onNotificationsPress,
}: Props) {
  const { account, stats } = useHeaderAccount(role);
  const insets = useSafeAreaInsets();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationOpacity] = useState(() => new Animated.Value(0));
  const [notificationScale] = useState(() => new Animated.Value(0.96));

  useEffect(() => {
    if (!showNotifications) {
      notificationOpacity.setValue(0);
      notificationScale.setValue(0.96);
      return;
    }
    const animation = Animated.parallel([
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.spring(notificationScale, {
        toValue: 1,
        friction: 9,
        tension: 110,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [notificationOpacity, notificationScale, showNotifications]);

  const navigate = (path: string) => router.push(path as never);
  const handleLogout = () => {
    void logout()
      .then((result) => {
        if (!result.success) {
          Alert.alert("Logout failed", result.error || "Please try again.");
          return;
        }
        router.replace("/login");
      })
      .catch((error) => {
        console.error("Logout failed:", error);
        Alert.alert("Logout failed", "Please try again.");
      });
  };

  const toggleNotifications = () => {
    setShowAccountMenu(false);
    if (onNotificationsPress) {
      onNotificationsPress();
      return;
    }
    setShowNotifications((current) => !current);
  };

  const initial =
    account.name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || portalLabel[0];
  const sections = ROLE_MENUS[role](navigate, handleLogout);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons
              name="dumbbell"
              size={24}
              color="#000000"
            />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>K-FIT</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{portalLabel}</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Search"
            disabled={!onSearchPress}
            style={[styles.iconCircle, !onSearchPress && styles.disabledAction]}
            onPress={onSearchPress}
          >
            <Ionicons name="search" size={19} color="#D1D5DB" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
            style={styles.iconCircle}
            onPress={toggleNotifications}
          >
            <Ionicons name="notifications-outline" size={19} color="#D1D5DB" />
            {unreadCount > 0 && <View style={styles.unreadDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open account menu"
            style={styles.avatarCircle}
            onPress={() => {
              setShowNotifications(false);
              setShowAccountMenu(true);
            }}
          >
            <Text style={styles.avatarInitial}>{initial[0]}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AccountDropdown
        visible={showAccountMenu}
        onClose={() => setShowAccountMenu(false)}
        role={role}
        name={account.name}
        email={account.email}
        avatarUrl={account.avatarUrl}
        sections={sections}
        stats={stats}
        footer="K-FIT - ACCOUNT MENU"
      />

      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close notifications"
            style={StyleSheet.absoluteFill}
            onPress={() => setShowNotifications(false)}
          />
          <Animated.View
            style={[
              styles.notificationPanel,
              {
                top: insets.top + 66,
                opacity: notificationOpacity,
                transform: [{ scale: notificationScale }],
              },
            ]}
          >
            <View style={styles.notificationTitleRow}>
              <Text style={styles.notificationTitle}>Updates</Text>
              <Ionicons
                name="notifications-outline"
                size={17}
                color={AccountTheme.accent}
              />
            </View>
            <Text style={styles.notificationBody}>
              Notification counts are not available here. Open updates to review
              the latest records and announcements.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setShowNotifications(false);
                navigate(NOTIFICATION_ROUTES[role]);
              }}
              style={({ pressed }) => [
                styles.openUpdates,
                pressed && styles.openUpdatesPressed,
              ]}
            >
              <Text style={styles.openUpdatesText}>Open updates</Text>
              <Ionicons
                name="arrow-forward"
                size={15}
                color={AccountTheme.accent}
              />
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#080808",
    borderBottomWidth: 1,
    borderBottomColor: "#222222",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: AccountTheme.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: AccountTheme.text,
    letterSpacing: 1,
  },
  roleBadge: {
    backgroundColor: "rgba(250,204,21,0.1)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.3)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleText: {
    color: AccountTheme.accent,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: "700",
    color: AccountTheme.accent,
    letterSpacing: 1.4,
    marginTop: 2,
  },
  rightActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledAction: { opacity: 0.5 },
  unreadDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: AccountTheme.accent,
    borderWidth: 2,
    borderColor: "#080808",
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: AccountTheme.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { color: "#000000", fontSize: 15, fontWeight: "900" },
  modalBackdrop: {
    flex: 1,
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  notificationPanel: {
    position: "absolute",
    right: 16,
    width: 300,
    maxWidth: "90%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AccountTheme.border,
    backgroundColor: AccountTheme.surface,
    padding: 16,
    elevation: 18,
  },
  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notificationTitle: { color: AccountTheme.text, fontSize: 14, fontWeight: "800" },
  notificationBody: {
    color: AccountTheme.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },
  openUpdates: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginTop: 5,
  },
  openUpdatesPressed: { opacity: 0.65 },
  openUpdatesText: {
    color: AccountTheme.accent,
    fontSize: 11,
    fontWeight: "800",
  },
});
