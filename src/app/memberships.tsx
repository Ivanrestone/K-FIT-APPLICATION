import Sidebar from "@/components/Sidebar";
import { formatMoney } from "@/constants/gym";
import { KFitColors } from "@/constants/theme";
import { useRegisterMember } from "@/hooks/use-register-member";
import { useRevenue } from "@/hooks/use-revenue";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;
type Status = "Active" | "Expiring" | "Pending" | "Expired";

interface Subscription {
  id: string;
  memberName: string;
  subscriptionId: string;
  amount: number;
  nextBilling: string;
  status: Status;
}

const STATUS_FILTERS: {
  key: "All statuses" | Status;
  icon: IconName;
}[] = [
  { key: "All statuses", icon: "apps" },
  { key: "Active", icon: "checkmark-circle" },
  { key: "Expiring", icon: "time" },
  { key: "Pending", icon: "hourglass" },
  { key: "Expired", icon: "close-circle" },
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

const statusColor = (status: Status) =>
  status === "Active"
    ? KFitColors.accent
    : status === "Expiring"
      ? KFitColors.warning
      : status === "Expired"
        ? KFitColors.error
        : KFitColors.mutedText;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email: string): string | null => {
  const trimmed = email.trim();
  if (!trimmed) return "Enter the member's email.";
  if (!EMAIL_RE.test(trimmed)) return "Enter a valid email address.";
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return "Enter a password for the member.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
};

