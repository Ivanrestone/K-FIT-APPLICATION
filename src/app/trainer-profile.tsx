import TrainerBottomNav from "@/components/TrainerBottomNav";
import TrainerHeader from "@/components/TrainerHeader";
import { KFitColors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NAV_CLEARANCE = 140;

type FeatherName = keyof typeof Feather.glyphMap;

/* ---------- Trainer profile data (local for now) ---------- */
type TrainerProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  specialties: string;
  certifications: string;
  yearsExperience: string;
  hourlyRate: string;
  location: string;
};

const DEFAULT_PROFILE: TrainerProfile = {
  firstName: "Marcus",
  lastName: "Vance",
  email: "marcus.vance@kfit.app",
  phone: "+1 (917) 555-0192",
  bio: "Head Strength & Conditioning Coach with 8+ years coaching athletes at every level. Specializes in powerlifting, Olympic lifting, and injury-proof programming.",
  specialties: "Powerlifting · Olympic Lifting · Athletic Performance",
  certifications: "NASM-CPT, CSCS, USAW Level 2",
  yearsExperience: "8",
  hourlyRate: "85",
  location: "FORM Brooklyn · Floor Station A",
};

/* ---------- Social links ---------- */
type SocialKey =
  | "instagram"
  | "twitter"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "other";

type SocialLinks = Record<SocialKey, string>;

const EMPTY_SOCIAL: SocialLinks = {
  instagram: "",
  twitter: "",
  tiktok: "",
  youtube: "",
  linkedin: "",
  other: "",
};

const SOCIAL_META: {
  key: SocialKey;
  label: string;
  placeholder: string;
  icon: FeatherName;
}[] = [
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/yourhandle",
    icon: "instagram",
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    placeholder: "https://x.com/yourhandle",
    icon: "twitter",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@yourhandle",
    icon: "music",
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@yourchannel",
    icon: "youtube",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/yourname",
    icon: "linkedin",
  },
  {
    key: "other",
    label: "Other",
    placeholder: "https://...",
    icon: "link",
  },
];

