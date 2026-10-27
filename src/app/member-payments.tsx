import MemberBottomNav from "@/components/MemberBottomNav";
import MemberHeader, {
    MemberLocalNotification,
} from "@/components/MemberHeader";
import { KFitColors } from "@/constants/theme";
import { useLogout } from "@/hooks/use-logout";
import { useMemberProfile } from "@/hooks/use-member-profile";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
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
const NAV_CLEARANCE = 140;

type IconName = keyof typeof Ionicons.glyphMap;
type InvoiceStatus = "Paid" | "Pending" | "Overdue";
type PaymentMethod = "Google Pay" | "NFC Card Tap" | "Cash";

type PosCategory =
  | "All"
  | "Supplements"
  | "Shakes & drinks"
  | "Snacks"
  | "Gear"
  | "Passes & training";

interface Invoice {
  id: string;
  invoiceId: string;
  title: string;
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
  category: Exclude<PosCategory, "All">;
  icon: IconName;
}

interface ReceiptLine {
  title: string;
  qty: number;
  price: number;
}

interface Receipt {
  txId: string;
  method: string;
  lines: ReceiptLine[];
  subtotal: number;
  tax: number;
  amount: number;
}

const POS_CATEGORIES: PosCategory[] = [
  "All",
  "Supplements",
  "Shakes & drinks",
  "Snacks",
  "Gear",
  "Passes & training",
];

// Set to 0 if prices already include tax.
const TAX_RATE = 0.08;

/** Member-facing store. Add or edit items here. */
const POS_ITEMS: PosItem[] = [
  // Supplements
  {
    id: "whey",
    title: "Whey Isolate Protein (2kg)",
    subtitle: "25g protein per scoop",
    price: 35,
    category: "Supplements",
    icon: "barbell",
  },
  {
    id: "whey-sachet",
    title: "Whey Single Serve",
    subtitle: "One scoop sachet, choose at the bar",
    price: 3.5,
    category: "Supplements",
    icon: "flask",
  },
  {
    id: "casein",
    title: "Casein Night Protein (1kg)",
    subtitle: "Slow-release, great before bed",
    price: 29,
    category: "Supplements",
    icon: "moon",
  },
  {
    id: "creatine",
    title: "Creatine Monohydrate (300g)",
    subtitle: "60 servings",
    price: 25,
    category: "Supplements",
    icon: "flash",
  },
  {
    id: "bcaa",
    title: "BCAA Recovery Powder",
    subtitle: "Intra-workout, 30 servings",
    price: 28,
    category: "Supplements",
    icon: "water",
  },

  // Shakes & drinks
  {
    id: "shake",
    title: "Pre-Workout Energy Shake",
    subtitle: "Smoothie bar daily special",
    price: 6.5,
    category: "Shakes & drinks",
    icon: "cafe",
  },
  {
    id: "protein-shake",
    title: "Whey Protein Shake",
    subtitle: "Blended with milk or water",
    price: 5.5,
    category: "Shakes & drinks",
    icon: "nutrition",
  },
  {
    id: "mass-shake",
    title: "Mass Gainer Shake",
    subtitle: "600 kcal, 50g protein",
    price: 7.5,
    category: "Shakes & drinks",
    icon: "beer",
  },
  {
    id: "electrolyte",
    title: "Electrolyte Drink",
    subtitle: "Zero sugar, 500ml",
    price: 3.25,
    category: "Shakes & drinks",
    icon: "water-outline",
  },

  // Snacks
  {
    id: "bar",
    title: "Protein Bar",
    subtitle: "20g protein, low sugar",
    price: 3,
    category: "Snacks",
    icon: "fast-food",
  },
  {
    id: "oats",
    title: "Overnight Oats Cup",
    subtitle: "Ready to eat",
    price: 4.5,
    category: "Snacks",
    icon: "leaf",
  },

  // Gear
  {
    id: "shaker",
    title: "KFit Shaker Bottle",
    subtitle: "700ml, leak-proof",
    price: 9,
    category: "Gear",
    icon: "beaker",
  },
  {
    id: "towel",
    title: "Microfiber Towel",
    subtitle: "Quick-dry gym towel",
    price: 12,
    category: "Gear",
    icon: "shirt",
  },
  {
    id: "wraps",
    title: "Heavy Duty Wrist Wraps",
    subtitle: "Pair, for lifting",
    price: 18.5,
    category: "Gear",
    icon: "hand-left",
  },

  // Passes & training
  {
    id: "day",
    title: "Day pass",
    subtitle: "All-gym access for one visit",
    price: 12,
    category: "Passes & training",
    icon: "ticket",
  },
  {
    id: "guest",
    title: "Guest pass",
    subtitle: "Bring-a-friend, one visit",
    price: 15,
    category: "Passes & training",
    icon: "people",
  },
  {
    id: "pt",
    title: "1-on-1 Personal Training",
    subtitle: "60-min session with your coach",
    price: 45,
    category: "Passes & training",
    icon: "fitness",
  },
];

