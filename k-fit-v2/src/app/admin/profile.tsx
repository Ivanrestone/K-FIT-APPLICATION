import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
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
  border: "#222222",
  instagram: "#E1306C",
  facebook: "#1877F2",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  whatsapp: "#25D366",
};

export default function AdminProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fade-in animation
  const [fadeAnim] = useState(() => new Animated.Value(0));

  const checkAuth = async () => {
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
        await fetchAdminData(currentUser.id);
      }
    }
  };

  const fetchAdminData = async (userId: string) => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data } = await supabase
        .from("users")
        .select("id, email, role, created_at, first_name, last_name")
        .eq("id", userId)
        .single();

      if (data) {
        // FIXED: Cast data as object to satisfy TypeScript spread operator
        setUser((prev: any) => ({ ...prev, ...(data as object) }));
      }
    } catch (error: any) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const openSocial = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open link"),
    );
  };

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

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ""}`.trim()
    : user?.email?.split("@")[0] || "Admin";
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
              <MaterialCommunityIcons
                name="shield-check"
                size={16}
                color="#000"
              />
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
            <Text style={styles.roleBadgeText}>
              {(user?.role || "admin").toUpperCase()}
            </Text>
          </View>
        </View>

        {/* --- Account Info Card --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={18} color={Theme.accent} />
            <Text style={styles.sectionTitle}>Account Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Admin ID</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {user?.id?.slice(0, 12)}...
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
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

        {/* --- Social Media Section --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="share-social-outline"
              size={18}
              color={Theme.accent}
            />
            <Text style={styles.sectionTitle}>Connect with K-FIT</Text>
          </View>

          <View style={styles.socialGrid}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openSocial("https://instagram.com")}
            >
              <Ionicons
                name="logo-instagram"
                size={22}
                color={Theme.instagram}
              />
              <Text style={styles.socialText}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openSocial("https://facebook.com")}
            >
              <Ionicons name="logo-facebook" size={22} color={Theme.facebook} />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openSocial("https://twitter.com")}
            >
              <Ionicons name="logo-twitter" size={22} color={Theme.twitter} />
              <Text style={styles.socialText}>Twitter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openSocial("https://wa.me/")}
            >
              <Ionicons name="logo-whatsapp" size={22} color={Theme.whatsapp} />
              <Text style={styles.socialText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { width: "100%" }]}
              onPress={() => openSocial("https://kfit.com")}
            >
              <Ionicons name="globe-outline" size={22} color={Theme.accent} />
              <Text style={styles.socialText}>Official Website</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>K-FIT Smart Gym v5.0.0</Text>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  scrollContent: { padding: 20, paddingTop: 30, paddingBottom: 120 },
  loadingText: { color: Theme.accent, marginTop: 12, fontWeight: "600" },

  // Header Section
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

  // Sections
  section: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
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

  // Info Rows
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
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.05)" },

  // Social Grid
  socialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: "48%",
    gap: 10,
  },
  socialText: { fontSize: 13, fontWeight: "600", color: Theme.text },

  // Buttons
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.errorBg,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  logoutButtonText: { color: Theme.error, fontSize: 15, fontWeight: "700" },

  versionText: {
    textAlign: "center",
    color: "#333",
    fontSize: 11,
    marginTop: 24,
    fontWeight: "600",
  },
});
