import MemberBottomNav from "@/components/MemberBottomNav";
import { KFitColors, Spacing } from "@/constants/theme";
import { useLogout } from "@/hooks/use-logout";
import { useMemberProfile } from "@/hooks/use-member-profile";
import { useAuth } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Clears the floating nav (dock + raised QR button + safe area).
const NAV_CLEARANCE = 140;

type FeatherName = keyof typeof Feather.glyphMap;

/* ---------------------------- Small building blocks ---------------------------- */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: FeatherName;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon ? (
          <Feather name={icon} size={16} color={KFitColors.accent} />
        ) : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {!last ? <View style={styles.divider} /> : null}
    </>
  );
}

function EditableRow({
  label,
  value,
  editing,
  draft,
  onChangeDraft,
  last,
  inputProps,
}: {
  label: string;
  value?: string | null;
  editing: boolean; // true only when in edit mode AND this field is missing
  draft: string;
  onChangeDraft: (v: string) => void;
  last?: boolean;
  inputProps?: TextInputProps;
}) {
  return (
    <>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        {editing ? (
          <TextInput
            style={styles.profileInput}
            value={draft}
            onChangeText={onChangeDraft}
            placeholderTextColor={KFitColors.mutedText}
            accessibilityLabel={label}
            {...inputProps}
          />
        ) : (
          <Text style={styles.infoValue}>
            {value?.trim() || "Not provided"}
          </Text>
        )}
      </View>
      {!last ? <View style={styles.divider} /> : null}
    </>
  );
}

function LinkRow({
  label,
  value,
  last,
  onPress,
}: {
  label: string;
  value?: string;
  last?: boolean;
  onPress?: () => void;
}) {
  return (
    <>
      <TouchableOpacity
        style={styles.linkRow}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        <Text style={styles.linkLabel}>{label}</Text>
        <View style={styles.linkRight}>
          {value ? <Text style={styles.linkValue}>{value}</Text> : null}
          <Feather
            name="chevron-right"
            size={18}
            color={KFitColors.mutedText}
          />
        </View>
      </TouchableOpacity>
      {!last ? <View style={styles.dividerInset} /> : null}
    </>
  );
}

function GoldButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.goldButton, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      <ImageBackground
        source={require("../../assets/images/gold-texture.jpg")}
        resizeMode="cover"
        style={styles.goldButtonBg}
        imageStyle={styles.goldButtonImage}
      >
        <Text style={styles.goldButtonText}>{label}</Text>
      </ImageBackground>
    </TouchableOpacity>
  );
}

/* ---------------------------------- Screens ---------------------------------- */

export default function MemberProfileScreen() {
  return process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
    <ConfiguredMemberProfileScreen />
  ) : (
    <ProfileStatusScreen message="Clerk sign in is not configured." />
  );
}

function ProfileStatusScreen({
  message,
  onRetry,
  isLoading = false,
  actionLabel = "Retry",
}: {
  message: string;
  onRetry?: () => void;
  isLoading?: boolean;
  actionLabel?: string;
}) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.mainContainer}>
        <View style={styles.statusContent}>
          {isLoading ? <ActivityIndicator color={KFitColors.accent} /> : null}
          <Text style={styles.statusTitle}>
            {isLoading ? "Loading your profile" : "Profile unavailable"}
          </Text>
          <Text style={styles.statusMessage}>{message}</Text>
          {onRetry ? (
            <GoldButton label={actionLabel} onPress={onRetry} />
          ) : null}
        </View>
        <MemberBottomNav activeRoute="/member-profile" />
      </View>
    </SafeAreaView>
  );
}

