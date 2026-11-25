import { getCurrentUser } from "@/lib/auth";
import {
  Challenge,
  ChallengeLeaderboardEntry,
  ChallengeSuggestion,
  changeChallengeStatus,
  fetchChallenges,
  fetchLeaderboard,
  finalizeChallenge,
  publishChallenge,
  reviewChallengeSuggestion,
  saveChallenge,
} from "@/lib/challenges";
import { getSupabaseClient } from "@/lib/supabase";
import { Theme } from "@/components/admin/theme";
import {
  ChallengeCard,
  ChallengeFilters,
  ChallengeLeaderboard,
  EmptyChallenges,
} from "@/components/challenges";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type SuggestionWithCoach = ChallengeSuggestion & { coach_name: string };
type Participant = { challenge_id: string };
type RewardSummary = { kp_amount: number };

type ChallengeForm = {
  id: string | null;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  type: "individual" | "competitive";
  targetVisits: string;
  startAt: string;
  endAt: string;
  enrollmentOpenAt: string;
  enrollmentDeadline: string;
  maxParticipants: string;
  minimumSessionMinutes: string;
  maxDailyVisits: string;
  completionReward: string;
  firstPlaceReward: string;
  secondPlaceReward: string;
  thirdPlaceReward: string;
  visibility: "public" | "restricted";
  rules: string;
  instructions: string;
};

const EMPTY_FORM: ChallengeForm = {
  id: null,
  title: "",
  description: "",
  imageUrl: "",
  category: "General Fitness",
  type: "individual",
  targetVisits: "15",
  startAt: "",
  endAt: "",
  enrollmentOpenAt: "",
  enrollmentDeadline: "",
  maxParticipants: "",
  minimumSessionMinutes: "15",
  maxDailyVisits: "1",
  completionReward: "100",
  firstPlaceReward: "200",
  secondPlaceReward: "150",
  thirdPlaceReward: "100",
  visibility: "public",
  rules: "",
  instructions: "",
};

const FILTERS = [
  "All",
  "Active",
  "Upcoming",
  "Completed",
  "Drafts",
  "Archived",
];

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

function dateToInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}:00`;
}

function dateFromInput(value: string) {
  if (!value.trim()) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return parsed.toISOString();
}

export default function AdminChallengesScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionWithCoach[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totalDistributed, setTotalDistributed] = useState(0);
  const [selectedChallengeId, setSelectedChallengeId] = useState("");
  const [leaderboardState, setLeaderboardState] = useState<{
    challengeId: string;
    rows: ChallengeLeaderboardEntry[];
  } | null>(null);
  const [filter, setFilter] = useState("All");
  const [section, setSection] = useState<"challenges" | "suggestions">(
    "challenges",
  );
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState<ChallengeForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      if (currentUser.user_metadata?.role !== "admin") {
        router.replace(
          currentUser.user_metadata?.role === "coach"
            ? "/coach/dashboard"
            : "/member/dashboard",
        );
        return;
      }
      setRefreshing(true);
      setErrorMessage(null);
      setNow(Date.now());
      const supabase = getSupabaseClient() as any;
      const [challengeRows, suggestionResult, participantResult, rewardResult] =
        await Promise.all([
          fetchChallenges(),
          supabase
            .from("challenge_suggestions")
            .select(
              "id, coach_id, title, description, challenge_type, target_visits, proposed_reward_kp, suggested_duration_days, reason, status, created_at",
            )
            .order("created_at", { ascending: false }),
          supabase.from("challenge_participants").select("challenge_id"),
          supabase.from("challenge_rewards").select("kp_amount"),
        ]);
      if (suggestionResult.error) throw suggestionResult.error;
      if (participantResult.error) throw participantResult.error;
      if (rewardResult.error) throw rewardResult.error;
      const suggestionRows = suggestionResult.data ?? [];
      const coachIds = [...new Set(suggestionRows.map((row: any) => row.coach_id))];
      let coachesById = new Map<string, { first_name: string | null; last_name: string | null }>();
      if (coachIds.length > 0) {
        const { data: coachRows, error: coachError } = await supabase
          .from("users")
          .select("id, first_name, last_name")
          .in("id", coachIds);
        if (coachError) throw coachError;
        coachesById = new Map(
          (coachRows ?? []).map((coach: any) => [coach.id, coach]),
        );
      }

      setChallenges(challengeRows);
      setSuggestions(
        suggestionRows.map((suggestion: ChallengeSuggestion) => {
          const coach = coachesById.get(suggestion.coach_id);
          return {
            ...suggestion,
            coach_name:
              [coach?.first_name, coach?.last_name].filter(Boolean).join(" ") ||
              "Coach",
          };
        }),
      );
      setParticipants((participantResult.data ?? []) as Participant[]);
      setTotalDistributed(
        (rewardResult.data ?? []).reduce(
          (sum: number, row: RewardSummary) => sum + Number(row.kp_amount),
          0,
        ),
      );
      setSelectedChallengeId((current) =>
        challengeRows.some((challenge) => challenge.id === current)
          ? current
          : "",
      );
    } catch (error) {
      if ((error as { code?: string })?.code !== "PGRST205") {
        console.error("Unable to load Admin challenges:", error);
      }
      setErrorMessage(
        (error as { code?: string })?.code === "PGRST205"
          ? "Challenge management is unavailable until the Supabase challenge migration is applied."
          : error instanceof Error
            ? error.message
            : "Unable to load challenge data.",
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
    if (!selectedChallengeId) return;
    let active = true;
    fetchLeaderboard(selectedChallengeId)
      .then((rows) => {
        if (active) {
          setLeaderboardState({ challengeId: selectedChallengeId, rows });
        }
      })
      .catch((error) => {
        console.error("Unable to load Admin challenge participants:", error);
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load participants.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [selectedChallengeId]);
  const leaderboard =
    leaderboardState?.challengeId === selectedChallengeId
      ? leaderboardState.rows
      : [];

  const activeCount = challenges.filter(
    (challenge) => getDisplayStatus(challenge, now) === "active",
  ).length;
  const upcomingCount = challenges.filter(
    (challenge) => getDisplayStatus(challenge, now) === "upcoming",
  ).length;
  const completedCount = challenges.filter(
    (challenge) => challenge.status === "completed",
  ).length;
  const pendingSuggestions = suggestions.filter(
    (suggestion) => suggestion.status === "pending",
  ).length;
  const participantCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const participant of participants) {
      counts[participant.challenge_id] =
        (counts[participant.challenge_id] ?? 0) + 1;
    }
    return counts;
  }, [participants]);
  const shownChallenges = challenges.filter((challenge) => {
    const status = getDisplayStatus(challenge, now);
    if (filter === "Active") return status === "active";
    if (filter === "Upcoming") return status === "upcoming";
    if (filter === "Completed") return challenge.status === "completed";
    if (filter === "Drafts") return challenge.status === "draft";
    if (filter === "Archived") return challenge.status === "archived";
    return true;
  });

  const setField = <K extends keyof ChallengeForm>(
    field: K,
    value: ChallengeForm[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const saveDraft = async () => {
    const numericFields = [
      form.targetVisits,
      form.minimumSessionMinutes,
      form.maxDailyVisits,
      form.completionReward,
      form.firstPlaceReward,
      form.secondPlaceReward,
      form.thirdPlaceReward,
    ].map(Number);
    const [
      targetVisits,
      minimumSessionMinutes,
      maxDailyVisits,
      completionReward,
      firstPlaceReward,
      secondPlaceReward,
      thirdPlaceReward,
    ] = numericFields;
    const maxParticipants = form.maxParticipants
      ? Number(form.maxParticipants)
      : null;
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      numericFields.some((value) => !Number.isInteger(value) || value < 0) ||
      targetVisits <= 0 ||
      minimumSessionMinutes <= 0 ||
      maxDailyVisits <= 0 ||
      (maxParticipants !== null &&
        (!Number.isInteger(maxParticipants) || maxParticipants <= 0))
    ) {
      setErrorMessage("Enter a title, description, positive visit settings, and valid rewards.");
      return;
    }
    setSaving(true);
    setErrorMessage(null);
    try {
      const id = await saveChallenge({
        id: form.id,
        title: form.title.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        category: form.category.trim() || "General Fitness",
        type: form.type,
        targetVisits,
        startAt: dateFromInput(form.startAt),
        endAt: dateFromInput(form.endAt),
        enrollmentOpenAt: dateFromInput(form.enrollmentOpenAt),
        enrollmentDeadline: dateFromInput(form.enrollmentDeadline),
        maxParticipants,
        minimumSessionMinutes,
        maxDailyVisits,
        completionReward,
        firstPlaceReward,
        secondPlaceReward,
        thirdPlaceReward,
        visibility: form.visibility,
        rules: form.rules.trim(),
        instructions: form.instructions.trim(),
      });
      setSelectedChallengeId(id);
      setFormVisible(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (error) {
      console.error("Unable to save challenge:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save challenge.",
      );
    } finally {
      setSaving(false);
    }
  };

  const editChallenge = async (challenge: Challenge) => {
    const { data, error } = await (getSupabaseClient() as any)
      .from("challenge_reward_configurations")
      .select("rank_position, kp_amount")
      .eq("challenge_id", challenge.id)
      .order("rank_position", { ascending: true });
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    const rewardByRank = new Map(
      (data ?? []).map((reward: { rank_position: number; kp_amount: number }) => [
        reward.rank_position,
        reward.kp_amount,
      ]),
    );
    setForm({
      ...EMPTY_FORM,
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      imageUrl: challenge.image_url ?? "",
      category: challenge.category,
      type: challenge.challenge_type,
      targetVisits: String(challenge.target_visits),
      startAt: dateToInput(challenge.start_at),
      endAt: dateToInput(challenge.end_at),
      enrollmentOpenAt: dateToInput(challenge.enrollment_open_at),
      enrollmentDeadline: dateToInput(challenge.enrollment_deadline),
      maxParticipants: challenge.max_participants
        ? String(challenge.max_participants)
        : "",
      minimumSessionMinutes: String(challenge.minimum_session_minutes),
      maxDailyVisits: String(challenge.max_daily_visits),
      completionReward: String(challenge.completion_reward_kp),
      firstPlaceReward: String(rewardByRank.get(1) ?? 0),
      secondPlaceReward: String(rewardByRank.get(2) ?? 0),
      thirdPlaceReward: String(rewardByRank.get(3) ?? 0),
      visibility: challenge.visibility,
      rules: challenge.rules,
      instructions: challenge.instructions,
    });
    setFormVisible(true);
    setSection("challenges");
  };

  const confirmAction = (
    challenge: Challenge,
    action: "publish" | "pause" | "resume" | "cancel" | "archive" | "finalize",
  ) => {
    const actionText = action === "finalize" ? "finalize results and award placement KP" : action;
    Alert.alert(
      `${actionText[0].toUpperCase()}${actionText.slice(1)} challenge?`,
      `${challenge.title}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: action === "cancel" ? "destructive" : "default",
          onPress: () => void runAction(challenge, action),
        },
      ],
    );
  };

  const runAction = async (
    challenge: Challenge,
    action: "publish" | "pause" | "resume" | "cancel" | "archive" | "finalize",
  ) => {
    setErrorMessage(null);
    try {
      if (action === "publish") await publishChallenge(challenge.id);
      else if (action === "finalize") await finalizeChallenge(challenge.id);
      else await changeChallengeStatus(challenge.id, action);
      await load();
    } catch (error) {
      console.error(`Unable to ${action} challenge:`, error);
      setErrorMessage(
        error instanceof Error ? error.message : `Unable to ${action} challenge.`,
      );
    }
  };

  const reviewSuggestion = async (
    suggestion: ChallengeSuggestion,
    decision: "approve" | "reject",
  ) => {
    Alert.alert(
      `${decision === "approve" ? "Approve" : "Reject"} suggestion?`,
      decision === "approve"
        ? "Approval creates an unpublished challenge draft for Admin editing."
        : suggestion.title,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: decision === "approve" ? "Approve" : "Reject",
          style: decision === "reject" ? "destructive" : "default",
          onPress: async () => {
            try {
              const draftId = await reviewChallengeSuggestion(
                suggestion.id,
                decision,
              );
              if (draftId) setSelectedChallengeId(draftId);
              await load();
            } catch (error) {
              console.error("Unable to review challenge suggestion:", error);
              setErrorMessage(
                error instanceof Error ? error.message : "Unable to review suggestion.",
              );
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.muted}>Loading challenge management...</Text>
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
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>K-FIT MANAGEMENT</Text>
      <Text style={styles.title}>Challenges</Text>
      <Text style={styles.subtitle}>
        Configure attendance competitions, review coaches&apos; suggestions, and
        manage rewards.
      </Text>

      <View style={styles.stats}>
        <Stat label="Total" value={challenges.length} />
        <Stat label="Active" value={activeCount} />
        <Stat label="Upcoming" value={upcomingCount} />
        <Stat label="Completed" value={completedCount} />
        <Stat label="Participants" value={participants.length} />
        <Stat label="KP distributed" value={totalDistributed} />
        <Stat label="Pending ideas" value={pendingSuggestions} />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/admin/points")}
        style={styles.pointsButton}
      >
        <Text style={styles.pointsButtonText}>Manage member KP ledger</Text>
      </Pressable>

      {!!errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <View style={styles.sectionTabs}>
        {(["challenges", "suggestions"] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            onPress={() => setSection(value)}
            style={[styles.sectionTab, section === value && styles.sectionTabActive]}
          >
            <Text
              style={[
                styles.sectionTabText,
                section === value && styles.sectionTabTextActive,
              ]}
            >
              {value === "challenges" ? "All challenges" : "Coach suggestions"}
            </Text>
          </Pressable>
        ))}
      </View>

      {section === "challenges" && (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setForm(EMPTY_FORM);
              setFormVisible((visible) => !visible);
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {formVisible ? "Close editor" : "Create challenge"}
            </Text>
          </Pressable>

          {formVisible && (
            <ChallengeEditor
              form={form}
              setField={setField}
              saving={saving}
              onSave={() => void saveDraft()}
            />
          )}

          <ChallengeFilters
            values={FILTERS}
            selected={filter}
            onSelect={setFilter}
          />
          {shownChallenges.length === 0 ? (
            <EmptyChallenges message="No challenges match this status." />
          ) : (
            shownChallenges.map((challenge) => (
              <View key={challenge.id}>
                <ChallengeCard
                  challenge={challenge}
                  participantCount={participantCounts[challenge.id] ?? 0}
                  status={getDisplayStatus(challenge, now)}
                  onPress={() =>
                    setSelectedChallengeId((current) =>
                      current === challenge.id ? "" : challenge.id,
                    )
                  }
                  action={
                    <View style={styles.actionGroup}>
                      {challenge.status === "draft" && (
                        <ActionButton
                          label="Publish"
                          onPress={() => confirmAction(challenge, "publish")}
                        />
                      )}
                      {challenge.status === "published" && (
                        <>
                          <ActionButton
                            label="Pause"
                            onPress={() => confirmAction(challenge, "pause")}
                          />
                          <ActionButton
                            label="Cancel"
                            danger
                            onPress={() => confirmAction(challenge, "cancel")}
                          />
                        </>
                      )}
                      {challenge.status === "paused" && (
                        <>
                          <ActionButton
                            label="Resume"
                            onPress={() => confirmAction(challenge, "resume")}
                          />
                          <ActionButton
                            label="Cancel"
                            danger
                            onPress={() => confirmAction(challenge, "cancel")}
                          />
                        </>
                      )}
                      {challenge.status === "completed" && (
                        <ActionButton
                          label="Archive"
                          onPress={() => confirmAction(challenge, "archive")}
                        />
                      )}
                      {challenge.status === "cancelled" && (
                        <ActionButton
                          label="Archive"
                          onPress={() => confirmAction(challenge, "archive")}
                        />
                      )}
                      {(challenge.status === "published" ||
                        challenge.status === "paused") &&
                        challenge.end_at &&
                        new Date(challenge.end_at).getTime() <= now && (
                          <ActionButton
                            label="Finalize results"
                            onPress={() => confirmAction(challenge, "finalize")}
                          />
                        )}
                      {challenge.status !== "completed" &&
                        challenge.status !== "cancelled" &&
                        challenge.status !== "archived" && (
                          <ActionButton
                            label="Edit"
                            onPress={() => void editChallenge(challenge)}
                          />
                        )}
                    </View>
                  }
                />
                {selectedChallengeId === challenge.id && (
                  <View style={styles.leaderboardPanel}>
                    <Text style={styles.sectionTitle}>
                      Participants & leaderboard
                    </Text>
                    <ChallengeLeaderboard entries={leaderboard} />
                  </View>
                )}
              </View>
            ))
          )}
        </>
      )}

      {section === "suggestions" &&
        (suggestions.length === 0 ? (
          <EmptyChallenges message="No coach suggestions have been submitted." />
        ) : (
          suggestions.map((suggestion) => (
            <View key={suggestion.id} style={styles.suggestionCard}>
              <View style={styles.suggestionHeading}>
                <Text style={styles.cardTitle}>{suggestion.title}</Text>
                <Text style={styles.suggestionStatus}>
                  {suggestion.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.muted}>Suggested by {suggestion.coach_name}</Text>
              <Text style={styles.muted}>{suggestion.description}</Text>
              <Text style={styles.muted}>
                {suggestion.challenge_type} · {suggestion.target_visits} visits ·{" "}
                {suggestion.suggested_duration_days} days ·{" "}
                {suggestion.proposed_reward_kp} KP
              </Text>
              <Text style={styles.muted}>Reason: {suggestion.reason}</Text>
              {suggestion.status === "pending" && (
                <View style={styles.actionGroup}>
                  <ActionButton
                    label="Approve as draft"
                    onPress={() => void reviewSuggestion(suggestion, "approve")}
                  />
                  <ActionButton
                    label="Reject"
                    danger
                    onPress={() => void reviewSuggestion(suggestion, "reject")}
                  />
                </View>
              )}
            </View>
          ))
        ))}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.actionButton, danger && styles.dangerButton]}
    >
      <Text style={[styles.actionText, danger && styles.dangerText]}>{label}</Text>
    </Pressable>
  );
}

