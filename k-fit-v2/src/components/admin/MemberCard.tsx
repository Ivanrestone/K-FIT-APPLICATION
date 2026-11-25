import { Member } from "@/hooks/useAdminMembers";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  member: Member;
  onPress: () => void;
};

export function MemberCard({ member, onPress }: Props) {
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const initials =
    `${member.first_name?.[0] || ""}${member.last_name?.[0] || ""}`.toUpperCase() ||
    member.email?.[0]?.toUpperCase() ||
    "M";
  const displayName =
    member.first_name || member.last_name
      ? `${member.first_name || ""} ${member.last_name || ""}`.trim()
      : "New member";
  const isPending = member.approved !== true;
  const joinedDate = new Date(member.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.8}
        onPressIn={() =>
          Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
          }).start()
        }
      >
        <View style={styles.leftSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || "M"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  isPending ? styles.pendingBadge : styles.approvedBadge,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isPending ? "#F59E0B" : "#10B981" },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: isPending ? "#F59E0B" : "#10B981" },
                  ]}
                >
                  {isPending ? "Pending" : "Approved"}
                </Text>
              </View>
            </View>
            <Text style={styles.email} numberOfLines={1}>
              {member.email || "No email available"}
            </Text>
            <Text style={styles.joined}>Joined {joinedDate}</Text>
          </View>
        </View>

        <View
          style={[
            styles.action,
            isPending ? styles.reviewAction : styles.detailsAction,
          ]}
        >
          <Text style={[styles.actionText, isPending && styles.reviewText]}>
            {isPending ? "Review" : "Details"}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={isPending ? "#000000" : "#D1D5DB"}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111214",
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#24262A",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: "rgba(255,215,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFD700", fontSize: 16, fontWeight: "900" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  name: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pendingBadge: {
    backgroundColor: "rgba(245,158,11,0.1)",
  },
  approvedBadge: { backgroundColor: "rgba(16,185,129,0.1)" },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: { fontSize: 9, fontWeight: "800" },
  email: { fontSize: 12, color: "#A1A1AA", fontWeight: "500", marginTop: 4 },
  joined: { fontSize: 10, color: "#71717A", fontWeight: "600", marginTop: 4 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
  },
  reviewAction: { backgroundColor: "#FFD700" },
  detailsAction: { backgroundColor: "#202226" },
  actionText: { color: "#E4E4E7", fontSize: 10, fontWeight: "800" },
  reviewText: { color: "#000000" },
});
