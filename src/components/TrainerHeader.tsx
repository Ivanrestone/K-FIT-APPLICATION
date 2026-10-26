import { KFitColors } from "@/constants/theme";
import { useLogout } from "@/hooks/use-logout";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FeatherIconName = keyof typeof Feather.glyphMap;

type AppNotification = {
  id: string;
  icon: FeatherIconName;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

// Demo data. Replace with notifications from your backend.
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    icon: "clock",
    title: "Session starting soon",
    body: "Devon Miles at 2:00 PM, Powerlifting.",
    time: "5m ago",
    read: false,
  },
  {
    id: "n2",
    icon: "user-plus",
    title: "New booking",
    body: "Kira Nerys booked a 1-on-1 for Friday.",
    time: "32m ago",
    read: false,
  },
  {
    id: "n3",
    icon: "bell",
    title: "Gym announcement",
    body: "Studio B is closed for cleaning at 6 PM.",
    time: "2h ago",
    read: true,
  },
];

type Props = {
  /** Show a back arrow instead of the brand block (for detail screens). */
  showBack?: boolean;
  /** Override the small subtitle under the brand title. */
  subtitle?: string;
};

export default function TrainerHeader({
  showBack = false,
  subtitle = "COACH WORKSPACE",
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSigningOut, logout } = useLogout();

  const [panel, setPanel] = useState<"notifications" | "profile" | null>(null);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unread = notifications.filter((n) => !n.read).length;
  const closePanel = () => setPanel(null);

  const openPanel = (next: "notifications" | "profile") => {
    void Haptics.selectionAsync();
    setPanel(next);
  };

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

  const markAllRead = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Modal content is not inside SafeAreaView, so offset by the top inset
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
              <Text style={styles.badgeText}>{unread}</Text>
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

                {notifications.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={styles.notifRow}
                    onPress={() => markRead(n.id)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                  >
                    <View
                      style={[
                        styles.notifIcon,
                        !n.read && styles.notifIconUnread,
                      ]}
                    >
                      <Feather
                        name={n.icon}
                        size={15}
                        color={
                          n.read ? KFitColors.mutedText : KFitColors.accent
                        }
                      />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.notifTitle}>{n.title}</Text>
                      <Text style={styles.notifBody}>{n.body}</Text>
                      <Text style={styles.notifTime}>{n.time}</Text>
                    </View>
                    {!n.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))}
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

                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => {
                    closePanel();
                    router.replace("/trainer-dashboard" as any);
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Feather name="home" size={16} color={KFitColors.text} />
                  <Text style={styles.menuText}>Dashboard</Text>
                </TouchableOpacity>

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
                  <Feather name="log-out" size={16} color={KFitColors.error} />
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

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
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
  brandLogo: {
    width: 34,
    height: 34,
  },
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
  badgeText: { color: "#000", fontSize: 9, fontWeight: "900" },
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

  /* Dropdown panels */
  backdrop: {
    flex: 1,
    alignItems: "flex-end",
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  panel: {
    width: "100%",
    maxWidth: 340,
    gap: 4,
    padding: 14,
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
  panelAction: { color: KFitColors.accent, fontSize: 11, fontWeight: "700" },
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 10,
    borderRadius: 12,
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
  notifTitle: { color: KFitColors.text, fontSize: 13, fontWeight: "700" },
  notifBody: { color: KFitColors.mutedText, fontSize: 12, marginTop: 2 },
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
  profileName: { color: KFitColors.text, fontSize: 14, fontWeight: "800" },
  profileRole: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  menuText: { color: KFitColors.text, fontSize: 13, fontWeight: "700" },
});
