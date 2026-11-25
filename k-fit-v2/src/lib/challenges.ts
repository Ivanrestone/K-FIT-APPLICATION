import { getSupabaseClient } from "@/lib/supabase";

export type ChallengeType = "individual" | "competitive";
export type ChallengeStatus =
  | "draft"
  | "published"
  | "paused"
  | "finalizing"
  | "completed"
  | "cancelled"
  | "archived";

export type Challenge = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  category: string;
  challenge_type: ChallengeType;
  target_visits: number;
  completion_reward_kp: number;
  start_at: string | null;
  end_at: string | null;
  enrollment_open_at: string | null;
  enrollment_deadline: string | null;
  max_participants: number | null;
  minimum_session_minutes: number;
  max_daily_visits: number;
  timezone: string;
  visibility: "public" | "restricted";
  rules: string;
  instructions: string;
  status: ChallengeStatus;
  created_at: string;
};

export type ChallengeLeaderboardEntry = {
  participant_id: string;
  member_id: string;
  first_name: string | null;
  last_name: string | null;
  total_visits: number;
  target_visits: number;
  progress_percentage: number;
  completion_status: "in_progress" | "completed" | "withdrawn";
  joined_at: string;
  last_visit_at: string | null;
  final_rank: number;
};

export type ChallengeSuggestion = {
  id: string;
  coach_id: string;
  title: string;
  description: string;
  challenge_type: ChallengeType;
  target_visits: number;
  proposed_reward_kp: number;
  suggested_duration_days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  coach_name?: string;
};

const client = () => getSupabaseClient() as any;

export async function fetchChallenges(): Promise<Challenge[]> {
  const { data, error } = await client()
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Challenge[];
}

export async function fetchLeaderboard(
  challengeId: string,
): Promise<ChallengeLeaderboardEntry[]> {
  const { data, error } = await client().rpc("get_challenge_leaderboard", {
    p_challenge_id: challengeId,
  });
  if (error) throw error;
  return (data ?? []) as ChallengeLeaderboardEntry[];
}

export async function joinChallenge(challengeId: string): Promise<string> {
  const { data, error } = await client().rpc("join_challenge", {
    p_challenge_id: challengeId,
  });
  if (error) throw error;
  return data as string;
}

export async function saveChallenge(input: {
  id: string | null;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  type: ChallengeType;
  targetVisits: number;
  startAt: string | null;
  endAt: string | null;
  enrollmentOpenAt: string | null;
  enrollmentDeadline: string | null;
  maxParticipants: number | null;
  minimumSessionMinutes: number;
  maxDailyVisits: number;
  completionReward: number;
  firstPlaceReward: number;
  secondPlaceReward: number;
  thirdPlaceReward: number;
  visibility: "public" | "restricted";
  rules: string;
  instructions: string;
}): Promise<string> {
  const { data, error } = await client().rpc("admin_save_challenge", {
    p_challenge_id: input.id,
    p_title: input.title,
    p_description: input.description,
    p_image_url: input.imageUrl || null,
    p_category: input.category,
    p_challenge_type: input.type,
    p_target_visits: input.targetVisits,
    p_start_at: input.startAt,
    p_end_at: input.endAt,
    p_enrollment_open_at: input.enrollmentOpenAt,
    p_enrollment_deadline: input.enrollmentDeadline,
    p_max_participants: input.maxParticipants,
    p_minimum_session_minutes: input.minimumSessionMinutes,
    p_max_daily_visits: input.maxDailyVisits,
    p_completion_reward_kp: input.completionReward,
    p_first_place_reward_kp: input.firstPlaceReward,
    p_second_place_reward_kp: input.secondPlaceReward,
    p_third_place_reward_kp: input.thirdPlaceReward,
    p_visibility: input.visibility,
    p_rules: input.rules,
    p_instructions: input.instructions,
  });
  if (error) throw error;
  return data as string;
}

export async function publishChallenge(challengeId: string): Promise<void> {
  const { error } = await client().rpc("admin_publish_challenge", {
    p_challenge_id: challengeId,
  });
  if (error) throw error;
}

export async function changeChallengeStatus(
  challengeId: string,
  action: "pause" | "resume" | "cancel" | "archive",
): Promise<void> {
  const { error } = await client().rpc("admin_change_challenge_status", {
    p_challenge_id: challengeId,
    p_action: action,
  });
  if (error) throw error;
}

export async function finalizeChallenge(challengeId: string): Promise<void> {
  const { error } = await client().rpc("admin_finalize_challenge", {
    p_challenge_id: challengeId,
  });
  if (error) throw error;
}

export async function reviewChallengeSuggestion(
  suggestionId: string,
  decision: "approve" | "reject",
): Promise<string | null> {
  const { data, error } = await client().rpc(
    "admin_review_challenge_suggestion",
    { p_suggestion_id: suggestionId, p_decision: decision },
  );
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function submitChallengeSuggestion(input: {
  title: string;
  description: string;
  type: ChallengeType;
  targetVisits: number;
  durationDays: number;
  reward: number;
  reason: string;
}): Promise<string> {
  const { data, error } = await client().rpc("submit_challenge_suggestion", {
    p_title: input.title,
    p_description: input.description,
    p_challenge_type: input.type,
    p_target_visits: input.targetVisits,
    p_suggested_duration_days: input.durationDays,
    p_proposed_reward_kp: input.reward,
    p_reason: input.reason,
  });
  if (error) throw error;
  return data as string;
}
