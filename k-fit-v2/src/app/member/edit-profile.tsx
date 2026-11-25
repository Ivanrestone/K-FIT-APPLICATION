import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useSoundEffects } from "@/components/shared/SoundEffectsProvider";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
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
  border: "#222222",
  success: "#10B981",
};

export default function EditProfileScreen() {
  const playSound = useSoundEffects();
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Birthday State
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthdayShared, setBirthdayShared] = useState(false);

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

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
          setFetching(false);
          router.replace("/member/membership");
          return;
        }
        setUser(currentUser);
        await fetchUserData(currentUser.id);
      }
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data } = await supabase
        .from("users")
        .select("first_name, last_name, birthdate, birthday_shared")
        .eq("id", userId)
        .single();

      // FIXED: Cast data as any to avoid "Property does not exist on type 'never'"
      const userRecord = data as any;

      if (userRecord) {
        setFirstName(userRecord.first_name || "");
        setLastName(userRecord.last_name || "");
        const bd = userRecord.birthdate;
        if (bd) {
          const d = new Date(bd);
          if (!isNaN(d.getTime())) {
            setBirthMonth(String(d.getMonth() + 1));
            setBirthDay(String(d.getDate()));
            setBirthYear(String(d.getFullYear()));
          }
        }
        setBirthdayShared(!!userRecord.birthday_shared);
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error);
    } finally {
      setFetching(false);
    }
  };

  const buildBirthdate = (): {
    ok: boolean;
    value: string | null;
    error?: string;
  } => {
    const m = birthMonth.trim();
    const d = birthDay.trim();
    const y = birthYear.trim();

    if (!m && !d && !y) return { ok: true, value: null };
    if (!m || !d || !y) {
      return {
        ok: false,
        value: null,
        error: "Please fill in month, day, and year — or leave all empty",
      };
    }

    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    const year = parseInt(y, 10);
    const currentYear = new Date().getFullYear();

    if (isNaN(month) || month < 1 || month > 12) {
      return {
        ok: false,
        value: null,
        error: "Month must be between 1 and 12",
      };
    }
    if (isNaN(day) || day < 1 || day > 31) {
      return { ok: false, value: null, error: "Day must be between 1 and 31" };
    }
    if (isNaN(year) || year < 1900 || year > currentYear) {
      return {
        ok: false,
        value: null,
        error: `Year must be between 1900 and ${currentYear}`,
      };
    }

    const date = new Date(year, month - 1, day);
    if (date.getMonth() !== month - 1 || date.getDate() !== day) {
      return { ok: false, value: null, error: "That date does not exist" };
    }

    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { ok: true, value: iso };
  };

  const handleSave = async () => {
    if (
      !firstName.trim() &&
      !lastName.trim() &&
      !birthMonth.trim() &&
      !birthDay.trim() &&
      !birthYear.trim()
    ) {
      playSound("warning");
      Alert.alert("Error", "Please enter at least one field");
      return;
    }

    const birthdateResult = buildBirthdate();
    if (!birthdateResult.ok) {
      playSound("warning");
      Alert.alert(
        "Invalid Birthday",
        birthdateResult.error || "Please check the date",
      );
      return;
    }

    setLoading(true);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { error } = await (supabase.from("users") as any)
        .update({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          birthdate: birthdateResult.value,
          birthday_shared: birthdayShared,
        })
        .eq("id", user.id);

      if (error) {
        playSound("warning");
        Alert.alert("Error", error.message);
      } else {
        playSound("success");
        Alert.alert("Success", "Profile updated successfully");
        router.replace("/member/profile");
      }
    } catch (error: any) {
      playSound("warning");
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (newPassword.length < 6) {
      playSound("warning");
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      playSound("warning");
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setPasswordLoading(true);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const { error } = await getSupabaseClient().auth.updateUser({
        password: newPassword,
      });

      if (error) {
        playSound("warning");
        Alert.alert("Error", error.message);
      } else {
        playSound("success");
        Alert.alert(
          "Success",
          "Password set. You can now log in with email and password.",
        );
        setShowPasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      playSound("warning");
      Alert.alert("Error", error.message || "Failed to set password");
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!fetching) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [fetching, fadeAnim]);

  if (fetching) {
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

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.subtitle}>Update your personal details</Text>
          </View>

          {/* Personal Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={18} color={Theme.accent} />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person" size={18} color={Theme.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                placeholderTextColor="#555"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person" size={18} color={Theme.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                placeholderTextColor="#555"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* Birthday */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="cake-variant"
                size={18}
                color={Theme.accent}
              />
              <Text style={styles.sectionTitle}>Birthday</Text>
            </View>
            <Text style={styles.hint}>
              Your birthday will be announced in the app on the day — only if
              you choose to share it.
            </Text>

            <Text style={styles.label}>Birthdate</Text>
            <View style={styles.dateRow}>
              <View style={[styles.inputWrapper, styles.dateInputWrapper]}>
                <TextInput
                  style={[styles.input, styles.centerText]}
                  placeholder="MM"
                  placeholderTextColor="#555"
                  value={birthMonth}
                  onChangeText={setBirthMonth}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={[styles.inputWrapper, styles.dateInputWrapper]}>
                <TextInput
                  style={[styles.input, styles.centerText]}
                  placeholder="DD"
                  placeholderTextColor="#555"
                  value={birthDay}
                  onChangeText={setBirthDay}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={[styles.inputWrapper, styles.dateInputWrapperYear]}>
                <TextInput
                  style={[styles.input, styles.centerText]}
                  placeholder="YYYY"
                  placeholderTextColor="#555"
                  value={birthYear}
                  onChangeText={setBirthYear}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>

            <Text style={styles.label}>Birthday Visibility</Text>
            <View style={styles.visibilityRow}>
              <TouchableOpacity
                style={[
                  styles.visibilityChip,
                  !birthdayShared && styles.visibilityChipActive,
                ]}
                onPress={() => setBirthdayShared(false)}
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
                onPress={() => setBirthdayShared(true)}
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
                ? "Everyone in the app will see a birthday announcement on your special day."
                : "Only you can see your birthday. No announcement will be posted."}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Theme.accentText} />
            ) : (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={Theme.accentText}
              />
            )}
            <Text style={styles.primaryButtonText}>
              {loading ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>

          {/* Security Settings (Opens Modal) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={Theme.accent}
              />
              <Text style={styles.sectionTitle}>Security</Text>
            </View>
            <Text style={styles.hint}>
              Manage your account security and login methods.
            </Text>
            <TouchableOpacity
              style={styles.securityButton}
              onPress={() => setShowPasswordModal(true)}
            >
              <View style={styles.securityButtonLeft}>
                <Ionicons name="lock-closed" size={20} color={Theme.accent} />
                <Text style={styles.securityButtonText}>Change Password</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={Theme.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace("/member/profile")}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- CHANGE PASSWORD MODAL --- */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setShowPasswordModal(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBg}>
                <Ionicons name="lock-closed" size={24} color={Theme.accent} />
              </View>
              <Text style={styles.modalTitle}>Set Password</Text>
              <Text style={styles.modalSubtitle}>
                For accounts created with Google, this lets you also log in with
                email and password.
              </Text>
            </View>

            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={18} color={Theme.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor="#555"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={18} color={Theme.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor="#555"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveBtn,
                  passwordLoading && { opacity: 0.7 },
                ]}
                onPress={handleSetPassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator size="small" color={Theme.accentText} />
                ) : (
                  <Text style={styles.modalSaveText}>Save Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  scrollContent: { padding: 20, paddingTop: 24, paddingBottom: 120 },
  loadingText: { color: Theme.accent, fontWeight: "600", marginTop: 12 },

  header: { marginBottom: 24 },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 13, color: Theme.textMuted, marginTop: 4 },

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
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Theme.text },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.background,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: Theme.text,
    paddingVertical: 14,
    paddingLeft: 10,
    fontSize: 15,
  },
  centerText: { textAlign: "center", paddingLeft: 0 },
  dateRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  dateInputWrapper: { flex: 1 },
  dateInputWrapperYear: { flex: 1.4 },

  visibilityRow: { flexDirection: "row", gap: 10, marginTop: 4 },
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

  hint: {
    fontSize: 13,
    color: Theme.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  note: {
    fontSize: 12,
    color: Theme.textMuted,
    marginTop: 10,
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
    marginBottom: 16,
  },
  primaryButtonText: {
    color: Theme.accentText,
    fontSize: 15,
    fontWeight: "800",
  },

  securityButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  securityButtonLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  securityButtonText: { fontSize: 14, fontWeight: "600", color: Theme.text },

  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.surface,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  secondaryButtonText: { color: Theme.text, fontSize: 15, fontWeight: "600" },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Theme.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: { alignItems: "center", marginBottom: 24 },
  modalIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Theme.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Theme.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: { color: Theme.text, fontSize: 15, fontWeight: "600" },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Theme.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: { color: Theme.accentText, fontSize: 15, fontWeight: "800" },
});
