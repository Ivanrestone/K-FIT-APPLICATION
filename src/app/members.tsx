import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import { useRegisterMember } from "@/hooks/use-register-member";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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

interface Member {
  id: string;
  name: string;
  email: string;
  membership: string;
  trainer: string;
  joinedDate: string;
  status: Status;
}

const INITIAL_MEMBERS: Member[] = [
  {
    id: "1",
    name: "Jordan Lee",
    email: "jordan.lee@email.com",
    membership: "Performance",
    trainer: "Marcus Reed",
    joinedDate: "Sep 01, 2026",
    status: "Active",
  },
  {
    id: "2",
    name: "Sam Rivera",
    email: "sam.rivera@email.com",
    membership: "Elite",
    trainer: "Marcus Reed",
    joinedDate: "Aug 12, 2026",
    status: "Active",
  },
  {
    id: "3",
    name: "Maya Patel",
    email: "maya.patel@email.com",
    membership: "Performance",
    trainer: "Sofia Chen",
    joinedDate: "Jul 04, 2026",
    status: "Active",
  },
  {
    id: "4",
    name: "Noah Williams",
    email: "noah.w@email.com",
    membership: "Essential",
    trainer: "Unassigned",
    joinedDate: "Oct 18, 2026",
    status: "Pending",
  },
  {
    id: "5",
    name: "Emma Davis",
    email: "emma.davis@email.com",
    membership: "Performance",
    trainer: "Daniel Brooks",
    joinedDate: "Jun 22, 2026",
    status: "Active",
  },
];

/* Shortcuts to the other admin screens (same routes as the Sidebar) */
const QUICK_LINKS: { label: string; icon: IconName; route: string }[] = [
  { label: "Races", icon: "trophy", route: "/challenges" },
  { label: "Attendance", icon: "calendar", route: "/attendance" },
  { label: "Trainers", icon: "barbell", route: "/trainers" },
  { label: "Plans", icon: "card", route: "/memberships" },
  { label: "Payments", icon: "cash", route: "/payments" },
  { label: "Scanner", icon: "qr-code", route: "/admin-scanner" },
];

const STATS: {
  label: string;
  value: string;
  sub: string;
  icon: IconName;
  warn?: boolean;
}[] = [
  {
    label: "Total members",
    value: "1,342",
    sub: "Across all memberships",
    icon: "people",
  },
  {
    label: "Active",
    value: "1,284",
    sub: "95.7% of all members",
    icon: "checkmark-circle",
  },
  {
    label: "Expiring this week",
    value: "12",
    sub: "Renewal outreach recommended",
    icon: "time",
    warn: true,
  },
  {
    label: "New this month",
    value: "48",
    sub: "+14 from September",
    icon: "trending-up",
  },
];

const FILTERS: { label: "All" | Status; count: number }[] = [
  { label: "All", count: 1342 },
  { label: "Active", count: 1284 },
  { label: "Pending", count: 18 },
  { label: "Expired", count: 40 },
];

