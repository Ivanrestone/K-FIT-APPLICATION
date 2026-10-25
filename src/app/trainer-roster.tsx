import TrainerScreenShell from "@/components/TrainerScreenShell";
import { KFitColors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

type Client = {
  id: string;
  name: string;
  plan: string;
  status: "Active" | "Expired";
  visits: number;
  next: string;
};

const CLIENTS: Client[] = [
  {
    id: "KF-8801",
    name: "Alex Mercer",
    plan: "VIP Cyber Elite",
    status: "Active",
    visits: 42,
    next: "Today 4:30 PM",
  },
  {
    id: "KF-8802",
    name: "Sarah Jenkins",
    plan: "Monthly Standard",
    status: "Active",
    visits: 18,
    next: "Today 11:00 AM",
  },
  {
    id: "KF-8803",
    name: "Devon Miles",
    plan: "VIP Cyber Elite",
    status: "Active",
    visits: 89,
    next: "Today 2:00 PM",
  },
  {
    id: "KF-8804",
    name: "Kira Nerys",
    plan: "Day Pass",
    status: "Expired",
    visits: 4,
    next: "None booked",
  },
];

export default function TrainerRosterScreen() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = CLIENTS.filter(
    (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
  );

  return (
    <TrainerScreenShell
      eyebrow="DATABASE"
      title="Member Roster"
      activeRoute="/trainer-roster"
    >
      <View style={styles.search}>
        <Feather name="search" size={14} color={KFitColors.mutedText} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search members by name or ID..."
          placeholderTextColor={KFitColors.mutedText}
        />
      </View>

      {filtered.length === 0 ? (
        <Text style={styles.empty}>No members match your search.</Text>
      ) : (
        filtered.map((c) => {
          const active = c.status === "Active";
          const tone = active ? KFitColors.accent : KFitColors.error;
          return (
            <View key={c.id} style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{c.id.split("-")[1]}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.meta}>
                  {c.plan} • {c.visits} visits
                </Text>
                <Text style={styles.next}>Next: {c.next}</Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: tone + "1A", borderColor: tone + "55" },
                ]}
              >
                <Text style={[styles.badgeText, { color: tone }]}>
                  {c.status}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </TrainerScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    color: KFitColors.text,
    fontSize: 13,
  },
  empty: {
    color: KFitColors.mutedText,
    textAlign: "center",
    paddingVertical: 24,
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: KFitColors.accent,
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  name: { color: KFitColors.text, fontSize: 14, fontWeight: "800" },
  meta: { color: KFitColors.mutedText, fontSize: 11, marginTop: 2 },
  next: {
    color: KFitColors.accent,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: "700", fontFamily: "monospace" },
});
