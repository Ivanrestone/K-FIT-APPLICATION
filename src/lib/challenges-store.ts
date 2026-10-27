import type { Feather } from "@expo/vector-icons";
import { useMemo, useSyncExternalStore } from "react";

const DAY = 86_400_000;

export type Audience = "trainer" | "member";
export type Actor = "admin" | "trainer" | "member";

export type Challenge = {
  id: string;
  title: string;
  target: string;
  points: number;
  createdAt: number;
  endsAt: number;
  participants: number;
  avgProgress: number; // 0-100, average across participants
};

export type ChallengeInput = {
  title: string;
  target: string;
  points: number;
  days: number;
};

export type Suggestion = ChallengeInput & {
  id: string;
  by: string;
  createdAt: number;
};

export type Notice = {
  id: string;
  audience: Audience;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
};

export type Leader = {
  rank: number;
  name: string;
  badge: string;
  points: number;
  pct: number;
};

type MemberEntry = { joined: boolean; progress: number };

type State = {
  challenges: Challenge[];
  suggestions: Suggestion[];
  notices: Notice[];
  member: Record<string, MemberEntry>;
  seen: Record<Audience, string[]>;
};

/* ------------------------------ Demo data ------------------------------ */
// Replace with API data. The store shape can stay the same.
const t0 = Date.now();

const seedChallenges: Challenge[] = [
  {
    id: "C-1",
    title: "Summer Shred 30-Day Sprint",
    target: "20 workouts completed",
    points: 650,
    createdAt: t0 - 18 * DAY,
    endsAt: t0 + 12 * DAY,
    participants: 38,
    avgProgress: 71,
  },
  {
    id: "C-2",
    title: "100k Steps Weekly Race",
    target: "100,000 cardio steps",
    points: 400,
    createdAt: t0 - 4 * DAY,
    endsAt: t0 + 3 * DAY,
    participants: 52,
    avgProgress: 42,
  },
  {
    id: "C-3",
    title: "500kg Powerlifting Club",
    target: "Bench + squat + deadlift",
    points: 1000,
    createdAt: t0 - 40 * DAY,
    endsAt: t0 + 20 * DAY,
    participants: 17,
    avgProgress: 88,
  },
  {
    id: "C-4",
    title: "Early Bird Streak",
    target: "7 AM check-ins (5 days)",
    points: 300,
    createdAt: t0 - 2 * DAY,
    endsAt: t0 + 5 * DAY,
    participants: 29,
    avgProgress: 60,
  },
];

export const LEADERBOARD: Leader[] = [
  { rank: 1, name: "Alex Rivera", badge: "🥇", points: 2450, pct: 98 },
  { rank: 2, name: "Jessica Taylor", badge: "🥈", points: 2100, pct: 84 },
  { rank: 3, name: "Elena Rostova", badge: "🥉", points: 1890, pct: 75 },
  { rank: 4, name: "David Miller", badge: "4", points: 1420, pct: 56 },
];

const seedNotices: Notice[] = [
  {
    id: "n1",
    audience: "trainer",
    icon: "clock",
    title: "Session starting soon",
    body: "Devon Miles at 2:00 PM, Powerlifting.",
    createdAt: t0 - 5 * 60_000,
    read: false,
  },
  {
    id: "n2",
    audience: "trainer",
    icon: "user-plus",
    title: "New booking",
    body: "Kira Nerys booked a 1-on-1 for Friday.",
    createdAt: t0 - 32 * 60_000,
    read: false,
  },
  {
    id: "n3",
    audience: "trainer",
    icon: "bell",
    title: "Gym announcement",
    body: "Studio B is closed for cleaning at 6 PM.",
    createdAt: t0 - 2 * 3_600_000,
    read: true,
  },
];

let state: State = {
  challenges: seedChallenges,
  suggestions: [],
  notices: seedNotices,
  member: {
    "C-1": { joined: true, progress: 85 },
    "C-2": { joined: false, progress: 0 },
    "C-3": { joined: true, progress: 95 },
    "C-4": { joined: false, progress: 0 },
  },
  seen: {
    trainer: seedChallenges.map((c) => c.id),
    member: seedChallenges.map((c) => c.id),
  },
};

/* -------------------------------- Plumbing ------------------------------- */
const listeners = new Set<() => void>();