export default function MembershipsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const { registerMember, loading: registerLoading } = useRegisterMember();
  const { monthlyRevenue } = useRevenue();

  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(initialSubscriptions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"All statuses" | Status>(
    "All statuses",
  );

  const [formMode, setFormMode] = useState<"edit" | "add" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formError, setFormError] = useState("");

  const counts = useMemo(
    () => ({
      total: subscriptions.length,
      renewals: subscriptions.filter((s) => s.status === "Expiring").length,
      pending: subscriptions.filter((s) => s.status === "Pending").length,
    }),
    [subscriptions],
  );

  const statusCounts = useMemo(() => {
    const base: Record<"All statuses" | Status, number> = {
      "All statuses": subscriptions.length,
      Active: 0,
      Expiring: 0,
      Pending: 0,
      Expired: 0,
    };
    subscriptions.forEach((s) => (base[s.status] += 1));
    return base;
  }, [subscriptions]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subscriptions.filter((s) => {
      const matchesSearch =
        q.length === 0 ||
        s.memberName.toLowerCase().includes(q) ||
        s.subscriptionId.toLowerCase().includes(q);
      const matchesStatus =
        selectedStatus === "All statuses" || s.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, searchQuery, selectedStatus]);

  const openAdd = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFormMode("add");
    setEditingId(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormAmount("45");
    setFormError("");
  };

  const openEdit = (sub: Subscription) => {
    void Haptics.selectionAsync();
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
      const emailError = validateEmail(formEmail);
      if (emailError) {
        setFormError(emailError);
        return;
      }
      const passwordError = validatePassword(formPassword);
      if (passwordError) {
        setFormError(passwordError);
        return;
      }

      const result = await registerMember({
        email: formEmail.trim(),
        password: formPassword,
        fullName: formName.trim(),
      });

      if (result.success) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
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
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFormError(result.error || "Registration failed");
        Alert.alert(
          "Registration Error",
          result.error || "Registration failed",
        );
      }
    } else if (formMode === "edit" && editingId) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, amount } : s)),
      );
      closeForm();
    }
  };

  const renderStatus = (status: Status) => {
    const color = statusColor(status);
    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: color + "1A", borderColor: color + "44" },
        ]}
      >
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusText, { color }]}>
          {status.toUpperCase()}
        </Text>
      </View>
    );
  };

  const identity = (s: Subscription) => (
    <View style={styles.identity}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(s.memberName)}</Text>
      </View>
      <View style={styles.flex1}>
        <Text style={styles.memberName} numberOfLines={1}>
          {s.memberName}
        </Text>
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
      <Ionicons name="create-outline" size={12} color={KFitColors.accent} />
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
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.pageHeader, isWide && styles.pageHeaderWide]}>
            <View style={styles.headerLeft}>
              <Text style={styles.eyebrow}>SUBSCRIPTIONS</Text>
              <Text style={styles.headerTitle}>Memberships</Text>
              <Text style={styles.headerSubtitle}>
                Flexible plans. Lasting commitment. Manage what membership means
                at KFIT.
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
                <Ionicons name="add" size={16} color={KFitColors.onAccent} />
                <Text style={styles.addButtonText}>Add member</Text>
              </ImageBackground>
            </Pressable>
          </View>

          {/* Overview */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionEyebrow}>OVERVIEW</Text>
              <Text style={styles.sectionCaption}>LIVE COUNTS</Text>
            </View>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewCard}>
                <View style={styles.overviewTop}>
                  <Text style={styles.overviewLabel}>Subscriptions</Text>
                  <View style={styles.overviewIcon}>
                    <Ionicons name="card" size={12} color={KFitColors.accent} />
                  </View>
                </View>
                <Text style={styles.overviewNumber}>{counts.total}</Text>
                <Text style={styles.overviewSub}>Loaded plans</Text>
              </View>
              <View style={styles.overviewCard}>
                <View style={styles.overviewTop}>
                  <Text style={styles.overviewLabel}>Renewals</Text>
                  <View style={[styles.overviewIcon, styles.overviewIconWarn]}>
                    <Ionicons
                      name="time"
                      size={12}
                      color={KFitColors.warning}
                    />
                  </View>
                </View>
                <Text style={styles.overviewNumber}>{counts.renewals}</Text>
                <Text
                  style={[styles.overviewSub, { color: KFitColors.warning }]}
                >
                  Expiring soon
                </Text>
              </View>
              <View style={styles.overviewCard}>
                <View style={styles.overviewTop}>
                  <Text style={styles.overviewLabel}>Pending</Text>
                  <View style={styles.overviewIcon}>
                    <Ionicons
                      name="hourglass"
                      size={12}
                      color={KFitColors.accent}
                    />
                  </View>
                </View>
                <Text style={styles.overviewNumber}>{counts.pending}</Text>
                <Text style={styles.overviewSub}>Awaiting activation</Text>
              </View>
            </View>
          </View>

          {/* Revenue */}
          <View style={styles.section}>
            <View style={styles.revenueCard}>
              <View style={styles.flex1}>
                <Text style={styles.revenueEyebrow}>MONTHLY REVENUE</Text>
                <Text style={styles.revenueAmount}>
                  {formatMoney(monthlyRevenue)}
                </Text>
                <Text style={styles.revenueSublabel}>
                  {statusCounts.Active} active subscriptions
                </Text>
              </View>
            </View>
          </View>

          {/* Search + filters */}
          <View style={styles.section}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color={KFitColors.mutedText} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search member or subscription ID"
                placeholderTextColor={KFitColors.mutedText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                accessibilityLabel="Search subscriptions"
              />
              {searchQuery.length > 0 && (
                <Pressable
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
                </Pressable>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              style={styles.chipScroll}
            >
              {STATUS_FILTERS.map((f) => {
                const active = selectedStatus === f.key;
                const count = statusCounts[f.key];
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setSelectedStatus(f.key);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${f.key}, ${count} subscriptions`}
                    style={({ pressed }) => [
                      styles.filterTab,
                      active && styles.filterTabActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name={f.icon}
                      size={12}
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
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* List */}
          <View style={styles.section}>
            <View style={styles.tableCard}>
              {isWide && filtered.length > 0 && (
                <View style={styles.listHeader}>
                  <Text style={[styles.headerText, styles.colMember]}>
                    MEMBER
                  </Text>
                  <Text style={[styles.headerText, styles.colAmount]}>
                    AMOUNT
                  </Text>
                  <Text style={[styles.headerText, styles.colBilling]}>
                    NEXT BILLING
                  </Text>
                  <Text style={[styles.headerText, styles.colStatus]}>
                    STATUS
                  </Text>
                  <Text style={[styles.headerText, styles.colAction]}>
                    ACTION
                  </Text>
                </View>
              )}

              {filtered.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons
                      name="card-outline"
                      size={22}
                      color={KFitColors.accent}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {searchQuery ? "No matches" : "No subscriptions yet"}
                  </Text>
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? "Try a different search or reset the filter."
                      : "Add your first member to create a subscription."}
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.resetButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setSearchQuery("");
                      setSelectedStatus("All statuses");
                    }}
                  >
                    <Ionicons
                      name="refresh"
                      size={13}
                      color={KFitColors.accent}
                    />
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
                              <Text style={styles.metaLabel}>AMOUNT</Text>
                              <Text style={styles.amountText}>
                                ${s.amount.toFixed(2)}
                              </Text>
                            </View>
                            <View>
                              <Text style={styles.metaLabel}>NEXT BILLING</Text>
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
              Showing {filtered.length} of {subscriptions.length} subscriptions
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>KFIT · ADMIN WORKSPACE</Text>
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
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIcon}>
                  <Ionicons
                    name={formMode === "add" ? "person-add" : "create"}
                    size={14}
                    color={KFitColors.accent}
                  />
                </View>
                <Text style={styles.modalTitle}>
                  {formMode === "add" ? "Register member" : "Edit subscription"}
                </Text>
              </View>
              <Pressable
                onPress={closeForm}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={KFitColors.mutedText} />
              </Pressable>
            </View>

            {formMode === "edit" ? (
              <Text style={styles.modalSubtitle}>{formName}</Text>
            ) : (
              <>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. Jordan Lee"
                  placeholderTextColor={KFitColors.mutedText}
                />

                <Text style={styles.fieldLabel}>EMAIL</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formEmail}
                  onChangeText={setFormEmail}
                  placeholder="name@email.com"
                  placeholderTextColor={KFitColors.mutedText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formPassword}
                  onChangeText={setFormPassword}
                  placeholder="Enter a secure password"
                  placeholderTextColor={KFitColors.mutedText}
                  secureTextEntry
                />
              </>
            )}

            <Text style={styles.fieldLabel}>MONTHLY AMOUNT ($)</Text>
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

            {formError !== "" && (
              <Text style={styles.errorText}>{formError}</Text>
            )}

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCancel,
                  pressed && styles.pressed,
                ]}
                onPress={closeForm}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalSaveWrapper,
                  pressed && styles.pressed,
                ]}
                onPress={saveForm}
                disabled={registerLoading}
              >
                <ImageBackground
                  source={require("../../assets/images/gold-texture.jpg")}
                  resizeMode="cover"
                  style={[
                    styles.modalSave,
                    registerLoading && styles.modalSaveDisabled,
                  ]}
                  imageStyle={styles.modalSaveImage}
                >
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={KFitColors.onAccent}
                  />
                  <Text style={styles.modalSaveText}>
                    {registerLoading
                      ? "Registering…"
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
  contentContainer: { paddingBottom: 128 },
  flex1: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },

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
    lineHeight: 19,
    color: KFitColors.mutedText,
    marginTop: 2,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonImage: { borderRadius: 10 },
  addButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: KFitColors.onAccent,
    letterSpacing: 0.2,
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

  /* Overview */
  overviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  overviewCard: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    gap: 2,
  },
  overviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: KFitColors.mutedText,
    letterSpacing: 0.6,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  overviewIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
  },
  overviewIconWarn: {
    backgroundColor: KFitColors.warning + "14",
    borderColor: KFitColors.warning + "33",
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: KFitColors.text,
    fontFamily: "monospace",
    letterSpacing: -0.4,
  },
  overviewSub: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },

  /* Revenue */
  revenueCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: KFitColors.accent,
    borderRadius: 16,
    padding: 18,
  },
  revenueEyebrow: {
    color: KFitColors.onAccent,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
    opacity: 0.8,
  },
  revenueAmount: {
    fontSize: 30,
    fontWeight: "900",
    color: KFitColors.onAccent,
    letterSpacing: -0.6,
    fontFamily: "monospace",
    marginTop: 2,
  },
  revenueSublabel: {
    fontSize: 11,
    color: KFitColors.onAccent,
    opacity: 0.75,
    marginTop: 2,
    fontFamily: "monospace",
  },
  revenuePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: KFitColors.onAccent + "22",
    borderWidth: 1,
    borderColor: KFitColors.onAccent + "44",
  },
  revenuePillText: {
    color: KFitColors.onAccent,
    fontSize: 11,
    fontWeight: "900",
    fontFamily: "monospace",
  },

  /* Search */
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

  /* Chips */
  chipScroll: { marginBottom: 4 },
  chipRow: { gap: 6 },
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

  /* Table */
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
  colMember: { flex: 2.4, paddingRight: 12 },
  colAmount: { flex: 1.2, paddingRight: 12 },
  colBilling: { flex: 1.6, paddingRight: 12 },
  colStatus: { flex: 1.4, paddingRight: 12 },
  colAction: { flex: 1 },

  row: { paddingHorizontal: 14, paddingVertical: 12 },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
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
  metaLabel: {
    fontSize: 9,
    color: KFitColors.mutedText,
    marginBottom: 2,
    letterSpacing: 1.2,
    fontFamily: "monospace",
    fontWeight: "900",
  },

  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
    letterSpacing: 0.3,
  },
  memberName: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.text,
    letterSpacing: -0.2,
  },
  subscriptionId: {
    fontSize: 10,
    color: KFitColors.mutedText,
    marginTop: 2,
    fontFamily: "monospace",
  },
  amountText: {
    fontSize: 13,
    fontWeight: "900",
    color: KFitColors.text,
    fontFamily: "monospace",
  },
  billingText: {
    fontSize: 11,
    color: KFitColors.mutedText,
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

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.accent + "10",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: KFitColors.accent,
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
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: KFitColors.text,
  },
  emptyText: {
    fontSize: 11,
    color: KFitColors.mutedText,
    textAlign: "center",
    lineHeight: 16,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.accent + "10",
    marginTop: 6,
  },
  resetText: {
    fontSize: 12,
    fontWeight: "900",
    color: KFitColors.accent,
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
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  footerBrand: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    color: KFitColors.mutedText,
    opacity: 0.7,
  },

  /* Modal */
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
    borderRadius: 18,
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
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.accent,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: KFitColors.mutedText,
    marginBottom: 6,
    marginTop: 10,
    fontFamily: "monospace",
  },
  modalInput: {
    height: 42,
    backgroundColor: KFitColors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    paddingHorizontal: 12,
    fontSize: 13,
    color: KFitColors.text,
  },
  errorText: {
    fontSize: 11,
    color: KFitColors.error,
    marginTop: 10,
    fontWeight: "700",
  },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalCancel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.text,
  },
  modalSaveWrapper: {
    flex: 1.6,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  modalSave: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  modalSaveDisabled: { opacity: 0.6 },
  modalSaveImage: { borderRadius: 10 },
  modalSaveText: {
    fontSize: 13,
    fontWeight: "900",
    color: KFitColors.onAccent,
  },
});
