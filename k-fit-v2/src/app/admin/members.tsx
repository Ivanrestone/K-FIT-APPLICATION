import { MemberCard } from "@/components/admin/MemberCard";
import { MemberDetailView } from "@/components/admin/MemberDetailView";
import { Theme } from "@/components/admin/theme";
import { Member, useAdminMembers } from "@/hooks/useAdminMembers";
import { StatusModal } from "@/components/shared/StatusModal";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminMembersScreen() {
  const {
    user,
    loading,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    visibleMembers,
    allMembers,
    pendingMembers,
    approvedMembers,
    registeredTodayCount,
    loggedInTodayCount,
    deleting,
    approving,
    refreshing,
    refresh,
    statusModal,
    clearStatusModal,
    handleApproveMember,
    handleDeleteMember,
  } = useAdminMembers();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberPendingDelete, setMemberPendingDelete] = useState<Member | null>(null);
  const selectedMemberDetails = selectedMember
    ? allMembers.find((member) => member.id === selectedMember.id) || selectedMember
    : null;

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading Directory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Theme.accent}
            colors={[Theme.accent]}
            progressBackgroundColor={Theme.surface}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.eyebrow}>ACCOUNT MANAGEMENT</Text>
            <Text style={styles.title}>Members</Text>
            <Text style={styles.subtitle}>
              Review registrations and manage member access.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refresh}
            disabled={refreshing}
            accessibilityLabel="Refresh member directory"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={Theme.accent} />
            ) : (
              <Ionicons name="refresh-outline" size={20} color={Theme.accent} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name="people-outline" size={17} color={Theme.accent} />
            </View>
            <Text style={styles.metricLabel}>TOTAL MEMBERS</Text>
            <Text style={styles.metricValue}>{allMembers.length}</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name="person-add-outline" size={17} color={Theme.info} />
            </View>
            <Text style={styles.metricLabel}>REGISTERED TODAY</Text>
            <Text style={styles.metricValue}>{registeredTodayCount}</Text>
          </View>
          <TouchableOpacity
            style={[styles.metricCard, styles.pendingMetricCard]}
            onPress={() => setActiveTab("pending")}
            activeOpacity={0.8}
          >
            <View style={styles.pendingMetricIcon}>
              <Ionicons name="time-outline" size={17} color={Theme.warning} />
            </View>
            <Text style={styles.metricLabel}>NEEDS REVIEW</Text>
            <Text style={[styles.metricValue, styles.pendingMetricValue]}>
              {pendingMembers.length}
            </Text>
          </TouchableOpacity>
          <View style={styles.metricCard}>
            <View style={styles.loginMetricIcon}>
              <Ionicons name="log-in-outline" size={17} color={Theme.success} />
            </View>
            <Text style={styles.metricLabel}>LOGGED IN TODAY</Text>
            <Text style={styles.metricValue}>{loggedInTodayCount}</Text>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "all" && styles.tabActive]}
            onPress={() => setActiveTab("all")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "all" && styles.tabTextActive,
              ]}
            >
              All ({allMembers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "pending" && styles.tabPendingActive]}
            onPress={() => setActiveTab("pending")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "pending" && styles.tabPendingTextActive,
              ]}
            >
              Pending ({pendingMembers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "approved" && styles.tabActive]}
            onPress={() => setActiveTab("approved")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "approved" && styles.tabTextActive,
              ]}
            >
              Approved ({approvedMembers.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor={Theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={Theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.listHeading}>
          <View>
            <Text style={styles.listTitle}>
              {activeTab === "pending"
                ? "Members awaiting approval"
                : activeTab === "approved"
                  ? "Approved members"
                  : "Member directory"}
            </Text>
            <Text style={styles.listSubtitle}>
              {visibleMembers.length}{" "}
              {visibleMembers.length === 1 ? "account" : "accounts"}
            </Text>
          </View>
          {activeTab === "pending" && pendingMembers.length > 0 && (
            <View style={styles.reviewPill}>
              <View style={styles.reviewDot} />
              <Text style={styles.reviewPillText}>ACTION REQUIRED</Text>
            </View>
          )}
        </View>

        {visibleMembers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={activeTab === "pending" ? "checkmark-done-outline" : "people-outline"}
                size={28}
                color={Theme.textMuted}
              />
            </View>
            <Text style={styles.emptyText}>
              {activeTab === "pending"
                ? "You are all caught up"
                : activeTab === "approved"
                  ? "No approved members match this search."
                  : "No members match this search."}
            </Text>
          </View>
        ) : (
          visibleMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onPress={() => setSelectedMember(member)}
            />
          ))
        )}
      </ScrollView>

      {/* MODAL RENDERED HERE */}
      <MemberDetailView
        member={selectedMemberDetails}
        onBack={() => setSelectedMember(null)}
        onApprove={handleApproveMember}
        onDelete={async (member) => setMemberPendingDelete(member)}
        approving={selectedMember ? approving === selectedMember.id : false}
        deleting={selectedMember ? deleting === selectedMember.id : false}
      />

      <StatusModal
        visible={memberPendingDelete !== null}
        type="warning"
        title="Delete member?"
        message={
          memberPendingDelete
            ? `This permanently removes ${memberPendingDelete.email} from the gym directory.`
            : ""
        }
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onPress={async () => {
          if (!memberPendingDelete) return;
          const member = memberPendingDelete;
          setMemberPendingDelete(null);
          await handleDeleteMember(member);
          setSelectedMember(null);
        }}
        onSecondaryPress={() => setMemberPendingDelete(null)}
        onRequestClose={() => setMemberPendingDelete(null)}
      />

      <StatusModal
        visible={statusModal !== null}
        type={statusModal?.type}
        title={statusModal?.title || ""}
        message={statusModal?.message || ""}
        onPress={clearStatusModal}
        onRequestClose={clearStatusModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080808" },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 132, paddingTop: 22 },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#080808",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: Theme.accent, marginTop: 12, fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 22,
  },
  titleSection: { flex: 1, paddingRight: 12 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "900",
    color: Theme.accent,
    letterSpacing: 1.3,
    marginBottom: 7,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: Theme.textMuted,
    marginTop: 5,
  },
  refreshButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  metricCard: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 108,
    padding: 13,
    borderRadius: 20,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  pendingMetricCard: {
    backgroundColor: "#17140D",
    borderColor: "rgba(245,158,11,0.28)",
  },
  loginMetricIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.12)",
    marginBottom: 10,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,215,0,0.1)",
    marginBottom: 10,
  },
  pendingMetricIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.12)",
    marginBottom: 10,
  },
  metricLabel: {
    color: Theme.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  metricValue: {
    color: Theme.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 3,
  },
  pendingMetricValue: { color: Theme.warning },
  filterContainer: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: Theme.surface,
    borderRadius: 18,
    padding: 5,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingHorizontal: 5,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  tabActive: {
    backgroundColor: Theme.accent,
  },
  tabPendingActive: { backgroundColor: "rgba(245,158,11,0.16)" },
  tabText: {
    fontSize: 11,
    fontWeight: "800",
    color: Theme.textMuted,
    textAlign: "center",
  },
  tabTextActive: { color: "#000000" },
  tabPendingTextActive: { color: Theme.warning },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 22,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    paddingVertical: 13,
    paddingLeft: 10,
    fontSize: 14,
  },
  listHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listTitle: { color: Theme.text, fontSize: 16, fontWeight: "900" },
  listSubtitle: { color: Theme.textMuted, fontSize: 11, marginTop: 3 },
  reviewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: "rgba(245,158,11,0.1)",
  },
  reviewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.warning,
  },
  reviewPillText: {
    color: Theme.warning,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 36,
    gap: 10,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    color: Theme.textMuted,
    fontWeight: "600",
    textAlign: "center",
  },
});
