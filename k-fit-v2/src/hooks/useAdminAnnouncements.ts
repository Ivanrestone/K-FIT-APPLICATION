import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: "all" | "members" | "coaches";
  pinned: boolean;
  created_at: string;
}

export function useAdminAnnouncements() {
  const [user, setUser] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Announcement["audience"]>("all");
  const [pinned, setPinned] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { getServiceRoleClient } = await import("@/lib/supabase");
      const supabase = getServiceRoleClient();

      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, body, audience, pinned, created_at")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching announcements:", error);
        return;
      }
      setAnnouncements((data || []) as Announcement[]);
    } catch (error: any) {
      console.error("Error fetching announcements:", error);
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
        await fetchAnnouncements();
      }
    }
  }, [fetchAnnouncements]);

  useEffect(() => {
    const timeout = setTimeout(() => checkAuth(), 0);
    return () => clearTimeout(timeout);
  }, [checkAuth]);

  const handlePost = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Error", "Please enter a title and message");
      return;
    }

    setPosting(true);
    try {
      const { getServiceRoleClient } = await import("@/lib/supabase");
      const supabase = getServiceRoleClient();

      const { error } = await (
        supabase.from("announcements" as any) as any
      ).insert({
        title: title.trim(),
        body: body.trim(),
        audience,
        pinned,
        created_by: user.id,
      });

      if (error) {
        Alert.alert("Error", error.message || "Failed to post announcement");
      } else {
        // Reset form
        setTitle("");
        setBody("");
        setAudience("all");
        setPinned(false);
        Alert.alert("Success", "Announcement posted");
        await fetchAnnouncements();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to post announcement");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = (announcement: Announcement) => {
    Alert.alert("Delete Announcement", `Delete "${announcement.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(announcement.id);
          try {
            const { getServiceRoleClient } = await import("@/lib/supabase");
            const supabase = getServiceRoleClient();
            const { error } = await supabase
              .from("announcements")
              .delete()
              .eq("id", announcement.id);
            if (error) {
              Alert.alert("Error", error.message || "Failed to delete");
            } else {
              setAnnouncements((prev) =>
                prev.filter((a) => a.id !== announcement.id),
              );
            }
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete");
          } finally {
            setDeleting(null);
          }
        },
      },
    ]);
  };

  return {
    user,
    loading,
    announcements,
    posting,
    deleting,
    title,
    setTitle,
    body,
    setBody,
    audience,
    setAudience,
    pinned,
    setPinned,
    handlePost,
    handleDelete,
  };
}
