import { KFitColors } from "@/constants/theme";
import {
    markAllNoticesRead,
    timeAgo,
    useNotices,
} from "@/lib/challenges-store";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

type MemberHeaderProps = {
  name: string;
  tier: string;
  streakDays: number;
  points: number;
  checkedIn: boolean;
  isSigningOut: boolean;
  onLogout: () => void;
  notifications: MemberLocalNotification[];
  setNotifications: React.Dispatch<
    React.SetStateAction<MemberLocalNotification[]>
  >;
};

export default function MemberHeader({
  name,
  tier,
  streakDays,
  points,
  checkedIn,
  isSigningOut,
  onLogout,
  notifications,
  setNotifications,
}: MemberHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { notices: challengeNotices, unread: challengeUnread } =
    useNotices("member");

  const localUnread = notifications.filter((n) => !n.read).length;
  const unread = localUnread + challengeUnread;

  const feed = [
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
      source: n.source ?? "system",
      senderName:
        n.senderName ?? (n.source === "trainer" ? "Your Trainer" : "K-Fit"),
    })),
  ]
    .sort((a, b) => Number(a.read) - Number(b.read))
    .slice(0, 10);

  const toggleNotifications = () => {
    void Haptics.selectionAsync();
    const opening = !showNotifications;
    setShowNotifications(opening);

    if (opening && unread > 0) {
      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true,
        })),
      );
      markAllNoticesRead("member");
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")}
              </Text>
            </View>
            <View
              style={[
                styles.presenceDot,
                {
                  backgroundColor: checkedIn ? C.accent : "#6B7280",
                },
              ]}
            />
          </View>

          <View>
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
        </View>

        <View style={styles.topRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={toggleNotifications}
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${unread} unread`}
          >
            <Feather name="bell" size={16} color={C.muted} />
            {unread > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unread > 99 ? "99+" : unread}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            disabled={isSigningOut}
            onPress={onLogout}
            accessibilityRole="button"
            accessibilityLabel="Logout"
          >
            <Feather name="log-out" size={16} color={C.error} />
          </TouchableOpacity>
        </View>
      </View>

      {showNotifications && (
        <View style={styles.notifPanel}>
          <View style={styles.notifHeader}>
            <Text style={styles.notifTitle}>Notifications</Text>
            <TouchableOpacity
              onPress={() => setShowNotifications(false)}
              accessibilityLabel="Close notifications"
            >
              <Feather name="x" size={16} color={C.muted} />
            </TouchableOpacity>
          </View>

          {feed.length === 0 ? (
            <Text style={styles.emptyText}>You&apos;re all caught up.</Text>
          ) : (
            feed.map((notification) => (
              <View
                key={notification.id}
                style={[
                  styles.notifItem,
                  !notification.read && styles.unreadNotifItem,
                  notification.source === "trainer" && styles.trainerNotifItem,
                ]}
              >
                <View style={styles.notifRow}>
                  <View style={styles.notifTitleGroup}>
                    <Text style={styles.notifItemTitle}>
                      {notification.title}
                    </Text>

                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={styles.notifTime}>{notification.time}</Text>
                </View>

                <Text style={styles.notifSender}>
                  {notification.source === "trainer"
                    ? `Message from ${notification.senderName}`
                    : notification.senderName}
                </Text>

                <Text style={styles.notifMsg}>{notification.msg}</Text>

                {notification.source === "trainer" && (
                  <View style={styles.trainerTag}>
                    <Feather name="message-circle" size={11} color={C.accent} />
                    <Text style={styles.trainerTagText}>TRAINER UPDATE</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 20,
    elevation: 10,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  avatarRing: {
    width: 42,
    height: 42,
  },
  avatar: {
    flex: 1,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: C.accent,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: C.accent,
    fontWeight: "900",
    fontSize: 14,
  },
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  topName: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
  },
  topSub: {
    color: C.muted,
    fontSize: 10,
  },
  vipBadge: {
    backgroundColor: C.accent + "33",
    borderColor: C.accent + "4D",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  vipBadgeText: {
    color: C.accent,
    fontSize: 8,
    fontWeight: "900",
  },
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
  bellBadgeText: {
    color: C.bg,
    fontSize: 9,
    fontWeight: "900",
  },
  notifPanel: {
    position: "absolute",
    top: 64,
    right: 16,
    left: 16,
    zIndex: 50,
    elevation: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  notifTitle: {
    color: C.text,
    fontSize: 12,
    fontWeight: "700",
  },
  notifItem: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  notifRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  notifTitleGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  notifItemTitle: {
    color: C.accent,
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
  },
  unreadNotifItem: {
    borderColor: C.accent,
    borderLeftWidth: 3,
  },
  trainerNotifItem: {
    backgroundColor: C.surface,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.accent,
  },
  notifSender: {
    color: C.accent,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },
  notifTime: {
    color: C.muted,
    fontSize: 9,
  },
  notifMsg: {
    color: C.muted,
    fontSize: 11,
  },
  trainerTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    marginTop: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: C.accent + "18",
  },
  trainerTagText: {
    color: C.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  emptyText: {
    color: C.muted,
    fontSize: 12,
    paddingVertical: 8,
  },
});
