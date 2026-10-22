import MemberBottomNav from '@/components/MemberBottomNav';
import MemberPaymentOptions from '@/components/MemberPaymentOptions';
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

          <View style={styles.section}>
            <MemberPaymentOptions />
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
