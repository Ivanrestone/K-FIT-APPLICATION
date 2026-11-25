// app/coach/membership.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const Theme = {
  background: "#080808",
  surface: "#121212",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD700",
  border: "#222222",
};

export default function CoachMembershipScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { requireRole } = await import("@/lib/auth");
      const u = await requireRole("coach");
      if (!u) return;
      setUser(u);
      setLoading(false);
    })();
  }, []);

  if (loading || !user) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Theme.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace("/coach/dashboard")}
      >
        <Ionicons name="arrow-back" size={20} color={Theme.accent} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>My Membership</Text>
      <Text style={styles.subtitle}>Coach plan & billing</Text>

      <View style={styles.card}>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={16} color={Theme.accent} />
          <Text style={styles.badgeText}>ACTIVE</Text>
        </View>
        <Text style={styles.plan}>Trainer Pro</Text>
        <Text style={styles.price}>$29.99 / month</Text>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Account</Text>
          <Text style={styles.rowValue}>{user.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Renews</Text>
          <Text style={styles.rowValue}>Next month</Text>
        </View>
      </View>

      <Text style={styles.hint}>
        Billing management coming soon. Contact the gym admin for changes.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  center: { justifyContent: "center", alignItems: "center" },
  content: { padding: 20, paddingBottom: 120 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  backText: { color: Theme.accent, fontWeight: "700", fontSize: 14 },
  title: { fontSize: 26, fontWeight: "900", color: Theme.text },
  subtitle: {
    fontSize: 13,
    color: Theme.textMuted,
    marginTop: 4,
    marginBottom: 24,
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 20,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 215, 0, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: { color: Theme.accent, fontSize: 10, fontWeight: "900" },
  plan: { fontSize: 22, fontWeight: "800", color: Theme.text },
  price: { fontSize: 15, color: Theme.accent, fontWeight: "700", marginTop: 4 },
  divider: { height: 1, backgroundColor: Theme.border, marginVertical: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  rowLabel: { color: Theme.textMuted, fontSize: 13 },
  rowValue: { color: Theme.text, fontSize: 13, fontWeight: "600" },
  hint: {
    fontSize: 12,
    color: Theme.textMuted,
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});