function setState(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export function useChallengeStore() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

export function useNotices(audience: Audience) {
  const { notices } = useChallengeStore();
  return useMemo(() => {
    const list = notices
      .filter((n) => n.audience === audience)
      .sort((a, b) => b.createdAt - a.createdAt);
    return { notices: list, unread: list.filter((n) => !n.read).length };
  }, [notices, audience]);
}

/* ------------------------------- Selectors ------------------------------- */
export const unseenCount = (s: State, audience: Audience) =>
  s.challenges.filter((c) => !s.seen[audience].includes(c.id)).length;

export function timeLeft(endsAt: number) {
  const days = Math.ceil((endsAt - Date.now()) / DAY);
  if (days <= 0) return "Ended";
  return days === 1 ? "1 day left" : `${days} days left`;
}

export function timeAgo(ts: number) {
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ------------------------------ Validation ------------------------------- */
export function parseChallengeInput(raw: {
  title: string;
  target: string;
  points: string;
  days: string;
}): { ok: true; value: ChallengeInput } | { ok: false; error: string } {
  const title = raw.title.trim();
  const target = raw.target.trim();
  const points = parseInt(raw.points, 10);
  const days = parseInt(raw.days, 10);

  if (title.length < 3)
    return { ok: false, error: "Give the challenge a title (3+ characters)." };
  if (!target)
    return { ok: false, error: "Describe the target, e.g. 20 workouts." };
  if (!Number.isFinite(points) || points < 1 || points > 10000)
    return { ok: false, error: "XP reward must be between 1 and 10,000." };
  if (!Number.isFinite(days) || days < 1 || days > 365)
    return { ok: false, error: "Duration must be between 1 and 365 days." };
  return { ok: true, value: { title, target, points, days } };
}

/* -------------------------------- Actions -------------------------------- */
// NOTE: the `actor` check only protects the UI. Enforce the same rule on your
// backend (admin-only endpoint) or anyone can bypass it.
function requireAdmin(actor: Actor) {
  if (actor !== "admin") throw new Error("Only admins can do this.");
}

export function publishChallenge(input: ChallengeInput, actor: Actor) {
  requireAdmin(actor);
  const createdAt = Date.now();
  const challenge: Challenge = {
    id: `C-${createdAt}`,
    title: input.title,
    target: input.target,
    points: input.points,
    createdAt,
    endsAt: createdAt + input.days * DAY,
    participants: 0,
    avgProgress: 0,
  };
  const notice = (audience: Audience, body: string): Notice => ({
    id: uid(),
    audience,
    icon: "flag",
    title: "New challenge",
    body,
    createdAt,
    read: false,
  });

  setState({
    ...state,
    challenges: [challenge, ...state.challenges],
    member: { ...state.member, [challenge.id]: { joined: false, progress: 0 } },
    notices: [
      notice(
        "trainer",
        `${input.title} is live (+${input.points} XP). Encourage your members to join.`,
      ),
      notice(
        "member",
        `${input.title} is live. Join to earn +${input.points} XP.`,
      ),
      ...state.notices,
    ],
  });
  return challenge;
}

export function removeChallenge(id: string, actor: Actor) {
  requireAdmin(actor);
  setState({
    ...state,
    challenges: state.challenges.filter((c) => c.id !== id),
  });
}

export function suggestChallenge(
  input: ChallengeInput,
  by: string,
  actor: Actor,
) {
  if (actor !== "trainer")
    throw new Error("Only trainers can send suggestions.");
  setState({
    ...state,
    suggestions: [
      { ...input, id: uid(), by, createdAt: Date.now() },
      ...state.suggestions,
    ],
  });
}

export function publishSuggestion(id: string, actor: Actor) {
  requireAdmin(actor);
  const s = state.suggestions.find((x) => x.id === id);
  if (!s) return;
  publishChallenge(
    { title: s.title, target: s.target, points: s.points, days: s.days },
    actor,
  );
  setState({
    ...state,
    suggestions: state.suggestions.filter((x) => x.id !== id),
  });
}

export function dismissSuggestion(id: string, actor: Actor) {
  requireAdmin(actor);
  setState({
    ...state,
    suggestions: state.suggestions.filter((x) => x.id !== id),
  });
}

export function toggleJoin(id: string) {
  const entry = state.member[id] ?? { joined: false, progress: 0 };
  const joined = !entry.joined;
  setState({
    ...state,
    member: { ...state.member, [id]: { ...entry, joined } },
    challenges: state.challenges.map((c) =>
      c.id === id
        ? {
            ...c,
            participants: Math.max(0, c.participants + (joined ? 1 : -1)),
          }
        : c,
    ),
  });
}

export function markChallengesSeen(audience: Audience) {
  setState({
    ...state,
    seen: { ...state.seen, [audience]: state.challenges.map((c) => c.id) },
  });
}

export function markNoticeRead(audience: Audience, id: string) {
  setState({
    ...state,
    notices: state.notices.map((n) =>
      n.audience === audience && n.id === id ? { ...n, read: true } : n,
    ),
  });
}

export function markAllNoticesRead(audience: Audience) {
  setState({
    ...state,
    notices: state.notices.map((n) =>
      n.audience === audience ? { ...n, read: true } : n,
    ),
  });
}
