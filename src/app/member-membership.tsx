import MemberBottomNav from '@/components/MemberBottomNav';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MemberMembershipScreen() {
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
            <Text style={styles.greeting}>Your club, your membership.</Text>
            <Text style={styles.greetingSubtitle}>Everything you need to manage your plan and payments.</Text>
            <TouchableOpacity style={styles.helpButton}>
              <Text style={styles.helpButtonText}>Get help</Text>
            </TouchableOpacity>
          </View>

          {/* Overview */}
          <View style={styles.overviewSection}>
            <Text style={styles.overviewNumber}>98</Text>
            <Text style={styles.overviewLabel}>Overview</Text>
          </View>

          {/* Overview Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Membership & payments</Text>
            <View style={styles.cardsGrid}>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>Plan options</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>Billing details</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>My workouts</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>Progress & profile</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Current Membership */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>YOUR CURRENT MEMBERSHIP</Text>
            <View style={styles.membershipCard}>
              <View style={styles.membershipHeader}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
                <Text style={styles.membershipPlan}>Performance</Text>
                <Text style={styles.membershipPrice}>$89/month</Text>
              </View>
              <Text style={styles.membershipDescription}>
                Unlimited open gym, unlimited group classes and a personalized workout program. Everything you need to keep moving
              </Text>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment method</Text>
            <View style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <View style={styles.paymentBadge}>
                  <Text style={styles.paymentBadgeText}>Default</Text>
                </View>
                <Text style={styles.cardType}>VISA</Text>
              </View>
              <View style={styles.paymentDetails}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Visa ending in 4242</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Cardholder</Text>
                  <Text style={styles.paymentValue}>Jordan Lee</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Expires</Text>
                  <Text style={styles.paymentValue}>08/2028</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.updateButton}>
                <Text style={styles.updateButtonText}>Update payment method</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Next Payment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NEXT PAYMENT</Text>
            <View style={styles.paymentInfoCard}>
              <Text style={styles.paymentDate}>November 01, 2026</Text>
              <Text style={styles.paymentAmount}>-$89.00</Text>
            </View>
          </View>

          {/* Member Since */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MEMBER SINCE</Text>
            <Text style={styles.memberSince}>September 01, 2026</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Explore plan options</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.pauseButton]}>
                <Text style={styles.actionButtonText}>Pause membership</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Billing Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billing details</Text>
            <View style={styles.billingCard}>
              <View style={styles.billingRow}>
                <Text style={styles.billingLabel}>Invoices sent to</Text>
                <Text style={styles.billingValue}>jordan.lee@email.com</Text>
              </View>
              <View style={styles.billingRow}>
                <Text style={styles.billingLabel}>Address</Text>
                <Text style={styles.billingValue}>
                  214 Kent Avenue, Apt 48{'\n'}Brooklyn, NY 11249, United States
                </Text>
              </View>
              <TouchableOpacity style={styles.downloadButton}>
                <Text style={styles.downloadButtonText}>Download all</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Payment History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment history</Text>
            <View style={styles.historyContainer}>
              <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyInvoice}>INV-261042</Text>
                  <Text style={styles.historyDate}>Oct 01, 2026</Text>
                </View>
                <View style={styles.historyDivider} />
                <View style={styles.historyBody}>
                  <Text style={styles.historyLabel}>DESCRIPTION</Text>
                  <Text style={styles.historyDescription}>Performance October</Text>
                  <Text style={styles.historyLabel}>AMOUNT</Text>
                  <Text style={styles.historyAmount}>$89.00</Text>
                  <Text style={styles.historyLabel}>STATUS</Text>
                  <Text style={styles.historyStatusPaid}>Paid</Text>
                </View>
                <TouchableOpacity style={styles.receiptButton}>
                  <Text style={styles.receiptButtonText}>RECEIPT</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyInvoice}>INV-260942</Text>
                  <Text style={styles.historyDate}>Sep 01, 2026</Text>
                </View>
                <View style={styles.historyDivider} />
                <View style={styles.historyBody}>
                  <Text style={styles.historyLabel}>DESCRIPTION</Text>
                  <Text style={styles.historyDescription}>Performance September</Text>
                  <Text style={styles.historyLabel}>AMOUNT</Text>
                  <Text style={styles.historyAmount}>$89.00</Text>
                  <Text style={styles.historyLabel}>STATUS</Text>
                  <Text style={styles.historyStatusPaid}>Paid</Text>
                </View>
                <TouchableOpacity style={styles.receiptButton}>
                  <Text style={styles.receiptButtonText}>RECEIPT</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.historySummary}>All 2 payments • No outstanding balance</Text>
          </View>

          {/* Cancel Notice */}
          <View style={styles.cancelNotice}>
            <Text style={styles.cancelText}>
              Need to cancel? Contact your club at least 7 days before your next renewal. Your access continues until the end of the paid period.
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerInitials}>JL</Text>
            <Text style={styles.footerName}>Jordan Lee</Text>
            <Text style={styles.footerLabel}>Member</Text>
            <Text style={styles.footerBrand}>FORM ATHLETICS/MEMBER WORKSPACE</Text>
          </View>
        </ScrollView>
        <MemberBottomNav activeRoute="/member-membership" />
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
    marginBottom: 16,
  },
  helpButton: {
    alignSelf: 'flex-start',
  },
  helpButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  overviewSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  overviewNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
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
  cardsGrid: {
    gap: 12,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  cardArrow: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  membershipCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  membershipPlan: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 8,
  },
  membershipPrice: {
    fontSize: 16,
    color: '#6B7280',
  },
  membershipDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  paymentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  paymentBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  paymentDetails: {
    marginBottom: 16,
  },
  paymentRow: {
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  paymentValue: {
    fontSize: 14,
    color: '#111827',
  },
  updateButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentInfoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  paymentDate: {
    fontSize: 16,
    color: '#111827',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  memberSince: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  actionButtons: {
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  billingCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  billingRow: {
    marginBottom: 16,
  },
  billingLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  billingValue: {
    fontSize: 14,
    color: '#111827',
  },
  downloadButton: {
    alignSelf: 'flex-start',
  },
  downloadButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  historyContainer: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyInvoice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  historyDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  historyBody: {
    gap: 8,
  },
  historyLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  historyDescription: {
    fontSize: 14,
    color: '#111827',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  historyStatusPaid: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  receiptButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  receiptButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  historySummary: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  cancelNotice: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  cancelText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerInitials: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  footerInitialsText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  footerLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerBrand: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
});
