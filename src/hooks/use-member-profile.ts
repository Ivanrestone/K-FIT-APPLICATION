import { useAuth } from "@clerk/expo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createMemberSupabaseClient } from "@/utils/supabase";

export type MemberRole = "member" | "coach" | "admin";
export type CoachRequestStatus = "pending" | "approved" | "rejected";

export type MemberProfile = {
  id: string;
  role: MemberRole;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

export type CoachRequest = {
  id: string;
  status: CoachRequestStatus;
  createdAt: string;
};

type ProfileFields = {
  email: string;
  firstName: string;
  lastName: string;
};

type ProfileQueryState = {
  userId: string;
  profile: MemberProfile | null;
  coachRequest: CoachRequest | null;
};

type ProfileErrorState = {
  userId: string;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseProfile(value: unknown): MemberProfile | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    (value.role !== "member" && value.role !== "coach" && value.role !== "admin") ||
    (value.email !== null && typeof value.email !== "string") ||
    (value.first_name !== null && typeof value.first_name !== "string") ||
    (value.last_name !== null && typeof value.last_name !== "string")
  ) {
    return null;
  }

  return {
    id: value.id,
    role: value.role,
    email: value.email,
    firstName: value.first_name,
    lastName: value.last_name,
  };
}

function parseCoachRequest(value: unknown): CoachRequest | null {
  if (value === null) {
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
    status: value.status,
    createdAt: value.created_at,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Could not load your profile. Please try again.";
}

export function useMemberProfile() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const clientResult = useMemo(() => {
    try {
      return {
        client: createMemberSupabaseClient(() =>
          isSignedIn ? getTokenRef.current() : Promise.resolve(null)
        ),
        error: null,
      };
    } catch {
      return {
        client: null,
        error: "Supabase is not configured for profile access.",
      };
    }
  }, [isSignedIn]);
  const supabase = clientResult.client;
  const [queryState, setQueryState] = useState<ProfileQueryState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<ProfileErrorState | null>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const latestLoadIdRef = useRef(0);

  const load = useCallback(async () => {
    if (
      !supabase ||
      !isSignedIn ||
      !userId ||
      activeUserIdRef.current !== userId
    ) {
      setIsLoading(false);
      return;
    }

    const loadId = ++latestLoadIdRef.current;
    setIsLoading(true);
    try {
      const [profileResult, requestResult] = await Promise.all([
        supabase
          .from("users")
          .select("id, role, email, first_name, last_name")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("coach_requests")
          .select("id, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (
        activeUserIdRef.current !== userId ||
        latestLoadIdRef.current !== loadId
      ) {
        return;
      }
      if (profileResult.error) {
        throw new Error(profileResult.error.message || "Could not load your K-Fit profile.");
      }
      if (requestResult.error) {
        throw new Error(requestResult.error.message || "Could not load your Coach request status.");
      }

      const profile = profileResult.data
        ? parseProfile(profileResult.data)
        : null;
      if (profileResult.data && !profile) {
        throw new Error("Your profile returned invalid data.");
      }

      setQueryState({
        userId,
        profile,
        coachRequest: parseCoachRequest(requestResult.data),
      });
      setLoadError(null);
    } catch (loadError) {
      if (
        activeUserIdRef.current === userId &&
        latestLoadIdRef.current === loadId
      ) {
        setLoadError({ userId, message: getErrorMessage(loadError) });
      }
    } finally {
      if (
        activeUserIdRef.current === userId &&
        latestLoadIdRef.current === loadId
      ) {
        setIsLoading(false);
      }
    }
  }, [isSignedIn, supabase, userId]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    const activeUserId = isSignedIn && userId ? userId : null;
    activeUserIdRef.current = activeUserId;
    latestLoadIdRef.current += 1;
    if (!isSignedIn || !userId) {
      setQueryState(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }
    setQueryState((current) => current?.userId === userId ? current : null);
    setLoadError((current) => current?.userId === userId ? current : null);
    setIsLoading(true);
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !supabase) {
      return;
    }
    void load();
  }, [isLoaded, isSignedIn, load, supabase, userId]);

  const saveMissingProfileFields = useCallback(async (fields: ProfileFields) => {
    if (
      !supabase ||
      !userId ||
      queryState?.userId !== userId ||
      !queryState.profile
    ) {
      throw new Error("Your profile is not available to edit.");
    }
    if (
      fields.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)
    ) {
      throw new Error("Enter a valid email address.");
    }

    const updates: {
      email?: string | null;
      first_name?: string | null;
      last_name?: string | null;
    } = {};
    if (!queryState.profile.email?.trim()) {
      updates.email = fields.email.trim() || null;
    }
    if (!queryState.profile.firstName?.trim()) {
      updates.first_name = fields.firstName.trim() || null;
    }
    if (!queryState.profile.lastName?.trim()) {
      updates.last_name = fields.lastName.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return queryState.profile;
    }

    const { data, error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select("id, role, email, first_name, last_name")
      .maybeSingle();

    if (updateError) {
      throw new Error("Could not save your profile. Please try again.");
    }
    const profile = data ? parseProfile(data) : null;
    if (!profile) {
      throw new Error("Your profile was not saved. Please retry.");
    }

    setQueryState((current) =>
      current?.userId === userId ? { ...current, profile } : current
    );
    return profile;
  }, [queryState, supabase, userId]);

  const submitCoachRequest = useCallback(async () => {
    if (
      !supabase ||
      !userId ||
      queryState?.userId !== userId ||
      queryState?.profile?.role !== "member"
    ) {
      throw new Error("Only provisioned members can request Coach status.");
    }

    const { data, error: insertError } = await supabase
      .from("coach_requests")
      .insert({ user_id: userId })
      .select("id, status, created_at")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        await load();
        return;
      }
      throw new Error("Could not submit your Coach request. Please try again.");
    }

    const coachRequest = parseCoachRequest(data);
    if (!coachRequest) {
      throw new Error("The Coach request was not returned after submission.");
    }
    setQueryState((current) =>
      current?.userId === userId
        ? { ...current, coachRequest }
        : current
    );
  }, [load, queryState?.profile?.role, queryState?.userId, supabase, userId]);

  const currentQueryState = isSignedIn && queryState?.userId === userId
    ? queryState
    : null;
  const currentLoadError = isSignedIn && loadError?.userId === userId
    ? loadError
    : null;
  return {
    coachRequest: currentQueryState?.coachRequest ?? null,
    error: clientResult.error ?? currentLoadError?.message ?? null,
    isLoading: !isLoaded ||
      (isSignedIn && !clientResult.error &&
        (isLoading || (!currentQueryState && !currentLoadError))),
    isSignedIn,
    load,
    profile: currentQueryState?.profile ?? null,
    saveMissingProfileFields,
    submitCoachRequest,
  };
}