function ChallengeEditor({
  form,
  setField,
  saving,
  onSave,
}: {
  form: ChallengeForm;
  setField: <K extends keyof ChallengeForm>(
    field: K,
    value: ChallengeForm[K],
  ) => void;
  saving: boolean;
  onSave: () => void;
}) {
  const textField = (
    key: keyof ChallengeForm,
    label: string,
    multiline = false,
    placeholder = "",
    keyboardType: "default" | "number-pad" = "default",
  ) => (
    <View key={key} style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={String(form[key] ?? "")}
        onChangeText={(value) => setField(key, value as ChallengeForm[typeof key])}
        placeholder={placeholder}
        placeholderTextColor={Theme.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );

  return (
    <View style={styles.formCard}>
      <Text style={styles.formSection}>Basic information</Text>
      {textField("title", "Title", false, "30-Day Gym Consistency")}
      {textField("description", "Description", true)}
      {textField("imageUrl", "Image URL (optional)", false, "https://")}
      {textField("category", "Category", false, "General Fitness")}
      <Text style={styles.formSection}>Challenge configuration</Text>
      <View style={styles.typeRow}>
        {(["individual", "competitive"] as const).map((type) => (
          <Pressable
            key={type}
            onPress={() => setField("type", type)}
            style={[styles.typeOption, form.type === type && styles.typeOptionSelected]}
          >
            <Text
              style={[
                styles.typeOptionText,
                form.type === type && styles.typeOptionTextSelected,
              ]}
            >
              {type}
            </Text>
          </Pressable>
        ))}
      </View>
      {textField("targetVisits", "Attendance target (visits)", false, "", "number-pad")}
      {textField("minimumSessionMinutes", "Minimum eligible session (minutes)", false, "", "number-pad")}
      {textField("maxDailyVisits", "Maximum visits per local day", false, "", "number-pad")}
      {textField("maxParticipants", "Maximum participants (optional)", false, "", "number-pad")}
      <Text style={styles.formSection}>Enrollment and schedule</Text>
      {textField("enrollmentOpenAt", "Enrollment opens (ISO date/time)", false, "2026-12-01T08:00:00+08:00")}
      {textField("enrollmentDeadline", "Enrollment deadline (ISO date/time)", false, "2026-12-05T23:59:00+08:00")}
      {textField("startAt", "Challenge starts (ISO date/time)", false, "2026-12-06T00:00:00+08:00")}
      {textField("endAt", "Challenge ends (ISO date/time)", false, "2027-01-05T23:59:00+08:00")}
      <Text style={styles.formSection}>K-FIT Points rewards</Text>
      {textField("completionReward", "Individual completion reward (KP)", false, "", "number-pad")}
      {textField("firstPlaceReward", "First place (KP)", false, "", "number-pad")}
      {textField("secondPlaceReward", "Second place (KP)", false, "", "number-pad")}
      {textField("thirdPlaceReward", "Third place (KP)", false, "", "number-pad")}
      <Text style={styles.formSection}>Rules and visibility</Text>
      <View style={styles.typeRow}>
        {(["public", "restricted"] as const).map((visibility) => (
          <Pressable
            key={visibility}
            onPress={() => setField("visibility", visibility)}
            style={[
              styles.typeOption,
              form.visibility === visibility && styles.typeOptionSelected,
            ]}
          >
            <Text
              style={[
                styles.typeOptionText,
                form.visibility === visibility && styles.typeOptionTextSelected,
              ]}
            >
              {visibility}
            </Text>
          </Pressable>
        ))}
      </View>
      {textField("rules", "Rules", true)}
      {textField("instructions", "Instructions", true)}
      <Text style={styles.muted}>
        Attendance source is the existing completed QR/NFC gym check-in record.
        Default timezone: Asia/Manila.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onSave}
        disabled={saving}
        style={[styles.primaryButton, saving && styles.disabled]}
      >
        {saving ? (
          <ActivityIndicator color={Theme.accentText} />
        ) : (
          <Text style={styles.primaryButtonText}>
            {form.id ? "Save challenge" : "Save as draft"}
          </Text>
        )}
      </Pressable>
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
  subtitle: { color: Theme.textMuted, fontSize: 11, lineHeight: 16, marginTop: 4, marginBottom: 14 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 10 },
  stat: { flexGrow: 1, minWidth: "22%", padding: 9, alignItems: "center", backgroundColor: Theme.surface, borderRadius: 12, borderWidth: 1, borderColor: Theme.border },
  statValue: { color: Theme.text, fontSize: 14, fontWeight: "900" },
  statLabel: { color: Theme.textMuted, fontSize: 8, marginTop: 4, textAlign: "center" },
  pointsButton: { backgroundColor: Theme.surfaceHigh, padding: 12, borderRadius: 11, marginBottom: 12 },
  pointsButtonText: { color: Theme.accent, fontSize: 11, fontWeight: "800", textAlign: "center" },
  errorBanner: { backgroundColor: Theme.errorContainer, borderRadius: 12, padding: 11, marginBottom: 12 },
  errorText: { color: Theme.error, fontSize: 10 },
  sectionTabs: { flexDirection: "row", gap: 7, marginBottom: 11 },
  sectionTab: { flex: 1, padding: 10, backgroundColor: Theme.surface, borderRadius: 10, alignItems: "center" },
  sectionTabActive: { backgroundColor: Theme.accent },
  sectionTabText: { color: Theme.textMuted, fontSize: 10, fontWeight: "700" },
  sectionTabTextActive: { color: Theme.accentText },
  primaryButton: { minHeight: 42, borderRadius: 11, backgroundColor: Theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, marginBottom: 10 },
  primaryButtonText: { color: Theme.accentText, fontSize: 11, fontWeight: "900" },
  actionGroup: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  actionButton: { paddingHorizontal: 9, paddingVertical: 7, backgroundColor: Theme.surfaceHigh, borderRadius: 8 },
  actionText: { color: Theme.accent, fontSize: 9, fontWeight: "800" },
  dangerButton: { backgroundColor: Theme.errorContainer },
  dangerText: { color: Theme.error },
  leaderboardPanel: { padding: 12, backgroundColor: Theme.surface, borderRadius: 14, marginBottom: 12, gap: 8 },
  sectionTitle: { color: Theme.text, fontSize: 13, fontWeight: "800" },
  suggestionCard: { padding: 13, borderRadius: 14, backgroundColor: Theme.surface, borderWidth: 1, borderColor: Theme.border, gap: 7, marginBottom: 9 },
  suggestionHeading: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  cardTitle: { flex: 1, color: Theme.text, fontSize: 12, fontWeight: "800" },
  suggestionStatus: { color: Theme.accent, fontSize: 8, fontWeight: "900" },
  muted: { color: Theme.textMuted, fontSize: 10, lineHeight: 15 },
  formCard: { padding: 13, backgroundColor: Theme.surface, borderRadius: 16, borderWidth: 1, borderColor: Theme.border, marginBottom: 13 },
  formSection: { color: Theme.accent, fontSize: 11, fontWeight: "900", marginTop: 10, marginBottom: 6 },
  field: { marginBottom: 5 },
  fieldLabel: { color: Theme.textMuted, fontSize: 9, fontWeight: "700", marginBottom: 4 },
  input: { minHeight: 40, backgroundColor: Theme.surfaceHigh, borderRadius: 9, color: Theme.text, paddingHorizontal: 10, fontSize: 10 },
  multiline: { minHeight: 64, paddingTop: 10, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 5 },
  typeOption: { flex: 1, alignItems: "center", padding: 9, borderRadius: 9, borderWidth: 1, borderColor: Theme.border },
  typeOptionSelected: { backgroundColor: Theme.accent, borderColor: Theme.accent },
  typeOptionText: { color: Theme.textMuted, fontSize: 10, textTransform: "capitalize" },
  typeOptionTextSelected: { color: Theme.accentText, fontWeight: "800" },
  disabled: { opacity: 0.6 },
});