const PLANS = ["Essential", "Performance", "Elite"];

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
  const isWide = width >= 768;
  const { registerMember, loading: registerLoading } = useRegisterMember();

  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [selectedFilter, setSelectedFilter] = useState<"All" | Status>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const filteredMembers = members.filter((member) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      member.name.toLowerCase().includes(q) ||
      member.email.toLowerCase().includes(q);
    const matchesFilter =
      selectedFilter === "All" || member.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

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
      Alert.alert("Password required", "Please enter a password for the member.");
      return;
    }

    const result = await registerMember({
      email: newEmail.trim(),
      password: newPassword.trim(),
      fullName: newName.trim(),
    });

    if (result.success) {
      const today = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      setMembers((prev) => [
        {
          id: result.userId || `${Date.now()}`,
          name: newName.trim(),
          email: newEmail.trim(),
          membership: "Paid",
          trainer: "Unassigned",
          joinedDate: today,
          status: "Active",
        },
        ...prev,
      ]);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setModalOpen(false);
      Alert.alert("Success", "Member registered successfully!");
    } else {
      Alert.alert("Registration Error", result.error || "Registration failed");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/members" />

        {/* Header + scrollable content */}
        <View style={styles.main}>
          <AppHeader onAddPress={() => setModalOpen(true)} />

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Page title + actions */}
            <View style={[styles.header, isWide && styles.headerWide]}>
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
                    size={16}
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
                      size={16}
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
                    size={14}
                    color={KFitColors.accent}
                  />
                  <Text style={styles.quickLinkText}>{link.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Stats */}
            <View style={styles.statsGrid}>
              {STATS.map((stat) => (
                <View
                  key={stat.label}
                  style={[styles.statCard, { width: isWide ? "23.5%" : "48%" }]}
                >
                  <View style={styles.statTop}>
                    <Text style={styles.statLabel} numberOfLines={1}>
                      {stat.label}
                    </Text>
                    <View
                      style={[
                        styles.statIconBox,
                        stat.warn && styles.statIconBoxWarn,
                      ]}
                    >
                      <Ionicons
                        name={stat.icon}
                        size={14}
                        color={
                          stat.warn ? KFitColors.warning : KFitColors.accent
                        }
                      />
                    </View>
                  </View>
                  <Text style={styles.statNumber}>{stat.value}</Text>
                  <Text
                    style={stat.warn ? styles.statSubWarn : styles.statSub}
                    numberOfLines={2}
                  >
                    {stat.sub}
                  </Text>
                </View>
              ))}
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={18}
                color={KFitColors.mutedText}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search members by name or email"
                placeholderTextColor={KFitColors.mutedText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery("")}
                  hitSlop={10}
                  style={styles.searchClear}
                  accessibilityLabel="Clear search"
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={KFitColors.mutedText}
                  />
                </Pressable>
              )}
            </View>

            {/* Filter tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContainer}
            >
              {FILTERS.map((filter) => {
                const active = selectedFilter === filter.label;
                return (
                  <Pressable
                    key={filter.label}
                    style={({ pressed }) => [
                      styles.filterTab,
                      active && styles.filterTabActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setSelectedFilter(filter.label)}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        active && styles.filterTabTextActive,
                      ]}
                    >
                      {filter.label}
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
                        {filter.count}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Table header (wide screens only) */}
            {isWide && (
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
                  <Ionicons
                    name="people-outline"
                    size={34}
                    color={KFitColors.mutedText}
                  />
                  <Text style={styles.emptyTitle}>No members found</Text>
                  <Text style={styles.emptySub}>
                    Try a different search or filter.
                  </Text>
                </View>
              ) : isWide ? (
                filteredMembers.map((m) => (
                  <View key={m.id} style={styles.tableRow}>
                    <View style={[styles.memberInfo, { flex: 2.2 }]}>
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
                    </View>
                    <Text
                      style={[
                        styles.membershipText,
                        { flex: 1.2, color: membershipColor(m.membership) },
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
                  <View key={m.id} style={styles.memberCard}>
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
                          size={13}
                          color={KFitColors.mutedText}
                        />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {m.trainer}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="calendar-outline"
                          size={13}
                          color={KFitColors.mutedText}
                        />
                        <Text style={styles.metaText}>{m.joinedDate}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
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
                <Text style={styles.modalTitle}>Register member</Text>
                <Pressable
                  onPress={() => setModalOpen(false)}
                  hitSlop={10}
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
                placeholder="Enter passwordForMember"
                placeholderTextColor={KFitColors.mutedText}
                secureTextEntry
                style={styles.input}
              />

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
                  <Text style={styles.saveButtonText}>
                    {registerLoading ? "Registering..." : "Save & issue pass"}
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
        { backgroundColor: color + "1F", borderColor: color + "55" },
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

  /* Page title */
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 16,
    gap: 16,
  },
  headerWide: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerText: { flexShrink: 1 },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: KFitColors.text,
    marginBottom: 4,
  },
  heroSubtitle: { fontSize: 13, color: KFitColors.mutedText, lineHeight: 19 },

  actionButtons: { flexDirection: "row", gap: 10 },
  importButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  importButtonText: { fontSize: 14, fontWeight: "700", color: KFitColors.text },
  addButtonWrapper: {
    flex: 1,
    borderRadius: 12,
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
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
  },
  addButtonImage: {
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: KFitColors.onAccent,
  },

  /* Quick links */
  quickLinksScroll: { flexGrow: 0, marginBottom: 18 },
  quickLinksContainer: { gap: 8, paddingHorizontal: 20 },
  quickLinkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  quickLinkText: { fontSize: 12, fontWeight: "700", color: KFitColors.text },

  /* Stats */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 10,
  },
  statLabel: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "700",
    color: KFitColors.mutedText,
  },
  statIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1A",
  },
  statIconBoxWarn: { backgroundColor: KFitColors.warning + "1F" },
  statNumber: {
    fontSize: 26,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statSub: { fontSize: 11, color: KFitColors.mutedText },
  statSubWarn: { fontSize: 11, color: KFitColors.warning },

  /* Search */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: KFitColors.text,
  },
  searchClear: { marginLeft: 6 },

  /* Filters */
  filterScroll: { flexGrow: 0, marginBottom: 16 },
  filterContainer: { gap: 8, paddingHorizontal: 20 },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 7,
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
  filterTabTextActive: { color: KFitColors.onAccent, fontWeight: "800" },
  filterCount: {
    minWidth: 28,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: KFitColors.background,
  },
  filterCountActive: { backgroundColor: KFitColors.onAccent + "26" },
  filterCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: KFitColors.mutedText,
  },
  filterCountTextActive: { color: KFitColors.onAccent },

  /* Table header (wide) */
  listHeader: {
    flexDirection: "row",
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  headerText2: {
    fontSize: 11,
    fontWeight: "700",
    color: KFitColors.mutedText,
    letterSpacing: 0.8,
  },

  /* Member list */
  memberList: { paddingHorizontal: 20, gap: 10, marginTop: 10 },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },

  memberCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    gap: 12,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  planChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  planChipText: { fontSize: 11, fontWeight: "800" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: KFitColors.mutedText },

  memberInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "900", color: KFitColors.onAccent },
  memberDetails: { flex: 1, minWidth: 0 },
  memberName: { fontSize: 14, fontWeight: "700", color: KFitColors.text },
  memberEmail: { fontSize: 12, color: KFitColors.mutedText, marginTop: 2 },
  membershipText: { fontSize: 13, fontWeight: "700" },
  trainerText: { fontSize: 13, color: KFitColors.text },
  joinedText: { fontSize: 12, color: KFitColors.mutedText },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "800" },

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: KFitColors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: KFitColors.text },
  emptySub: { fontSize: 12, color: KFitColors.mutedText },

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
    maxWidth: 360,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 18,
    padding: 20,
    gap: 6,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  modalTitle: { color: KFitColors.text, fontSize: 16, fontWeight: "800" },
  label: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 8,
  },
  input: {
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: KFitColors.text,
    fontSize: 14,
  },
  planRow: { flexDirection: "row", gap: 8 },
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
    backgroundColor: KFitColors.accent + "26",
  },
  planOptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: KFitColors.mutedText,
  },
  planOptionTextOn: { color: KFitColors.accent },
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
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 16,
  },
  saveButtonImage: {
    borderRadius: 12,
  },
  saveButtonText: {
    color: KFitColors.onAccent,
    fontSize: 14,
    fontWeight: "900",
  },
});