function ConfiguredMemberProfileScreen() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { isSigningOut, logout } = useLogout();
  const {
    coachRequest,
    error,
    isLoading,
    load,
    profile,
    saveMissingProfileFields,
    submitCoachRequest,
  } = useMemberProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRequestingCoach, setIsRequestingCoach] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [firstNameDraft, setFirstNameDraft] = useState("");
  const [lastNameDraft, setLastNameDraft] = useState("");

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );

  if (isLoading) {
    return <ProfileStatusScreen message="Loading your profile…" isLoading />;
  }
  if (error) {
    return <ProfileStatusScreen message={error} onRetry={() => void load()} />;
  }

  const effectiveProfile =
    profile ??
    (!isSignedIn
      ? {
          id: "demo_member",
          role: "member" as const,
          email: "member@gmail.com",
          firstName: "Demo",
          lastName: "Member",
        }
      : null);

  if (!effectiveProfile) {
    return (
      <ProfileStatusScreen
        message={
          isSignedIn
            ? "Your account profile is not available. Retry or contact your gym administrator."
            : "Sign in to view your member profile."
        }
        onRetry={isSignedIn ? () => void load() : () => router.replace("/")}
        actionLabel={isSignedIn ? "Retry" : "Sign in"}
      />
    );
  }

  const nameParts = [
    effectiveProfile.firstName,
    effectiveProfile.lastName,
  ].filter((n): n is string => Boolean(n?.trim()));
  const fullName = nameParts.join(" ");
  const initials =
    nameParts
      .map((n) => n.trim().charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "KF";

  const missingFirst = !effectiveProfile.firstName?.trim();
  const missingLast = !effectiveProfile.lastName?.trim();
  const missingEmail = !effectiveProfile.email?.trim();
  const hasMissingProfileFields = missingFirst || missingLast || missingEmail;

  const beginEdit = () => {
    setEmailDraft(effectiveProfile.email ?? "");
    setFirstNameDraft(effectiveProfile.firstName ?? "");
    setLastNameDraft(effectiveProfile.lastName ?? "");
    setActionError(null);
    setIsEditing(true);
  };

  const saveProfile = async () => {
    if (!emailDraft.trim() && !firstNameDraft.trim() && !lastNameDraft.trim()) {
      setActionError("Enter at least one missing profile detail.");
      return;
    }
    setIsSaving(true);
    setActionError(null);
    try {
      await saveMissingProfileFields({
        email: emailDraft,
        firstName: firstNameDraft,
        lastName: lastNameDraft,
      });
      setIsEditing(false);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Could not save your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const requestCoachStatus = async () => {
    setIsRequestingCoach(true);
    setActionError(null);
    try {
      await submitCoachRequest();
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Could not submit your request.",
      );
    } finally {
      setIsRequestingCoach(false);
    }
  };

  const coachStatusText =
    coachRequest?.status === "pending"
      ? "Your request to become a Coach is pending review."
      : coachRequest?.status === "approved"
        ? "Your request to become a Coach was approved."
        : coachRequest?.status === "rejected"
          ? "Your previous Coach request was declined."
          : "Request Coach status to let the gym review your account.";

  const canRequestCoach =
    coachRequest?.status !== "pending" && coachRequest?.status !== "approved";

  const quickActions: { label: string; icon: FeatherName; route: string }[] = [
    { label: "Workouts", icon: "zap", route: "/member-workout" },
    { label: "Progress", icon: "activity", route: "/member-dashboard" },
    { label: "Billing", icon: "credit-card", route: "/member-membership" },
    { label: "Check-in", icon: "map-pin", route: "/member-checkin" },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: NAV_CLEARANCE }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>FORM ATHLETICS</Text>
              <Text style={styles.brandSubtitle}>
                FORM / Brooklyn · Performance club
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              disabled={isSigningOut}
              onPress={logout}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Feather name="log-out" size={14} color={KFitColors.error} />
              <Text style={styles.logoutText}>
                {isSigningOut ? "Signing out…" : "Logout"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.date}>{today}</Text>

          {/* Profile hero */}
          <View style={styles.profileHeader}>
            <ImageBackground
              source={require("../../assets/images/gold-texture.jpg")}
              resizeMode="cover"
              style={styles.avatar}
              imageStyle={styles.avatarImage}
            >
              <Text style={styles.avatarInitials}>{initials}</Text>
            </ImageBackground>
            <Text style={styles.profileName}>
              {fullName || "Name not provided"}
            </Text>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>
                {effectiveProfile.role.charAt(0).toUpperCase() +
                  effectiveProfile.role.slice(1)}
              </Text>
            </View>
          </View>

          {/* Quick actions */}
          <View style={styles.actionsGrid}>
            {quickActions.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={styles.actionCard}
                activeOpacity={0.8}
                onPress={() => router.replace(a.route as any)}
                accessibilityRole="button"
                accessibilityLabel={a.label}
              >
                <View style={styles.actionIconBox}>
                  <Feather name={a.icon} size={18} color={KFitColors.accent} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Personal information */}
          <Section title="Personal Information" icon="user">
            <View style={styles.card}>
              <EditableRow
                label="First Name"
                value={effectiveProfile.firstName}
                editing={isEditing && missingFirst}
                draft={firstNameDraft}
                onChangeDraft={setFirstNameDraft}
                inputProps={{ placeholder: "Enter your first name" }}
              />
              <EditableRow
                label="Last Name"
                value={effectiveProfile.lastName}
                editing={isEditing && missingLast}
                draft={lastNameDraft}
                onChangeDraft={setLastNameDraft}
                inputProps={{ placeholder: "Enter your last name" }}
              />
              <EditableRow
                label="Email"
                value={effectiveProfile.email}
                editing={isEditing && missingEmail}
                draft={emailDraft}
                onChangeDraft={setEmailDraft}
                inputProps={{
                  placeholder: "Enter your email",
                  keyboardType: "email-address",
                  autoCapitalize: "none",
                  autoCorrect: false,
                }}
              />
              <InfoRow label="Phone" value="+1 (917) 555-0142" />
              <InfoRow label="Date of Birth" value="June 12, 1996" />
              <InfoRow label="Height" value="178 cm" last />
            </View>

            {hasMissingProfileFields ? (
              <View style={styles.profileActions}>
                {isEditing ? (
                  <>
                    <GoldButton
                      label={isSaving ? "Saving…" : "Save profile"}
                      onPress={saveProfile}
                      disabled={isSaving}
                    />
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setActionError(null);
                        setIsEditing(false);
                      }}
                      disabled={isSaving}
                      accessibilityRole="button"
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.textButton}
                    onPress={beginEdit}
                    accessibilityRole="button"
                  >
                    <Feather
                      name="edit-2"
                      size={14}
                      color={KFitColors.accent}
                    />
                    <Text style={styles.textButtonLabel}>
                      Edit missing details
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {actionError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {actionError}
              </Text>
            ) : null}
          </Section>

          {/* Coach status */}
          {effectiveProfile.role === "member" ? (
            <Section title="Coach Status" icon="award">
              <View style={styles.card}>
                <Text style={styles.bodyText}>{coachStatusText}</Text>
                {canRequestCoach ? (
                  <View style={{ marginTop: Spacing.three }}>
                    <GoldButton
                      label={
                        isRequestingCoach
                          ? "Submitting…"
                          : "Request to become a Coach"
                      }
                      onPress={requestCoachStatus}
                      disabled={isRequestingCoach}
                    />
                  </View>
                ) : null}
              </View>
              {actionError && !isEditing ? (
                <Text style={styles.errorText} accessibilityRole="alert">
                  {actionError}
                </Text>
              ) : null}
            </Section>
          ) : null}

          {/* Membership */}
          <Section title="Membership Details" icon="credit-card">
            <View style={styles.card}>
              <InfoRow label="Plan" value="Performance" />
              <InfoRow label="Member Since" value="September 11, 2016" />
              <InfoRow label="Renewal Date" value="November 01, 2026" />
              <InfoRow label="Sessions Used" value="18 / 20" last />
            </View>
          </Section>

          {/* Emergency contact */}
          <Section title="Emergency Contact" icon="phone-call">
            <View style={styles.card}>
              <InfoRow label="Name" value="Casey Lee" />
              <InfoRow label="Phone" value="(917) 555-0173" />
              <InfoRow label="Relationship" value="Spouse" last />
            </View>
            <TouchableOpacity
              style={styles.textButton}
              accessibilityRole="button"
            >
              <Feather name="edit-2" size={14} color={KFitColors.accent} />
              <Text style={styles.textButtonLabel}>Edit Emergency Contact</Text>
            </TouchableOpacity>
          </Section>

          {/* Address */}
          <Section title="Address" icon="map-pin">
            <View style={styles.card}>
              <Text style={styles.bodyText}>
                214 Kent Avenue, Apt 48{"\n"}Brooklyn, NY 11249{"\n"}United
                States
              </Text>
            </View>
            <TouchableOpacity
              style={styles.textButton}
              accessibilityRole="button"
            >
              <Feather name="edit-2" size={14} color={KFitColors.accent} />
              <Text style={styles.textButtonLabel}>Edit Address</Text>
            </TouchableOpacity>
          </Section>

          {/* Preferences */}
          <Section title="Preferences" icon="sliders">
            <View style={styles.cardFlush}>
              <LinkRow label="Notifications" />
              <LinkRow label="Privacy Settings" />
              <LinkRow label="Language" value="English" last />
            </View>
          </Section>

          {/* Support */}
          <Section title="Support" icon="help-circle">
            <View style={styles.cardFlush}>
              <LinkRow label="Help Center" />
              <LinkRow label="Contact Support" />
              <LinkRow label="Terms of Service" />
              <LinkRow label="Privacy Policy" last />
            </View>
          </Section>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>FORM ATHLETICS</Text>
            <Text style={styles.footerVersion}>Version 1.0.0</Text>
          </View>
        </ScrollView>

        <MemberBottomNav activeRoute="/member-profile" />
      </View>
    </SafeAreaView>
  );
}

