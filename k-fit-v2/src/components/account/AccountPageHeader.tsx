import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AccountTheme } from "./theme";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

export function AccountPageHeader({
  eyebrow = "K-FIT",
  title,
  subtitle,
  onBack = () => router.back(),
}: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={20} color={AccountTheme.text} />
      </Pressable>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AccountTheme.border,
    backgroundColor: AccountTheme.surface,
  },
  pressed: { opacity: 0.7 },
  copy: { flex: 1 },
  eyebrow: {
    color: AccountTheme.accent,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  title: { color: AccountTheme.text, fontSize: 22, fontWeight: "900", marginTop: 2 },
  subtitle: { color: AccountTheme.textMuted, fontSize: 11, marginTop: 3 },
});
