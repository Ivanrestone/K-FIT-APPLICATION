import { StyleSheet, Text, View } from "react-native";
import { Theme } from "./theme";

type Props = {
  title: string;
  name: string;
};

export function PageHeader({ title, name }: Props) {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.eyebrow}>ADMIN OVERVIEW</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.greeting} numberOfLines={1}>
          {greeting}, {name}
        </Text>
      </View>
      <View style={styles.dateBadge}>
        <Text style={styles.weekday}>
          {now
            .toLocaleDateString(undefined, { weekday: "short" })
            .toUpperCase()}
        </Text>
        <Text style={styles.day}>{now.getDate()}</Text>
        <Text style={styles.month}>
          {now
            .toLocaleDateString(undefined, { month: "short" })
            .toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  textBlock: { flex: 1, minWidth: 0 },
  eyebrow: {
    color: Theme.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: Theme.text,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
  },
  greeting: { color: Theme.textMuted, fontSize: 12, marginTop: 3 },
  dateBadge: {
    width: 58,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 16,
    paddingVertical: 8,
  },
  weekday: {
    color: Theme.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  day: {
    color: Theme.accent,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 25,
  },
  month: {
    color: Theme.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },
});
