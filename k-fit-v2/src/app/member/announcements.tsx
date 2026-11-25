// app/member/announcements.tsx
import {
  displayName,
  getTodaysBirthdays,
  type BirthdayUser,
} from "@/lib/birthdays";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const Theme = {
  background: "#080808",
  surface: "#121212",
  surfaceHigh: "#1A1A1A",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD700",
  border: "#222222",
  accentBg: "rgba(255, 215, 0, 0.1)",
  accentBorder: "rgba(255, 215, 0, 0.3)",
};

interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: "all" | "members" | "coaches";
  pinned: boolean;
  created_at: string;
}

// --- Animated Card Wrapper ---
const AnimatedCard = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const [enterAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 400,
      delay,
      useNativeDriver: true,
    }).start();
  }, [enterAnim, delay]);

  return (
    <Animated.View
      style={{
        opacity: enterAnim,
        transform: [
          {
            translateY: enterAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [15, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

export default function MemberAnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [fadeAnim] = useState(() => new Animated.Value(0));

  const checkAuth = async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
    } else {
      const role = currentUser?.user_metadata?.role || "member";
      if (role !== "member" && role !== "coach") {
        if (role === "admin") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/login");
        }
      } else {
        const { getMembershipAccess } = await import("@/lib/membership");
        const access = await getMembershipAccess(currentUser.id);
        if (access === "none") {
          setLoading(false);
          router.replace("/member/membership");
          return;
        }
        await fetchAnnouncements();
      }
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, body, audience, pinned, created_at")
        .in("audience", ["all", "members"])
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching announcements:", error);
      } else {
        setAnnouncements((data || []) as Announcement[]);
      }

      const birthdayData = await getTodaysBirthdays();
      setBirthdays(birthdayData);
    } catch (error: any) {
      console.error("Error fetching announcements:", error);
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

  // Fade in the main screen once loaded
  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading Announcements...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="megaphone" size={24} color={Theme.accent} />
          </View>
          <Text style={styles.title}>Announcements</Text>
          <Text style={styles.subtitle}>News & updates from the gym</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Birthday Section */}
          {birthdays.length > 0 && (
            <View style={styles.birthdaySection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>🎉 Birthday Today</Text>
                <View style={styles.sectionLine} />
              </View>

              {birthdays.map((b, index) => (
                <AnimatedCard key={b.id} delay={index * 100}>
                  <View style={styles.birthdayCard}>
                    <View style={styles.birthdayIcon}>
                      <MaterialCommunityIcons
                        name="gift"
                        size={24}
                        color={Theme.accent}
                      />
                    </View>
                    <View style={styles.birthdayInfo}>
                      <Text style={styles.birthdayName}>{displayName(b)}</Text>
                      <Text style={styles.birthdayText}>
                        is celebrating their birthday today!
                      </Text>
                    </View>
                  </View>
                </AnimatedCard>
              ))}
            </View>
          )}

          {/* Announcements List */}
          {announcements.length === 0 && birthdays.length === 0 ? (
            <AnimatedCard>
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBg}>
                  <Ionicons name="megaphone-outline" size={48} color="#333" />
                </View>
                <Text style={styles.emptyText}>No announcements yet</Text>
              </View>
            </AnimatedCard>
          ) : (
            <View style={styles.listContainer}>
              {announcements.map((announcement, index) => (
                <AnimatedCard
                  key={announcement.id}
                  delay={index * 50 + birthdays.length * 100}
                >
                  <View
                    style={[
                      styles.card,
                      announcement.pinned && styles.cardPinned,
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      {announcement.pinned ? (
                        <View style={styles.pinnedBadge}>
                          <MaterialCommunityIcons
                            name="pin"
                            size={12}
                            color={Theme.accent}
                          />
                          <Text style={styles.pinnedBadgeText}>PINNED</Text>
                        </View>
                      ) : (
                        <View style={{ flex: 1 }} />
                      )}
                      <Text style={styles.date}>
                        {new Date(announcement.created_at).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </Text>
                    </View>
                    <Text style={styles.cardTitle}>{announcement.title}</Text>
                    <Text style={styles.cardBody}>{announcement.body}</Text>
                  </View>
                </AnimatedCard>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  loadingText: {
    fontSize: 14,
    color: Theme.accent,
    fontWeight: "600",
    marginTop: 12,
  },

  // Header
  header: { alignItems: "center", paddingTop: 24, paddingBottom: 24 },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.accentBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 13, color: Theme.textMuted, marginTop: 4 },

  // Content
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Theme.accent,
    letterSpacing: 0.5,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  // Birthday Card
  birthdaySection: { marginBottom: 24 },
  birthdayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    padding: 16,
    marginBottom: 12,
  },
  birthdayIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  birthdayInfo: { flex: 1 },
  birthdayName: {
    fontSize: 16,
    fontWeight: "800",
    color: Theme.text,
    marginBottom: 2,
  },
  birthdayText: { fontSize: 13, color: Theme.textMuted, fontWeight: "500" },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.border,
  },
  emptyText: { fontSize: 14, color: Theme.textMuted, fontWeight: "500" },

  // Announcement Cards
  listContainer: { gap: 12 },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 20,
  },
  cardPinned: {
    borderColor: "rgba(255, 215, 0, 0.4)",
    backgroundColor: "rgba(255, 215, 0, 0.03)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pinnedBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: Theme.accent,
    letterSpacing: 0.5,
  },
  date: { fontSize: 11, fontWeight: "600", color: Theme.textMuted },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Theme.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  cardBody: { fontSize: 14, color: Theme.textMuted, lineHeight: 22 },
});
