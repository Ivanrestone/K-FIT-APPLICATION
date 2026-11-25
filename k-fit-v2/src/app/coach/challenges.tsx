import { getCurrentUser } from "@/lib/auth";
import {
  Challenge,
  ChallengeLeaderboardEntry,
  ChallengeSuggestion,
  fetchChallenges,
  fetchLeaderboard,
  submitChallengeSuggestion,
} from "@/lib/challenges";
import { getSupabaseClient } from "@/lib/supabase";
import { Theme } from "@/components/admin/theme";
import {
  ChallengeCard,
  ChallengeLeaderboard,
  EmptyChallenges,
} from "@/components/challenges";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ParticipantSummary = {
  challenge_id: string;
  completion_status: string;
};

const TABS = ["Active", "Upcoming", "Leaderboard", "Suggestions"];

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

export default function CoachChallengesScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participants, setParticipants] = useState<ParticipantSummary[]>([]);
  const [suggestions, setSuggestions] = useState<ChallengeSuggestion[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState("");
  const [leaderboardState, setLeaderboardState] = useState<{
    challengeId: string;
    rows: ChallengeLeaderboardEntry[];
  } | null>(null);
  const [tab, setTab] = useState("Active");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"individual" | "competitive">("individual");
  const [targetVisits, setTargetVisits] = useState("10");
  const [durationDays, setDurationDays] = useState("30");
  const [reward, setReward] = useState("0");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      if (currentUser.user_metadata?.role !== "coach") {
        router.replace(
          currentUser.user_metadata?.role === "admin"
            ? "/admin/dashboard"
            : "/member/dashboard",
        );
        return;
      }
      setRefreshing(true);
      setErrorMessage(null);
      setNow(Date.now());
      const supabase = getSupabaseClient() as any;
      const [challengeRows, participantResult, suggestionResult] =
        await Promise.all([
          fetchChallenges(),
          supabase
            .from("challenge_participants")
            .select("challenge_id, completion_status")
            .neq("completion_status", "withdrawn"),
          supabase
            .from("challenge_suggestions")
            .select(
              "id, coach_id, title, description, challenge_type, target_visits, proposed_reward_kp, suggested_duration_days, reason, status, created_at",
            )
            .eq("coach_id", currentUser.id)
            .order("created_at", { ascending: false }),
        ]);
      if (participantResult.error) throw participantResult.error;
      if (suggestionResult.error) throw suggestionResult.error;
      const challengeIds = challengeRows.map((challenge) => challenge.id);
      const visibleParticipants = (
        (participantResult.data ?? []) as ParticipantSummary[]
      ).filter((row) => challengeIds.includes(row.challenge_id));
      const visibleParticipantChallengeIds = new Set(
        visibleParticipants.map((row) => row.challenge_id),
      );
      setChallenges(challengeRows);
      setParticipants(visibleParticipants);
      setSuggestions((suggestionResult.data ?? []) as ChallengeSuggestion[]);
      setSelectedChallengeId((current) =>
        visibleParticipantChallengeIds.has(current)
          ? current
          : challengeRows.find((challenge) =>
              visibleParticipantChallengeIds.has(challenge.id),
            )?.id ?? "",
      );
    } catch (error) {
      if ((error as { code?: string })?.code !== "PGRST205") {
        console.error("Unable to load coach challenges:", error);
      }
      setErrorMessage(
        (error as { code?: string })?.code === "PGRST205"
          ? "Challenge data is unavailable until the Supabase challenge migration is applied."
          : error instanceof Error
            ? error.message
            : "Unable to load challenges.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timeout);
  }, [load]);

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
        console.error("Unable to load coach challenge leaderboard:", error);
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

  const participantCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const participant of participants) {
      counts[participant.challenge_id] =
        (counts[participant.challenge_id] ?? 0) + 1;
    }
    return counts;
  }, [participants]);
  const leaderboardChallenges = challenges.filter(
    (challenge) => (participantCounts[challenge.id] ?? 0) > 0,
  );

  const activeChallenges = challenges.filter(
    (challenge) => getDisplayStatus(challenge, now) === "active",
  );
  const upcomingChallenges = challenges.filter(
    (challenge) => getDisplayStatus(challenge, now) === "upcoming",
  );
  const completedParticipants = participants.filter(
    (participant) => participant.completion_status === "completed",
  ).length;

  const submitSuggestion = async () => {
    const target = Number(targetVisits);
    const duration = Number(durationDays);
    const kp = Number(reward);
    if (
      !title.trim() ||
      !description.trim() ||
      !reason.trim() ||
      !Number.isInteger(target) ||
      target <= 0 ||
      !Number.isInteger(duration) ||
      duration <= 0 ||
      !Number.isInteger(kp) ||
      kp < 0
    ) {
      setErrorMessage("Complete all suggestion fields with valid values.");
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await submitChallengeSuggestion({
        title: title.trim(),
        description: description.trim(),
        type,
        targetVisits: target,
        durationDays: duration,
        reward: kp,
        reason: reason.trim(),
      });
      setTitle("");
      setDescription("");
      setReason("");
      setFormVisible(false);
      await load();
    } catch (error) {
      console.error("Unable to submit challenge suggestion:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to submit suggestion.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.muted}>Loading coach challenges...</Text>
      </View>
    );
  }

  const shownChallenges =
    tab === "Active"
      ? activeChallenges
      : tab === "Upcoming"
        ? upcomingChallenges
        : challenges;

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
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>COACHING TOOLS</Text>
      <Text style={styles.title}>Challenges</Text>
      <Text style={styles.subtitle}>
        Monitor assigned members and suggest new attendance challenges.
      </Text>

      <View style={styles.stats}>
        <Stat label="Active" value={activeChallenges.length} />
        <Stat label="Upcoming" value={upcomingChallenges.length} />
        <Stat label="Participants" value={participants.length} />
        <Stat label="Completed" value={completedParticipants} />
      </View>

      {!!errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

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

      {(tab === "Active" || tab === "Upcoming") &&
        (shownChallenges.length === 0 ? (
          <EmptyChallenges message={`No ${tab.toLowerCase()} challenges.`} />
        ) : (
          shownChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              status={getDisplayStatus(challenge, now)}
              participantCount={participantCounts[challenge.id] ?? 0}
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
            <ChallengeLeaderboard entries={leaderboard} />
          ) : (
            <EmptyChallenges message="No challenge leaderboard is available." />
          )}
        </>
      )}

      {tab === "Suggestions" && (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => setFormVisible((visible) => !visible)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {formVisible ? "Close suggestion form" : "Suggest a challenge"}
            </Text>
          </Pressable>
          {formVisible && (
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Challenge title</Text>
              <TextInput value={title} onChangeText={setTitle} style={styles.input} />
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.multiline]}
                multiline
              />
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.typeRow}>
                {(["individual", "competitive"] as const).map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setType(value)}
                    style={[styles.typeOption, type === value && styles.typeOptionSelected]}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        type === value && styles.typeOptionTextSelected,
                      ]}
                    >
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Target visits</Text>
              <TextInput
                value={targetVisits}
                onChangeText={setTargetVisits}
                keyboardType="number-pad"
                style={styles.input}
              />
              <Text style={styles.fieldLabel}>Suggested duration (days)</Text>
              <TextInput
                value={durationDays}
                onChangeText={setDurationDays}
                keyboardType="number-pad"
                style={styles.input}
              />
              <Text style={styles.fieldLabel}>Suggested reward (KP)</Text>
              <TextInput
                value={reward}
                onChangeText={setReward}
                keyboardType="number-pad"
                style={styles.input}
              />
              <Text style={styles.fieldLabel}>Reason for suggestion</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                style={[styles.input, styles.multiline]}
                multiline
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => void submitSuggestion()}
                disabled={submitting}
                style={[styles.primaryButton, submitting && styles.disabled]}
              >
                {submitting ? (
                  <ActivityIndicator color={Theme.accentText} />
                ) : (
                  <Text style={styles.primaryButtonText}>Submit for Admin review</Text>
                )}
              </Pressable>
            </View>
          )}
          {suggestions.length === 0 ? (
            <EmptyChallenges message="Your challenge suggestions will appear here." />
          ) : (
            suggestions.map((suggestion) => (
              <View key={suggestion.id} style={styles.suggestionCard}>
                <View style={styles.suggestionHeading}>
                  <Text style={styles.cardTitle}>{suggestion.title}</Text>
                  <Text style={styles.suggestionStatus}>
                    {suggestion.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.muted}>{suggestion.description}</Text>
                <Text style={styles.muted}>
                  {suggestion.challenge_type} · {suggestion.target_visits} visits ·{" "}
                  {suggestion.suggested_duration_days} days ·{" "}
                  {suggestion.proposed_reward_kp} KP
                </Text>
                <Text style={styles.muted}>Reason: {suggestion.reason}</Text>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  content: { padding: 16, paddingBottom: 145 },
  center: {
    flex: 1,
    backgroundColor: Theme.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  eyebrow: { color: Theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  title: { color: Theme.text, fontSize: 25, fontWeight: "900", marginTop: 4 },
  subtitle: { color: Theme.textMuted, fontSize: 11, marginTop: 4, marginBottom: 14 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  stat: {
    flexGrow: 1,
    minWidth: "22%",
    backgroundColor: Theme.surface,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 11,
    alignItems: "center",
  },
  statValue: { color: Theme.text, fontSize: 16, fontWeight: "900" },
  statLabel: { color: Theme.textMuted, fontSize: 8, marginTop: 4 },
  errorBanner: { backgroundColor: Theme.errorContainer, borderRadius: 12, padding: 11, marginBottom: 12 },
  errorText: { color: Theme.error, fontSize: 10 },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  tab: { backgroundColor: Theme.surface, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10 },
  activeTab: { backgroundColor: Theme.accent },
  tabText: { color: Theme.textMuted, fontSize: 9, fontWeight: "700" },
  activeTabText: { color: Theme.accentText },
  muted: { color: Theme.textMuted, fontSize: 10, lineHeight: 15 },
  challengeSelector: { backgroundColor: Theme.surface, padding: 11, borderRadius: 10, borderWidth: 1, borderColor: Theme.border, marginBottom: 7 },
  selectedSelector: { borderColor: Theme.accent },
  selectorText: { color: Theme.textMuted, fontSize: 11, fontWeight: "700" },
  selectedSelectorText: { color: Theme.accent },
  primaryButton: {
    minHeight: 42,
    borderRadius: 11,
    backgroundColor: Theme.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  primaryButtonText: { color: Theme.accentText, fontSize: 11, fontWeight: "900" },
  formCard: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 13,
    marginBottom: 14,
  },
  fieldLabel: { color: Theme.textMuted, fontSize: 10, fontWeight: "700", marginBottom: 5, marginTop: 7 },
  input: { minHeight: 41, backgroundColor: Theme.surfaceHigh, borderRadius: 10, color: Theme.text, paddingHorizontal: 10, fontSize: 11 },
  multiline: { minHeight: 70, paddingTop: 10, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  typeOption: { flex: 1, alignItems: "center", padding: 10, borderRadius: 9, borderWidth: 1, borderColor: Theme.border },
  typeOptionSelected: { backgroundColor: Theme.accent, borderColor: Theme.accent },
  typeOptionText: { color: Theme.textMuted, fontSize: 10, textTransform: "capitalize" },
  typeOptionTextSelected: { color: Theme.accentText, fontWeight: "800" },
  suggestionCard: { padding: 13, borderRadius: 14, backgroundColor: Theme.surface, borderWidth: 1, borderColor: Theme.border, gap: 7, marginBottom: 9 },
  suggestionHeading: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  cardTitle: { flex: 1, color: Theme.text, fontSize: 12, fontWeight: "800" },
  suggestionStatus: { color: Theme.accent, fontSize: 8, fontWeight: "900" },
  disabled: { opacity: 0.6 },
});
