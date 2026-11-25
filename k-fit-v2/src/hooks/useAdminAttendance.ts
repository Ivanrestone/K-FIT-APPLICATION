import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import type { StatusModalType } from "@/components/shared/StatusModal";
import { useSoundEffects } from "@/components/shared/SoundEffectsProvider";

export interface AttendanceRecord {
  id: string;
  member_id: string | null;
  check_in: string;
  check_out: string | null;
  memberName?: string;
  memberEmail?: string | null;
}

interface AttendanceUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

export function useAdminAttendance() {
  const playSound = useSoundEffects();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "all" | "checkedIn" | "checkedOut"
  >("all");
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<{
    type: StatusModalType;
    title: string;
    message: string;
  } | null>(null);

  const fetchAttendance = useCallback(async () => {
    setRefreshing(true);
    try {
      const { getServiceRoleClient } = await import("@/lib/supabase");
      const supabase = getServiceRoleClient();

      const { data, error } = await supabase
        .from("attendance")
        .select("id, member_id, check_in, check_out")
        .order("check_in", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Error fetching attendance:", error);
        return;
      }

      const rows = (data || []) as AttendanceRecord[];
      const memberIds = [
        ...new Set(rows.map((r) => r.member_id).filter(Boolean)),
      ] as string[];

      const { data: userData, error: usersError } = memberIds.length
        ? await supabase
            .from("users")
            .select("id, email, first_name, last_name")
            .in("id", memberIds)
        : { data: [], error: null };
      if (usersError) throw usersError;

      const users = (userData || []) as AttendanceUser[];

      const merged = rows.map((r) => {
        const u = users.find((user) => user.id === r.member_id);
        return {
          ...r,
          memberName: u
            ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
            : "Unknown Member",
          memberEmail: u?.email,
        };
      });

      setRecords(merged);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setNotice({
        type: "error",
        title: "Unable to load attendance",
        message:
          error instanceof Error
            ? error.message
            : "Please try refreshing the attendance list.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    const role = currentUser?.user_metadata?.role || "member";
    if (role !== "admin") {
      if (role === "member") router.replace("/member/dashboard");
      else if (role === "coach") router.replace("/coach/dashboard");
      else router.replace("/login");
    } else {
      await fetchAttendance();
    }
  }, [fetchAttendance]);

  useEffect(() => {
    // Authentication and initial data loading are intentionally asynchronous.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    let disposed = false;
    let removeChannel: (() => void) | null = null;

    void (async () => {
      try {
        const { getSupabaseClient } = await import("@/lib/supabase");
        if (disposed) return;
        const client = getSupabaseClient();
        const channel = client.channel(`admin-attendance-live-${Date.now()}`);
        channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table: "attendance" },
          () => void fetchAttendance(),
        );
        removeChannel = () => {
          void client.removeChannel(channel);
        };
        channel.subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error("Attendance realtime subscription failed:", status);
          }
        });
        if (disposed) removeChannel();
      } catch (error) {
        if (!disposed) {
          console.error("Unable to initialize attendance realtime:", error);
        }
      }
    })();

    return () => {
      disposed = true;
      removeChannel?.();
    };
  }, [fetchAttendance]);

  const handleCheckOut = async (record: AttendanceRecord) => {
    try {
      const { getServiceRoleClient } = await import("@/lib/supabase");
      const supabase = getServiceRoleClient();

      // FIXED: Cast (supabase.from(...) as any) to bypass the 'never' type error
      const { error } = await (supabase.from("attendance") as any)
        .update({ check_out: new Date().toISOString() })
        .eq("id", record.id);

      if (error) throw error;

      // Update local state without re-fetching
      setRecords((prev) =>
        prev.map((r) =>
          r.id === record.id
            ? { ...r, check_out: new Date().toISOString() }
            : r,
        ),
      );
      playSound("scanOut");
    } catch (error) {
      setNotice({
        type: "error",
        title: "Check-out failed",
        message:
          error instanceof Error ? error.message : "Could not check out this member.",
      });
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtering
  const activeMembers = records.filter((r) => !r.check_out);
  const checkedOutMembers = records.filter((r) => !!r.check_out);

  const visibleHistory =
    activeTab === "checkedIn"
      ? activeMembers
      : activeTab === "checkedOut"
        ? checkedOutMembers
        : records;

  return {
    loading,
    activeTab,
    setActiveTab,
    activeMembers,
    checkedOutMembers,
    allRecords: records,
    visibleHistory,
    formatTime,
    handleCheckOut,
    refresh: () => fetchAttendance(),
    refreshing,
    notice,
    clearNotice: () => setNotice(null),
  };
}
