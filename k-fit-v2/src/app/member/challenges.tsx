import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ChallengeCard,
  ChallengeFilters,
  ChallengeLeaderboard,
  EmptyChallenges,
} from "@/components/challenges";
import { Theme } from "@/components/admin/theme";
import {
  Challenge,
  ChallengeLeaderboardEntry,
  fetchChallenges,
  fetchLeaderboard,
} from "@/lib/challenges";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import {
  getMemberPointsBalance,
  getMemberPointsTransactions,
  PointsTransaction,
} from "@/lib/points";

type Participant = {
  id: string;
  challenge_id: string;
  total_visits: number;
  progress_percentage: number;
  completion_status: "in_progress" | "completed" | "withdrawn";
  final_rank: number | null;
};

type ChallengeNotice = {
  id: string;
  challenge_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const TABS = ["Discover", "My Challenges", "Leaderboard", "Completed"];

function getDisplayStatus(challenge: Challenge, now: number) {
  if (challenge.status !== "published") return challenge.status;
  if (challenge.start_at && now < new Date(challenge.start_at).getTime()) {
    return "upcoming";
  }
  if (challenge.end_at && now > new Date(challenge.end_at).getTime()) {
    return "ended";
  }
  return "active";
}

export default function MemberChallengesScreen() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantCounts, setParticipantCounts] = useState<
    Record<string, number>
  >({});
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [notifications, setNotifications] = useState<ChallengeNotice[]>([]);
  const [leaderboardState, setLeaderboardState] = useState<{
    challengeId: string;
    rows: ChallengeLeaderboardEntry[];
  } | null>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState("");
  const [tab, setTab] = useState("Discover");
  const [filter, setFilter] = useState("All");
  const [now, setNow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      if (currentUser.user_metadata?.role !== "member") {
        router.replace(
          currentUser.user_metadata?.role === "admin"
            ? "/admin/dashboard"
            : "/coach/dashboard",
        );
        return;
      }
      setRefreshing(true);
      setErrorMessage(null);
      setNow(Date.now());
      setMemberId(currentUser.id);
      const supabase = getSupabaseClient() as any;
      const [
        challengeRows,
        participantResult,
        balanceResult,
        transactionResult,
        notificationResult,
      ] = await Promise.all([
        fetchChallenges(),
        supabase
          .from("challenge_participants")
          .select(
            "id, challenge_id, total_visits, progress_percentage, completion_status, final_rank",
          )
          .eq("member_id", currentUser.id)
          .order("joined_at", { ascending: false }),
        getMemberPointsBalance(currentUser.id),
        getMemberPointsTransactions(currentUser.id, 12),
        supabase
          .from("challenge_notifications")
          .select("id, challenge_id, title, message, is_read, created_at")
          .eq("member_id", currentUser.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      if (participantResult.error) throw participantResult.error;
      if (notificationResult.error) throw notificationResult.error;

      const participantRows = (participantResult.data ?? []) as Participant[];
      const challengeIds = challengeRows.map((challenge) => challenge.id);
      let counts: Record<string, number> = {};
      if (challengeIds.length > 0) {
        const { data: countRows, error: countError } = await supabase
          .from("challenge_participants")
          .select("challenge_id")
          .in("challenge_id", challengeIds)
          .neq("completion_status", "withdrawn");
        if (countError) throw countError;
        counts = (countRows ?? []).reduce(
          (result: Record<string, number>, row: { challenge_id: string }) => {
            result[row.challenge_id] = (result[row.challenge_id] ?? 0) + 1;
            return result;
          },
          {},
        );
      }

      setChallenges(challengeRows);
      setParticipants(participantRows);
      setParticipantCounts(counts);
      setBalance(balanceResult);
      setTransactions(transactionResult);
      setNotifications((notificationResult.data ?? []) as ChallengeNotice[]);
      const defaultLeaderboardChallenge =
        challengeRows.find((challenge) =>
          participantRows.some(
            (participant) => participant.challenge_id === challenge.id,
          ),
        ) ?? challengeRows.find((challenge) => challenge.visibility === "public");
      setSelectedChallengeId((current) =>
        challengeRows.some(
          (challenge) =>
            challenge.id === current &&
            (challenge.visibility === "public" ||
              participantRows.some(
                (participant) => participant.challenge_id === challenge.id,
              )),
        )
          ? current
          : defaultLeaderboardChallenge?.id ?? "",
      );
    } catch (error) {
      console.error("Unable to load member challenges:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timeout);
  }, [refresh]);

  useEffect(() => {
    if (tab !== "Leaderboard" || !selectedChallengeId) return;
    let active = true;
    fetchLeaderboard(selectedChallengeId)
      .then((rows) => {
        if (active) {
          setLeaderboardState({ challengeId: selectedChallengeId, rows });
        }
      })
      .catch((error) => {
        console.error("Unable to load challenge leaderboard:", error);
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load leaderboard.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [selectedChallengeId, tab]);
  const leaderboard =
    tab === "Leaderboard" &&
    leaderboardState?.challengeId === selectedChallengeId
      ? leaderboardState.rows
      : [];

  const challengeById = useMemo(
    () => new Map(challenges.map((challenge) => [challenge.id, challenge])),
    [challenges],
  );
  const participantByChallenge = useMemo(
    () => new Map(participants.map((participant) => [participant.challenge_id, participant])),
    [participants],
  );
  const myChallenges = participants
    .filter((participant) => participant.completion_status === "in_progress")
    .map((participant) => challengeById.get(participant.challenge_id))
    .filter((challenge): challenge is Challenge => Boolean(challenge));
  const completedChallenges = participants
    .filter((participant) => participant.completion_status === "completed")
    .map((participant) => challengeById.get(participant.challenge_id))
    .filter((challenge): challenge is Challenge => Boolean(challenge));
  const leaderboardChallenges = challenges.filter(
    (challenge) =>
      (challenge.status === "published" &&
        challenge.visibility === "public") ||
      participantByChallenge.has(challenge.id),
  );
  const activeCount = myChallenges.filter(
    (challenge) => getDisplayStatus(challenge, now) === "active",
  ).length;
  const earnedChallengePoints = transactions
    .filter(
      (transaction) =>
        transaction.transaction_type === "challenge_reward" &&
        transaction.amount > 0,
    )
    .reduce((total, transaction) => total + transaction.amount, 0);

  const discoverChallenges = challenges.filter((challenge) => {
    if (challenge.status !== "published") return false;
    const challengeStatus = getDisplayStatus(challenge, now);
    if (challengeStatus === "ended") return false;
    if (participantByChallenge.has(challenge.id)) return false;
    if (filter === "Individual" || filter === "Competitive") {
      return challenge.challenge_type === filter.toLowerCase();
    }
    if (filter === "Upcoming" || filter === "Active") {
      return challengeStatus === filter.toLowerCase();
    }
    return true;
  });

  const markNotificationRead = async (notice: ChallengeNotice) => {
    if (notice.is_read) return;
    try {
      const { error } = await (getSupabaseClient() as any).rpc(
        "mark_challenge_notification_read",
        { p_notification_id: notice.id },
      );
      if (error) throw error;
      setNotifications((current) =>
        current.map((item) =>
          item.id === notice.id ? { ...item, is_read: true } : item,
        ),
      );
    } catch (error) {
      console.error("Unable to mark challenge notification read:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.mutedText}>Loading challenges...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          tintColor={Theme.accent}
          colors={[Theme.accent]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>K-FIT ARENA</Text>
        <Text style={styles.title}>Challenges</Text>
        <Text style={styles.subtitle}>
          Challenge yourself. Stay consistent. Earn rewards.
        </Text>
        <View style={styles.summaryRow}>
          <SummaryItem label="Active" value={String(activeCount)} />
          <SummaryItem label="Completed" value={String(completedChallenges.length)} />
          <SummaryItem label="KP earned" value={earnedChallengePoints.toLocaleString()} />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/member/points")}
          style={styles.pointsButton}
        >
          <Text style={styles.pointsLabel}>POINTS BALANCE</Text>
          <Text style={styles.pointsValue}>{balance.toLocaleString()} KP</Text>
          <Text style={styles.pointsLink}>View points history</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {TABS.map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            onPress={() => setTab(value)}
            style={[styles.tab, tab === value && styles.activeTab]}
          >
            <Text style={[styles.tabText, tab === value && styles.activeTabText]}>
              {value}
            </Text>
          </Pressable>
        ))}
      </View>

      {!!errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {tab === "Discover" && (
        <>
          <ChallengeFilters
            values={["All", "Individual", "Competitive", "Upcoming", "Active"]}
            selected={filter}
            onSelect={setFilter}
          />
          {discoverChallenges.length === 0 ? (
            <EmptyChallenges message="No challenges match this filter right now." />
          ) : (
            discoverChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                participantCount={participantCounts[challenge.id] ?? 0}
                status={getDisplayStatus(challenge, now)}
                onPress={() =>
                  router.push({
                    pathname: "/member/challenge-details",
                    params: { challengeId: challenge.id },
                  })
                }
              />
            ))
          )}
        </>
      )}

      {tab === "My Challenges" &&
        (myChallenges.length === 0 ? (
          <EmptyChallenges message="Join a challenge to track your attendance progress." />
        ) : (
          myChallenges.map((challenge) => {
            const participant = participantByChallenge.get(challenge.id);
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                participantCount={participantCounts[challenge.id] ?? 0}
                status={getDisplayStatus(challenge, now)}
                joined
                visits={participant?.total_visits ?? 0}
                onPress={() =>
                  router.push({
                    pathname: "/member/challenge-details",
                    params: { challengeId: challenge.id },
                  })
                }
              />
            );
          })
        ))}

      {tab === "Completed" &&
        (completedChallenges.length === 0 ? (
          <EmptyChallenges message="Completed challenges will appear here." />
        ) : (
          completedChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              participantCount={participantCounts[challenge.id] ?? 0}
              status="completed"
              joined
              visits={
                participantByChallenge.get(challenge.id)?.total_visits ?? 0
              }
              onPress={() =>
                router.push({
                  pathname: "/member/challenge-details",
                  params: { challengeId: challenge.id },
                })
              }
            />
          ))
        ))}

      {tab === "Leaderboard" && (
        <>
          {leaderboardChallenges.map((challenge) => (
              <Pressable
                key={challenge.id}
                accessibilityRole="button"
                onPress={() => setSelectedChallengeId(challenge.id)}
                style={[
                  styles.challengeSelector,
                  selectedChallengeId === challenge.id && styles.selectedSelector,
                ]}
              >
                <Text
                  style={[
                    styles.selectorText,
                    selectedChallengeId === challenge.id && styles.selectedSelectorText,
                  ]}
                >
                  {challenge.title}
                </Text>
              </Pressable>
            ))}
          {selectedChallengeId ? (
            <ChallengeLeaderboard
              entries={leaderboard}
              currentMemberId={memberId ?? undefined}
            />
          ) : (
            <EmptyChallenges message="No challenge leaderboards are available yet." />
          )}
        </>
      )}

      <View style={styles.notifications}>
        <Text style={styles.sectionTitle}>Challenge updates</Text>
        {notifications.length === 0 ? (
          <Text style={styles.mutedText}>No challenge updates yet.</Text>
        ) : (
          notifications.map((notice) => (
            <Pressable
              key={notice.id}
              accessibilityRole="button"
              onPress={() => {
                void markNotificationRead(notice);
                router.push({
                  pathname: "/member/challenge-details",
                  params: { challengeId: notice.challenge_id },
                });
              }}
              style={[styles.noticeRow, !notice.is_read && styles.unreadNotice]}
            >
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.mutedText}>{notice.message}</Text>
              <Text style={styles.noticeDate}>
                {new Date(notice.created_at).toLocaleDateString()}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  content: { padding: 16, paddingBottom: 150 },
  center: {
    flex: 1,
    backgroundColor: Theme.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  header: {
    backgroundColor: Theme.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 18,
    marginBottom: 14,
  },
  eyebrow: { color: Theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  title: { color: Theme.text, fontSize: 26, fontWeight: "900", marginTop: 4 },
  subtitle: { color: Theme.textMuted, fontSize: 12, marginTop: 3 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: Theme.border,
  },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryValue: { color: Theme.text, fontSize: 17, fontWeight: "900" },
  summaryLabel: { color: Theme.textMuted, fontSize: 9, marginTop: 4 },
  pointsButton: {
    marginTop: 14,
    borderRadius: 14,
    padding: 12,
    backgroundColor: Theme.surfaceHigh,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 5,
  },
  pointsLabel: { color: Theme.textMuted, fontSize: 9, fontWeight: "800" },
  pointsValue: { color: Theme.accent, fontSize: 14, fontWeight: "900" },
  pointsLink: { color: Theme.text, fontSize: 9, textDecorationLine: "underline" },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 4,
    borderRadius: 14,
    backgroundColor: Theme.surface,
    marginBottom: 14,
  },
  tab: { flexGrow: 1, alignItems: "center", paddingVertical: 9, paddingHorizontal: 8, borderRadius: 10 },
  activeTab: { backgroundColor: Theme.accent },
  tabText: { color: Theme.textMuted, fontSize: 9, fontWeight: "700" },
  activeTabText: { color: Theme.accentText },
  errorBanner: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: Theme.errorContainer,
  },
  errorText: { color: Theme.error, fontSize: 11 },
  challengeSelector: {
    padding: 10,
    marginBottom: 7,
    borderRadius: 10,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  selectedSelector: { borderColor: Theme.accent },
  selectorText: { color: Theme.textMuted, fontSize: 11, fontWeight: "700" },
  selectedSelectorText: { color: Theme.accent },
  notifications: {
    marginTop: 18,
    padding: 14,
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 8,
  },
  sectionTitle: { color: Theme.text, fontSize: 14, fontWeight: "800" },
  noticeRow: {
    paddingVertical: 9,
    borderTopWidth: 1,
    borderColor: Theme.border,
    gap: 3,
  },
  unreadNotice: { borderLeftWidth: 2, borderLeftColor: Theme.accent, paddingLeft: 8 },
  noticeTitle: { color: Theme.text, fontSize: 11, fontWeight: "700" },
  noticeDate: { color: Theme.textMuted, fontSize: 9 },
  mutedText: { color: Theme.textMuted, fontSize: 10, lineHeight: 15 },
});
