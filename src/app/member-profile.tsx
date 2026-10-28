import MemberBottomNav from "@/components/MemberBottomNav";
import { KFitColors, Spacing } from "@/constants/theme";
import { useMemberProfile } from "@/hooks/use-member-profile";
import { useAuth } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NAV_CLEARANCE = 140;

type FeatherName = keyof typeof Feather.glyphMap;

/* ---------- Extra editable profile data (local for now) ---------- */
type ProfileExtras = {
  phone: string;
  dateOfBirth: string;
  height: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  addressLine1: string;
  addressLine2: string;
  addressCountry: string;
};

const DEFAULT_EXTRAS: ProfileExtras = {
  phone: "+1 (917) 555-0142",
  dateOfBirth: "June 12, 1996",
  height: "178 cm",
  emergencyName: "Casey Lee",
  emergencyPhone: "(917) 555-0173",
  emergencyRelationship: "Spouse",
  addressLine1: "214 Kent Avenue, Apt 48",
  addressLine2: "Brooklyn, NY 11249",
  addressCountry: "United States",
};

/* ---------- Social links ---------- */
type SocialKey =
  | "instagram"
  | "twitter"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "other";

type SocialLinks = Record<SocialKey, string>;

const EMPTY_SOCIAL: SocialLinks = {
  instagram: "",
  twitter: "",
  facebook: "",
  tiktok: "",
  youtube: "",
  linkedin: "",
  other: "",
};

const SOCIAL_META: {
  key: SocialKey;
  label: string;
  hint: string;
  placeholder: string;
  icon: FeatherName;
}[] = [
  {
    key: "instagram",
    label: "Instagram",
    hint: "Instagram profile",
    placeholder: "https://instagram.com/yourhandle",
    icon: "instagram",
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    hint: "X profile",
    placeholder: "https://x.com/yourhandle",
    icon: "twitter",
  },
  {
    key: "facebook",
    label: "Facebook",
    hint: "Facebook profile",
    placeholder: "https://facebook.com/yourprofile",
    icon: "facebook",
  },
  {
    key: "tiktok",
    label: "TikTok",
    hint: "TikTok profile",
    placeholder: "https://tiktok.com/@yourhandle",
    icon: "music",
  },
  {
    key: "youtube",
    label: "YouTube",
    hint: "YouTube channel",
    placeholder: "https://youtube.com/@yourchannel",
    icon: "youtube",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    hint: "LinkedIn profile",
    placeholder: "https://linkedin.com/in/yourname",
    icon: "linkedin",
  },
  {
    key: "other",
    label: "Other",
    hint: "Website or other link",
    placeholder: "https://...",
    icon: "link",
  },
];

/* ---------------------------- Small building blocks ---------------------------- */