const PAYMENT_METHODS: {
  method: PaymentMethod;
  label: string;
  icon: IconName;
}[] = [
  { method: "Google Pay", label: "Google Pay", icon: "logo-google" },
  { method: "NFC Card Tap", label: "Card NFC", icon: "card-outline" },
];

const SPEND_MIX: {
  icon: IconName;
  label: string;
  amount: string;
  pct: number;
}[] = [
  { icon: "card", label: "Memberships", amount: "$316", pct: 61 },
  { icon: "barbell", label: "Personal training", amount: "$220", pct: 28 },
  { icon: "storefront", label: "Retail & snacks", amount: "$54", pct: 11 },
];

const initialInvoices: Invoice[] = [
  {
    id: "1",
    invoiceId: "INV-261042",
    title: "Monthly membership — Oct",
    description: "Performance October",
    date: "Oct 01, 2026",
    amount: 79,
    status: "Paid",
  },
  {
    id: "2",
    invoiceId: "INV-261188",
    title: "Personal training × 4",
    description: "Coaching pack",
    date: "Oct 12, 2026",
    amount: 220,
    status: "Paid",
  },
  {
    id: "3",
    invoiceId: "INV-261341",
    title: "Monthly membership — Nov",
    description: "Performance November",
    date: "Oct 28, 2026",
    amount: 79,
    status: "Pending",
  },
  {
    id: "4",
    invoiceId: "INV-261085",
    title: "Protein shake + towel",
    description: "Nutrition + gear",
    date: "Oct 04, 2026",
    amount: 24,
    status: "Paid",
  },
  {
    id: "5",
    invoiceId: "INV-261064",
    title: "Guest pass (2)",
    description: "Bring-a-friend",
    date: "Oct 15, 2026",
    amount: 30,
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

export default function MemberPaymentsScreen() {
  const { profile } = useMemberProfile();
  const { isSigningOut, logout } = useLogout();

  const [notifications, setNotifications] = useState<MemberLocalNotification[]>(
    [],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All statuses");
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);

  const [posCategory, setPosCategory] = useState<PosCategory>("All");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case "Paid":
        return KFitColors.accent;
      case "Pending":
        return "#F59E0B"; // amber
      case "Overdue":
        return KFitColors.error;
      default:
        return KFitColors.mutedText;
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "All statuses" || invoice.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, selectedStatus]);

  const outstandingInvoices = invoices.filter((i) => i.status !== "Paid");

  const totalSpent = invoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + i.amount, 0);

  /* ---------------- Store / cart logic ---------------- */
  const visibleItems = POS_ITEMS.filter(
    (i) => posCategory === "All" || i.category === posCategory,
  );

  const cartLines = POS_ITEMS.filter((i) => (cart[i.id] ?? 0) > 0).map(
    (item) => ({ item, qty: cart[item.id] }),
  );
  const cartCount = cartLines.reduce((n, l) => n + l.qty, 0);
  const cartSubtotal = cartLines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const cartTax = cartSubtotal * TAX_RATE;
  const cartTotal = cartSubtotal + cartTax;

  const changeQty = (id: string, delta: number) => {
    void Haptics.selectionAsync();
    setCart((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  };

  const processPosPayment = (method: PaymentMethod) => {
    if (cartCount === 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const txId = makeTxId();

    const lines: ReceiptLine[] = cartLines.map(({ item, qty }) => ({
      title: item.title,
      qty,
      price: item.price,
    }));

    const first = lines[0];
    const invoiceTitle =
      lines.length === 1
        ? first.qty > 1
          ? `${first.title} × ${first.qty}`
          : first.title
        : `${first.title} + ${lines.length - 1} more`;

    setReceipt({
      txId,
      method,
      lines,
      subtotal: cartSubtotal,
      tax: cartTax,
      amount: cartTotal,
    });

    setInvoices((prev) => [
      {
        id: `pos-${txId}`,
        invoiceId: `INV-${txId.replace("#KF-", "")}`,
        title: invoiceTitle,
        description: `${cartCount} item${cartCount > 1 ? "s" : ""} · In-gym purchase`,
        date: todayLabel(),
        amount: cartTotal,
        status: "Paid",
      },
      ...prev,
    ]);

    setCart({});
  };

  const remindDues = (invoice: Invoice) => {
    Alert.alert("Reminder sent", `A reminder was sent for ${invoice.title}.`);
  };

  const payDues = (invoice: Invoice) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setInvoices((prev) =>
      prev.map((i) => (i.id === invoice.id ? { ...i, status: "Paid" } : i)),
    );
    setReceipt({
      txId: makeTxId(),
      method: "Paid in app",
      lines: [{ title: invoice.title, qty: 1, price: invoice.amount }],
      subtotal: invoice.amount,
      tax: 0,
      amount: invoice.amount,
    });
  };

  const downloadReceipt = () => {
    Alert.alert("Receipt", "Downloading PDF receipt to storage...");
    setReceipt(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.main}>
        <MemberHeader
          name={profile?.firstName?.trim() || "Member"}
          tier="VIP"
          streakDays={0}
          points={0}
          checkedIn={false}
          isSigningOut={isSigningOut}
          onLogout={logout}
          activeRoute="/member-payments"
          notifications={notifications}
          setNotifications={setNotifications}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Page title */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Payments & billing</Text>
              <Text style={styles.headerSubtitle}>
                Your invoices, receipts and store purchases.
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.exportButton}>
                <Ionicons
                  name="download-outline"
                  size={15}
                  color={KFitColors.text}
                />
                <Text style={styles.exportButtonText}>Export</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton}>
                <Ionicons name="add" size={16} color={KFitColors.onAccent} />
                <Text style={styles.createButtonText}>Add payment</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Overview Stats */}
          <View style={styles.overviewSection}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total spent</Text>
                <Text style={styles.statNumber}>${totalSpent.toFixed(2)}</Text>
                <Text style={styles.statChange}>+12.8% vs. September</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Payments</Text>
                <Text style={styles.statNumber}>{invoices.length}</Text>
                <Text style={styles.statSubtitle}>lifetime transactions</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={styles.statNumber}>
                  {invoices.filter((i) => i.status === "Pending").length}
                </Text>
                <Text style={styles.statSubtitle}>awaiting payment</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Overdue</Text>
                <Text style={styles.statNumber}>
                  {invoices.filter((i) => i.status === "Overdue").length}
                </Text>
                <Text style={styles.statSubtitleWarning}>sent reminders</Text>
              </View>
            </View>
          </View>

          {/* Store / Quick pay */}
          <View style={styles.posSection}>
            <View style={styles.posCard}>
              <View style={styles.posHeader}>
                <View>
                  <Text style={styles.eyebrow}>IN-GYM PURCHASES</Text>
                  <Text style={styles.posTitle}>Fuel & gear store</Text>
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

              {/* Category chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catRow}
                style={styles.catScroll}
              >
                {POS_CATEGORIES.map((cat) => {
                  const active = cat === posCategory;
                  return (
                    <TouchableOpacity
                      key={cat}
                      activeOpacity={0.8}
                      onPress={() => setPosCategory(cat)}
                      style={[styles.catChip, active && styles.catChipActive]}
                    >
                      <Text
                        style={[styles.catText, active && styles.catTextActive]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Items */}
              <View style={styles.posItems}>
                {visibleItems.map((item) => {
                  const qty = cart[item.id] ?? 0;
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.storeRow,
                        qty > 0 && styles.storeRowActive,
                      ]}
                    >
                      <View style={styles.storeIcon}>
                        <Ionicons
                          name={item.icon}
                          size={18}
                          color={KFitColors.accent}
                        />
                      </View>
                      <View style={styles.posItemText}>
                        <Text style={styles.posItemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.posItemSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                        <Text style={styles.storePrice}>
                          ${item.price.toFixed(2)}
                        </Text>
                      </View>

                      {qty === 0 ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={styles.addButton}
                          onPress={() => changeQty(item.id, 1)}
                          accessibilityLabel={`Add ${item.title}`}
                        >
                          <Ionicons
                            name="add"
                            size={16}
                            color={KFitColors.onAccent}
                          />
                          <Text style={styles.addButtonText}>Add</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.stepper}>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => changeQty(item.id, -1)}
                            accessibilityLabel={`Remove one ${item.title}`}
                          >
                            <Ionicons
                              name="remove"
                              size={16}
                              color={KFitColors.text}
                            />
                          </TouchableOpacity>
                          <Text style={styles.stepQty}>{qty}</Text>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => changeQty(item.id, 1)}
                            accessibilityLabel={`Add one more ${item.title}`}
                          >
                            <Ionicons
                              name="add"
                              size={16}
                              color={KFitColors.text}
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Cart */}
              <View style={styles.cartBox}>
                <View style={styles.cartHeader}>
                  <Text style={styles.fieldLabel}>
                    YOUR CART {cartCount > 0 ? `(${cartCount})` : ""}
                  </Text>
                  {cartCount > 0 && (
                    <TouchableOpacity onPress={() => setCart({})} hitSlop={8}>
                      <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {cartCount === 0 ? (
                  <Text style={styles.cartEmpty}>
                    Add whey, shakes, snacks or gear to check out together.
                  </Text>
                ) : (
                  <>
                    {cartLines.map(({ item, qty }) => (
                      <View key={item.id} style={styles.cartLine}>
                        <Text style={styles.cartLineName} numberOfLines={1}>
                          {qty} × {item.title}
                        </Text>
                        <Text style={styles.cartLineAmt}>
                          ${(item.price * qty).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                    <View style={styles.cartDivider} />
                    <View style={styles.cartLine}>
                      <Text style={styles.cartMuted}>Subtotal</Text>
                      <Text style={styles.cartMuted}>
                        ${cartSubtotal.toFixed(2)}
                      </Text>
                    </View>
                    {TAX_RATE > 0 && (
                      <View style={styles.cartLine}>
                        <Text style={styles.cartMuted}>
                          Tax ({Math.round(TAX_RATE * 100)}%)
                        </Text>
                        <Text style={styles.cartMuted}>
                          ${cartTax.toFixed(2)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.cartLine}>
                      <Text style={styles.totalLabel}>Checkout total</Text>
                      <Text style={styles.totalAmount}>
                        ${cartTotal.toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.payRow}>
                {PAYMENT_METHODS.map(({ method, label, icon }) => (
                  <TouchableOpacity
                    key={method}
                    activeOpacity={0.8}
                    disabled={cartCount === 0}
                    style={[
                      styles.payButton,
                      cartCount === 0 && styles.disabled,
                    ]}
                    onPress={() => processPosPayment(method)}
                  >
                    <Ionicons name={icon} size={16} color={KFitColors.accent} />
                    <Text style={styles.payButtonText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={cartCount === 0}
                style={[styles.cashButton, cartCount === 0 && styles.disabled]}
                onPress={() => processPosPayment("Cash")}
              >
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color={KFitColors.onAccent}
                />
                <Text style={styles.cashButtonText}>
                  Complete cash transaction
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Outstanding invoices */}
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
                <View style={styles.emptyRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={KFitColors.accent}
                  />
                  <Text style={styles.emptyText}>
                    All invoices are settled.
                  </Text>
                </View>
              ) : (
                outstandingInvoices.map((invoice) => (
                  <View key={invoice.id} style={styles.dueRow}>
                    <View style={styles.posItemText}>
                      <Text style={styles.dueName}>{invoice.title}</Text>
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
                        onPress={() => remindDues(invoice)}
                      >
                        <Text style={styles.remindText}>Remind</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.collectButton}
                        onPress={() => payDues(invoice)}
                      >
                        <Text style={styles.collectText}>Pay</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Spending overview chart */}
          <View style={styles.revenueSection}>
            <View style={styles.revenueHeader}>
              <Text style={styles.sectionTitleInline}>Spending overview</Text>
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
                <Text style={styles.revenueTotalLabel}>
                  ${totalSpent.toFixed(2)}
                </Text>
                <Text style={styles.revenueTotalSublabel}>this month</Text>
              </View>
            </View>
          </View>

          {/* Spending mix */}
          <View style={styles.mixSection}>
            <Text style={styles.sectionTitleTight}>Spending mix</Text>
            <Text style={styles.mixPeriod}>October 2026</Text>
            <View style={styles.mixGrid}>
              {SPEND_MIX.map((m) => (
                <View key={m.label} style={styles.mixCard}>
                  <View style={styles.mixIconContainer}>
                    <Ionicons
                      name={m.icon}
                      size={20}
                      color={KFitColors.accent}
                    />
                  </View>
                  <Text style={styles.mixLabel}>{m.label}</Text>
                  <Text style={styles.mixAmount}>{m.amount}</Text>
                  <View style={styles.mixBar}>
                    <View style={[styles.mixBarFill, { width: `${m.pct}%` }]} />
                  </View>
                  <Text style={styles.mixPercentage}>{m.pct}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Next charge */}
          <View style={styles.payoutSection}>
            <View style={styles.payoutCard}>
              <View style={styles.payoutLeft}>
                <Text style={styles.payoutLabel}>Next charge</Text>
                <Text style={styles.payoutDate}>Nov 01, 2026</Text>
              </View>
              <View style={styles.payoutRight}>
                <Text style={styles.payoutAmount}>$79</Text>
              </View>
            </View>
          </View>

          {/* Search & filters */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={18}
                color={KFitColors.mutedText}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search invoice or item"
                placeholderTextColor={KFitColors.mutedText}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  hitSlop={10}
                  accessibilityLabel="Clear search"
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={KFitColors.mutedText}
                  />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContainer}
            >
              {["All statuses", "Paid", "Pending", "Overdue"].map((status) => (
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
                      selectedStatus === status && styles.filterTabTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Invoice list */}
          <View style={styles.invoiceList}>
            {filteredInvoices.map((invoice) => (
              <View key={invoice.id} style={styles.invoiceCard}>
                <View style={styles.invoiceRow}>
                  <View style={styles.invoiceIconBox}>
                    <Feather
                      name={
                        invoice.status === "Paid"
                          ? "check-circle"
                          : invoice.status === "Pending"
                            ? "clock"
                            : "rotate-ccw"
                      }
                      size={16}
                      color={getStatusColor(invoice.status)}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.invoiceTitle} numberOfLines={1}>
                      {invoice.title}
                    </Text>
                    <Text style={styles.invoiceMeta}>
                      {invoice.invoiceId} · {invoice.date}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.invoiceAmount}>
                      ${invoice.amount.toFixed(2)}
                    </Text>
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
              </View>
            ))}

            {filteredInvoices.length === 0 && (
              <Text style={styles.footerText}>
                No invoices match your search.
              </Text>
            )}
          </View>

          <Text style={styles.footerText}>
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>
              KFIT ATHLETICS · MEMBER WORKSPACE
            </Text>
          </View>
        </ScrollView>

        <MemberBottomNav activeRoute="/member-payments" />
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
                  <Text style={styles.receiptKey}>Tx ID</Text>
                  <Text style={styles.receiptMono}>{receipt.txId}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Method</Text>
                  <Text style={styles.receiptValue}>{receipt.method}</Text>
                </View>

                <View style={styles.receiptDivider} />

                {receipt.lines.map((l, i) => (
                  <View key={`${l.title}-${i}`} style={styles.receiptRow}>
                    <Text style={styles.receiptValueLeft} numberOfLines={2}>
                      {l.qty} × {l.title}
                    </Text>
                    <Text style={styles.receiptMono}>
                      ${(l.price * l.qty).toFixed(2)}
                    </Text>
                  </View>
                ))}

                {receipt.tax > 0 && (
                  <>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptKey}>Subtotal</Text>
                      <Text style={styles.receiptMono}>
                        ${receipt.subtotal.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptKey}>Tax</Text>
                      <Text style={styles.receiptMono}>
                        ${receipt.tax.toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}

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
                <Ionicons
                  name="download-outline"
                  size={16}
                  color={KFitColors.text}
                />
                <Text style={styles.receiptSecondaryText}>Download PDF</Text>
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
  main: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1 },
  contentContainer: { paddingBottom: NAV_CLEARANCE },
  disabled: { opacity: 0.4 },

  /* Page header */
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width > 600 ? 24 : 16,
    paddingTop: 18,
    paddingBottom: 20,
    rowGap: 16,
    columnGap: 20,
  },
  headerLeft: { flex: 1, minWidth: width > 600 ? 260 : "100%" },
  headerTitle: {
    fontSize: width > 600 ? 28 : 25,
    fontWeight: "800",
    color: KFitColors.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: 13, lineHeight: 19, color: KFitColors.mutedText },
  headerButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: KFitColors.text,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: KFitColors.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: KFitColors.onAccent,
  },

  /* Overview */
  overviewSection: {
    paddingHorizontal: width > 600 ? 24 : 16,
    marginBottom: 24,
  },
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
    width: width > 1000 ? "23.5%" : "48%",
    flexGrow: 1,
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    padding: width > 600 ? 17 : 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 17,
    color: KFitColors.mutedText,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: KFitColors.accent,
    marginBottom: 4,
  },
  statChange: { fontSize: 11, color: KFitColors.accent, fontWeight: "600" },
  statSubtitle: { fontSize: 11, color: KFitColors.mutedText },
  statSubtitleWarning: { fontSize: 11, color: "#F59E0B" },

  /* POS / Store */
  posSection: { paddingHorizontal: 16, marginBottom: 24 },
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.accent + "1A",
  },
  nfcIcon: { transform: [{ rotate: "90deg" }] },
  nfcBadgeText: { fontSize: 11, fontWeight: "700", color: KFitColors.accent },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: KFitColors.mutedText,
  },
  posItems: { gap: 8, marginBottom: 16 },
  posItemText: { flex: 1 },
  posItemTitle: { fontSize: 13, fontWeight: "600", color: KFitColors.text },
  posItemSubtitle: { fontSize: 11, color: KFitColors.mutedText, marginTop: 2 },
  totalLabel: { fontSize: 13, fontWeight: "700", color: KFitColors.text },
  totalAmount: { fontSize: 22, fontWeight: "bold", color: KFitColors.accent },
  payRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  payButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  payButtonText: { fontSize: 13, fontWeight: "600", color: KFitColors.text },
  cashButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  cashButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: KFitColors.onAccent,
  },

  /* Store categories + rows */
  catScroll: { marginBottom: 14, marginHorizontal: -4 },
  catRow: { gap: 8, paddingHorizontal: 4 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  catChipActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  catText: { fontSize: 12, fontWeight: "600", color: KFitColors.mutedText },
  catTextActive: { color: KFitColors.onAccent, fontWeight: "800" },

  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  storeRowActive: { borderColor: KFitColors.accent },
  storeIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
  },
  storePrice: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.accent,
    marginTop: 3,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: KFitColors.onAccent,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  stepQty: {
    minWidth: 16,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    color: KFitColors.text,
  },

  /* Cart */
  cartBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    marginBottom: 12,
    gap: 6,
  },
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  clearText: { fontSize: 12, fontWeight: "700", color: KFitColors.error },
  cartEmpty: { fontSize: 12, lineHeight: 17, color: KFitColors.mutedText },
  cartLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cartLineName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: KFitColors.text,
  },
  cartLineAmt: { fontSize: 13, fontWeight: "700", color: KFitColors.text },
  cartDivider: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 4,
  },
  cartMuted: { fontSize: 12, color: KFitColors.mutedText },

  /* Outstanding */
  outstandingSection: { paddingHorizontal: 16, marginBottom: 24 },
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
    color: "#F59E0B",
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  emptyText: { fontSize: 13, color: KFitColors.mutedText },
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

  /* Chart */
  revenueSection: { paddingHorizontal: 16, marginBottom: 24 },
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

  /* Mix */
  mixSection: { paddingHorizontal: 16, marginBottom: 24 },
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

  /* Payout / next charge */
  payoutSection: { paddingHorizontal: 16, marginBottom: 24 },
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

  /* Search */
  searchSection: { paddingHorizontal: 16, marginBottom: 16 },
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
  searchIcon: { marginRight: 10 },
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
  filterTabText: {
    fontSize: 13,
    color: KFitColors.text,
    fontWeight: "500",
  },
  filterTabTextActive: { color: KFitColors.onAccent },

  /* Invoice list */
  invoiceList: { paddingHorizontal: 16 },
  invoiceCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    padding: 12,
    marginBottom: 10,
  },
  invoiceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  invoiceIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
  },
  invoiceTitle: { fontSize: 13, fontWeight: "700", color: KFitColors.text },
  invoiceMeta: { fontSize: 11, color: KFitColors.mutedText, marginTop: 2 },
  invoiceAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: KFitColors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },

  /* Footer */
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

  /* Receipt modal */
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
  receiptDivider: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 2,
  },
  receiptKey: { fontSize: 13, color: KFitColors.mutedText },
  receiptValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "600",
    color: KFitColors.text,
  },
  receiptValueLeft: {
    flex: 1,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
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
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  receiptPrimaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: KFitColors.onAccent,
  },
});
