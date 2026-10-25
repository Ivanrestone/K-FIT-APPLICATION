import TrainerScreenShell from "@/components/TrainerScreenShell";
import { KFitColors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type DutyStatus = "On Floor" | "In Session" | "On Break" | "Off Duty";

type Coach = {
  id: string;
  name: string;
  specialty: string;
  status: DutyStatus;
  rating: number;
  reviews: number;
  rate: string;
  bio: string;
  avatar: string;
};

const WARNING = "#F59E0B";
const PURPLE = "#8B5CF6";

const COACHES: Coach[] = [
  {
    id: "TR-101",
    name: "Marcus Vance",
    specialty: "Strength & Conditioning",
    status: "On Floor",
    rating: 4.9,
    reviews: 48,
    rate: "$45/hr",
    bio: "Ex-Olympic lifting coach specializing in compound biomechanics.",
    avatar: "MV",
  },
  {
    id: "TR-102",
    name: "Elena Rostova",
    specialty: "Functional HIIT",
    status: "In Session",
    rating: 5.0,
    reviews: 62,
    rate: "$50/hr",
    bio: "High intensity conditioning & endurance athlete specialist.",
    avatar: "ER",
  },
  {
    id: "TR-103",
    name: "Jaxson Reed",
    specialty: "Powerlifting",
    status: "On Floor",
    rating: 4.8,
    reviews: 35,
    rate: "$40/hr",
    bio: "State record holder. Maximize your deadlift & squat technique.",
    avatar: "JR",
  },
  {
    id: "TR-104",
    name: "Aria Chen",
    specialty: "Mobility & Rehab",
    status: "On Break",
    rating: 4.9,
    reviews: 51,
    rate: "$48/hr",
    bio: "Physical therapy background focused on joint health & recovery.",
    avatar: "AC",
  },
];

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Strength", value: "Strength & Conditioning" },
  { label: "HIIT", value: "Functional HIIT" },
  { label: "Powerlifting", value: "Powerlifting" },
  { label: "Mobility", value: "Mobility & Rehab" },
];

function tone(status: DutyStatus) {
  if (status === "On Floor") return KFitColors.accent;
  if (status === "In Session") return PURPLE;
  if (status === "On Break") return WARNING;
  return KFitColors.mutedText;
}

export default function TrainerTeamScreen() {
  const [filter, setFilter] = useState("all");
  const list =
    filter === "all" ? COACHES : COACHES.filter((c) => c.specialty === filter);

  return (
    <TrainerScreenShell
      eyebrow="COACH DIRECTORY"
      title="Trainers"
      activeRoute="/trainer-team"
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const selected = f.value === filter;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setFilter(f.value)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.chip, selected && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextActive]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {list.map((c) => {
        const t = tone(c.status);
        return (
          <View key={c.id} style={styles.card}>
            <View style={styles.top}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{c.avatar}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.specialty}>{c.specialty}</Text>
              </View>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: t + "1F", borderColor: t + "55" },
                ]}
              >
                <View style={[styles.pillDot, { backgroundColor: t }]} />
                <Text style={[styles.pillText, { color: t }]}>{c.status}</Text>
              </View>
            </View>
            <Text style={styles.bio}>{c.bio}</Text>
            <View style={styles.bottom}>
              <View style={styles.ratingRow}>
                <Feather name="star" size={13} color={WARNING} />
                <Text style={styles.rating}>{c.rating.toFixed(1)}</Text>
                <Text style={styles.reviews}>({c.reviews} reviews)</Text>
              </View>
              <Text style={styles.rate}>{c.rate}</Text>
            </View>
          </View>
        );
      })}
    </TrainerScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  filterRow: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  chipActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  chipText: { color: KFitColors.mutedText, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: KFitColors.onAccent, fontWeight: "800" },
  card: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: KFitColors.accent,
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  name: { color: KFitColors.text, fontSize: 14, fontWeight: "800" },
  specialty: {
    color: KFitColors.accent,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 10, fontWeight: "700", fontFamily: "monospace" },
  bio: { color: KFitColors.mutedText, fontSize: 12, lineHeight: 18 },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  rating: { color: WARNING, fontSize: 12, fontWeight: "800" },
  reviews: { color: KFitColors.mutedText, fontSize: 11 },
  rate: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "monospace",
  },
});
