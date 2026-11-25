import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme } from "./theme";

type Props = {
  displayName: string;
  membershipActive: boolean;
  weeklyAttendanceDays: number;
  weeklyGoal: number;
  weeklyProgress: number;
};

export function HeroCard({
  displayName,
  membershipActive,
  weeklyAttendanceDays,
  weeklyGoal,
  weeklyProgress,
}: Props) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroTopRow}>
        <View
          style={[
            styles.heroBadge,
            {
              backgroundColor: membershipActive
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
            },
          ]}
        >
          <MaterialCommunityIcons
            name={membershipActive ? "shield-star" : "shield-off"}
            size={14}
            color={membershipActive ? Theme.success : Theme.error}
          />
          <Text
            style={[
              styles.heroBadgeText,
              { color: membershipActive ? Theme.success : Theme.error },
            ]}
          >
            {membershipActive ? "MEMBERSHIP ACTIVE" : "MEMBERSHIP EXPIRED"}
          </Text>
        </View>
        <View style={styles.goalContainer}>
          <Text style={styles.goalText}>WEEKLY GOAL</Text>
          <Text style={styles.goalCount}>
            {weeklyAttendanceDays} / {weeklyGoal} days
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${weeklyProgress}%` }]}
            />
          </View>
        </View>
      </View>
      <View style={styles.heroActionArea}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Ready to train, {displayName}?</Text>
          <Text style={styles.heroSubtitle}>
            {membershipActive
              ? "Scan at the gate to check in."
              : "Renew your membership to enter the gym."}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.scanBtn,
            {
              backgroundColor: membershipActive
                ? Theme.accent
                : Theme.surfaceHigh,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            membershipActive ? "Open gym check-in QR code" : "Renew membership"
          }
          onPress={() =>
            router.push(membershipActive ? "/member/qr" : "/member/membership")
          }
        >
          <Ionicons
            name={membershipActive ? "qr-code" : "card"}
            size={26}
            color={membershipActive ? Theme.accentText : Theme.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: Theme.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Theme.accentBorder,
  },
  heroTopRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroBadgeText: {
    flexShrink: 1,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  goalContainer: { alignItems: "flex-end", minWidth: 92 },
  goalText: {
    fontSize: 9,
    fontWeight: "800",
    color: Theme.textMuted,
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  goalCount: {
    fontSize: 11,
    fontWeight: "700",
    color: Theme.text,
    marginBottom: 5,
  },
  progressBarBg: {
    width: 92,
    height: 6,
    backgroundColor: Theme.surfaceHigh,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Theme.accent,
    borderRadius: 3,
  },
  heroActionArea: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Theme.text,
    marginBottom: 4,
    lineHeight: 26,
  },
  heroSubtitle: { fontSize: 12, color: Theme.textMuted, lineHeight: 17 },
  scanBtn: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
