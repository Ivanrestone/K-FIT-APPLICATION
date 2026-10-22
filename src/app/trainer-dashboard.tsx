import TrainerBottomNav from '@/components/TrainerBottomNav';
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

export default function TrainerDashboardScreen() {
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
            <Text style={styles.brand}>FORM ATHLETICS</Text>
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text style={styles.logout}>Logout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.subHeader}>
            <Text style={styles.brandSubtitle}>FORM/Brooklyn</Text>
            <Text style={styles.brandClub}>Performance club</Text>
            <Text style={styles.date}>Tuesday, October 20, 2026</Text>
          </View>

          {/* Trainer Info */}
          <View style={styles.memberInfo}>
            <Text style={styles.memberLabel}>A Trainer</Text>
            <Text style={styles.memberName}>Marcus Reed</Text>
          </View>

          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>Welcome back, Marcus</Text>
            <Text style={styles.greetingSubtitle}>You have 5 sessions scheduled today</Text>
          </View>

          {/* Overview */}
          <View style={styles.overviewSection}>
            <Text style={styles.overviewNumber}>24</Text>
            <Text style={styles.overviewLabel}>Active Clients</Text>
          </View>

          {/* Overview Cards */}
          <View style={styles.section}>
            <View style={styles.cardsGrid}>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>My Clients</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>Schedule</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>Programs</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>Profile</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
            <View style={styles.scheduleCard}>
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleTime}>09:00 AM</Text>
                <Text style={styles.scheduleClient}>Jordan Lee</Text>
                <Text style={styles.sessionType}>Strength Training</Text>
              </View>
              <View style={styles.scheduleDivider} />
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleTime}>10:30 AM</Text>
                <Text style={styles.scheduleClient}>Sarah Johnson</Text>
                <Text style={styles.sessionType}>Upper Body</Text>
              </View>
              <View style={styles.scheduleDivider} />
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleTime}>02:00 PM</Text>
                <Text style={styles.scheduleClient}>Mike Chen</Text>
                <Text style={styles.sessionType}>Lower Body</Text>
              </View>
              <View style={styles.scheduleDivider} />
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleTime}>04:00 PM</Text>
                <Text style={styles.scheduleClient}>Emily Davis</Text>
                <Text style={styles.sessionType}>Mobility</Text>
              </View>
              <View style={styles.scheduleDivider} />
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleTime}>05:30 PM</Text>
                <Text style={styles.scheduleClient}>Tom Wilson</Text>
                <Text style={styles.sessionType}>Full Body</Text>
              </View>
            </View>
          </View>

          {/* Client Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client Progress</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressItem}>
                <Text style={styles.progressClient}>Jordan Lee</Text>
                <Text style={styles.progressLabel}>Squat PB</Text>
                <Text style={styles.progressValue}>70 kg (+10 kg)</Text>
              </View>
              <View style={styles.progressDivider} />
              <View style={styles.progressItem}>
                <Text style={styles.progressClient}>Sarah Johnson</Text>
                <Text style={styles.progressLabel}>Weight Loss</Text>
                <Text style={styles.progressValue}>-3.2 kg this month</Text>
              </View>
              <View style={styles.progressDivider} />
              <View style={styles.progressItem}>
                <Text style={styles.progressClient}>Mike Chen</Text>
                <Text style={styles.progressLabel}>Consistency</Text>
                <Text style={styles.progressValue}>18/20 sessions</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>➕</Text>
                <Text style={styles.actionLabel}>Add Session</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>📋</Text>
                <Text style={styles.actionLabel}>New Program</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={styles.actionLabel}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionLabel}>Reports</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerName}>Marcus Reed</Text>
            <Text style={styles.footerLabel}>FORM ATHLETICS TRAINER WORKSPACE</Text>
          </View>
          </SubscriptionPaywall>
        </ScrollView>
        <TrainerBottomNav activeRoute="/trainer-dashboard" />
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
  workoutDetailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  workoutLevel: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    marginBottom: 8,
  },
  workoutDescription: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  workoutStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  workoutStat: {
    flex: 1,
  },
  workoutStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  workoutStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  equipment: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  focusCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  focusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  focusLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  focusQuote: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  effortCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  effortValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  lastCompleted: {
    alignItems: 'flex-end',
  },
  lastCompletedLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  lastCompletedDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  warmupCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  warmupText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  exerciseTable: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  exerciseRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  exerciseMuscle: {
    fontSize: 12,
    color: '#4F46E5',
    marginBottom: 2,
  },
  exerciseTip: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  exerciseData: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  exerciseValue: {
    fontSize: 13,
    color: '#111827',
    minWidth: 40,
    textAlign: 'center',
  },
  finishCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  finishText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  notesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
  },
  notesPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  programCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  programWeek: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
    marginRight: 8,
  },
  programName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  programDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  programSchedule: {
    gap: 8,
    marginBottom: 16,
  },
  programDay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programDayLabel: {
    width: 40,
    fontSize: 13,
    color: '#6B7280',
  },
  programDayValue: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  programDayToday: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  programDayTodayLabel: {
    fontSize: 11,
    color: '#4F46E5',
    marginLeft: 8,
  },
  viewProgramButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewProgramButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  scheduleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  scheduleItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  scheduleTime: {
    width: 80,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  scheduleClient: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  sessionType: {
    fontSize: 13,
    color: '#6B7280',
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  progressCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  progressClient: {
    width: 120,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressLabel: {
    width: 80,
    fontSize: 12,
    color: '#6B7280',
  },
  progressValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  progressDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
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
});
