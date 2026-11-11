import { createClient, FunctionsHttpError } from "@supabase/supabase-js";
import { Platform } from "react-native";

type AccessTokenProvider = () => Promise<string | null>;

// Android emulators cannot reach the host machine through localhost. The host
// loopback is exposed as 10.0.2.2, so development builds rewrite the Supabase
// URL while release builds keep using EXPO_PUBLIC_SUPABASE_URL unchanged.
export function resolveSupabaseUrl(url: string): string {
  if (!__DEV__ || Platform.OS !== "android") return url;
  return url.replace(/\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/i, "//10.0.2.2");
}

export function createMemberSupabaseClient(getToken: AccessTokenProvider) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase URL and public key are required.");
  }

  const accessToken = async () => await getToken();

  return createClient(resolveSupabaseUrl(url), publishableKey, {
    accessToken,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

type DevSubscriptionResult = {
  success: boolean;
  user_id?: string;
  status?: "active" | "inactive";
  error?: string;
};

// Dev-only activation / reset posts straight to the edge function with the
// public key and the member id in the body. The function accepts that body
// path without a session token, so the dev buttons keep working even when
// Clerk's token is unavailable — `functions.invoke` in that state fails with
// "A signed-in session is required." before it can use the user id.
export async function invokeDevSubscriptionAction(input: {
  userId: string;
  action?: "activate" | "reset";
  planType?: "app" | "gym" | "all_access";
}): Promise<DevSubscriptionResult> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;
  if (!url || !publishableKey) {
    return {
      success: false,
      error: "Supabase URL and public key are required.",
    };
  }

  let response;
  try {
    response = await fetch(
      `${resolveSupabaseUrl(url)}/functions/v1/dev-activate-subscription`,
      {
        method: "POST",
        headers: {
          apikey: publishableKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: input.userId,
          action: input.action ?? "activate",
          plan_type: input.planType,
        }),
      },
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the dev activation service.",
    };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON response; fall through to the status-based message.
  }

  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (record.success === true) {
      return {
        success: true,
        user_id: typeof record.user_id === "string"
          ? record.user_id
          : input.userId,
        status: record.status === "inactive" ? "inactive" : "active",
      };
    }
    if (typeof record.error === "string") {
      return { success: false, error: record.error };
    }
  }

  return {
    success: false,
    error: response.ok
      ? "Dev activation returned an invalid response."
      : `Dev activation failed (HTTP ${response.status}).`,
  };
}

// `functions.invoke` reports every non-2xx response as the generic "Edge
// Function returned a non-2xx status code". The JSON body carries the reason
// the function actually returned (e.g. "Session token algorithm is invalid."),
// so unwrap it for anything that shows the error to the user.
export async function readFunctionErrorMessage(
  error: unknown,
  fallback: string,
): Promise<string> {
  if (error instanceof FunctionsHttpError && error.context) {
    try {
      const body: unknown = await error.context.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof (body as { error?: unknown }).error === "string"
      ) {
        return (body as { error: string }).error;
      }
    } catch {
      // Non-JSON error body; fall through to the transport message.
    }
  }
  return error instanceof Error && error.message ? error.message : fallback;
}
