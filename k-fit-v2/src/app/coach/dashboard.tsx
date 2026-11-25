import { AnnouncementTicker } from "@/components/AnnouncementTicker";
import {
  DashboardHeader,
  getGreeting,
  KpiStrip,
  MemberAttendanceChart,
  MemberProgressChart,
  NextSessionCard,
  PendingRequestCard,
  QuickActionsGrid,
  RecentActivityCard,
  Theme,
  TodayScheduleCard,
  WeeklyLoadChart,
  type Kpi,
} from "@/components/coach";
import { BOTTOM_NAV_CLEARANCE } from "@/components/navigation/FloatingTabBar";
import { useCoachDashboard } from "@/hooks/useCoachDashboard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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

export default function CoachDashboardScreen() {
  const { user, data, loading, refreshing, refresh } = useCoachDashboard();
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (data) {
      Animated.timing(fade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [data, fade]);

  if (loading || !user || !data) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading dashboard…</Text>
      </View>
    );
  }

  const {
    stats,
    todaySessions,
    recentActivity,
    recentActivityError,
    nextSession,
    weekly,
    memberAttendance,
    memberAttendanceError,
    memberProgress,
    memberProgressError,
    announcements,
  } = data;

  const coachName =
    [user.user_metadata?.first_name, user.user_metadata?.last_name]
      .filter(Boolean)
      .join(" ") ||
    user.email?.split("@")[0] ||
    "Coach";

  const kpis: Kpi[] = [
    {
      key: "scheduled",
      label: "Scheduled",
      value: stats.scheduled,
      color: Theme.accent,
      onPress: () => router.push("/coach/appointments"),
    },
    {
      key: "completed",
      label: "Completed",
      value: stats.completed,
      color: Theme.success,
      onPress: () => router.push("/coach/appointments"),
    },
    {
      key: "upcoming",
      label: "Upcoming",
      value: stats.upcoming,
      color: Theme.info,
      onPress: () => router.push("/coach/appointments"),
    },
    {
      key: "assigned",
      label: "Assigned",
      value: stats.activeClients,
      color: Theme.accent,
      onPress: () => router.push("/coach/clients"),
    },
    {
      key: "pending",
      label: "Requests",
      value: stats.pendingRequests,
      color: Theme.warning,
      onPress: () => router.push("/coach/requests"),
    },
    {
      key: "today",
      label: "Today",
      value: stats.todaySessions,
      color: Theme.accent,
      onPress: () => router.push("/coach/appointments"),
    },
  ];

  return (
    <Animated.View
      style={{ flex: 1, opacity: fade, backgroundColor: Theme.background }}
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
        <DashboardHeader
          greeting={getGreeting()}
          name={coachName}
          date={new Date().toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        />

        <View style={styles.tickerWrap}>
          <AnnouncementTicker
            items={announcements}
            accent={Theme.accent}
            backgroundColor={Theme.accentSoft}
            borderColor={Theme.accentBorder}
            textColor={Theme.accent}
            onPress={() => router.push("/coach/announcements")}
          />
        </View>

        <KpiStrip items={kpis} />
        <View style={styles.ratingNote}>
          <MaterialCommunityIcons
            name="star-outline"
            size={15}
            color={Theme.textMuted}
          />
          <Text style={styles.ratingText}>
            Coach ratings are not tracked in the current database.
          </Text>
        </View>

        <NextSessionCard
          session={nextSession}
          onStart={() => router.push("/coach/appointments")}
          onOpenSchedule={() => router.push("/coach/appointments")}
        />

        <TodayScheduleCard
          sessions={todaySessions}
          onViewAll={() => router.push("/coach/appointments")}
        />

        <PendingRequestCard
          count={stats.pendingRequests}
          onReview={() => router.push("/coach/requests")}
        />

        <WeeklyLoadChart
          days={weekly.days}
          total={weekly.total}
          lastWeekTotal={weekly.lastWeekTotal}
        />

        <MemberAttendanceChart
          data={memberAttendance}
          error={memberAttendanceError}
        />
        <MemberProgressChart
          data={memberProgress}
          error={memberProgressError}
        />

        <RecentActivityCard
          items={recentActivity}
          error={recentActivityError}
        />

        <QuickActionsGrid />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  center: { justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: BOTTOM_NAV_CLEARANCE + 16 },
  tickerWrap: { marginBottom: 16 },
  ratingNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: -4,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  ratingText: { color: Theme.textMuted, fontSize: 10, lineHeight: 15 },
  loadingText: {
    fontSize: 14,
    color: Theme.accent,
    fontWeight: "600",
    marginTop: 12,
  },
});
