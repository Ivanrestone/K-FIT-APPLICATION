import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const horizontalPadding = width < 360 ? 16 : width >= 768 ? 28 : 20;
  const compactLayout = width < 360 || fontScale >= 1.35;
  const statCardBasis: ViewStyle["flexBasis"] =
    width >= 720 && fontScale < 1.35 ? "22%" : compactLayout ? "100%" : "47%";
  const statCardMaxWidth: ViewStyle["maxWidth"] =
    width >= 720 && fontScale < 1.35 ? "24%" : compactLayout ? "100%" : "49%";
  const statCardLayout = {
    flexBasis: statCardBasis,
    maxWidth: statCardMaxWidth,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/dashboard" theme="dashboard" />

        {/* Main Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.container,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>GYM MANAGEMENT</Text>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.subtitle}>Welcome back, Admin!</Text>
            </View>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Today&apos;s Overview</Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, statCardLayout]}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statNumber}>248</Text>
              <Text style={styles.statLabel}>Active Members</Text>
              <Text style={styles.statChange}>+12%</Text>
            </View>

            <View style={[styles.statCard, statCardLayout]}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statNumber}>$12.5K</Text>
              <Text style={styles.statLabel}>Monthly Revenue</Text>
              <Text style={styles.statChangePositive}>+8%</Text>
            </View>

            <View style={[styles.statCard, statCardLayout]}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={styles.statNumber}>156</Text>
              <Text style={styles.statLabel}>Today&apos;s Check-ins</Text>
              <Text style={styles.statChange}>+5%</Text>
            </View>

            <View style={[styles.statCard, statCardLayout]}>
              <Text style={styles.statIcon}>🏋️</Text>
              <Text style={styles.statNumber}>78%</Text>
              <Text style={styles.statLabel}>Class Occupancy</Text>
              <Text style={styles.statChangeWarning}>-3%</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Revenue Overview</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Monthly Revenue</Text>
              <Text style={styles.chartPeriod}>Last 6 months</Text>
            </View>
            <View style={styles.chartPlaceholder}>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { height: "40%" }]} />
                <Text style={styles.barLabel}>Jun</Text>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { height: "55%" }]} />
                <Text style={styles.barLabel}>Jul</Text>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { height: "45%" }]} />
                <Text style={styles.barLabel}>Aug</Text>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { height: "70%" }]} />
                <Text style={styles.barLabel}>Sep</Text>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { height: "60%" }]} />
                <Text style={styles.barLabel}>Oct</Text>
              </View>
              <View style={styles.barContainer}>
                <View
                  style={[styles.bar, styles.barActive, { height: "85%" }]}
                />
                <Text style={styles.barLabel}>Nov</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Attention Needed</Text>
          <View style={styles.attentionCard}>
            <View style={styles.attentionItem}>
              <View style={[styles.attentionIcon, styles.attentionWarning]}>
                <Text style={styles.attentionIconText}>⚠️</Text>
              </View>
              <View style={styles.attentionContent}>
                <Text style={styles.attentionTitle}>
                  12 Membership Renewals
                </Text>
                <Text style={styles.attentionSubtitle}>Expiring this week</Text>
              </View>
              <Text style={styles.attentionCount}>12</Text>
            </View>

            <View style={styles.attentionItem}>
              <View style={[styles.attentionIcon, styles.attentionError]}>
                <Text style={styles.attentionIconText}>💳</Text>
              </View>
              <View style={styles.attentionContent}>
                <Text style={styles.attentionTitle}>5 Unpaid Invoices</Text>
                <Text style={styles.attentionSubtitle}>Total: $1,250</Text>
              </View>
              <Text style={styles.attentionCount}>5</Text>
            </View>

            <View style={styles.attentionItem}>
              <View style={[styles.attentionIcon, styles.attentionInfo]}>
                <Text style={styles.attentionIconText}>📈</Text>
              </View>
              <View style={styles.attentionContent}>
                <Text style={styles.attentionTitle}>
                  3 Classes Near Capacity
                </Text>
                <Text style={styles.attentionSubtitle}>Yoga, HIIT, Spin</Text>
              </View>
              <Text style={styles.attentionCount}>3</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          <View style={styles.sessionsCard}>
            <View style={styles.sessionItem}>
              <View style={styles.sessionTime}>
                <Text style={styles.sessionTimeText}>9:00</Text>
                <Text style={styles.sessionAmPm}>AM</Text>
              </View>
              <View style={styles.sessionDivider} />
              <View style={styles.sessionContent}>
                <Text style={styles.sessionTitle}>Morning Yoga</Text>
                <Text style={styles.sessionTrainer}>with Sarah Johnson</Text>
                <View style={styles.sessionMeta}>
                  <Text style={styles.sessionLocation}>Studio A</Text>
                  <Text style={styles.sessionBooking}>18/20 booked</Text>
                </View>
              </View>
            </View>

            <View style={styles.sessionItem}>
              <View style={styles.sessionTime}>
                <Text style={styles.sessionTimeText}>10:30</Text>
                <Text style={styles.sessionAmPm}>AM</Text>
              </View>
              <View style={styles.sessionDivider} />
              <View style={styles.sessionContent}>
                <Text style={styles.sessionTitle}>HIIT Training</Text>
                <Text style={styles.sessionTrainer}>with Mike Chen</Text>
                <View style={styles.sessionMeta}>
                  <Text style={styles.sessionLocation}>Studio B</Text>
                  <Text style={styles.sessionBooking}>24/25 booked</Text>
                </View>
              </View>
            </View>

            <View style={styles.sessionItem}>
              <View style={styles.sessionTime}>
                <Text style={styles.sessionTimeText}>2:00</Text>
                <Text style={styles.sessionAmPm}>PM</Text>
              </View>
              <View style={styles.sessionDivider} />
              <View style={styles.sessionContent}>
                <Text style={styles.sessionTitle}>Spin Class</Text>
                <Text style={styles.sessionTrainer}>with Emma Davis</Text>
                <View style={styles.sessionMeta}>
                  <Text style={styles.sessionLocation}>Studio C</Text>
                  <Text style={styles.sessionBooking}>15/20 booked</Text>
                </View>
              </View>
            </View>

            <View style={styles.sessionItem}>
              <View style={styles.sessionTime}>
                <Text style={styles.sessionTimeText}>5:00</Text>
                <Text style={styles.sessionAmPm}>PM</Text>
              </View>
              <View style={styles.sessionDivider} />
              <View style={styles.sessionContent}>
                <Text style={styles.sessionTitle}>Strength Training</Text>
                <Text style={styles.sessionTrainer}>with John Smith</Text>
                <View style={styles.sessionMeta}>
                  <Text style={styles.sessionLocation}>Main Floor</Text>
                  <Text style={styles.sessionBooking}>12/15 booked</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.replace("/members")}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Members</Text>
              <Text style={styles.actionSubtitle}>
                View and manage gym members
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => alert("Class Schedule feature coming soon!")}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Class Schedule</Text>
              <Text style={styles.actionSubtitle}>
                Manage class schedules and trainers
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => alert("Financial Reports feature coming soon!")}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Financial Reports</Text>
              <Text style={styles.actionSubtitle}>
                View revenue and expense reports
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>K-FIT · Gym Management Dashboard</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: KFitColors.background,
  },
  mainContainer: {
    flex: 1,
    flexDirection: "row",
  },
  content: {
    flex: 1,
    backgroundColor: KFitColors.background,
  },
  container: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingTop: 20,
    paddingBottom: 144,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: KFitColors.text,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 13,
    color: KFitColors.mutedText,
    marginTop: 4,
    flexShrink: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: 16,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "bold",
    color: KFitColors.background,
  },
  sectionTitle: {
    color: KFitColors.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flexGrow: 1,
    minWidth: 0,
    backgroundColor: KFitColors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 10,
  },
  statNumber: {
    color: KFitColors.accent,
    fontSize: 24,
    fontWeight: "bold",
    flexShrink: 1,
  },
  statLabel: {
    color: KFitColors.mutedText,
    fontSize: 13,
    marginTop: 4,
  },
  statChange: {
    color: KFitColors.accent,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  statChangePositive: {
    color: KFitColors.accent,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  statChangeWarning: {
    color: KFitColors.warning,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  chartCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: KFitColors.border,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: KFitColors.text,
  },
  chartPeriod: {
    fontSize: 12,
    color: KFitColors.mutedText,
    flexShrink: 1,
    textAlign: "right",
  },
  chartPlaceholder: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    paddingHorizontal: 4,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: 24,
    backgroundColor: KFitColors.border,
    borderRadius: 4,
  },
  barActive: {
    backgroundColor: KFitColors.accent,
  },
  barLabel: {
    fontSize: 11,
    color: KFitColors.mutedText,
    marginTop: 8,
  },
  attentionCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  attentionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  attentionIcon: {
    width: 40,
    minHeight: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  attentionWarning: {
    backgroundColor: KFitColors.border,
  },
  attentionError: {
    backgroundColor: KFitColors.border,
  },
  attentionInfo: {
    backgroundColor: KFitColors.border,
  },
  attentionIconText: {
    fontSize: 16,
  },
  attentionContent: {
    flex: 1,
    minWidth: 0,
  },
  attentionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: KFitColors.text,
    flexShrink: 1,
  },
  attentionSubtitle: {
    fontSize: 13,
    color: KFitColors.mutedText,
    marginTop: 2,
    flexShrink: 1,
  },
  attentionCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: KFitColors.accent,
    marginLeft: 8,
  },
  sessionsCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionItem: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  sessionTime: {
    width: 56,
    flexShrink: 0,
    alignItems: "center",
  },
  sessionTimeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: KFitColors.text,
  },
  sessionAmPm: {
    fontSize: 11,
    color: KFitColors.mutedText,
  },
  sessionDivider: {
    width: 1,
    backgroundColor: KFitColors.border,
    marginHorizontal: 12,
  },
  sessionContent: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 8,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: KFitColors.text,
    flexShrink: 1,
  },
  sessionTrainer: {
    fontSize: 13,
    color: KFitColors.mutedText,
    marginTop: 2,
    flexShrink: 1,
  },
  sessionMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 12,
  },
  sessionLocation: {
    fontSize: 12,
    color: KFitColors.mutedText,
  },
  sessionBooking: {
    fontSize: 12,
    color: KFitColors.accent,
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    gap: 12,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionContent: {
    flex: 1,
    minWidth: 0,
  },
  actionTitle: {
    color: KFitColors.text,
    fontWeight: "600",
    fontSize: 14,
  },
  actionSubtitle: {
    color: KFitColors.mutedText,
    fontSize: 13,
    marginTop: 3,
    flexShrink: 1,
  },
  arrow: {
    color: KFitColors.mutedText,
    fontSize: 24,
    flexShrink: 0,
  },
  logoutButton: {
    backgroundColor: "#DC2626",
    minHeight: 52,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  logoutText: {
    color: KFitColors.text,
    fontSize: 15,
    fontWeight: "bold",
  },
  footer: {
    color: KFitColors.mutedText,
    fontSize: 11,
    textAlign: "center",
    marginTop: 24,
  },
});
