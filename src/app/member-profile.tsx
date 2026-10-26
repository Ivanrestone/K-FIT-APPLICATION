import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import MemberBottomNav from '@/components/MemberBottomNav';
import { KFitColors, Spacing } from '@/constants/theme';
import { useLogout } from '@/hooks/use-logout';
import { useMemberProfile } from '@/hooks/use-member-profile';
import { useState } from 'react';

export default function MemberProfileScreen() {
  return process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? <ConfiguredMemberProfileScreen />
    : <ProfileStatusScreen message="Clerk sign in is not configured." />;
}

function ProfileStatusScreen({
  message,
  onRetry,
  isLoading = false,
  actionLabel = 'Retry',
}: {
  message: string;
  onRetry?: () => void;
  isLoading?: boolean;
  actionLabel?: string;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <View style={styles.statusContent}>
          {isLoading ? <ActivityIndicator color={KFitColors.accent} /> : null}
          <Text style={styles.sectionTitle}>
            {isLoading ? 'Loading your profile' : 'Profile unavailable'}
          </Text>
          <Text style={styles.statusMessage}>{message}</Text>
          {onRetry ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={onRetry}
              accessibilityRole="button"
            >
              <Text style={styles.editButtonText}>{actionLabel}</Text>
            </TouchableOpacity>
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
  const [emailDraft, setEmailDraft] = useState('');
  const [firstNameDraft, setFirstNameDraft] = useState('');
  const [lastNameDraft, setLastNameDraft] = useState('');

  if (isLoading) {
    return (
      <ProfileStatusScreen
        message="Loading your profile…"
        isLoading
      />
    );
  }
  if (error) {
    return <ProfileStatusScreen message={error} onRetry={() => void load()} />;
  }
  const effectiveProfile = profile ?? (!isSignedIn ? {
    id: 'demo_member',
    role: 'member' as const,
    email: 'member@gmail.com',
    firstName: 'Demo',
    lastName: 'Member',
  } : null);

  if (!effectiveProfile) {
    return (
      <ProfileStatusScreen
        message={isSignedIn
          ? 'Your account profile is not available. Retry or contact your gym administrator.'
          : 'Sign in to view your member profile.'}
        onRetry={isSignedIn ? () => void load() : () => router.replace('/')}
        actionLabel={isSignedIn ? 'Retry' : 'Sign in'}
      />
    );
  }

  const fullName = [effectiveProfile.firstName, effectiveProfile.lastName]
    .filter((name): name is string => Boolean(name?.trim()))
    .join(' ');
  const initials = [effectiveProfile.firstName, effectiveProfile.lastName]
    .filter((name): name is string => Boolean(name?.trim()))
    .map((name) => name.trim().charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || 'KF';
  const hasMissingProfileFields = !effectiveProfile.email?.trim() ||
    !effectiveProfile.firstName?.trim() ||
    !effectiveProfile.lastName?.trim();

  const beginEdit = () => {
    setEmailDraft(effectiveProfile.email ?? '');
    setFirstNameDraft(effectiveProfile.firstName ?? '');
    setLastNameDraft(effectiveProfile.lastName ?? '');
    setActionError(null);
    setIsEditing(true);
  };

  const saveProfile = async () => {
    if (
      !emailDraft.trim() &&
      !firstNameDraft.trim() &&
      !lastNameDraft.trim()
    ) {
      setActionError('Enter at least one missing profile detail.');
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
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Could not save your profile.',
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
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Could not submit your request.',
      );
    } finally {
      setIsRequestingCoach(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brand}>FORM ATHLETICS</Text>
            <TouchableOpacity disabled={isSigningOut} onPress={logout}>
              <Text style={styles.logout}>
                {isSigningOut ? 'Signing out…' : 'Logout'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.subHeader}>
            <Text style={styles.brandSubtitle}>FORM / Brooklyn</Text>
            <Text style={styles.brandClub}>Performance club</Text>
            <Text style={styles.date}>Tuesday, October 20, 2026</Text>
          </View>

          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <ImageBackground
              source={require('../../assets/images/gold-texture.jpg')}
              resizeMode="cover"
              style={styles.avatar}
              imageStyle={styles.avatarImage}
            >
              <Text style={styles.avatarInitials}>{initials}</Text>
            </ImageBackground>
            <Text style={styles.profileName}>
              {fullName || 'Name not provided'}
            </Text>
            <Text style={styles.profileLabel}>
              {effectiveProfile.role.charAt(0).toUpperCase() + effectiveProfile.role.slice(1)}
            </Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>First Name</Text>
                {isEditing && !effectiveProfile.firstName?.trim() ? (
                  <TextInput
                    style={styles.profileInput}
                    value={firstNameDraft}
                    onChangeText={setFirstNameDraft}
                    placeholder="Enter your first name"
                    accessibilityLabel="First name"
                  />
                ) : (
                  <Text style={styles.infoValue}>
                    {effectiveProfile.firstName?.trim() || 'Not provided'}
                  </Text>
                )}
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Name</Text>
                {isEditing && !effectiveProfile.lastName?.trim() ? (
                  <TextInput
                    style={styles.profileInput}
                    value={lastNameDraft}
                    onChangeText={setLastNameDraft}
                    placeholder="Enter your last name"
                    accessibilityLabel="Last name"
                  />
                ) : (
                  <Text style={styles.infoValue}>
                    {effectiveProfile.lastName?.trim() || 'Not provided'}
                  </Text>
                )}
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                {isEditing && !effectiveProfile.email?.trim() ? (
                  <TextInput
                    style={styles.profileInput}
                    value={emailDraft}
                    onChangeText={setEmailDraft}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Email address"
                  />
                ) : (
                  <Text style={styles.infoValue}>
                    {effectiveProfile.email?.trim() || 'Not provided'}
                  </Text>
                )}
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>+1 (917) 555-0142</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={styles.infoValue}>June 12, 1996</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>178 cm</Text>
              </View>
            </View>
            {hasMissingProfileFields ? (
              <View style={styles.profileActions}>
                {isEditing ? (
                  <TouchableOpacity
                    style={[styles.saveButtonWrapper, isSaving && styles.disabledButton]}
                    onPress={saveProfile}
                    disabled={isSaving}
                    accessibilityRole="button"
                  >
                    <ImageBackground
                      source={require('../../assets/images/gold-texture.jpg')}
                      resizeMode="cover"
                      style={styles.saveButtonBg}
                      imageStyle={styles.saveButtonImage}
                    >
                      <Text style={styles.saveButtonText}>
                        {isSaving ? 'Saving…' : 'Save profile'}
                      </Text>
                    </ImageBackground>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={beginEdit}
                    accessibilityRole="button"
                  >
                    <Text style={styles.editButtonText}>
                      Edit missing details
                    </Text>
                  </TouchableOpacity>
                )}
                {isEditing ? (
                  <TouchableOpacity
                    style={styles.cancelEditButton}
                    onPress={() => {
                      setActionError(null);
                      setIsEditing(false);
                    }}
                    disabled={isSaving}
                    accessibilityRole="button"
                  >
                    <Text style={styles.cancelEditButtonText}>Cancel</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
            {actionError ? (
              <Text style={styles.statusMessage} accessibilityRole="alert">
                {actionError}
              </Text>
            ) : null}
          </View>

          {effectiveProfile.role === 'member' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Coach status</Text>
              <View style={styles.infoCard}>
                <Text style={styles.statusMessage}>
                  {coachRequest?.status === 'pending'
                    ? 'Your request to become a Coach is pending review.'
                    : coachRequest?.status === 'approved'
                    ? 'Your request to become a Coach was approved.'
                    : coachRequest?.status === 'rejected'
                    ? 'Your previous Coach request was declined.'
                    : 'Request Coach status to let the gym review your account.'}
                </Text>
                {coachRequest?.status !== 'pending' &&
                coachRequest?.status !== 'approved' ? (
                  <TouchableOpacity
                    style={[styles.requestButton, isRequestingCoach && styles.disabledButton]}
                    onPress={requestCoachStatus}
                    disabled={isRequestingCoach}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isRequestingCoach }}
                  >
                    <ImageBackground
                      source={require('../../assets/images/gold-texture.jpg')}
                      resizeMode="cover"
                      style={styles.requestButtonBg}
                      imageStyle={styles.requestButtonImage}
                    >
                      <Text style={styles.requestButtonText}>
                        {isRequestingCoach
                          ? 'Submitting…'
                          : 'Request to become a Coach'}
                      </Text>
                    </ImageBackground>
                  </TouchableOpacity>
                ) : null}
              </View>
              {actionError && !isEditing ? (
                <Text style={styles.statusMessage} accessibilityRole="alert">
                  {actionError}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>Casey Lee</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>(917) 555-0173</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Relationship</Text>
                <Text style={styles.infoValue}>Spouse</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Emergency Contact</Text>
            </TouchableOpacity>
          </View>

          {/* Membership Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Membership Details</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Plan</Text>
                <Text style={styles.infoValue}>Performance</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>September 11, 2016</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Renewal Date</Text>
                <Text style={styles.infoValue}>November 01, 2026</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sessions Used</Text>
                <Text style={styles.infoValue}>18/20</Text>
              </View>
            </View>
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.infoCard}>
              <Text style={styles.addressText}>
                214 Kent Avenue, Apt 48{'\n'}Brooklyn, NY 11249{'\n'}United States
              </Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Address</Text>
            </TouchableOpacity>
          </View>

          {/* Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.preferencesCard}>
              <TouchableOpacity style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Notifications</Text>
                <Text style={styles.preferenceArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.preferenceDivider} />
              <TouchableOpacity style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Privacy Settings</Text>
                <Text style={styles.preferenceArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.preferenceDivider} />
              <TouchableOpacity style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Language</Text>
                <Text style={styles.preferenceValue}>English</Text>
                <Text style={styles.preferenceArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>📋</Text>
                <Text style={styles.actionLabel}>My workouts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionLabel}>Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>💳</Text>
                <Text style={styles.actionLabel}>Billing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>📅</Text>
                <Text style={styles.actionLabel}>Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.supportCard}>
              <TouchableOpacity style={styles.supportItem}>
                <Text style={styles.supportLabel}>Help Center</Text>
                <Text style={styles.supportArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.supportDivider} />
              <TouchableOpacity style={styles.supportItem}>
                <Text style={styles.supportLabel}>Contact Support</Text>
                <Text style={styles.supportArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.supportDivider} />
              <TouchableOpacity style={styles.supportItem}>
                <Text style={styles.supportLabel}>Terms of Service</Text>
                <Text style={styles.supportArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.supportDivider} />
              <TouchableOpacity style={styles.supportItem}>
                <Text style={styles.supportLabel}>Privacy Policy</Text>
                <Text style={styles.supportArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  statusContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  statusMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  brand: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  logout: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  brandClub: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: KFitColors.accentDark,
    elevation: 4,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  avatarImage: {
    borderRadius: 40,
  },
  avatarInitials: {
    color: '#121212',
    fontSize: 28,
    fontWeight: '900',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileLabel: {
    fontSize: 14,
    color: KFitColors.accentDark,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
  },
  profileInput: {
    flex: 1,
    minWidth: 120,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.accent,
    paddingVertical: Spacing.one,
    color: '#111827',
    fontSize: 14,
    textAlign: 'right',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  editButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    fontSize: 14,
    color: KFitColors.accentDark,
    fontWeight: '700',
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: 8,
  },
  saveButtonWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  saveButtonBg: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonImage: {
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#121212',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelEditButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cancelEditButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  requestButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  requestButtonBg: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestButtonImage: {
    borderRadius: 10,
  },
  requestButtonText: {
    color: '#121212',
    fontSize: 14,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.5,
  },
  addressText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  preferencesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#111827',
  },
  preferenceValue: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  preferenceArrow: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  preferenceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  supportCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  supportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  supportLabel: {
    fontSize: 14,
    color: '#111827',
  },
  supportArrow: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  supportDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerBrand: {
    fontSize: 14,
    color: '#111827',
    fontWeight: 'bold',
  },
  footerVersion: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
