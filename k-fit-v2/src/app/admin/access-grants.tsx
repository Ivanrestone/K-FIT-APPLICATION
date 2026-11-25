import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useSoundEffects } from "@/components/shared/SoundEffectsProvider";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
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
  error: "#EF4444",
  errorContainer: "rgba(239, 68, 68, 0.1)",
  success: "#10B981",
  border: "#222222",
};

interface AccessGrant {
  id: string;
  email: string;
  note: string | null;
  created_at: string;
}

// Reusable animated card for each grant
const AnimatedGrantCard = ({
  grant,
  removing,
  onRemove,
}: {
  grant: AccessGrant;
  removing: boolean;
  onRemove: () => void;
}) => {
  const [enterAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [enterAnim]);

  return (
    <Animated.View
      style={{
        opacity: enterAnim,
        transform: [
          {
            translateY: enterAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <View style={styles.grantCard}>
        <View style={styles.grantIcon}>
          <Ionicons name="mail-open-outline" size={20} color={Theme.accent} />
        </View>
        <View style={styles.grantInfo}>
          <Text style={styles.grantEmail}>{grant.email}</Text>
          {grant.note ? (
            <Text style={styles.grantNote}>{grant.note}</Text>
          ) : null}
          <Text style={styles.grantDate}>
            Added {new Date(grant.created_at).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.removeButton, removing && styles.disabledButton]}
          onPress={onRemove}
          disabled={removing}
        >
          <Ionicons
            name={removing ? "hourglass-outline" : "trash-outline"}
            size={18}
            color={Theme.error}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function AdminAccessGrantsScreen() {
  const playSound = useSoundEffects();
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  const fetchGrants = useCallback(async () => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("access_grants")
        .select("id, email, note, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching access grants:", error);
        Alert.alert("Error", "Failed to load access grants.");
      } else {
        setGrants((data || []) as AccessGrant[]);
      }
    } catch (error: any) {
      console.error("Error fetching access grants:", error);
    } finally {
      setLoading(false);
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
      return;
    }
    await fetchGrants();
  }, [fetchGrants]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
  }, [checkAuth]);

  const handleAdd = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      playSound("warning");
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setAdding(true);
    try {
      const { getServiceRoleClient } = await import("@/lib/supabase");
      const supabase = getServiceRoleClient();

      const { error } = await supabase.from("access_grants").insert({
        email: trimmed,
        note: note.trim() || null,
      } as any);

      if (error) {
        if (error.message?.includes("duplicate") || error.code === "23505") {
          playSound("warning");
          Alert.alert(
            "Already Added",
            "This email is already on the access grant list",
          );
        } else {
          playSound("warning");
          Alert.alert("Error", error.message || "Failed to add email");
        }
      } else {
        playSound("success");
        setEmail("");
        setNote("");
        Alert.alert(
          "Success",
          `${trimmed} can now sign up without manual approval`,
        );
        await fetchGrants();
      }
    } catch (error: any) {
      playSound("warning");
      Alert.alert("Error", error.message || "Failed to add email");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = (grant: AccessGrant) => {
    playSound("warning");
    Alert.alert(
      "Remove Access Grant",
      `Remove ${grant.email} from the access grant list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemoving(grant.id);
            try {
              const { getServiceRoleClient } = await import("@/lib/supabase");
              const supabase = getServiceRoleClient();

              const { error } = await supabase
                .from("access_grants")
                .delete()
                .eq("id", grant.id);

              if (error) {
                playSound("warning");
                Alert.alert("Error", error.message || "Failed to remove email");
              } else {
                playSound("success");
                setGrants((prev) => prev.filter((g) => g.id !== grant.id));
              }
            } catch (error: any) {
              playSound("warning");
              Alert.alert("Error", error.message || "Failed to remove email");
            } finally {
              setRemoving(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading Access Grants...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={Theme.accent} />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Access Grants</Text>
              <Text style={styles.subtitle}>
                Pre-approved emails skip manual approval
              </Text>
            </View>
          </View>

          {/* Add Form */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <MaterialCommunityIcons
                name="shield-key"
                size={20}
                color={Theme.accent}
              />
              <Text style={styles.formTitle}>Grant New Access</Text>
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={Theme.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Theme.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={Theme.textMuted}
              />
              <TextInput
                style={styles.input}
                placeholder="Note (optional)"
                placeholderTextColor={Theme.textMuted}
                value={note}
                onChangeText={setNote}
              />
            </View>

            <TouchableOpacity
              style={[styles.addButton, adding && styles.disabledButton]}
              onPress={handleAdd}
              disabled={adding}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={Theme.accentText}
              />
              <Text style={styles.addButtonText}>
                {adding ? "Adding..." : "Add Access Grant"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          <Text style={styles.sectionTitle}>
            Active Grants ({grants.length})
          </Text>

          {grants.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons
                  name="email-off-outline"
                  size={40}
                  color="#333"
                />
              </View>
              <Text style={styles.emptyText}>No access grants yet</Text>
              <Text style={styles.emptyHint}>
                Add emails above to pre-approve them for signup.
              </Text>
            </View>
          ) : (
            grants.map((grant) => (
              <AnimatedGrantCard
                key={grant.id}
                grant={grant}
                removing={removing === grant.id}
                onRemove={() => handleRemove(grant)}
              />
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  loadingContainer: { justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: Theme.accent, fontWeight: "600", marginTop: 8 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 13, color: Theme.textMuted, marginTop: 2 },

  // Form Card
  formCard: {
    backgroundColor: Theme.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 24,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Theme.text,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: Theme.text,
    paddingVertical: 14,
    paddingLeft: 10,
    fontSize: 14,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Theme.accent,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  addButtonText: { color: Theme.accentText, fontSize: 14, fontWeight: "800" },
  disabledButton: { opacity: 0.5 },

  // List Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Theme.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.border,
  },
  emptyText: { fontSize: 16, fontWeight: "700", color: Theme.text },
  emptyHint: {
    fontSize: 13,
    color: Theme.textMuted,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // Grant Card
  grantCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 10,
  },
  grantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  grantInfo: { flex: 1, marginRight: 12 },
  grantEmail: {
    fontSize: 15,
    fontWeight: "700",
    color: Theme.text,
    marginBottom: 2,
  },
  grantNote: { fontSize: 12, color: Theme.textMuted, marginBottom: 2 },
  grantDate: { fontSize: 11, color: "#4B5563", marginTop: 2 },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.errorContainer,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
