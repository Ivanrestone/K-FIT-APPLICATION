import { useAuth, useUser } from "@clerk/expo";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import {
  hasActiveSubscription,
  useSubscriptionAccess,
  type SubscriptionAccessData,
} from "@/hooks/use-subscription-access";
import { createMemberSupabaseClient, resolveSupabaseUrl } from "@/utils/supabase";

export type AttendanceRecord = {
  id: string;
  member_id: string;
  scan_timestamp: string;
  checkout_timestamp: string | null;
};
export type StaffAttendanceRecord = AttendanceRecord & {
  member_name: string;
};
export type AttendanceScanResult = {
  outcome: "check_in" | "check_out" | "invalid" | "expired" | "replay" | "not_provisioned" | "subscription_denied";
  error?: string;
  member?: { id: string; name: string };
  timestamp?: string;
};
export type AttendanceRole = "member" | "staff" | "admin";

// Provisioning waits on Edge Function cold starts and AES-GCM key work, which
// regularly exceeds the default request budget on a cold emulator.
const PROVISION_REQUEST_TIMEOUT_MS = 15_000;
// Two retries with exponential backoff for 503 responses and transport
// failures, so a cold Edge Function boot does not surface as a fatal error.
const ATTENDANCE_RETRY_DELAYS_MS = [500, 1_500];
const SESSION_TOKEN_WAIT_ATTEMPTS = 3;
const SESSION_TOKEN_WAIT_INTERVAL_MS = 300;
const ATTENDANCE_SUBSCRIPTION_REQUIRED_MESSAGE =
  "An active App subscription is required to load attendance history.";

// Mirrors the paywall rule: access stays available while the plan is flagged
// active or its paid period has not lapsed. The attendance Edge Function
// rejects unpaid accounts with 401, so requests are skipped instead of being
// allowed to fail.
function hasActiveAppSubscription(
  data: SubscriptionAccessData | null,
): boolean {
  return hasActiveSubscription(data);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSessionToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const normalized = token.replace(/^Bearer\s+/i, "").trim();
  return normalized || null;
}

function getAttendanceRole(value: unknown): AttendanceRole {
  if (value === "admin") return "admin";
  if (value === "staff" || value === "coach" || value === "trainer") {
    return "staff";
  }
  return "member";
}

