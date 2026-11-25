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
  TextInput,
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
  success: "#10B981",
  warning: "#F59E0B",
  border: "#222222",
};

interface Coach {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

interface CoachClient {
  id: string;
  coach_id: string;
  member_id: string;
  status: "pending" | "active" | "rejected";
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// --- Animated Coach Card ---
const AnimatedCoachCard = ({
  coach,
  request,
  assigning,
  onSelect,
}: {
  coach: Coach;
  request?: CoachClient;
  assigning: boolean;
  onSelect: () => void;
}) => {
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const isActive = request?.status === "active";
  const isPending = request?.status === "pending";
  const disabled = assigning || isActive || isPending;

  const coachName =
    `${coach.first_name || ""} ${coach.last_name || ""}`.trim() || coach.email;
  const buttonText = isActive
    ? "Your Coach"
    : isPending
      ? "Request Pending"
      : "Request";
  const buttonColor = isActive
    ? Theme.success
    : isPending
      ? Theme.warning
      : Theme.accent;
  const buttonTextColor = disabled ? buttonColor : Theme.accentText;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View style={[styles.card, isActive && styles.cardSelected]}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(coachName)}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.coachName}>{coachName}</Text>
            <Text style={styles.specialty}>Personal Training</Text>
            <Text style={styles.coachEmail} numberOfLines={1}>
              {coach.email}
            </Text>
          </View>
          {isActive && (
            <View style={styles.activeBadge}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={Theme.success}
              />
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBottom}>
          <View style={styles.slotRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={Theme.textMuted}
            />
            <Text style={styles.slotText}>
              Coach since{" "}
              {coach.created_at
                ? new Date(coach.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })
                : "N/A"}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.chooseButton,
              {
                backgroundColor: disabled ? "transparent" : buttonColor,
                borderColor: buttonColor,
                borderWidth: disabled ? 1 : 0,
              },
            ]}
            onPress={onSelect}
            disabled={disabled}
            onPressIn={() =>
              !disabled &&
              Animated.spring(scaleAnim, {
                toValue: 0.97,
                useNativeDriver: true,
              }).start()
            }
            onPressOut={() =>
              !disabled &&
              Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
              }).start()
            }
          >
            {assigning && (
              <ActivityIndicator
                size="small"
                color={buttonColor}
                style={{ marginRight: 6 }}
              />
            )}
            <Text style={[styles.chooseButtonText, { color: buttonTextColor }]}>
              {assigning ? "Sending..." : buttonText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default function SelectCoachScreen() {
  const [user, setUser] = useState<any>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [requests, setRequests] = useState<CoachClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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
          setLoading(false);
          router.replace("/member/membership");
          return;
        }
        setUser(currentUser);
        await fetchCoaches(currentUser.id);
      }
    }
  };

  const fetchCoaches = async (memberId: string) => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data: requestsData, error: requestsError } = await supabase
        .from("coach_clients")
        .select("*")
        .eq("member_id", memberId);

      if (requestsError)
        console.error("Error fetching coach requests:", requestsError);
      else setRequests(requestsData || []);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "coach");

      if (error) {
        console.error("Error fetching coaches:", error);
        Alert.alert("Error", `Failed to load coaches: ${error.message}`);
      } else {
        setCoaches(data || []);
      }
    } catch (error: any) {
      console.error("Error fetching coaches:", error);
      Alert.alert("Error", "Failed to load coaches");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCoach = async (coach: Coach) => {
    setAssigning(coach.id);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from("coach_clients")
        .insert({
          coach_id: coach.id,
          member_id: user.id,
          status: "pending",
        } as any)
        .select()
        .single();

      if (error) {
        Alert.alert("Error", error.message || "Failed to send coach request");
      } else {
        Alert.alert(
          "Request Sent",
          `Your request to ${coach.first_name || coach.last_name || "the coach"} is pending approval.`,
        );
        await fetchCoaches(user.id);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to assign coach");
    } finally {
      setAssigning(null);
    }
  };

  const coachName = (coach: Coach) =>
    `${coach.first_name || ""} ${coach.last_name || ""}`.trim() || coach.email;

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAuth();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  const filtered = coaches.filter((coach) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      coachName(coach).toLowerCase().includes(q) ||
      coach.email.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator color={Theme.accent} size="large" />
        <Text style={styles.loadingText}>Finding coaches...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.replace("/member/dashboard")}
            style={styles.backLink}
          >
            <Ionicons name="arrow-back" size={16} color={Theme.accent} />
            <Text style={styles.backText}>Back to Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.eyebrow}>COACHING</Text>
            <Text style={styles.title}>Choose your instructor</Text>
            <Text style={styles.subtitle}>
              Pick the coach you want to train with.
            </Text>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={Theme.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email"
              placeholderTextColor="#555"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery("")}
                style={styles.clearSearch}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={Theme.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <MaterialCommunityIcons
                  name="account-search-outline"
                  size={32}
                  color="#333"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {coaches.length === 0 ? "No coaches yet" : "No matches found"}
              </Text>
              <Text style={styles.emptyText}>
                {coaches.length === 0
                  ? "No instructors are available at the moment. Check back later."
                  : `No instructors match "${query}". Try a different search.`}
              </Text>
            </View>
          ) : (
            filtered.map((coach) => {
              const request = requests.find((r) => r.coach_id === coach.id);
              return (
                <AnimatedCoachCard
                  key={coach.id}
                  coach={coach}
                  request={request}
                  assigning={assigning === coach.id}
                  onSelect={() => handleSelectCoach(coach)}
                />
              );
            })
          )}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  content: { padding: 20, paddingBottom: 120 },
  loadingText: { color: Theme.accent, fontWeight: "600", marginTop: 12 },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  backText: { color: Theme.textMuted, fontSize: 13, fontWeight: "600" },

  header: { marginBottom: 20 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "900",
    color: Theme.accent,
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  subtitle: { fontSize: 13, color: Theme.textMuted, marginTop: 4 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 20,
  },
  searchInput: { flex: 1, color: Theme.text, fontSize: 14 },
  clearSearch: { padding: 4 },

  card: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: "rgba(16, 185, 129, 0.3)",
    backgroundColor: "rgba(16, 185, 129, 0.03)",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  avatarText: { fontSize: 18, fontWeight: "900", color: Theme.accent },
  cardInfo: { flex: 1 },
  coachName: { fontSize: 16, fontWeight: "800", color: Theme.text },
  specialty: { fontSize: 12, color: Theme.textMuted, marginTop: 2 },
  coachEmail: { fontSize: 11, color: "#555", marginTop: 4 },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: Theme.success,
    letterSpacing: 0.5,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 16,
  },

  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  slotText: { fontSize: 11, color: Theme.textMuted },

  chooseButton: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chooseButtonText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },

  emptyCard: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 12,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 20,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: Theme.text },
  emptyText: {
    fontSize: 13,
    color: Theme.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
