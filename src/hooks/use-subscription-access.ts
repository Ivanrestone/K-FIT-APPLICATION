import { useAuth } from "@clerk/expo";
import { createMemberSupabaseClient } from "@/utils/supabase";
import { useCallback, useEffect, useMemo, useState } from "react";

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

export type SubscriptionAccessData = {
  userId: string;
  role: SubscriptionRole | null;
  isProvisioned: boolean;
  plans: PricingPlan[];
  appSubscription: SubscriptionPeriod | null;
  gymSubscription: SubscriptionPeriod | null;
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
  return value === "member" || value === "coach" || value === "admin"
    ? value
    : null;
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

function parseSubscription(value: unknown): SubscriptionPeriod | null {
  if (!isRecord(value) || typeof value.active !== "boolean") {
    return null;
  }

  const expiresAt = value.expires_at;
  const cancelledAt = value.cancelled_at;
  if (
    (expiresAt !== null && typeof expiresAt !== "string") ||
    (cancelledAt !== null && typeof cancelledAt !== "string") ||
    (typeof expiresAt === "string" && !Number.isFinite(Date.parse(expiresAt))) ||
    (typeof cancelledAt === "string" &&
      !Number.isFinite(Date.parse(cancelledAt)))
  ) {
    throw new Error("Subscription status returned invalid dates.");
  }

  return {
    active: value.active,
    expiresAt: typeof expiresAt === "string" ? expiresAt : null,
    cancelledAt: typeof cancelledAt === "string" ? cancelledAt : null,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Could not load subscription information. Please try again.";
}

export function useSubscriptionAccess() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
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
          client: createMemberSupabaseClient(() =>
            isSignedIn ? getToken() : Promise.resolve(null)
          ),
          error: null,
        };
      } catch {
        return {
          client: null,
          error: "Supabase configuration is invalid.",
        };
      }
    },
    [getToken, isSignedIn, supabaseConfigured],
  );
  const supabase = clientResult.client;
  const [queryState, setQueryState] = useState<QueryState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<
    { userId: string; message: string } | null
  >(null);

  const load = useCallback(async () => {
    if (!supabase || !isSignedIn || !userId) {
      return;
    }

    try {
      const [profileResult, plansResult] = await Promise.all([
        supabase.from("users").select("role").maybeSingle(),
        supabase
          .from("pricing_plans")
          .select(
            "id, plan_type, display_amount, display_currency, billing_amount_php",
          )
          .eq("is_active", true),
      ]);

      if (profileResult.error) {
        throw new Error("Could not load your account role.");
      }
      if (plansResult.error) {
        throw new Error("Could not load current subscription prices.");
      }

      const role = profileResult.data
        ? parseRole(profileResult.data.role)
        : null;
      const isProvisioned = profileResult.data !== null && role !== null;
      if (profileResult.data && !role) {
        throw new Error("Your account role is not configured for subscriptions.");
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

      let appSubscription: SubscriptionPeriod | null = null;
      let gymSubscription: SubscriptionPeriod | null = null;

      if (isProvisioned && (role === "member" || role === "coach")) {
        const appResult = await supabase
          .from("subscriptions_app")
          .select("active, expires_at, cancelled_at")
          .maybeSingle();
        if (appResult.error) {
          throw new Error("Could not load App subscription status.");
        }
        appSubscription = appResult.data
          ? parseSubscription(appResult.data)
          : null;

        if (role === "member") {
          const gymResult = await supabase
            .from("subscriptions_gym")
            .select("active, expires_at, cancelled_at")
            .maybeSingle();
          if (gymResult.error) {
            throw new Error("Could not load Gym subscription status.");
          }
          gymSubscription = gymResult.data
            ? parseSubscription(gymResult.data)
            : null;
        }
      }

      const data: SubscriptionAccessData = {
        userId,
        role,
        isProvisioned,
        plans,
        appSubscription,
        gymSubscription,
      };
      setLoadError(null);
      setQueryState({ data, isRefreshing: false, error: null });
    } catch (error) {
      const message = getErrorMessage(error);
      setLoadError({ userId, message });
      setQueryState((current) =>
        current?.data.userId === userId
          ? { ...current, isRefreshing: false, error: message }
          : null
      );
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, supabase, userId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !supabase) {
      return;
    }
    void Promise.resolve().then(load);
  }, [isLoaded, isSignedIn, load, supabase, userId]);

  const refresh = useCallback(() => {
    if (!supabase || !isSignedIn || !userId) {
      return;
    }
    setQueryState((current) =>
      current?.data.userId === userId
        ? { ...current, isRefreshing: true }
        : current
    );
    void load();
  }, [isSignedIn, load, supabase, userId]);

  const currentQueryState = queryState && queryState.data.userId === userId
    ? queryState
    : null;
  const currentLoadError = loadError && loadError.userId === userId
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
    isLoading: !isLoaded ||
      (isSignedIn && !error && (isLoading || data === null)),
    isRefreshing: currentQueryState?.isRefreshing ?? false,
    refresh,
    supabase,
  };
}