export function useAttendance() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const role = getAttendanceRole(
    (user?.publicMetadata as Record<string, unknown> | undefined)?.role,
  );

  // The attendance function validates the token against Clerk's JWKS, which
  // only accepts asymmetric algorithms. The `supabase` JWT template is HS256
  // (signed with the Supabase secret for the legacy integration), so sending it
  // fails with "Session token algorithm is invalid". Use the default Clerk
  // session token here; the template stays in use for PostgREST/RLS reads.
  const getSupabaseToken = useCallback(async () => {
    try {
      return normalizeSessionToken(await getToken());
    } catch (error) {
      console.warn(
        "[Attendance Token Notice]:",
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }, [getToken]);

  // Clerk can return an empty token while the session is still hydrating. Wait
  // briefly instead of sending a request with no Authorization header, which
  // only comes back as an unexplained 401 from the Edge Function.
  const resolveSessionToken = useCallback(async () => {
    for (let attempt = 0; attempt < SESSION_TOKEN_WAIT_ATTEMPTS; attempt += 1) {
      const token = await getSupabaseToken();
      if (token) return token;
      if (attempt < SESSION_TOKEN_WAIT_ATTEMPTS - 1) {
        await delay(SESSION_TOKEN_WAIT_INTERVAL_MS * (attempt + 1));
      }
    }
    return null;
  }, [getSupabaseToken]);

  const supabase = useMemo(() => {
    if (!isSignedIn) return null;
    try {
      return createMemberSupabaseClient(getSupabaseToken);
    } catch (error) {
      console.error("[Attendance Client Initialization Error]", {
        message: error instanceof Error ? error.message : String(error),
        supabaseUrlConfigured: Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL),
        supabaseKeyConfigured: Boolean(process.env.EXPO_PUBLIC_SUPABASE_KEY),
      });
      return null;
    }
  }, [getSupabaseToken, isSignedIn]);

  const invoke = useCallback(async <T,>(
    body: Record<string, unknown>,
    timeout?: number,
  ): Promise<T> => {
    if (!isSignedIn) throw new Error("Sign in to use attendance.");
    if (!supabase) {
      const missingConfig =
        !process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_KEY;
      throw new Error(missingConfig
        ? "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in this app environment."
        : "Could not initialize the Supabase client. See the [Attendance Client Initialization Error] log.");
    }

    // A request without a token comes back as 401 and hides the real cause, so
    // fail before anything leaves the device.
    const token = await resolveSessionToken();
    if (!token) {
      throw new Error("Your session is not ready. Sign in again to load attendance.");
    }

    const requestUrl = `${resolveSupabaseUrl(
      process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    ).replace(/\/+$/, "")}/functions/v1/attendance`;
    const requestHeaders = {
      "content-type": "application/json",
      "x-client-info": "[supabase-js]",
      apikey: "[redacted]",
      authorization: "Bearer [redacted]",
    };

    for (let attempt = 0; ; attempt += 1) {
      const { data, error, response: invocationResponse } = await supabase.functions.invoke("attendance", {
        body,
        ...(timeout ? { timeout } : {}),
      });

      if (!error) {
        if (!data || typeof data !== "object") {
          if (body.action === "history" || body.action === "staff_history") {
            return { records: [], history: [] } as unknown as T;
          }
          throw new Error("Attendance service returned an invalid response.");
        }
        if (typeof data.error === "string") {
          if (body.action === "history" || body.action === "staff_history") {
            console.debug("[Attendance API Response Silent Notice]", {
              action: body.action,
              status: invocationResponse?.status,
              message: data.error,
            });
            return { records: [], history: [] } as unknown as T;
          }
          console.error("[Attendance API Response Error]", {
            action: body.action,
            status: invocationResponse?.status,
            statusText: invocationResponse?.statusText,
            message: data.error,
            platform: Platform.OS,
          });
          throw new Error(data.error);
        }
        return data as T;
      }

      const response = error.context instanceof Response
        ? error.context
        : invocationResponse;
      const responseStatus = response?.status;
      const responseStatusText = response?.statusText;
      const fetchCause = error instanceof FunctionsFetchError ? error.context : undefined;
      const fetchWasAborted = fetchCause instanceof Error &&
        (fetchCause.name === "AbortError" || /abort/i.test(fetchCause.message));
      const retryDelay = attempt < ATTENDANCE_RETRY_DELAYS_MS.length
        ? ATTENDANCE_RETRY_DELAYS_MS[attempt]
        : undefined;
      const shouldRetry = retryDelay !== undefined &&
        (responseStatus === 503 ||
          (error instanceof FunctionsFetchError && !fetchWasAborted));

      if (shouldRetry) {
        console.warn("[Attendance API Retry]", {
          action: body.action,
          attempt: attempt + 1,
          maxRetries: ATTENDANCE_RETRY_DELAYS_MS.length,
          status: responseStatus,
          message: error.message,
          retryInMs: retryDelay,
          requestUrl,
          platform: Platform.OS,
        });
        await delay(retryDelay);
        continue;
      }

      let responseBody: unknown;
      let responseText: string | undefined;
      if (response) {
        responseText = await response.clone().text().catch(() => undefined);
        if (responseText) {
          try {
            responseBody = JSON.parse(responseText) as unknown;
          } catch {
            responseBody = responseText.slice(0, 2000);
          }
        }
      }

      const serviceMessage =
        typeof responseBody === "object" && responseBody !== null &&
        "error" in responseBody && typeof responseBody.error === "string"
          ? responseBody.error
          : undefined;
      const errorKind = error instanceof FunctionsHttpError
        ? "edge-function-http-error"
        : error instanceof FunctionsRelayError
          ? "supabase-relay-error"
          : error instanceof FunctionsFetchError
            ? "network-fetch-error"
            : "unknown-function-error";

      // If this is a background history call, silence errors to prevent red LogBox toasts
      if (body.action === "history" || body.action === "staff_history") {
        console.debug("[Attendance API Silent Log]", {
          action: body.action,
          message: error.message,
          status: responseStatus,
        });
        return { records: [], history: [] } as unknown as T;
      }

      console.error("[Attendance API Error]", {
        action: body.action,
        kind: errorKind,
        name: error.name,
        message: error.message,
        status: responseStatus,
        statusText: responseStatusText,
        requestUrl,
        requestHeaders,
        corsAllowOrigin: response?.headers.get("access-control-allow-origin") ?? undefined,
        responseContentType: response?.headers.get("content-type") ?? undefined,
        responseBody,
        networkName: fetchCause instanceof Error ? fetchCause.name : undefined,
        networkMessage: fetchCause instanceof Error ? fetchCause.message : undefined,
        platform: Platform.OS,
        supabaseConfigured: Boolean(
          process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_KEY,
        ),
      });

      const statusSuffix = responseStatus ? ` (HTTP ${responseStatus})` : "";
      const message = serviceMessage ?? (fetchWasAborted
        ? "Attendance service request timed out. The local QR pass remains available."
        : error instanceof FunctionsFetchError
          ? "Attendance network request failed. Check connectivity; on web, a fetch failure may also indicate a CORS issue."
          : error.message || "Attendance service is unavailable. Check your connection and retry.");
      throw new Error(`${message}${statusSuffix}`);
    }
  }, [isSignedIn, resolveSessionToken, supabase]);

  const provision = useCallback((secret: string) =>
    invoke<{ provisioned: boolean }>({ action: "provision", secret }, PROVISION_REQUEST_TIMEOUT_MS), [invoke]);
  const scan = useCallback((payload: string) =>
    invoke<AttendanceScanResult>({ action: "scan", payload }), [invoke]);
  const history = useCallback(async (memberId?: string) => {
    try {
      const res = await invoke<{ records?: AttendanceRecord[]; history?: AttendanceRecord[] }>({
        action: "history",
        ...(memberId ? { memberId } : {}),
      });
      const records = res?.records || res?.history || [];
      return { records: Array.isArray(records) ? records : [] };
    } catch (err) {
      console.debug("[Attendance History Silent Notice]:", err);
      return { records: [] };
    }
  }, [invoke]);
  const staffHistory = useCallback(async () => {
    try {
      const res = await invoke<{ records?: StaffAttendanceRecord[]; history?: StaffAttendanceRecord[] }>({
        action: "staff_history",
      });
      const records = res?.records || res?.history || [];
      return { records: Array.isArray(records) ? records : [] };
    } catch (err) {
      console.debug("[Staff Attendance History Silent Notice]:", err);
      return { records: [] };
    }
  }, [invoke]);
  return { provision, scan, history, staffHistory, role };
}

