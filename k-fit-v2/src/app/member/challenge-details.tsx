import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ChallengeLeaderboard,
  ChallengeProgress,
  ChallengeRewardCard,
  ChallengeStatusBadge,
  ChallengeTypeBadge,
  EmptyChallenges,
} from "@/components/challenges";
import { Theme } from "@/components/admin/theme";
import {
  Challenge,
  ChallengeLeaderboardEntry,
  fetchLeaderboard,
  joinChallenge,
} from "@/lib/challenges";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";

type Participant = {
  id: string;
  total_visits: number;
  progress_percentage: number;
  completion_status: "in_progress" | "completed" | "withdrawn";
  final_rank: number | null;
};

type Activity = { id: string; attendance_date: string; eligible: boolean };
type Reward = { rank_position: number; kp_amount: number };

function displayStatus(challenge: Challenge, now: number) {
  if (challenge.status !== "published") return challenge.status;
  if (challenge.start_at && now < new Date(challenge.start_at).getTime()) {
    return "upcoming";
  }
  if (challenge.end_at && now > new Date(challenge.end_at).getTime()) {
    return "ended";
  }
  return "active";
}

function dateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Not scheduled";
}

export default function MemberChallengeDetailsScreen() {
  const params = useLocalSearchParams<{ challengeId?: string | string[] }>();
  const challengeId =
    typeof params.challengeId === "string" ? params.challengeId : "";
  const [memberId, setMemberId] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboardEntry[]>(
    [],
  );
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      if (!challengeId) throw new Error("Challenge not found.");
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
        challengeResult,
        participantResult,
        activityResult,
        rewardResult,
        countResult,
      ] = await Promise.all([
        supabase.from("challenges").select("*").eq("id", challengeId).maybeSingle(),
        supabase
          .from("challenge_participants")
          .select("id, total_visits, progress_percentage, completion_status, final_rank")
          .eq("challenge_id", challengeId)
          .eq("member_id", currentUser.id)
          .maybeSingle(),
        supabase
          .from("challenge_activities")
          .select("id, attendance_date, eligible")
          .eq("challenge_id", challengeId)
          .eq("member_id", currentUser.id)
          .order("attendance_date", { ascending: false }),
        supabase
          .from("challenge_reward_configurations")
          .select("rank_position, kp_amount")
          .eq("challenge_id", challengeId)
          .order("rank_position", { ascending: true }),
        supabase
          .from("challenge_participants")
          .select("id", { count: "exact", head: true })
          .eq("challenge_id", challengeId)
          .neq("completion_status", "withdrawn"),
      ]);
      for (const result of [
        challengeResult,
        participantResult,
        activityResult,
        rewardResult,
        countResult,
      ]) {
        if (result.error) throw result.error;
      }
      if (!challengeResult.data) throw new Error("Challenge is unavailable.");

      setChallenge(challengeResult.data as Challenge);
      setParticipant(participantResult.data as Participant | null);
      setActivities((activityResult.data ?? []) as Activity[]);
      setRewards((rewardResult.data ?? []) as Reward[]);
      setParticipantCount(countResult.count ?? 0);

      const loadedChallenge = challengeResult.data as Challenge;
      if (
        loadedChallenge.challenge_type === "competitive" &&
        (loadedChallenge.visibility === "public" || participantResult.data)
      ) {
        setLeaderboard(await fetchLeaderboard(challengeId));
      } else {
        setLeaderboard([]);
      }
    } catch (error) {
      if ((error as { code?: string })?.code !== "PGRST205") {
        console.error("Unable to load challenge details:", error);
      }
      setErrorMessage(
        (error as { code?: string })?.code === "PGRST205"
          ? "Challenges are unavailable until the Supabase challenge migration is applied."
          : error instanceof Error
            ? error.message
            : "Unable to load challenge details.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [challengeId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  const confirmJoin = () => {
    if (!challenge) return;
    Alert.alert(
      "Join this challenge?",
      `${challenge.rules || "Attendance counts only when the verified gym session meets the minimum duration."}\n\nYou can join once. Only eligible, verified attendance after enrollment counts.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Agree & join",
          onPress: () => void join(),
        },
      ],
    );
  };

  const join = async () => {
    if (!challenge) return;
    setJoining(true);
    setErrorMessage(null);
    try {
      await joinChallenge(challenge.id);
      await load();
      Alert.alert("Joined", "Your challenge enrollment is confirmed.");
    } catch (error) {
      console.error("Unable to join challenge:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to join challenge.",
      );
    } finally {
      setJoining(false);
    }
  };

  const status = challenge ? displayStatus(challenge, now) : "";
  const enrollmentOpen =
    challenge?.status === "published" &&
    !!challenge.enrollment_open_at &&
    !!challenge.enrollment_deadline &&
    now >= new Date(challenge.enrollment_open_at).getTime() &&
    now <= new Date(challenge.enrollment_deadline).getTime() &&
    !!challenge.start_at &&
    now < new Date(challenge.start_at).getTime();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.muted}>Loading challenge...</Text>
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
          onRefresh={() => void load()}
          tintColor={Theme.accent}
          colors={[Theme.accent]}
        />
      }
    >
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={styles.back}
      >
        <Text style={styles.backText}>‹  Challenges</Text>
      </Pressable>

      {!!errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {!challenge ? (
        <EmptyChallenges message="This challenge could not be loaded." />
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.badges}>
              <ChallengeTypeBadge type={challenge.challenge_type} />
              <ChallengeStatusBadge status={status} />
            </View>
            <Text style={styles.title}>{challenge.title}</Text>
            <Text style={styles.description}>{challenge.description}</Text>
            <View style={styles.infoGrid}>
              <Info label="Attendance target" value={`${challenge.target_visits} visits`} />
              <Info label="Participants" value={String(participantCount)} />
              <Info label="Starts" value={dateTime(challenge.start_at)} />
              <Info label="Ends" value={dateTime(challenge.end_at)} />
              <Info
                label="Minimum session"
                value={`${challenge.minimum_session_minutes} minutes`}
              />
              <Info
                label="Daily limit"
                value={`${challenge.max_daily_visits} eligible visit(s)`}
              />
            </View>
          </View>

          {participant ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your progress</Text>
              <ChallengeProgress
                visits={participant.total_visits}
                target={challenge.target_visits}
              />
              <Text style={styles.muted}>
                {Math.max(challenge.target_visits - participant.total_visits, 0)} visits
                remaining · {participant.completion_status.replace("_", " ")}
                {participant.final_rank ? ` · Final rank #${participant.final_rank}` : ""}
              </Text>
              {challenge.challenge_type === "individual" && (
                <ChallengeRewardCard amount={challenge.completion_reward_kp} label="Completion reward" />
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rewards</Text>
              {challenge.challenge_type === "individual" ? (
                <ChallengeRewardCard
                  amount={challenge.completion_reward_kp}
                  label="Earned when you meet the attendance target"
                />
              ) : rewards.length === 0 ? (
                <Text style={styles.muted}>No placement rewards are configured.</Text>
              ) : (
                rewards.map((reward) => (
                  <ChallengeRewardCard
                    key={reward.rank_position}
                    amount={reward.kp_amount}
                    label={`Place ${reward.rank_position}`}
                  />
                ))
              )}
            </View>
          )}

          {!participant && (
            <Pressable
              accessibilityRole="button"
              onPress={confirmJoin}
              disabled={!enrollmentOpen || joining}
              style={[
                styles.joinButton,
                (!enrollmentOpen || joining) && styles.disabledButton,
              ]}
            >
              {joining ? (
                <ActivityIndicator color={Theme.accentText} />
              ) : (
                <Text style={styles.joinText}>
                  {enrollmentOpen ? "Join challenge" : "Enrollment closed"}
                </Text>
              )}
            </Pressable>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rules & instructions</Text>
            <Text style={styles.bodyText}>
              {challenge.rules || "No additional rules were provided."}
            </Text>
            {!!challenge.instructions && (
              <Text style={styles.bodyText}>{challenge.instructions}</Text>
            )}
            <Text style={styles.muted}>
              Only completed QR/NFC attendance sessions with a valid membership
              and the required duration count. One visit is counted per member,
              challenge, and local gym day up to the configured daily limit.
            </Text>
          </View>

          {participant && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Eligible attendance history</Text>
              {activities.length === 0 ? (
                <Text style={styles.muted}>No eligible visits recorded yet.</Text>
              ) : (
                activities.map((activity) => (
                  <View key={activity.id} style={styles.activityRow}>
                    <Text style={styles.bodyText}>
                      {new Date(`${activity.attendance_date}T00:00:00`).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "short", day: "numeric" },
                      )}
                    </Text>
                    <Text style={styles.eligible}>ELIGIBLE</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {challenge.challenge_type === "competitive" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Leaderboard</Text>
              <ChallengeLeaderboard
                entries={leaderboard}
                currentMemberId={memberId}
              />
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  content: { padding: 16, paddingBottom: 140 },
  center: {
    flex: 1,
    backgroundColor: Theme.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  back: { marginBottom: 12 },
  backText: { color: Theme.accent, fontSize: 12, fontWeight: "700" },
  header: {
    backgroundColor: Theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 16,
    gap: 10,
  },
  badges: { flexDirection: "row", gap: 7 },
  title: { color: Theme.text, fontSize: 23, fontWeight: "900" },
  description: { color: Theme.textMuted, fontSize: 12, lineHeight: 18 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4, gap: 10 },
  infoItem: { width: "47%", gap: 3 },
  infoLabel: { color: Theme.textMuted, fontSize: 9 },
  infoValue: { color: Theme.text, fontSize: 10, fontWeight: "700" },
  section: {
    marginTop: 12,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
    gap: 10,
  },
  sectionTitle: { color: Theme.text, fontSize: 14, fontWeight: "800" },
  bodyText: { color: Theme.text, fontSize: 11, lineHeight: 17 },
  muted: { color: Theme.textMuted, fontSize: 10, lineHeight: 16 },
  joinButton: {
    marginTop: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: Theme.accent,
  },
  disabledButton: { opacity: 0.45 },
  joinText: { color: Theme.accentText, fontSize: 13, fontWeight: "900" },
  errorBanner: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Theme.errorContainer,
  },
  errorText: { color: Theme.error, fontSize: 11 },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: Theme.border,
  },
  eligible: { color: Theme.success, fontSize: 9, fontWeight: "900" },
});
