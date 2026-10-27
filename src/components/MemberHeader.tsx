import { MEMBER_ROUTES as R } from "@/constants/member-routes";
import { KFitColors } from "@/constants/theme";
import {
  markAllNoticesRead,
  timeAgo,
  useNotices,
} from "@/lib/challenges-store";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ───────────────────────── Theme & types ───────────────────────── */

const C = {
  bg: KFitColors.background,
  surface: KFitColors.surface,
  border: KFitColors.border,
  text: KFitColors.text,
  muted: KFitColors.mutedText,
  accent: KFitColors.accent,
  error: KFitColors.error,
  amber: "#F59E0B",
};

export type MemberLocalNotification = {
  id: number;
  title: string;
  msg: string;
  time: string;
  read: boolean;
  senderName?: string;
  source?: "trainer" | "attendance" | "challenge" | "system";
};

type FeedItem = {
  id: string;
  title: string;
  msg: string;
  time: string;
  read: boolean;
  source: NonNullable<MemberLocalNotification["source"]>;
  senderName: string;
};

type PanelKind = "notifications" | "profile";

type MemberHeaderProps = {
  name: string;
  tier: string;
  streakDays: number;
  points: number;
  checkedIn: boolean;
  isSigningOut: boolean;
  onLogout: () => void;
  activeRoute?: string;
  notifications?: MemberLocalNotification[];
  setNotifications: React.Dispatch<
    React.SetStateAction<MemberLocalNotification[]>
  >;
};

type AccountLink = {
  label: string;
  hint: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
};

/**
 * Avatar dropdown rows. Profile + Membership + Payments all live here.
 * Payments was moved out of the bottom nav to avoid duplication.
 */
const ACCOUNT_LINKS: AccountLink[] = [
  {
    label: "Profile",
    hint: "Your details & goals",
    icon: "user",
    route: R.profile,
  },
  {
    label: "Membership",
    hint: "Plan, billing & renewals",
    icon: "credit-card",
    route: R.membership,
  },
  {
    label: "Payments",
    hint: "Invoices, receipts & history",
    icon: "dollar-sign",
    route: R.payments,
  },
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ───────────────────────── Notifications panel ───────────────────────── */

function NotificationsPanel({
  feed,
  unread,
  challengeUnread,
  activeRoute,
  onMarkAllRead,
  onChallenges,
}: {
  feed: FeedItem[];
  unread: number;
  challengeUnread: number;
  activeRoute?: string;
  onMarkAllRead: () => void;
  onChallenges: () => void;
}) {
  const challengesActive = activeRoute === R.challenges;

  return (
    <>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>NOTIFICATIONS</Text>
        <TouchableOpacity
          onPress={onMarkAllRead}
          disabled={unread === 0}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications as read"
        >
          <Text style={[styles.panelAction, unread === 0 && styles.dimmed]}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {feed.length === 0 ? (
        <View style={styles.emptyNotifications}>
          <Feather name="bell-off" size={22} color={C.muted} />
          <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
          <Text style={styles.emptyBody}>
            Trainer messages and challenge updates appear here.
          </Text>
        </View>
      ) : (
        feed.map((n) => (
          <View
            key={n.id}
            style={[
              styles.notifRow,
              !n.read && styles.notifRowUnread,
              n.source === "trainer" && styles.notifRowTrainer,
            ]}
          >
            <View style={[styles.notifIcon, !n.read && styles.notifIconUnread]}>
              <Feather
                name={
                  n.source === "trainer"
                    ? "message-circle"
                    : n.source === "challenge"
                      ? "flag"
                      : "bell"
                }
                size={15}
                color={n.read ? C.muted : C.accent}
              />
            </View>

            <View style={styles.flex}>
              <View style={styles.notifTitleRow}>
                <Text style={styles.notifTitle}>{n.title}</Text>
                {!n.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notifSender}>{n.senderName}</Text>
              <Text style={styles.notifBody}>{n.msg}</Text>
              <Text style={styles.notifTime}>{n.time}</Text>
            </View>
          </View>
        ))
      )}

      <View style={styles.divider} />
      <TouchableOpacity
        style={[styles.menuRow, challengesActive && styles.menuRowActive]}
        onPress={onChallenges}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Open challenges"
      >
        <View style={styles.menuIcon}>
          <Feather name="flag" size={15} color={C.accent} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.menuText}>Challenges</Text>
          <Text style={styles.menuHint}>Races, rankings & rewards</Text>
        </View>
        {challengeUnread > 0 && (
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>
              {challengeUnread > 9 ? "9+" : challengeUnread}
            </Text>
          </View>
        )}
        <Feather name="chevron-right" size={16} color={C.muted} />
      </TouchableOpacity>
    </>
  );
}

