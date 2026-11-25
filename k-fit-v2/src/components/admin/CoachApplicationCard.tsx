import { CoachApplication } from "@/hooks/useAdminCoachApplications";
import { useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Theme } from "./theme";

type Props = {
  application: CoachApplication;
  onPress: () => void;
};

const STATUS_COLORS = {
  pending: Theme.warning,
  approved: Theme.success,
  rejected: Theme.error,
};

export function CoachApplicationCard({ application, onPress }: Props) {
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const name =
    application.user?.first_name || application.user?.last_name
      ? `${application.user?.first_name || ""} ${application.user?.last_name || ""}`.trim()
      : "Unknown Applicant";

  const initial = name.charAt(0).toUpperCase();

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
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>
              {application.user?.email || "No email"}
            </Text>
            <Text style={styles.experience} numberOfLines={1}>
              {application.experience || "No experience listed"}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <View
            style={[
              styles.badge,
              { backgroundColor: `${STATUS_COLORS[application.status]}20` },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: STATUS_COLORS[application.status] },
              ]}
            >
              {application.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.date}>
            {new Date(application.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </Text>
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
    backgroundColor: Theme.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  leftSection: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Theme.accent, fontSize: 18, fontWeight: "900" },
  name: { fontSize: 15, fontWeight: "800", color: Theme.text, marginBottom: 2 },
  email: { fontSize: 12, color: Theme.textMuted, marginBottom: 4 },
  experience: { fontSize: 12, color: Theme.textMuted, fontStyle: "italic" },
  rightSection: { alignItems: "flex-end", gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  date: { fontSize: 11, color: Theme.textMuted, fontWeight: "500" },
});
