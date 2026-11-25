import { StyleSheet, View } from "react-native";
import { MemberStatCard } from "./MemberStatCard";
import { Theme } from "./theme";

type Props = {
  workoutsCompleted: number | null;
  attendanceCount: number;
  upcomingAppointments: number;
};

export function MemberStatsGrid({
  workoutsCompleted,
  attendanceCount,
  upcomingAppointments,
}: Props) {
  return (
    <View style={styles.statsGrid}>
      <MemberStatCard
        icon="dumbbell"
        label="Workouts"
        value={workoutsCompleted ?? "—"}
        color={Theme.accent}
      />
      <MemberStatCard
        icon="fire"
        label="Attendance"
        value={attendanceCount}
        color={Theme.accent}
      />
      <MemberStatCard
        icon="calendar-clock"
        label="Upcoming"
        value={upcomingAppointments}
        color={Theme.info}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
