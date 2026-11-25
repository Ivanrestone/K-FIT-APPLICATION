// app/coach/clients.tsx
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
import { isUuid } from "@/lib/uuid";

const Theme = {
  background: "#080808",
  surface: "#141418",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD600",
  accentText: "#000000",
  border: "#27272F",
};

interface Client {
  id: string;
  coach_id: string;
  member_id: string;
  status: "pending" | "active" | "rejected";
  member?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export default function CoachClientsScreen() {
  const [user, setUser] = useState<any>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [fadeAnim] = useState(() => new Animated.Value(0));

  const checkAuth = async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
    } else {
      const role = currentUser?.user_metadata?.role || "member";
      if (role !== "coach") {
        if (role === "admin") router.replace("/admin/dashboard");
        else if (role === "member") router.replace("/member/dashboard");
        else router.replace("/login");
      } else {
        setUser(currentUser);
        await fetchClients(currentUser.id);
      }
    }
  };

  const fetchClients = async (coachId: string) => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data: clientsData, error: clientsError } = await supabase
        .from("coach_clients")
        .select("id, coach_id, member_id, status")
        .eq("coach_id", coachId)
        .eq("status", "active");

      if (clientsError) throw clientsError;
      const clientsWithMembers = await Promise.all(
        (clientsData || []).map(async (client: any) => {
          if (!isUuid(client.member_id)) {
            console.warn("Skipping a coach-client record with an invalid member ID.");
            return { ...client, member: undefined };
          }
          const { data: memberData, error: memberError } = await supabase
            .from("users")
            .select("email, first_name, last_name")
            .eq("id", client.member_id)
            .single();
          if (memberError) throw memberError;
          return { ...client, member: memberData };
        }),
      );
      setClients(clientsWithMembers);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      Alert.alert(
        "Unable to load clients",
        error?.message || "Please try again.",
      );
    } finally {
      setLoading(false);
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
        duration: 500,
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
        <Text style={styles.loadingText}>Loading Clients...</Text>
      </View>
    );
  }

  const filteredClients = clients.filter((client) => {
    const name = [
      client.member?.first_name,
      client.member?.last_name,
      client.member?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return name.includes(search.trim().toLowerCase());
  });

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <View style={styles.container}>
        {/* Header Row matching the image */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>ASSIGNED ROSTER</Text>
            <Text style={styles.title}>My Clients ({clients.length})</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Theme.textMuted} />
          <TextInput
            accessibilityLabel="Search assigned clients"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or email"
            placeholderTextColor={Theme.textMuted}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {!!search && (
            <TouchableOpacity
              onPress={() => setSearch("")}
              accessibilityRole="button"
              accessibilityLabel="Clear client search"
            >
              <Ionicons name="close-circle" size={18} color={Theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Client Cards List */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {clients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={48}
                color="#333"
              />
              <Text style={styles.emptyText}>No assigned clients yet</Text>
            </View>
          ) : filteredClients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="account-search-outline"
                size={42}
                color="#555"
              />
              <Text style={styles.emptyText}>No matching clients</Text>
            </View>
          ) : (
            filteredClients.map((client) => {
              const fullName = [
                client.member?.first_name,
                client.member?.last_name,
              ]
                .filter(Boolean)
                .join(" ");
              const initials = fullName
                ? fullName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "??";

              const memberName = fullName || client.member?.email || "Member";

              return (
                <View key={client.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.nameContainer}>
                      <Text style={styles.clientName}>
                        {memberName}
                      </Text>
                      <Text style={styles.clientEmail} numberOfLines={1}>
                        {client.member?.email || "Active client"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() =>
                        router.push({
                          pathname: "/coach/client-details",
                          params: { member_id: client.member_id },
                        })
                      }
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${memberName}'s profile and progress`}
                    >
                      <Ionicons
                        name="person-outline"
                        size={16}
                        color={Theme.accent}
                      />
                      <Text style={styles.secondaryButtonText}>Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.scheduleButton}
                      onPress={() =>
                        router.push({
                          pathname: "/coach/schedule-appointment",
                          params: {
                            member_id: client.member_id,
                            member_name: memberName,
                          },
                        })
                      }
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Schedule a session for ${memberName}`}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color={Theme.accentText}
                      />
                      <Text style={styles.scheduleButtonText}>Schedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() =>
                        router.push({
                          pathname: "/coach/workouts",
                          params: {
                            member_id: client.member_id,
                            member_name: memberName,
                          },
                        })
                      }
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Create a training plan for ${memberName}`}
                    >
                      <MaterialCommunityIcons
                        name="dumbbell"
                        size={16}
                        color={Theme.accent}
                      />
                      <Text style={styles.secondaryButtonText}>Plan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
  loadingText: {
    fontSize: 14,
    color: Theme.accent,
    fontWeight: "600",
    marginTop: 12,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    color: Theme.accent,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.5,
  },
  // List
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 13,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
  },
  searchInput: { flex: 1, color: Theme.text, fontSize: 14, paddingVertical: 10 },
  emptyContainer: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Theme.textMuted, fontWeight: "500" },

  // Card
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 16,
    marginBottom: 16,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: Theme.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "900", color: Theme.accentText },
  nameContainer: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: "900", color: Theme.text },
  clientEmail: { fontSize: 12, color: Theme.textMuted, marginTop: 3 },
  actions: { flexDirection: "row", gap: 8 },
  scheduleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: Theme.accent,
    paddingVertical: 11,
    borderRadius: 14,
  },
  scheduleButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: Theme.accentText,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  secondaryButtonText: { color: Theme.text, fontSize: 12, fontWeight: "700" },
});
