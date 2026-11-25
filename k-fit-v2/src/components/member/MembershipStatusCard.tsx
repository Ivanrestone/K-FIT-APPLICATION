import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "./theme";

type MembershipStatus = "Active" | "Expired" | "Pending" | "Inactive";

type Props = {
  status: MembershipStatus | string;
  endDate: string | null;
};

const statusColor = (status: string) => {
  if (status === "Active") return Theme.success;
  if (status === "Pending") return Theme.warning;
  if (status === "Expired") return Theme.error;
  return Theme.textMuted;
};

export function MembershipStatusCard({ status, endDate }: Props) {
  const color = statusColor(status);
  const expirationLabel = endDate
    ? new Date(`${endDate}T00:00:00`).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Not available";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons
            name="shield-star-outline"
            size={20}
            color={color}
          />
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>MEMBERSHIP STATUS</Text>
          <Text style={[styles.status, { color }]}>{status}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Manage membership"
          onPress={() => router.push("/member/membership")}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>Manage</Text>
        </Pressable>
      </View>
      <View style={styles.divider} />
      <View style={styles.expiryRow}>
        <Text style={styles.expiryLabel}>Expires</Text>
        <Text style={styles.expiryDate}>{expirationLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 16,
    marginBottom: 18,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: Theme.surfaceHigh,
  },
  copy: { flex: 1 },
  eyebrow: {
    color: Theme.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  status: { fontSize: 15, fontWeight: "800", marginTop: 3 },
  action: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Theme.accentSoft,
  },
  actionText: { color: Theme.accent, fontSize: 11, fontWeight: "800" },
  pressed: { opacity: 0.7 },
  divider: { height: 1, backgroundColor: Theme.border, marginVertical: 14 },
  expiryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  expiryLabel: { color: Theme.textMuted, fontSize: 11 },
  expiryDate: {
    color: Theme.text,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
});
