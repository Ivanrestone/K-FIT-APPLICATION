// components/coach/dashboard/DashboardHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Theme } from "./theme";

type Props = {
  greeting: string;
  name: string;
  date: string;
};

export function DashboardHeader({ greeting, name, date }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.identity}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        </View>
        <View style={styles.datePill}>
          <Ionicons name="calendar-outline" size={14} color={Theme.accent} />
          <Text style={styles.dateText}>{date}</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>
        Your coaching day, all in one place.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.accentBorder,
    padding: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  identity: { flex: 1, minWidth: 0 },
  greeting: { fontSize: 13, color: Theme.textMuted, fontWeight: "600" },
  name: {
    fontSize: 26,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.5,
    textTransform: "capitalize",
  },
  subtitle: {
    fontSize: 12,
    color: Theme.textMuted,
    marginTop: 12,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Theme.surfaceAlt,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  dateText: { color: Theme.textMuted, fontSize: 10, fontWeight: "700" },
});
