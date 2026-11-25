// components/coach/dashboard/PendingRequestCard.tsx
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "./theme";

type Props = { count: number; onReview: () => void };

export function PendingRequestCard({ count, onReview }: Props) {
  if (count <= 0) return null;

  return (
    <Pressable
      onPress={onReview}
      accessibilityRole="button"
      accessibilityLabel={`${count} pending client requests. Review.`}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="mail" size={18} color={Theme.warning} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          {count} new client {count === 1 ? "request" : "requests"}
        </Text>
        <Text style={styles.subtitle}>Review and accept to start coaching</Text>
      </View>
      <View style={styles.cta}>
        <Text style={styles.ctaText}>Review</Text>
        <Ionicons name="chevron-forward" size={14} color="#000" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  title: { fontSize: 14, fontWeight: "800", color: Theme.text },
  subtitle: { fontSize: 11, color: Theme.textMuted, marginTop: 2 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Theme.warning,
  },
  ctaText: { fontSize: 12, fontWeight: "800", color: "#000" },
});
