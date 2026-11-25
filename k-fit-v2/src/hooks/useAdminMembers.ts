import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import type { StatusModalType } from "@/components/shared/StatusModal";

export interface Member {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
  approved?: boolean;
}

export function useAdminMembers() {
  const [user, setUser] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggedInTodayCount, setLoggedInTodayCount] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{
    type: StatusModalType;
    title: string;
    message: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "approved"
  >("all");

  const fetchMembers = useCallback(async () => {
    setRefreshing(true);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, role, created_at, approved")
        .eq("role", "member")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMembers((data || []) as Member[]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const loginsRes = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "member")
        .gte("last_login_at", todayStart.toISOString())
        .lt("last_login_at", tomorrowStart.toISOString());

      if (loginsRes.error) {
        console.warn(
          "Could not load today's member logins:",
          loginsRes.error.message,
        );
        setLoggedInTodayCount(0);
      } else {
        setLoggedInTodayCount(loginsRes.count || 0);
      }
    } catch (error: any) {
      setStatusModal({
        type: "error",
        title: "Unable to load members",
        message: error?.message || "Failed to load the member directory.",
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
    } else {
      const role = currentUser?.user_metadata?.role || "member";
      if (role !== "admin") {
        if (role === "member") router.replace("/member/dashboard");
        else if (role === "coach") router.replace("/coach/dashboard");
        else router.replace("/login");
      } else {
        setUser(currentUser);
        await fetchMembers();
      }
    }
  }, [fetchMembers]);

  useEffect(() => {
    // Authentication and initial data loading are intentionally asynchronous.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();
  }, [checkAuth]);

  const handleApproveMember = async (member: Member) => {
    setApproving(member.id);
    try {
      const { getServiceRoleClient } = await import("@/lib/supabase");
      const supabase = getServiceRoleClient();
      const { error } = await (supabase.from("users") as any)
        .update({ approved: true, approved_at: new Date().toISOString() })
        .eq("id", member.id);

      if (error) {
        setStatusModal({
          type: "error",
          title: "Approval failed",
          message: error.message || "Failed to approve member.",
        });
      } else {
        setStatusModal({
          type: "success",
          title: "Member approved",
          message: `${member.email || "This member"} can now access their account.`,
        });
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, approved: true } : m)),
        );
      }
    } catch (error: any) {
      setStatusModal({
        type: "error",
        title: "Approval failed",
        message: error.message || "Failed to approve member.",
      });
    } finally {
      setApproving(null);
    }
  };

  const handleDeleteMember = async (member: Member) => {
    setDeleting(member.id);
    try {
      const { getServiceRoleClient } = await import("@/lib/supabase");
      const supabase = getServiceRoleClient();

      const { error: userError } = await supabase
        .from("users")
        .delete({ count: "exact" })
        .eq("id", member.id);
      const { error: memberError } = await supabase
        .from("members")
        .delete({ count: "exact" })
        .eq("id", member.id);
      const { error: coachError } = await supabase
        .from("coaches")
        .delete({ count: "exact" })
        .eq("id", member.id);

      const deleteError = userError || memberError || coachError;
      if (deleteError) throw deleteError;

      setStatusModal({
        type: "success",
        title: "Member deleted",
        message: "The member has been removed successfully.",
      });
      await fetchMembers();
    } catch (error: any) {
      setStatusModal({
        type: "error",
        title: "Delete failed",
        message: error.message || "Failed to delete member.",
      });
    } finally {
      setDeleting(null);
    }
  };

  const filteredMembers = members.filter((member) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      member.email?.toLowerCase().includes(searchLower) ||
      member.first_name?.toLowerCase().includes(searchLower) ||
      member.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const allMembers = members;
  const pendingMembers = members.filter((m) => m.approved !== true);
  const approvedMembers = members.filter((m) => m.approved === true);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const registeredTodayCount = members.filter(
    (member) => new Date(member.created_at) >= todayStart,
  ).length;
  const filteredPending = filteredMembers.filter((m) => m.approved !== true);
  const filteredApproved = filteredMembers.filter((m) => m.approved === true);

  const visibleMembers =
    activeTab === "pending"
      ? filteredPending
      : activeTab === "approved"
        ? filteredApproved
        : filteredMembers;

  return {
    user,
    loading,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    visibleMembers,
    allMembers,
    pendingMembers,
    approvedMembers,
    registeredTodayCount,
    loggedInTodayCount,
    deleting,
    approving,
    refreshing,
    refresh: fetchMembers,
    statusModal,
    clearStatusModal: () => setStatusModal(null),
    handleApproveMember,
    handleDeleteMember,
  };
}
