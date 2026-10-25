import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type InvoiceStatus = "Paid" | "Pending" | "Overdue";
type PaymentMethod = "Google Pay" | "NFC Card Tap" | "Cash";

interface Invoice {
  id: string;
  invoiceId: string;
  memberName: string;
  description: string;
  date: string;
  amount: number;
  status: InvoiceStatus;
}

interface PosItem {
  id: string;
  title: string;
  subtitle: string;
  price: number;
}

interface Receipt {
  txId: string;
  item: string;
  method: string;
  amount: number;
}

const POS_ITEMS: PosItem[] = [
  {
    id: "vip",
    title: "Monthly VIP Unlimited Membership",
    subtitle: "All-gym access + sauna",
    price: 45,
  },
  {
    id: "whey",
    title: "Whey Isolate Protein (2kg tub)",
    subtitle: "Nutrition store supplement",
    price: 35,
  },
  {
    id: "pt",
    title: "1-on-1 Personal Training Session",
    subtitle: "60-min master class voucher",
    price: 60,
  },
  {
    id: "shake",
    title: "Pre-Workout Energy Shake",
    subtitle: "Smoothie bar daily special",
    price: 6.5,
  },
];

const PAYMENT_METHODS: { method: PaymentMethod; label: string }[] = [
  { method: "Google Pay", label: "📱 Google Pay" },
  { method: "NFC Card Tap", label: "💳 Credit card NFC" },
];

const initialInvoices: Invoice[] = [
  {
    id: "1",
    invoiceId: "INV-261042",
    memberName: "Jordan Lee",
    description: "Performance October",
    date: "Oct 01, 2026",
    amount: 89,
    status: "Paid",
  },
  {
    id: "2",
    invoiceId: "INV-261188",
    memberName: "Sam Rivera",
    description: "Elite October",
    date: "Oct 12, 2026",
    amount: 149,
    status: "Paid",
  },
  {
    id: "3",
    invoiceId: "INV-261341",
    memberName: "Noah Williams",
    description: "Essential October",
    date: "Oct 18, 2026",
    amount: 49,
    status: "Pending",
  },
  {
    id: "4",
    invoiceId: "INV-261085",
    memberName: "Maya Patel",
    description: "Performance October",
    date: "Oct 04, 2026",
    amount: 89,
    status: "Paid",
  },
  {
    id: "5",
    invoiceId: "INV-261064",
    memberName: "Liam Wilson",
    description: "Essential October",
    date: "Oct 15, 2026",
    amount: 49,
    status: "Overdue",
  },
];

const makeTxId = () => `#KF-${Math.floor(100000 + Math.random() * 900000)}`;

const todayLabel = () =>
  new Date()
    .toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
    .replace(/^(\w+) (\d+), (\d+)$/, "$1 $2, $3");

