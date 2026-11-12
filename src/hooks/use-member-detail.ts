import type { RoutineExercise, RoutineRecord } from "@/lib/coach";
import { displayName } from "@/lib/coach";
import { useStaffSupabase } from "@/hooks/use-staff-supabase";
import { useCallback, useEffect, useState } from "react";

export type MemberVisit = {
  id: string;
  scannedAt: string;
  checkedOutAt: string | null;
};

export type MemberSubscription = {
  plan: "app" | "gym";
  active: boolean;
  /** `active` plus a non-expired period, resolved when the data loads. */
  isActive: boolean;
  expiresAt: string | null;
  cancelledAt: string | null;
};

export type MemberDetail = {
  id: string;
  name: string;
  email: string;
  role: string;
  subscriptions: MemberSubscription[];
  visits: MemberVisit[];
  routines: RoutineRecord[];
};

export type RoutineDraft = {
  id?: string;
  name: string;
  notes: string;
  exercises: {
    dayOfWeek: number;
    name: string;
    sets: number;
    reps: string;
    restSeconds: number;
  }[];
};

type RawUser = {
  id: string;
  role: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
};

type RawSubscription = {
  active: boolean;
  expires_at: string | null;
  cancelled_at: string | null;
};

type RawVisit = {
  id: string;
  scan_timestamp: string;
  checkout_timestamp: string | null;
};

type RawRoutine = {
  id: string;
  member_id: string;
  name: string;
  notes: string | null;
  workout_exercises:
    | {
        id: string;
        day_of_week: number;
        name: string;
        sets: number;
        reps: string;
        rest_seconds: number;
        position: number;
      }[]
    | null;
};

export function useMemberDetail(memberId: string | null) {
  const { supabase, userId } = useStaffSupabase();
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !memberId) {
      setIsLoading(false);
      return;
    }

    const [userResult, appResult, gymResult, visitResult, routineResult] =
      await Promise.all([
        supabase
          .from("users")
          .select("id, role, email, first_name, last_name, full_name")
          .eq("id", memberId)
          .maybeSingle(),
        supabase
          .from("subscriptions_app")
          .select("active, expires_at, cancelled_at")
          .eq("user_id", memberId)
          .maybeSingle(),
        supabase
          .from("subscriptions_gym")
          .select("active, expires_at, cancelled_at")
          .eq("user_id", memberId)
          .maybeSingle(),
        supabase
          .from("attendance_logs")
          .select("id, scan_timestamp, checkout_timestamp")
          .eq("member_id", memberId)
          .order("scan_timestamp", { ascending: false })
          .limit(20),
        supabase
          .from("workout_routines")
          .select(
            "id, member_id, name, notes, workout_exercises(id, day_of_week, name, sets, reps, rest_seconds, position)",
          )
          .eq("member_id", memberId)
          .order("created_at", { ascending: false }),
      ]);

    const failure =
      userResult.error ??
      appResult.error ??
      gymResult.error ??
      visitResult.error ??
      routineResult.error;
    if (failure) {
      setError(failure.message);
      setIsLoading(false);
      return;
    }

    if (!userResult.data) {
      setError("This member could not be found.");
      setDetail(null);
      setIsLoading(false);
      return;
    }

    const user = userResult.data as RawUser;
    const subscriptions: MemberSubscription[] = [];
    const pushSubscription = (
      plan: "app" | "gym",
      row: RawSubscription | null,
    ) => {
      if (!row) return;
      const notExpired =
        !row.expires_at || new Date(row.expires_at).getTime() > Date.now();
      subscriptions.push({
        plan,
        active: row.active,
        isActive: row.active && notExpired,
        expiresAt: row.expires_at,
        cancelledAt: row.cancelled_at,
      });
    };
    pushSubscription("app", appResult.data as RawSubscription | null);
    pushSubscription("gym", gymResult.data as RawSubscription | null);

    const routines: RoutineRecord[] = (
      (routineResult.data ?? []) as unknown as RawRoutine[]
    ).map((routine) => ({
      id: routine.id,
      memberId: routine.member_id,
      name: routine.name,
      notes: routine.notes,
      exercises: (routine.workout_exercises ?? [])
        .map(
          (exercise): RoutineExercise => ({
            id: exercise.id,
            dayOfWeek: exercise.day_of_week,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            restSeconds: exercise.rest_seconds,
            position: exercise.position,
          }),
        )
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.position - b.position),
    }));

    setDetail({
      id: user.id,
      name: displayName(user),
      email: user.email ?? "",
      role: user.role,
      subscriptions,
      visits: ((visitResult.data ?? []) as RawVisit[]).map((visit) => ({
        id: visit.id,
        scannedAt: visit.scan_timestamp,
        checkedOutAt: visit.checkout_timestamp,
      })),
      routines,
    });
    setError(null);
    setIsLoading(false);
  }, [memberId, supabase]);

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

  /** Creates or replaces a routine and its exercises. */
  const saveRoutine = useCallback(
    async (draft: RoutineDraft) => {
      if (!supabase || !memberId) throw new Error("Not signed in.");
      if (!userId) throw new Error("Not signed in.");

      let routineId = draft.id;
      if (routineId) {
        const { error: updateError } = await supabase
          .from("workout_routines")
          .update({
            name: draft.name,
            notes: draft.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", routineId);
        if (updateError) throw new Error(updateError.message);

        const { error: deleteError } = await supabase
          .from("workout_exercises")
          .delete()
          .eq("routine_id", routineId);
        if (deleteError) throw new Error(deleteError.message);
      } else {
        const { data: created, error: insertError } = await supabase
          .from("workout_routines")
          .insert({
            coach_id: userId,
            member_id: memberId,
            name: draft.name,
            notes: draft.notes || null,
          })
          .select("id")
          .single();
        if (insertError) throw new Error(insertError.message);
        routineId = created?.id as string;
      }

      if (draft.exercises.length > 0) {
        const { error: exerciseError } = await supabase
          .from("workout_exercises")
          .insert(
            draft.exercises.map((exercise, index) => ({
              routine_id: routineId,
              day_of_week: exercise.dayOfWeek,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              rest_seconds: exercise.restSeconds,
              position: index,
            })),
          );
        if (exerciseError) throw new Error(exerciseError.message);
      }

      await load();
      return routineId;
    },
    [load, memberId, supabase, userId],
  );

  const deleteRoutine = useCallback(
    async (routineId: string) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error: deleteError } = await supabase
        .from("workout_routines")
        .delete()
        .eq("id", routineId);
      if (deleteError) throw new Error(deleteError.message);
      await load();
    },
    [load, supabase],
  );

  return { detail, isLoading, error, refresh: load, saveRoutine, deleteRoutine };
}
