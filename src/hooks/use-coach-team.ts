import type { CoachRecord, DutyStatus, MemberRecord } from "@/lib/coach";
import { displayName } from "@/lib/coach";
import { useStaffSupabase } from "@/hooks/use-staff-supabase";
import { useCallback, useEffect, useState } from "react";

type ProfileEmbed =
  | {
      specialty: string | null;
      bio: string | null;
      hourly_rate: number | string | null;
      duty_status: DutyStatus | null;
    }
  | {
      specialty: string | null;
      bio: string | null;
      hourly_rate: number | string | null;
      duty_status: DutyStatus | null;
    }[]
  | null;

type RawUserRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  coach_profiles: ProfileEmbed;
};

type SearchableMember = {
  id: string;
  name: string;
  email: string;
};

const asNumber = (value: number | string | null): number => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0;
};

const firstProfile = (embed: ProfileEmbed) =>
  Array.isArray(embed) ? (embed[0] ?? null) : embed;

const isDutyStatus = (value: unknown): value is DutyStatus =>
  value === "on_floor" ||
  value === "in_session" ||
  value === "on_break" ||
  value === "off_duty";

export function useCoachTeam() {
  const { supabase, configured } = useStaffSupabase();
  const [coaches, setCoaches] = useState<CoachRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      if (!configured) {
        setError("Supabase is not configured.");
      }
      setIsLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("users")
      .select(
        "id, email, first_name, last_name, full_name, coach_profiles(specialty, bio, hourly_rate, duty_status)",
      )
      .eq("role", "coach")
      .order("first_name", { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setIsLoading(false);
      return;
    }

    const mapped = ((data ?? []) as unknown as RawUserRow[]).map((row) => {
      const profile = firstProfile(row.coach_profiles);
      const duty = isDutyStatus(profile?.duty_status)
        ? profile.duty_status
        : "off_duty";
      return {
        id: row.id,
        name: displayName(row),
        email: row.email ?? "",
        specialty: profile?.specialty ?? "General coaching",
        bio: profile?.bio ?? "",
        hourlyRate: asNumber(profile?.hourly_rate ?? 0),
        dutyStatus: duty,
      } satisfies CoachRecord;
    });

    setCoaches(mapped);
    setError(null);
    setIsLoading(false);
  }, [configured, supabase]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await Promise.resolve();
      if (!cancelled) {
        await load();
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [load]);

  /** Members that can still be promoted — role is exactly `member`. */
  const searchMembers = useCallback(
    async (query: string): Promise<SearchableMember[]> => {
      if (!supabase) return [];
      const term = query.trim().replace(/[%,()]/g, "");
      let request = supabase
        .from("users")
        .select("id, email, first_name, last_name, full_name")
        .eq("role", "member")
        .limit(20);

      if (term.length > 0) {
        request = request.or(
          [
            `email.ilike.%${term}%`,
            `first_name.ilike.%${term}%`,
            `last_name.ilike.%${term}%`,
            `full_name.ilike.%${term}%`,
            `id.ilike.%${term}%`,
          ].join(","),
        );
      }

      const { data, error: queryError } = await request;
      if (queryError) throw new Error(queryError.message);

      return ((data ?? []) as unknown as RawUserRow[]).map((row) => ({
        id: row.id,
        name: displayName(row),
        email: row.email ?? "",
      }));
    },
    [supabase],
  );

  const addTrainer = useCallback(
    async (input: {
      userId: string;
      specialty: string;
      bio: string;
      hourlyRate: number;
    }) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error: rpcError } = await supabase.rpc(
        "promote_member_to_coach",
        {
          p_user_id: input.userId,
          p_specialty: input.specialty,
          p_bio: input.bio,
          p_hourly_rate: input.hourlyRate,
        },
      );
      if (rpcError) {
        if (rpcError.message.includes("member_not_found")) {
          throw new Error(
            "That account is no longer a member. Refresh the search and try again.",
          );
        }
        if (rpcError.message.includes("not_staff")) {
          throw new Error("Only staff accounts can add coaches.");
        }
        throw new Error(rpcError.message);
      }
      await load();
    },
    [load, supabase],
  );

  const setDutyStatus = useCallback(
    async (status: DutyStatus) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error: rpcError } = await supabase.rpc(
        "set_coach_duty_status",
        { p_status: status },
      );
      if (rpcError) throw new Error(rpcError.message);
      await load();
    },
    [load, supabase],
  );

  return {
    coaches,
    isLoading,
    error,
    refresh: load,
    searchMembers,
    addTrainer,
    setDutyStatus,
  };
}

