import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MemberBottomNav from '@/components/MemberBottomNav';

export default function MemberProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brand}>FORM ATHLETICS</Text>
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text style={styles.logout}>Logout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.subHeader}>
            <Text style={styles.brandSubtitle}>FORM / Brooklyn</Text>
            <Text style={styles.brandClub}>Performance club</Text>
            <Text style={styles.date}>Tuesday, October 20, 2026</Text>
          </View>

          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>JL</Text>
            </View>
            <Text style={styles.profileName}>Jordan Lee</Text>
            <Text style={styles.profileLabel}>Member</Text>
            <Text style={styles.profileId}>PM-1042</Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>Jordan Lee</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>jordan.lee@email.com</Text>
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
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

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
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 13,
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
    color: '#4F46E5',
    fontWeight: '600',
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
