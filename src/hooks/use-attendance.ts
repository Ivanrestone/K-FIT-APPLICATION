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
import { createMemberSupabaseClient } from "@/utils/supabase";

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

const PROVISION_REQUEST_TIMEOUT_MS = 9_000;
const ATTENDANCE_SUBSCRIPTION_REQUIRED_MESSAGE =
  "An active App subscription is required to load attendance history.";

// Mirrors the paywall rule: access stays available while the plan is flagged
// active or its paid period has not lapsed. The attendance Edge Function
// rejects unpaid accounts with 401, so requests are skipped instead of being
// allowed to fail.
function hasActiveAppSubscription(
  data: SubscriptionAccessData | null,
): boolean {
  return hasActiveSubscription(data?.appSubscription);
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

  // Always request the Clerk JWT template Supabase validates. If the template
  // is not configured yet, fall back to the default session token.
  const getSupabaseToken = useCallback(async () => {
    try {
      const templateToken = await getToken({ template: "supabase" });
      if (templateToken) return templateToken;
    } catch (error) {
      console.warn(
        "[Attendance Token Notice]:",
        error instanceof Error ? error.message : String(error),
      );
    }
    return getToken();
  }, [getToken]);

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

    const { data, error, response: invocationResponse } = await supabase.functions.invoke("attendance", {
      body,
      ...(timeout ? { timeout } : {}),
    });
    if (error) {
      const response = error.context instanceof Response
        ? error.context
        : invocationResponse;
      const responseStatus = response?.status;
      const responseStatusText = response?.statusText;
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
      const fetchCause = error instanceof FunctionsFetchError ? error.context : undefined;

      console.error("[Attendance API Error]", {
        action: body.action,
        kind: errorKind,
        name: error.name,
        message: error.message,
        status: responseStatus,
        statusText: responseStatusText,
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
      const fetchWasAborted = fetchCause instanceof Error && fetchCause.name === "AbortError";
      const message = serviceMessage ?? (fetchWasAborted
        ? "Attendance service request timed out. The local QR pass remains available."
        : error instanceof FunctionsFetchError
          ? "Attendance network request failed. Check connectivity; on web, a fetch failure may also indicate a CORS issue."
          : error.message || "Attendance service is unavailable. Check your connection and retry.");
      throw new Error(`${message}${statusSuffix}`);
    }
    if (!data || typeof data !== "object") throw new Error("Attendance service returned an invalid response.");
    if (typeof data.error === "string") {
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
  }, [isSignedIn, supabase]);

  const provision = useCallback((secret: string) =>
    invoke<{ provisioned: boolean }>({ action: "provision", secret }, PROVISION_REQUEST_TIMEOUT_MS), [invoke]);
  const scan = useCallback((payload: string) =>
    invoke<AttendanceScanResult>({ action: "scan", payload }), [invoke]);
  const history = useCallback((memberId?: string) =>
    invoke<{ records: AttendanceRecord[] }>({ action: "history", ...(memberId ? { memberId } : {}) }), [invoke]);
  const staffHistory = useCallback(() =>
    invoke<{ records: StaffAttendanceRecord[] }>({ action: "staff_history" }), [invoke]);
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
      if (!Array.isArray(result.records)) throw new Error("Attendance history returned invalid data.");
      if (currentRequest === requestId.current) {
        setRecords(result.records);
        setError(null);
      }
    } catch (cause) {
      if (currentRequest !== requestId.current) return;
      if (silent) {
        // Background refreshes keep the last known records and never turn into
        // a screen-wide error state.
        console.warn(
          "[Attendance Background Refresh Notice]:",
          cause instanceof Error ? cause.message : String(cause),
        );
        return;
      }
      setError(cause instanceof Error ? cause.message : "Could not load attendance history.");
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
      if (!Array.isArray(result.records)) throw new Error("Attendance history returned invalid data.");
      if (currentRequest === requestId.current) {
        setRecords(result.records);
        setError(null);
      }
    } catch (cause) {
      if (currentRequest !== requestId.current) return;
      if (silent) {
        // Background refreshes keep the last known records and never turn into
        // a screen-wide error state.
        console.warn(
          "[Attendance Background Refresh Notice]:",
          cause instanceof Error ? cause.message : String(cause),
        );
        return;
      }
      setError(cause instanceof Error ? cause.message : "Could not load attendance history.");
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
