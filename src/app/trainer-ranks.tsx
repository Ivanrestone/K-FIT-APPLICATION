import TrainerScreenShell from "@/components/TrainerScreenShell";
import { KFitColors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type Athlete = {
  rank: number;
  name: string;
  score: number;
  scoreLabel: string;
  badge: string;
};

const ATHLETES: Athlete[] = [
  {
    rank: 1,
    name: "Devon Miles",
    score: 14200,
    scoreLabel: "14,200 pts",
    badge: "Cyber Titan",
  },
  {
    rank: 2,
    name: "Alex Mercer",
    score: 12850,
    scoreLabel: "12,850 pts",
    badge: "Power Demon",
  },
  {
    rank: 3,
    name: "Sarah Jenkins",
    score: 11400,
    scoreLabel: "11,400 pts",
    badge: "Cardio Queen",
  },
  {
    rank: 4,
    name: "Liam Sterling",
    score: 9900,
    scoreLabel: "9,900 pts",
    badge: "Top 10",
  },
  {
    rank: 5,
    name: "Zoe Thorne",
    score: 8750,
    scoreLabel: "8,750 pts",
    badge: "Top 10",
  },
  {
    rank: 6,
    name: "Marcus Vance",
    score: 7420,
    scoreLabel: "7,420 pts",
    badge: "Strength Coach",
  },
];

const YOU_NAME = "Marcus Vance"; // pretend the logged-in trainer

const MEDAL = ["#F59E0B", "#B3B3B3", "#CD7F32"];
const MEDAL_DARK = ["#7C4A08", "#5B5B5B", "#6B4A2B"];

function medalTone(rank: number) {
  if (rank === 1) return MEDAL[0];
  if (rank === 2) return MEDAL[1];
  if (rank === 3) return MEDAL[2];
  return KFitColors.mutedText;
}

export default function TrainerRanksScreen() {
  const top3 = useMemo(() => ATHLETES.filter((a) => a.rank <= 3), []);
  const rest = useMemo(() => ATHLETES.filter((a) => a.rank > 3), []);
  const you = useMemo(
    () => ATHLETES.find((a) => a.name === YOU_NAME) ?? null,
    [],
  );

  return (
    <TrainerScreenShell
      eyebrow="MONTHLY CYBER LEAGUE"
      title="Leaderboard"
      activeRoute="/trainer-ranks"
    >
      {/* ── Stat strip ──────────────────────── */}
      <View style={styles.statCard}>
        <StatInline
          icon="users"
          label="Athletes"
          value={ATHLETES.length}
          tone={KFitColors.accent}
        />
        <View style={styles.statDivider} />
        <StatInline
          icon="award"
          label="Your rank"
          value={you ? `#${you.rank}` : "—"}
          tone={KFitColors.text}
          valueIsString
        />
        <View style={styles.statDivider} />
        <StatInline
          icon="zap"
          label="Your score"
          value={you ? you.scoreLabel.replace(" pts", "") : "—"}
          tone="#F59E0B"
          valueIsString
        />
        <View style={styles.statDivider} />
        <StatInline
          icon="clock"
          label="Ends in"
          value="4d"
          tone={KFitColors.mutedText}
          valueIsString
        />
      </View>

      {/* ── Challenge card ──────────────────── */}
      <View style={styles.challenge}>
        <View style={styles.challengeTop}>
          <View style={styles.challengeBadgeWrap}>
            <View style={styles.challengeBadgeDot} />
            <Text style={styles.challengeBadge}>ACTIVE CHALLENGE</Text>
          </View>
          <View style={styles.challengeEndsPill}>
            <Feather name="clock" size={10} color={KFitColors.mutedText} />
            <Text style={styles.challengeEnds}>4 days left</Text>
          </View>
        </View>

        <Text style={styles.challengeTitle}>50KM Rower Sprint Challenge</Text>
        <Text style={styles.challengeDesc}>
          Accumulate 50,000 meters on any Concept2 Rower this month.
        </Text>

        <View style={styles.challengeRewardRow}>
          <View style={styles.challengeRewardIcon}>
            <Feather name="gift" size={11} color={KFitColors.accent} />
          </View>
          <Text style={styles.challengeReward}>500 K-Credits + VIP Locker</Text>
        </View>
      </View>

      {/* ── Podium (Top 3) ──────────────────── */}
      <View style={styles.podiumSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Feather name="award" size={12} color={KFitColors.accent} />
          </View>
          <Text style={styles.sectionTitle}>Top athletes</Text>
          <View style={styles.flex} />
          <Text style={styles.sectionRight}>PODIUM</Text>
        </View>

        <View style={styles.podium}>
          {top3.map((a) => {
            const medal = medalTone(a.rank);
            return (
              <View
                key={a.rank}
                style={[
                  styles.podiumCard,
                  {
                    borderColor: medal + "55",
                    backgroundColor: medal + "08",
                  },
                ]}
              >
                <View
                  style={[
                    styles.podiumMedal,
                    {
                      backgroundColor: MEDAL_DARK[a.rank - 1] + "66",
                      borderColor: medal + "88",
                    },
                  ]}
                >
                  <Feather name="award" size={16} color={medal} />
                </View>
                <Text style={styles.podiumRank}>#{a.rank}</Text>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {a.name}
                </Text>
                <Text style={styles.podiumBadge} numberOfLines={1}>
                  {a.badge}
                </Text>
                <View style={styles.podiumScoreWrap}>
                  <Text style={[styles.podiumScore, { color: medal }]}>
                    {a.scoreLabel.split(" ")[0]}
                  </Text>
                  <Text style={styles.podiumScoreLabel}>pts</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Ranks 4+ ────────────────────────── */}
      <View style={styles.rankSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Feather name="list" size={12} color={KFitColors.accent} />
          </View>
          <Text style={styles.sectionTitle}>All ranks</Text>
          <View style={styles.flex} />
          <Text style={styles.sectionRight}>{rest.length} ATHLETES</Text>
        </View>

        <View style={styles.rankCard}>
          {rest.map((a, idx) => {
            const isYou = a.name === YOU_NAME;
            const isLast = idx === rest.length - 1;
            return (
              <View
                key={a.rank}
                style={[
                  styles.rankRow,
                  isYou && styles.rankRowYou,
                  !isLast && styles.rankRowDivider,
                ]}
              >
                <View style={[styles.rankBox, isYou && styles.rankBoxYou]}>
                  <Text style={[styles.rankText, isYou && styles.rankTextYou]}>
                    {a.rank}
                  </Text>
                </View>
                <View style={styles.flex}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {a.name}
                    </Text>
                    {isYou && (
                      <View style={styles.youChip}>
                        <Text style={styles.youChipText}>YOU</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.badge} numberOfLines={1}>
                    {a.badge}
                  </Text>
                </View>
                <Text style={styles.score}>{a.scoreLabel}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </TrainerScreenShell>
  );
}

/* ─────────── Small components ─────────── */
function StatInline({
  icon,
  label,
  value,
  tone,
  valueIsString,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: number | string;
  tone: string;
  valueIsString?: boolean;
}) {
  return (
    <View style={styles.statInline}>
      <View style={styles.statInlineHeader}>
        <Feather name={icon} size={10} color={tone} />
        <Text
          style={[
            styles.statInlineValue,
            { color: tone },
            valueIsString && styles.statInlineValueString,
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      <Text style={styles.statInlineLabel}>{label}</Text>
    </View>
  );
}

/* ─────────── Styles ─────────── */
const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },

  /* Stat strip */
  statCard: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  statInline: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 2,
  },
  statInlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statInlineValue: {
    fontSize: 15,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.3,
  },
  statInlineValueString: {
    fontSize: 12,
    letterSpacing: 0,
  },
  statInlineLabel: {
    fontSize: 8,
    color: KFitColors.mutedText,
    letterSpacing: 0.8,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 8,
  },

  /* Challenge card */
  challenge: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  challengeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  challengeBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  challengeBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: KFitColors.accent,
  },
  challengeBadge: {
    color: KFitColors.accent,
    fontSize: 9,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.8,
  },
  challengeEndsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  challengeEnds: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
  },
  challengeTitle: {
    color: KFitColors.text,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginTop: 2,
  },
  challengeDesc: {
    color: KFitColors.mutedText,
    fontSize: 12,
    lineHeight: 17,
  },
  challengeRewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
    marginTop: 4,
  },
  challengeRewardIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  challengeReward: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "800",
  },

  /* Section header */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.2,
  },
  sectionRight: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },

  /* Podium */
  podiumSection: { gap: 10 },
  podium: {
    flexDirection: "row",
    gap: 8,
  },
  podiumCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
  },
  podiumMedal: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  podiumRank: {
    fontSize: 9,
    fontWeight: "900",
    color: KFitColors.mutedText,
    fontFamily: "monospace",
    letterSpacing: 0.8,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: "800",
    color: KFitColors.text,
    textAlign: "center",
    marginTop: 2,
  },
  podiumBadge: {
    fontSize: 9,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
    textAlign: "center",
  },
  podiumScoreWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    marginTop: 6,
  },
  podiumScore: {
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.3,
  },
  podiumScoreLabel: {
    fontSize: 8,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },

  /* Rank list */
  rankSection: { gap: 10 },
  rankCard: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    overflow: "hidden",
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rankRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  rankRowYou: {
    backgroundColor: KFitColors.accent + "08",
  },
  rankBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  rankBoxYou: {
    backgroundColor: KFitColors.accent + "14",
    borderColor: KFitColors.accent + "55",
  },
  rankText: {
    color: KFitColors.mutedText,
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  rankTextYou: {
    color: KFitColors.accent,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 1,
  },
  youChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  youChipText: {
    color: KFitColors.accent,
    fontSize: 8,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.6,
  },
  badge: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },
  score: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "monospace",
  },
});
