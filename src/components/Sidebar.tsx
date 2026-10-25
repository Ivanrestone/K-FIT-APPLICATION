import { KFitColors } from "@/constants/theme";
import { useLogout } from "@/hooks/use-logout";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

interface SidebarProps {
  activeRoute: string;
  /** Kept so existing screens (theme="dashboard") still compile. The sidebar is always KFit dark now. */
  theme?: string;
}

type NavItem = { name: string; short: string; route: string; icon: IconName };

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", short: "Home", route: "/dashboard", icon: "grid" },
  { name: "Members", short: "Roster", route: "/members", icon: "people" },
  {
    name: "Attendance",
    short: "Attendance",
    route: "/attendance",
    icon: "calendar",
  },
  { name: "Trainers", short: "Trainers", route: "/trainers", icon: "barbell" },
  { name: "Memberships", short: "Plans", route: "/memberships", icon: "card" },
  { name: "Payments", short: "Payments", route: "/payments", icon: "cash" },
  { name: "Races", short: "Races", route: "/challenges", icon: "trophy" },
  {
    name: "Scanner",
    short: "Scanner",
    route: "/admin-scanner",
    icon: "qr-code",
  },
  { name: "Memo", short: "Memo", route: "/memo", icon: "document-text" },
];

// These five get a slot in the floating dock; everything else lives under "More"
const PRIMARY_ROUTES = [
  "/dashboard",
  "/members",
  "/attendance",
  "/trainers",
  "/payments",
];