function Section({
  title,
  subtitle,
  icon,
  children,
  onEdit,
}: {
  title: string;
  subtitle?: string;
  icon?: FeatherName;
  children: React.ReactNode;
  onEdit?: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          {icon ? (
            <View style={styles.sectionIconBox}>
              <Feather name={icon} size={14} color={KFitColors.accent} />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {subtitle ? (
              <Text style={styles.sectionSubtitle}>{subtitle}</Text>
            ) : null}
          </View>
        </View>
        {onEdit ? (
          <TouchableOpacity
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${title}`}
            style={styles.sectionEditBtn}
            hitSlop={6}
          >
            <Feather name="edit-2" size={13} color={KFitColors.accent} />
            <Text style={styles.sectionEditText}>Edit</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon?: FeatherName;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <>
      <View style={styles.infoRow}>
        <View style={styles.infoRowLeft}>
          {icon ? (
            <Feather
              name={icon}
              size={14}
              color={KFitColors.mutedText}
              style={{ marginRight: 8 }}
            />
          ) : null}
          <Text style={styles.infoLabel}>{label}</Text>
        </View>
        <Text style={styles.infoValue} numberOfLines={2}>
          {value}
        </Text>
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
  editing: boolean;
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

function GoldButton({
  label,
  onPress,
  disabled,
  fullWidth,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: FeatherName;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.goldButton,
        fullWidth && styles.goldButtonFull,
        disabled && styles.disabled,
      ]}
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
        {icon ? (
          <Feather
            name={icon}
            size={14}
            color="#121212"
            style={{ marginRight: 6 }}
          />
        ) : null}
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
            <GoldButton
              label={actionLabel}
              onPress={onRetry}
              icon="refresh-cw"
            />
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
  const {
    coachRequest,
    error,
    isLoading,
    load,
    profile,
    saveMissingProfileFields,
    submitCoachRequest,
  } = useMemberProfile();

  /* --- Missing-fields edit --- */
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRequestingCoach, setIsRequestingCoach] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [firstNameDraft, setFirstNameDraft] = useState("");
  const [lastNameDraft, setLastNameDraft] = useState("");

  /* --- Full profile "Change profile" modal --- */
  const [changeProfileOpen, setChangeProfileOpen] = useState(false);
  const [extras, setExtras] = useState<ProfileExtras>(DEFAULT_EXTRAS);
  const [draft, setDraft] = useState<
    ProfileExtras & {
      firstName: string;
      lastName: string;
      email: string;
    }
  >({ ...DEFAULT_EXTRAS, firstName: "", lastName: "", email: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [changeProfileError, setChangeProfileError] = useState<string | null>(
    null,
  );

  /* --- Social links --- */
  const [socials, setSocials] = useState<SocialLinks>(EMPTY_SOCIAL);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialDraft, setSocialDraft] = useState<SocialLinks>(EMPTY_SOCIAL);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [isSavingSocials, setIsSavingSocials] = useState(false);

  /* --- Profile picture --- */
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarDraftUri, setAvatarDraftUri] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

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

  const completion = useMemo(() => {
    const fields = [
      effectiveProfile.firstName ?? "",
      effectiveProfile.lastName ?? "",
      effectiveProfile.email ?? "",
      extras.phone,
      extras.dateOfBirth,
      extras.height,
      extras.emergencyName,
      extras.emergencyPhone,
      extras.addressLine1,
      socials.instagram || socials.twitter || socials.linkedin,
    ];
    const filled = fields.filter((f) => f?.trim?.().length).length;
    return Math.round((filled / fields.length) * 100);
  }, [effectiveProfile, extras, socials]);

  /* ---------- Missing-fields save ---------- */
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

  /* ---------- Change profile ---------- */
  const openChangeProfile = () => {
    void Haptics.selectionAsync();
    setDraft({
      ...extras,
      firstName: effectiveProfile.firstName ?? "",
      lastName: effectiveProfile.lastName ?? "",
      email: effectiveProfile.email ?? "",
    });
    setChangeProfileError(null);
    setChangeProfileOpen(true);
  };

  const closeChangeProfile = () => {
    if (isSavingProfile) return;
    setChangeProfileOpen(false);
  };

  const saveFullProfile = async () => {
    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      setChangeProfileError("First name and last name are required.");
      return;
    }
    if (!draft.email.trim() || !draft.email.includes("@")) {
      setChangeProfileError("Enter a valid email address.");
      return;
    }
    setIsSavingProfile(true);
    setChangeProfileError(null);
    try {
      await saveMissingProfileFields({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        email: draft.email.trim(),
      });

      const { firstName, lastName, email, ...rest } = draft;
      setExtras(rest);

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setChangeProfileOpen(false);
    } catch (e) {
      setChangeProfileError(
        e instanceof Error ? e.message : "Could not save your profile.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const setDraftField = <K extends keyof typeof draft>(
    key: K,
    value: (typeof draft)[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setChangeProfileError(null);
  };

  /* ---------- Social links ---------- */
  const openSocials = () => {
    void Haptics.selectionAsync();
    setSocialDraft(socials);
    setSocialError(null);
    setSocialModalOpen(true);
  };

  const closeSocials = () => {
    if (isSavingSocials) return;
    setSocialModalOpen(false);
  };

  const setSocialField = (key: SocialKey, value: string) => {
    setSocialDraft((prev) => ({ ...prev, [key]: value }));
    setSocialError(null);
  };

  const clearSocialField = (key: SocialKey) => {
    setSocialDraft((prev) => ({ ...prev, [key]: "" }));
    setSocialError(null);
  };

  const saveSocials = async () => {
    for (const meta of SOCIAL_META) {
      const v = socialDraft[meta.key].trim();
      if (v && !/^(https?:\/\/|@)?[\w.\-@/]+$/.test(v)) {
        setSocialError(`"${meta.label}" doesn't look like a valid link.`);
        return;
      }
    }
    setIsSavingSocials(true);
    setSocialError(null);
    try {
      setSocials(socialDraft);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSocialModalOpen(false);
    } catch (e) {
      setSocialError(
        e instanceof Error ? e.message : "Could not save your links.",
      );
    } finally {
      setIsSavingSocials(false);
    }
  };

  const linkedSocials = SOCIAL_META.filter((m) => socials[m.key].trim());
  const socialCount = linkedSocials.length;

  /* ---------- Profile picture ---------- */
  const openAvatarModal = () => {
    void Haptics.selectionAsync();
    setAvatarDraftUri(avatarUri);
    setAvatarError(null);
    setAvatarModalOpen(true);
  };

  const closeAvatarModal = () => {
    if (isSavingAvatar) return;
    setAvatarModalOpen(false);
  };

  const pickAvatarFromLibrary = async () => {
    setAvatarError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAvatarError(
        "Photo library permission is required. Enable it in Settings.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarDraftUri(result.assets[0].uri);
    }
  };

  const takeAvatarPhoto = async () => {
    setAvatarError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setAvatarError("Camera permission is required. Enable it in Settings.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarDraftUri(result.assets[0].uri);
    }
  };

  const saveAvatar = async () => {
    if (!avatarDraftUri) {
      setAvatarError("Pick a photo first.");
      return;
    }
    setIsSavingAvatar(true);
    setAvatarError(null);
    try {
      setAvatarUri(avatarDraftUri);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAvatarModalOpen(false);
    } catch (e) {
      setAvatarError(
        e instanceof Error ? e.message : "Could not save your photo.",
      );
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    setIsSavingAvatar(true);
    setAvatarError(null);
    try {
      setAvatarUri(null);
      setAvatarDraftUri(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAvatarModalOpen(false);
    } catch (e) {
      setAvatarError(
        e instanceof Error ? e.message : "Could not remove your photo.",
      );
    } finally {
      setIsSavingAvatar(false);
    }
  };

  /* ---------- Render ---------- */
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
          </View>
          <Text style={styles.date}>{today}</Text>

          {/* Hero */}
          <View style={styles.profileHeader}>
            <TouchableOpacity
              onPress={openAvatarModal}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
              style={styles.avatarWrap}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <ImageBackground
                  source={require("../../assets/images/gold-texture.jpg")}
                  resizeMode="cover"
                  style={styles.avatar}
                  imageStyle={styles.avatarImage}
                >
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </ImageBackground>
              )}
              <View style={styles.avatarEditBadge}>
                <Feather name="camera" size={13} color={KFitColors.onAccent} />
              </View>
            </TouchableOpacity>

            <Text style={styles.profileName}>
              {fullName || "Name not provided"}
            </Text>
            <View style={styles.heroChips}>
              <View style={styles.roleChip}>
                <Feather
                  name={effectiveProfile.role === "coach" ? "award" : "user"}
                  size={10}
                  color={KFitColors.accent}
                />
                <Text style={styles.roleChipText}>
                  {effectiveProfile.role.toUpperCase()}
                </Text>
              </View>
              <View style={styles.verifiedChip}>
                <Feather
                  name="check-circle"
                  size={10}
                  color={KFitColors.accent}
                />
                <Text style={styles.roleChipText}>VERIFIED</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.changeProfileButton}
              onPress={openChangeProfile}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Feather name="edit-3" size={14} color={KFitColors.accent} />
              <Text style={styles.changeProfileButtonText}>Change profile</Text>
            </TouchableOpacity>
          </View>

          {/* Completion card */}
          <View style={styles.completionCard}>
            <View style={styles.completionTop}>
              <View>
                <Text style={styles.completionLabel}>PROFILE COMPLETION</Text>
                <Text style={styles.completionValue}>
                  {completion}% complete
                </Text>
              </View>
              <Feather
                name={completion === 100 ? "check-circle" : "trending-up"}
                size={20}
                color={KFitColors.accent}
              />
            </View>
            <View style={styles.completionTrack}>
              <View
                style={[styles.completionFill, { width: `${completion}%` }]}
              />
            </View>
            <Text style={styles.completionHint}>
              {completion === 100
                ? "Your profile is fully complete. Nice work!"
                : "Fill in more details so your coaches know you better."}
            </Text>
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
          <Section
            title="Personal Information"
            subtitle="Your basic details"
            icon="user"
            onEdit={openChangeProfile}
          >
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
              <InfoRow icon="phone" label="Phone" value={extras.phone} />
              <InfoRow
                icon="calendar"
                label="Date of Birth"
                value={extras.dateOfBirth}
              />
              <InfoRow
                icon="maximize"
                label="Height"
                value={extras.height}
                last
              />
            </View>

            {hasMissingProfileFields ? (
              <View style={styles.profileActions}>
                {isEditing ? (
                  <>
                    <GoldButton
                      label={isSaving ? "Saving…" : "Save profile"}
                      onPress={saveProfile}
                      disabled={isSaving}
                      icon="check"
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

          {/* Social media */}
          <Section
            title="Social Media"
            subtitle={`${socialCount} linked`}
            icon="link"
            onEdit={openSocials}
          >
            <View style={styles.cardFlush}>
              {socialCount === 0 ? (
                <TouchableOpacity
                  style={styles.emptySocialRow}
                  onPress={openSocials}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Add social media links"
                >
                  <View style={styles.socialIconBox}>
                    <Feather name="plus" size={14} color={KFitColors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.socialLabel}>Add social links</Text>
                    <Text style={styles.socialValue}>
                      Instagram, X, TikTok, YouTube and more
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={KFitColors.mutedText}
                  />
                </TouchableOpacity>
              ) : (
                linkedSocials.map((meta, idx) => {
                  const isLast = idx === linkedSocials.length - 1;
                  const value = socials[meta.key].trim();
                  return (
                    <View key={meta.key}>
                      <TouchableOpacity
                        style={styles.socialRow}
                        onPress={openSocials}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${meta.label}`}
                      >
                        <View style={styles.socialIconBox}>
                          <Feather
                            name={meta.icon}
                            size={14}
                            color={KFitColors.accent}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.socialLabel}>{meta.label}</Text>
                          <Text style={styles.socialValue} numberOfLines={1}>
                            {value}
                          </Text>
                        </View>
                        <Feather
                          name="chevron-right"
                          size={18}
                          color={KFitColors.mutedText}
                        />
                      </TouchableOpacity>
                      {!isLast ? <View style={styles.dividerInset} /> : null}
                    </View>
                  );
                })
              )}
            </View>
          </Section>

          {/* Coach status */}
          {effectiveProfile.role === "member" ? (
            <Section
              title="Coach Status"
              subtitle="Become a K-Fit coach"
              icon="award"
            >
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
                      icon="arrow-up-right"
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
          <Section
            title="Membership"
            subtitle="Your plan & billing cycle"
            icon="credit-card"
          >
            <View style={styles.card}>
              <InfoRow icon="layers" label="Plan" value="Performance" />
              <InfoRow
                icon="calendar"
                label="Member Since"
                value="September 11, 2016"
              />
              <InfoRow
                icon="refresh-cw"
                label="Renewal Date"
                value="November 01, 2026"
              />
              <InfoRow icon="zap" label="Sessions Used" value="18 / 20" last />
            </View>
          </Section>

          {/* Emergency contact */}
          <Section
            title="Emergency Contact"
            subtitle="Someone we can reach in an emergency"
            icon="phone-call"
            onEdit={openChangeProfile}
          >
            <View style={styles.card}>
              <InfoRow icon="user" label="Name" value={extras.emergencyName} />
              <InfoRow
                icon="phone"
                label="Phone"
                value={extras.emergencyPhone}
              />
              <InfoRow
                icon="users"
                label="Relationship"
                value={extras.emergencyRelationship}
                last
              />
            </View>
          </Section>

          {/* Address */}
          <Section
            title="Address"
            subtitle="Where you're based"
            icon="map-pin"
            onEdit={openChangeProfile}
          >
            <View style={styles.card}>
              <View style={styles.addressRow}>
                <View style={styles.locationIcon}>
                  <Feather name="map-pin" size={16} color={KFitColors.accent} />
                </View>
                <Text style={styles.bodyText}>
                  {extras.addressLine1}
                  {"\n"}
                  {extras.addressLine2}
                  {"\n"}
                  {extras.addressCountry}
                </Text>
              </View>
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

      {/* ═════ Change profile modal ═════ */}
      <Modal
        visible={changeProfileOpen}
        transparent
        animationType="fade"
        onRequestClose={closeChangeProfile}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>CHANGE PROFILE</Text>
                <Text style={styles.modalSubtitle}>
                  Your edits save instantly.
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeChangeProfile}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
                disabled={isSavingProfile}
              >
                <Feather name="x" size={18} color={KFitColors.mutedText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <FieldGroup label="PERSONAL">
                <ModalField
                  label="First name"
                  value={draft.firstName}
                  onChangeText={(v) => setDraftField("firstName", v)}
                  placeholder="e.g. Jordan"
                  autoCapitalize="words"
                  icon="user"
                />
                <ModalField
                  label="Last name"
                  value={draft.lastName}
                  onChangeText={(v) => setDraftField("lastName", v)}
                  placeholder="e.g. Lee"
                  autoCapitalize="words"
                  icon="user"
                />
                <ModalField
                  label="Email"
                  value={draft.email}
                  onChangeText={(v) => setDraftField("email", v)}
                  placeholder="name@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="mail"
                />
                <ModalField
                  label="Phone"
                  value={draft.phone}
                  onChangeText={(v) => setDraftField("phone", v)}
                  placeholder="+1 (000) 000-0000"
                  keyboardType="phone-pad"
                  icon="phone"
                />
                <ModalField
                  label="Date of birth"
                  value={draft.dateOfBirth}
                  onChangeText={(v) => setDraftField("dateOfBirth", v)}
                  placeholder="e.g. June 12, 1996"
                  icon="calendar"
                />
                <ModalField
                  label="Height"
                  value={draft.height}
                  onChangeText={(v) => setDraftField("height", v)}
                  placeholder="e.g. 178 cm"
                  icon="maximize"
                />
              </FieldGroup>

              <FieldGroup label="EMERGENCY CONTACT">
                <ModalField
                  label="Name"
                  value={draft.emergencyName}
                  onChangeText={(v) => setDraftField("emergencyName", v)}
                  placeholder="e.g. Casey Lee"
                  autoCapitalize="words"
                  icon="user"
                />
                <ModalField
                  label="Phone"
                  value={draft.emergencyPhone}
                  onChangeText={(v) => setDraftField("emergencyPhone", v)}
                  placeholder="(000) 000-0000"
                  keyboardType="phone-pad"
                  icon="phone"
                />
                <ModalField
                  label="Relationship"
                  value={draft.emergencyRelationship}
                  onChangeText={(v) =>
                    setDraftField("emergencyRelationship", v)
                  }
                  placeholder="e.g. Spouse"
                  autoCapitalize="words"
                  icon="users"
                />
              </FieldGroup>

              <FieldGroup label="ADDRESS">
                <ModalField
                  label="Line 1"
                  value={draft.addressLine1}
                  onChangeText={(v) => setDraftField("addressLine1", v)}
                  placeholder="Street address"
                  icon="map-pin"
                />
                <ModalField
                  label="Line 2"
                  value={draft.addressLine2}
                  onChangeText={(v) => setDraftField("addressLine2", v)}
                  placeholder="City, state, ZIP"
                  icon="map-pin"
                />
                <ModalField
                  label="Country"
                  value={draft.addressCountry}
                  onChangeText={(v) => setDraftField("addressCountry", v)}
                  placeholder="Country"
                  icon="globe"
                />
              </FieldGroup>

              {changeProfileError ? (
                <Text style={styles.errorText} accessibilityRole="alert">
                  {changeProfileError}
                </Text>
              ) : null}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={closeChangeProfile}
                disabled={isSavingProfile}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, isSavingProfile && styles.disabled]}
                onPress={saveFullProfile}
                disabled={isSavingProfile}
                activeOpacity={0.8}
              >
                <Feather
                  name="check"
                  size={14}
                  color={KFitColors.onAccent}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.modalSaveText}>
                  {isSavingProfile ? "Saving…" : "Save changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═════ Social links modal ═════ */}
      <Modal
        visible={socialModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeSocials}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>SOCIAL LINKS</Text>
                <Text style={styles.modalSubtitle}>
                  Leave blank to hide a platform.
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeSocials}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
                disabled={isSavingSocials}
              >
                <Feather name="x" size={18} color={KFitColors.mutedText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <FieldGroup label="LINKS">
                {SOCIAL_META.map((meta) => (
                  <View key={meta.key} style={{ gap: 4 }}>
                    <View style={styles.socialFieldHeader}>
                      <View style={styles.socialFieldLabelRow}>
                        <Feather
                          name={meta.icon}
                          size={12}
                          color={KFitColors.accent}
                        />
                        <Text style={styles.modalFieldLabel}>{meta.label}</Text>
                      </View>
                      {socialDraft[meta.key].length > 0 ? (
                        <TouchableOpacity
                          onPress={() => clearSocialField(meta.key)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Clear ${meta.label}`}
                        >
                          <Feather
                            name="x-circle"
                            size={13}
                            color={KFitColors.mutedText}
                          />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <TextInput
                      style={styles.modalInput}
                      value={socialDraft[meta.key]}
                      onChangeText={(v) => setSocialField(meta.key, v)}
                      placeholder={meta.placeholder}
                      placeholderTextColor={KFitColors.mutedText}
                      keyboardType="url"
                      autoCapitalize="none"
                      autoCorrect={false}
                      accessibilityLabel={meta.label}
                    />
                  </View>
                ))}
              </FieldGroup>

              {socialError ? (
                <Text style={styles.errorText} accessibilityRole="alert">
                  {socialError}
                </Text>
              ) : null}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={closeSocials}
                disabled={isSavingSocials}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, isSavingSocials && styles.disabled]}
                onPress={saveSocials}
                disabled={isSavingSocials}
                activeOpacity={0.8}
              >
                <Feather
                  name="check"
                  size={14}
                  color={KFitColors.onAccent}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.modalSaveText}>
                  {isSavingSocials ? "Saving…" : "Save links"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═════ Profile picture modal ═════ */}
      <Modal
        visible={avatarModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeAvatarModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>PROFILE PICTURE</Text>
                <Text style={styles.modalSubtitle}>
                  Square photos look best (1:1).
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeAvatarModal}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
                disabled={isSavingAvatar}
              >
                <Feather name="x" size={18} color={KFitColors.mutedText} />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarPreviewWrap}>
              {avatarDraftUri ? (
                <Image
                  source={{ uri: avatarDraftUri }}
                  style={styles.avatarPreview}
                />
              ) : (
                <View style={styles.avatarPreviewEmpty}>
                  <Feather name="user" size={40} color={KFitColors.mutedText} />
                </View>
              )}
            </View>

            <View style={styles.avatarActions}>
              <TouchableOpacity
                style={styles.avatarActionBtn}
                onPress={() => void pickAvatarFromLibrary()}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Feather name="image" size={16} color={KFitColors.accent} />
                <Text style={styles.avatarActionText}>Library</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.avatarActionBtn}
                onPress={() => void takeAvatarPhoto()}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Feather name="camera" size={16} color={KFitColors.accent} />
                <Text style={styles.avatarActionText}>Camera</Text>
              </TouchableOpacity>
            </View>

            {avatarError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {avatarError}
              </Text>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={closeAvatarModal}
                disabled={isSavingAvatar}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, isSavingAvatar && styles.disabled]}
                onPress={() => void saveAvatar()}
                disabled={isSavingAvatar || !avatarDraftUri}
                activeOpacity={0.8}
              >
                <Feather
                  name="check"
                  size={14}
                  color={KFitColors.onAccent}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.modalSaveText}>
                  {isSavingAvatar ? "Saving…" : "Save photo"}
                </Text>
              </TouchableOpacity>
            </View>

            {avatarUri ? (
              <TouchableOpacity
                style={styles.removeAvatarBtn}
                onPress={() => void removeAvatar()}
                disabled={isSavingAvatar}
                accessibilityRole="button"
              >
                <Feather name="trash-2" size={14} color={KFitColors.error} />
                <Text style={styles.removeAvatarText}>Remove photo</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- Modal helpers ---------- */

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldGroupLabel}>{label}</Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function ModalField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  icon?: FeatherName;
}) {
  return (
    <View style={{ gap: 4 }}>
      <View style={styles.fieldLabelRow}>
        {icon ? (
          <Feather
            name={icon}
            size={11}
            color={KFitColors.accent}
            style={{ marginRight: 4 }}
          />
        ) : null}
        <Text style={styles.modalFieldLabel}>{label}</Text>
      </View>
      <TextInput
        style={styles.modalInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={KFitColors.mutedText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={label}
      />
    </View>
  );
}

/* ---------------------------------- Styles ---------------------------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1 },
  disabled: { opacity: 0.5 },

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
    marginTop: 14,
    marginBottom: 20,
  },
  avatarWrap: {
    width: 108,
    height: 108,
    marginBottom: 14,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: KFitColors.accent,
    elevation: 8,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  avatarImage: { borderRadius: 50 },
  avatarInitials: { color: "#121212", fontSize: 34, fontWeight: "900" },
  avatarEditBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: KFitColors.accent,
    borderWidth: 3,
    borderColor: KFitColors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 26,
    fontWeight: "900",
    color: KFitColors.text,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heroChips: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: KFitColors.accent,
  },
  changeProfileButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.accent + "14",
  },
  changeProfileButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.accent,
  },

  /* Completion card */
  completionCard: {
    marginHorizontal: 20,
    marginBottom: 22,
    padding: 14,
    borderRadius: 16,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
    gap: 8,
  },
  completionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  completionLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: KFitColors.accent,
    marginBottom: 3,
  },
  completionValue: {
    fontSize: 16,
    fontWeight: "800",
    color: KFitColors.text,
  },
  completionTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "26",
    overflow: "hidden",
  },
  completionFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: KFitColors.accent,
  },
  completionHint: {
    fontSize: 11,
    color: KFitColors.mutedText,
    lineHeight: 16,
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

  /* Sections */
  section: { paddingHorizontal: 20, marginBottom: 22 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  sectionIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: KFitColors.text,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: KFitColors.mutedText,
    marginTop: 2,
  },
  sectionEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: KFitColors.accent + "1F",
  },
  sectionEditText: {
    fontSize: 11,
    fontWeight: "800",
    color: KFitColors.accent,
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
    flex: 1,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: KFitColors.error,
    lineHeight: 18,
  },

  /* Info rows */
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  infoLabel: { fontSize: 13, color: KFitColors.mutedText },
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

  /* Address */
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
    marginTop: 2,
  },

  /* Social */
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  emptySocialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  socialIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  socialLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: KFitColors.text,
  },
  socialValue: {
    fontSize: 11,
    color: KFitColors.mutedText,
    marginTop: 2,
  },

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
  goldButtonFull: { alignSelf: "stretch" },
  goldButtonBg: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  goldButtonImage: { borderRadius: 12 },
  goldButtonText: { color: "#121212", fontSize: 14, fontWeight: "800" },

  /* Footer */
  footer: { paddingVertical: 24, alignItems: "center" },
  footerBrand: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: KFitColors.text,
  },
  footerVersion: { fontSize: 12, color: KFitColors.mutedText, marginTop: 4 },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
    backgroundColor: KFitColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: KFitColors.border,
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
    gap: 10,
  },
  modalTitle: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  modalSubtitle: {
    color: KFitColors.mutedText,
    fontSize: 11,
    marginTop: 2,
  },
  modalScroll: { flexGrow: 0 },
  fieldGroup: { gap: 8 },
  fieldGroupLabel: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalFieldLabel: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  modalInput: {
    minHeight: 44,
    backgroundColor: KFitColors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    paddingHorizontal: 12,
    color: KFitColors.text,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  modalCancel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  modalCancelText: {
    color: KFitColors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
  modalSave: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
  },
  modalSaveText: {
    color: KFitColors.onAccent,
    fontSize: 13,
    fontWeight: "900",
  },

  socialFieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  socialFieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  /* Avatar modal */
  avatarPreviewWrap: { alignItems: "center", paddingVertical: 12 },
  avatarPreview: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: KFitColors.accent,
  },
  avatarPreviewEmpty: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  avatarActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.accent + "14",
  },
  avatarActionText: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.accent,
  },
  removeAvatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    marginTop: 4,
    paddingVertical: 8,
  },
  removeAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: KFitColors.error,
  },
});
