import {
  AdminAnnouncementTicker,
  AdminQuickActionsGrid,
  DailyAttendanceChart,
  GlassCard,
  LiveFeed,
  MembershipStatusChart,
  MonthlyRevenueChart,
  PageHeader,
  StatCard,
  Theme,
} from "@/components/admin";
import { BOTTOM_NAV_CLEARANCE } from "@/components/navigation/FloatingTabBar";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
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

export default function AdminDashboardScreen() {
  const {
    user,
    stats,
    attendance,
    dailyAttendance,
    monthlyRevenue,
    membershipStatus,
    analyticsLoading,
    analyticsErrors,
    announcements,
    loading,
    refreshing,
    refresh,
  } = useAdminDashboard();
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!loading && user) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, user, fadeAnim]);

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Syncing K-FIT Data...</Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={{ flex: 1, backgroundColor: Theme.background, opacity: fadeAnim }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
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
        <PageHeader
          title="Dashboard"
          name={user.email?.split("@")[0] || "Admin"}
        />
        <AdminAnnouncementTicker
          items={announcements}
          onPress={() => router.push("/admin/announcements")}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>At a glance</Text>
          <Text style={styles.sectionSubtitle}>
            Current gym activity and operations
          </Text>
        </View>
        <View style={styles.grid}>
          <StatCard
            title="Total Members"
            value={stats.memberCount}
            icon="account-group"
            color={Theme.accent}
            detail="Registered"
            onPress={() => router.push("/admin/members")}
          />
          <StatCard
            title="Coach Applications"
            value={stats.pendingApplications}
            icon="email-fast"
            color={Theme.info}
            detail={
              stats.pendingApplications > 0 ? "Needs review" : "All clear"
            }
            onPress={() => router.push("/admin/coach-applications")}
          />
          <StatCard
            title="Today's Check-ins"
            value={stats.attendanceCount}
            icon="fingerprint"
            color="#8B5CF6"
            detail="Today"
            onPress={() => router.push("/admin/attendance")}
          />
          <StatCard
            title="Registered Today"
            value={stats.registeredTodayCount}
            icon="account-plus"
            color={Theme.info}
            detail="New members"
            onPress={() => router.push("/admin/members")}
          />
          <StatCard
            title="Logged In Today"
            value={stats.loggedInTodayCount}
            icon="login"
            color={Theme.success}
            detail="Member accounts"
            onPress={() => router.push("/admin/members")}
          />
          <StatCard
            title="Payment Records"
            value={stats.paymentCount}
            icon="wallet"
            color={Theme.success}
            detail="All records"
            onPress={() => router.push("/admin/payments")}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Analytics</Text>
          <Text style={styles.sectionSubtitle}>
            Attendance, earnings, and membership trends
          </Text>
        </View>
        <DailyAttendanceChart
          data={dailyAttendance}
          loading={analyticsLoading}
          error={analyticsErrors.attendance}
        />
        <MonthlyRevenueChart
          data={monthlyRevenue}
          loading={analyticsLoading}
          error={analyticsErrors.revenue}
        />
        <MembershipStatusChart
          counts={membershipStatus}
          loading={analyticsLoading}
          error={analyticsErrors.membership}
        />

        <LiveFeed
          items={attendance}
          onViewAll={() => router.push("/admin/attendance")}
        />

        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <Text style={styles.sectionSubtitle}>
              Manage members, payments, and access
            </Text>
          </View>
          <AdminQuickActionsGrid />
        </GlassCard>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: BOTTOM_NAV_CLEARANCE + 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Theme.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Theme.accent,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  sectionHeader: { marginTop: 2, marginBottom: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Theme.text,
    letterSpacing: -0.2,
  },
  sectionSubtitle: { fontSize: 11, color: Theme.textMuted, marginTop: 3 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionCard: { marginTop: 16, padding: 18 },
});
