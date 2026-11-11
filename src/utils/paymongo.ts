import * as SecureStore from "expo-secure-store";

import { type SubscriptionPlanType } from "@/hooks/use-subscription-access";
import { resolveSupabaseUrl } from "@/utils/supabase";

const PENDING_CHECKOUT_KEY = "kfit.pending_checkout_session";
const PENDING_CHECKOUT_TTL_MS = 24 * 60 * 60 * 1000;

export type PendingCheckoutSession = {
  sessionId: string;
  planType: SubscriptionPlanType;
  userId: string;
  createdAt: string;
};

export type PaymongoVerification = {
  success: boolean;
  paid: boolean;
  status?: string;
  planType?: SubscriptionPlanType;
  expiresAt?: string | null;
  duplicate?: boolean;
  message?: string;
  error?: string;
  /** True when there was nothing to verify (no checkout started on this device). */
  idle?: boolean;
};

// The checkout is opened on one screen and the PayMongo return deep-link lands
// on another, so the session id is kept on the device. SecureStore survives a
// cold start (the app can be killed while the browser is in front); the
// in-memory copy keeps verification working if the native module is missing.
let memoryPending: PendingCheckoutSession | null = null;

export async function rememberPendingCheckout(
  session: PendingCheckoutSession,
): Promise<void> {
  memoryPending = session;
  try {
    await SecureStore.setItemAsync(PENDING_CHECKOUT_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn(
      "[PayMongo] Could not persist the pending checkout session:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function readPendingCheckout(): Promise<
  PendingCheckoutSession | null
> {
  if (memoryPending) {
    return memoryPending;
  }

  let raw: string | null = null;
  try {
    raw = await SecureStore.getItemAsync(PENDING_CHECKOUT_KEY);
  } catch (error) {
    console.warn(
      "[PayMongo] Could not read the pending checkout session:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PendingCheckoutSession>;
    if (
      typeof parsed.sessionId === "string" &&
      typeof parsed.userId === "string" &&
      (parsed.planType === "app" || parsed.planType === "gym") &&
      typeof parsed.createdAt === "string"
    ) {
      const createdAt = Date.parse(parsed.createdAt);
      if (
        Number.isFinite(createdAt) &&
        Date.now() - createdAt < PENDING_CHECKOUT_TTL_MS
      ) {
        memoryPending = parsed as PendingCheckoutSession;
        return memoryPending;
      }
    }
  } catch {
    // Corrupt entry: clear it below.
  }

  await clearPendingCheckout();
  return null;
}

export async function clearPendingCheckout(): Promise<void> {
  memoryPending = null;
  try {
    await SecureStore.deleteItemAsync(PENDING_CHECKOUT_KEY);
  } catch {
    // Nothing else to do: the in-memory copy is already gone.
  }
}

function parseVerification(
  payload: unknown,
  fallbackPlanType: SubscriptionPlanType,
): PaymongoVerification | null {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const planType = record.plan_type === "app" || record.plan_type === "gym"
    ? record.plan_type
    : fallbackPlanType;

  return {
    success: record.success === true,
    paid: record.paid === true,
    status: typeof record.status === "string" ? record.status : undefined,
    planType,
    expiresAt: typeof record.expires_at === "string" ? record.expires_at : null,
    duplicate: record.duplicate === true,
    message: typeof record.message === "string" ? record.message : undefined,
    error: typeof record.error === "string" ? record.error : undefined,
  };
}

// Confirms the checkout the member just paid for, then activates it server-side.
// The PayMongo secret never leaves Supabase: this only forwards the session id,
// and the function re-reads the session from PayMongo's API.
export async function verifyPendingPaymongoCheckout(input: {
  userId: string;
}): Promise<PaymongoVerification> {
  const pending = await readPendingCheckout();
  if (!pending) {
    return { success: false, paid: false, idle: true };
  }
  if (pending.userId !== input.userId) {
    return { success: false, paid: false, idle: true };
  }

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;
  if (!url || !publishableKey) {
    return {
      success: false,
      paid: false,
      error: "Supabase URL and public key are required.",
    };
  }

  let response;
  try {
    response = await fetch(
      `${resolveSupabaseUrl(url)}/functions/v1/verify-paymongo-payment`,
      {
        method: "POST",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkout_session_id: pending.sessionId,
          user_id: input.userId,
        }),
      },
    );
  } catch {
    return {
      success: false,
      paid: false,
      error: "Could not reach the payment verification service.",
    };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON response; fall through to the status message below.
  }

  let verification = parseVerification(payload, pending.planType);

  // If PayMongo received the user back before finalizing the session,
  // do a single quick retry after 1.5s so auto-activation settles seamlessly.
  if (verification && verification.success && !verification.paid) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      const retryResponse = await fetch(
        `${resolveSupabaseUrl(url)}/functions/v1/verify-paymongo-payment`,
        {
          method: "POST",
          headers: {
            apikey: publishableKey,
            Authorization: `Bearer ${publishableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            checkout_session_id: pending.sessionId,
            user_id: input.userId,
          }),
        },
      );
      if (retryResponse.ok) {
        const retryPayload = await retryResponse.json();
        const retryVerification = parseVerification(retryPayload, pending.planType);
        if (retryVerification && retryVerification.success) {
          verification = retryVerification;
        }
      }
    } catch {
      // Ignore retry failure and proceed with original verification
    }
  }

  if (!verification) {
    return {
      success: false,
      paid: false,
      error: response.ok
        ? "Payment verification returned an invalid response."
        : `Payment verification failed (HTTP ${response.status}).`,
    };
  }

  if (verification.success && verification.paid) {
    await clearPendingCheckout();
    return verification;
  }

  // A session that can never be verified again should not block the next
  // checkout. Transient errors keep the pending entry so a retry can succeed.
  if (!verification.success) {
    const permanent = verification.error === "This checkout session no longer exists." ||
      verification.error === "This checkout session belongs to a different account.";
    if (permanent) {
      await clearPendingCheckout();
    }
  }

  return verification;
}
