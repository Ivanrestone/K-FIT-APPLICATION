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

interface Invoice {
  id: string;
  invoiceId: string;
  memberName: string;
  description: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceId: 'INV-261042',
    memberName: 'Jordan Lee',
    description: 'Performance October',
    date: 'Oct 01, 2026',
    amount: 89,
    status: 'Paid',
  },
  {
    id: '2',
    invoiceId: 'INV-261188',
    memberName: 'Sam Rivera',
    description: 'Elite October',
    date: 'Oct 12, 2026',
    amount: 149,
    status: 'Paid',
  },
  {
    id: '3',
    invoiceId: 'INV-261341',
    memberName: 'Noah Williams',
    description: 'Essential October',
    date: 'Oct 18, 2026',
    amount: 49,
    status: 'Pending',
  },
  {
    id: '4',
    invoiceId: 'INV-261085',
    memberName: 'Maya Patel',
    description: 'Performance October',
    date: 'Oct 04, 2026',
    amount: 89,
    status: 'Paid',
  },
  {
    id: '5',
    invoiceId: 'INV-261064',
    memberName: 'Liam Wilson',
    description: 'Essential October',
    date: 'Oct 15, 2026',
    amount: 49,
    status: 'Overdue',
  },
];

export default function PaymentsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All statuses');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return '#10B981';
      case 'Pending':
        return '#F59E0B';
      case 'Overdue':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All statuses' || invoice.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/payments" />

        {/* Main Content */}
        <ScrollView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Payments & revenue</Text>
              <Text style={styles.headerSubtitle}>
                A clear view of your club's financial performance.
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.exportButton}>
                <Text style={styles.exportButtonText}>Export</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton}>
                <Text style={styles.createButtonText}>+ Create invoice</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Overview Stats */}
          <View style={styles.overviewSection}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Revenue this month</Text>
                <Text style={styles.statNumber}>$48,920</Text>
                <Text style={styles.statChange}>+12.8% vs. September</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Collected payments</Text>
                <Text style={styles.statNumber}>548</Text>
                <Text style={styles.statSubtitle}>97.4% collection rate</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Pending payments</Text>
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statSubtitle}>invoices awaiting payment</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Overdue</Text>
                <Text style={styles.statNumber}>4</Text>
                <Text style={styles.statSubtitleWarning}>invoices sent reminders</Text>
              </View>
            </View>
          </View>

          {/* Revenue Overview */}
          <View style={styles.revenueSection}>
            <View style={styles.revenueHeader}>
              <Text style={styles.sectionTitle}>Revenue overview</Text>
              <Text style={styles.revenuePeriod}>Last 6 months</Text>
            </View>
            <View style={styles.chartCard}>
              <View style={styles.chartPlaceholder}>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: '40%' }]} />
                  <Text style={styles.barLabel}>May</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: '55%' }]} />
                  <Text style={styles.barLabel}>Jun</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: '45%' }]} />
                  <Text style={styles.barLabel}>Jul</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: '70%' }]} />
                  <Text style={styles.barLabel}>Aug</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: '60%' }]} />
                  <Text style={styles.barLabel}>Sep</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, styles.barActive, { height: '85%' }]} />
                  <Text style={styles.barLabel}>Oct</Text>
                </View>
              </View>
              <View style={styles.revenueTotal}>
                <Text style={styles.revenueTotalLabel}>$48,920</Text>
                <Text style={styles.revenueTotalSublabel}>this month</Text>
              </View>
            </View>
          </View>

          {/* Revenue Mix */}
          <View style={styles.mixSection}>
            <Text style={styles.sectionTitle}>Revenue mix</Text>
            <Text style={styles.mixPeriod}>October 2026</Text>
            <View style={styles.mixGrid}>
              <View style={styles.mixCard}>
                <View style={styles.mixIconContainer}>
                  <Text style={styles.mixIcon}>👥</Text>
                </View>
                <Text style={styles.mixLabel}>Memberships</Text>
                <Text style={styles.mixAmount}>$37,840</Text>
                <View style={styles.mixBar}>
                  <View style={[styles.mixBarFill, { width: '78%' }]} />
                </View>
                <Text style={styles.mixPercentage}>78%</Text>
              </View>

              <View style={styles.mixCard}>
                <View style={styles.mixIconContainer}>
                  <Text style={styles.mixIcon}>💪</Text>
                </View>
                <Text style={styles.mixLabel}>Personal training</Text>
                <Text style={styles.mixAmount}>$8,400</Text>
                <View style={styles.mixBar}>
                  <View style={[styles.mixBarFill, { width: '17%' }]} />
                </View>
                <Text style={styles.mixPercentage}>17%</Text>
              </View>

              <View style={styles.mixCard}>
                <View style={styles.mixIconContainer}>
                  <Text style={styles.mixIcon}>🏪</Text>
                </View>
                <Text style={styles.mixLabel}>Day passes & retail</Text>
                <Text style={styles.mixAmount}>$2,680</Text>
                <View style={styles.mixBar}>
                  <View style={[styles.mixBarFill, { width: '5%' }]} />
                </View>
                <Text style={styles.mixPercentage}>5%</Text>
              </View>
            </View>
          </View>

          {/* Next Payout */}
          <View style={styles.payoutSection}>
            <View style={styles.payoutCard}>
              <View style={styles.payoutLeft}>
                <Text style={styles.payoutLabel}>Next payout</Text>
                <Text style={styles.payoutDate}>Oct 22, 2026</Text>
              </View>
              <View style={styles.payoutRight}>
                <Text style={styles.payoutAmount}>$25k</Text>
              </View>
            </View>
          </View>

          {/* Search and Filters */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search Invoice or member"
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
                style={[styles.filterTab, selectedStatus === 'Paid' && styles.filterTabActive]}
                onPress={() => setSelectedStatus('Paid')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedStatus === 'Paid' && styles.filterTabTextActive,
                  ]}
                >
                  Paid
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
                style={[styles.filterTab, selectedStatus === 'Overdue' && styles.filterTabActive]}
                onPress={() => setSelectedStatus('Overdue')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedStatus === 'Overdue' && styles.filterTabTextActive,
                  ]}
                >
                  Overdue
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Invoice Table Header */}
          <View style={styles.listHeader}>
            <Text style={styles.headerText}>INVOICE</Text>
            <Text style={styles.headerText}>MEMBER</Text>
            <Text style={styles.headerText}>DESCRIPTION</Text>
            <Text style={styles.headerText}>DATE</Text>
            <Text style={styles.headerText}>AMOUNT</Text>
            <Text style={styles.headerText}>STATUS</Text>
          </View>

          {/* Invoice List */}
          <View style={styles.invoiceList}>
            {filteredInvoices.map((invoice) => (
              <View key={invoice.id} style={styles.invoiceCard}>
                <View style={styles.invoiceColumn}>
                  <Text style={styles.invoiceId}>{invoice.invoiceId}</Text>
                </View>

                <View style={styles.invoiceColumn}>
                  <Text style={styles.memberName}>{invoice.memberName}</Text>
                </View>

                <View style={styles.invoiceColumn}>
                  <Text style={styles.description}>{invoice.description}</Text>
                </View>

                <View style={styles.invoiceColumn}>
                  <Text style={styles.invoiceDate}>{invoice.date}</Text>
                </View>

                <View style={styles.invoiceColumn}>
                  <Text style={styles.amount}>${invoice.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.invoiceColumn}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(invoice.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(invoice.status) },
                      ]}
                    >
                      {invoice.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.footerText}>
            Showing 1-5 of 562 invoices
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>FORM ATHLETICS/ADMINISTRATOR WORKSPACE</Text>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
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
  createButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
  statChange: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  statSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  statSubtitleWarning: {
    fontSize: 11,
    color: '#F59E0B',
  },
  revenueSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  revenuePeriod: {
    fontSize: 12,
    color: '#6B7280',
  },
  chartCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chartPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 4,
    marginBottom: 16,
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
    marginTop: 6,
  },
  revenueTotal: {
    alignItems: 'center',
  },
  revenueTotalLabel: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  revenueTotalSublabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  mixSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  mixPeriod: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  mixGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  mixCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mixIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mixIcon: {
    fontSize: 20,
  },
  mixLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  mixAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  mixBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
  },
  mixBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },
  mixPercentage: {
    fontSize: 11,
    color: '#6B7280',
  },
  payoutSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  payoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 20,
  },
  payoutLeft: {
    flex: 1,
  },
  payoutLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  payoutDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  payoutRight: {
    alignItems: 'flex-end',
  },
  payoutAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  invoiceList: {
    paddingHorizontal: 20,
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  invoiceColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  invoiceId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
  },
  invoiceDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  amount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
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
