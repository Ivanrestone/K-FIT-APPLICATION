import Sidebar from '@/components/Sidebar';
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

interface Trainer {
  id: string;
  name: string;
  specialization: string;
  certification: string;
  assignedClients: string;
  totalClients: number;
  availability: string;
  nextAvailable: string;
  status: 'Available' | 'Fully booked' | 'In session';
}

const mockTrainers: Trainer[] = [
  {
    id: '1',
    name: 'Marcus Reed',
    specialization: 'Strength & conditioning',
    certification: 'NASM-CPT',
    assignedClients: '18/22',
    totalClients: 22,
    availability: 'Mon-Fri 6 AM-8 PM',
    nextAvailable: 'Available',
    status: 'Available',
  },
  {
    id: '2',
    name: 'Sofia Chen',
    specialization: 'Mobility & functional fitness',
    certification: 'ACE',
    assignedClients: '16/20',
    totalClients: 20,
    availability: 'Tue-Sat 7 AM-6 PM',
    nextAvailable: 'Available',
    status: 'Available',
  },
  {
    id: '3',
    name: 'Daniel Brooks',
    specialization: 'Endurance & athletic performance',
    certification: 'CSCS',
    assignedClients: '20/24',
    totalClients: 24,
    availability: 'Mon-Fri 8 AM-9 PM',
    nextAvailable: 'Available',
    status: 'Available',
  },
  {
    id: '4',
    name: 'Olivia James',
    specialization: 'Pilates & recovery',
    certification: 'ACE',
    assignedClients: '14/18',
    totalClients: 18,
    availability: 'Wed Oct 21 9 AM',
    nextAvailable: 'Wed Oct 21 9 AM',
    status: 'Available',
  },
  {
    id: '5',
    name: 'James Carter',
    specialization: 'Strength & hypertrophy',
    certification: 'NASM',
    assignedClients: '24/24',
    totalClients: 24,
    availability: 'Thu Oct 22 2 PM',
    nextAvailable: 'Thu Oct 22 2 PM',
    status: 'Fully booked',
  },
];

export default function TrainersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All specializations');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return '#10B981';
      case 'Fully booked':
        return '#EF4444';
      case 'In session':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const filteredTrainers = mockTrainers.filter((trainer) => {
    const matchesSearch =
      trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/trainers" />

        {/* Main Content */}
        <ScrollView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>The coaching team</Text>
              <Text style={styles.headerSubtitle}>
                Expert people. Personal progress. Manage your club's coaching capacity
              </Text>
            </View>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add trainer</Text>
            </TouchableOpacity>
          </View>

          {/* Overview Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total trainers</Text>
              <Text style={styles.statNumber}>12</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Available today</Text>
              <Text style={styles.statNumber}>8</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Assigned clients</Text>
              <Text style={styles.statNumber}>186</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Sessions this week</Text>
              <Text style={styles.statNumber}>94</Text>
            </View>
          </View>

          {/* Trainer Capacity */}
          <View style={styles.capacitySection}>
            <Text style={styles.sectionTitle}>Trainers</Text>
            <View style={styles.capacityGrid}>
              <View style={styles.capacityCard}>
                <Text style={styles.capacityLabel}>10 full-time</Text>
                <Text style={styles.capacityLabel}>2 part-time</Text>
                <Text style={styles.capacityHighlight}>4 currently in sessions</Text>
              </View>

              <View style={styles.capacityCard}>
                <Text style={styles.capacityLabel}>Members</Text>
                <Text style={styles.capacityNumber}>15.5</Text>
                <Text style={styles.capacitySublabel}>clients per trainer</Text>
              </View>

              <View style={styles.capacityCard}>
                <Text style={styles.capacityLabel}>28 coaching hours</Text>
                <Text style={styles.capacityHighlight}>available</Text>
              </View>
            </View>
          </View>

          {/* Search and Filters */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search trainers by name or specialization"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContainer}
            >
              <TouchableOpacity
                style={[styles.filterTab, styles.filterTabActive]}
              >
                <Text style={[styles.filterTabText, styles.filterTabTextActive]}>
                  All specializations
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterTab}>
                <Text style={styles.filterTabText}>Availability</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterTab}>
                <Text style={styles.filterTabText}>Available</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterTab}>
                <Text style={styles.filterTabText}>Attendance</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterTab}>
                <Text style={styles.filterTabText}>Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterTab}>
                <Text style={styles.filterTabText}>Settings</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Trainer List Header */}
          <View style={styles.listHeader}>
            <Text style={styles.headerText}>TRAINER</Text>
            <Text style={styles.headerText}>SPECIALIZATION</Text>
            <Text style={styles.headerText}>CLIENTS</Text>
            <Text style={styles.headerText}>NEXT AVAILABLE</Text>
            <Text style={styles.headerText}>STATUS</Text>
          </View>

          {/* Trainer List */}
          <View style={styles.trainerList}>
            {filteredTrainers.map((trainer) => (
              <View key={trainer.id} style={styles.trainerCard}>
                <View style={styles.trainerInfo}>
                  <View style={styles.trainerAvatar}>
                    <Text style={styles.avatarText}>
                      {trainer.name.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.trainerDetails}>
                    <Text style={styles.trainerName}>{trainer.name}</Text>
                    <Text style={styles.trainerCertification}>
                      {trainer.certification}
                    </Text>
                  </View>
                </View>

                <View style={styles.trainerColumn}>
                  <Text style={styles.specializationText}>
                    {trainer.specialization}
                  </Text>
                </View>

                <View style={styles.trainerColumn}>
                  <Text style={styles.clientsText}>
                    {trainer.assignedClients} clients
                  </Text>
                  <Text style={styles.weekText}>This week</Text>
                </View>

                <View style={styles.trainerColumn}>
                  <Text style={styles.availableText}>{trainer.nextAvailable}</Text>
                  <Text style={styles.weekText}>{trainer.availability}</Text>
                </View>

                <View style={styles.trainerColumn}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(trainer.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(trainer.status) },
                      ]}
                    >
                      {trainer.status}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.viewProfileButton}>
                    <Text style={styles.viewProfileText}>View trainer profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.footerText}>
            Showing 5 of 12 trainers • View full roster
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>FORM ATHLETICS • ADMINISTRATOR WORKSPACE</Text>
            <Text style={styles.footerPhone}>123</Text>
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
  addButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  },
  capacitySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  capacityGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  capacityCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  capacityLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  capacityNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  capacitySublabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  capacityHighlight: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
    marginTop: 4,
  },
  searchSection: {
    paddingHorizontal: 20,
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
    marginBottom: 16,
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
  filterScroll: {
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
  trainerList: {
    paddingHorizontal: 20,
  },
  trainerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  trainerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  trainerDetails: {
    flex: 1,
  },
  trainerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  trainerCertification: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  trainerColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  specializationText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  clientsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  weekText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  availableText: {
    fontSize: 12,
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  viewProfileButton: {
    marginTop: 4,
  },
  viewProfileText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '500',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
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
