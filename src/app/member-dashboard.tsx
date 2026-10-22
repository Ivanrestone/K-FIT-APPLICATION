import MemberBottomNav from '@/components/MemberBottomNav';
import SubscriptionPaywall from '@/components/SubscriptionPaywall';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MemberDashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.content}
        >
          <SubscriptionPaywall requireAppAccess>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brand}>FORM</Text>
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text style={styles.logout}>Logout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.subHeader}>
            <Text style={styles.brandSubtitle}>FORM/Brooklyn</Text>
            <Text style={styles.brandClub}>Performance club</Text>
            <Text style={styles.date}>Tuesday, October 20, 2026</Text>
          </View>

          {/* Member Info */}
          <View style={styles.memberInfo}>
            <Text style={styles.memberLabel}>Member</Text>
            <Text style={styles.memberName}>Jordan Lee</Text>
          </View>

          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>Progress, not perfection.</Text>
            <Text style={styles.greetingSubtitle}>Your effort adds up. See how far you&apos;ve come, Jordan</Text>
            <TouchableOpacity style={styles.logButton}>
              <Text style={styles.logButtonText}>+ Log measurements</Text>
            </TouchableOpacity>
          </View>

          {/* Overview Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.cardsGrid}>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>Progress & goals</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>Personal profile</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>Attendance history</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>My workouts</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress & profile</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Current weight</Text>
                <View style={styles.statValueGroup}>
                  <Text style={styles.statValue}>75.8 kg</Text>
                  <Text style={styles.statChange}>4.2 kg from 80 kg</Text>
                </View>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Body fat</Text>
                <View style={styles.statValueGroup}>
                  <Text style={styles.statValue}>19.2%</Text>
                  <Text style={styles.statChange}>+ 20% since September</Text>
                </View>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Squat personal best</Text>
                <View style={styles.statValueGroup}>
                  <Text style={styles.statValue}>70 kg</Text>
                  <Text style={styles.statChange}>+10 kg from your first</Text>
                </View>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Training consistency</Text>
                <View style={styles.statValueGroup}>
                  <Text style={styles.statValue}>92%</Text>
                  <Text style={styles.statChange}>54 workouts completed in October</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Strength Progression */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strength progression</Text>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>70 kg</Text>
              <View style={styles.chartBars}>
                <View style={styles.chartBar}>
                  <View style={[styles.barFill, { height: 40 }]} />
                  <Text style={styles.barLabel}>Aug</Text>
                </View>
                <View style={styles.chartBar}>
                  <View style={[styles.barFill, { height: 55 }]} />
                  <Text style={styles.barLabel}>Aug 24</Text>
                </View>
                <View style={styles.chartBar}>
                  <View style={[styles.barFill, { height: 70 }]} />
                  <Text style={styles.barLabel}>Sep</Text>
                </View>
                <View style={styles.chartBar}>
                  <View style={[styles.barFill, { height: 85 }]} />
                  <Text style={styles.barLabel}>Last 12</Text>
                </View>
              </View>
              <Text style={styles.chartNote}>Barbell squat +10 kg</Text>
            </View>
          </View>

          {/* Body Weight Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Body weight</Text>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>75.8 kg</Text>
              <View style={styles.weightChart}>
                <View style={styles.weightPoint}>
                  <View style={styles.weightDot} />
                  <Text style={styles.weightLabel}>73</Text>
                </View>
                <View style={[styles.weightPoint, { top: '60%' }]}>
                  <View style={styles.weightDot} />
                  <Text style={styles.weightLabel}>75.8</Text>
                </View>
              </View>
              <Text style={styles.chartNote}>Sep 01 - Oct 20</Text>
              <Text style={styles.chartNote}>+4.2 kg / 7 w</Text>
            </View>
          </View>

          {/* Goals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goals worth showing up for.</Text>
            <View style={styles.goalsContainer}>
              <View style={styles.goalCard}>
                <Text style={styles.goalTitle}>Reach target weight</Text>
                <Text style={styles.goalValue}>75.8 → 74 kg</Text>
                <View style={styles.goalProgress}>
                  <View style={[styles.goalFill, { width: '80%' }]} />
                </View>
              </View>
              <View style={styles.goalCard}>
                <Text style={styles.goalTitle}>Monthly attendance</Text>
                <Text style={styles.goalValue}>18/20 visits</Text>
                <View style={styles.goalProgress}>
                  <View style={[styles.goalFill, { width: '90%' }]} />
                </View>
              </View>
              <View style={styles.goalCard}>
                <Text style={styles.goalTitle}>Build upper body strength</Text>
                <Text style={styles.goalValue}>70/80 kg</Text>
                <Text style={styles.goalTarget}>Target date: Dec 2028</Text>
                <TouchableOpacity style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit goals</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Personal Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal details</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>jordan.lee@email.com</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>Jordan Lee</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Member ID</Text>
                <Text style={styles.detailValue}>PM-1042</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Joined</Text>
                <Text style={styles.detailValue}>Sep 11, 2016</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>+1 (917) 555-0142</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date of birth</Text>
                <Text style={styles.detailValue}>June 12, 1996</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Height</Text>
                <Text style={styles.detailValue}>178 cm</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Emergency contact</Text>
                <Text style={styles.detailValue}>Casey Lee (917) 555-0173</Text>
              </View>
            </View>
          </View>

          {/* Recent Attendance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent attendance</Text>
            <View style={styles.attendanceContainer}>
              <View style={styles.attendanceCard}>
                <View style={styles.attendanceHeader}>
                  <Text style={styles.attendanceDate}>Oct 20</Text>
                  <Text style={styles.attendanceTime}>07:04 AM</Text>
                </View>
                <View style={styles.attendanceDivider} />
                <View style={styles.attendanceBody}>
                  <Text style={styles.attendanceLabel}>ACTIVITY</Text>
                  <Text style={styles.attendanceActivity}>Open gym</Text>
                  <Text style={styles.attendanceLabel}>WORKOUT COMPLETED</Text>
                  <Text style={styles.attendanceWorkout}>Mobility & cardio</Text>
                  <Text style={styles.attendanceDuration}>DURATION</Text>
                  <Text style={styles.attendanceDurationValue}>64 min</Text>
                </View>
              </View>
              <View style={styles.attendanceCard}>
                <View style={styles.attendanceHeader}>
                  <Text style={styles.attendanceDate}>Oct 19</Text>
                  <Text style={styles.attendanceTime}>06:00 PM</Text>
                </View>
                <View style={styles.attendanceDivider} />
                <View style={styles.attendanceBody}>
                  <Text style={styles.attendanceLabel}>ACTIVITY</Text>
                  <Text style={styles.attendanceActivity}>Strength training</Text>
                  <Text style={styles.attendanceLabel}>WORKOUT COMPLETED</Text>
                  <Text style={styles.attendanceWorkout}>Upper body A</Text>
                  <Text style={styles.attendanceDuration}>DURATION</Text>
                  <Text style={styles.attendanceDurationValue}>55 min</Text>
                </View>
              </View>
              <View style={styles.attendanceCard}>
                <View style={styles.attendanceHeader}>
                  <Text style={styles.attendanceDate}>Oct 17</Text>
                  <Text style={styles.attendanceTime}>08:12 AM</Text>
                </View>
                <View style={styles.attendanceDivider} />
                <View style={styles.attendanceBody}>
                  <Text style={styles.attendanceLabel}>ACTIVITY</Text>
                  <Text style={styles.attendanceActivity}>Strength training</Text>
                  <Text style={styles.attendanceLabel}>WORKOUT COMPLETED</Text>
                  <Text style={styles.attendanceWorkout}>Full body</Text>
                  <Text style={styles.attendanceDuration}>DURATION</Text>
                  <Text style={styles.attendanceDurationValue}>60 min</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerName}>Jordan Lee</Text>
            <Text style={styles.footerLabel}>Member</Text>
            <Text style={styles.footerId}>PM-1042</Text>
            <Text style={styles.footerJoined}>Joined Sep 11, 2016</Text>
            <Text style={styles.footerBrand}>FORM ATHLETICS MEMBER WORKSPACE</Text>
          </View>
          </SubscriptionPaywall>
        </ScrollView>
        <MemberBottomNav activeRoute="/member-dashboard" />
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
    fontSize: 32,
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
  logButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  statsContainer: {
    gap: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statValueGroup: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statChange: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  chartCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  chartTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 120,
    marginBottom: 12,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
  },
  barFill: {
    width: 24,
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  chartNote: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  weightChart: {
    height: 100,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weightPoint: {
    alignItems: 'center',
  },
  weightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginBottom: 4,
  },
  weightLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  goalsContainer: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  goalTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  goalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  goalProgress: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  goalFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },
  goalTarget: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
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
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
  },
  attendanceContainer: {
    gap: 12,
  },
  attendanceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  attendanceDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  attendanceTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  attendanceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  attendanceBody: {
    gap: 8,
  },
  attendanceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  attendanceActivity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  attendanceWorkout: {
    fontSize: 14,
    color: '#111827',
  },
  attendanceDuration: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  attendanceDurationValue: {
    fontSize: 14,
    color: '#111827',
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
    fontSize: 14,
    color: '#6B7280',
  },
  footerId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footerJoined: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footerBrand: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
});