export default function Sidebar({ activeRoute }: SidebarProps) {
  const router = useRouter();
  const { logout } = useLogout();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isMobile = width < 768;
  const primaryItems = NAV_ITEMS.filter((i) =>
    PRIMARY_ROUTES.includes(i.route),
  );
  const secondaryItems = NAV_ITEMS.filter(
    (i) => !PRIMARY_ROUTES.includes(i.route),
  );
  const moreIsActive = secondaryItems.some((i) => i.route === activeRoute);

  const goTo = (route: string) => router.replace(route as any);

  const handleLogout = () => {
    setIsMoreOpen(false);
    void logout();
  };

  /* ------------------------------------------------------------------ */
  /* Phone: floating glass dock + "More" sheet                           */
  /* ------------------------------------------------------------------ */
  if (isMobile) {
    return (
      <>
        <View style={styles.dockWrap} pointerEvents="box-none">
          <View style={styles.dock}>
            {primaryItems.map((item) => {
              const active = activeRoute === item.route;
              return (
                <Pressable
                  key={item.route}
                  style={({ pressed }) => [
                    styles.dockItem,
                    active && styles.dockItemActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => goTo(item.route)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={item.name}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={active ? KFitColors.onAccent : KFitColors.mutedText}
                  />
                  <Text
                    style={[styles.dockLabel, active && styles.dockLabelActive]}
                    numberOfLines={1}
                  >
                    {item.short}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              style={({ pressed }) => [
                styles.dockItem,
                moreIsActive && styles.dockItemActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setIsMoreOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="More admin navigation"
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color={
                  moreIsActive ? KFitColors.onAccent : KFitColors.mutedText
                }
              />
              <Text
                style={[
                  styles.dockLabel,
                  moreIsActive && styles.dockLabelActive,
                ]}
                numberOfLines={1}
              >
                More
              </Text>
            </Pressable>
          </View>
        </View>

        <Modal
          visible={isMoreOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsMoreOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setIsMoreOpen(false)}
          >
            <Pressable
              style={[
                styles.moreSheet,
                { paddingBottom: Math.max(insets.bottom, 20) },
              ]}
              onPress={(event) => event.stopPropagation()}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Admin tools</Text>

              {secondaryItems.map((item) => {
                const active = activeRoute === item.route;
                return (
                  <Pressable
                    key={item.route}
                    style={({ pressed }) => [
                      styles.moreItem,
                      active && styles.moreItemActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      setIsMoreOpen(false);
                      goTo(item.route);
                    }}
                  >
                    <View
                      style={[
                        styles.moreIconBox,
                        active && styles.moreIconBoxActive,
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={
                          active ? KFitColors.onAccent : KFitColors.mutedText
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.moreItemText,
                        active && styles.moreItemTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                style={({ pressed }) => [
                  styles.moreItem,
                  styles.logoutItem,
                  pressed && styles.pressed,
                ]}
                onPress={handleLogout}
              >
                <View style={styles.moreIconBox}>
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color={KFitColors.error}
                  />
                </View>
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Tablet / wide: side panel                                           */
  /* ------------------------------------------------------------------ */
  const sidebarWidth = isCollapsed ? width * 0.08 : width * 0.2;

  return (
    <View style={[styles.sidebar, { width: sidebarWidth }]}>
      <View style={styles.sidebarTop}>
        {!isCollapsed && (
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>K</Text>
            </View>
            <Text style={styles.brandText}>KFIT ADMIN</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.collapseButton}
          onPress={() => setIsCollapsed(!isCollapsed)}
          accessibilityRole="button"
          accessibilityLabel={
            isCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
        >
          <Ionicons
            name={isCollapsed ? "chevron-forward" : "chevron-back"}
            size={16}
            color={KFitColors.mutedText}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.sidebarNav}>
        {NAV_ITEMS.map((item) => {
          const active = activeRoute === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => goTo(item.route)}
              accessibilityLabel={item.name}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={active ? KFitColors.onAccent : KFitColors.mutedText}
              />
              {!isCollapsed && (
                <Text
                  style={[
                    styles.navItemText,
                    active && styles.navItemTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={isCollapsed ? styles.logoutButtonCollapsed : styles.logoutButton}
        onPress={handleLogout}
        accessibilityLabel="Logout"
      >
        {isCollapsed ? (
          <Ionicons name="log-out-outline" size={18} color={KFitColors.error} />
        ) : (
          <Text style={styles.logoutButtonText}>Logout</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ---------------- Floating dock (phone) ---------------- */
  dockWrap: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 12,
    zIndex: 30,
  },

  dock: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KFitColors.border + "CC",
    backgroundColor: "rgba(20, 20, 20, 0.94)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 14,
  },

  dockItem: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 12,
  },

  dockItemActive: {
    backgroundColor: KFitColors.accent,
    transform: [{ scale: 1.05 }],
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  dockLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: -0.1,
  },

  dockLabelActive: {
    color: KFitColors.onAccent,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.65,
  },

  /* ---------------- "More" bottom sheet ---------------- */
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },

  moreSheet: {
    backgroundColor: KFitColors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: KFitColors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },

  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: KFitColors.border,
    marginBottom: 8,
  },

  sheetTitle: {
    color: KFitColors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },

  moreItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 8,
  },

  moreItemActive: {
    backgroundColor: KFitColors.accent + "1F",
  },

  moreIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },

  moreIconBoxActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },

  moreItemText: {
    color: KFitColors.mutedText,
    fontSize: 15,
    fontWeight: "600",
  },

  moreItemTextActive: {
    color: KFitColors.accent,
  },

  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
    marginTop: 4,
    paddingTop: 8,
  },

  logoutText: {
    color: KFitColors.error,
    fontSize: 15,
    fontWeight: "600",
  },

  /* ---------------- Side panel (tablet / wide) ---------------- */
  sidebar: {
    backgroundColor: KFitColors.surface,
    borderRightWidth: 1,
    borderRightColor: KFitColors.border,
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 20,
  },

  sidebarTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },

  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  brandIconText: {
    color: KFitColors.onAccent,
    fontSize: 14,
    fontWeight: "900",
  },

  brandText: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  collapseButton: {
    padding: 8,
    marginLeft: "auto",
  },

  sidebarNav: {
    gap: 6,
  },

  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },

  navItemActive: {
    backgroundColor: KFitColors.accent,
  },

  navItemText: {
    fontSize: 14,
    color: KFitColors.mutedText,
    fontWeight: "500",
  },

  navItemTextActive: {
    color: KFitColors.onAccent,
    fontWeight: "700",
  },

  logoutButton: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.error,
    backgroundColor: KFitColors.background,
  },

  logoutButtonText: {
    fontSize: 14,
    color: KFitColors.error,
    fontWeight: "600",
    textAlign: "center",
  },

  logoutButtonCollapsed: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.error,
    backgroundColor: KFitColors.background,
    alignItems: "center",
  },
});
