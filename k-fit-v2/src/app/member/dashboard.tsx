// app/member/dashboard.tsx
import { AnnouncementTicker } from "@/components/AnnouncementTicker";
import {
  AssignedTrainingCard,
  HeroCard,
  MemberStatsGrid,
  MembershipStatusCard,
  NextAppointmentCard,
  PersonalAttendanceChart,
  QuickActionsGrid,
  Theme,
  WorkoutProgressChart,
  WorkoutLoggerModal,
} from "@/components/member";
import { BOTTOM_NAV_CLEARANCE } from "@/components/navigation/FloatingTabBar";
import { useMemberDashboard } from "@/hooks/useMemberDashboard";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function MemberDashboardScreen() {
  const {
    user,
    stats,
    loading,
    refreshing,
    refresh,
    announcements,
    logWorkout,
  } = useMemberDashboard();

  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);

  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(20));

  useEffect(() => {
    if (!loading && user) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, user, fadeAnim, slideAnim]);

  if (loading || !user) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Syncing your daily plan...</Text>
      </View>
    );
  }

  const firstName = (user.email || "").split("@")[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const weeklyGoal = 5;
  const weeklyAttendanceDays = stats.weeklyAttendance.filter(
    (count) => count > 0,
  ).length;
  const weeklyProgress = Math.min(
    (weeklyAttendanceDays / weeklyGoal) * 100,
    100,
  );

  const handleSaveWorkout = async (workout: {
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }) => {
    const success = await logWorkout(workout);
    if (success) setWorkoutModalVisible(false);
    return success;
  };

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: Theme.background,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Theme.accent}
            colors={[Theme.accent]}
            progressBackgroundColor={Theme.surface}
          />
        }
      >
        <HeroCard
          displayName={displayName}
          membershipActive={stats.membershipActive}
          weeklyAttendanceDays={weeklyAttendanceDays}
          weeklyGoal={weeklyGoal}
          weeklyProgress={weeklyProgress}
        />
        <MembershipStatusCard
          status={stats.membershipStatus}
          endDate={stats.membershipEndDate}
        />

        <View style={styles.tickerWrap}>
          <AnnouncementTicker
            items={announcements}
            accent={Theme.accent}
            backgroundColor="rgba(255, 215, 0, 0.08)"
            borderColor="rgba(255, 215, 0, 0.25)"
            textColor={Theme.accent}
            onPress={() => router.push("/member/announcements")}
          />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Your next session</Text>
          <Text style={styles.sectionSubtitle}>Keep your training on track</Text>
        </View>
        <NextAppointmentCard
          appointmentDate={stats.nextAppointment?.appointment_date ?? null}
        />
        <AssignedTrainingCard
          activePlans={stats.activeTrainingPlans}
          completedWorkouts={stats.assignedPlanCompletions}
          error={stats.trainingPlanError}
          onPress={() => router.push("/member/workouts")}
        />

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubtitle}>Shortcuts for your training</Text>
        </View>
        <QuickActionsGrid onLogWorkout={() => setWorkoutModalVisible(true)} />

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>My Progress</Text>
          <Text style={styles.sectionSubtitle}>Your gym activity at a glance</Text>
        </View>
        <MemberStatsGrid
          workoutsCompleted={stats.workoutsCompleted}
          attendanceCount={stats.attendanceCount}
          upcomingAppointments={stats.upcomingAppointments}
        />

        <PersonalAttendanceChart data={stats.attendanceTrend} />
        <WorkoutProgressChart
          data={stats.workoutProgress}
          error={stats.workoutLogError}
        />
      </ScrollView>

      <WorkoutLoggerModal
        visible={workoutModalVisible}
        onClose={() => setWorkoutModalVisible(false)}
        onSave={handleSaveWorkout}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  center: { justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: BOTTOM_NAV_CLEARANCE + 20 },
  loadingText: {
    fontSize: 14,
    color: Theme.accent,
    fontWeight: "600",
    marginTop: 12,
  },
  tickerWrap: { marginBottom: 16 },
  sectionHeading: { marginTop: 4, marginBottom: 10 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Theme.text,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Theme.textMuted,
    marginTop: 3,
  },
  sectionCard: {
    backgroundColor: Theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 16,
    marginBottom: 20,
  },
});
