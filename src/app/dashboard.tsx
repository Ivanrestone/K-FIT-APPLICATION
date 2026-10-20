import { useRouter } from 'expo-router';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {/* Left Sidebar */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.gymName}>FORM/Brooklyn</Text>
            <Text style={styles.gymSubtitle}>Performance club</Text>
          </View>

          <View style={styles.sidebarDate}>
            <Text style={styles.dateText}>Tuesday, October 20, 2026</Text>
            <Text style={styles.timeText}>AM</Text>
          </View>

          <View style={styles.sidebarNav}>
            <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
              <Text style={[styles.navItemText, styles.navItemTextActive]}>
                Dashboard
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/members')}>
              <Text style={styles.navItemText}>Members</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/attendance')}>
              <Text style={styles.navItemText}>Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/trainers')}>
              <Text style={styles.navItemText}>Trainers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/memberships')}>
              <Text style={styles.navItemText}>Memberships</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/payments')}>
              <Text style={styles.navItemText}>Payments</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>GYM MANAGEMENT</Text>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.subtitle}>Welcome back, Admin!</Text>
            </View>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
          </View>

        <Text style={styles.sectionTitle}>Today's Overview</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statNumber}>248</Text>
            <Text style={styles.statLabel}>Active Members</Text>
            <Text style={styles.statChange}>+12%</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statNumber}>$12.5K</Text>
            <Text style={styles.statLabel}>Monthly Revenue</Text>
            <Text style={styles.statChangePositive}>+8%</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>Today's Check-ins</Text>
            <Text style={styles.statChange}>+5%</Text>
          </View>

          <View style={styles.statCard}>
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
              <View style={[styles.bar, { height: '40%' }]} />
              <Text style={styles.barLabel}>Jun</Text>
            </View>
            <View style={styles.barContainer}>
              <View style={[styles.bar, { height: '55%' }]} />
              <Text style={styles.barLabel}>Jul</Text>
            </View>
            <View style={styles.barContainer}>
              <View style={[styles.bar, { height: '45%' }]} />
              <Text style={styles.barLabel}>Aug</Text>
            </View>
            <View style={styles.barContainer}>
              <View style={[styles.bar, { height: '70%' }]} />
              <Text style={styles.barLabel}>Sep</Text>
            </View>
            <View style={styles.barContainer}>
              <View style={[styles.bar, { height: '60%' }]} />
              <Text style={styles.barLabel}>Oct</Text>
            </View>
            <View style={styles.barContainer}>
              <View style={[styles.bar, styles.barActive, { height: '85%' }]} />
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
              <Text style={styles.attentionTitle}>12 Membership Renewals</Text>
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
              <Text style={styles.attentionTitle}>3 Classes Near Capacity</Text>
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
          onPress={() => router.replace('/members')}
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
          onPress={() =>
            alert('Class Schedule feature coming soon!')
          }
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
          onPress={() =>
            alert('Financial Reports feature coming soon!')
          }
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

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace('/')}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Log Out</Text>
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
    backgroundColor: '#F8FAFC',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: width > 768 ? 250 : 80,
    backgroundColor: '#F9FAFB',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sidebarHeader: {
    marginBottom: 20,
  },
  gymName: {
    fontSize: width > 768 ? 16 : 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  gymSubtitle: {
    fontSize: width > 768 ? 12 : 10,
    color: '#6B7280',
    marginTop: 2,
  },
  sidebarDate: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateText: {
    fontSize: width > 768 ? 11 : 10,
    color: '#6B7280',
  },
  timeText: {
    fontSize: width > 768 ? 10 : 9,
    color: '#9CA3AF',
    marginTop: 2,
  },
  sidebarNav: {
    gap: 8,
  },
  navItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#E5E7EB',
  },
  navItemText: {
    fontSize: width > 768 ? 14 : 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  navItemTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  eyebrow: {
    color: '#4F46E5',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: width > 600 ? '23%' : '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
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
    color: '#111827',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  statChange: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  statChangePositive: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  statChangeWarning: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  chartPeriod: {
    fontSize: 12,
    color: '#6B7280',
  },
  chartPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 4,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 24,
    backgroundColor: '#E0E7FF',
    borderRadius: 4,
  },
  barActive: {
    backgroundColor: '#4F46E5',
  },
  barLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
  },
  attentionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  attentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  attentionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  attentionWarning: {
    backgroundColor: '#FEF3C7',
  },
  attentionError: {
    backgroundColor: '#FEE2E2',
  },
  attentionInfo: {
    backgroundColor: '#DBEAFE',
  },
  attentionIconText: {
    fontSize: 16,
  },
  attentionContent: {
    flex: 1,
  },
  attentionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  attentionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  attentionCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  sessionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sessionTime: {
    width: 50,
    alignItems: 'center',
  },
  sessionTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  sessionAmPm: {
    fontSize: 11,
    color: '#6B7280',
  },
  sessionDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  sessionContent: {
    flex: 1,
    paddingLeft: 8,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  sessionTrainer: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sessionMeta: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  sessionLocation: {
    fontSize: 11,
    color: '#6B7280',
  },
  sessionBooking: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 14,
  },
  actionSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 3,
  },
  arrow: {
    color: '#9CA3AF',
    fontSize: 24,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footer: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
  },
});