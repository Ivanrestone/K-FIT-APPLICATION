import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";

const Theme = {
  background: "#080808",
  surface: "#141418",
  surfaceHigh: "#1C1C22",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD600",
  accentText: "#000000",
  border: "#27272F",
};

const inputFields = [
  { key: "firstName", label: "First name", multiline: false },
  { key: "lastName", label: "Last name", multiline: false },
  { key: "phone", label: "Contact phone", multiline: false },
  { key: "experience", label: "Years of experience", multiline: false },
  { key: "specialties", label: "Specialties (comma-separated)", multiline: false },
  {
    key: "certifications",
    label: "Certifications (comma-separated)",
    multiline: false,
  },
  {
    key: "sessionTypes",
    label: "Preferred session types (comma-separated)",
    multiline: false,
  },
  { key: "biography", label: "Coaching biography", multiline: true },
] as const;

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function CoachProfileScreen() {
  const [coachId, setCoachId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [certifications, setCertifications] = useState("");
  const [sessionTypes, setSessionTypes] = useState("");
  const [biography, setBiography] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const displayName = useMemo(
    () => [firstName.trim(), lastName.trim()].filter(Boolean).join(" "),
    [firstName, lastName],
  );
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.replace("/login");
          return;
        }
        if (currentUser.user_metadata?.role !== "coach") {
          router.replace(
            currentUser.user_metadata?.role === "admin"
              ? "/admin/dashboard"
              : "/member/dashboard",
          );
          return;
        }

        const supabase = getSupabaseClient() as any;
        const [{ data: account, error: accountError }, { data: profile, error }] =
          await Promise.all([
            supabase
              .from("users")
              .select("id, email, first_name, last_name, created_at")
              .eq("id", currentUser.id)
              .single(),
            supabase
              .from("coach_profiles")
              .select(
                "biography, contact_phone, specialties, certifications, experience_years, preferred_session_types",
              )
              .eq("coach_id", currentUser.id)
              .maybeSingle(),
          ]);

        if (accountError) throw accountError;
        if (error) throw error;
        if (!active) return;

        setCoachId(currentUser.id);
        setEmail(account.email ?? "");
        setCreatedAt(account.created_at ?? null);
        setFirstName(account.first_name ?? "");
        setLastName(account.last_name ?? "");
        setPhone(profile?.contact_phone ?? "");
        setExperience(
          profile?.experience_years == null
            ? ""
            : String(profile.experience_years),
        );
        setSpecialties((profile?.specialties ?? []).join(", "));
        setCertifications((profile?.certifications ?? []).join(", "));
        setSessionTypes((profile?.preferred_session_types ?? []).join(", "));
        setBiography(profile?.biography ?? "");
      } catch (error) {
        console.error("Error loading coach profile:", error);
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load your profile.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const saveProfile = async () => {
    if (!coachId) return;
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Name required", "Enter your first and last name.");
      return;
    }

    const years = experience.trim() ? Number(experience) : null;
    if (
      years !== null &&
      (!Number.isInteger(years) || years < 0 || !Number.isFinite(years))
    ) {
      Alert.alert(
        "Invalid experience",
        "Enter a whole number of years, or leave it blank.",
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSavedMessage("");
    try {
      const supabase = getSupabaseClient() as any;
      const { error } = await supabase.rpc("save_coach_profile", {
        p_first_name: firstName.trim(),
        p_last_name: lastName.trim(),
        p_biography: biography.trim(),
        p_contact_phone: phone.trim(),
        p_specialties: splitList(specialties),
        p_certifications: splitList(certifications),
        p_experience_years: years,
        p_preferred_session_types: splitList(sessionTypes),
      });
      if (error) throw error;
      setSavedMessage("Your profile and coaching preferences are saved.");
    } catch (error) {
      console.error("Error saving coach profile:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || "CO"}</Text>
          </View>
          <Text style={styles.title}>{displayName || "Coach profile"}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.roleBadge}>
            <MaterialCommunityIcons
              name="whistle"
              size={14}
              color={Theme.accent}
            />
            <Text style={styles.roleText}>COACH</Text>
          </View>
        </View>

        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={18}
              color="#F87171"
            />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
        {!!savedMessage && (
          <View style={styles.successBanner}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={18}
              color={Theme.accent}
            />
            <Text style={styles.successText}>{savedMessage}</Text>
          </View>
        )}

        <View style={styles.accountCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Email</Text>
            <Text style={styles.accountValue}>{email || "Not available"}</Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Member since</Text>
            <Text style={styles.accountValue}>
              {createdAt
                ? new Date(createdAt).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })
                : "Not available"}
            </Text>
          </View>
          <Text style={styles.helperText}>
            Profile photo uploads are not configured in this application.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="fitness-outline" size={19} color={Theme.accent} />
            <Text style={styles.sectionTitle}>Coaching profile</Text>
          </View>

          {inputFields.map((field) => {
            const props = {
              firstName,
              lastName,
              phone,
              experience,
              specialties,
              certifications,
              sessionTypes,
              biography,
            };
            const setters = {
              firstName: setFirstName,
              lastName: setLastName,
              phone: setPhone,
              experience: setExperience,
              specialties: setSpecialties,
              certifications: setCertifications,
              sessionTypes: setSessionTypes,
              biography: setBiography,
            };

            return (
              <View key={field.key} style={styles.field}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  accessibilityLabel={field.label}
                  style={[styles.input, field.multiline && styles.textArea]}
                  value={props[field.key]}
                  onChangeText={setters[field.key]}
                  placeholder={field.label}
                  placeholderTextColor="#686868"
                  autoCapitalize={
                    field.key === "experience" ? "none" : "sentences"
                  }
                  keyboardType={
                    field.key === "experience" ? "number-pad" : "default"
                  }
                  multiline={field.multiline}
                  textAlignVertical={field.multiline ? "top" : "center"}
                />
              </View>
            );
          })}

          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.saveButton, saving && styles.disabled]}
            onPress={() => void saveProfile()}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Theme.accentText} />
            ) : (
              <MaterialCommunityIcons
                name="content-save-outline"
                size={18}
                color={Theme.accentText}
              />
            )}
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save profile"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.settingsLink}
          onPress={() => router.push("/coach/settings")}
          accessibilityRole="button"
        >
          <Ionicons name="settings-outline" size={18} color={Theme.accent} />
          <Text style={styles.settingsLinkText}>Coach settings</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={Theme.textMuted}
          />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.background,
  },
  content: { padding: 18, paddingTop: 24, paddingBottom: 120 },
  loadingText: { marginTop: 12, color: Theme.accent, fontWeight: "600" },
  profileHeader: { alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: Theme.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: Theme.accentText, fontSize: 26, fontWeight: "900" },
  title: { color: Theme.text, fontSize: 23, fontWeight: "900" },
  email: { color: Theme.textMuted, fontSize: 13, marginTop: 4 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,214,0,0.25)",
    backgroundColor: "rgba(255,214,0,0.08)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
  },
  roleText: { color: Theme.accent, fontSize: 10, fontWeight: "900" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.25)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { flex: 1, color: "#FCA5A5", fontSize: 13, lineHeight: 18 },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255,214,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,214,0,0.25)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  successText: { flex: 1, color: Theme.text, fontSize: 13, lineHeight: 18 },
  accountCard: {
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { color: Theme.text, fontSize: 16, fontWeight: "800" },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 14,
  },
  accountLabel: { color: Theme.textMuted, fontSize: 13 },
  accountValue: {
    flex: 1,
    color: Theme.text,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  helperText: {
    color: Theme.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 14,
  },
  formCard: {
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 18,
    padding: 16,
  },
  field: { marginTop: 16 },
  label: {
    color: Theme.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 7,
  },
  input: {
    minHeight: 48,
    backgroundColor: Theme.background,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Theme.text,
    fontSize: 14,
  },
  textArea: { minHeight: 112, textAlignVertical: "top" },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    backgroundColor: Theme.accent,
    borderRadius: 13,
    marginTop: 20,
  },
  saveButtonText: { color: Theme.accentText, fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.6 },
  settingsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 52,
    marginTop: 14,
  },
  settingsLinkText: { flex: 1, color: Theme.text, fontSize: 13, fontWeight: "700" },
});
