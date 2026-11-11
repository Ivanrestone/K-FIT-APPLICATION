import { useAuth, useUser } from "@clerk/expo";
import { createMemberSupabaseClient } from "@/utils/supabase";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

export type SubscriptionPlanType = "app" | "gym";
export type SubscriptionRole = "member" | "coach" | "admin";

export type PricingPlan = {
  id: string;
  planType: SubscriptionPlanType;
  displayAmount: number;
  displayCurrency: string;
  billingAmountPhp: number;
};

export type SubscriptionPeriod = {
  active: boolean;
  expiresAt: string | null;
  cancelledAt: string | null;
};
export type SubscriptionStatus = "active" | "inactive";

// A hung Supabase read or an unreachable Edge Function fallback must never
// leave the subscription card spinning forever.
const SUBSCRIPTION_LOAD_TIMEOUT_MS = 15_000;
const SUBSCRIPTION_LOAD_TIMEOUT_MESSAGE =
  "Loading your subscription is taking too long. Check your connection and retry.";

function isSubscriptionAccessData(
  value: unknown,
): value is SubscriptionAccessData {
  return isRecord(value) && ("appSubscription" in value || "gymSubscription" in value);
}

/**
 * A plan grants access while it is flagged active or while its paid period has
 * not lapsed yet. A future `expires_at` always wins, including plans that were
 * cancelled but run to the end of the paid period.
 */
export function hasActiveSubscription(
  subscription: SubscriptionPeriod | SubscriptionAccessData | null | undefined,
): boolean {
  if (!subscription) {
    return false;
  }
  if (isSubscriptionAccessData(subscription)) {
    return (
      hasActiveSubscription(subscription.appSubscription) ||
      hasActiveSubscription(subscription.gymSubscription)
    );
  }
  return Boolean(
    subscription.active === true ||
      (subscription.expiresAt && new Date(subscription.expiresAt) > new Date()),
  );
}

export type SubscriptionAccessData = {
  userId: string;
  role: SubscriptionRole;
  isProvisioned: boolean;
  subscriptionStatus: SubscriptionStatus;
  app_subscription_status: SubscriptionStatus;
  gym_membership_status: SubscriptionStatus;
  appSubscriptionStatus: SubscriptionStatus;
  gymMembershipStatus: SubscriptionStatus;
  plans: PricingPlan[];
  appSubscription: SubscriptionPeriod | null;
  gymSubscription: SubscriptionPeriod | null;
  hasActiveSubscription?: boolean;
};

type QueryState = {
  data: SubscriptionAccessData;
  isRefreshing: boolean;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRole(value: unknown): SubscriptionRole | null {
  if (value === "trainer") {
    return "coach";
  }
  return value === "member" || value === "coach" || value === "admin"
    ? value
    : null;
}

function hasMissingRole(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

function parseAmount(value: unknown): number | null {
  const amount = typeof value === "string" ? Number(value) : value;
  return typeof amount === "number" &&
      Number.isFinite(amount) &&
      amount > 0
    ? amount
    : null;
}

function parsePlan(value: unknown): PricingPlan | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    (value.plan_type !== "app" && value.plan_type !== "gym") ||
    typeof value.display_currency !== "string" ||
    !/^[A-Z]{3}$/.test(value.display_currency)
  ) {
    return null;
  }

  const displayAmount = parseAmount(value.display_amount);
  const billingAmountPhp = parseAmount(value.billing_amount_php);
  if (displayAmount === null || billingAmountPhp === null) {
    return null;
  }

  return {
    id: value.id,
    planType: value.plan_type,
    displayAmount,
    displayCurrency: value.display_currency,
    billingAmountPhp,
  };
}

function parseDate(value: unknown): string | null {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    ? value
    : null;
}

// Never discard a subscription row because one column is shaped unexpectedly:
// dropping it turns a paid plan into "Not active".
function parseSubscription(value: unknown): SubscriptionPeriod | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    active: value.active === true || value.active === "true",
    expiresAt: parseDate(value.expires_at),
    cancelledAt: parseDate(value.cancelled_at),
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Could not load subscription information. Please try again.";
}

