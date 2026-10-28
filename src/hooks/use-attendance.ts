import { useAuth } from "@clerk/expo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export function useAttendance() {
  const { getToken, isSignedIn } = useAuth();
  const supabase = useMemo(() => {
    if (!isSignedIn) return null;
    try {
      return createMemberSupabaseClient(() => getToken({ template: "supabase" }));
    } catch {
      return null;
    }
  }, [getToken, isSignedIn]);

  const invoke = useCallback(async <T,>(body: Record<string, unknown>): Promise<T> => {
    if (!supabase) throw new Error("Sign in to use attendance.");
    const { data, error } = await supabase.functions.invoke("attendance", { body });
    if (error) {
      const responseMessage = typeof data?.error === "string" ? data.error : null;
      throw new Error(responseMessage ?? "Attendance service is unavailable. Check your connection and retry.");
    }
    if (!data || typeof data !== "object") throw new Error("Attendance service returned an invalid response.");
    if (typeof data.error === "string") throw new Error(data.error);
    return data as T;
  }, [supabase]);

  const provision = useCallback((secret: string) =>
    invoke<{ provisioned: boolean }>({ action: "provision", secret }), [invoke]);
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
