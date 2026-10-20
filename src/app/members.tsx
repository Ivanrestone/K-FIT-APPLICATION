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

interface Member {
  id: string;
  name: string;
  email: string;
  membership: string;
  trainer: string;
  joinedDate: string;
  status: 'Active' | 'Pending' | 'Expired';
}

const mockMembers: Member[] = [
  {
    id: '1',
    name: 'Jordan Lee',
    email: 'jordan.lee@email.com',
    membership: 'Performance',
    trainer: 'Marcus Reed',
    joinedDate: 'Sep 01, 2026',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Sam Rivera',
    email: 'sam.rivera@email.com',
    membership: 'Elite',
    trainer: 'Marcus Reed',
    joinedDate: 'Aug 12, 2026',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Maya Patel',
    email: 'maya.patel@email.com',
    membership: 'Performance',
    trainer: 'Sofia Chen',
    joinedDate: 'Jul 04, 2026',
    status: 'Active',
  },
  {
    id: '4',
    name: 'Noah Williams',
    email: 'noah.w@email.com',
    membership: 'Essential',
    trainer: 'Unassigned',
    joinedDate: 'Oct 18, 2026',
    status: 'Pending',
  },
  {
    id: '5',
    name: 'Emma Davis',
    email: 'emma.davis@email.com',
    membership: 'Performance',
    trainer: 'Daniel Brooks',
    joinedDate: 'Jun 22, 2026',
    status: 'Active',
  },
];

export default function MembersScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = [
    { label: 'All', count: 1342 },
    { label: 'Active', count: 1284 },
    { label: 'Pending', count: 18 },
    { label: 'Expired', count: 40 },
  ];

  const filteredMembers = mockMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === 'All' || member.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#10B981';
      case 'Pending':
        return '#F59E0B';
      case 'Expired':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getMembershipColor = (membership: string) => {
    switch (membership) {
      case 'Performance':
        return '#4F46E5';
      case 'Elite':
        return '#7C3AED';
      case 'Essential':
        return '#059669';
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
            <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
              <Text style={[styles.navItemText, styles.navItemTextActive]}>
                Members
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/attendance')}>
              <Text style={styles.navItemText}>Attendance</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView style={styles.content}>
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.importButton}>
              <Text style={styles.importButtonText}>Import</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add member</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Members</Text>
            <Text style={styles.heroSubtitle}>
              Every member. Every milestone. One connected community.
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total members</Text>
              <Text style={styles.statNumber}>1,342</Text>
              <Text style={styles.statSubtitle}>Across all memberships</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Active</Text>
              <Text style={styles.statNumber}>1,284</Text>
              <Text style={styles.statSubtitle}>95.7% of all members</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Expiring this week</Text>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statSubtitleWarning}>
                Renewal outreach recommended
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>New this month</Text>
              <Text style={styles.statNumber}>48</Text>
              <Text style={styles.statSubtitle}>+14 from September</Text>
            </View>
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.label}
                style={[
                  styles.filterTab,
                  selectedFilter === filter.label && styles.filterTabActive,
                ]}
                onPress={() => setSelectedFilter(filter.label)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === filter.label && styles.filterTabTextActive,
                  ]}
                >
                  {filter.label} ({filter.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search members by name or email"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Member List Header */}
          <View style={styles.listHeader}>
            <Text style={styles.headerText}>MEMBER</Text>
            <Text style={styles.headerText}>MEMBERSHIP</Text>
            <Text style={styles.headerText}>TRAINER</Text>
            <Text style={styles.headerText}>JOINED</Text>
          </View>

          {/* Member List */}
          <View style={styles.memberList}>
            {filteredMembers.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.avatarText}>
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                </View>

                <View style={styles.memberColumn}>
                  <Text
                    style={[
                      styles.membershipText,
                      { color: getMembershipColor(member.membership) },
                    ]}
                  >
                    {member.membership}
                  </Text>
                </View>

                <View style={styles.memberColumn}>
                  <Text style={styles.trainerText}>{member.trainer}</Text>
                </View>

                <View style={styles.memberColumn}>
                  <Text style={styles.joinedText}>{member.joinedDate}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(member.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(member.status) },
                      ]}
                    >
                      {member.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
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
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
    marginBottom: 24,
  },
  importButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
  statSubtitleWarning: {
    fontSize: 11,
    color: '#F59E0B',
  },
  filterScroll: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterContainer: {
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterTabActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterTabText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  listHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  memberList: {
    paddingHorizontal: 20,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
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
  avatarText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  memberEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  memberColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  membershipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  trainerText: {
    fontSize: 13,
    color: '#374151',
  },
  joinedText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
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
});
