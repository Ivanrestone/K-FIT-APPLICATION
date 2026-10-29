import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import { useMembers } from "@/hooks/use-members";
import { useRegisterMember } from "@/hooks/use-register-member";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
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
type Status = "Active" | "Pending" | "Expired";
type Filter = "all" | "active" | "pending" | "expired";

interface Member {
  id: string;
  name: string;
  email: string;
  membership: string;
  trainer: string;
  joinedDate: string;
  status: Status;
}

const QUICK_LINKS: { label: string; icon: IconName; route: string }[] = [
  { label: "Races", icon: "trophy", route: "/challenges" },
  { label: "Attendance", icon: "calendar", route: "/attendance" },
  { label: "Trainers", icon: "barbell", route: "/trainers" },
  { label: "Plans", icon: "card", route: "/memberships" },
  { label: "Payments", icon: "cash", route: "/payments" },
  { label: "Scanner", icon: "qr-code", route: "/admin-scanner" },
];

const PLANS = ["Essential", "Performance", "Elite"];

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "expired", label: "Expired" },
];

const statusColor = (status: Status) =>
  status === "Active"
    ? KFitColors.accent
    : status === "Pending"
      ? KFitColors.warning
      : KFitColors.error;

const membershipColor = (membership: string) =>
  membership === "Performance"
    ? KFitColors.accent
    : membership === "Elite"
      ? KFitColors.text
      : KFitColors.mutedText;

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function MembersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 820;
  const { members, loading: membersLoading, refetch } = useMembers();
  const { registerMember, loading: registerLoading } = useRegisterMember();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPlan, setNewPlan] = useState<string>("Performance");

  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === "Active").length;
    const pending = members.filter((m) => m.status === "Pending").length;
    const expired = members.filter((m) => m.status === "Expired").length;
    return { total, active, pending, expired };
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const matchesQuery =
        q.length === 0 ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q);
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && m.status === "Active") ||
        (filter === "pending" && m.status === "Pending") ||
        (filter === "expired" && m.status === "Expired");
      return matchesQuery && matchesFilter;
    });
  }, [members, searchQuery, filter]);

  const countFor = (f: Filter) =>
    f === "all"
      ? stats.total
      : f === "active"
        ? stats.active
        : f === "pending"
          ? stats.pending
          : stats.expired;

  const saveMember = async () => {
    if (!newName.trim()) {
      Alert.alert("Name required", "Please enter the member's full name.");
      return;
    }
    if (!newEmail.trim()) {
      Alert.alert("Email required", "Please enter the member's email.");
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert(
        "Password required",
        "Please enter a password for the member.",
      );
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await registerMember({
      email: newEmail.trim(),
      password: newPassword.trim(),
      fullName: newName.trim(),
    });

    if (result.success) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewPlan("Performance");
      setModalOpen(false);
      Alert.alert("Success", "Member registered successfully!");
      refetch();
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Registration Error", result.error || "Registration failed");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/members" />

        <View style={styles.main}>
          <AppHeader onAddPress={() => setModalOpen(true)} />

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Page title + actions */}
            <View style={[styles.pageHeader, isWide && styles.pageHeaderWide]}>
              <View style={styles.headerText}>
                <Text style={styles.eyebrow}>ROSTER MANAGEMENT</Text>
                <Text style={styles.heroTitle}>Members</Text>
                <Text style={styles.heroSubtitle}>
                  Every member. Every milestone. One connected community.
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <Pressable
                  onPress={() =>
                    Alert.alert("Import", "Member import is coming soon.")
                  }
                  style={({ pressed }) => [
                    styles.importButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Import members"
                >
                  <Ionicons
                    name="download-outline"
                    size={15}
                    color={KFitColors.text}
                  />
                  <Text style={styles.importButtonText}>Import</Text>
                </Pressable>

                <Pressable
                  onPress={() => setModalOpen(true)}
                  style={({ pressed }) => [
                    styles.addButtonWrapper,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Add member"
                >
                  <ImageBackground
                    source={require("../../assets/images/gold-texture.jpg")}
                    resizeMode="cover"
                    style={styles.addButton}
                    imageStyle={styles.addButtonImage}
                  >
                    <Ionicons
                      name="person-add"
                      size={15}
                      color={KFitColors.onAccent}
                    />
                    <Text style={styles.addButtonText}>Add member</Text>
                  </ImageBackground>
                </Pressable>
              </View>
            </View>

            {/* Quick links */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickLinksScroll}
              contentContainerStyle={styles.quickLinksContainer}
            >
              {QUICK_LINKS.map((link) => (
                <Pressable
                  key={link.route}
                  style={({ pressed }) => [
                    styles.quickLinkChip,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => router.push(link.route as any)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${link.label}`}
                >
                  <Ionicons
                    name={link.icon}
                    size={13}
                    color={KFitColors.accent}
                  />
                  <Text style={styles.quickLinkText}>{link.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Stats */}
            <View style={styles.statsGrid}>
              <View
                style={[styles.statCard, { width: isWide ? "23.5%" : "48%" }]}
              >
                <View style={styles.statTop}>
                  <Text style={styles.statLabel}>Total members</Text>
                  <View style={styles.statIconBox}>
                    <Ionicons
                      name="people"
                      size={13}
                      color={KFitColors.accent}
                    />
                  </View>
                </View>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statSub}>Across all memberships</Text>
              </View>

              <View
                style={[styles.statCard, { width: isWide ? "23.5%" : "48%" }]}
              >
                <View style={styles.statTop}>
                  <Text style={styles.statLabel}>Active</Text>
                  <View style={styles.statIconBox}>
                    <Ionicons
                      name="checkmark-circle"
                      size={13}
                      color={KFitColors.accent}
                    />
                  </View>
                </View>
                <Text style={styles.statNumber}>{stats.active}</Text>
                <Text style={styles.statSubAccent}>
                  {stats.total > 0
                    ? `${Math.round((stats.active / stats.total) * 100)}%`
                    : "0%"}{" "}
                  of all members
                </Text>
              </View>

              <View
                style={[styles.statCard, { width: isWide ? "23.5%" : "48%" }]}
              >
                <View style={styles.statTop}>
                  <Text style={styles.statLabel}>Pending</Text>
                  <View style={[styles.statIconBox, styles.statIconBoxWarn]}>
                    <Ionicons
                      name="time"
                      size={13}
                      color={KFitColors.warning}
                    />
                  </View>
                </View>
                <Text style={styles.statNumber}>{stats.pending}</Text>
                <Text style={styles.statSubWarn}>Awaiting activation</Text>
              </View>

              <View
                style={[styles.statCard, { width: isWide ? "23.5%" : "48%" }]}
              >
                <View style={styles.statTop}>
                  <Text style={styles.statLabel}>Expired</Text>
                  <View style={[styles.statIconBox, styles.statIconBoxError]}>
                    <Ionicons
                      name="alert-circle"
                      size={13}
                      color={KFitColors.error}
                    />
                  </View>
                </View>
                <Text style={styles.statNumber}>{stats.expired}</Text>
                <Text style={styles.statSubError}>Renewal required</Text>
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color={KFitColors.mutedText} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search members by name or email"
                placeholderTextColor={KFitColors.mutedText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                accessibilityLabel="Search members"
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

            {/* Filter pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContainer}
            >
              {FILTERS.map((f) => {
                const active = filter === f.key;
                const count = countFor(f.key);
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setFilter(f.key);
                    }}
                    style={({ pressed }) => [
                      styles.filterTab,
                      active && styles.filterTabActive,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${f.label}, ${count} members`}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        active && styles.filterTabTextActive,
                      ]}
                    >
                      {f.label}
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

            {/* Table header (wide) */}
            {isWide && filteredMembers.length > 0 && (
              <View style={styles.listHeader}>
                <Text style={[styles.headerText2, { flex: 2.2 }]}>MEMBER</Text>
                <Text style={[styles.headerText2, { flex: 1.2 }]}>
                  MEMBERSHIP
                </Text>
                <Text style={[styles.headerText2, { flex: 1.4 }]}>TRAINER</Text>
                <Text style={[styles.headerText2, { flex: 1.2 }]}>JOINED</Text>
                <Text style={[styles.headerText2, { flex: 1 }]}>STATUS</Text>
              </View>
            )}

            {/* Members */}
            <View style={styles.memberList}>
              {filteredMembers.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons
                      name="people-outline"
                      size={26}
                      color={KFitColors.accent}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {searchQuery ? "No matches" : "No members yet"}
                  </Text>
                  <Text style={styles.emptySub}>
                    {searchQuery
                      ? "Try a different search or filter."
                      : "Register your first member to get started."}
                  </Text>
                </View>
              ) : isWide ? (
                filteredMembers.map((m) => (
                  <View key={m.id} style={styles.tableRow}>
                    <Pressable
                      style={[styles.memberInfo, { flex: 2.2 }]}
                      onPress={() =>
                        router.push(
                          `/member-attendance/${encodeURIComponent(m.id)}` as any,
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`View ${m.name} attendance`}
                    >
                      <View style={styles.memberAvatar}>
                        <Text style={styles.avatarText}>
                          {initials(m.name)}
                        </Text>
                      </View>
                      <View style={styles.memberDetails}>
                        <Text style={styles.memberName} numberOfLines={1}>
                          {m.name}
                        </Text>
                        <Text style={styles.memberEmail} numberOfLines={1}>
                          {m.email}
                        </Text>
                      </View>
                    </Pressable>
                    <Text
                      style={[
                        styles.membershipText,
                        {
                          flex: 1.2,
                          color: membershipColor(m.membership),
                        },
                      ]}
                    >
                      {m.membership}
                    </Text>
                    <Text style={[styles.trainerText, { flex: 1.4 }]}>
                      {m.trainer}
                    </Text>
                    <Text style={[styles.joinedText, { flex: 1.2 }]}>
                      {m.joinedDate}
                    </Text>
                    <View style={{ flex: 1, alignItems: "flex-start" }}>
                      <StatusBadge status={m.status} />
                    </View>
                  </View>
                ))
              ) : (
                filteredMembers.map((m) => (
                  <Pressable
                    key={m.id}
                    style={({ pressed }) => [
                      styles.memberCard,
                      pressed && styles.pressed,
                    ]}
                    onPress={() =>
                      router.push(
                        `/member-attendance/${encodeURIComponent(m.id)}` as any,
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`View ${m.name} attendance`}
                  >
                    <View style={styles.cardTop}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.avatarText}>
                          {initials(m.name)}
                        </Text>
                      </View>
                      <View style={styles.memberDetails}>
                        <Text style={styles.memberName} numberOfLines={1}>
                          {m.name}
                        </Text>
                        <Text style={styles.memberEmail} numberOfLines={1}>
                          {m.email}
                        </Text>
                      </View>
                      <StatusBadge status={m.status} />
                    </View>

                    <View style={styles.cardMeta}>
                      <View
                        style={[
                          styles.planChip,
                          {
                            borderColor: membershipColor(m.membership) + "66",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.planChipText,
                            { color: membershipColor(m.membership) },
                          ]}
                        >
                          {m.membership}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="person-outline"
                          size={11}
                          color={KFitColors.mutedText}
                        />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {m.trainer}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="calendar-outline"
                          size={11}
                          color={KFitColors.mutedText}
                        />
                        <Text style={styles.metaText}>{m.joinedDate}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerLabel}>KFIT ADMIN · MEMBERS</Text>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Add member modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            style={styles.backdrop}
            onPress={() => setModalOpen(false)}
          >
            <Pressable
              style={styles.modalCard}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={styles.modalIcon}>
                    <Ionicons
                      name="person-add"
                      size={14}
                      color={KFitColors.accent}
                    />
                  </View>
                  <Text style={styles.modalTitle}>Register member</Text>
                </View>
                <Pressable
                  onPress={() => setModalOpen(false)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={KFitColors.mutedText}
                  />
                </Pressable>
              </View>

              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Jordan Lee"
                placeholderTextColor={KFitColors.mutedText}
                style={styles.input}
              />

              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="name@email.com"
                placeholderTextColor={KFitColors.mutedText}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter a secure password"
                placeholderTextColor={KFitColors.mutedText}
                secureTextEntry
                style={styles.input}
              />

              <Text style={styles.label}>MEMBERSHIP PLAN</Text>
              <View style={styles.planRow}>
                {PLANS.map((plan) => {
                  const active = plan === newPlan;
                  return (
                    <Pressable
                      key={plan}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setNewPlan(plan);
                      }}
                      style={[styles.planOption, active && styles.planOptionOn]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text
                        style={[
                          styles.planOptionText,
                          active && styles.planOptionTextOn,
                        ]}
                      >
                        {plan}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={saveMember}
                disabled={registerLoading}
                style={({ pressed }) => [
                  styles.saveButtonWrapper,
                  pressed && styles.pressed,
                  registerLoading && styles.saveButtonDisabled,
                ]}
              >
                <ImageBackground
                  source={require("../../assets/images/gold-texture.jpg")}
                  resizeMode="cover"
                  style={styles.saveButton}
                  imageStyle={styles.saveButtonImage}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={KFitColors.onAccent}
                  />
                  <Text style={styles.saveButtonText}>
                    {registerLoading ? "Registering…" : "Save & issue pass"}
                  </Text>
                </ImageBackground>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const color = statusColor(status);
  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: color + "1A", borderColor: color + "44" },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, flexDirection: "row" },
  main: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1, backgroundColor: KFitColors.background },
  contentContainer: { paddingBottom: 128 },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },

  /* Page header */
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 16,
    gap: 16,
  },
  pageHeaderWide: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerText: { flexShrink: 1, gap: 2 },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: KFitColors.text,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: KFitColors.mutedText,
    lineHeight: 19,
    marginTop: 2,
  },

  actionButtons: { flexDirection: "row", gap: 10 },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  importButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.text,
  },
  addButtonWrapper: {
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 14,
  },
  addButtonImage: { borderRadius: 10 },
  addButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: KFitColors.onAccent,
  },

  /* Quick links */
  quickLinksScroll: { flexGrow: 0, marginBottom: 16 },
  quickLinksContainer: { gap: 8, paddingHorizontal: 20 },
  quickLinkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  quickLinkText: {
    fontSize: 11,
    fontWeight: "800",
    color: KFitColors.text,
  },

  /* Stats */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 8,
  },
  statLabel: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: "900",
    color: KFitColors.mutedText,
    letterSpacing: 0.6,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  statIconBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
  },
  statIconBoxWarn: {
    backgroundColor: KFitColors.warning + "14",
    borderColor: KFitColors.warning + "33",
  },
  statIconBoxError: {
    backgroundColor: KFitColors.error + "14",
    borderColor: KFitColors.error + "33",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.5,
    fontFamily: "monospace",
    marginBottom: 2,
  },
  statSub: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  statSubAccent: {
    fontSize: 10,
    color: KFitColors.accent,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  statSubWarn: {
    fontSize: 10,
    color: KFitColors.warning,
    fontFamily: "monospace",
  },
  statSubError: {
    fontSize: 10,
    color: KFitColors.error,
    fontFamily: "monospace",
  },

  /* Search */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 12,
    color: KFitColors.text,
    paddingVertical: 0,
  },

  /* Filters */
  filterScroll: { flexGrow: 0, marginBottom: 14 },
  filterContainer: { gap: 6, paddingHorizontal: 20 },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 12,
    paddingRight: 6,
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
    minWidth: 22,
    paddingHorizontal: 6,
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

  /* Table header */
  listHeader: {
    flexDirection: "row",
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  headerText2: {
    fontSize: 9,
    fontWeight: "900",
    color: KFitColors.mutedText,
    letterSpacing: 1.2,
    fontFamily: "monospace",
  },

  /* Member list */
  memberList: { paddingHorizontal: 20, gap: 8, marginTop: 8 },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },

  memberCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    gap: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  planChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  planChipText: { fontSize: 10, fontWeight: "900", fontFamily: "monospace" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },

  memberInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  memberAvatar: {
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
  memberDetails: { flex: 1, minWidth: 0 },
  memberName: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.text,
    letterSpacing: -0.2,
  },
  memberEmail: {
    fontSize: 10,
    color: KFitColors.mutedText,
    marginTop: 2,
    fontFamily: "monospace",
  },
  membershipText: { fontSize: 12, fontWeight: "800" },
  trainerText: {
    fontSize: 12,
    color: KFitColors.text,
    fontFamily: "monospace",
  },
  joinedText: {
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
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: {
    fontSize: 9,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: KFitColors.border,
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

  footer: { alignItems: "center", paddingVertical: 20 },
  footerLabel: {
    color: KFitColors.mutedText,
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    opacity: 0.7,
  },

  /* Modal */
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 18,
    padding: 20,
    gap: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
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
    color: KFitColors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  label: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
    marginTop: 10,
  },
  input: {
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: KFitColors.text,
    fontSize: 13,
    marginTop: 6,
  },
  planRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  planOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  planOptionOn: {
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.accent + "1A",
  },
  planOptionText: {
    fontSize: 11,
    fontWeight: "800",
    color: KFitColors.mutedText,
  },
  planOptionTextOn: { color: KFitColors.accent },
  saveButtonDisabled: { opacity: 0.55 },
  saveButtonWrapper: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 46,
    paddingHorizontal: 16,
  },
  saveButtonImage: { borderRadius: 12 },
  saveButtonText: {
    color: KFitColors.onAccent,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
