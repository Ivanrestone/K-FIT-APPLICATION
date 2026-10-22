import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TrainerBottomNav from '@/components/TrainerBottomNav';

export default function TrainerClientsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>MR</Text>
            </View>
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text style={styles.logout}>Logout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.subHeader}>
            <Text style={styles.brand}>FORM</Text>
            <Text style={styles.brandSubtitle}>FORM/Brooklyn</Text>
            <Text style={styles.brandClub}>Performance club</Text>
            <Text style={styles.date}>Tuesday, October 20, 2026</Text>
          </View>

          {/* Trainer Info */}
          <View style={styles.trainerInfo}>
            <Text style={styles.trainerInitials}>MR</Text>
            <Text style={styles.trainerLabel}>Trainer</Text>
          </View>

          {/* Page Title */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>My Clients</Text>
            <Text style={styles.pageSubtitle}>24 active clients</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Text style={styles.searchPlaceholder}>Search clients...</Text>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            <TouchableOpacity style={[styles.filterTab, styles.filterTabActive]}>
              <Text style={[styles.filterTabText, styles.filterTabTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterTab}>
              <Text style={styles.filterTabText}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterTab}>
              <Text style={styles.filterTabText}>Inactive</Text>
            </TouchableOpacity>
          </View>

          {/* Client List */}
          <View style={styles.section}>
            <View style={styles.clientList}>
              {/* Client 1 */}
              <TouchableOpacity style={styles.clientCard}>
                <View style={styles.clientHeader}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientInitials}>JL</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>Jordan Lee</Text>
                    <Text style={styles.clientId}>PM-1042</Text>
                    <Text style={styles.clientStatus}>Active</Text>
                  </View>
                  <Text style={styles.clientArrow}>›</Text>
                </View>
                <View style={styles.clientStats}>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>18</Text>
                    <Text style={styles.clientStatLabel}>Sessions</Text>
                  </View>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>70kg</Text>
                    <Text style={styles.clientStatLabel}>Squat PB</Text>
                  </View>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>92%</Text>
                    <Text style={styles.clientStatLabel}>Consistency</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Client 2 */}
              <TouchableOpacity style={styles.clientCard}>
                <View style={styles.clientHeader}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientInitials}>SJ</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>Sarah Johnson</Text>
                    <Text style={styles.clientId}>PM-1043</Text>
                    <Text style={styles.clientStatus}>Active</Text>
                  </View>
                  <Text style={styles.clientArrow}>›</Text>
                </View>
                <View style={styles.clientStats}>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>15</Text>
                    <Text style={styles.clientStatLabel}>Sessions</Text>
                  </View>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>-3.2kg</Text>
                    <Text style={styles.clientStatLabel}>Weight Loss</Text>
                  </View>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>85%</Text>
                    <Text style={styles.clientStatLabel}>Consistency</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Client 3 */}
              <TouchableOpacity style={styles.clientCard}>
                <View style={styles.clientHeader}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientInitials}>MC</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>Mike Chen</Text>
                    <Text style={styles.clientId}>PM-1044</Text>
                    <Text style={styles.clientStatus}>Active</Text>
                  </View>
                  <Text style={styles.clientArrow}>›</Text>
                </View>
                <View style={styles.clientStats}>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>20</Text>
                    <Text style={styles.clientStatLabel}>Sessions</Text>
                  </View>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>85kg</Text>
                    <Text style={styles.clientStatLabel}>Bench PB</Text>
                  </View>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>90%</Text>
                    <Text style={styles.clientStatLabel}>Consistency</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Client 4 */}
              <TouchableOpacity style={styles.clientCard}>
                <View style={styles.clientHeader}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientInitials}>ED</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>Emily Davis</Text>
                    <Text style={styles.clientId}>PM-1045</Text>
                    <Text style={styles.clientStatus}>Active</Text>
                  </View>
                  <Text style={styles.clientArrow}>›</Text>
                </View>
                <View style={styles.clientStats}>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>12</Text>
                    <Text style={styles.clientStatLabel}>Sessions</Text>
                  </View>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>+5kg</Text>
                    <Text style={styles.clientStatLabel}>Weight Gain</Text>
                  </View>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>88%</Text>
                    <Text style={styles.clientStatLabel}>Consistency</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Client 5 */}
              <TouchableOpacity style={styles.clientCard}>
                <View style={styles.clientHeader}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientInitials}>TW</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>Tom Wilson</Text>
                    <Text style={styles.clientId}>PM-1046</Text>
                    <Text style={styles.clientStatus}>Active</Text>
                  </View>
                  <Text style={styles.clientArrow}>›</Text>
                </View>
                <View style={styles.clientStats}>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>16</Text>
                    <Text style={styles.clientStatLabel}>Sessions</Text>
                  </View>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>100kg</Text>
                    <Text style={styles.clientStatLabel}>Deadlift PB</Text>
                  </View>
                  <View style={styles.clientStat}>
                    <Text style={styles.clientStatNumber}>95%</Text>
                    <Text style={styles.clientStatLabel}>Consistency</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add Client Button */}
          <TouchableOpacity style={styles.addClientButton}>
            <Text style={styles.addClientButtonText}>+ Add New Client</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerName}>Marcus Reed</Text>
            <Text style={styles.footerLabel}>Trainer</Text>
            <Text style={styles.footerBrand}>FORM ATHLETICS/TRAINER WORKSPACE</Text>
          </View>
        </ScrollView>
        <TrainerBottomNav activeRoute="/trainer-clients" />
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
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logout: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  brand: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  brandClub: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  trainerInfo: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trainerInitials: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
  },
  trainerLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  pageHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  searchBar: {
    marginHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  filterTabActive: {
    backgroundColor: '#4F46E5',
  },
  filterTabText: {
    fontSize: 13,
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  clientList: {
    gap: 12,
  },
  clientCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  clientId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  clientStatus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  clientArrow: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  clientStats: {
    flexDirection: 'row',
    gap: 16,
  },
  clientStat: {
    flex: 1,
  },
  clientStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  clientStatLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  addClientButton: {
    marginHorizontal: 20,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  addClientButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  footerLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerBrand: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
