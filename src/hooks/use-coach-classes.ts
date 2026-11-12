import type { ClassRecord, ClassReservation } from "@/lib/coach";
import { displayName } from "@/lib/coach";
import { useStaffSupabase } from "@/hooks/use-staff-supabase";
import { useCallback, useEffect, useState } from "react";

type RawMember = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
};

type RawReservationRow = {
  id: string;
  member_id: string;
  checked_in_at: string | null;
  member: RawMember | RawMember[] | null;
};

type RawClassRow = {
  id: string;
  coach_id: string;
  title: string;
  category: string;
  room: string;
  starts_at: string;
  duration_minutes: number;
  capacity: number;
  status: "scheduled" | "cancelled";
  class_reservations: RawReservationRow[] | null;
};

const CLASS_SELECT =
  "id, coach_id, title, category, room, starts_at, duration_minutes, capacity, status, class_reservations(id, member_id, checked_in_at, member:users!member_id(id, email, first_name, last_name, full_name))";

const firstRow = <T,>(value: T | T[] | null): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : value;

export type ClassInput = {
  title: string;
  category: string;
  room: string;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
};

export function useCoachClasses(coachId?: string | null) {
  const { supabase, userId, configured } = useStaffSupabase();
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const targetCoachId = coachId ?? userId;

  const load = useCallback(async () => {
    if (!supabase) {
      if (!configured) setError("Supabase is not configured.");
      setIsLoading(false);
      return;
    }

    let request = supabase
      .from("fitness_classes")
      .select(CLASS_SELECT)
      .order("starts_at", { ascending: true });

    if (targetCoachId) {
      request = request.eq("coach_id", targetCoachId);
    }

    const { data, error: queryError } = await request;
    if (queryError) {
      setError(queryError.message);
      setIsLoading(false);
      return;
    }

    const mapped = ((data ?? []) as unknown as RawClassRow[]).map((row) => {
      const reservations: ClassReservation[] = (row.class_reservations ?? []).map(
        (reservation) => {
          const member = firstRow(reservation.member);
          return {
            id: reservation.id,
            memberId: reservation.member_id,
            memberName: member ? displayName(member) : "Unknown member",
            checkedInAt: reservation.checked_in_at,
          };
        },
      );
      return {
        id: row.id,
        coachId: row.coach_id,
        title: row.title,
        category: row.category,
        room: row.room,
        startsAt: row.starts_at,
        durationMinutes: row.duration_minutes,
        capacity: row.capacity,
        status: row.status,
        reservations,
      } satisfies ClassRecord;
    });

    setClasses(mapped);
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

  const createClass = useCallback(
    async (input: ClassInput) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      if (!targetCoachId) throw new Error("No coach account is signed in.");
      const { error: insertError } = await supabase
        .from("fitness_classes")
        .insert({
          coach_id: targetCoachId,
          title: input.title,
          category: input.category,
          room: input.room,
          starts_at: input.startsAt,
          duration_minutes: input.durationMinutes,
          capacity: input.capacity,
        });
      if (insertError) throw new Error(insertError.message);
      await load();
    },
    [load, supabase, targetCoachId],
  );

  const updateClass = useCallback(
    async (id: string, input: ClassInput) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error: updateError } = await supabase
        .from("fitness_classes")
        .update({
          title: input.title,
          category: input.category,
          room: input.room,
          starts_at: input.startsAt,
          duration_minutes: input.durationMinutes,
          capacity: input.capacity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (updateError) throw new Error(updateError.message);
      await load();
    },
    [load, supabase],
  );

  const cancelClass = useCallback(
    async (id: string) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error: updateError } = await supabase
        .from("fitness_classes")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (updateError) throw new Error(updateError.message);
      await load();
    },
    [load, supabase],
  );

  const setCheckedIn = useCallback(
    async (reservationId: string, checkedIn: boolean) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error: updateError } = await supabase
        .from("class_reservations")
        .update({ checked_in_at: checkedIn ? new Date().toISOString() : null })
        .eq("id", reservationId);
      if (updateError) throw new Error(updateError.message);
      await load();
    },
    [load, supabase],
  );

  return {
    classes,
    isLoading,
    error,
    refresh: load,
    createClass,
    updateClass,
    cancelClass,
    setCheckedIn,
  };
}
