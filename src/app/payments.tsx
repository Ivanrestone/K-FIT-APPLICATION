import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type IconName = keyof typeof Ionicons.glyphMap;
type InvoiceStatus = "Paid" | "Pending" | "Overdue";
type PaymentMethod = "Google Pay" | "NFC Card Tap" | "Cash";
type StatusFilter = "All statuses" | InvoiceStatus;

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
    title: "Monthly VIP Unlimited",
    subtitle: "All-gym access + sauna",
    price: 45,
  },
  {
    id: "whey",
    title: "Whey Isolate Protein 2kg",
    subtitle: "Nutrition store supplement",
    price: 35,
  },
  {
    id: "pt",
    title: "Personal Training Session",
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

const PAYMENT_METHODS: {
  method: PaymentMethod;
  label: string;
  icon: IconName;
}[] = [
  { method: "Google Pay", label: "Google Pay", icon: "logo-google" },
  { method: "NFC Card Tap", label: "NFC card", icon: "card-outline" },
];

const REVENUE_MIX: {
  icon: IconName;
  label: string;
  amount: string;
  pct: number;
}[] = [
  { icon: "people", label: "Memberships", amount: "$37,840", pct: 78 },
  { icon: "barbell", label: "Personal training", amount: "$8,400", pct: 17 },
  { icon: "storefront", label: "Retail & passes", amount: "$2,680", pct: 5 },
];

const STATUS_FILTERS: { key: StatusFilter; icon: IconName }[] = [
  { key: "All statuses", icon: "apps" },
  { key: "Paid", icon: "checkmark-circle" },
  { key: "Pending", icon: "time" },
  { key: "Overdue", icon: "alert-circle" },
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

const statusColor = (s: InvoiceStatus) =>
  s === "Paid"
    ? KFitColors.accent
    : s === "Pending"
      ? KFitColors.warning
      : KFitColors.error;

const makeTxId = () => `#KF-${Math.floor(100000 + Math.random() * 900000)}`;

const todayLabel = () =>
  new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

const isWide = width > 820;
const isTablet = width > 600;

/* ------------------------------------------------------------------ */
/* Typed pressable wrapper — fixes the "style callback" type error.   */
/* ------------------------------------------------------------------ */
type PressableBtnProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityRole?: "button" | "link" | "none";
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
  hitSlop?: number;
  key?: string | number;
};

function PressableBtn({
  children,
  style,
  pressedStyle,
  onPress,
  disabled,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  hitSlop,
}: PressableBtnProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        style,
        pressed && (pressedStyle ?? styles.pressed),
      ]}
    >
      {children}
    </Pressable>
  );
}

