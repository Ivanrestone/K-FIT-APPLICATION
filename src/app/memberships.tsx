import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import { useRegisterMember } from "@/hooks/use-register-member";
import { useMemo, useState } from "react";
import {
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Status = "Active" | "Expiring" | "Pending" | "Expired";

interface Subscription {
  id: string;
  memberName: string;
  subscriptionId: string;
  amount: number;
  nextBilling: string;
  status: Status;
}

const STATUS_FILTERS: ("All statuses" | Status)[] = [
  "All statuses",
  "Active",
  "Expiring",
  "Pending",
  "Expired",
];

const initialSubscriptions: Subscription[] = [
  {
    id: "1",
    memberName: "Jordan Lee",
    subscriptionId: "SUB-1042",
    amount: 45,
    nextBilling: "Nov 01, 2026",
    status: "Active",
  },
  {
    id: "2",
    memberName: "Sam Rivera",
    subscriptionId: "SUB-0988",
    amount: 45,
    nextBilling: "Nov 12, 2026",
    status: "Active",
  },
  {
    id: "3",
    memberName: "Maya Patel",
    subscriptionId: "SUB-0851",
    amount: 45,
    nextBilling: "Oct 24, 2026",
    status: "Expiring",
  },
  {
    id: "4",
    memberName: "Noah Williams",
    subscriptionId: "SUB-1341",
    amount: 45,
    nextBilling: "Oct 15, 2026",
    status: "Pending",
  },
  {
    id: "5",
    memberName: "Liam Wilson",
    subscriptionId: "SUB-0642",
    amount: 45,
    nextBilling: "Oct 15, 2026",
    status: "Active",
  },
];

const WIDE_BREAKPOINT = 820;

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

const nextMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return formatDate(d);
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function MembershipsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const { registerMember, loading: registerLoading } = useRegisterMember();

  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(initialSubscriptions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"All statuses" | Status>(
    "All statuses",
  );

  // Form modal (shared by Edit and Add)
  const [formMode, setFormMode] = useState<"edit" | "add" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formError, setFormError] = useState("");

  const statusColor = (status: Status) => {
    switch (status) {
      case "Active":
        return KFitColors.accent;
      case "Expiring":
        return KFitColors.warning;
      case "Expired":
        return KFitColors.error;
      case "Pending":
        return KFitColors.mutedText;
    }
  };

  const counts = useMemo(
    () => ({
      total: subscriptions.length,
      renewals: subscriptions.filter((s) => s.status === "Expiring").length,
      pending: subscriptions.filter((s) => s.status === "Pending").length,
    }),
    [subscriptions],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subscriptions.filter((s) => {
      const matchesSearch =
        !q ||
        s.memberName.toLowerCase().includes(q) ||
        s.subscriptionId.toLowerCase().includes(q);
      const matchesStatus =
        selectedStatus === "All statuses" || s.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, searchQuery, selectedStatus]);

  // ---- Form actions ----
  const openAdd = () => {
    setFormMode("add");
    setEditingId(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormAmount("45");
    setFormError("");
  };

  const openEdit = (sub: Subscription) => {
    setFormMode("edit");
    setEditingId(sub.id);
    setFormName(sub.memberName);
    setFormEmail("");
    setFormPassword("");
    setFormAmount(String(sub.amount));
    setFormError("");
  };

  const closeForm = () => setFormMode(null);

  const saveForm = async () => {
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount < 0) {
      setFormError("Enter a valid dollar amount.");
      return;
    }

    if (formMode === "add") {
      if (!formName.trim()) {
        setFormError("Enter the member's full name.");
        return;
      }
      if (!formEmail.trim()) {
        setFormError("Enter the member's email.");
        return;
      }
      if (!formPassword.trim()) {
        setFormError("Enter a password for the member.");
        return;
      }

      const result = await registerMember({
        email: formEmail.trim(),
        password: formPassword.trim(),
        fullName: formName.trim(),
      });

      if (result.success) {
        const num = Math.floor(1000 + Math.random() * 9000);
        setSubscriptions((prev) => [
          {
            id: result.userId || `new-${Date.now()}`,
            memberName: formName.trim(),
            subscriptionId: `SUB-${num}`,
            amount,
            nextBilling: nextMonth(),
            status: "Active",
          },
          ...prev,
        ]);
        setFormName("");
        setFormEmail("");
        setFormPassword("");
        setFormAmount("45");
        setFormError("");
        closeForm();
        Alert.alert("Success", "Member registered successfully!");
      } else {
        setFormError(result.error || "Registration failed");
        Alert.alert("Registration Error", result.error || "Registration failed");
      }
    } else if (formMode === "edit" && editingId) {
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === editingId ? { ...s, amount } : s,
        ),
      );
      closeForm();
    }
  };

  const renderStatus = (status: Status) => {
    const color = statusColor(status);
    return (
      <View style={[styles.statusBadge, { borderColor: color }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusText, { color }]}>{status}</Text>
      </View>
    );
  };

  const renderChips = <T extends string>(
    options: T[],
    selected: T,
    onSelect: (v: T) => void,
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
      style={styles.chipScroll}
    >
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onSelect(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.filterTab, active && styles.filterTabActive]}
          >
            <Text
              style={[
                styles.filterTabText,
                active && styles.filterTabTextActive,
              ]}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const identity = (s: Subscription) => (
    <View style={styles.identity}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(s.memberName)}</Text>
      </View>
      <View style={styles.flex1}>
        <Text style={styles.memberName}>{s.memberName}</Text>
        <Text style={styles.subscriptionId}>{s.subscriptionId}</Text>
      </View>
    </View>
  );

  const editButton = (s: Subscription) => (
    <Pressable
      onPress={() => openEdit(s)}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${s.memberName}'s subscription`}
      style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
    >
      <Text style={styles.editButtonText}>Edit</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/memberships" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={[styles.header, !isWide && styles.headerStacked]}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Memberships</Text>
              <Text style={styles.headerSubtitle}>
                Flexible plans. Lasting commitment. Manage what membership means
                at FORM.
              </Text>
            </View>
            <Pressable
              onPress={openAdd}
              accessibilityRole="button"
              accessibilityLabel="Add member"
              style={({ pressed }) => [
                styles.addButtonWrapper,
                pressed && styles.pressed,
              ]}
            >
              <ImageBackground
                source={require("../../assets/images/gold-texture.jpg")}
                resizeMode="cover"
                style={styles.addButton}
                imageStyle={styles.addButtonImage}
              >
                <Text style={styles.addButtonText}>+ Add member</Text>
              </ImageBackground>
            </Pressable>
          </View>

          {/* Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewLabel}>Subscriptions loaded</Text>
                <Text style={styles.overviewNumber}>{counts.total}</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewLabel}>Renewals due</Text>
                <Text style={styles.overviewNumber}>{counts.renewals}</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewLabel}>Pending</Text>
                <Text style={styles.overviewNumber}>{counts.pending}</Text>
              </View>
            </View>
          </View>

          {/* Revenue */}
          <View style={styles.section}>
            <View style={styles.revenueCard}>
              <View style={styles.flex1}>
                <Text style={styles.revenueLabel}>1,284 active</Text>
                <Text style={styles.revenueSublabel}>monthly revenue</Text>
              </View>
              <Text style={styles.revenueAmount}>$48,920</Text>
            </View>
          </View>

          {/* Search + filters */}
          <View style={styles.section}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search member or subscription ID"
                placeholderTextColor={KFitColors.mutedText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search subscriptions"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery("")}
                  hitSlop={8}
                  accessibilityLabel="Clear search"
                >
                  <Text style={styles.clearIcon}>✕</Text>
                </Pressable>
              )}
            </View>
            {renderChips(STATUS_FILTERS, selectedStatus, setSelectedStatus)}
          </View>

          {/* List */}
          <View style={styles.section}>
            <View style={styles.tableCard}>
              {isWide && (
                <View style={styles.listHeader}>
                  <Text style={[styles.headerText, styles.colMember]}>
                    Member
                  </Text>
                  <Text style={[styles.headerText, styles.colAmount]}>
                    Amount
                  </Text>
                  <Text style={[styles.headerText, styles.colBilling]}>
                    Next billing
                  </Text>
                  <Text style={[styles.headerText, styles.colStatus]}>
                    Status
                  </Text>
                  <Text style={[styles.headerText, styles.colAction]}>
                    Action
                  </Text>
                </View>
              )}

              {filtered.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No subscriptions found</Text>
                  <Text style={styles.emptyText}>
                    Try a different search or clear the filters.
                  </Text>
                  <Pressable
                    style={styles.resetButton}
                    onPress={() => {
                      setSearchQuery("");
                      setSelectedStatus("All statuses");
                    }}
                  >
                    <Text style={styles.resetText}>Reset filters</Text>
                  </Pressable>
                </View>
              ) : (
                filtered.map((s, i) => {
                  const isLast = i === filtered.length - 1;
                  return (
                    <View
                      key={s.id}
                      style={[styles.row, !isLast && styles.rowDivider]}
                    >
                      {isWide ? (
                        <View style={styles.rowWide}>
                          <View style={styles.colMember}>{identity(s)}</View>
                          <View style={styles.colAmount}>
                            <Text style={styles.amountText}>
                              ${s.amount.toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.colBilling}>
                            <Text style={styles.billingText}>
                              {s.nextBilling}
                            </Text>
                          </View>
                          <View style={styles.colStatus}>
                            {renderStatus(s.status)}
                          </View>
                          <View style={styles.colAction}>{editButton(s)}</View>
                        </View>
                      ) : (
                        <View style={styles.rowNarrow}>
                          <View style={styles.rowNarrowTop}>
                            {identity(s)}
                            {renderStatus(s.status)}
                          </View>
                          <View style={styles.rowNarrowMeta}>
                            <View>
                              <Text style={styles.metaLabel}>Amount</Text>
                              <Text style={styles.amountText}>
                                ${s.amount.toFixed(2)}
                              </Text>
                            </View>
                            <View>
                              <Text style={styles.metaLabel}>Next billing</Text>
                              <Text style={styles.billingText}>
                                {s.nextBilling}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.rowNarrowAction}>
                            {editButton(s)}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            <Text style={styles.footerText}>
              Showing {filtered.length} of {subscriptions.length} loaded
              subscriptions
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>
              FORM ATHLETICS • ADMINISTRATOR WORKSPACE
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Add / Edit modal */}
      <Modal
        visible={formMode !== null}
        transparent
        animationType="fade"
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {formMode === "add" ? "Register member" : "Edit subscription"}
              </Text>
              <Pressable
                onPress={closeForm}
                hitSlop={8}
                accessibilityLabel="Close"
              >
                <Text style={styles.clearIcon}>✕</Text>
              </Pressable>
            </View>

            {formMode === "edit" ? (
              <Text style={styles.modalSubtitle}>{formName}</Text>
            ) : (
              <>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Full name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formName}
                    onChangeText={setFormName}
                    placeholder="e.g. Jordan Lee"
                    placeholderTextColor={KFitColors.mutedText}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formEmail}
                    onChangeText={setFormEmail}
                    placeholder="name@email.com"
                    placeholderTextColor={KFitColors.mutedText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formPassword}
                    onChangeText={setFormPassword}
                    placeholder="Enter password"
                    placeholderTextColor={KFitColors.mutedText}
                    secureTextEntry
                  />
                </View>
              </>
            )}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Monthly amount ($)</Text>
              <TextInput
                style={styles.modalInput}
                value={formAmount}
                onChangeText={(t) => {
                  setFormAmount(t);
                  setFormError("");
                }}
                keyboardType="decimal-pad"
                placeholder="Enter amount"
                placeholderTextColor={KFitColors.mutedText}
              />
            </View>

            {formError !== "" && (
              <Text style={styles.errorText}>{formError}</Text>
            )}

            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancel} onPress={closeForm}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalSaveWrapper}
                onPress={saveForm}
                disabled={registerLoading}
              >
                <ImageBackground
                  source={require("../../assets/images/gold-texture.jpg")}
                  resizeMode="cover"
                  style={[styles.modalSave, registerLoading && styles.modalSaveDisabled]}
                  imageStyle={styles.modalSaveImage}
                >
                  <Text style={styles.modalSaveText}>
                    {registerLoading
                      ? "Registering..."
                      : formMode === "add"
                      ? "Save & issue pass"
                      : "Save changes"}
                  </Text>
                </ImageBackground>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, flexDirection: "row" },
  content: { flex: 1, backgroundColor: KFitColors.background },
  contentContainer: { paddingBottom: 96 },
  flex1: { flex: 1 },
  pressed: { opacity: 0.8 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  headerStacked: { flexDirection: "column", alignItems: "flex-start" },
  headerLeft: { flexShrink: 1 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: KFitColors.text,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: KFitColors.mutedText,
    maxWidth: 520,
  },
  addButtonWrapper: {
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  addButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  addButtonImage: {
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: KFitColors.onAccent,
  },

  // Sections
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: KFitColors.text,
    marginBottom: 12,
  },

  // Overview
  overviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  overviewCard: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  overviewLabel: { fontSize: 12, color: KFitColors.mutedText, marginBottom: 8 },
  overviewNumber: { fontSize: 28, fontWeight: "800", color: KFitColors.accent },

  // Revenue
  revenueCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: KFitColors.accent,
    borderRadius: 14,
    padding: 20,
  },
  revenueLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: KFitColors.onAccent,
    opacity: 0.75,
  },
  revenueSublabel: {
    fontSize: 12,
    color: KFitColors.onAccent,
    opacity: 0.65,
    marginTop: 2,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: KFitColors.onAccent,
  },

  // Search + filters
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: KFitColors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 14, marginRight: 10 },
  searchInput: { flex: 1, height: 46, fontSize: 14, color: KFitColors.text },
  clearIcon: { fontSize: 14, color: KFitColors.mutedText, padding: 4 },
  chipScroll: { marginBottom: 10 },
  chipRow: { gap: 8 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  filterTabActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  filterTabText: { fontSize: 13, color: KFitColors.text, fontWeight: "600" },
  filterTabTextActive: { color: KFitColors.onAccent },

  // Table
  tableCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    overflow: "hidden",
  },
  listHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  headerText: {
    fontSize: 11,
    fontWeight: "700",
    color: KFitColors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  colMember: { flex: 2.4, paddingRight: 12 },
  colPlan: { flex: 1.2, paddingRight: 12 },
  colAmount: { flex: 1.2, paddingRight: 12 },
  colBilling: { flex: 1.6, paddingRight: 12 },
  colStatus: { flex: 1.4, paddingRight: 12 },
  colAction: { flex: 1 },

  row: { paddingHorizontal: 16, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: KFitColors.border },
  rowWide: { flexDirection: "row", alignItems: "center" },
  rowNarrow: { gap: 12 },
  rowNarrowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  rowNarrowMeta: { flexDirection: "row", justifyContent: "space-between" },
  rowNarrowAction: { alignItems: "flex-start" },
  metaLabel: { fontSize: 11, color: KFitColors.mutedText, marginBottom: 2 },

  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "800", color: KFitColors.onAccent },
  memberName: { fontSize: 14, fontWeight: "700", color: KFitColors.text },
  subscriptionId: { fontSize: 11, color: KFitColors.mutedText, marginTop: 2 },
  planText: { fontSize: 13, fontWeight: "600", color: KFitColors.text },
  amountText: { fontSize: 13, fontWeight: "700", color: KFitColors.text },
  billingText: { fontSize: 12, color: KFitColors.mutedText },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },

  editButton: {
    borderWidth: 1,
    borderColor: KFitColors.accent,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: { fontSize: 12, fontWeight: "700", color: KFitColors.accent },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: KFitColors.text,
    marginBottom: 4,
  },
  emptyText: { fontSize: 13, color: KFitColors.mutedText, marginBottom: 16 },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.accent,
  },
  resetText: { fontSize: 13, fontWeight: "600", color: KFitColors.accent },

  // Footer
  footerText: {
    fontSize: 12,
    color: KFitColors.mutedText,
    textAlign: "center",
    marginTop: 14,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  footerBrand: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: KFitColors.mutedText,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: KFitColors.text },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: KFitColors.accent,
    marginBottom: 16,
  },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: KFitColors.mutedText,
    marginBottom: 6,
  },
  modalInput: {
    height: 44,
    backgroundColor: KFitColors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: KFitColors.text,
  },
  planPicker: { flexDirection: "row", gap: 8 },
  planOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  planOptionActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  planOptionName: { fontSize: 13, fontWeight: "700", color: KFitColors.text },
  planOptionNameActive: { color: KFitColors.onAccent },
  planOptionPrice: { fontSize: 11, color: KFitColors.mutedText, marginTop: 2 },
  errorText: { fontSize: 12, color: KFitColors.error, marginBottom: 12 },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalCancel: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  modalCancelText: { fontSize: 14, fontWeight: "600", color: KFitColors.text },
  modalSaveWrapper: {
    flex: 1.4,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  modalSave: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  modalSaveDisabled: {
    opacity: 0.6,
  },
  modalSaveImage: {
    borderRadius: 10,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: "900",
    color: KFitColors.onAccent,
  },
});