export default function PaymentsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All statuses");
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);

  // POS state
  const [selectedItem, setSelectedItem] = useState<PosItem>(POS_ITEMS[0]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return KFitColors.accent;
      case "Pending":
        return KFitColors.warning;
      case "Overdue":
        return KFitColors.error;
      default:
        return KFitColors.mutedText;
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "All statuses" || invoice.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const outstandingInvoices = invoices.filter((i) => i.status !== "Paid");

  // ---- POS actions ----
  const processPosPayment = (method: PaymentMethod) => {
    const txId = makeTxId();

    setReceipt({
      txId,
      item: selectedItem.title,
      method,
      amount: selectedItem.price,
    });

    // Record the sale in the invoice list as a paid walk-in invoice
    setInvoices((prev) => [
      {
        id: `pos-${txId}`,
        invoiceId: `INV-${txId.replace("#KF-", "")}`,
        memberName: "Walk-in (POS)",
        description: selectedItem.title,
        date: todayLabel(),
        amount: selectedItem.price,
        status: "Paid",
      },
      ...prev,
    ]);
  };

  const remindMemberDues = (invoice: Invoice) => {
    Alert.alert(
      "Reminder sent",
      `Payment reminder sent to ${invoice.memberName}.`,
    );
  };

  const collectMemberDues = (invoice: Invoice) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === invoice.id ? { ...i, status: "Paid" } : i)),
    );
    setReceipt({
      txId: makeTxId(),
      item: `${invoice.description} (${invoice.memberName})`,
      method: "Collected at desk",
      amount: invoice.amount,
    });
  };

  const downloadReceipt = () => {
    // Replace with expo-print + expo-sharing to generate a real PDF
    Alert.alert("Receipt", "Downloading PDF receipt to storage...");
    setReceipt(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/payments" />

        {/* Header + scrollable content */}
        <View style={styles.main}>
          <AppHeader />

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Page title */}
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
                  <Text style={styles.statNumber}>
                    {invoices.filter((i) => i.status === "Pending").length}
                  </Text>
                  <Text style={styles.statSubtitle}>
                    invoices awaiting payment
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Overdue</Text>
                  <Text style={styles.statNumber}>
                    {invoices.filter((i) => i.status === "Overdue").length}
                  </Text>
                  <Text style={styles.statSubtitleWarning}>
                    invoices sent reminders
                  </Text>
                </View>
              </View>
            </View>

            {/* POS Terminal */}
            <View style={styles.posSection}>
              <View style={styles.posCard}>
                <View style={styles.posHeader}>
                  <View>
                    <Text style={styles.eyebrow}>REGISTER COUNTER</Text>
                    <Text style={styles.posTitle}>POS terminal</Text>
                  </View>
                  <View style={styles.nfcBadge}>
                    <Text style={styles.nfcBadgeText}>NFC TAP READY 💳</Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>
                  SELECT ITEMS OR CONCESSIONS
                </Text>
                <View style={styles.posItems}>
                  {POS_ITEMS.map((item) => {
                    const active = item.id === selectedItem.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedItem(item)}
                        style={[styles.posItem, active && styles.posItemActive]}
                      >
                        <View style={styles.posItemText}>
                          <Text style={styles.posItemTitle}>{item.title}</Text>
                          <Text style={styles.posItemSubtitle}>
                            {item.subtitle}
                          </Text>
                        </View>
                        <Text style={styles.posItemPrice}>
                          ${item.price.toFixed(2)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Checkout total */}
                <View style={styles.totalBanner}>
                  <View style={styles.posItemText}>
                    <Text style={styles.totalLabel}>Checkout total</Text>
                    <Text style={styles.totalItem} numberOfLines={1}>
                      {selectedItem.title}
                    </Text>
                  </View>
                  <Text style={styles.totalAmount}>
                    ${selectedItem.price.toFixed(2)}
                  </Text>
                </View>

                {/* Payment methods */}
                <View style={styles.payRow}>
                  {PAYMENT_METHODS.map(({ method, label }) => (
                    <TouchableOpacity
                      key={method}
                      activeOpacity={0.8}
                      style={styles.payButton}
                      onPress={() => processPosPayment(method)}
                    >
                      <Text style={styles.payButtonText}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.cashButton}
                  onPress={() => processPosPayment("Cash")}
                >
                  <Text style={styles.cashButtonText}>
                    💵 Complete cash transaction
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Outstanding Invoices */}
            <View style={styles.outstandingSection}>
              <View style={styles.outstandingCard}>
                <View style={styles.outstandingHeader}>
                  <Text style={styles.outstandingTitle}>
                    Outstanding invoices
                  </Text>
                  <Text style={styles.outstandingCount}>
                    {outstandingInvoices.length} pending
                  </Text>
                </View>

                {outstandingInvoices.length === 0 ? (
                  <Text style={styles.emptyText}>
                    All invoices are settled. 🎉
                  </Text>
                ) : (
                  outstandingInvoices.map((invoice) => (
                    <View key={invoice.id} style={styles.dueRow}>
                      <View style={styles.posItemText}>
                        <Text style={styles.dueName}>{invoice.memberName}</Text>
                        <Text
                          style={[
                            styles.dueMeta,
                            { color: getStatusColor(invoice.status) },
                          ]}
                        >
                          {invoice.status} • {invoice.description} • $
                          {invoice.amount.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.dueActions}>
                        <TouchableOpacity
                          style={styles.remindButton}
                          onPress={() => remindMemberDues(invoice)}
                        >
                          <Text style={styles.remindText}>Remind</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.collectButton}
                          onPress={() => collectMemberDues(invoice)}
                        >
                          <Text style={styles.collectText}>Collect</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Revenue Overview */}
            <View style={styles.revenueSection}>
              <View style={styles.revenueHeader}>
                <Text style={styles.sectionTitleInline}>Revenue overview</Text>
                <Text style={styles.revenuePeriod}>Last 6 months</Text>
              </View>
              <View style={styles.chartCard}>
                <View style={styles.chartPlaceholder}>
                  {[
                    { label: "May", h: "40%" },
                    { label: "Jun", h: "55%" },
                    { label: "Jul", h: "45%" },
                    { label: "Aug", h: "70%" },
                    { label: "Sep", h: "60%" },
                    { label: "Oct", h: "85%", active: true },
                  ].map((b) => (
                    <View key={b.label} style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          b.active && styles.barActive,
                          { height: b.h as `${number}%` },
                        ]}
                      />
                      <Text style={styles.barLabel}>{b.label}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.revenueTotal}>
                  <Text style={styles.revenueTotalLabel}>$48,920</Text>
                  <Text style={styles.revenueTotalSublabel}>this month</Text>
                </View>
              </View>
            </View>

            {/* Revenue Mix */}
            <View style={styles.mixSection}>
              <Text style={styles.sectionTitleTight}>Revenue mix</Text>
              <Text style={styles.mixPeriod}>October 2026</Text>
              <View style={styles.mixGrid}>
                {[
                  {
                    icon: "👥",
                    label: "Memberships",
                    amount: "$37,840",
                    pct: 78,
                  },
                  {
                    icon: "💪",
                    label: "Personal training",
                    amount: "$8,400",
                    pct: 17,
                  },
                  {
                    icon: "🏪",
                    label: "Day passes & retail",
                    amount: "$2,680",
                    pct: 5,
                  },
                ].map((m) => (
                  <View key={m.label} style={styles.mixCard}>
                    <View style={styles.mixIconContainer}>
                      <Text style={styles.mixIcon}>{m.icon}</Text>
                    </View>
                    <Text style={styles.mixLabel}>{m.label}</Text>
                    <Text style={styles.mixAmount}>{m.amount}</Text>
                    <View style={styles.mixBar}>
                      <View
                        style={[styles.mixBarFill, { width: `${m.pct}%` }]}
                      />
                    </View>
                    <Text style={styles.mixPercentage}>{m.pct}%</Text>
                  </View>
                ))}
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
                  placeholderTextColor={KFitColors.mutedText}
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
                {["All statuses", "Paid", "Pending", "Overdue"].map(
                  (status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.filterTab,
                        selectedStatus === status && styles.filterTabActive,
                      ]}
                      onPress={() => setSelectedStatus(status)}
                    >
                      <Text
                        style={[
                          styles.filterTabText,
                          selectedStatus === status &&
                            styles.filterTabTextActive,
                        ]}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
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
                    <Text style={styles.description}>
                      {invoice.description}
                    </Text>
                  </View>
                  <View style={styles.invoiceColumn}>
                    <Text style={styles.invoiceDate}>{invoice.date}</Text>
                  </View>
                  <View style={styles.invoiceColumn}>
                    <Text style={styles.amount}>
                      ${invoice.amount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.invoiceColumn}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            getStatusColor(invoice.status) + "20",
                        },
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
              Showing {filteredInvoices.length} of {invoices.length} loaded
              invoices
            </Text>

            <View style={styles.footer}>
              <Text style={styles.footerBrand}>
                FORM ATHLETICS/ADMINISTRATOR WORKSPACE
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Digital Receipt Modal */}
      <Modal
        visible={receipt !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setReceipt(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptCheck}>
              <Text style={styles.receiptCheckText}>✓</Text>
            </View>
            <Text style={styles.receiptTitle}>Transaction complete</Text>
            <Text style={styles.receiptSubtitle}>
              Digital receipt generated
            </Text>

            {receipt && (
              <View style={styles.receiptBody}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Tx ID</Text>
                  <Text style={styles.receiptMono}>{receipt.txId}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Item</Text>
                  <Text style={styles.receiptValue} numberOfLines={2}>
                    {receipt.item}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Method</Text>
                  <Text style={styles.receiptValue}>{receipt.method}</Text>
                </View>
                <View style={[styles.receiptRow, styles.receiptTotalRow]}>
                  <Text style={styles.receiptTotalKey}>Amount paid</Text>
                  <Text style={styles.receiptTotalValue}>
                    ${receipt.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={styles.receiptSecondary}
                onPress={downloadReceipt}
              >
                <Text style={styles.receiptSecondaryText}>📥 Download PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.receiptPrimary}
                onPress={() => setReceipt(null)}
              >
                <Text style={styles.receiptPrimaryText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, flexDirection: "row" },
  main: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1, backgroundColor: KFitColors.background },
  contentContainer: { paddingBottom: 128 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerLeft: { flex: 1 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: KFitColors.text,
    marginBottom: 6,
  },
  headerSubtitle: { fontSize: 14, color: KFitColors.mutedText },
  headerButtons: { flexDirection: "row", gap: 12 },
  exportButton: {
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  exportButtonText: { fontSize: 14, fontWeight: "600", color: KFitColors.text },
  createButton: {
    backgroundColor: KFitColors.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: KFitColors.onAccent,
  },
  overviewSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: KFitColors.text,
    marginBottom: 16,
  },
  sectionTitleInline: {
    fontSize: 18,
    fontWeight: "bold",
    color: KFitColors.text,
  },
  sectionTitleTight: {
    fontSize: 18,
    fontWeight: "bold",
    color: KFitColors.text,
    marginBottom: 4,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: width > 600 ? "23%" : "48%",
    backgroundColor: KFitColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  statLabel: { fontSize: 12, color: KFitColors.mutedText, marginBottom: 8 },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: KFitColors.accent,
    marginBottom: 4,
  },
  statChange: { fontSize: 11, color: KFitColors.accent, fontWeight: "600" },
  statSubtitle: { fontSize: 11, color: KFitColors.mutedText },
  statSubtitleWarning: { fontSize: 11, color: KFitColors.warning },

  // ---- POS ----
  posSection: { paddingHorizontal: 20, marginBottom: 24 },
  posCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  posHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: KFitColors.accent,
  },
  posTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: KFitColors.text,
    marginTop: 2,
  },
  nfcBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.accent + "1A",
  },
  nfcBadgeText: { fontSize: 11, fontWeight: "700", color: KFitColors.accent },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: KFitColors.mutedText,
    marginBottom: 8,
  },
  posItems: { gap: 8, marginBottom: 16 },
  posItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  posItemActive: { borderColor: KFitColors.accent, borderWidth: 2 },
  posItemText: { flex: 1 },
  posItemTitle: { fontSize: 13, fontWeight: "600", color: KFitColors.text },
  posItemSubtitle: { fontSize: 11, color: KFitColors.mutedText, marginTop: 2 },
  posItemPrice: { fontSize: 15, fontWeight: "bold", color: KFitColors.accent },
  totalBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    marginBottom: 12,
  },
  totalLabel: { fontSize: 11, color: KFitColors.mutedText },
  totalItem: {
    fontSize: 13,
    fontWeight: "600",
    color: KFitColors.text,
    marginTop: 2,
  },
  totalAmount: { fontSize: 26, fontWeight: "bold", color: KFitColors.accent },
  payRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  payButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  payButtonText: { fontSize: 13, fontWeight: "600", color: KFitColors.text },
  cashButton: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  cashButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: KFitColors.onAccent,
  },

  // ---- Outstanding invoices ----
  outstandingSection: { paddingHorizontal: 20, marginBottom: 24 },
  outstandingCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  outstandingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  outstandingTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: KFitColors.text,
  },
  outstandingCount: {
    fontSize: 12,
    fontWeight: "600",
    color: KFitColors.warning,
  },
  emptyText: { fontSize: 13, color: KFitColors.mutedText, paddingVertical: 8 },
  dueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  dueName: { fontSize: 13, fontWeight: "600", color: KFitColors.text },
  dueMeta: { fontSize: 11, marginTop: 2 },
  dueActions: { flexDirection: "row", gap: 6 },
  remindButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  remindText: { fontSize: 12, fontWeight: "600", color: KFitColors.mutedText },
  collectButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: KFitColors.accent,
  },
  collectText: { fontSize: 12, fontWeight: "700", color: KFitColors.onAccent },

  // ---- Receipt modal ----
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  receiptCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: KFitColors.accent,
    padding: 20,
    alignItems: "center",
  },
  receiptCheck: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  receiptCheckText: {
    fontSize: 22,
    fontWeight: "bold",
    color: KFitColors.onAccent,
  },
  receiptTitle: { fontSize: 18, fontWeight: "bold", color: KFitColors.text },
  receiptSubtitle: {
    fontSize: 12,
    color: KFitColors.mutedText,
    marginTop: 2,
    marginBottom: 16,
  },
  receiptBody: {
    width: "100%",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    gap: 8,
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  receiptKey: { fontSize: 13, color: KFitColors.mutedText },
  receiptValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "600",
    color: KFitColors.text,
  },
  receiptMono: {
    fontSize: 13,
    color: KFitColors.text,
    fontVariant: ["tabular-nums"],
  },
  receiptTotalRow: {
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
    paddingTop: 10,
    alignItems: "center",
  },
  receiptTotalKey: { fontSize: 14, fontWeight: "bold", color: KFitColors.text },
  receiptTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: KFitColors.accent,
  },
  receiptActions: { flexDirection: "row", gap: 8, width: "100%" },
  receiptSecondary: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  receiptSecondaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: KFitColors.text,
  },
  receiptPrimary: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  receiptPrimaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: KFitColors.onAccent,
  },

  // ---- Existing sections ----
  revenueSection: { paddingHorizontal: 20, marginBottom: 24 },
  revenueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  revenuePeriod: { fontSize: 12, color: KFitColors.mutedText },
  chartCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  chartPlaceholder: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  bar: { width: 24, backgroundColor: KFitColors.border, borderRadius: 4 },
  barActive: { backgroundColor: KFitColors.accent },
  barLabel: { fontSize: 11, color: KFitColors.mutedText, marginTop: 6 },
  revenueTotal: { alignItems: "center" },
  revenueTotalLabel: {
    fontSize: 28,
    fontWeight: "bold",
    color: KFitColors.text,
  },
  revenueTotalSublabel: { fontSize: 12, color: KFitColors.mutedText },
  mixSection: { paddingHorizontal: 20, marginBottom: 24 },
  mixPeriod: { fontSize: 12, color: KFitColors.mutedText, marginBottom: 16 },
  mixGrid: { flexDirection: "row", gap: 12 },
  mixCard: {
    flex: 1,
    backgroundColor: KFitColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  mixIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: KFitColors.accent + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  mixIcon: { fontSize: 20 },
  mixLabel: { fontSize: 13, color: KFitColors.mutedText, marginBottom: 4 },
  mixAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: KFitColors.text,
    marginBottom: 8,
  },
  mixBar: {
    height: 6,
    backgroundColor: KFitColors.border,
    borderRadius: 3,
    marginBottom: 4,
  },
  mixBarFill: {
    height: "100%",
    backgroundColor: KFitColors.accent,
    borderRadius: 3,
  },
  mixPercentage: { fontSize: 11, color: KFitColors.mutedText },
  payoutSection: { paddingHorizontal: 20, marginBottom: 24 },
  payoutCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: KFitColors.accent,
    borderRadius: 12,
    padding: 20,
  },
  payoutLeft: { flex: 1 },
  payoutLabel: {
    fontSize: 12,
    color: KFitColors.onAccent,
    opacity: 0.7,
    marginBottom: 4,
  },
  payoutDate: { fontSize: 16, fontWeight: "600", color: KFitColors.onAccent },
  payoutRight: { alignItems: "flex-end" },
  payoutAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: KFitColors.onAccent,
  },
  searchSection: { paddingHorizontal: 20, marginBottom: 16 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: KFitColors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.border,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: { fontSize: 16, marginRight: 12 },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: KFitColors.text },
  filterScroll: { marginBottom: 16 },
  filterContainer: { gap: 8 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  filterTabActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  filterTabText: { fontSize: 13, color: KFitColors.text, fontWeight: "500" },
  filterTabTextActive: { color: KFitColors.onAccent },
  listHeader: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  headerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: KFitColors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  invoiceList: { paddingHorizontal: 20 },
  invoiceCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  invoiceColumn: { flex: 1, alignItems: "flex-start" },
  invoiceId: { fontSize: 12, fontWeight: "600", color: KFitColors.text },
  memberName: { fontSize: 13, fontWeight: "500", color: KFitColors.text },
  description: { fontSize: 12, color: KFitColors.mutedText },
  invoiceDate: { fontSize: 12, color: KFitColors.mutedText },
  amount: { fontSize: 13, fontWeight: "600", color: KFitColors.text },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  footerText: {
    fontSize: 12,
    color: KFitColors.mutedText,
    textAlign: "center",
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  footerBrand: { fontSize: 12, color: KFitColors.mutedText },
});
