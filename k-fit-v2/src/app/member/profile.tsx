import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Theme = {
  background: "#080808",
  surface: "#121212",
  surfaceHigh: "#1A1A1A",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD700",
  accentText: "#000000",
  error: "#EF4444",
  errorBg: "rgba(239, 68, 68, 0.1)",
  success: "#10B981",
  border: "#222222",
};

export default function MemberProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [birthdayShared, setBirthdayShared] = useState(false);
  const [savingBirthday, setSavingBirthday] = useState(false);

  const [fadeAnim] = useState(() => new Animated.Value(0));

  const checkAuth = async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
    } else {
      const role = currentUser?.user_metadata?.role || "member";
      if (role !== "member" && role !== "coach") {
        if (role === "admin") router.replace("/admin/dashboard");
        else router.replace("/login");
      } else {
        const { getMembershipAccess } = await import("@/lib/membership");
        const access = await getMembershipAccess(currentUser.id);
        if (access === "none") {
          router.replace("/member/membership");
          return;
        }
        setUser(currentUser);
        await fetchMemberData(currentUser.id);
      }
    }
  };

  const fetchMemberData = async (userId: string) => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      const { data: memberInfo } = await supabase
        .from("members")
        .select("*")
        .eq("id", userId)
        .single();

      // FIXED: Cast data as any to avoid "Spread types may only be created from object types"
      setUser({ ...(userData as any), ...(memberInfo as any) });
      setBirthdayShared(!!(userData as any)?.birthday_shared);
    } catch (error: any) {
      console.error("Error fetching member data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBirthdayVisibility = async (shared: boolean) => {
    if (!user?.id || savingBirthday) return;
    const previous = birthdayShared;
    setBirthdayShared(shared);
    setSavingBirthday(true);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();
      const { error } = await (supabase.from("users") as any)
        .update({ birthday_shared: shared })
        .eq("id", user.id);
      if (error) {
        setBirthdayShared(previous);
        Alert.alert(
          "Error",
          error.message || "Failed to update birthday visibility",
        );
      }
    } catch (error: any) {
      setBirthdayShared(previous);
      Alert.alert(
        "Error",
        error.message || "Failed to update birthday visibility",
      );
    } finally {
      setSavingBirthday(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, user, fadeAnim]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "Member";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Digital ID Card Header --- */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.badgeIcon}>
              <MaterialCommunityIcons name="medal" size={16} color="#000" />
            </View>
          </View>
          <Text style={styles.title}>{displayName}</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <MaterialCommunityIcons
              name="shield-star"
              size={14}
              color={Theme.accent}
            />
            <Text style={styles.roleBadgeText}>MEMBER</Text>
          </View>
        </View>

        {/* --- Personal Info Card --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={18} color={Theme.accent} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>First Name</Text>
            <Text style={styles.infoValue}>
              {user?.first_name || "Not set"}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Name</Text>
            <Text style={styles.infoValue}>{user?.last_name || "Not set"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })
                : "N/A"}
            </Text>
          </View>
        </View>

        {/* --- Birthday Card --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="cake-variant"
              size={18}
              color={Theme.accent}
            />
            <Text style={styles.sectionTitle}>Birthday</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Birthdate</Text>
            <Text style={styles.infoValue}>
              {user?.birthdate
                ? new Date(user.birthdate).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Not set"}
            </Text>
          </View>

          {user?.birthdate && (
            <>
              <View style={styles.divider} />
              <View style={styles.visibilityContainer}>
                <Text style={styles.visibilityLabel}>
                  Birthday Announcement
                </Text>
                <View style={styles.visibilityRow}>
                  <TouchableOpacity
                    style={[
                      styles.visibilityChip,
                      !birthdayShared && styles.visibilityChipActive,
                    ]}
                    onPress={() => handleBirthdayVisibility(false)}
                    disabled={savingBirthday}
                  >
                    <Text
                      style={[
                        styles.visibilityChipText,
                        !birthdayShared && styles.visibilityChipTextActive,
                      ]}
                    >
                      Only Me
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.visibilityChip,
                      birthdayShared && styles.visibilityChipActive,
                    ]}
                    onPress={() => handleBirthdayVisibility(true)}
                    disabled={savingBirthday}
                  >
                    <Text
                      style={[
                        styles.visibilityChipText,
                        birthdayShared && styles.visibilityChipTextActive,
                      ]}
                    >
                      Share to All
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.note}>
                  {birthdayShared
                    ? "Your birthday will be announced in the app on the day."
                    : "Your birthday stays private."}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* --- Actions --- */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/member/edit-profile")}
        >
          <Ionicons name="create-outline" size={20} color={Theme.accentText} />
          <Text style={styles.primaryButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace("/member/dashboard")}
        >
          <Ionicons name="arrow-back" size={20} color={Theme.text} />
          <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  scrollContent: { padding: 20, paddingTop: 30, paddingBottom: 120 },
  loadingText: { color: Theme.accent, marginTop: 12, fontWeight: "600" },
  header: { alignItems: "center", marginBottom: 32 },
  avatarWrapper: { position: "relative", marginBottom: 16 },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 36, fontWeight: "900", color: Theme.accent },
  badgeIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Theme.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Theme.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Theme.text,
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: Theme.textMuted, marginBottom: 12 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: Theme.accent,
    letterSpacing: 1,
  },
  section: {
    backgroundColor: Theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Theme.text },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: { fontSize: 13, color: Theme.textMuted, fontWeight: "500" },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.text,
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 4,
  },
  visibilityContainer: { paddingVertical: 12 },
  visibilityLabel: {
    fontSize: 13,
    color: Theme.textMuted,
    fontWeight: "500",
    marginBottom: 12,
  },
  visibilityRow: { flexDirection: "row", gap: 10 },
  visibilityChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: Theme.border,
  },
  visibilityChipActive: {
    backgroundColor: Theme.accent,
    borderColor: Theme.accent,
  },
  visibilityChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: Theme.textMuted,
  },
  visibilityChipTextActive: { color: Theme.accentText },
  note: {
    fontSize: 12,
    color: Theme.textMuted,
    marginTop: 12,
    fontStyle: "italic",
    lineHeight: 18,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.accent,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: Theme.accentText,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.surface,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  secondaryButtonText: { color: Theme.text, fontSize: 15, fontWeight: "600" },
});