/** The signed-in coach's own floor status, persisted in coach_profiles. */
export function useMyDutyStatus() {
  const { supabase, userId } = useStaffSupabase();
  const [dutyStatus, setDuty] = useState<DutyStatus>("off_duty");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!supabase || !userId) {
        setIsLoading(false);
        return;
      }
      const { data } = await supabase
        .from("coach_profiles")
        .select("duty_status")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (data && isDutyStatus(data.duty_status)) {
        setDuty(data.duty_status);
      }
      setIsLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  const setDutyStatus = useCallback(
    async (status: DutyStatus) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const previous = dutyStatus;
      setDuty(status);
      const { error: rpcError } = await supabase.rpc("set_coach_duty_status", {
        p_status: status,
      });
      if (rpcError) {
        setDuty(previous);
        throw new Error(rpcError.message);
      }
    },
    [dutyStatus, supabase],
  );

  return { dutyStatus, isLoading, setDutyStatus };
}

/**
 * Members for the roster: every `member` account plus the gym subscription
 * state and how many visits were logged in `attendance_logs`.
 */
export function useRosterMembers() {
  const { supabase, configured } = useStaffSupabase();
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      if (!configured) setError("Supabase is not configured.");
      setIsLoading(false);
      return;
    }

    const [usersResult, gymResult, attendanceResult, sessionsResult] =
      await Promise.all([
        supabase
          .from("users")
          .select("id, email, first_name, last_name, full_name")
          .eq("role", "member")
          .order("first_name", { ascending: true }),
        supabase
          .from("subscriptions_gym")
          .select("user_id, active, expires_at"),
        supabase.from("attendance_logs").select("member_id, scan_timestamp"),
        supabase
          .from("training_sessions")
          .select("member_id, starts_at, status")
          .eq("status", "confirmed"),
      ]);

    const failure =
      usersResult.error ??
      gymResult.error ??
      attendanceResult.error ??
      sessionsResult.error;
    if (failure) {
      setError(failure.message);
      setIsLoading(false);
      return;
    }

    const gymByUser = new Map<string, { active: boolean; expires_at: string | null }>();
    for (const row of (gymResult.data ?? []) as {
      user_id: string;
      active: boolean;
      expires_at: string | null;
    }[]) {
      gymByUser.set(row.user_id, row);
    }

    const visitCount = new Map<string, number>();
    const lastVisit = new Map<string, string>();
    for (const row of (attendanceResult.data ?? []) as {
      member_id: string;
      scan_timestamp: string;
    }[]) {
      visitCount.set(row.member_id, (visitCount.get(row.member_id) ?? 0) + 1);
      const current = lastVisit.get(row.member_id);
      if (!current || row.scan_timestamp > current) {
        lastVisit.set(row.member_id, row.scan_timestamp);
      }
    }

    const nextSession = new Map<string, string>();
    const now = Date.now();
    for (const row of (sessionsResult.data ?? []) as {
      member_id: string;
      starts_at: string;
    }[]) {
      if (new Date(row.starts_at).getTime() < now) continue;
      const current = nextSession.get(row.member_id);
      if (!current || row.starts_at < current) {
        nextSession.set(row.member_id, row.starts_at);
      }
    }

    const mapped = ((usersResult.data ?? []) as unknown as RawUserRow[]).map(
      (row) => {
        const gym = gymByUser.get(row.id);
        const active =
          Boolean(gym?.active) &&
          (!gym?.expires_at || new Date(gym.expires_at).getTime() > now);
        return {
          id: row.id,
          name: displayName(row),
          email: row.email ?? "",
          status: active ? "Active" : "Expired",
          plan: active ? "Gym access" : "No gym plan",
          visits: visitCount.get(row.id) ?? 0,
          lastVisit: lastVisit.get(row.id) ?? null,
          nextSession: nextSession.get(row.id) ?? null,
        } satisfies MemberRecord;
      },
    );

    setMembers(mapped);
    setError(null);
    setIsLoading(false);
  }, [configured, supabase]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await Promise.resolve();
      if (!cancelled) {
        await load();
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { members, isLoading, error, refresh: load };
}
