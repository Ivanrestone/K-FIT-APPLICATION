import type {
  AvailabilityWindow,
  SessionRecord,
  SessionStatus,
} from "@/lib/coach";
import { displayName } from "@/lib/coach";
import { useStaffSupabase } from "@/hooks/use-staff-supabase";
import { useCallback, useEffect, useState } from "react";

type RawSessionRow = {
  id: string;
  coach_id: string;
  member_id: string;
  focus: string | null;
  location: string | null;
  starts_at: string;
  duration_minutes: number;
  status: SessionStatus;
  notes: string | null;
  member:
    | {
        id: string;
        email: string | null;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
      }
    | null
    | {
        id: string;
        email: string | null;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
      }[];
};

const SESSION_SELECT =
  "id, coach_id, member_id, focus, location, starts_at, duration_minutes, status, notes, member:users!member_id(id, email, first_name, last_name, full_name)";

const firstRow = <T,>(value: T | T[] | null): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : value;

export function useCoachSessions(coachId?: string | null) {
  const { supabase, userId, configured } = useStaffSupabase();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const targetCoachId = coachId ?? userId;

  const load = useCallback(async () => {
    if (!supabase) {
      if (!configured) setError("Supabase is not configured.");
      setIsLoading(false);
      return;
    }
    if (!targetCoachId) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("training_sessions")
      .select(SESSION_SELECT)
      .eq("coach_id", targetCoachId)
      .order("starts_at", { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setIsLoading(false);
      return;
    }

    const mapped = ((data ?? []) as unknown as RawSessionRow[]).map((row) => {
      const member = firstRow(row.member);
      return {
        id: row.id,
        coachId: row.coach_id,
        memberId: row.member_id,
        memberName: member
          ? displayName(member)
          : "Unknown member",
        focus: row.focus ?? "Coaching session",
        location: row.location ?? "Floor 1",
        startsAt: row.starts_at,
        durationMinutes: row.duration_minutes,
        status: row.status,
        notes: row.notes,
      } satisfies SessionRecord;
    });

    setSessions(mapped);
    setError(null);
    setIsLoading(false);
  }, [configured, supabase, targetCoachId]);

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

  const updateStatus = useCallback(
    async (id: string, status: SessionStatus) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      setSessions((prev) =>
        prev.map((session) =>
          session.id === id ? { ...session, status } : session,
        ),
      );
      const { error: updateError } = await supabase
        .from("training_sessions")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (updateError) {
        await load();
        throw new Error(updateError.message);
      }
    },
    [load, supabase],
  );

  const reschedule = useCallback(
    async (id: string, startsAt: string, durationMinutes: number) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error: updateError } = await supabase
        .from("training_sessions")
        .update({
          starts_at: startsAt,
          duration_minutes: durationMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (updateError) throw new Error(updateError.message);
      await load();
    },
    [load, supabase],
  );

  const saveNotes = useCallback(
    async (id: string, notes: string) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error: updateError } = await supabase
        .from("training_sessions")
        .update({ notes, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (updateError) throw new Error(updateError.message);
      setSessions((prev) =>
        prev.map((session) =>
          session.id === id ? { ...session, notes } : session,
        ),
      );
    },
    [supabase],
  );

  const createSession = useCallback(
    async (input: {
      memberId: string;
      startsAt: string;
      durationMinutes: number;
      focus: string;
      location: string;
      notes?: string;
    }) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      if (!targetCoachId) throw new Error("No coach account is signed in.");
      const { error: insertError } = await supabase
        .from("training_sessions")
        .insert({
          coach_id: targetCoachId,
          member_id: input.memberId,
          starts_at: input.startsAt,
          duration_minutes: input.durationMinutes,
          focus: input.focus,
          location: input.location,
          notes: input.notes ?? null,
          status: "pending",
        });
      if (insertError) throw new Error(insertError.message);
      await load();
    },
    [load, supabase, targetCoachId],
  );

  return {
    sessions,
    isLoading,
    error,
    refresh: load,
    updateStatus,
    reschedule,
    saveNotes,
    createSession,
  };
}

/* ───────────────────────── Weekly availability ───────────────────────── */

type RawAvailabilityRow = {
  weekday: number;
  start_minutes: number;
  end_minutes: number;
};

export function useCoachAvailability() {
  const { supabase, userId, configured } = useStaffSupabase();
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      if (!configured) setError("Supabase is not configured.");
      setIsLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("coach_availability")
      .select("weekday, start_minutes, end_minutes")
      .eq("coach_id", userId)
      .order("weekday", { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setIsLoading(false);
      return;
    }

    setWindows(
      ((data ?? []) as RawAvailabilityRow[]).map((row) => ({
        weekday: row.weekday,
        startMinutes: row.start_minutes,
        endMinutes: row.end_minutes,
      })),
    );
    setError(null);
    setIsLoading(false);
  }, [configured, supabase, userId]);

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

  const save = useCallback(
    async (next: AvailabilityWindow[]) => {
      if (!supabase || !userId) throw new Error("Not signed in.");
      setIsSaving(true);
      try {
        const { error: deleteError } = await supabase
          .from("coach_availability")
          .delete()
          .eq("coach_id", userId);
        if (deleteError) throw new Error(deleteError.message);

        if (next.length > 0) {
          const { error: insertError } = await supabase
            .from("coach_availability")
            .insert(
              next.map((window) => ({
                coach_id: userId,
                weekday: window.weekday,
                start_minutes: window.startMinutes,
                end_minutes: window.endMinutes,
              })),
            );
          if (insertError) throw new Error(insertError.message);
        }

        await load();
      } finally {
        setIsSaving(false);
      }
    },
    [load, supabase, userId],
  );

  return { windows, isLoading, error, isSaving, save, refresh: load };
}
