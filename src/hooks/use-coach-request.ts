import { createMemberSupabaseClient } from "@/utils/supabase";
import { useAuth } from "@clerk/expo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CoachRequestStatus = "pending" | "approved" | "rejected";

export type CoachRequest = {
  id: string;
  userId: string;
  status: CoachRequestStatus;
  createdAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseCoachRequest(value: unknown): CoachRequest | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    (value.status !== "pending" &&
      value.status !== "approved" &&
      value.status !== "rejected") ||
    typeof value.created_at !== "string" ||
    !Number.isFinite(Date.parse(value.created_at))
  ) {
    throw new Error("Coach request returned invalid data.");
  }

  return {
    id: value.id,
    userId: typeof value.user_id === "string" ? value.user_id : "",
    status: value.status,
    createdAt: value.created_at,
  };
}

export function useCoachRequest() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const supabaseConfigured = Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
      process.env.EXPO_PUBLIC_SUPABASE_KEY,
  );

  const getAuthToken = useCallback(async () => {
    if (!isSignedIn) return null;
    return getTokenRef.current();
  }, [isSignedIn]);

  const supabase = useMemo(() => {
    if (!supabaseConfigured) {
      return null;
    }
    try {
      return createMemberSupabaseClient(getAuthToken);
    } catch {
      return null;
    }
  }, [getAuthToken, supabaseConfigured]);

  const [coachRequest, setCoachRequest] = useState<CoachRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeUserIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !isSignedIn || !userId) {
      setCoachRequest(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      // Query against `user_id` (text/varchar) rather than `id` (uuid) to avoid
      // Postgres error 22P02 "invalid input syntax for type uuid" with Clerk user IDs (user_3L3...).
      const { data, error: queryError } = await supabase
        .from("coach_requests")
        .select("id, user_id, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (queryError) {
        console.warn("[Coach Request Load Notice]:", queryError.message);
        setError(queryError.message);
        return;
      }

      setCoachRequest(parseCoachRequest(data));
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load coach request";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, supabase, userId]);

  useEffect(() => {
    if (!isLoaded) return;
    activeUserIdRef.current = isSignedIn && userId ? userId : null;
    void load();
  }, [isLoaded, isSignedIn, load, userId]);

  const submitCoachRequest = useCallback(async () => {
    if (!supabase || !userId) {
      throw new Error("Not authenticated. Please sign in.");
    }

    // Explicitly insert into user_id (text) with Clerk User ID (e.g. user_3L3...)
    const { data, error: insertError } = await supabase
      .from("coach_requests")
      .insert({ user_id: userId })
      .select("id, user_id, status, created_at")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        await load();
        return;
      }
      throw new Error(
        insertError.message ||
          insertError.details ||
          "Could not submit your Coach request. Please try again.",
      );
    }

    const parsed = parseCoachRequest(data);
    setCoachRequest(parsed);
    return parsed;
  }, [load, supabase, userId]);

  return {
    coachRequest,
    isLoading: !isLoaded || (isSignedIn && isLoading),
    error,
    submitCoachRequest,
    refresh: load,
  };
}
