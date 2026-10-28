import { KFitColors } from "@/constants/theme";
import { useLogout } from "@/hooks/use-logout";
import {
  markAllNoticesRead,
  markNoticeRead,
  timeAgo,
  useNotices,
} from "@/lib/challenges-store";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  /** Show a back arrow instead of the brand block (for detail screens). */
  showBack?: boolean;
  /** Override the small subtitle under the brand title. */
  subtitle?: string;
  /** Optional: open a settings screen/tab. */
  onOpenSettings?: (key: "notifications" | "privacy" | "language") => void;
  /** Optional: open a support screen/URL. */
  onOpenSupport?: (key: "help" | "contact" | "terms" | "privacy") => void;
};

type SubLink = {
  label: string;
  hint: string;
  icon: keyof typeof Feather.glyphMap;
  value?: string;
  onPress?: () => void;
};

/* ───────────────────────── Accordion section ───────────────────────── */

function AccordionSection({
  title,
  icon,
  badge,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  badge?: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const rotate = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotate, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, rotate]);

  const chevronRotate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={onToggle}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}, ${expanded ? "expanded" : "collapsed"}`}
      >
        <View style={styles.accordionIcon}>
          <Feather name={icon} size={15} color={KFitColors.accent} />
        </View>
        <Text style={styles.accordionTitle}>{title}</Text>
        {badge !== undefined && badge > 0 ? (
          <View style={styles.accordionBadge}>
            <Text style={styles.accordionBadgeText}>
              {badge > 9 ? "9+" : badge}
            </Text>
          </View>
        ) : null}
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Feather
            name="chevron-right"
            size={16}
            color={KFitColors.mutedText}
          />
        </Animated.View>
      </TouchableOpacity>

      {expanded ? <View style={styles.accordionBody}>{children}</View> : null}
    </View>
  );
}

/* ───────────────────────── Sub-link row ───────────────────────── */

function SubLinkRow({ link }: { link: SubLink }) {
  return (
    <TouchableOpacity
      style={styles.subRow}
      onPress={link.onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={link.label}
    >
      <View style={styles.subIcon}>
        <Feather name={link.icon} size={13} color={KFitColors.accent} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.subLabel}>{link.label}</Text>
        <Text style={styles.subHint}>{link.hint}</Text>
      </View>
      {link.value ? <Text style={styles.subValue}>{link.value}</Text> : null}
      <Feather name="chevron-right" size={14} color={KFitColors.mutedText} />
    </TouchableOpacity>
  );
}

/* ───────────────────────── TrainerHeader ───────────────────────── */

export default function TrainerHeader({
  showBack = false,
  subtitle = "COACH WORKSPACE",
  onOpenSettings,
  onOpenSupport,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSigningOut, logout } = useLogout();

  const [panel, setPanel] = useState<"notifications" | "profile" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const { notices: notifications, unread } = useNotices("trainer");

  const closePanel = () => {
    setPanel(null);
    setSettingsOpen(false);
    setSupportOpen(false);
  };

  const openPanel = (next: "notifications" | "profile") => {
    void Haptics.selectionAsync();
    setPanel(next);
  };

  const markRead = (id: string) => {
    markNoticeRead("trainer", id);
  };

  const markAllRead = () => {
    if (unread === 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markAllNoticesRead("trainer");
  };

  const toggleAccordion = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    open: boolean,
  ) => {
    void Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter(!open);
  };

  /* ── Settings & Support definitions ── */
  const settingsLinks: SubLink[] = [
    {
      label: "Notifications",
      hint: "Push alerts & reminders",
      icon: "bell",
      onPress: () => {
        closePanel();
        onOpenSettings?.("notifications");
      },
    },
    {
      label: "Privacy Settings",
      hint: "Who can see your activity",
      icon: "lock",
      onPress: () => {
        closePanel();
        onOpenSettings?.("privacy");
      },
    },
    {
      label: "Language",
      hint: "App display language",
      icon: "globe",
      value: "English",
      onPress: () => {
        closePanel();
        onOpenSettings?.("language");
      },
    },
  ];

  const supportLinks: SubLink[] = [
    {
      label: "Help Center",
      hint: "Guides & FAQs",
      icon: "help-circle",
      onPress: () => {
        closePanel();
        onOpenSupport?.("help");
      },
    },
    {
      label: "Contact Support",
      hint: "We're here to help",
      icon: "message-square",
      onPress: () => {
        closePanel();
        onOpenSupport?.("contact");
      },
    },
    {
      label: "Terms of Service",
      hint: "Rules of the club",
      icon: "file-text",
      onPress: () => {
        closePanel();
        onOpenSupport?.("terms");
      },
    },
    {
      label: "Privacy Policy",
      hint: "How we handle your data",
      icon: "shield",
      onPress: () => {
        closePanel();
        onOpenSupport?.("privacy");
      },
    },
  ];

  // Modal content is not inside SafeAreaView, so offset by the top inset.
  const panelTop = insets.top + 62;

  return (
    <>
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={20} color={KFitColors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandIconWrapper}>
            <Image
              source={require("../../assets/images/logo.jpg")}
              resizeMode="contain"
              style={styles.brandLogo}
              accessibilityLabel="K-Fit logo"
            />
          </View>
        )}

        <View style={styles.titleBlock}>
          <Text style={styles.brandTitle}>KFIT TRAINER</Text>
          <Text style={styles.brandSubtitle}>{subtitle}</Text>
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => openPanel("notifications")}
          accessibilityRole="button"
          accessibilityLabel={`Notifications, ${unread} unread`}
          activeOpacity={0.7}
        >
          <Feather name="bell" size={17} color={KFitColors.accent} />

          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unread > 99 ? "99+" : unread}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatar}
          onPress={() => openPanel("profile")}
          accessibilityRole="button"
          accessibilityLabel="Open profile menu"
          activeOpacity={0.8}
        >
          <Text style={styles.avatarText}>MV</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={panel !== null}
        transparent
        animationType="fade"
        onRequestClose={closePanel}
      >
        <Pressable style={styles.backdrop} onPress={closePanel}>
          <Pressable
            style={[styles.panel, { marginTop: panelTop }]}
            onPress={() => {}}
          >
            {panel === "notifications" && (
              <>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>NOTIFICATIONS</Text>

                  <TouchableOpacity
                    onPress={markAllRead}
                    disabled={unread === 0}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Mark all notifications as read"
                  >
                    <Text
                      style={[
                        styles.panelAction,
                        unread === 0 && { opacity: 0.4 },
                      ]}
                    >
                      Mark all read
                    </Text>
                  </TouchableOpacity>
                </View>

                {notifications.length === 0 ? (
                  <View style={styles.emptyNotifications}>
                    <Feather
                      name="bell-off"
                      size={22}
                      color={KFitColors.mutedText}
                    />
                    <Text style={styles.emptyTitle}>No notifications yet</Text>
                    <Text style={styles.emptyBody}>
                      New challenge announcements will appear here.
                    </Text>
                  </View>
                ) : (
                  notifications.map((notification) => (
                    <TouchableOpacity
                      key={notification.id}
                      style={[
                        styles.notifRow,
                        !notification.read && styles.notifRowUnread,
                      ]}
                      onPress={() => markRead(notification.id)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`${notification.title}. ${
                        notification.read ? "Read" : "Unread"
                      }`}
                    >
                      <View
                        style={[
                          styles.notifIcon,
                          !notification.read && styles.notifIconUnread,
                        ]}
                      >
                        <Feather
                          name={notification.icon}
                          size={15}
                          color={
                            notification.read
                              ? KFitColors.mutedText
                              : KFitColors.accent
                          }
                        />
                      </View>

                      <View style={styles.flex}>
                        <Text style={styles.notifTitle}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notifBody}>
                          {notification.body}
                        </Text>
                        <Text style={styles.notifTime}>
                          {timeAgo(notification.createdAt)}
                        </Text>
                      </View>

                      {!notification.read && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}

            {panel === "profile" && (
              <>
                <View style={styles.profileTop}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>MV</Text>
                  </View>

                  <View style={styles.flex}>
                    <Text style={styles.profileName}>Marcus Vance</Text>
                    <Text style={styles.profileRole} numberOfLines={2}>
                      Head Strength & Conditioning Coach
                    </Text>
                  </View>
                </View>

                {/* ✅ Profile link — navigates to /trainer-profile */}
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => {
                    closePanel();
                    router.replace("/trainer-profile" as any);
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Open trainer profile"
                >
                  <View style={styles.menuIcon}>
                    <Feather name="user" size={15} color={KFitColors.accent} />
                  </View>
                  <Text style={styles.menuText}>Profile</Text>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color={KFitColors.mutedText}
                  />
                </TouchableOpacity>

                {/* Dashboard */}
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => {
                    closePanel();
                    router.replace("/trainer-dashboard" as any);
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={styles.menuIcon}>
                    <Feather name="home" size={15} color={KFitColors.accent} />
                  </View>
                  <Text style={styles.menuText}>Dashboard</Text>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color={KFitColors.mutedText}
                  />
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* Settings accordion */}
                <AccordionSection
                  title="Settings"
                  icon="settings"
                  expanded={settingsOpen}
                  onToggle={() =>
                    toggleAccordion(setSettingsOpen, settingsOpen)
                  }
                >
                  {settingsLinks.map((link) => (
                    <SubLinkRow key={link.label} link={link} />
                  ))}
                </AccordionSection>

                <View style={styles.divider} />

                {/* Help & Support accordion */}
                <AccordionSection
                  title="Help & Support"
                  icon="help-circle"
                  expanded={supportOpen}
                  onToggle={() => toggleAccordion(setSupportOpen, supportOpen)}
                >
                  {supportLinks.map((link) => (
                    <SubLinkRow key={link.label} link={link} />
                  ))}
                </AccordionSection>

                <View style={styles.divider} />

                {/* Logout */}
                <TouchableOpacity
                  style={styles.menuRow}
                  disabled={isSigningOut}
                  onPress={() => {
                    closePanel();
                    logout();
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={styles.menuIconDanger}>
                    <Feather
                      name="log-out"
                      size={15}
                      color={KFitColors.error}
                    />
                  </View>
                  <Text style={[styles.menuText, { color: KFitColors.error }]}>
                    {isSigningOut ? "Signing out…" : "Log out"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/* ───────────────────────── Styles ───────────────────────── */

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  divider: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 6,
  },

  /* Header bar */
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: KFitColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  brandIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#181818",
    borderWidth: 1,
    borderColor: KFitColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogo: { width: 34, height: 34 },
  titleBlock: { flex: 1, minWidth: 0 },
  brandTitle: {
    color: KFitColors.text,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: KFitColors.mutedText,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: KFitColors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "900",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.accent + "66",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: KFitColors.accent,
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "monospace",
  },

  /* Dropdown shell */
  backdrop: {
    flex: 1,
    alignItems: "flex-end",
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  panel: {
    width: "100%",
    maxWidth: 340,
    gap: 2,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  panelTitle: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  panelAction: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "700",
  },

  /* Notifications */
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 10,
    borderRadius: 12,
  },
  notifRowUnread: {
    backgroundColor: KFitColors.background + "66",
  },
  notifIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  notifIconUnread: {
    backgroundColor: KFitColors.accent + "1A",
    borderColor: KFitColors.accent + "55",
  },
  notifTitle: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  notifBody: {
    color: KFitColors.mutedText,
    fontSize: 12,
    marginTop: 2,
  },
  notifTime: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KFitColors.accent,
    marginTop: 4,
  },
  emptyNotifications: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyBody: {
    color: KFitColors.mutedText,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },

  /* Profile card */
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    color: KFitColors.onAccent,
    fontSize: 15,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  profileName: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  profileRole: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },

  /* Menu rows */
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "4D",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconDanger: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: KFitColors.error + "1A",
    borderWidth: 1,
    borderColor: KFitColors.error + "4D",
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    flex: 1,
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "700",
  },

  /* Accordion */
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  accordionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "4D",
    alignItems: "center",
    justifyContent: "center",
  },
  accordionTitle: {
    flex: 1,
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  accordionBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: KFitColors.error,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  accordionBadgeText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "900",
  },
  accordionBody: {
    marginLeft: 20,
    marginTop: 2,
    marginBottom: 4,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: KFitColors.border,
    gap: 2,
  },

  /* Sub rows */
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  subIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  subLabel: { color: KFitColors.text, fontSize: 12, fontWeight: "600" },
  subHint: { color: KFitColors.mutedText, fontSize: 10, marginTop: 1 },
  subValue: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "700",
    marginRight: 4,
  },
});
