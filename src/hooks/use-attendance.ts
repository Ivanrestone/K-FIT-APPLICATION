import { useAuth } from "@clerk/expo";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
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

const PROVISION_REQUEST_TIMEOUT_MS = 9_000;

export function useAttendance() {
  const { getToken, isSignedIn } = useAuth();
  const supabase = useMemo(() => {
    if (!isSignedIn) return null;
    try {
      return createMemberSupabaseClient(() => getToken({ template: "supabase" }));
    } catch (error) {
      console.error("[Attendance Client Initialization Error]", {
        message: error instanceof Error ? error.message : String(error),
        supabaseUrlConfigured: Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL),
        supabaseKeyConfigured: Boolean(process.env.EXPO_PUBLIC_SUPABASE_KEY),
      });
      return null;
    }
  }, [getToken, isSignedIn]);

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
  return { provision, scan, history, staffHistory };
}

export function useStaffAttendanceHistory() {
  const { staffHistory } = useAttendance();
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refetch = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await staffHistory();
      if (!Array.isArray(result.records)) throw new Error("Attendance history returned invalid data.");
      if (currentRequest === requestId.current) setRecords(result.records);
    } catch (cause) {
      if (currentRequest === requestId.current) {
        setRecords([]);
        setError(cause instanceof Error ? cause.message : "Could not load attendance history.");
      }
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [staffHistory]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (active) await refetch();
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
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refetch = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await history(memberId);
      if (!Array.isArray(result.records)) throw new Error("Attendance history returned invalid data.");
      if (currentRequest === requestId.current) setRecords(result.records);
    } catch (cause) {
      if (currentRequest === requestId.current) {
        setRecords([]);
        setError(cause instanceof Error ? cause.message : "Could not load attendance history.");
      }
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [history, memberId]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      await refetch();
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
