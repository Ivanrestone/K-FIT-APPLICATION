import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function MemberDashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>FORM</Text>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={styles.logout}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Find your form, Jordan.</Text>
          <Text style={styles.greetingSubtitle}>Build your foundation. Level body strength.</Text>
        </View>

        {/* Member Pass */}
        <View style={styles.memberPassCard}>
          <View style={styles.passHeader}>
            <Text style={styles.passTitle}>My member pass</Text>
            <Text style={styles.passSubtitle}>Performance</Text>
          </View>
          <View style={styles.passBody}>
            <Text style={styles.passDate}>Nov 01, 2028</Text>
            <View style={styles.passDivider} />
            <Text style={styles.passId}>ID: 001234</Text>
          </View>
        </View>

        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>My workouts</Text>
              <Text style={styles.statNumber}>18</Text>
              <Text style={styles.statSubtitle}>This month</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>My streak</Text>
              <Text style={styles.statNumber}>14</Text>
              <Text style={styles.statSubtitle}>Days</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Weight</Text>
              <Text style={styles.statNumber}>75.8 kg</Text>
              <Text style={styles.statSubtitle}>Goal: 70 kg</Text>
            </View>
          </View>
        </View>

        {/* Progress & Profile */}
        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Progress & profile</Text>
            <Text style={styles.actionSubtitle}>View workout</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Your Membership */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your membership</Text>
          <View style={styles.membershipCard}>
            <View style={styles.membershipHeader}>
              <Text style={styles.membershipPlan}>Performance</Text>
              <Text style={styles.membershipDate}>Nov 01, 2028</Text>
            </View>
            <View style={styles.membershipStats}>
              <View style={styles.membershipStat}>
                <Text style={styles.membershipStatNumber}>18/20</Text>
                <Text style={styles.membershipStatLabel}>Sessions</Text>
              </View>
              <View style={styles.membershipDivider} />
              <View style={styles.membershipStat}>
                <Text style={styles.membershipStatNumber}>14</Text>
                <Text style={styles.membershipStatLabel}>Streak</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.manageButton}>
              <Text style={styles.manageButtonText}>Manage membership</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Training Week */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your training week</Text>
          <View style={styles.trainingWeek}>
            <View style={styles.trainingDay}>
              <Text style={styles.trainingDayLabel}>Upper body</Text>
              <Text style={styles.trainingDayStatus}>Completed</Text>
            </View>
            <View style={styles.trainingDay}>
              <Text style={styles.trainingDayLabel}>Lower body</Text>
              <Text style={styles.trainingDayStatus}>Completed</Text>
            </View>
            <View style={styles.trainingDay}>
              <Text style={styles.trainingDayLabel}>Recovery</Text>
              <Text style={styles.trainingDayStatus}>Today</Text>
            </View>
            <View style={styles.trainingDay}>
              <Text style={styles.trainingDayLabel}>Upper body</Text>
              <Text style={styles.trainingDayStatus}>Upcoming</Text>
            </View>
            <View style={styles.trainingDay}>
              <Text style={styles.trainingDayLabel}>Lower body</Text>
              <Text style={styles.trainingDayStatus}>Upcoming</Text>
            </View>
          </View>
        </View>

        {/* Strength Progress */}
        <View style={styles.strengthCard}>
          <Text style={styles.strengthTitle}>Your strength is showing.</Text>
          <View style={styles.strengthBar}>
            <View style={[styles.strengthFill, { width: '85%' }]} />
          </View>
          <Text style={styles.strengthValue}>70 kg</Text>
        </View>

        {/* Your Coach & Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your coach & sessions</Text>
          <View style={styles.coachCard}>
            <View style={styles.coachInfo}>
              <View style={styles.coachAvatar}>
                <Text style={styles.coachInitials}>MR</Text>
              </View>
              <View style={styles.coachDetails}>
                <Text style={styles.coachName}>Martas Reed</Text>
                <Text style={styles.coachSpecialization}>Personal Trainer</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bookButton}>
              <Text style={styles.bookButtonText}>Book session</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>FORM ATHLETICS</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
  memberPassCard: {
    marginHorizontal: 20,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  passSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  passBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passDate: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  passDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#374151',
    marginHorizontal: 16,
  },
  passId: {
    fontSize: 14,
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  actionCard: {
    marginHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  arrow: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  membershipPlan: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  membershipDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  membershipStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  membershipStat: {
    flex: 1,
  },
  membershipStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  membershipStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  membershipDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  manageButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  trainingWeek: {
    gap: 8,
  },
  trainingDay: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trainingDayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  trainingDayStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  strengthCard: {
    marginHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  strengthTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  strengthBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  strengthFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  strengthValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  coachCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  coachInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coachAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coachInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  coachDetails: {
    flex: 1,
  },
  coachName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  coachSpecialization: {
    fontSize: 13,
    color: '#6B7280',
  },
  bookButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