/* ---------------------------------- Styles ---------------------------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1 },

  /* Status */
  statusContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
    gap: Spacing.three,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: KFitColors.text,
  },
  statusMessage: {
    fontSize: 14,
    color: KFitColors.mutedText,
    lineHeight: 20,
    textAlign: "center",
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  brand: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: KFitColors.text,
  },
  brandSubtitle: {
    fontSize: 12,
    color: KFitColors.mutedText,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "700",
    color: KFitColors.error,
  },
  date: {
    paddingHorizontal: 20,
    marginTop: 10,
    fontSize: 12,
    color: KFitColors.mutedText,
  },

  /* Hero */
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: KFitColors.accentDark,
    elevation: 6,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  avatarImage: { borderRadius: 44 },
  avatarInitials: { color: "#121212", fontSize: 30, fontWeight: "900" },
  profileName: {
    fontSize: 24,
    fontWeight: "800",
    color: KFitColors.text,
    marginBottom: 8,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: KFitColors.accent,
  },

  /* Quick actions */
  actionsGrid: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1F",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: KFitColors.text,
  },

  /* Sections & cards */
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: KFitColors.text,
  },
  card: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  cardFlush: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  bodyText: {
    fontSize: 14,
    color: KFitColors.text,
    lineHeight: 21,
    paddingVertical: 10,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: KFitColors.error,
    lineHeight: 18,
  },

  /* Rows */
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },
  infoLabel: { fontSize: 14, color: KFitColors.mutedText },
  infoValue: {
    fontSize: 14,
    color: KFitColors.text,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  profileInput: {
    flex: 1,
    minWidth: 120,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.accent,
    paddingVertical: 4,
    color: KFitColors.text,
    fontSize: 14,
    textAlign: "right",
  },
  divider: { height: 1, backgroundColor: KFitColors.border },
  dividerInset: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginLeft: 16,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: 16,
  },
  linkLabel: { fontSize: 14, color: KFitColors.text, fontWeight: "500" },
  linkRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  linkValue: { fontSize: 14, color: KFitColors.mutedText },

  /* Buttons */
  profileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    marginTop: 12,
  },
  textButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 12,
    minHeight: 32,
  },
  textButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: KFitColors.accent,
  },
  cancelButton: { paddingHorizontal: 12, paddingVertical: 10 },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: KFitColors.mutedText,
  },
  goldButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  goldButtonBg: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  goldButtonImage: { borderRadius: 12 },
  goldButtonText: { color: "#121212", fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.5 },

  /* Footer */
  footer: { paddingVertical: 24, alignItems: "center" },
  footerBrand: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: KFitColors.text,
  },
  footerVersion: { fontSize: 12, color: KFitColors.mutedText, marginTop: 4 },
});
