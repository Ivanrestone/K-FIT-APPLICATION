import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

export interface CoachApplication {
  id: string;
  user_id: string;
  experience?: string;
  certification?: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  admin_id?: string;
  reviewed_at?: string;
  user?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export function useAdminCoachApplications() {
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<CoachApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");

  const fetchApplications = useCallback(async () => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("coach_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase query error:", error);
        Alert.alert("Error", `Failed to load applications: ${error.message}`);
        setApplications([]);
      } else {
        // FIX: Cast data to any[] to prevent "Spread types may only be created from object types" error
        const rawData = (data || []) as any[];

        const applicationsWithUsers = await Promise.all(
          rawData.map(async (app) => {
            const { data: userData } = await supabase
              .from("users")
              .select("email, first_name, last_name")
              .eq("id", app.user_id)
              .single();

            return {
              ...app,
              user: userData,
            } as CoachApplication; // Cast the final object to our interface
          }),
        );
        setApplications(applicationsWithUsers);
      }
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      Alert.alert("Error", `Failed to load applications: ${error.message}`);
    } finally {
      setLoading(false);
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
        await fetchApplications();
      }
    }
  }, [fetchApplications]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
  }, [checkAuth]);

  const processApplication = async (
    application: CoachApplication,
    decision: "approved" | "rejected",
  ) => {
    setProcessing(application.id);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (!session || sessionError) {
        Alert.alert("Error", "You are not authenticated. Please login again.");
        router.replace("/login");
        return;
      }

      const { error } = await supabase.rpc("review_coach_application", {
        application_id: application.id,
        decision,
      } as any);

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Success", `Application ${decision}.`);
        await fetchApplications();
        return true; // Return true to signal success to the caller
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to process application");
    } finally {
      setProcessing(null);
    }
    return false;
  };

  const filteredApplications = applications.filter(
    (app) => app.status === activeTab,
  );

  const counts = {
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return {
    user,
    loading,
    applications,
    filteredApplications,
    activeTab,
    setActiveTab,
    counts,
    processing,
    processApplication,
  };
}
