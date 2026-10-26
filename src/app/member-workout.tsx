import MemberBottomNav from "@/components/MemberBottomNav";
import { useLogout } from "@/hooks/use-logout";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MemberWorkoutScreen() {
  const { isSigningOut, logout } = useLogout();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brand}>FORM ATHLETICS</Text>
            <TouchableOpacity disabled={isSigningOut} onPress={logout}>
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
            <Text style={styles.memberLabel}>A Member</Text>
            <Text style={styles.memberName}>Jordan Lee</Text>
          </View>

          {/* Start Workout Button */}
          <TouchableOpacity style={styles.startButton}>
            <Text style={styles.startButtonText}>▷ Start workout</Text>
          </TouchableOpacity>

          {/* Workout Title */}
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutTitle}>Lower body strength</Text>
            <Text style={styles.workoutSubtitle}>
              Foundation Strength/Week 4 of 8
            </Text>
            <Text style={styles.workoutDate}>Tuesday, October 20</Text>
          </View>

          {/* Overview */}
          <View style={styles.overviewSection}>
            <Text style={styles.overviewNumber}>88</Text>
            <Text style={styles.overviewLabel}>Overview</Text>
          </View>

          {/* Overview Cards */}
          <View style={styles.section}>
            <View style={styles.cardsGrid}>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>My workouts</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>Progress & profile</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>Membership & billing</Text>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Workout Details */}
          <View style={styles.section}>
            <View style={styles.workoutDetailsCard}>
              <Text style={styles.workoutLevel}>STRENGTH/INTERMEDIATE</Text>
              <Text style={styles.workoutDescription}>
                Strong from the ground up.
              </Text>
              <View style={styles.workoutStats}>
                <View style={styles.workoutStat}>
                  <Text style={styles.workoutStatNumber}>5</Text>
                  <Text style={styles.workoutStatLabel}>exercises</Text>
                </View>
                <View style={styles.workoutStat}>
                  <Text style={styles.workoutStatNumber}>55</Text>
                  <Text style={styles.workoutStatLabel}>minutes</Text>
                </View>
                <View style={styles.workoutStat}>
                  <Text style={styles.workoutStatNumber}>19</Text>
                  <Text style={styles.workoutStatLabel}>working sets</Text>
                </View>
              </View>
              <Text style={styles.equipment}>
                Barbells • Dumbbells • Machines
              </Text>
            </View>
          </View>

          {/* Today's Focus */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's focus</Text>
            <View style={styles.focusCard}>
              <Text style={styles.focusText}>Marcus Reed</Text>
              <Text style={styles.focusLabel}>Your coach</Text>
              <Text style={styles.focusQuote}>
                "Keep 2 reps in reserve. Controlled tempo and full range of
                motion come before load."
              </Text>
            </View>
          </View>

          {/* Target Effort */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target effort</Text>
            <View style={styles.effortCard}>
              <Text style={styles.effortValue}>RPE 7-8</Text>
              <View style={styles.lastCompleted}>
                <Text style={styles.lastCompletedLabel}>Last completed</Text>
                <Text style={styles.lastCompletedDate}>Oct 18 • 52 min</Text>
              </View>
            </View>
          </View>

          {/* Warm-up */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Warm-up</Text>
            <View style={styles.warmupCard}>
              <Text style={styles.warmupText}>
                Easy cycling for 3 minutes, then bodyweight squats, leg swings
                and dynamic hip mobility.
              </Text>
            </View>
          </View>

          {/* Exercise Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXERCISE</Text>
            <View style={styles.exerciseTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>SETS</Text>
                <Text style={styles.tableHeaderText}>REPS</Text>
                <Text style={styles.tableHeaderText}>REST</Text>
                <Text style={styles.tableHeaderText}>LOAD</Text>
              </View>

              <View style={styles.exerciseRow}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>Barbell back squat</Text>
                  <Text style={styles.exerciseMuscle}>Quads</Text>
                  <Text style={styles.exerciseTip}>Keep chest tall</Text>
                </View>
                <View style={styles.exerciseData}>
                  <Text style={styles.exerciseValue}>4</Text>
                  <Text style={styles.exerciseValue}>9-10</Text>
                  <Text style={styles.exerciseValue}>90s</Text>
                  <Text style={styles.exerciseValue}>70kg</Text>
                </View>
              </View>

              <View style={styles.exerciseRow}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>Romanian deadlift</Text>
                  <Text style={styles.exerciseMuscle}>Hamstrings</Text>
                  <Text style={styles.exerciseTip}>Hinge at the hips</Text>
                </View>
                <View style={styles.exerciseData}>
                  <Text style={styles.exerciseValue}>3</Text>
                  <Text style={styles.exerciseValue}>10</Text>
                  <Text style={styles.exerciseValue}>75s</Text>
                  <Text style={styles.exerciseValue}>60 kg</Text>
                </View>
              </View>

              <View style={styles.exerciseRow}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>Reverse lunge</Text>
                  <Text style={styles.exerciseMuscle}>Glutes</Text>
                  <Text style={styles.exerciseTip}>Dumbbells each hand</Text>
                </View>
                <View style={styles.exerciseData}>
                  <Text style={styles.exerciseValue}>3</Text>
                  <Text style={styles.exerciseValue}>10/side</Text>
                  <Text style={styles.exerciseValue}>60s</Text>
                  <Text style={styles.exerciseValue}>12kg</Text>
                </View>
              </View>

              <View style={styles.exerciseRow}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>Seated leg curl</Text>
                  <Text style={styles.exerciseMuscle}>Hamstrings</Text>
                </View>
                <View style={styles.exerciseData}>
                  <Text style={styles.exerciseValue}>3</Text>
                  <Text style={styles.exerciseValue}>12</Text>
                  <Text style={styles.exerciseValue}>60s</Text>
                  <Text style={styles.exerciseValue}>30 kg</Text>
                </View>
              </View>

              <View style={styles.exerciseRow}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>Standing calf raise</Text>
                  <Text style={styles.exerciseMuscle}>Calves</Text>
                </View>
                <View style={styles.exerciseData}>
                  <Text style={styles.exerciseValue}>4</Text>
                  <Text style={styles.exerciseValue}>15</Text>
                  <Text style={styles.exerciseValue}>60s</Text>
                  <Text style={styles.exerciseValue}>40 kg</Text>
                </View>
              </View>

              <View style={styles.exerciseRow}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>Forearms plank</Text>
                  <Text style={styles.exerciseMuscle}>Core</Text>
                </View>
                <View style={styles.exerciseData}>
                  <Text style={styles.exerciseValue}>3</Text>
                  <Text style={styles.exerciseValue}>60s</Text>
                  <Text style={styles.exerciseValue}>60s</Text>
                  <Text style={styles.exerciseValue}>-</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Finish */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Finish</Text>
            <View style={styles.finishCard}>
              <Text style={styles.finishText}>
                Finish with 5 minutes of easy walking and lower-body stretching
              </Text>
            </View>
          </View>

          {/* Workout Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesPlaceholder}>
                How are you feeling today? Add notes about your energy,
                technique or any discomfort...
              </Text>
            </View>
          </View>

          {/* Weekly Program */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your weekly program</Text>
            <View style={styles.programCard}>
              <View style={styles.programHeader}>
                <Text style={styles.programWeek}>Week 4</Text>
                <Text style={styles.programName}>Foundation Strength</Text>
              </View>
              <Text style={styles.programDescription}>
                Build a strong base with four focused sessions per week
              </Text>
              <View style={styles.programSchedule}>
                <View style={styles.programDay}>
                  <Text style={styles.programDayLabel}>Mon</Text>
                  <Text style={styles.programDayValue}>Upper body A</Text>
                </View>
                <View style={styles.programDay}>
                  <Text style={styles.programDayLabel}>Tue</Text>
                  <Text
                    style={[styles.programDayValue, styles.programDayToday]}
                  >
                    Lower body A
                  </Text>
                  <Text style={styles.programDayTodayLabel}>Today</Text>
                </View>
                <View style={styles.programDay}>
                  <Text style={styles.programDayLabel}>Wed</Text>
                  <Text style={styles.programDayValue}>Active recovery 20</Text>
                </View>
                <View style={styles.programDay}>
                  <Text style={styles.programDayLabel}>Thu</Text>
                  <Text style={styles.programDayValue}>Upper body B</Text>
                </View>
                <View style={styles.programDay}>
                  <Text style={styles.programDayLabel}>Fri</Text>
                  <Text style={styles.programDayValue}>Lower body B</Text>
                </View>
                <View style={styles.programDay}>
                  <Text style={styles.programDayLabel}>Sat</Text>
                  <Text style={styles.programDayValue}>
                    Optional mobility 20
                  </Text>
                </View>
                <View style={styles.programDay}>
                  <Text style={styles.programDayLabel}>Sun</Text>
                  <Text style={styles.programDayValue}>Rest & recharge</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.viewProgramButton}>
                <Text style={styles.viewProgramButtonText}>
                  View full program
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerName}>Jordan Lee</Text>
            <Text style={styles.footerLabel}>
              FORM ATHLETICS MEMBER WORKSPACE
            </Text>
          </View>
        </ScrollView>
        <MemberBottomNav activeRoute="/member-workout" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  brand: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  logout: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  brandSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
  },
  brandClub: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
  },
  memberInfo: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  memberLabel: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "uppercase",
  },
  memberName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 4,
  },
  startButton: {
    marginHorizontal: 20,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  workoutHeader: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  workoutTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  workoutSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  overviewSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  overviewNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#111827",
  },
  overviewLabel: {
    fontSize: 14,
    color: "#6B7280",
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
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  cardArrow: {
    fontSize: 24,
    color: "#9CA3AF",
  },
  workoutDetailsCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
  },
  workoutLevel: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "600",
    marginBottom: 8,
  },
  workoutDescription: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  workoutStats: {
    flexDirection: "row",
    marginBottom: 12,
  },
  workoutStat: {
    flex: 1,
  },
  workoutStatNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  workoutStatLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  equipment: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  focusCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
  },
  focusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  focusLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  focusQuote: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    lineHeight: 20,
  },
  effortCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  effortValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  lastCompleted: {
    alignItems: "flex-end",
  },
  lastCompletedLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
  lastCompletedDate: {
    fontSize: 13,
    color: "#6B7280",
  },
  warmupCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
  },
  warmupText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  exerciseTable: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    textAlign: "center",
  },
  exerciseRow: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  exerciseMuscle: {
    fontSize: 12,
    color: "#4F46E5",
    marginBottom: 2,
  },
  exerciseTip: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  exerciseData: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  exerciseValue: {
    fontSize: 13,
    color: "#111827",
    minWidth: 40,
    textAlign: "center",
  },
  finishCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
  },
  finishText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  notesCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
  },
  notesPlaceholder: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  programCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
  },
  programHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  programWeek: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "600",
    marginRight: 8,
  },
  programName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  programDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  programSchedule: {
    gap: 8,
    marginBottom: 16,
  },
  programDay: {
    flexDirection: "row",
    alignItems: "center",
  },
  programDayLabel: {
    width: 40,
    fontSize: 13,
    color: "#6B7280",
  },
  programDayValue: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  programDayToday: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  programDayTodayLabel: {
    fontSize: 11,
    color: "#4F46E5",
    marginLeft: 8,
  },
  viewProgramButton: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  viewProgramButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: "center",
  },
  footerName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  footerLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
});
