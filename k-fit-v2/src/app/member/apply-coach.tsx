// app/member/apply-coach.tsx
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useSoundEffects } from "@/components/shared/SoundEffectsProvider";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/* ════════════════════════════════════════════════════════════════════ */
/*  THEME — K-FIT ARENA premium dark/gold system                       */
/* ════════════════════════════════════════════════════════════════════ */
const Theme = {
  background: "#080808",
  backgroundRaised: "#0D0D0D",
  surface: "#121212",
  surfaceHigh: "#1A1A1A",
  surfaceHighest: "#202020",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  textDim: "#6B7280",
  accent: "#FFD700",
  accentSoft: "#FFE97A",
  accentDeep: "#B89600",
  onAccent: "#0A0A0A",
  border: "#222222",
  borderStrong: "#2E2E2E",
  success: "#10B981",
  successSoft: "rgba(16, 185, 129, 0.15)",
  error: "#FF3B30",
  errorSoft: "rgba(255, 59, 48, 0.12)",
  pendingSoft: "rgba(255, 215, 0, 0.10)",
  /* ✨ NEW — modal surface tokens */
  modalBackdrop: "rgba(0, 0, 0, 0.82)",
  modalSurface: "#0F0F0F",
  modalBorder: "#262626",
};

export default function ApplyCoachScreen() {
  const playSound = useSoundEffects();
  const [user, setUser] = useState<any>(null);
  const [experience, setExperience] = useState("");
  const [certification, setCertification] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingApplication, setExistingApplication] = useState<any>(null);

  /* ✨ NEW — presentation-only modal state (does NOT touch logic) */
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [modalMessage, setModalMessage] = useState("");

  /* ------------------------------------------------------------------ */
  /*  Auth + membership gate                                            */
  /* ------------------------------------------------------------------ */
  const checkAuth = async () => {
    try {
      const { getCurrentUser } = await import("@/lib/auth");
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      const role = currentUser?.user_metadata?.role || "member";

      if (role === "admin") {
        router.replace("/admin/dashboard");
        return;
      }
      if (role === "coach") {
        router.replace("/coach/dashboard");
        return;
      }
      if (role !== "member") {
        router.replace("/login");
        return;
      }

      const { getMembershipAccess } = await import("@/lib/membership");
      const access = await getMembershipAccess(currentUser.id);

      if (access === "none") {
        setFetching(false);
        router.replace("/member/membership");
        return;
      }

      setUser(currentUser);
      await checkExistingApplication(currentUser.id);
    } catch (err: any) {
      console.error("checkAuth failed:", err);
      setFetching(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Has this member already applied?                                  */
  /* ------------------------------------------------------------------ */
  const checkExistingApplication = async (userId: string) => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("coach_applications")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking application:", error.message);
      } else if (data) {
        setExistingApplication(data);
      }
    } catch (err: any) {
      console.error("Error checking application:", err);
    } finally {
      setFetching(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Submit application                                                */
  /* ------------------------------------------------------------------ */
  const handleSubmit = async () => {
    if (!experience.trim() || !certification.trim() || !message.trim()) {
      playSound("warning");
      Alert.alert(
        "Missing info",
        "Please fill in all fields before submitting.",
      );
      return;
    }
    if (!user) {
      playSound("warning");
      Alert.alert("Error", "You must be signed in to apply.");
      return;
    }

    setLoading(true);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { error } = await supabase.from("coach_applications").insert({
        user_id: user.id,
        experience: experience.trim(),
        certification: certification.trim(),
        message: message.trim(),
        status: "pending",
      } as any);

      if (error) {
        playSound("warning");
        setModalType("error");
        setModalMessage(error.message);
        setModalVisible(true);
      } else {
        playSound("success");
        setModalType("success");
        setModalMessage("An admin will review your application shortly.");
        setModalVisible(true);
      }
    } catch (err: any) {
      playSound("warning");
      const msg = err?.message || "Failed to submit application";
      setModalType("error");
      setModalMessage(msg);
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Boot                                                              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const t = setTimeout(() => checkAuth(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Loading state                                                     */
  /* ------------------------------------------------------------------ */
  if (fetching) {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.loaderHalo}>
          <View style={styles.loaderRing}>
            <ActivityIndicator size="large" color={Theme.accent} />
          </View>
        </View>
        <Text style={styles.loadingLabel}>K-FIT ARENA</Text>
        <Text style={styles.loadingText}>Checking your application…</Text>
      </View>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Already applied → status screen                                   */
  /* ------------------------------------------------------------------ */
  if (existingApplication) {
    const status: string = existingApplication.status || "pending";
    const statusColor =
      status === "approved"
        ? Theme.success
        : status === "rejected"
          ? Theme.error
          : Theme.accent;

    const statusLabel =
      status === "approved"
        ? "Approved"
        : status === "rejected"
          ? "Rejected"
          : "Under Review";

    const statusGlyph =
      status === "approved" ? "✓" : status === "rejected" ? "✕" : "…";

    const statusHeadline =
      status === "pending"
        ? "Hang tight — our team is reviewing your application."
        : status === "approved"
          ? "Welcome aboard! You're officially a K-Fit coach."
          : "Unfortunately your application was not approved.";

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status Hero ── */}
        <View style={styles.statusHero}>
          <View style={styles.statusHeroGlow} pointerEvents="none" />

          <View
            style={[
              styles.statusIconWrap,
              {
                backgroundColor: `${statusColor}14`,
                borderColor: `${statusColor}55`,
                shadowColor: statusColor,
              },
            ]}
          >
            <View
              style={[
                styles.statusIconInner,
                { backgroundColor: `${statusColor}10` },
              ]}
            >
              <Text style={[styles.statusIconGlyph, { color: statusColor }]}>
                {statusGlyph}
              </Text>
            </View>
          </View>

          <Text style={styles.statusEyebrow}>APPLICATION STATUS</Text>
          <Text style={styles.title}>{statusLabel}</Text>
          <Text style={styles.subtitle}>{statusHeadline}</Text>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: `${statusColor}14`,
                borderColor: `${statusColor}66`,
              },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusPillText, { color: statusColor }]}>
              {statusLabel.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Application Details Card ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionAccentBar} />
            <Text style={styles.sectionTitle}>YOUR APPLICATION</Text>
            <View style={styles.sectionHeaderSpacer} />
            <View style={styles.sectionChip}>
              <Text style={styles.sectionChipText}>SUBMITTED</Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Experience</Text>
            <Text style={styles.fieldValue}>
              {existingApplication.experience}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Certification</Text>
            <Text style={styles.fieldValue}>
              {existingApplication.certification}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Your message</Text>
            <Text style={styles.fieldValue}>{existingApplication.message}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Submitted</Text>
            <Text style={styles.fieldValue}>
              {existingApplication.created_at
                ? new Date(existingApplication.created_at).toLocaleString()
                : "N/A"}
            </Text>
          </View>

          {status === "rejected" && existingApplication.admin_notes ? (
            <>
              <View style={styles.divider} />
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Admin notes</Text>
                <Text style={[styles.fieldValue, { color: Theme.error }]}>
                  {existingApplication.admin_notes}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={() => router.replace("/member/dashboard")}
        >
          <View style={styles.buttonInnerHighlight} pointerEvents="none" />
          <Text style={styles.buttonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  New application → form                                            */
  /* ------------------------------------------------------------------ */
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Form Hero ── */}
      <View style={styles.heroBlock}>
        <View style={styles.heroGlow} pointerEvents="none" />

        <View style={styles.heroIconWrap}>
          <View style={styles.heroIconInner}>
            <Text style={styles.heroIconGlyph}>★</Text>
          </View>
        </View>

        <Text style={styles.heroEyebrow}>K-FIT ARENA · COACH PROGRAM</Text>
        <Text style={styles.title}>Become a Coach</Text>
        <Text style={styles.subtitle}>
          Tell us about yourself — an admin will review your application.
        </Text>

        <View style={styles.heroBadges}>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text style={styles.heroBadgeText}>3-MIN FORM</Text>
          </View>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text style={styles.heroBadgeText}>ADMIN REVIEW</Text>
          </View>
        </View>
      </View>

      {/* ── Form Card ── */}
      <View style={styles.formCard}>
        {/* Field 01 */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <View style={styles.stepChip}>
              <Text style={styles.stepChipText}>01</Text>
            </View>
            <Text style={styles.label}>Experience</Text>
          </View>
          <View style={styles.inputWrap}>
            <View style={styles.inputAccentBar} />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="e.g., 3 years of personal training"
              placeholderTextColor={Theme.textDim}
              value={experience}
              onChangeText={setExperience}
              multiline
            />
          </View>
        </View>

        {/* Field 02 */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <View style={styles.stepChip}>
              <Text style={styles.stepChipText}>02</Text>
            </View>
            <Text style={styles.label}>Certification</Text>
          </View>
          <View style={styles.inputWrap}>
            <View style={styles.inputAccentBar} />
            <TextInput
              style={styles.input}
              placeholder="e.g., NASM Certified Personal Trainer"
              placeholderTextColor={Theme.textDim}
              value={certification}
              onChangeText={setCertification}
            />
          </View>
        </View>

        {/* Field 03 */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <View style={styles.stepChip}>
              <Text style={styles.stepChipText}>03</Text>
            </View>
            <Text style={styles.label}>Why do you want to be a coach?</Text>
          </View>
          <View style={styles.inputWrap}>
            <View style={styles.inputAccentBar} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about yourself and why you'd be a great coach…"
              placeholderTextColor={Theme.textDim}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      </View>

      {/* ── Primary CTA ── */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        activeOpacity={0.85}
        onPress={handleSubmit}
        disabled={loading}
      >
        <View style={styles.buttonInnerHighlight} pointerEvents="none" />
        {loading ? (
          <View style={styles.buttonRow}>
            <ActivityIndicator size="small" color={Theme.onAccent} />
            <Text style={styles.buttonText}>Submitting…</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Submit Application</Text>
        )}
      </TouchableOpacity>

      {/* ── Secondary ── */}
      <TouchableOpacity
        style={styles.secondaryButton}
        activeOpacity={0.7}
        onPress={() => router.replace("/member/dashboard")}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </TouchableOpacity>

      <Text style={styles.footnote}>
        Your information is only used for coach evaluation.
      </Text>

      {/* ════════════════════════════════════════════════════════════ */}
      {/*  PREMIUM MODAL — loading / success / error                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (modalType !== "loading") setModalVisible(false);
        }}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (modalType !== "loading") setModalVisible(false);
            }}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalGlow} pointerEvents="none" />
            <View style={styles.modalRim} pointerEvents="none" />

            <View
              style={[
                styles.modalIconWrap,
                {
                  backgroundColor:
                    modalType === "success"
                      ? Theme.successSoft
                      : modalType === "error"
                        ? Theme.errorSoft
                        : Theme.pendingSoft,
                  borderColor:
                    modalType === "success"
                      ? `${Theme.success}55`
                      : modalType === "error"
                        ? `${Theme.error}55`
                        : `${Theme.accent}55`,
                  shadowColor:
                    modalType === "success"
                      ? Theme.success
                      : modalType === "error"
                        ? Theme.error
                        : Theme.accent,
                },
              ]}
            >
              <View
                style={[
                  styles.modalIconInner,
                  {
                    backgroundColor:
                      modalType === "success"
                        ? `${Theme.success}10`
                        : modalType === "error"
                          ? `${Theme.error}10`
                          : `${Theme.accent}10`,
                  },
                ]}
              >
                {modalType === "loading" ? (
                  <ActivityIndicator size="large" color={Theme.accent} />
                ) : (
                  <Text
                    style={[
                      styles.modalIconGlyph,
                      {
                        color:
                          modalType === "success" ? Theme.success : Theme.error,
                      },
                    ]}
                  >
                    {modalType === "success" ? "✓" : "!"}
                  </Text>
                )}
              </View>
            </View>

            <Text style={styles.modalEyebrow}>
              {modalType === "loading"
                ? "PLEASE WAIT"
                : modalType === "success"
                  ? "APPLICATION RECEIVED"
                  : "SUBMISSION FAILED"}
            </Text>
            <Text style={styles.modalTitle}>
              {modalType === "loading"
                ? "Submitting…"
                : modalType === "success"
                  ? "You're all set"
                  : "Something went wrong"}
            </Text>
            <Text style={styles.modalBody}>
              {modalType === "loading"
                ? "Sending your application to the K-Fit review team."
                : modalMessage}
            </Text>

            {modalType !== "loading" && (
              <View style={styles.modalActions}>
                {modalType === "success" ? (
                  <TouchableOpacity
                    style={styles.modalPrimaryBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      setModalVisible(false);
                      router.replace("/member/dashboard");
                    }}
                  >
                    <View
                      style={styles.buttonInnerHighlight}
                      pointerEvents="none"
                    />
                    <Text style={styles.buttonText}>Back to Dashboard</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.modalPrimaryBtn}
                      activeOpacity={0.85}
                      onPress={() => setModalVisible(false)}
                    >
                      <View
                        style={styles.buttonInnerHighlight}
                        pointerEvents="none"
                      />
                      <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalSecondaryBtn}
                      activeOpacity={0.7}
                      onPress={() => {
                        setModalVisible(false);
                        router.replace("/member/dashboard");
                      }}
                    >
                      <Text style={styles.secondaryButtonText}>
                        Back to Dashboard
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
/*  STYLES                                                             */
/* ════════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },

  /* ---------- Loader ---------- */
  loaderHalo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 215, 0, 0.04)",
  },
  loaderRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: "rgba(255, 215, 0, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 215, 0, 0.06)",
  },
  loadingLabel: {
    color: Theme.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
    marginTop: 22,
  },
  loadingText: {
    color: Theme.textMuted,
    fontSize: 13,
    marginTop: 8,
    letterSpacing: 0.4,
  },

  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },

  /* ---------- Hero (form) ---------- */
  heroBlock: {
    alignItems: "center",
    marginBottom: 28,
    marginTop: 8,
    paddingVertical: 12,
  },
  heroGlow: {
    position: "absolute",
    top: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255, 215, 0, 0.06)",
  },
  heroIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    padding: 1,
    backgroundColor: "rgba(255, 215, 0, 0.18)",
    marginBottom: 18,
    shadowColor: Theme.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  heroIconInner: {
    flex: 1,
    borderRadius: 23,
    backgroundColor: "#141414",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.25)",
  },
  heroIconGlyph: {
    fontSize: 30,
    color: Theme.accent,
    fontWeight: "900",
  },
  heroEyebrow: {
    color: Theme.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
    color: Theme.text,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 13,
    color: Theme.textMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
    maxWidth: 320,
  },
  heroBadges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  heroBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Theme.accent,
  },
  heroBadgeText: {
    color: Theme.textMuted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  /* ---------- Status screen hero ---------- */
  statusHero: {
    alignItems: "center",
    marginBottom: 28,
    marginTop: 8,
    paddingVertical: 20,
  },
  statusHeroGlow: {
    position: "absolute",
    top: -20,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255, 215, 0, 0.05)",
  },
  statusIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  statusIconInner: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIconGlyph: {
    fontSize: 38,
    fontWeight: "900",
  },
  statusEyebrow: {
    color: Theme.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 10,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 18,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  /* ---------- Form card ---------- */
  formCard: {
    backgroundColor: Theme.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  fieldGroup: {
    marginBottom: 22,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  stepChip: {
    minWidth: 26,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255, 215, 0, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepChipText: {
    color: Theme.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: Theme.text,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 14,
    backgroundColor: Theme.backgroundRaised,
    overflow: "hidden",
  },
  inputAccentBar: {
    width: 3,
    backgroundColor: "rgba(255, 215, 0, 0.4)",
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Theme.text,
    backgroundColor: "transparent",
  },
  inputMultiline: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  textArea: {
    height: 128,
    textAlignVertical: "top",
  },

  /* ---------- Status section ---------- */
  section: {
    backgroundColor: Theme.surface,
    padding: 20,
    borderRadius: 22,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: Theme.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  sectionAccentBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: Theme.accent,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: 1.2,
  },
  sectionHeaderSpacer: { flex: 1 },
  sectionChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.25)",
  },
  sectionChipText: {
    color: Theme.accent,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  fieldRow: {
    paddingVertical: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: Theme.textDim,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 15,
    color: Theme.text,
    lineHeight: 22,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: Theme.border,
    marginVertical: 14,
  },

  /* ---------- Buttons ---------- */
  button: {
    width: "100%",
    paddingVertical: 17,
    backgroundColor: Theme.accent,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: Theme.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  buttonInnerHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonText: {
    color: Theme.onAccent,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: Theme.textMuted,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  footnote: {
    fontSize: 10,
    color: Theme.textDim,
    textAlign: "center",
    marginTop: 22,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontWeight: "700",
  },

  /* ════════════════════════════════════════════════════════════════════ */
  /*  MODAL                                                             */
  /* ════════════════════════════════════════════════════════════════════ */
  modalRoot: {
    flex: 1,
    backgroundColor: Theme.modalBackdrop,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Theme.modalSurface,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: Theme.modalBorder,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.6,
    shadowRadius: 48,
    elevation: 24,
  },
  modalGlow: {
    position: "absolute",
    top: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(255, 215, 0, 0.08)",
  },
  modalRim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 215, 0, 0.25)",
  },
  modalIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIconInner: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  modalIconGlyph: {
    fontSize: 34,
    fontWeight: "900",
  },
  modalEyebrow: {
    color: Theme.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 10,
    textAlign: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 13,
    color: Theme.textMuted,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 8,
    marginBottom: 26,
  },
  modalActions: {
    width: "100%",
    gap: 10,
  },
  modalPrimaryBtn: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: Theme.accent,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: Theme.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  modalSecondaryBtn: {
    width: "100%",
    paddingVertical: 14,
    backgroundColor: "transparent",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
});