/* ---------- Reusable pieces ---------- */

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
          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${title}`}
            style={({ pressed }) => [
              styles.sectionEditBtn,
              pressed && styles.pressed,
            ]}
            hitSlop={6}
          >
            <Feather name="edit-2" size={13} color={KFitColors.accent} />
            <Text style={styles.sectionEditText}>Edit</Text>
          </Pressable>
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
            <View style={styles.infoIconWrap}>
              <Feather name={icon} size={12} color={KFitColors.accent} />
            </View>
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
  multiline,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps["keyboardType"];
  multiline?: boolean;
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
        style={[styles.modalInput, multiline && styles.modalInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={KFitColors.mutedText}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        accessibilityLabel={label}
      />
    </View>
  );
}

/* ---------- Screen ---------- */

export default function TrainerProfileScreen() {
  const [profile, setProfile] = useState<TrainerProfile>(DEFAULT_PROFILE);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [socials, setSocials] = useState<SocialLinks>(EMPTY_SOCIAL);

  /* Modals */
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  /* Drafts */
  const [profileDraft, setProfileDraft] =
    useState<TrainerProfile>(DEFAULT_PROFILE);
  const [socialDraft, setSocialDraft] = useState<SocialLinks>(EMPTY_SOCIAL);
  const [avatarDraftUri, setAvatarDraftUri] = useState<string | null>(null);

  /* Save states */
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSocials, setIsSavingSocials] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  /* Errors */
  const [profileError, setProfileError] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
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

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const initials =
    [profile.firstName, profile.lastName]
      .filter(Boolean)
      .map((n) => n.charAt(0).toUpperCase())
      .join("") || "KF";

  /* ---------- Profile edit ---------- */
  const openProfileModal = () => {
    void Haptics.selectionAsync();
    setProfileDraft(profile);
    setProfileError(null);
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    if (isSavingProfile) return;
    setProfileModalOpen(false);
  };

  const saveProfile = async () => {
    if (!profileDraft.firstName.trim() || !profileDraft.lastName.trim()) {
      setProfileError("First and last name are required.");
      return;
    }
    if (!profileDraft.email.includes("@")) {
      setProfileError("Enter a valid email.");
      return;
    }
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      setProfile(profileDraft);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setProfileModalOpen(false);
    } catch (e) {
      setProfileError(
        e instanceof Error ? e.message : "Could not save profile.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  /* ---------- Socials ---------- */
  const openSocialModal = () => {
    void Haptics.selectionAsync();
    setSocialDraft(socials);
    setSocialError(null);
    setSocialModalOpen(true);
  };

  const closeSocialModal = () => {
    if (isSavingSocials) return;
    setSocialModalOpen(false);
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
      setSocialError(e instanceof Error ? e.message : "Could not save links.");
    } finally {
      setIsSavingSocials(false);
    }
  };

  /* ---------- Avatar ---------- */
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

  const pickFromLibrary = async () => {
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

  const takePhoto = async () => {
    setAvatarError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setAvatarError("Camera permission is required.");
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
      setAvatarError(e instanceof Error ? e.message : "Could not save photo.");
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    setIsSavingAvatar(true);
    try {
      setAvatarUri(null);
      setAvatarDraftUri(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAvatarModalOpen(false);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const linkedSocials = SOCIAL_META.filter((m) => socials[m.key].trim());
  const socialCount = linkedSocials.length;

  const completion = useMemo(() => {
    const fields = [
      profile.firstName,
      profile.lastName,
      profile.email,
      profile.phone,
      profile.bio,
      profile.specialties,
      profile.certifications,
      profile.yearsExperience,
      profile.hourlyRate,
      profile.location,
    ];
    const filled = fields.filter((f) => f.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.main}>
        <TrainerHeader subtitle="MY PROFILE" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: NAV_CLEARANCE }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.date}>{today}</Text>

          {/* ─────────── Hero ─────────── */}
          <View style={styles.hero}>
            <Pressable
              onPress={openAvatarModal}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
              style={({ pressed }) => [
                styles.avatarWrap,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.avatarRing}>
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
              </View>
              <View style={styles.avatarEditBadge}>
                <Feather name="camera" size={13} color={KFitColors.onAccent} />
              </View>
            </Pressable>

            <Text style={styles.fullName}>{fullName || "Trainer"}</Text>
            <Text style={styles.heroSubtitle}>
              {profile.specialties.split("·")[0]?.trim() || "Personal Trainer"}
            </Text>

            <View style={styles.heroChips}>
              <View style={styles.roleChip}>
                <Feather name="award" size={10} color={KFitColors.accent} />
                <Text style={styles.roleChipText}>HEAD COACH</Text>
              </View>
              <View style={styles.roleChip}>
                <Feather
                  name="check-circle"
                  size={10}
                  color={KFitColors.accent}
                />
                <Text style={styles.roleChipText}>VERIFIED</Text>
              </View>
              <View style={styles.roleChip}>
                <Feather name="map-pin" size={10} color={KFitColors.accent} />
                <Text style={styles.roleChipText} numberOfLines={1}>
                  {profile.location.split("·")[0]?.trim() || "ON SITE"}
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.pressed,
              ]}
              onPress={openProfileModal}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Feather name="edit-3" size={14} color={KFitColors.accent} />
              <Text style={styles.editButtonText}>Edit profile</Text>
            </Pressable>
          </View>

          {/* ─────────── Stats ─────────── */}
          <View style={styles.statStrip}>
            <StatInline
              icon="award"
              value={profile.yearsExperience || "—"}
              label="Years"
            />
            <View style={styles.statDivider} />
            <StatInline icon="users" value="24" label="Clients" />
            <View style={styles.statDivider} />
            <StatInline icon="star" value="4.9" label="Rating" />
          </View>

          {/* ─────────── Completion ─────────── */}
          <View style={styles.completionCard}>
            <View style={styles.completionTop}>
              <View style={styles.flex}>
                <Text style={styles.completionLabel}>PROFILE COMPLETION</Text>
                <Text style={styles.completionValue}>
                  {completion}% complete
                </Text>
              </View>
              <View style={styles.completionRing}>
                <Text style={styles.completionRingText}>{completion}%</Text>
              </View>
            </View>
            <View style={styles.completionTrack}>
              <View
                style={[styles.completionFill, { width: `${completion}%` }]}
              />
            </View>
            <Text style={styles.completionHint}>
              {completion === 100
                ? "Your profile is fully complete. Nice work!"
                : "Add more details so clients know what you offer."}
            </Text>
          </View>

          {/* ─────────── About ─────────── */}
          <Section
            title="About"
            subtitle="Short bio for your clients"
            icon="file-text"
            onEdit={openProfileModal}
          >
            <View style={styles.card}>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          </Section>

          {/* ─────────── Specialties ─────────── */}
          <Section
            title="Specialties"
            subtitle="Your coaching focus areas"
            icon="target"
            onEdit={openProfileModal}
          >
            <View style={styles.card}>
              <View style={styles.chipRow}>
                {profile.specialties
                  .split("·")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <View key={tag} style={styles.chip}>
                      <Text style={styles.chipText}>{tag}</Text>
                    </View>
                  ))}
              </View>
            </View>
          </Section>

          {/* ─────────── Certifications ─────────── */}
          <Section
            title="Certifications"
            subtitle="Credentials your clients trust"
            icon="award"
            onEdit={openProfileModal}
          >
            <View style={styles.card}>
              <View style={styles.chipRow}>
                {profile.certifications
                  .split(",")
                  .map((c) => c.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <View key={tag} style={[styles.chip, styles.chipCert]}>
                      <Feather
                        name="check"
                        size={10}
                        color={KFitColors.accent}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.chipText}>{tag}</Text>
                    </View>
                  ))}
              </View>
            </View>
          </Section>

          {/* ─────────── Contact ─────────── */}
          <Section
            title="Contact"
            subtitle="How clients reach you"
            icon="mail"
            onEdit={openProfileModal}
          >
            <View style={styles.card}>
              <InfoRow icon="mail" label="Email" value={profile.email} />
              <InfoRow icon="phone" label="Phone" value={profile.phone} />
              <InfoRow
                icon="dollar-sign"
                label="Rate"
                value={`$${profile.hourlyRate}/hr`}
                last
              />
            </View>
          </Section>

          {/* ─────────── Location ─────────── */}
          <Section
            title="Location"
            subtitle="Where to find you"
            icon="map-pin"
            onEdit={openProfileModal}
          >
            <View style={styles.card}>
              <View style={styles.locationRow}>
                <View style={styles.locationIcon}>
                  <Feather name="map-pin" size={16} color={KFitColors.accent} />
                </View>
                <Text style={styles.bioText}>{profile.location}</Text>
              </View>
            </View>
          </Section>

          {/* ─────────── Socials ─────────── */}
          <Section
            title="Social Media"
            subtitle={
              socialCount === 0 ? "Not linked yet" : `${socialCount} linked`
            }
            icon="link"
            onEdit={openSocialModal}
          >
            <View style={styles.cardFlush}>
              {socialCount === 0 ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.emptySocialRow,
                    pressed && styles.pressed,
                  ]}
                  onPress={openSocialModal}
                  accessibilityRole="button"
                  accessibilityLabel="Add social links"
                >
                  <View style={styles.socialIconBox}>
                    <Feather name="plus" size={14} color={KFitColors.accent} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.socialLabel}>Add social links</Text>
                    <Text style={styles.socialValue}>
                      Show clients where to find you
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={KFitColors.mutedText}
                  />
                </Pressable>
              ) : (
                linkedSocials.map((meta, idx) => {
                  const isLast = idx === linkedSocials.length - 1;
                  return (
                    <View key={meta.key}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.socialRow,
                          pressed && styles.pressed,
                        ]}
                        onPress={openSocialModal}
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
                        <View style={styles.flex}>
                          <Text style={styles.socialLabel}>{meta.label}</Text>
                          <Text style={styles.socialValue} numberOfLines={1}>
                            {socials[meta.key]}
                          </Text>
                        </View>
                        <Feather
                          name="chevron-right"
                          size={18}
                          color={KFitColors.mutedText}
                        />
                      </Pressable>
                      {!isLast ? <View style={styles.dividerInset} /> : null}
                    </View>
                  );
                })
              )}
            </View>
          </Section>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>KFIT TRAINER</Text>
            <Text style={styles.footerVersion}>Version 1.0.0</Text>
          </View>
        </ScrollView>

        <TrainerBottomNav activeRoute="/trainer-profile" />
      </View>

      {/* ═════════════ Edit profile modal ═════════════ */}
      <Modal
        visible={profileModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeProfileModal}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.flex}>
                <Text style={styles.modalTitle}>EDIT PROFILE</Text>
                <Text style={styles.modalSubtitle}>
                  Update your info — changes save instantly.
                </Text>
              </View>
              <Pressable
                onPress={closeProfileModal}
                hitSlop={10}
                disabled={isSavingProfile}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Feather name="x" size={18} color={KFitColors.mutedText} />
              </Pressable>
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
                  value={profileDraft.firstName}
                  onChangeText={(v) =>
                    setProfileDraft((p) => ({ ...p, firstName: v }))
                  }
                  icon="user"
                />
                <ModalField
                  label="Last name"
                  value={profileDraft.lastName}
                  onChangeText={(v) =>
                    setProfileDraft((p) => ({ ...p, lastName: v }))
                  }
                  icon="user"
                />
                <ModalField
                  label="Email"
                  value={profileDraft.email}
                  onChangeText={(v) =>
                    setProfileDraft((p) => ({ ...p, email: v }))
                  }
                  keyboardType="email-address"
                  icon="mail"
                />
                <ModalField
                  label="Phone"
                  value={profileDraft.phone}
                  onChangeText={(v) =>
                    setProfileDraft((p) => ({ ...p, phone: v }))
                  }
                  keyboardType="phone-pad"
                  icon="phone"
                />
              </FieldGroup>

              <FieldGroup label="COACHING">
                <ModalField
                  label="Bio"
                  value={profileDraft.bio}
                  onChangeText={(v) =>
                    setProfileDraft((p) => ({ ...p, bio: v }))
                  }
                  multiline
                  icon="file-text"
                />
                <ModalField
                  label="Specialties"
                  value={profileDraft.specialties}
                  onChangeText={(v) =>
                    setProfileDraft((p) => ({ ...p, specialties: v }))
                  }
                  icon="target"
                />
                <ModalField
                  label="Certifications"
                  value={profileDraft.certifications}
                  onChangeText={(v) =>
                    setProfileDraft((p) => ({ ...p, certifications: v }))
                  }
                  icon="award"
                />
                <ModalField
                  label="Years of experience"
                  value={profileDraft.yearsExperience}
                  onChangeText={(v) =>
                    setProfileDraft((p) => ({ ...p, yearsExperience: v }))
                  }
                  keyboardType="number-pad"
                  icon="clock"
                />
                <ModalField
                  label="Hourly rate ($)"
                  value={profileDraft.hourlyRate}
                  onChangeText={(v) =>
                    setProfileDraft((p) => ({ ...p, hourlyRate: v }))
                  }
                  keyboardType="decimal-pad"
                  icon="dollar-sign"
                />
                <ModalField
                  label="Location"
                  value={profileDraft.location}
                  onChangeText={(v) =>
                    setProfileDraft((p) => ({ ...p, location: v }))
                  }
                  icon="map-pin"
                />
              </FieldGroup>

              {profileError ? (
                <View style={styles.errorRow}>
                  <Feather
                    name="alert-circle"
                    size={13}
                    color={KFitColors.error}
                  />
                  <Text style={styles.errorText}>{profileError}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCancel,
                  pressed && styles.pressed,
                ]}
                onPress={closeProfileModal}
                disabled={isSavingProfile}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalSave,
                  isSavingProfile && styles.disabled,
                  pressed && !isSavingProfile && styles.pressed,
                ]}
                onPress={saveProfile}
                disabled={isSavingProfile}
                accessibilityRole="button"
                accessibilityLabel="Save profile changes"
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
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═════════════ Social modal ═════════════ */}
      <Modal
        visible={socialModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeSocialModal}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.flex}>
                <Text style={styles.modalTitle}>SOCIAL LINKS</Text>
                <Text style={styles.modalSubtitle}>
                  Leave blank to hide a platform.
                </Text>
              </View>
              <Pressable
                onPress={closeSocialModal}
                hitSlop={10}
                disabled={isSavingSocials}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Feather name="x" size={18} color={KFitColors.mutedText} />
              </Pressable>
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
                        <Pressable
                          onPress={() =>
                            setSocialDraft((p) => ({ ...p, [meta.key]: "" }))
                          }
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Clear ${meta.label}`}
                        >
                          <Feather
                            name="x-circle"
                            size={13}
                            color={KFitColors.mutedText}
                          />
                        </Pressable>
                      ) : null}
                    </View>
                    <TextInput
                      style={styles.modalInput}
                      value={socialDraft[meta.key]}
                      onChangeText={(v) =>
                        setSocialDraft((p) => ({ ...p, [meta.key]: v }))
                      }
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
                <View style={styles.errorRow}>
                  <Feather
                    name="alert-circle"
                    size={13}
                    color={KFitColors.error}
                  />
                  <Text style={styles.errorText}>{socialError}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCancel,
                  pressed && styles.pressed,
                ]}
                onPress={closeSocialModal}
                disabled={isSavingSocials}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalSave,
                  isSavingSocials && styles.disabled,
                  pressed && !isSavingSocials && styles.pressed,
                ]}
                onPress={saveSocials}
                disabled={isSavingSocials}
                accessibilityRole="button"
                accessibilityLabel="Save social links"
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
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═════════════ Avatar modal ═════════════ */}
      <Modal
        visible={avatarModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeAvatarModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.flex}>
                <Text style={styles.modalTitle}>PROFILE PICTURE</Text>
                <Text style={styles.modalSubtitle}>
                  Square photos look best (1:1).
                </Text>
              </View>
              <Pressable
                onPress={closeAvatarModal}
                hitSlop={10}
                disabled={isSavingAvatar}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Feather name="x" size={18} color={KFitColors.mutedText} />
              </Pressable>
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
              <Pressable
                style={({ pressed }) => [
                  styles.avatarActionBtn,
                  pressed && styles.pressed,
                ]}
                onPress={() => void pickFromLibrary()}
                accessibilityRole="button"
                accessibilityLabel="Pick from library"
              >
                <Feather name="image" size={16} color={KFitColors.accent} />
                <Text style={styles.avatarActionText}>Library</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.avatarActionBtn,
                  pressed && styles.pressed,
                ]}
                onPress={() => void takePhoto()}
                accessibilityRole="button"
                accessibilityLabel="Take a photo"
              >
                <Feather name="camera" size={16} color={KFitColors.accent} />
                <Text style={styles.avatarActionText}>Camera</Text>
              </Pressable>
            </View>

            {avatarError ? (
              <View style={styles.errorRow}>
                <Feather
                  name="alert-circle"
                  size={13}
                  color={KFitColors.error}
                />
                <Text style={styles.errorText}>{avatarError}</Text>
              </View>
            ) : null}

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCancel,
                  pressed && styles.pressed,
                ]}
                onPress={closeAvatarModal}
                disabled={isSavingAvatar}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalSave,
                  (isSavingAvatar || !avatarDraftUri) && styles.disabled,
                  pressed &&
                    !isSavingAvatar &&
                    avatarDraftUri &&
                    styles.pressed,
                ]}
                onPress={() => void saveAvatar()}
                disabled={isSavingAvatar || !avatarDraftUri}
                accessibilityRole="button"
                accessibilityLabel="Save photo"
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
              </Pressable>
            </View>

            {avatarUri ? (
              <Pressable
                style={({ pressed }) => [
                  styles.removeAvatarBtn,
                  pressed && styles.pressed,
                ]}
                onPress={() => void removeAvatar()}
                disabled={isSavingAvatar}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <Feather name="trash-2" size={14} color={KFitColors.error} />
                <Text style={styles.removeAvatarText}>Remove photo</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- Small inline stat ---------- */
function StatInline({
  icon,
  value,
  label,
}: {
  icon: FeatherName;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statInline}>
      <View style={styles.statInlineTop}>
        <Feather name={icon} size={13} color={KFitColors.accent} />
        <Text style={styles.statInlineValue}>{value}</Text>
      </View>
      <Text style={styles.statInlineLabel}>{label}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  main: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1, backgroundColor: KFitColors.background },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
  flex: { flex: 1, minWidth: 0 },

  date: {
    paddingHorizontal: 20,
    marginTop: 14,
    fontSize: 12,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },

  /* ───── Hero ───── */
  hero: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 20,
  },
  avatarWrap: {
    width: 116,
    height: 116,
    marginBottom: 14,
    position: "relative",
  },
  avatarRing: {
    flex: 1,
    borderRadius: 58,
    padding: 4,
    backgroundColor: KFitColors.accent + "26",
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
  },
  avatar: {
    flex: 1,
    width: undefined,
    height: undefined,
    borderRadius: 50,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { borderRadius: 50 },
  avatarInitials: { color: "#121212", fontSize: 36, fontWeight: "900" },
  avatarEditBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: KFitColors.accent,
    borderWidth: 3,
    borderColor: KFitColors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  fullName: {
    fontSize: 24,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    color: KFitColors.mutedText,
    marginTop: 2,
    marginBottom: 10,
    fontFamily: "monospace",
  },
  heroChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
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
  roleChipText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: KFitColors.accent,
    fontFamily: "monospace",
  },
  editButton: {
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
  editButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.accent,
  },

  /* ───── Stat strip ───── */
  statStrip: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  statInline: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    gap: 4,
  },
  statInlineTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statInlineValue: {
    fontSize: 18,
    fontWeight: "900",
    color: KFitColors.text,
    fontFamily: "monospace",
    letterSpacing: -0.3,
  },
  statInlineLabel: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  statDivider: {
    width: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 12,
  },

  /* ───── Completion card ───── */
  completionCard: {
    marginHorizontal: 20,
    marginBottom: 22,
    padding: 14,
    borderRadius: 16,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
    gap: 10,
  },
  completionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  completionLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: KFitColors.accent,
    marginBottom: 3,
    fontFamily: "monospace",
  },
  completionValue: {
    fontSize: 16,
    fontWeight: "800",
    color: KFitColors.text,
  },
  completionRing: {
    minWidth: 46,
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
  },
  completionRingText: {
    fontSize: 12,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
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

  /* ───── Sections ───── */
  section: { paddingHorizontal: 20, marginBottom: 20 },
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
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
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
    paddingVertical: 14,
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
  bioText: { fontSize: 14, color: KFitColors.text, lineHeight: 22 },

  /* ───── Info rows ───── */
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    gap: 12,
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  infoIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
  },
  infoLabel: { fontSize: 13, color: KFitColors.mutedText },
  infoValue: {
    fontSize: 13,
    color: KFitColors.text,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
    fontFamily: "monospace",
  },
  divider: { height: 1, backgroundColor: KFitColors.border },
  dividerInset: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginLeft: 60,
  },

  /* ───── Chips ───── */
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  chipCert: {
    backgroundColor: KFitColors.background,
    borderColor: KFitColors.border,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: KFitColors.text,
  },

  /* ───── Location row ───── */
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  },

  /* ───── Social rows ───── */
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
    fontFamily: "monospace",
  },

  /* ───── Footer ───── */
  footer: { paddingVertical: 24, alignItems: "center" },
  footerBrand: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: KFitColors.text,
  },
  footerVersion: {
    fontSize: 12,
    color: KFitColors.mutedText,
    marginTop: 4,
    fontFamily: "monospace",
  },

  /* ───── Modals ───── */
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
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.2,
    fontFamily: "monospace",
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
    fontFamily: "monospace",
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
  modalInputMultiline: { minHeight: 88, paddingTop: 10 },
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
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  errorText: {
    flexShrink: 1,
    fontSize: 13,
    color: KFitColors.error,
    lineHeight: 18,
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

  /* ───── Avatar modal ───── */
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
