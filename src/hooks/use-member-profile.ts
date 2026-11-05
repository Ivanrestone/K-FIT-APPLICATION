import { createMemberSupabaseClient } from "@/utils/supabase";
import { useAuth, useUser } from "@clerk/expo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

function hasMissingRole(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

function parseProfile(value: unknown): MemberProfile | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    (value.email !== null && typeof value.email !== "string") ||
    (value.first_name !== null && typeof value.first_name !== "string") ||
    (value.last_name !== null && typeof value.last_name !== "string")
  ) {
    return null;
  }

  const role =
    value.role === "coach" || value.role === "admin"
      ? value.role
      : "member";

  return {
    id: value.id,
    role,
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

function parseMetadataRole(value: unknown): MemberRole {
  return value === "coach" || value === "admin" ? value : "member";
}

type ClerkProfileSource = {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  publicMetadata?: Record<string, unknown> | null;
} | null | undefined;

/**
 * Builds a usable profile from the Clerk session when Supabase has no row yet
 * or its read fails. A missing role is never an error: it defaults to member.
 */
function buildFallbackProfile(
  userId: string,
  user: ClerkProfileSource,
): MemberProfile {
  const nameParts = (user?.fullName ?? "").trim().split(/\s+/).filter(Boolean);
  const firstName = user?.firstName?.trim() || nameParts[0] || null;
  const lastName = user?.lastName?.trim() ||
    (nameParts.length > 1 ? nameParts.slice(1).join(" ") : null);

  return {
    id: userId,
    role: parseMetadataRole(user?.publicMetadata?.role),
    email: user?.primaryEmailAddress?.emailAddress?.trim() || null,
    firstName,
    lastName,
  };
}

export function useMemberProfile() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const clientResult = useMemo(() => {
    const getTokenRef = getToken;
    return {
      client: createMemberSupabaseClient(() =>
        isSignedIn ? getTokenRef() : Promise.resolve(null)
      ),
      error: null,
    };
  }, [isSignedIn, getToken]);
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

      // A failed profile read (RLS, offline, missing row) must never surface as
      // a role error: fall back to the Clerk session and the member role.
      if (profileResult.error) {
        console.warn(
          "[Profile Load Notice]:",
          profileResult.error.message,
        );
      }

      let profile = profileResult.data
        ? parseProfile(profileResult.data)
        : null;
      if (profileResult.data && !profile) {
        console.warn("[Profile Load Notice]: profile returned invalid data.");
      }

      if (profile && profileResult.data && hasMissingRole(profileResult.data.role)) {
        const { error: roleRepairError } = await supabase
          .from("users")
          .update({ role: "member" })
          .eq("id", userId);
        if (roleRepairError) {
          console.warn(
            "[Profile Role Repair Notice]:",
            roleRepairError.message,
          );
        }
      }

      if (!profile) {
        try {
          const { data: provisioned, error: provisionError } =
            await supabase.functions.invoke("provision-user");
          if (provisionError) {
            throw provisionError;
          }

          const provisionedProfile =
            isRecord(provisioned) && "profile" in provisioned
              ? parseProfile(provisioned.profile)
              : null;
          if (provisionedProfile && provisionedProfile.id === userId) {
            profile = provisionedProfile;
          }
        } catch (provisionError) {
          console.warn(
            "[Profile Provisioning Notice]:",
            getErrorMessage(provisionError),
          );
        }
      }

      if (!profile) {
        const currentUser = userRef.current;
        profile = buildFallbackProfile(userId, currentUser);
      }

      if (
        activeUserIdRef.current !== userId ||
        latestLoadIdRef.current !== loadId
      ) {
        return;
      }

      let coachRequest: CoachRequest | null = null;
      if (requestResult.error) {
        console.warn(
          "[Coach Request Load Notice]:",
          requestResult.error.message,
        );
      } else {
        try {
          coachRequest = parseCoachRequest(requestResult.data);
        } catch (coachError) {
          console.warn(
            "[Coach Request Load Notice]:",
            getErrorMessage(coachError),
          );
        }
      }

      setQueryState({ userId, profile, coachRequest });
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

  // Signing out or switching accounts clears the profile state so the next
  // load starts from a clean slate. This effect only resets profile query
  // Signing out or switching accounts clears the profile state so the next
  // load starts from a clean slate. This effect only resets profile query
  // Signing out or switching accounts clears the profile state so the next
  // load starts from a clean slate. This is a one-shot effect that reads auth
  // state and resets the profile query reference; it does not touch data
  // Signing out or switching accounts clears the profile state so the next
  // load starts from a clean slate. This effect only resets profile query
  // state and does not touch data-loading state.
  useEffect(() => {
    if (!isSignedIn || !userId) {
      setQueryState(null);
      setLoadError(null);
    }
  }, [isSignedIn, userId]);

  // Load the profile, requests, and coach request state once the supabase
  // client is ready, then refresh on subsequent mounts.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !supabase) {
      return;
    }
    void load();
  }, [isLoaded, isSignedIn, load, supabase, userId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !supabase) {
      return;
    }
    void load();
  }, [isLoaded, isSignedIn, load, supabase, userId]);

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
    if (!supabase || !userId) {
      throw new Error("Not authenticated. Please sign in.");
    }
    if (queryState?.userId !== userId) {
      throw new Error("Profile not loaded. Please try again.");
    }

    console.log("Submitting coach request for user:", userId);

    const { data, error: insertError } = await supabase
      .from("coach_requests")
      .insert({ user_id: userId })
      .select("id, status, created_at")
      .single();
    console.log("Insert result:", { data, error: insertError });

    if (insertError) {
      console.error("Insert error details:", insertError);
      if (insertError.code === "23505") {
        await load();
        return;
      }
      throw new Error(insertError.message || insertError.details || "Could not submit your Coach request. Please try again.");
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
  }, [load, queryState?.userId, supabase, userId]);

  const updateUserRole = useCallback(async (newRole: MemberRole) => {
    if (
      !supabase ||
      !userId ||
      queryState?.userId !== userId ||
      !queryState?.profile
    ) {
      throw new Error("Your profile is not available to update.");
    }

    const { data, error: updateError } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", userId)
      .select("id, role, email, first_name, last_name")
      .maybeSingle();

    if (updateError) {
      throw new Error("Could not update your role. Please try again.");
    }

    const profile = data ? parseProfile(data) : null;
    if (!profile) {
      throw new Error("Your role was not updated. Please retry.");
    }

    setQueryState((current) =>
      current?.userId === userId ? { ...current, profile } : current
    );
    return profile;
  }, [queryState, supabase, userId]);

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
    updateUserRole,
  };
}