export function useSubscriptionAccess() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  // Supabase RLS reads `auth.jwt() ->> 'sub'`, which only exists on the Clerk
  // JWT template named `supabase`; the default Clerk session token is rejected
  // (401/406) and makes a paid plan look inactive.
  const getSupabaseToken = useCallback(async () => {
    if (!isSignedIn) {
      return null;
    }
    try {
      const templateToken = await getTokenRef.current({ template: "supabase" });
      if (templateToken) {
        return templateToken;
      }
    } catch (error) {
      console.warn(
        "[Subscription Token Notice]:",
        error instanceof Error ? error.message : String(error),
      );
    }
    return getTokenRef.current();
  }, [isSignedIn]);
  const metadataRoleRef = useRef<unknown>(undefined);
  useEffect(() => {
    metadataRoleRef.current = (
      user?.publicMetadata as Record<string, unknown> | undefined
    )?.role;
  }, [user]);
  const supabaseConfigured = Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
      process.env.EXPO_PUBLIC_SUPABASE_KEY,
  );
  const clientResult = useMemo(
    () => {
      if (!supabaseConfigured) {
        return { client: null, error: null };
      }
      try {
        return {
          client: createMemberSupabaseClient(getSupabaseToken),
          error: null,
        };
      } catch {
        return {
          client: null,
          error: "Supabase configuration is invalid.",
        };
      }
    },
    [getSupabaseToken, supabaseConfigured],
  );
  const supabase = clientResult.client;
  const [queryState, setQueryState] = useState<QueryState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<
    { userId: string; message: string } | null
  >(null);
  const latestLoadIdRef = useRef(0);
  // A reload only counts as "loading" until the first successful read for the
  // signed-in user. After that the screens keep the settled card on screen and
  // show their own refresh indicator instead of collapsing to a spinner.
  const settledUserIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (
      !supabase ||
      !isSignedIn ||
      !userId
    ) {
      setQueryState(null);
      setLoadError(null);
      settledUserIdRef.current = null;
      setIsLoading(false);
      return;
    }

    const loadId = ++latestLoadIdRef.current;
    // Results from a superseded load are dropped instead of blocking a newer
    // one: only the newest load may settle the shared state.
    const isCurrentLoad = () => latestLoadIdRef.current === loadId;
    if (settledUserIdRef.current !== userId) {
      setIsLoading(true);
    }
    const timeoutId = setTimeout(() => {
      if (!isCurrentLoad()) {
        return;
      }
      setIsLoading(false);
      setLoadError({ userId, message: SUBSCRIPTION_LOAD_TIMEOUT_MESSAGE });
    }, SUBSCRIPTION_LOAD_TIMEOUT_MS);
    try {
      const [profileResult, plansResult] = await Promise.all([
        supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("pricing_plans")
          .select(
            "id, plan_type, display_amount, display_currency, billing_amount_php",
          )
          .eq("is_active", true),
      ]);

      // A role read failure or an empty role is not fatal. Subscriptions keep
      // working with the Clerk role, defaulting to member when nothing is set.
      if (profileResult.error) {
        console.warn(
          "[Subscription Role Load Notice]:",
          profileResult.error.message,
        );
      }
      // Price availability must not hide an already-paid subscription; only the
      // checkout buttons depend on it.
      if (plansResult.error) {
        console.warn(
          "[Subscription Plans Load Notice]:",
          plansResult.error.message,
        );
      }

      let role: SubscriptionRole = (profileResult.data
        ? parseRole(profileResult.data.role)
        : null) ??
        parseRole(metadataRoleRef.current) ??
        "member";
      let isProvisioned = profileResult.data !== null;

      if (
        profileResult.data &&
        hasMissingRole(profileResult.data.role)
      ) {
        const { error: roleRepairError } = await supabase
          .from("users")
          .update({ role: "member" })
          .eq("id", userId);
        if (roleRepairError) {
          console.warn(
            "[Subscription Role Repair Notice]:",
            roleRepairError.message,
          );
        }
      }

      const parsedPlans = (plansResult.data ?? []).map((plan: unknown) =>
        parsePlan(plan)
      );
      if (parsedPlans.some((plan) => plan === null)) {
        throw new Error("Subscription prices returned invalid data.");
      }
      const plans = parsedPlans.filter(
        (plan): plan is PricingPlan => plan !== null,
      );

      // Server-side snapshot used when the anon RLS path cannot read the rows
      // (expired/missing Clerk JWT, or a token without the `sub` claim).
      const loadServerSnapshot = async () => {
        try {
          const { data: snapshot, error: snapshotError } = await supabase
            .functions.invoke("subscription-status", { body: {} });
          if (snapshotError) {
            console.warn(
              "[Subscription Fallback Notice]:",
              snapshotError.message,
            );
            return null;
          }
          if (!isRecord(snapshot)) {
            return null;
          }
          return {
            role: parseRole(snapshot.role),
            isProvisioned: snapshot.isProvisioned === true,
            app: parseSubscription(snapshot.app),
            gym: parseSubscription(snapshot.gym),
          };
        } catch (fallbackError) {
          console.warn(
            "[Subscription Fallback Notice]:",
            getErrorMessage(fallbackError),
          );
          return null;
        }
      };

      let appRaw: unknown = null;
      let gymRaw: unknown = null;
      let subscriptionError: string | null = null;

      if (role === "member" || role === "coach") {
        const [appResult, gymResult] = await Promise.all([
          supabase
            .from("subscriptions_app")
            .select("active, expires_at, cancelled_at")
            .eq("user_id", userId)
            .maybeSingle(),
          role === "member"
            ? supabase
              .from("subscriptions_gym")
              .select("active, expires_at, cancelled_at")
              .eq("user_id", userId)
              .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        appRaw = appResult.data;
        gymRaw = gymResult.data;
        subscriptionError = appResult.error?.message ??
          gymResult.error?.message ??
          null;
        if (subscriptionError) {
          console.warn("[Subscription Load Notice]:", subscriptionError);
        }

        // RLS failures and empty results both fall through to the Edge
        // Function, which verifies the Clerk session and reads with the
        // service role instead of trusting a client-side "no rows".
        if (appResult.error || gymResult.error || (!appRaw && !gymRaw)) {
          const snapshot = await loadServerSnapshot();
          if (snapshot) {
            appRaw = appRaw ?? snapshot.app;
            gymRaw = gymRaw ?? snapshot.gym;
            isProvisioned = isProvisioned || snapshot.isProvisioned;
            if (!profileResult.data && snapshot.role) {
              role = snapshot.role;
            }
          } else if (subscriptionError && !appRaw && !gymRaw) {
            // Both the RLS read and the server fallback failed: report it
            // instead of rendering a false "Not active".
            throw new Error("Could not load subscription status.");
          }
        }
      }

      // Query public.subscriptions if it exists (legacy / direct table) using active Clerk userId
      let legacySubStatus: string | null = null;
      let legacyAppStatus: string | null = null;
      let legacyGymStatus: string | null = null;
      try {
        const { data: legacySub } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (legacySub && typeof legacySub === "object") {
          const raw = legacySub as Record<string, unknown>;
          if (typeof raw.status === "string") legacySubStatus = raw.status;
          if (typeof raw.app_subscription_status === "string") legacyAppStatus = raw.app_subscription_status;
          if (typeof raw.gym_membership_status === "string") legacyGymStatus = raw.gym_membership_status;
        }
      } catch {
        // Default gracefully without breaking the layout if public.subscriptions does not exist
      }

      const appSubscription = parseSubscription(appRaw);
      const gymSubscription = role === "member"
        ? parseSubscription(gymRaw)
        : null;

      const appActive = hasActiveSubscription(appSubscription) || legacyAppStatus === "active" || legacySubStatus === "active";
      const gymActive = hasActiveSubscription(gymSubscription) || legacyGymStatus === "active";
      const isAnyActive = appActive || gymActive || legacySubStatus === "active";

      const app_subscription_status: SubscriptionStatus = appActive ? "active" : "inactive";
      const gym_membership_status: SubscriptionStatus = gymActive ? "active" : "inactive";

      const data: SubscriptionAccessData = {
        userId,
        role,
        isProvisioned,
        subscriptionStatus: isAnyActive ? "active" : "inactive",
        app_subscription_status,
        gym_membership_status,
        appSubscriptionStatus: app_subscription_status,
        gymMembershipStatus: gym_membership_status,
        plans,
        appSubscription,
        gymSubscription,
        hasActiveSubscription: isAnyActive,
      };
      if (!isCurrentLoad()) {
        return;
      }
      settledUserIdRef.current = userId;
      setLoadError(null);
      setQueryState((current) => {
        if (
          current &&
          current.data.userId === data.userId &&
          current.data.role === data.role &&
          current.data.isProvisioned === data.isProvisioned &&
          current.data.subscriptionStatus === data.subscriptionStatus &&
          current.data.app_subscription_status === data.app_subscription_status &&
          current.data.gym_membership_status === data.gym_membership_status &&
          current.data.appSubscription?.active === data.appSubscription?.active &&
          current.data.appSubscription?.expiresAt === data.appSubscription?.expiresAt &&
          current.data.gymSubscription?.active === data.gymSubscription?.active &&
          current.data.gymSubscription?.expiresAt === data.gymSubscription?.expiresAt &&
          current.isRefreshing === false &&
          current.error === null
        ) {
          return current;
        }
        return { data, isRefreshing: false, error: null };
      });
    } catch (error) {
      if (!isCurrentLoad()) {
        return;
      }
      const message = getErrorMessage(error);
      setLoadError({ userId, message });
      setQueryState((current) =>
        current?.data.userId === userId
          ? { ...current, isRefreshing: false, error: message }
          : null
      );
    } finally {
      clearTimeout(timeoutId);
      if (isCurrentLoad()) {
        setIsLoading(false);
      }
    }
  }, [isSignedIn, supabase, userId]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    void load();
  }, [isLoaded, isSignedIn, load, userId]);

  const refresh = useCallback(async () => {
    if (!supabase || !isSignedIn || !userId) {
      return;
    }
    setQueryState((current) =>
      current?.data.userId === userId
        ? { ...current, isRefreshing: true }
        : current
    );
    await load();
  }, [isSignedIn, load, supabase, userId]);

  // PayMongo confirms payment in the system browser while the app is
  // backgrounded, so re-read the Supabase subscription rows when the member
  // returns to the app instead of waiting for a manual refresh.
  useEffect(() => {
    if (!isSignedIn || !userId) {
      return;
    }
    let previousState = AppState.currentState;
    const listener = AppState.addEventListener("change", (nextState) => {
      const returnedToForeground = nextState === "active" &&
        previousState !== "active";
      previousState = nextState;
      if (returnedToForeground) {
        void load();
      }
    });
    return () => listener.remove();
  }, [isSignedIn, load, userId]);

  const currentQueryState = isSignedIn && queryState &&
      queryState.data.userId === userId
    ? queryState
    : null;
  const currentLoadError = isSignedIn && loadError &&
      loadError.userId === userId
    ? loadError
    : null;
  const data = currentQueryState?.data ?? null;
  const error = clientResult.error ??
    currentLoadError?.message ??
    currentQueryState?.error ??
    null;

  return {
    data,
    error,
    isLoaded,
    isSignedIn,
    isLoading: !isLoaded || (isSignedIn && isLoading),
    isRefreshing: currentQueryState?.isRefreshing ?? false,
    refresh,
    refetch: refresh,
    supabase,
    hasActiveSubscription: hasActiveSubscription(data),
    app_subscription_status: data?.app_subscription_status ?? "inactive",
    gym_membership_status: data?.gym_membership_status ?? "inactive",
    appSubscriptionStatus: data?.appSubscriptionStatus ?? "inactive",
    gymMembershipStatus: data?.gymMembershipStatus ?? "inactive",
    subscriptionStatus: data?.subscriptionStatus ?? "inactive",
  };
}

export const useSubscription = useSubscriptionAccess;
