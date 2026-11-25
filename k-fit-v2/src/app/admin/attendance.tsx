import { ActiveMemberCard } from "@/components/admin/ActiveMemberCard";
import { AttendanceTabs } from "@/components/admin/AttendanceTabs";
import { HistoryRecordCard } from "@/components/admin/HistoryRecordCard";
import { Theme } from "@/components/admin/theme";
import { ADMIN_NAV_CLEARANCE } from "@/components/navigation/AdminBottomNav";
import {
  AttendanceRecord,
  useAdminAttendance,
} from "@/hooks/useAdminAttendance";
import { StatusModal } from "@/components/shared/StatusModal";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useSoundEffects } from "@/components/shared/SoundEffectsProvider";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminAttendanceScreen() {
  const playSound = useSoundEffects();
  const {
    loading,
    activeTab,
    setActiveTab,
    activeMembers,
    checkedOutMembers,
    allRecords,
    visibleHistory,
    formatTime,
    handleCheckOut,
    refreshing,
    refresh,
    notice,
    clearNotice,
  } = useAdminAttendance();

  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [recordToCheckOut, setRecordToCheckOut] =
    useState<AttendanceRecord | null>(null);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const visitsToday = allRecords.filter(
    (record) => new Date(record.check_in) >= startOfToday,
  ).length;

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Fetching Attendance...</Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={{ flex: 1, opacity: fadeAnim, backgroundColor: Theme.background }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          <View>
            <Text style={styles.eyebrow}>GATE OPERATIONS</Text>
            <Text style={styles.title}>Attendance</Text>
            <Text style={styles.subtitle}>Live check-ins and floor activity</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.liveBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => {
                playSound("tap");
                router.push("/admin/scan-qr");
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="scan-outline" size={17} color={Theme.accentText} />
              <Text style={styles.scanBtnText}>Scan QR</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name="people-outline" size={17} color={Theme.success} />
            </View>
            <Text style={styles.metricLabel}>INSIDE NOW</Text>
            <Text style={styles.metricValue}>{activeMembers.length}</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIconGold}>
              <Ionicons name="today-outline" size={17} color={Theme.accent} />
            </View>
            <Text style={styles.metricLabel}>VISITS TODAY</Text>
            <Text style={styles.metricValue}>{visitsToday}</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIconMuted}>
              <Ionicons name="list-outline" size={17} color={Theme.textMuted} />
            </View>
            <Text style={styles.metricLabel}>RECORDS</Text>
            <Text style={styles.metricValue}>{allRecords.length}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Currently inside</Text>
              <Text style={styles.sectionSubtitle}>
                Live members checked in at the gate
              </Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{activeMembers.length}</Text>
            </View>
          </View>
          {activeMembers.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="enter-outline" size={22} color={Theme.textMuted} />
              </View>
              <View style={styles.emptyCopy}>
                <Text style={styles.emptyTitle}>Gym is clear</Text>
                <Text style={styles.emptyText}>No active check-ins right now.</Text>
              </View>
            </View>
          ) : activeMembers.map((member) => (
              <ActiveMemberCard
                key={member.id}
                record={member}
                formatTime={formatTime}
                onCheckOut={(record) => setRecordToCheckOut(record)}
              />
            ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Gate history</Text>
              <Text style={styles.sectionSubtitle}>
                Check-in and check-out records
              </Text>
            </View>
          </View>
          <AttendanceTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            counts={{
              all: allRecords.length,
              checkedIn: activeMembers.length,
              checkedOut: checkedOutMembers.length,
            }}
          />
          {visibleHistory.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="time-outline" size={22} color={Theme.textMuted} />
              </View>
              <View style={styles.emptyCopy}>
                <Text style={styles.emptyTitle}>No gate activity yet</Text>
                <Text style={styles.emptyText}>
                  Records will appear here after a member checks in.
                </Text>
              </View>
            </View>
          ) : (
            visibleHistory.map((record) => (
              <HistoryRecordCard
                key={record.id}
                record={record}
                formatTime={formatTime}
              />
            ))
          )}
        </View>
      </ScrollView>

      <StatusModal
        visible={recordToCheckOut !== null}
        type="warning"
        title="Check out member?"
        message={
          recordToCheckOut
            ? `End ${recordToCheckOut.memberName || "this member"}'s active gym session?`
            : ""
        }
        buttonText="Check out"
        secondaryButtonText="Cancel"
        onPress={async () => {
          if (!recordToCheckOut) return;
          const record = recordToCheckOut;
          setRecordToCheckOut(null);
          await handleCheckOut(record);
        }}
        onSecondaryPress={() => setRecordToCheckOut(null)}
        onRequestClose={() => setRecordToCheckOut(null)}
      />
      <StatusModal
        visible={notice !== null}
        type={notice?.type}
        title={notice?.title || ""}
        message={notice?.message || ""}
        onPress={clearNotice}
        onRequestClose={clearNotice}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: ADMIN_NAV_CLEARANCE + 20,
  },
  loadingText: { color: Theme.accent, marginTop: 12, fontWeight: "600" },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerActions: { alignItems: "flex-end", gap: 10 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    color: Theme.accent,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.8,
  },
  subtitle: { color: Theme.textMuted, fontSize: 12, marginTop: 5 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.1)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.18)",
  },
  liveBadgeText: { color: Theme.success, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.accent,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 14,
    gap: 6,
  },
  scanBtnText: {
    color: Theme.accentText,
    fontSize: 11,
    fontWeight: "900",
  },
  metricsRow: { flexDirection: "row", gap: 9, marginBottom: 18 },
  metricCard: {
    flex: 1,
    minHeight: 108,
    backgroundColor: Theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 12,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.1)",
    marginBottom: 8,
  },
  metricIconGold: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,215,0,0.1)",
    marginBottom: 8,
  },
  metricIconMuted: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#202226",
    marginBottom: 8,
  },
  metricLabel: { color: Theme.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  metricValue: { color: Theme.text, fontSize: 22, fontWeight: "900", marginTop: 3 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: Theme.text },
  sectionSubtitle: { fontSize: 11, color: Theme.textMuted, marginTop: 4 },
  countBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.1)",
  },
  countBadgeText: { color: Theme.success, fontSize: 13, fontWeight: "900" },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 18,
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#202226",
  },
  emptyCopy: { flex: 1 },
  emptyTitle: { color: Theme.text, fontSize: 13, fontWeight: "800" },
  emptyText: { color: Theme.textMuted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Theme.success,
  },
});
