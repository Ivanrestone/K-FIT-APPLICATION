import { Leaderboard, ProgressBar } from "@/components/ChallengeParts";
import MemberBottomNav from "@/components/MemberBottomNav";
import MemberHeader, {
  MemberLocalNotification,
} from "@/components/MemberHeader";
import { KFitColors } from "@/constants/theme";
import { useLogout } from "@/hooks/use-logout";
import { useMemberProfile } from "@/hooks/use-member-profile";
import {
  markChallengesSeen,
  timeLeft,
  toggleJoin,
  useChallengeStore,
} from "@/lib/challenges-store";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NAV_CLEARANCE = 140;

export default function MemberChallengesScreen() {
  const { challenges, member } = useChallengeStore();
  const { profile } = useMemberProfile();
  const { isSigningOut, logout } = useLogout();

  const [notifications, setNotifications] = useState<MemberLocalNotification[]>(
    [],
  );

  useEffect(() => {
    markChallengesSeen("member");
  }, [challenges.length]);

  const stats = useMemo(() => {
    let joined = 0;
    let active = 0;
    let xp = 0;
    const now = Date.now();
    for (const c of challenges) {
      const entry = member[c.id] ?? { joined: false, progress: 0 };
      if (entry.joined) joined += 1;
      if (c.endsAt > now) active += 1;
      if (entry.joined) {
        xp += Math.round((c.points * entry.progress) / 100);
      }
    }
    return { joined, active, xp };
  }, [challenges, member]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.main}>
        <MemberHeader
          name={profile?.firstName?.trim() || "Member"}
          tier="VIP"
          streakDays={0}
          points={0}
          checkedIn={false}
          isSigningOut={isSigningOut}
          onLogout={logout}
          activeRoute="/member-challenges"
          notifications={notifications}
          setNotifications={setNotifications}
        />

        <ScrollView
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ─────────────────────────── */}
          <View style={styles.header}>
            <Text style={styles.eyebrow}>COMMUNITY MOTIVATION</Text>
            <Text style={styles.title}>Challenges & Races</Text>
            <Text style={styles.sub}>
              Join a challenge, hit the target and earn XP.
            </Text>
          </View>

          {/* ── Stat strip ─────────────────────── */}
          <View style={styles.statCard}>
            <StatInline
              label="Joined"
              value={stats.joined}
              tone={KFitColors.accent}
            />
            <View style={styles.statDivider} />
            <StatInline label="Active" value={stats.active} tone="#22C55E" />
            <View style={styles.statDivider} />
            <StatInline label="XP" value={stats.xp} tone="#F59E0B" />
          </View>

          {/* ── Challenge list ─────────────────── */}
          {challenges.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Feather name="flag" size={20} color={KFitColors.accent} />
              </View>
              <Text style={styles.emptyTitle}>No active challenges</Text>
              <Text style={styles.emptyText}>
                Check back soon — new challenges drop weekly.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {challenges.map((c) => {
                const entry = member[c.id] ?? { joined: false, progress: 0 };
                const ended = c.endsAt <= Date.now();

                return (
                  <View
                    key={c.id}
                    style={[
                      styles.card,
                      entry.joined && styles.cardJoined,
                      ended && styles.cardEnded,
                    ]}
                  >
                    {/* Top row */}
                    <View style={styles.rowBetween}>
                      <View style={styles.flex}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {c.title}
                        </Text>
                        <Text style={styles.cardSub} numberOfLines={1}>
                          {c.target}
                        </Text>
                      </View>
                      <View style={styles.xpPill}>
                        <Feather
                          name="zap"
                          size={10}
                          color={KFitColors.accent}
                        />
                        <Text style={styles.xpText}>+{c.points} XP</Text>
                      </View>
                    </View>

                    {/* Progress or meta */}
                    {entry.joined ? (
                      <View style={styles.progressBlock}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.progressLabel}>
                            YOUR PROGRESS
                          </Text>
                          <Text style={styles.progressValue}>
                            {entry.progress}%
                          </Text>
                        </View>
                        <ProgressBar value={entry.progress} />
                        <View style={styles.metaRow}>
                          <Feather
                            name="clock"
                            size={10}
                            color={KFitColors.mutedText}
                          />
                          <Text style={styles.metaText}>
                            {timeLeft(c.endsAt)}
                          </Text>
                          <Text style={styles.metaDot}>·</Text>
                          <Feather
                            name="users"
                            size={10}
                            color={KFitColors.mutedText}
                          />
                          <Text style={styles.metaText}>
                            {c.participants} joined
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.metaRow}>
                        <Feather
                          name="clock"
                          size={10}
                          color={KFitColors.mutedText}
                        />
                        <Text style={styles.metaText}>
                          {timeLeft(c.endsAt)}
                        </Text>
                        <Text style={styles.metaDot}>·</Text>
                        <Feather
                          name="users"
                          size={10}
                          color={KFitColors.mutedText}
                        />
                        <Text style={styles.metaText}>
                          {c.participants} joined
                        </Text>
                      </View>
                    )}

                    {/* Join button */}
                    <Pressable
                      disabled={ended}
                      onPress={() => {
                        void Haptics.impactAsync(
                          entry.joined
                            ? Haptics.ImpactFeedbackStyle.Medium
                            : Haptics.ImpactFeedbackStyle.Light,
                        );
                        toggleJoin(c.id);
                      }}
                      style={({ pressed }) => [
                        styles.joinBtn,
                        ended
                          ? styles.joinEnded
                          : entry.joined
                            ? styles.joinJoined
                            : styles.joinOpen,
                        pressed && !ended && styles.joinPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={
                        ended
                          ? `${c.title} has ended`
                          : entry.joined
                            ? `Leave ${c.title}`
                            : `Join ${c.title}`
                      }
                      accessibilityState={{
                        selected: entry.joined,
                        disabled: ended,
                      }}
                    >
                      <Feather
                        name={ended ? "slash" : entry.joined ? "check" : "plus"}
                        size={13}
                        color={
                          ended
                            ? KFitColors.mutedText
                            : entry.joined
                              ? KFitColors.accent
                              : KFitColors.onAccent
                        }
                      />
                      <Text
                        style={[
                          styles.joinText,
                          ended
                            ? { color: KFitColors.mutedText }
                            : entry.joined
                              ? { color: KFitColors.accent }
                              : { color: KFitColors.onAccent },
                        ]}
                      >
                        {ended
                          ? "Challenge ended"
                          : entry.joined
                            ? "You're in"
                            : "Join challenge"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Leaderboard ────────────────────── */}
          <View style={styles.leaderboardSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Feather name="award" size={12} color={KFitColors.accent} />
              </View>
              <Text style={styles.sectionTitle}>Leaderboard</Text>
              <View style={styles.flex} />
              <Text style={styles.sectionRight}>TOP MEMBERS</Text>
            </View>
            <View style={styles.leaderboardCard}>
              <Leaderboard />
            </View>
          </View>
        </ScrollView>

        <MemberBottomNav activeRoute="/member-challenges" />
      </View>
    </SafeAreaView>
  );
}

/* ─────────── Small components ─────────── */
function StatInline({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <View style={styles.statInline}>
      <Text style={[styles.statInlineValue, { color: tone }]}>{value}</Text>
      <Text style={styles.statInlineLabel}>{label}</Text>
    </View>
  );
}

/* ─────────── Styles ─────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  main: { flex: 1, backgroundColor: KFitColors.background },
  flex: { flex: 1, minWidth: 0 },
  contentInner: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: NAV_CLEARANCE,
    gap: 14,
  },

  /* Header */
  header: { gap: 2, marginTop: 4 },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  sub: { color: KFitColors.mutedText, fontSize: 12, marginTop: 2 },

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
    paddingVertical: 12,
    gap: 2,
  },
  statInlineValue: {
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.4,
  },
  statInlineLabel: {
    fontSize: 9,
    color: KFitColors.mutedText,
    letterSpacing: 0.8,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 10,
  },

  /* List */
  list: { gap: 10 },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: KFitColors.text,
  },
  emptyText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },

  /* Card */
  card: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  cardJoined: {
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.accent + "05",
  },
  cardEnded: { opacity: 0.6 },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.2,
  },
  cardSub: {
    color: KFitColors.mutedText,
    fontSize: 11,
    marginTop: 2,
    fontFamily: "monospace",
  },
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
    backgroundColor: KFitColors.accent + "14",
    borderColor: KFitColors.accent + "44",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  xpText: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "monospace",
  },

  progressBlock: { gap: 6 },
  progressLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  progressValue: {
    fontSize: 13,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  metaText: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
  },
  metaDot: { color: KFitColors.mutedText, fontSize: 10 },

  /* Join button */
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  joinOpen: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  joinJoined: {
    backgroundColor: KFitColors.accent + "10",
    borderColor: KFitColors.accent + "66",
  },
  joinEnded: {
    backgroundColor: KFitColors.background,
    borderColor: KFitColors.border,
  },
  joinPressed: {
    opacity: 0.75,
  },
  joinText: { fontSize: 12, fontWeight: "900" },

  /* Leaderboard */
  leaderboardSection: { gap: 10, marginTop: 4 },
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
  leaderboardCard: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 14,
  },
});
