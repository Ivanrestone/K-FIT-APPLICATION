import {
  ChallengeFormModal,
  Leaderboard,
  ProgressBar,
} from "@/components/ChallengeParts";
import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import {
  dismissSuggestion,
  publishChallenge,
  publishSuggestion,
  removeChallenge,
  timeAgo,
  timeLeft,
  useChallengeStore,
} from "@/lib/challenges-store";
import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ------------------------------------------------------------------ */
/* Typed pressable wrapper — eliminates the style-callback TS error.  */
/* ------------------------------------------------------------------ */
type PressableBtnProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityRole?: "button" | "link" | "none";
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
  hitSlop?: number;
};

function PressableBtn({
  children,
  style,
  pressedStyle,
  onPress,
  disabled,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  hitSlop,
}: PressableBtnProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        style,
        pressed && (pressedStyle ?? styles.pressed),
      ]}
    >
      {children}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                             */
/* ------------------------------------------------------------------ */
type ChallengeFilter = "All" | "Active" | "Ended";
const FILTERS: ChallengeFilter[] = ["All", "Active", "Ended"];

export default function ChallengesScreen() {
  const { challenges, suggestions } = useChallengeStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<ChallengeFilter>("All");

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      active: challenges.filter((c) => c.endsAt > now).length,
      participants: challenges.reduce((sum, c) => sum + c.participants, 0),
      xp: challenges.reduce((sum, c) => sum + c.points, 0),
    };
  }, [challenges]);

  const visibleChallenges = useMemo(() => {
    const now = Date.now();
    if (filter === "Active") return challenges.filter((c) => c.endsAt > now);
    if (filter === "Ended") return challenges.filter((c) => c.endsAt <= now);
    return challenges;
  }, [challenges, filter]);

  const confirmRemove = (id: string, title: string) =>
    Alert.alert(
      "End challenge?",
      `"${title}" will be removed for all trainers and members.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End challenge",
          style: "destructive",
          onPress: () => removeChallenge(id, "admin"),
        },
      ],
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/challenges" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero header */}
          <View style={styles.hero}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.eyebrow}>COMMUNITY MOTIVATION</Text>
              <Text style={styles.pageTitle}>Challenges & Races</Text>
              <Text style={styles.pageSub}>
                Only admins publish challenges. Trainers and members are
                notified instantly.
              </Text>
            </View>

            <PressableBtn
              onPress={() => setModalOpen(true)}
              style={styles.createBtn}
              accessibilityRole="button"
              accessibilityLabel="Create challenge"
            >
              <Feather name="plus" size={16} color={KFitColors.onAccent} />
              <Text style={styles.createBtnText}>Create challenge</Text>
            </PressableBtn>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <Stat
              icon="zap"
              label="Active"
              value={String(stats.active)}
              hint="Live now"
            />
            <Stat
              icon="users"
              label="Participants"
              value={String(stats.participants)}
              hint="Across all challenges"
            />
            <Stat
              icon="award"
              label="XP pool"
              value={stats.xp.toLocaleString()}
              hint="Total distributed"
            />
          </View>

          {/* Trainer suggestions */}
          {suggestions.length > 0 ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderIcon}>
                  <Feather name="inbox" size={14} color={KFitColors.accent} />
                </View>
                <Text style={styles.cardTitle}>Trainer suggestions</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{suggestions.length}</Text>
                </View>
              </View>

              <View style={styles.stack}>
                {suggestions.map((sg) => (
                  <View key={sg.id} style={styles.item}>
                    <Text style={styles.itemTitle}>{sg.title}</Text>
                    <Text style={styles.muted}>{sg.target}</Text>
                    <Text style={styles.mutedSmall}>
                      From <Text style={styles.strong}>{sg.by}</Text> ·{" "}
                      {timeAgo(sg.createdAt)} · +{sg.points} XP · {sg.days} days
                    </Text>
                    <View style={styles.actionRow}>
                      <PressableBtn
                        onPress={() => dismissSuggestion(sg.id, "admin")}
                        style={styles.ghostBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Dismiss ${sg.title}`}
                      >
                        <Text style={styles.ghostBtnText}>Dismiss</Text>
                      </PressableBtn>
                      <PressableBtn
                        onPress={() => publishSuggestion(sg.id, "admin")}
                        style={styles.smallGold}
                        accessibilityRole="button"
                        accessibilityLabel={`Publish ${sg.title}`}
                      >
                        <Feather
                          name="check"
                          size={13}
                          color={KFitColors.onAccent}
                        />
                        <Text style={styles.smallGoldText}>Publish</Text>
                      </PressableBtn>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Challenges */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Feather name="flag" size={14} color={KFitColors.accent} />
              </View>
              <Text style={styles.cardTitle}>All challenges</Text>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{challenges.length}</Text>
              </View>
            </View>

            {/* Filter tabs */}
            <View style={styles.filterRow}>
              {FILTERS.map((f) => {
                const active = filter === f;
                return (
                  <PressableBtn
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[styles.filterTab, active && styles.filterTabActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Filter ${f}`}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        active && styles.filterTabTextActive,
                      ]}
                    >
                      {f}
                    </Text>
                  </PressableBtn>
                );
              })}
            </View>

            {visibleChallenges.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Feather name="flag" size={20} color={KFitColors.accent} />
                </View>
                <Text style={styles.emptyTitle}>
                  {challenges.length === 0
                    ? "No challenges yet"
                    : `No ${filter.toLowerCase()} challenges`}
                </Text>
                <Text style={styles.emptySub}>
                  {challenges.length === 0
                    ? "Create the first one to get your community moving."
                    : "Try a different filter to see more."}
                </Text>
              </View>
            ) : (
              <View style={styles.stack}>
                {visibleChallenges.map((c) => {
                  const ended = c.endsAt <= Date.now();
                  return (
                    <View key={c.id} style={styles.item}>
                      <View style={styles.rowBetween}>
                        <View style={styles.flex}>
                          <Text style={styles.itemTitle}>{c.title}</Text>
                          <Text style={styles.muted}>{c.target}</Text>
                        </View>
                        <View style={styles.xpPill}>
                          <Feather
                            name="zap"
                            size={11}
                            color={KFitColors.accent}
                          />
                          <Text style={styles.xpPillText}>+{c.points} XP</Text>
                        </View>
                      </View>

                      <View style={styles.rowBetween}>
                        <Text style={styles.mutedSmall}>
                          Avg. completion{" "}
                          <Text style={styles.strong}>{c.avgProgress}%</Text>
                        </Text>
                        <Text
                          style={[
                            styles.mutedSmall,
                            ended && styles.mutedError,
                          ]}
                        >
                          {timeLeft(c.endsAt)}
                        </Text>
                      </View>

                      <ProgressBar value={c.avgProgress} />

                      <View style={styles.rowBetween}>
                        <View style={styles.inline}>
                          <Feather
                            name="users"
                            size={13}
                            color={KFitColors.mutedText}
                          />
                          <Text style={styles.mutedSmall}>
                            {c.participants} joined
                          </Text>
                        </View>
                        <PressableBtn
                          onPress={() => confirmRemove(c.id, c.title)}
                          hitSlop={8}
                          style={styles.endBtn}
                          accessibilityRole="button"
                          accessibilityLabel={`End ${c.title}`}
                        >
                          <Feather
                            name="trash-2"
                            size={13}
                            color={KFitColors.error}
                          />
                          <Text style={styles.endText}>End</Text>
                        </PressableBtn>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Leaderboard */}
          <View style={styles.card}>
            <View style={styles.cardHeaderBetween}>
              <View style={styles.inline}>
                <View style={styles.cardHeaderIcon}>
                  <Feather name="award" size={14} color={KFitColors.accent} />
                </View>
                <Text style={styles.cardTitle}>Live member leaderboard</Text>
              </View>
              <View style={styles.cycleBadge}>
                <Text style={styles.cycle}>MONTHLY</Text>
              </View>
            </View>
            <Leaderboard />
          </View>
        </ScrollView>
      </View>

      <ChallengeFormModal
        visible={modalOpen}
        heading="Create challenge"
        note="Trainers and members will be notified as soon as you publish."
        submitLabel="Publish challenge"
        onClose={() => setModalOpen(false)}
        onSubmit={(value) => publishChallenge(value, "admin")}
      />
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card                                                          */
/* ------------------------------------------------------------------ */
function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statTop}>
        <View style={styles.statIconWrap}>
          <Feather name={icon} size={12} color={KFitColors.accent} />
        </View>
        <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statHint}>{hint}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                             */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, flexDirection: "row" },
  content: { flex: 1, backgroundColor: KFitColors.background },
  contentContainer: { padding: 16, gap: 14, paddingBottom: 128 },

  pressed: { opacity: 0.65 },
  flex: { flex: 1, minWidth: 0 },
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },
  stack: { gap: 12 },

  /* Hero */
  hero: {
    gap: 14,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  heroTextBlock: { gap: 2 },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    fontFamily: "monospace",
  },
  pageTitle: {
    color: KFitColors.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: -0.3,
  },
  pageSub: {
    color: KFitColors.mutedText,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 560,
  },

  /* Primary CTA */
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
  },
  createBtnText: {
    color: KFitColors.onAccent,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  /* Stats */
  statsRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  stat: {
    flex: 1,
    minWidth: 150,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  statIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
  },
  statLabel: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    fontFamily: "monospace",
  },
  statValue: {
    color: KFitColors.text,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  statHint: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontFamily: "monospace",
  },

  /* Card shell */
  card: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
  },
  cardTitle: {
    color: KFitColors.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  countPill: {
    marginLeft: "auto",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  countPillText: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  cycleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
  },
  cycle: {
    color: KFitColors.accent,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    fontFamily: "monospace",
  },

  /* Filter tabs */
  filterRow: {
    flexDirection: "row",
    gap: 6,
    paddingBottom: 2,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  filterTabActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  filterTabText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontWeight: "800",
  },
  filterTabTextActive: {
    color: KFitColors.onAccent,
    fontWeight: "900",
  },

  /* Item */
  item: {
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  itemTitle: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  muted: { color: KFitColors.mutedText, fontSize: 12, lineHeight: 16 },
  mutedSmall: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  mutedError: { color: KFitColors.error, fontWeight: "800" },
  strong: { color: KFitColors.text, fontWeight: "800" },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },

  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: KFitColors.accent + "1A",
    borderColor: KFitColors.accent + "4D",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  xpPillText: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "900",
    fontFamily: "monospace",
  },

  endBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.error + "44",
    backgroundColor: KFitColors.error + "0F",
  },
  endText: {
    color: KFitColors.error,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  /* Suggestion actions */
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 2,
  },
  ghostBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  ghostBtnText: {
    color: KFitColors.mutedText,
    fontSize: 12,
    fontWeight: "800",
  },
  smallGold: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  smallGoldText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "900",
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 6,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
    marginBottom: 4,
  },
  emptyTitle: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  emptySub: {
    color: KFitColors.mutedText,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17,
    maxWidth: 320,
  },
});