export function useStaffAttendanceHistory() {
  const { staffHistory } = useAttendance();
  const access = useSubscriptionAccess();
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  // Wait for the subscription check so an unpaid account never fires the
  // request that would come back as a 401. If the subscription status cannot be
  // loaded, the request still runs and fails with its own message.
  const subscriptionPending = !access.isLoaded ||
    (access.isSignedIn && access.isLoading);
  // Admins are not billed through the member plans, so only member and coach
  // accounts are gated on an active App subscription.
  const subscriptionBlocked = access.isSignedIn && access.data !== null &&
    (access.data.role === "member" || access.data.role === "coach") &&
    !hasActiveAppSubscription(access.data);

  const refetch = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    const currentRequest = ++requestId.current;
    if (subscriptionPending) {
      if (!silent) setIsLoading(true);
      return;
    }
    if (!access.isSignedIn || subscriptionBlocked) {
      if (currentRequest === requestId.current) setIsLoading(false);
      if (!silent) {
        setError(
          access.isSignedIn
            ? ATTENDANCE_SUBSCRIPTION_REQUIRED_MESSAGE
            : "Sign in to view attendance history.",
        );
      }
      return;
    }
    if (!silent) setIsLoading(true);
    try {
      const result = await staffHistory();
      const records = Array.isArray(result?.records) ? result.records : [];
      if (currentRequest === requestId.current) {
        setRecords(records);
        setError(null);
      }
    } catch (cause) {
      if (currentRequest !== requestId.current) return;
      console.debug("[Attendance Background Catch]:", cause);
      setRecords([]);
      setError(null);
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [access.isSignedIn, staffHistory, subscriptionBlocked, subscriptionPending]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (active) await refetch({ silent: true });
    });
    return () => {
      active = false;
      requestId.current += 1;
    };
  }, [refetch]);

  return { records, isLoading, error, refetch };
}

export function useAttendanceHistory(memberId?: string) {
  const { history } = useAttendance();
  const access = useSubscriptionAccess();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const subscriptionPending = !access.isLoaded ||
    (access.isSignedIn && access.isLoading);
  const subscriptionBlocked = access.isSignedIn && access.data !== null &&
    (access.data.role === "member" || access.data.role === "coach") &&
    !hasActiveAppSubscription(access.data);

  const refetch = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    const currentRequest = ++requestId.current;
    if (subscriptionPending) {
      if (!silent) setIsLoading(true);
      return;
    }
    if (!access.isSignedIn || subscriptionBlocked) {
      if (currentRequest === requestId.current) setIsLoading(false);
      if (!silent) {
        setError(
          access.isSignedIn
            ? ATTENDANCE_SUBSCRIPTION_REQUIRED_MESSAGE
            : "Sign in to view attendance history.",
        );
      }
      return;
    }
    if (!silent) setIsLoading(true);
    try {
      const result = await history(memberId);
      const records = Array.isArray(result?.records) ? result.records : [];
      if (currentRequest === requestId.current) {
        setRecords(records);
        setError(null);
      }
    } catch (cause) {
      if (currentRequest !== requestId.current) return;
      console.debug("[Attendance Background Catch]:", cause);
      setRecords([]);
      setError(null);
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [access.isSignedIn, history, memberId, subscriptionBlocked, subscriptionPending]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      await refetch({ silent: true });
    });
    return () => {
      active = false;
      requestId.current += 1;
    };
  }, [refetch]);

  return { records, isLoading, error, refetch };
}

export function formatAttendanceDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatAttendanceTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function attendanceDuration(start: string, end: string | null, now = Date.now()): string {
  const endTime = end ? Date.parse(end) : now;
  const minutes = Math.max(0, Math.floor((endTime - Date.parse(start)) / 60_000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours ? `${hours}h ${remainingMinutes}m` : `${minutes} min`;
}