/* ───────────────────────── Account panel ───────────────────────── */

function AccountPanel({
  name,
  tier,
  streakDays,
  initials,
  isSigningOut,
  activeRoute,
  onNavigate,
  onLogout,
}: {
  name: string;
  tier: string;
  streakDays: number;
  initials: string;
  isSigningOut: boolean;
  activeRoute?: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}) {
  return (
    <>
      <View style={styles.profileTop}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{initials}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileRole}>
            {tier} member • {streakDays} day streak
          </Text>
        </View>
      </View>

      {ACCOUNT_LINKS.map((link) => {
        const active = activeRoute === link.route;
        return (
          <TouchableOpacity
            key={link.route}
            style={[styles.menuRow, active && styles.menuRowActive]}
            onPress={() => onNavigate(link.route)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={link.label}
          >
            <View style={[styles.menuIcon, active && styles.menuIconActive]}>
              <Feather
                name={link.icon}
                size={15}
                color={active ? KFitColors.onAccent : C.accent}
              />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.menuText, active && { color: C.accent }]}>
                {link.label}
              </Text>
              <Text style={styles.menuHint}>{link.hint}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={C.muted} />
          </TouchableOpacity>
        );
      })}

      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.menuRow}
        disabled={isSigningOut}
        onPress={onLogout}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <View style={[styles.menuIcon, styles.menuIconDanger]}>
          <Feather name="log-out" size={15} color={C.error} />
        </View>
        <Text style={[styles.menuText, { color: C.error }]}>
          {isSigningOut ? "Signing out…" : "Log out"}
        </Text>
      </TouchableOpacity>
    </>
  );
}

/* ───────────────────────── Header ───────────────────────── */