export default function PaymentsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] =
    useState<StatusFilter>("All statuses");
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);

  const [selectedItem, setSelectedItem] = useState<PosItem>(POS_ITEMS[0]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const statusCounts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      "All statuses": invoices.length,
      Paid: 0,
      Pending: 0,
      Overdue: 0,
    };
    invoices.forEach((i) => (base[i.status] += 1));
    return base;
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return invoices.filter((i) => {
      const matchesSearch =
        q.length === 0 ||
        i.memberName.toLowerCase().includes(q) ||
        i.invoiceId.toLowerCase().includes(q);
      const matchesStatus =
        selectedStatus === "All statuses" || i.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, selectedStatus]);

  const outstanding = useMemo(
    () => invoices.filter((i) => i.status !== "Paid"),
    [invoices],
  );

  const processPosPayment = (method: PaymentMethod) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const txId = makeTxId();
    setReceipt({
      txId,
      item: selectedItem.title,
      method,
      amount: selectedItem.price,
    });
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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Reminder sent",
      `Payment reminder sent to ${invoice.memberName}.`,
    );
  };

  const collectMemberDues = (invoice: Invoice) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    void Haptics.selectionAsync();
    Alert.alert("Receipt", "Downloading PDF receipt to storage...");
    setReceipt(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/payments" />

        <View style={styles.main}>
          <AppHeader />

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View
              style={[styles.pageHeader, isTablet && styles.pageHeaderWide]}
            >
              <View style={styles.headerLeft}>
                <Text style={styles.eyebrow}>REVENUE & COLLECTIONS</Text>
                <Text style={styles.headerTitle}>Payments</Text>
                <Text style={styles.headerSubtitle}>
                  A clear view of your club&apos;s financial performance.
                </Text>
              </View>
              <View style={styles.headerButtons}>
                <PressableBtn style={styles.exportButton}>
                  <Ionicons
                    name="download-outline"
                    size={14}
                    color={KFitColors.text}
                  />
                  <Text style={styles.exportButtonText}>Export</Text>
                </PressableBtn>
                <PressableBtn style={styles.createButton}>
                  <Ionicons name="add" size={14} color={KFitColors.onAccent} />
                  <Text style={styles.createButtonText}>Create invoice</Text>
                </PressableBtn>
              </View>
            </View>

            {/* Overview */}
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionEyebrow}>OVERVIEW</Text>
                <Text style={styles.sectionCaption}>THIS MONTH</Text>
              </View>
              <View style={styles.statsGrid}>
                <View
                  style={[styles.statCard, { width: isWide ? "23.5%" : "48%" }]}
                >
                  <View style={styles.statTop}>
                    <Text style={styles.statLabel}>Revenue</Text>
                    <View style={styles.statIcon}>
                      <Ionicons
                        name="trending-up"
                        size={12}
                        color={KFitColors.accent}
                      />
                    </View>
                  </View>
                  <Text style={styles.statNumber}>$48,920</Text>
                  <Text style={styles.statAccent}>+12.8% vs Sep</Text>
                </View>
                <View
                  style={[styles.statCard, { width: isWide ? "23.5%" : "48%" }]}
                >
                  <View style={styles.statTop}>
                    <Text style={styles.statLabel}>Collected</Text>
                    <View style={styles.statIcon}>
                      <Ionicons
                        name="checkmark-done"
                        size={12}
                        color={KFitColors.accent}
                      />
                    </View>
                  </View>
                  <Text style={styles.statNumber}>548</Text>
                  <Text style={styles.statSub}>97.4% rate</Text>
                </View>
                <View
                  style={[styles.statCard, { width: isWide ? "23.5%" : "48%" }]}
                >
                  <View style={styles.statTop}>
                    <Text style={styles.statLabel}>Pending</Text>
                    <View style={[styles.statIcon, styles.statIconWarn]}>
                      <Ionicons
                        name="time"
                        size={12}
                        color={KFitColors.warning}
                      />
                    </View>
                  </View>
                  <Text style={styles.statNumber}>{statusCounts.Pending}</Text>
                  <Text style={styles.statWarn}>Awaiting payment</Text>
                </View>
                <View
                  style={[styles.statCard, { width: isWide ? "23.5%" : "48%" }]}
                >
                  <View style={styles.statTop}>
                    <Text style={styles.statLabel}>Overdue</Text>
                    <View style={[styles.statIcon, styles.statIconError]}>
                      <Ionicons
                        name="alert-circle"
                        size={12}
                        color={KFitColors.error}
                      />
                    </View>
                  </View>
                  <Text style={styles.statNumber}>{statusCounts.Overdue}</Text>
                  <Text style={styles.statError}>Reminder sent</Text>
                </View>
              </View>
            </View>

            {/* POS Terminal */}
            <View style={styles.section}>
              <View style={styles.posCard}>
                <View style={styles.posHeader}>
                  <View>
                    <Text style={styles.sectionEyebrow}>REGISTER COUNTER</Text>
                    <Text style={styles.posTitle}>POS terminal</Text>
                  </View>
                  <View style={styles.nfcBadge}>
                    <Ionicons
                      name="wifi"
                      size={12}
                      color={KFitColors.accent}
                      style={styles.nfcIcon}
                    />
                    <Text style={styles.nfcBadgeText}>NFC TAP READY</Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>
                  SELECT ITEMS OR CONCESSIONS
                </Text>
                <View style={styles.posItems}>
                  {POS_ITEMS.map((item) => {
                    const active = item.id === selectedItem.id;
                    return (
                      <PressableBtn
                        key={item.id}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setSelectedItem(item);
                        }}
                        style={[styles.posItem, active && styles.posItemActive]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <View style={styles.flex}>
                          <Text style={styles.posItemTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text
                            style={styles.posItemSubtitle}
                            numberOfLines={1}
                          >
                            {item.subtitle}
                          </Text>
                        </View>
                        <Text style={styles.posItemPrice}>
                          ${item.price.toFixed(2)}
                        </Text>
                      </PressableBtn>
                    );
                  })}
                </View>

                <View style={styles.totalBanner}>
                  <View style={styles.flex}>
                    <Text style={styles.totalLabel}>CHECKOUT TOTAL</Text>
                    <Text style={styles.totalItem} numberOfLines={1}>
                      {selectedItem.title}
                    </Text>
                  </View>
                  <Text style={styles.totalAmount}>
                    ${selectedItem.price.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.payRow}>
                  {PAYMENT_METHODS.map(({ method, label, icon }) => (
                    <PressableBtn
                      key={method}
                      onPress={() => processPosPayment(method)}
                      style={styles.payButton}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name={icon}
                        size={16}
                        color={KFitColors.accent}
                      />
                      <Text style={styles.payButtonText}>{label}</Text>
                    </PressableBtn>
                  ))}
                </View>

                <PressableBtn
                  onPress={() => processPosPayment("Cash")}
                  style={styles.cashButton}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="cash-outline"
                    size={16}
                    color={KFitColors.onAccent}
                  />
                  <Text style={styles.cashButtonText}>
                    Complete cash transaction
                  </Text>
                </PressableBtn>
              </View>
            </View>

            {/* Outstanding */}
            <View style={styles.section}>
              <View style={styles.outstandingCard}>
                <View style={styles.outstandingHeader}>
                  <Text style={styles.outstandingTitle}>
                    Outstanding invoices
                  </Text>
                  <View style={styles.outstandingCount}>
                    <Text style={styles.outstandingCountText}>
                      {outstanding.length} pending
                    </Text>
                  </View>
                </View>

                {outstanding.length === 0 ? (
                  <View style={styles.emptyRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={KFitColors.accent}
                    />
                    <Text style={styles.emptyText}>
                      All invoices are settled.
                    </Text>
                  </View>
                ) : (
                  outstanding.map((invoice) => {
                    const tone = statusColor(invoice.status);
                    return (
                      <View key={invoice.id} style={styles.dueRow}>
                        <View style={styles.flex}>
                          <Text style={styles.dueName} numberOfLines={1}>
                            {invoice.memberName}
                          </Text>
                          <Text style={styles.dueMeta} numberOfLines={1}>
                            <Text style={{ color: tone, fontWeight: "800" }}>
                              {invoice.status}
                            </Text>
                            {" • "}
                            {invoice.description}
                            {" • "}${invoice.amount.toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.dueActions}>
                          <PressableBtn
                            style={styles.remindButton}
                            onPress={() => remindMemberDues(invoice)}
                          >
                            <Ionicons
                              name="notifications-outline"
                              size={11}
                              color={KFitColors.mutedText}
                            />
                            <Text style={styles.remindText}>Remind</Text>
                          </PressableBtn>
                          <PressableBtn
                            style={styles.collectButton}
                            onPress={() => collectMemberDues(invoice)}
                          >
                            <Ionicons
                              name="cash-outline"
                              size={11}
                              color={KFitColors.onAccent}
                            />
                            <Text style={styles.collectText}>Collect</Text>
                          </PressableBtn>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>

            {/* Revenue overview */}
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionEyebrow}>REVENUE</Text>
                <Text style={styles.sectionCaption}>LAST 6 MONTHS</Text>
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
                      <Text
                        style={[
                          styles.barLabel,
                          b.active && styles.barLabelActive,
                        ]}
                      >
                        {b.label}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.revenueTotal}>
                  <Text style={styles.revenueTotalLabel}>$48,920</Text>
                  <Text style={styles.revenueTotalSublabel}>this month</Text>
                </View>
              </View>
            </View>

            {/* Revenue mix */}
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionEyebrow}>MIX</Text>
                <Text style={styles.sectionCaption}>OCTOBER 2026</Text>
              </View>
              <View style={styles.mixGrid}>
                {REVENUE_MIX.map((m) => (
                  <View key={m.label} style={styles.mixCard}>
                    <View style={styles.mixIconContainer}>
                      <Ionicons
                        name={m.icon}
                        size={16}
                        color={KFitColors.accent}
                      />
                    </View>
                    <Text style={styles.mixLabel} numberOfLines={1}>
                      {m.label}
                    </Text>
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

            {/* Next payout */}
            <View style={styles.section}>
              <View style={styles.payoutCard}>
                <View style={styles.flex}>
                  <Text style={styles.payoutEyebrow}>NEXT PAYOUT</Text>
                  <Text style={styles.payoutDate}>Oct 22, 2026</Text>
                </View>
                <Text style={styles.payoutAmount}>$25k</Text>
              </View>
            </View>

            {/* Search + filters */}
            <View style={styles.section}>
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={16}
                  color={KFitColors.mutedText}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search invoice or member"
                  placeholderTextColor={KFitColors.mutedText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  accessibilityLabel="Search invoices"
                />
                {searchQuery.length > 0 && (
                  <PressableBtn
                    onPress={() => setSearchQuery("")}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={KFitColors.mutedText}
                    />
                  </PressableBtn>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {STATUS_FILTERS.map((f) => {
                  const active = selectedStatus === f.key;
                  const count = statusCounts[f.key];
                  return (
                    <PressableBtn
                      key={f.key}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setSelectedStatus(f.key);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${f.key}, ${count} invoices`}
                      style={[
                        styles.filterTab,
                        active && styles.filterTabActive,
                      ]}
                    >
                      <Ionicons
                        name={f.icon}
                        size={11}
                        color={
                          active ? KFitColors.onAccent : KFitColors.mutedText
                        }
                      />
                      <Text
                        style={[
                          styles.filterTabText,
                          active && styles.filterTabTextActive,
                        ]}
                      >
                        {f.key}
                      </Text>
                      <View
                        style={[
                          styles.filterCount,
                          active && styles.filterCountActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterCountText,
                            active && styles.filterCountTextActive,
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    </PressableBtn>
                  );
                })}
              </ScrollView>
            </View>

            {/* Invoice list */}
            <View style={styles.section}>
              <View style={styles.tableCard}>
                {isWide && filteredInvoices.length > 0 && (
                  <View style={styles.listHeader}>
                    <Text style={[styles.headerText, styles.colInvoice]}>
                      INVOICE
                    </Text>
                    <Text style={[styles.headerText, styles.colMember]}>
                      MEMBER
                    </Text>
                    <Text style={[styles.headerText, styles.colDesc]}>
                      DESCRIPTION
                    </Text>
                    <Text style={[styles.headerText, styles.colDate]}>
                      DATE
                    </Text>
                    <Text style={[styles.headerText, styles.colAmount]}>
                      AMOUNT
                    </Text>
                    <Text style={[styles.headerText, styles.colStatus]}>
                      STATUS
                    </Text>
                  </View>
                )}

                {filteredInvoices.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconWrap}>
                      <Ionicons
                        name="receipt-outline"
                        size={22}
                        color={KFitColors.accent}
                      />
                    </View>
                    <Text style={styles.emptyTitle}>No invoices found</Text>
                    <Text style={styles.emptySub}>
                      Try a different search or reset the filter.
                    </Text>
                  </View>
                ) : (
                  filteredInvoices.map((invoice, i) => {
                    const isLast = i === filteredInvoices.length - 1;
                    const tone = statusColor(invoice.status);
                    return (
                      <View
                        key={invoice.id}
                        style={[
                          styles.invoiceRow,
                          !isLast && styles.rowDivider,
                        ]}
                      >
                        {isWide ? (
                          <View style={styles.invoiceRowWide}>
                            <Text style={[styles.invoiceId, styles.colInvoice]}>
                              {invoice.invoiceId}
                            </Text>
                            <Text
                              style={[styles.memberName, styles.colMember]}
                              numberOfLines={1}
                            >
                              {invoice.memberName}
                            </Text>
                            <Text
                              style={[styles.description, styles.colDesc]}
                              numberOfLines={1}
                            >
                              {invoice.description}
                            </Text>
                            <Text style={[styles.invoiceDate, styles.colDate]}>
                              {invoice.date}
                            </Text>
                            <Text style={[styles.amount, styles.colAmount]}>
                              ${invoice.amount.toFixed(2)}
                            </Text>
                            <View style={styles.colStatus}>
                              <View
                                style={[
                                  styles.statusBadge,
                                  {
                                    backgroundColor: tone + "1A",
                                    borderColor: tone + "44",
                                  },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.statusDot,
                                    { backgroundColor: tone },
                                  ]}
                                />
                                <Text
                                  style={[styles.statusText, { color: tone }]}
                                >
                                  {invoice.status.toUpperCase()}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.invoiceRowNarrow}>
                            <View style={styles.rowBetween}>
                              <Text style={styles.invoiceId}>
                                {invoice.invoiceId}
                              </Text>
                              <View
                                style={[
                                  styles.statusBadge,
                                  {
                                    backgroundColor: tone + "1A",
                                    borderColor: tone + "44",
                                  },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.statusDot,
                                    { backgroundColor: tone },
                                  ]}
                                />
                                <Text
                                  style={[styles.statusText, { color: tone }]}
                                >
                                  {invoice.status.toUpperCase()}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.memberName}>
                              {invoice.memberName}
                            </Text>
                            <Text style={styles.description} numberOfLines={1}>
                              {invoice.description}
                            </Text>
                            <View style={styles.rowBetween}>
                              <Text style={styles.invoiceDate}>
                                {invoice.date}
                              </Text>
                              <Text style={styles.amount}>
                                ${invoice.amount.toFixed(2)}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>

              <Text style={styles.footerText}>
                Showing {filteredInvoices.length} of {invoices.length} invoices
              </Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerBrand}>KFIT · ADMIN WORKSPACE</Text>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Receipt Modal */}
      <Modal
        visible={receipt !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setReceipt(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptCheck}>
              <Ionicons
                name="checkmark"
                size={26}
                color={KFitColors.onAccent}
              />
            </View>
            <Text style={styles.receiptTitle}>Transaction complete</Text>
            <Text style={styles.receiptSubtitle}>
              Digital receipt generated
            </Text>

            {receipt && (
              <View style={styles.receiptBody}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Transaction ID</Text>
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
              <PressableBtn
                style={styles.receiptSecondary}
                onPress={downloadReceipt}
              >
                <Ionicons
                  name="download-outline"
                  size={14}
                  color={KFitColors.text}
                />
                <Text style={styles.receiptSecondaryText}>Download PDF</Text>
              </PressableBtn>
              <PressableBtn
                style={styles.receiptPrimary}
                onPress={() => setReceipt(null)}
              >
                <Text style={styles.receiptPrimaryText}>Done</Text>
              </PressableBtn>
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
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  /* Page header */
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
  },
  pageHeaderWide: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerLeft: { flexShrink: 1, gap: 2 },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: KFitColors.text,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: KFitColors.mutedText,
    marginTop: 2,
  },
  headerButtons: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  exportButtonText: { fontSize: 12, fontWeight: "800", color: KFitColors.text },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  createButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: KFitColors.onAccent,
  },

  /* Sections */
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionEyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  sectionCaption: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: "monospace",
  },

  /* Stats */
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    flexGrow: 1,
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    gap: 2,
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: KFitColors.mutedText,
    letterSpacing: 0.6,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  statIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
  },
  statIconWarn: {
    backgroundColor: KFitColors.warning + "14",
    borderColor: KFitColors.warning + "33",
  },
  statIconError: {
    backgroundColor: KFitColors.error + "14",
    borderColor: KFitColors.error + "33",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
    letterSpacing: -0.4,
  },
  statAccent: {
    fontSize: 10,
    color: KFitColors.accent,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  statSub: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  statWarn: {
    fontSize: 10,
    color: KFitColors.warning,
    fontFamily: "monospace",
  },
  statError: { fontSize: 10, color: KFitColors.error, fontFamily: "monospace" },

  /* POS */
  posCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    gap: 8,
  },
  posHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  posTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: KFitColors.text,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  nfcBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    backgroundColor: KFitColors.accent + "14",
  },
  nfcIcon: { transform: [{ rotate: "90deg" }] },
  nfcBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
    marginBottom: 4,
    marginTop: 4,
  },
  posItems: { gap: 6 },
  posItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  posItemActive: {
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.accent + "10",
  },
  posItemTitle: { fontSize: 12, fontWeight: "800", color: KFitColors.text },
  posItemSubtitle: {
    fontSize: 10,
    color: KFitColors.mutedText,
    marginTop: 2,
    fontFamily: "monospace",
  },
  posItemPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
  },
  totalBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    backgroundColor: KFitColors.accent + "10",
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 9,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
    letterSpacing: 0.8,
    fontWeight: "900",
  },
  totalItem: {
    fontSize: 12,
    fontWeight: "800",
    color: KFitColors.text,
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
    letterSpacing: -0.5,
  },
  payRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  payButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  payButtonText: { fontSize: 12, fontWeight: "800", color: KFitColors.text },
  cashButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
    marginTop: 8,
  },
  cashButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: KFitColors.onAccent,
    letterSpacing: 0.2,
  },

  /* Outstanding */
  outstandingCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    gap: 8,
  },
  outstandingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  outstandingTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: KFitColors.text,
  },
  outstandingCount: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: KFitColors.warning + "1A",
    borderWidth: 1,
    borderColor: KFitColors.warning + "44",
  },
  outstandingCountText: {
    fontSize: 9,
    fontWeight: "900",
    color: KFitColors.warning,
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  emptyText: { fontSize: 12, color: KFitColors.mutedText },
  dueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  dueName: { fontSize: 12, fontWeight: "800", color: KFitColors.text },
  dueMeta: {
    fontSize: 10,
    marginTop: 2,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  dueActions: { flexDirection: "row", gap: 6 },
  remindButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  remindText: { fontSize: 10, fontWeight: "800", color: KFitColors.mutedText },
  collectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: KFitColors.accent,
  },
  collectText: { fontSize: 10, fontWeight: "900", color: KFitColors.onAccent },

  /* Revenue chart */
  chartCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  chartPlaceholder: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  bar: { width: 22, backgroundColor: KFitColors.border, borderRadius: 4 },
  barActive: { backgroundColor: KFitColors.accent },
  barLabel: {
    fontSize: 10,
    color: KFitColors.mutedText,
    marginTop: 6,
    fontFamily: "monospace",
  },
  barLabelActive: { color: KFitColors.accent, fontWeight: "900" },
  revenueTotal: { alignItems: "center" },
  revenueTotalLabel: {
    fontSize: 26,
    fontWeight: "900",
    color: KFitColors.text,
    fontFamily: "monospace",
    letterSpacing: -0.5,
  },
  revenueTotalSublabel: {
    fontSize: 11,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },

  /* Revenue mix */
  mixGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  mixCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    gap: 4,
  },
  mixIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  mixLabel: {
    fontSize: 11,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  mixAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: KFitColors.text,
    fontFamily: "monospace",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  mixBar: {
    height: 5,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 3,
    marginBottom: 4,
    overflow: "hidden",
  },
  mixBarFill: {
    height: "100%",
    backgroundColor: KFitColors.accent,
    borderRadius: 3,
  },
  mixPercentage: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },

  /* Payout */
  payoutCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: KFitColors.accent,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  payoutEyebrow: {
    fontSize: 9,
    letterSpacing: 1.4,
    color: KFitColors.onAccent,
    opacity: 0.8,
    fontFamily: "monospace",
    fontWeight: "900",
  },
  payoutDate: {
    fontSize: 15,
    fontWeight: "900",
    color: KFitColors.onAccent,
    marginTop: 2,
    fontFamily: "monospace",
  },
  payoutAmount: {
    fontSize: 26,
    fontWeight: "900",
    color: KFitColors.onAccent,
    fontFamily: "monospace",
    letterSpacing: -0.5,
  },

  /* Search + filters */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 12,
    color: KFitColors.text,
    paddingVertical: 0,
  },
  filterRow: { flexDirection: "row", gap: 6 },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingLeft: 10,
    paddingRight: 5,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  filterTabActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  filterTabText: {
    fontSize: 11,
    color: KFitColors.mutedText,
    fontWeight: "700",
  },
  filterTabTextActive: { color: KFitColors.onAccent, fontWeight: "900" },
  filterCount: {
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  filterCountActive: {
    backgroundColor: KFitColors.onAccent + "22",
    borderColor: KFitColors.onAccent + "44",
  },
  filterCountText: {
    fontSize: 9,
    fontWeight: "900",
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  filterCountTextActive: { color: KFitColors.onAccent },

  /* Invoice table */
  tableCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    overflow: "hidden",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  headerText: {
    fontSize: 9,
    fontWeight: "900",
    color: KFitColors.mutedText,
    letterSpacing: 1.2,
    fontFamily: "monospace",
  },
  colInvoice: { flex: 1.5, paddingRight: 10 },
  colMember: { flex: 1.6, paddingRight: 10 },
  colDesc: { flex: 2, paddingRight: 10 },
  colDate: { flex: 1.3, paddingRight: 10 },
  colAmount: { flex: 1, paddingRight: 10 },
  colStatus: { flex: 1.3 },

  invoiceRow: { paddingHorizontal: 14, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: KFitColors.border },
  invoiceRowWide: { flexDirection: "row", alignItems: "center" },
  invoiceRowNarrow: { gap: 8 },

  invoiceId: {
    fontSize: 11,
    fontWeight: "800",
    color: KFitColors.text,
    fontFamily: "monospace",
  },
  memberName: { fontSize: 12, fontWeight: "800", color: KFitColors.text },
  description: { fontSize: 11, color: KFitColors.mutedText },
  invoiceDate: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  amount: {
    fontSize: 12,
    fontWeight: "900",
    color: KFitColors.text,
    fontFamily: "monospace",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: {
    fontSize: 8,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 14, fontWeight: "800", color: KFitColors.text },
  emptySub: {
    fontSize: 11,
    color: KFitColors.mutedText,
    textAlign: "center",
    lineHeight: 16,
  },

  /* Footer */
  footerText: {
    fontSize: 10,
    color: KFitColors.mutedText,
    textAlign: "center",
    marginTop: 12,
    fontFamily: "monospace",
    opacity: 0.7,
  },
  footer: { alignItems: "center", paddingVertical: 16 },
  footerBrand: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    color: KFitColors.mutedText,
    opacity: 0.7,
  },

  /* Receipt modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  receiptCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: KFitColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  receiptCheck: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  receiptTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.3,
  },
  receiptSubtitle: {
    fontSize: 11,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  receiptBody: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    gap: 8,
    marginTop: 8,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  receiptKey: {
    fontSize: 11,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  receiptValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "700",
    color: KFitColors.text,
  },
  receiptMono: {
    fontSize: 12,
    color: KFitColors.text,
    fontFamily: "monospace",
    fontWeight: "800",
  },
  receiptTotalRow: {
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
    paddingTop: 10,
    alignItems: "center",
  },
  receiptTotalKey: { fontSize: 12, fontWeight: "900", color: KFitColors.text },
  receiptTotalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
    letterSpacing: -0.3,
  },
  receiptActions: { flexDirection: "row", gap: 8, width: "100%", marginTop: 8 },
  receiptSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  receiptSecondaryText: {
    fontSize: 12,
    fontWeight: "800",
    color: KFitColors.text,
  },
  receiptPrimary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  receiptPrimaryText: {
    fontSize: 12,
    fontWeight: "900",
    color: KFitColors.onAccent,
  },
});
