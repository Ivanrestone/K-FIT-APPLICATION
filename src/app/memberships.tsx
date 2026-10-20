import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Subscription {
  id: string;
  memberName: string;
  subscriptionId: string;
  plan: string;
  amount: number;
  nextBilling: string;
  status: 'Active' | 'Expiring' | 'Pending' | 'Expired';
}

const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    memberName: 'Jordan Lee',
    subscriptionId: 'SUB-1042',
    plan: 'Standard',
    amount: 45,
    nextBilling: 'Nov 01, 2026',
    status: 'Active',
  },
  {
    id: '2',
    memberName: 'Sam Rivera',
    subscriptionId: 'SUB-0988',
    plan: 'Premium',
    amount: 75,
    nextBilling: 'Nov 12, 2026',
    status: 'Active',
  },
  {
    id: '3',
    memberName: 'Maya Patel',
    subscriptionId: 'SUB-0851',
    plan: 'Standard',
    amount: 45,
    nextBilling: 'Oct 24, 2026',
    status: 'Expiring',
  },
  {
    id: '4',
    memberName: 'Noah Williams',
    subscriptionId: 'SUB-1341',
    plan: 'Basic',
    amount: 35,
    nextBilling: 'Oct 15, 2026',
    status: 'Pending',
  },
  {
    id: '5',
    memberName: 'Liam Wilson',
    subscriptionId: 'SUB-0642',
    plan: 'Basic',
    amount: 35,
    nextBilling: 'Oct 15, 2026',
    status: 'Active',
  },
];