export default function MemberHeader({
  name,
  tier,
  streakDays,
  points,
  checkedIn,
  isSigningOut,
  onLogout,
  activeRoute,
  notifications = [],
  setNotifications,
}: MemberHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [panel, setPanel] = useState<PanelKind | null>(null);

  const { notices: challengeNotices, unread: challengeUnread } =
    useNotices("member");

  const unread = notifications.filter((n) => !n.read).length + challengeUnread;
  const initials = getInitials(name);

  const feed: FeedItem[] = [
    ...challengeNotices.map((n) => ({
      id: `challenge-${n.id}`,
      title: n.title,
      msg: n.body,
      time: timeAgo(n.createdAt),
      read: n.read,
      source: "challenge" as const,
      senderName: "K-Fit",
    })),
    ...notifications.map((n) => ({
      id: `${n.source ?? "system"}-${n.id}`,
      title: n.title,
      msg: n.msg,
      time: n.time,
      read: n.read,
      source: n.source ?? ("system" as const),
      senderName:
        n.senderName ?? (n.source === "trainer" ? "Your Trainer" : "K-Fit"),
    })),
  ]
    .sort((a, b) => Number(a.read) - Number(b.read))
    .slice(0, 10);

  const openPanel = (next: PanelKind) => {
    void Haptics.selectionAsync();
    setPanel(next);
  };
  const closePanel = () => setPanel(null);

  const markAllRead = () => {
    if (unread === 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNoticesRead("member");
  };

  const navigateTo = (route: string) => {
    closePanel();
    if (route === activeRoute) return;
    void Haptics.selectionAsync();
    router.replace(route as any);
  };

  const handleLogout = () => {
    closePanel();
    onLogout();
  };

  const panelTop = insets.top + 62;

  return (
    <>
      <View style={styles.topBar}>
        {/* LEFT: name, tier, streak */}
        <View style={styles.titleBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.topName} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.vipBadge}>
              <Text style={styles.vipBadgeText}>{tier}</Text>
            </View>
          </View>
          <View style={styles.nameRow}>
            <Feather name="zap" size={10} color={C.amber} />
            <Text style={styles.topSub}>
              {streakDays} day streak • {points} pts
            </Text>
          </View>
        </View>

        {/* RIGHT 1: bell → notifications */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => openPanel("notifications")}
          accessibilityRole="button"
          accessibilityLabel={`Notifications, ${unread} unread`}
          activeOpacity={0.7}
        >
          <Feather name="bell" size={16} color={C.accent} />
          {unread > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unread > 99 ? "99+" : unread}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* RIGHT 2: avatar → account menu (Profile, Membership, Payments, Log out) */}
        <TouchableOpacity
          style={styles.avatarRing}
          onPress={() => openPanel("profile")}
          accessibilityRole="button"
          accessibilityLabel="Open account menu"
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View
            style={[
              styles.presenceDot,
              { backgroundColor: checkedIn ? C.accent : "#6B7280" },
            ]}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={panel !== null}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={closePanel}
      >
        <Pressable
          style={[styles.backdrop, { alignItems: "flex-end" }]}
          onPress={closePanel}
        >
          <Pressable
            style={[styles.panel, { marginTop: panelTop }]}
            onPress={() => {}}
          >
            {panel === "notifications" && (
              <NotificationsPanel
                feed={feed}
                unread={unread}
                challengeUnread={challengeUnread}
                activeRoute={activeRoute}
                onMarkAllRead={markAllRead}
                onChallenges={() => navigateTo(R.challenges)}
              />
            )}
            {panel === "profile" && (
              <AccountPanel
                name={name}
                tier={tier}
                streakDays={streakDays}
                initials={initials}
                isSigningOut={isSigningOut}
                activeRoute={activeRoute}
                onNavigate={navigateTo}
                onLogout={handleLogout}
              />
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
  dimmed: { opacity: 0.4 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 6 },

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  titleBlock: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  topName: { color: C.text, fontSize: 13, fontWeight: "700", flexShrink: 1 },
  topSub: { color: C.muted, fontSize: 10 },
  vipBadge: {
    backgroundColor: C.accent + "33",
    borderColor: C.accent + "4D",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  vipBadgeText: { color: C.accent, fontSize: 8, fontWeight: "900" },

  /* Bell */
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.amber,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: C.bg, fontSize: 9, fontWeight: "900" },

  /* Avatar (right) */
  avatarRing: { width: 42, height: 42 },
  avatar: {
    flex: 1,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: C.accent,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: C.accent, fontWeight: "900", fontSize: 14 },
  presenceDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.surface,
  },

  /* Dropdown shell */
  backdrop: {
    flex: 1,
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
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  panelTitle: {
    color: C.text,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  panelAction: { color: C.accent, fontSize: 11, fontWeight: "700" },

  /* Notifications */
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 10,
    borderRadius: 12,
  },
  notifRowUnread: { backgroundColor: C.bg + "66" },
  notifRowTrainer: { borderLeftWidth: 2, borderLeftColor: C.accent },
  notifIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  notifIconUnread: {
    backgroundColor: C.accent + "1A",
    borderColor: C.accent + "55",
  },
  notifTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  notifTitle: { color: C.text, fontSize: 13, fontWeight: "700", flexShrink: 1 },
  notifSender: {
    color: C.accent,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  notifBody: { color: C.muted, fontSize: 12, marginTop: 2 },
  notifTime: {
    color: C.muted,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
  },
  emptyNotifications: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: { color: C.text, fontSize: 13, fontWeight: "700" },
  emptyBody: {
    color: C.muted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },

  /* Account */
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    color: KFitColors.onAccent,
    fontSize: 15,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  profileName: { color: C.text, fontSize: 13, fontWeight: "800" },
  profileRole: {
    color: C.accent,
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
  menuRowActive: { backgroundColor: C.accent + "1F" },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.accent + "1A",
    borderWidth: 1,
    borderColor: C.accent + "4D",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconActive: { backgroundColor: C.accent, borderColor: C.accent },
  menuIconDanger: {
    backgroundColor: C.error + "1A",
    borderColor: C.error + "4D",
  },
  menuText: { color: C.text, fontSize: 13, fontWeight: "700" },
  menuHint: { color: C.muted, fontSize: 10, marginTop: 1 },
  menuBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: C.error,
    alignItems: "center",
    justifyContent: "center",
  },
  menuBadgeText: { color: "#000", fontSize: 9, fontWeight: "900" },
});
