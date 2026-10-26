import TrainerScreenShell from "@/components/TrainerScreenShell";
import { KFitColors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const LEADERBOARD = [
  { rank: 1, name: "Devon Miles", score: "14,200 pts", badge: "Cyber Titan" },
  { rank: 2, name: "Alex Mercer", score: "12,850 pts", badge: "Power Demon" },
  {
    rank: 3,
    name: "Sarah Jenkins",
    score: "11,400 pts",
    badge: "Cardio Queen",
  },
  { rank: 4, name: "Liam Sterling", score: "9,900 pts", badge: "Top 10" },
  { rank: 5, name: "Zoe Thorne", score: "8,750 pts", badge: "Top 10" },
];

const MEDAL = ["#F59E0B", "#B3B3B3", "#CD7F32"];

export default function TrainerRanksScreen() {
  return (
    <TrainerScreenShell
      eyebrow="MONTHLY CYBER LEAGUE"
      title="Leaderboard"
      activeRoute="/trainer-ranks"
    >
      <View style={styles.challenge}>
        <View style={styles.challengeTop}>
          <Text style={styles.challengeBadge}>ACTIVE CHALLENGE</Text>
          <Text style={styles.challengeEnds}>Ends in 4 days</Text>
        </View>
        <Text style={styles.challengeTitle}>50KM Rower Sprint Challenge</Text>
        <Text style={styles.challengeDesc}>
          Accumulate 50,000 meters on any Concept2 Rower this month.
        </Text>
        <Text style={styles.challengeReward}>
          Reward: 500 K-Credits + VIP Locker
        </Text>
      </View>

      <Text style={styles.sectionLabel}>TOP ATHLETES</Text>
      {LEADERBOARD.map((p) => (
        <View key={p.rank} style={styles.row}>
          <View style={styles.rankBox}>
            {p.rank <= 3 ? (
              <Feather name="award" size={18} color={MEDAL[p.rank - 1]} />
            ) : (
              <Text style={styles.rankText}>#{p.rank}</Text>
            )}
          </View>
          <View style={styles.flex}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.badge}>{p.badge}</Text>
          </View>
          <Text style={styles.score}>{p.score}</Text>
        </View>
      ))}
    </TrainerScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  challenge: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  challengeTop: { flexDirection: "row", justifyContent: "space-between" },
  challengeBadge: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "monospace",
    backgroundColor: KFitColors.accent + "26",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  challengeEnds: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontFamily: "monospace",
  },
  challengeTitle: {
    color: KFitColors.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },
  challengeDesc: { color: KFitColors.mutedText, fontSize: 12, lineHeight: 17 },
  challengeReward: {
    color: KFitColors.accent,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  sectionLabel: {
    color: KFitColors.mutedText,
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: "monospace",
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
  rankBox: { width: 28, alignItems: "center" },
  rankText: {
    color: KFitColors.mutedText,
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  name: { color: KFitColors.text, fontSize: 14, fontWeight: "800" },
  badge: {
    color: KFitColors.accent,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },
  score: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "monospace",
  },
});
