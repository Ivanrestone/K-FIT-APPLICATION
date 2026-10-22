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

export default function MemberCheckinScreen() {
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

          {/* Member Info */}
          <View style={styles.memberInfo}>
            <Text style={styles.memberLabel}>A Member</Text>
            <Text style={styles.memberName}>Jordan Lee</Text>
          </View>

          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>Check in</Text>
            <Text style={styles.greetingSubtitle}>Scan your QR code at the kiosk to check in</Text>
          </View>

          {/* QR Code Card */}
          <View style={styles.qrCard}>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>QR CODE</Text>
              <Text style={styles.qrPlaceholderSubtext}>TOTP Dynamic QR</Text>
            </View>
            <View style={styles.qrInfo}>
              <Text style={styles.qrLabel}>Member ID</Text>
              <Text style={styles.qrValue}>PM-1042</Text>
            </View>
            <View style={styles.qrDivider} />
            <View style={styles.qrInfo}>
              <Text style={styles.qrLabel}>Refreshes in</Text>
              <Text style={styles.qrValue}>15 seconds</Text>
            </View>
          </View>

          {/* Current Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Status</Text>
            <View style={styles.statusCard}>
              <View style={[styles.statusBadge, styles.statusBadgeCheckedIn]}>
                <Text style={styles.statusBadgeText}>Checked In</Text>
              </View>
              <Text style={styles.checkinTime}>Checked in at 07:04 AM</Text>
              <Text style={styles.checkinDate}>October 20, 2026</Text>
            </View>
          </View>

          {/* Today's Session */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Session</Text>
            <View style={styles.sessionCard}>
              <Text style={styles.sessionActivity}>Open gym</Text>
              <Text style={styles.sessionDuration}>Duration: 1h 24m</Text>
              <TouchableOpacity style={styles.checkoutButton}>
                <Text style={styles.checkoutButtonText}>Check Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Check-ins */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Check-ins</Text>
            <View style={styles.checkinList}>
              <View style={styles.checkinItem}>
                <View style={styles.checkinItemHeader}>
                  <Text style={styles.checkinItemDate}>Oct 20</Text>
                  <Text style={styles.checkinItemTime}>07:04 AM</Text>
                </View>
                <View style={styles.checkinItemDivider} />
                <View style={styles.checkinItemBody}>
                  <Text style={styles.checkinItemLabel}>Activity</Text>
                  <Text style={styles.checkinItemValue}>Open gym</Text>
                  <Text style={styles.checkinItemLabel}>Duration</Text>
                  <Text style={styles.checkinItemValue}>1h 24m</Text>
                </View>
              </View>
              <View style={styles.checkinItem}>
                <View style={styles.checkinItemHeader}>
                  <Text style={styles.checkinItemDate}>Oct 19</Text>
                  <Text style={styles.checkinItemTime}>06:00 PM</Text>
                </View>
                <View style={styles.checkinItemDivider} />
                <View style={styles.checkinItemBody}>
                  <Text style={styles.checkinItemLabel}>Activity</Text>
                  <Text style={styles.checkinItemValue}>Strength training</Text>
                  <Text style={styles.checkinItemLabel}>Duration</Text>
                  <Text style={styles.checkinItemValue}>55 min</Text>
                </View>
              </View>
              <View style={styles.checkinItem}>
                <View style={styles.checkinItemHeader}>
                  <Text style={styles.checkinItemDate}>Oct 17</Text>
                  <Text style={styles.checkinItemTime}>08:12 AM</Text>
                </View>
                <View style={styles.checkinItemDivider} />
                <View style={styles.checkinItemBody}>
                  <Text style={styles.checkinItemLabel}>Activity</Text>
                  <Text style={styles.checkinItemValue}>Strength training</Text>
                  <Text style={styles.checkinItemLabel}>Duration</Text>
                  <Text style={styles.checkinItemValue}>60 min</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Monthly Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Month</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>18</Text>
                <Text style={styles.statLabel}>Visits</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>14h 32m</Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>14</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerName}>Jordan Lee</Text>
            <Text style={styles.footerLabel}>FORM ATHLETICS MEMBER WORKSPACE</Text>
          </View>
        </ScrollView>
        <MemberBottomNav activeRoute="/member-checkin" />
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
  memberInfo: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  memberLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  memberName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  greetingSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  greetingSubtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  qrCard: {
    marginHorizontal: 20,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  qrPlaceholder: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  qrPlaceholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  qrPlaceholderSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  qrInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  qrLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  qrValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  qrDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginBottom: 12,
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
  statusCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  statusBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusBadgeCheckedIn: {
    backgroundColor: '#10B981',
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkinTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  checkinDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  sessionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  sessionActivity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  sessionDuration: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  checkoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  checkinList: {
    gap: 12,
  },
  checkinItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  checkinItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  checkinItemDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  checkinItemTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  checkinItemDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  checkinItemBody: {
    gap: 8,
  },
  checkinItemLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  checkinItemValue: {
    fontSize: 14,
    color: '#111827',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  footerLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
