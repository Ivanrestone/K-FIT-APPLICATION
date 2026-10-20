import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface AttendanceRecord {
  id: string;
  memberName: string;
  memberId: string;
  checkIn: string;
  checkOut: string;
  activity: string;
  duration: string;
  status: 'In progress' | 'Completed' | 'Checked out';
}

const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    memberName: 'Jordan Lee',
    memberId: 'FM-1042',
    checkIn: '07:04 AM',
    checkOut: '09:00 AM',
    activity: 'Open gym',
    duration: '64 min',
    status: 'Completed',
  },
  {
    id: '2',
    memberName: 'Maya Patel',
    memberId: 'FM-0851',
    checkIn: '08:15 AM',
    checkOut: '09:10 AM',
    activity: 'Mobility Flow',
    duration: '55 min',
    status: 'Completed',
  },
  {
    id: '3',
    memberName: 'Sam Rivera',
    memberId: 'FM-0908',
    checkIn: '08:30 AM',
    checkOut: '-',
    activity: 'Personal training',
    duration: '-',
    status: 'In progress',
  },
  {
    id: '4',
    memberName: 'Emma Davis',
    memberId: 'FM-0753',
    checkIn: '09:14 AM',
    checkOut: '-',
    activity: 'Open gym',
    duration: '-',
    status: 'In progress',
  },
  {
    id: '5',
    memberName: 'Ethan Park',
    memberId: 'FM-1284',
    checkIn: '09:38 AM',
    checkOut: '-',
    activity: 'Strength floor',
    duration: '-',
    status: 'In progress',
  },
];

export default function AttendanceScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In progress':
        return '#10B981';
      case 'Completed':
        return '#4F46E5';
      case 'Checked out':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

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
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/dashboard')}>
              <Text style={styles.navItemText}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/members')}>
              <Text style={styles.navItemText}>Members</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
              <Text style={[styles.navItemText, styles.navItemTextActive]}>
                Attendance
              </Text>
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
        <ScrollView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Attendance & check-ins</Text>
              <Text style={styles.headerSubtitle}>
                Know who's here. Keep the club moving
              </Text>
            </View>
            <TouchableOpacity style={styles.exportButton}>
              <Text style={styles.exportButtonText}>Export attendance</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Checked in</Text>
              <Text style={styles.statNumber}>186</Text>
              <Text style={styles.statSubtitle}>24 today</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Currently in club</Text>
              <Text style={styles.statNumber}>42</Text>
              <Text style={styles.statSubtitle}>
                18% of 120-person capacity
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Average visit</Text>
              <Text style={styles.statNumber}>68 min</Text>
              <Text style={styles.statSubtitle}>Based on today's visits</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Class attendance</Text>
              <Text style={styles.statNumber}>94%</Text>
              <Text style={styles.statSubtitle}>86 attended, 4 no-shows</Text>
            </View>
          </View>

          {/* Member Check-in Section */}
          <View style={styles.checkInSection}>
            <Text style={styles.sectionTitle}>Member check-in</Text>
            <Text style={styles.sectionSubtitle}>
              Member ID, name or email
            </Text>

            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="FM-1042"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.qrButton}>
                <Text style={styles.qrButtonText}>Scan QR code</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.checkInButton}>
              <Text style={styles.checkInButtonText}>+ Check in</Text>
            </TouchableOpacity>
          </View>

          {/* Latest Check-in */}
          <View style={styles.latestCheckIn}>
            <Text style={styles.sectionTitle}>Latest check-in</Text>
            <View style={styles.checkInCard}>
              <View style={styles.checkInAvatar}>
                <Text style={styles.avatarText}>JL</Text>
              </View>
              <View style={styles.checkInDetails}>
                <Text style={styles.checkInName}>Jordan Lee</Text>
                <Text style={styles.checkInId}>FM-1042 • Performance</Text>
                <Text style={styles.checkInTime}>07:04 AM</Text>
              </View>
              <View style={styles.checkInStatus}>
                <Text style={styles.checkInStatusText}>Active</Text>
              </View>
            </View>
          </View>

          {/* Attendance Records */}
          <View style={styles.recordsSection}>
            <View style={styles.recordsHeader}>
              <Text style={styles.sectionTitle}>Attendance records</Text>
              <View style={styles.recordsTabs}>
                <TouchableOpacity style={[styles.recordsTab, styles.recordsTabActive]}>
                  <Text style={[styles.recordsTabText, styles.recordsTabTextActive]}>
                    Currently in club (42)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.recordsTab}>
                  <Text style={styles.recordsTabText}>Class attendance</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.searchRecordsContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search member or check-in"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.dateFilter}>
              <Text style={styles.dateText}>Today, Oct 20</Text>
              <Text style={styles.filterText}>All activities</Text>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.headerText}>MEMBER</Text>
              <Text style={styles.headerText}>CHECK IN</Text>
              <Text style={styles.headerText}>CHECK OUT</Text>
              <Text style={styles.headerText}>ACTIVITY</Text>
              <Text style={styles.headerText}>DURATION</Text>
              <Text style={styles.headerText}>STATUS</Text>
            </View>

            {/* Attendance List */}
            <View style={styles.attendanceList}>
              {mockAttendanceRecords.map((record) => (
                <View key={record.id} style={styles.attendanceCard}>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.avatarText}>
                        {record.memberName.split(' ').map((n) => n[0]).join('')}
                      </Text>
                    </View>
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>{record.memberName}</Text>
                      <Text style={styles.memberId}>{record.memberId}</Text>
                    </View>
                  </View>

                  <View style={styles.tableColumn}>
                    <Text style={styles.tableText}>{record.checkIn}</Text>
                  </View>

                  <View style={styles.tableColumn}>
                    <Text style={styles.tableText}>{record.checkOut}</Text>
                  </View>

                  <View style={styles.tableColumn}>
                    <Text style={styles.tableText}>{record.activity}</Text>
                  </View>

                  <View style={styles.tableColumn}>
                    <Text style={styles.tableText}>{record.duration}</Text>
                  </View>

                  <View style={styles.tableColumn}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(record.status) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(record.status) },
                        ]}
                      >
                        {record.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.footerText}>
              Showing 5 of 150 check-ins today
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>FORM ATHLETICS • Brooklyn</Text>
            <Text style={styles.footerPhone}>1234</Text>
          </View>
        </ScrollView>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  exportButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: width > 600 ? '23%' : '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  checkInSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#111827',
  },
  qrButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  qrButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkInButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkInButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  latestCheckIn: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  checkInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checkInAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  checkInDetails: {
    flex: 1,
  },
  checkInName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  checkInId: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkInTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  checkInStatus: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  checkInStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  recordsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  recordsHeader: {
    marginBottom: 16,
  },
  recordsTabs: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  recordsTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  recordsTabActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  recordsTabText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  recordsTabTextActive: {
    color: '#FFFFFF',
  },
  searchRecordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  dateFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterText: {
    fontSize: 13,
    color: '#6B7280',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attendanceList: {
    marginBottom: 16,
  },
  attendanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  memberId: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  tableColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  tableText: {
    fontSize: 12,
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerBrand: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerPhone: {
    fontSize: 12,
    color: '#6B7280',
  },
});
