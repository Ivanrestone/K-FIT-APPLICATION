import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TrainerBottomNav from '@/components/TrainerBottomNav';
import { useLogout } from '@/hooks/use-logout';

export default function TrainerProgramScreen() {
  const { isSigningOut, logout } = useLogout();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>MR</Text>
            </View>
            <TouchableOpacity disabled={isSigningOut} onPress={logout}>
              <Text style={styles.logout}>Logout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.subHeader}>
            <Text style={styles.brand}>FORM</Text>
            <Text style={styles.brandSubtitle}>FORM/Brooklyn</Text>
            <Text style={styles.brandClub}>Performance club</Text>
            <Text style={styles.date}>Tuesday, October 20, 2026</Text>
          </View>

          {/* Trainer Info */}
          <View style={styles.trainerInfo}>
            <Text style={styles.trainerInitials}>MR</Text>
            <Text style={styles.trainerLabel}>Trainer</Text>
          </View>

          {/* Page Title */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Workout programs</Text>
            <Text style={styles.pageSubtitle}>Foundation Strength/Week 4 Lower body</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.publishButton}>
              <Text style={styles.publishButtonText}>Publish changes</Text>
            </TouchableOpacity>
          </View>

          {/* Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.overviewCard}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Draft changes</Text>
                <Text style={styles.overviewValue}>Last saved today 9:41 AM</Text>
              </View>
              <TouchableOpacity style={styles.previewButton}>
                <Text style={styles.previewButtonText}>Preview member view</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>My clients</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, styles.tabActive]}>
              <Text style={[styles.tabText, styles.tabTextActive]}>Program details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>Workout programs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>Training schedule</Text>
            </TouchableOpacity>
          </View>

          {/* Program Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout programs</Text>
            <View style={styles.programCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Program name</Text>
                <Text style={styles.detailValue}>Foundation Strength</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Training goal</Text>
                <Text style={styles.detailValue}>Strength & body composition</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>8 weeks</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sessions per week</Text>
                <Text style={styles.detailValue}>4 sessions</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assigned member</Text>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>Jordan Lee</Text>
                  <Text style={styles.memberId}>PM-1042 Performance</Text>
                </View>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Current week</Text>
                <Text style={styles.detailValue}>Week 4 of 8</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start date</Text>
                <Text style={styles.detailValue}>September 28, 2026</Text>
              </View>
              <TouchableOpacity style={styles.changeButton}>
                <Text style={styles.changeButtonText}>Change assignment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addExerciseButton}>
                <Text style={styles.addExerciseButtonText}>+ Add exercise</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekly Structure */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly structure</Text>
            <View style={styles.weeklyStructure}>
              <View style={styles.weekDay}>
                <Text style={styles.weekDayLabel}>Mon</Text>
                <Text style={styles.weekDayValue}>Upper</Text>
              </View>
              <View style={styles.weekDay}>
                <Text style={styles.weekDayLabel}>Tue</Text>
                <Text style={styles.weekDayValue}>Lower</Text>
              </View>
              <View style={styles.weekDay}>
                <Text style={styles.weekDayLabel}>Thu</Text>
                <Text style={styles.weekDayValue}>Upper</Text>
              </View>
              <View style={styles.weekDay}>
                <Text style={styles.weekDayLabel}>Fri</Text>
                <Text style={styles.weekDayValue}>Lower</Text>
              </View>
            </View>
          </View>

          {/* Lower Body Strength */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lower body strength</Text>
            <Text style={styles.sectionSubtitle}>EXERCISE</Text>
            <View style={styles.exerciseList}>
              <View style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>Barbell back squat</Text>
              </View>
              <View style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>Romanian deadlift</Text>
                <Text style={styles.exerciseMuscle}>Hamstrings • Barbell</Text>
              </View>
              <View style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>Reverse lunge</Text>
              </View>
              <View style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>Seated leg curl</Text>
              </View>
              <View style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>Standing calf raise</Text>
                <Text style={styles.exerciseMuscle}>Calves • Machine</Text>
              </View>
              <View style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>Forearm plank</Text>
                <Text style={styles.exerciseMuscle}>Core • Bodyweight</Text>
              </View>
            </View>
            <Text style={styles.exerciseSummary}>6 exercises • 55 min</Text>
          </View>

          {/* Weekly Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly schedule</Text>
            <View style={styles.scheduleTable}>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleDay}>Mon</Text>
                <Text style={styles.scheduleWorkout}>Upper body A</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleDay}>Tue</Text>
                <Text style={styles.scheduleWorkout}>Lower body A</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleDay}>Wed</Text>
                <Text style={styles.scheduleWorkout}>Active recovery</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleDay}>Thu</Text>
                <Text style={styles.scheduleWorkout}>Upper body B</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleDay}>Fri</Text>
                <Text style={styles.scheduleWorkout}>Lower body B</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleDay}>Sat</Text>
                <Text style={styles.scheduleWorkout}>Mobility/optional</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleDay}>Sun</Text>
                <Text style={styles.scheduleWorkout}>Rest day</Text>
              </View>
            </View>
          </View>

          {/* Exercise Details Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercise details</Text>
            <View style={styles.exerciseTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>SETS</Text>
                <Text style={styles.tableHeaderText}>REPS</Text>
                <Text style={styles.tableHeaderText}>REST</Text>
                <Text style={styles.tableHeaderText}>LOAD</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>4</Text>
                <Text style={styles.tableCell}>9-10</Text>
                <Text style={styles.tableCell}>90s</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>3</Text>
                <Text style={styles.tableCell}>10</Text>
                <Text style={styles.tableCell}>75s</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>3</Text>
                <Text style={styles.tableCell}>10/side</Text>
                <Text style={styles.tableCell}>60s</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>3</Text>
                <Text style={styles.tableCell}>12</Text>
                <Text style={styles.tableCell}>60s</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>3</Text>
                <Text style={styles.tableCell}>15</Text>
                <Text style={styles.tableCell}>60s</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>3</Text>
                <Text style={styles.tableCell}>45s</Text>
                <Text style={styles.tableCell}>45s</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
            </View>
          </View>

          {/* Publish Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Publish settings</Text>
            <View style={styles.publishCard}>
              <TouchableOpacity style={styles.publishOption}>
                <Text style={styles.publishOptionText}>Notify Jordan when published</Text>
              </TouchableOpacity>
              <View style={styles.publishDivider} />
              <TouchableOpacity style={styles.publishOption}>
                <Text style={styles.publishOptionText}>Allow workout notes</Text>
              </TouchableOpacity>
              <Text style={styles.publishNote}>Publishing updates the members assigned workout plan</Text>
            </View>
          </View>

          {/* Session Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>
                Start with 5 minutes of easy cycling and dynamic hip mobility. Keep 2 reps in reserve. Prioritize controlled tempo and full range of motion over load.
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerName}>Marcus Reed</Text>
            <Text style={styles.footerLabel}>Trainer</Text>
            <Text style={styles.footerBrand}>FORM ATHLETICS/TRAINER WORKSPACE</Text>
          </View>
        </ScrollView>
        <TrainerBottomNav activeRoute="/trainer-program" />
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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
  brand: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
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
  trainerInfo: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trainerInitials: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
  },
  trainerLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  pageHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  publishButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  publishButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
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
  sectionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  overviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  overviewItem: {
    marginBottom: 12,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  previewButton: {
    marginTop: 8,
  },
  previewButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  tabActive: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 13,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  programCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  memberInfo: {
    alignItems: 'flex-end',
  },
  memberName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  memberId: {
    fontSize: 12,
    color: '#6B7280',
  },
  changeButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  changeButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  addExerciseButton: {
    marginTop: 12,
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addExerciseButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  weeklyStructure: {
    flexDirection: 'row',
    gap: 8,
  },
  weekDay: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  weekDayLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  weekDayValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  exerciseList: {
    gap: 8,
  },
  exerciseItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  exerciseMuscle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  exerciseSummary: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
  },
  scheduleTable: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  scheduleRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scheduleDay: {
    width: 50,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  scheduleWorkout: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
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
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    textAlign: 'center',
  },
  publishCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  publishOption: {
    paddingVertical: 8,
  },
  publishOptionText: {
    fontSize: 14,
    color: '#111827',
  },
  publishDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  publishNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  notesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
  footerBrand: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