export default function MembershipsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All plans');
  const [selectedStatus, setSelectedStatus] = useState('All statuses');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [newAmount, setNewAmount] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#10B981';
      case 'Expiring':
        return '#F59E0B';
      case 'Pending':
        return '#6366F1';
      case 'Expired':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setNewAmount(subscription.amount.toString());
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editingSubscription) return;

    const amountNum = parseFloat(newAmount);
    if (isNaN(amountNum) || amountNum < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid dollar amount.');
      return;
    }

    Alert.alert(
      'Subscription Updated',
      `${editingSubscription.memberName}'s subscription amount has been changed from $${editingSubscription.amount} to $${amountNum}.`
    );

    setEditModalVisible(false);
    setEditingSubscription(null);
    setNewAmount('');
  };

  const filteredSubscriptions = mockSubscriptions.filter((sub) => {
    const matchesSearch =
      sub.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.subscriptionId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = selectedFilter === 'All plans' || sub.plan === selectedFilter;
    const matchesStatus = selectedStatus === 'All statuses' || sub.status === selectedStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

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
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/attendance')}>
              <Text style={styles.navItemText}>Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/trainers')}>
              <Text style={styles.navItemText}>Trainers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
              <Text style={[styles.navItemText, styles.navItemTextActive]}>
                Memberships
              </Text>
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
              <Text style={styles.headerTitle}>Memberships</Text>
              <Text style={styles.headerSubtitle}>
                Flexible plans. Lasting commitment. Manage what membership means at FORM
              </Text>
            </View>
          </View>

          {/* Overview Stats */}
          <View style={styles.overviewSection}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewLabel}>Plans & subscriptions</Text>
                <Text style={styles.overviewNumber}>28</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewLabel}>Renewals</Text>
                <Text style={styles.overviewNumber}>12</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewLabel}>Archived plans</Text>
                <Text style={styles.overviewNumber}>5</Text>
              </View>
            </View>
          </View>


          {/* Revenue Summary */}
          <View style={styles.revenueSection}>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>1,284 active</Text>
              <Text style={styles.revenueAmount}>$48,920</Text>
              <Text style={styles.revenueSublabel}>monthly revenue</Text>
            </View>
          </View>

          {/* Search and Filters */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search member or subscription ID"
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
                style={[styles.filterTab, selectedFilter === 'All plans' && styles.filterTabActive]}
                onPress={() => setSelectedFilter('All plans')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === 'All plans' && styles.filterTabTextActive,
                  ]}
                >
                  All plans
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, selectedFilter === 'Basic' && styles.filterTabActive]}
                onPress={() => setSelectedFilter('Basic')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === 'Basic' && styles.filterTabTextActive,
                  ]}
                >
                  Basic
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, selectedFilter === 'Standard' && styles.filterTabActive]}
                onPress={() => setSelectedFilter('Standard')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === 'Standard' && styles.filterTabTextActive,
                  ]}
                >
                  Standard
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, selectedFilter === 'Premium' && styles.filterTabActive]}
                onPress={() => setSelectedFilter('Premium')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === 'Premium' && styles.filterTabTextActive,
                  ]}
                >
                  Premium
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContainer}
            >
              <TouchableOpacity
                style={[styles.filterTab, selectedStatus === 'All statuses' && styles.filterTabActive]}
                onPress={() => setSelectedStatus('All statuses')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedStatus === 'All statuses' && styles.filterTabTextActive,
                  ]}
                >
                  All statuses
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, selectedStatus === 'Active' && styles.filterTabActive]}
                onPress={() => setSelectedStatus('Active')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedStatus === 'Active' && styles.filterTabTextActive,
                  ]}
                >
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, selectedStatus === 'Expiring' && styles.filterTabActive]}
                onPress={() => setSelectedStatus('Expiring')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedStatus === 'Expiring' && styles.filterTabTextActive,
                  ]}
                >
                  Expiring
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, selectedStatus === 'Pending' && styles.filterTabActive]}
                onPress={() => setSelectedStatus('Pending')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedStatus === 'Pending' && styles.filterTabTextActive,
                  ]}
                >
                  Pending
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, selectedStatus === 'Expired' && styles.filterTabActive]}
                onPress={() => setSelectedStatus('Expired')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedStatus === 'Expired' && styles.filterTabTextActive,
                  ]}
                >
                  Expired
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Subscription Table Header */}
          <View style={styles.listHeader}>
            <Text style={styles.headerText}>MEMBER</Text>
            <Text style={styles.headerText}>PLAN</Text>
            <Text style={styles.headerText}>AMOUNT</Text>
            <Text style={styles.headerText}>NEXT BILLING</Text>
            <Text style={styles.headerText}>STATUS</Text>
            <Text style={styles.headerText}>ACTION</Text>
          </View>

          {/* Subscription List */}
          <View style={styles.subscriptionList}>
            {filteredSubscriptions.map((subscription) => (
              <View key={subscription.id} style={styles.subscriptionCard}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.avatarText}>
                      {subscription.memberName.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{subscription.memberName}</Text>
                    <Text style={styles.subscriptionId}>{subscription.subscriptionId}</Text>
                  </View>
                </View>

                <View style={styles.tableColumn}>
                  <Text style={styles.planText}>{subscription.plan}</Text>
                </View>

                <View style={styles.tableColumn}>
                  <Text style={styles.amountText}>${subscription.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.tableColumn}>
                  <Text style={styles.billingText}>{subscription.nextBilling}</Text>
                </View>

                <View style={styles.tableColumn}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(subscription.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(subscription.status) },
                      ]}
                    >
                      {subscription.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.tableColumn}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditSubscription(subscription)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.footerText}>
            Showing 1-5 of 1,342 subscriptions
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>FORM ATHLETICS/ADMINISTRATOR WORKSPACE</Text>
            <Text style={styles.footerPhone}>123</Text>
          </View>
        </ScrollView>
      </View>

      {/* Edit Subscription Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Subscription</Text>
            {editingSubscription && (
              <>
                <Text style={styles.modalSubtitle}>
                  {editingSubscription.memberName} - {editingSubscription.plan}
                </Text>
                <Text style={styles.modalLabel}>Current amount: ${editingSubscription.amount}</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>New amount ($)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newAmount}
                    onChangeText={setNewAmount}
                    keyboardType="decimal-pad"
                    placeholder="Enter new amount"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={handleSaveEdit}
                  >
                    <Text style={styles.modalSaveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  overviewSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  plansSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  plansGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  planCardPopular: {
    borderColor: '#4F46E5',
    borderWidth: 2,
  },
  popularBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 4,
  },
  planSubscribers: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 12,
  },
  planFeatures: {
    marginBottom: 12,
  },
  planFeature: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 4,
  },
  editPlanButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  editPlanButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  revenueSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  revenueCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 20,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  revenueSublabel: {
    fontSize: 12,
    color: '#6B7280',
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
    marginBottom: 12,
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
  subscriptionList: {
    paddingHorizontal: 20,
  },
  subscriptionCard: {
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
  subscriptionId: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  tableColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  planText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  amountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  billingText: {
    fontSize: 12,
    color: '#6B7280',
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
  editButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: width > 600 ? 400 : '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalInput: {
    height: 44,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
