import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import {
  attendanceDuration,
  formatAttendanceDate,
  formatAttendanceTime,
  useStaffAttendanceHistory,
} from "@/hooks/use-attendance";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;
type Status = "In progress" | "Completed";
type Tab = "club" | "all";

interface AttendanceRecord {
  id: string;
  memberName: string;
  memberId: string;
  plan: string;
  visitDate: string;
  checkIn: string;
  checkOut: string;
  activity: string;
  duration: string;
  status: Status;
}

const CAPACITY = 120;

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function AttendanceScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const {
    records: persistedRecords,
    isLoading,
    error,
    refetch,
  } = useStaffAttendanceHistory();

  const [tab, setTab] = useState<Tab>("club");
  const [recordSearch, setRecordSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const records: AttendanceRecord[] = useMemo(
    () =>
      persistedRecords.map((record) => ({
        id: record.id,
        memberName: record.member_name,
        memberId: record.member_id,
        plan: "",
        visitDate: formatAttendanceDate(record.scan_timestamp),
        checkIn: formatAttendanceTime(record.scan_timestamp),
        checkOut: record.checkout_timestamp
          ? formatAttendanceTime(record.checkout_timestamp)
          : "—",
        activity: "Gym visit",
        duration: attendanceDuration(
          record.scan_timestamp,
          record.checkout_timestamp,
        ),
        status: record.checkout_timestamp ? "Completed" : "In progress",
      })),
    [persistedRecords],
  );

  const inClub = records.filter((r) => r.status === "In progress").length;
  const today = new Date().toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const checkedInToday = persistedRecords.filter(
    (r) => formatAttendanceDate(r.scan_timestamp) === today,
  ).length;
  const capacityPct = Math.min(100, Math.round((inClub / CAPACITY) * 100));

  useEffect(() => {
    const timer = setInterval(() => void refetch(), 30_000);
    return () => clearInterval(timer);
  }, [refetch]);

  const completedRecords = persistedRecords.filter(
    (r) => r.checkout_timestamp !== null,
  );
  const averageVisitMinutes = completedRecords.length
    ? Math.round(
        completedRecords.reduce((sum, record) => {
          const checkout = record.checkout_timestamp;
          return (
            sum +
            (checkout
              ? Math.max(
                  0,
                  Math.floor(
                    (Date.parse(checkout) - Date.parse(record.scan_timestamp)) /
                      60_000,
                  ),
                )
              : 0)
          );
        }, 0) / completedRecords.length,
      )
    : null;

  const onRefresh = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const stats: {
    label: string;
    value: string;
    sub: string;
    icon: IconName;
    tone: string;
    bar?: number;
  }[] = [
    {
      label: "Checked in",
      value: `${checkedInToday}`,
      sub: "Total visits today",
      icon: "log-in",
      tone: KFitColors.accent,
    },
    {
      label: "Currently in club",
      value: `${inClub}`,
      sub: `${capacityPct}% of ${CAPACITY}-person capacity`,
      icon: "people",
      tone: inClub >= CAPACITY * 0.9 ? KFitColors.error : "#F59E0B",
      bar: capacityPct,
    },
    {
      label: "Average visit",
      value: averageVisitMinutes === null ? "—" : `${averageVisitMinutes} min`,
      sub: "From completed visits",
      icon: "time",
      tone: KFitColors.accent,
    },
    {
      label: "Attendance records",
      value: `${records.length}`,
      sub: "Persisted visits",
      icon: "checkmark-done",
      tone: "#3B82F6",
    },
  ];

  const latest = records[0];

  const visibleRecords = records.filter((r) => {
    const q = recordSearch.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      r.memberName.toLowerCase().includes(q) ||
      r.memberId.toLowerCase().includes(q);
    const matchesTab = tab === "all" || r.status === "In progress";
    return matchesSearch && matchesTab;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/attendance" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={KFitColors.accent}
              colors={[KFitColors.accent]}
              progressBackgroundColor={KFitColors.surface}
            />
          }
        >
          {/* Header */}
          <View style={[styles.pageHeader, isWide && styles.pageHeaderWide]}>
            <View style={styles.headerLeft}>
              <Text style={styles.eyebrow}>LIVE ATTENDANCE</Text>
              <Text style={styles.headerTitle}>Attendance & check-ins</Text>
              <Text style={styles.headerSubtitle}>
                Know who&apos;s here. Keep the club moving.
              </Text>
            </View>
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                Alert.alert("Export", "Attendance export is coming soon.");
              }}
              style={({ pressed }) => [
                styles.exportButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Export attendance"
            >
              <Ionicons
                name="download-outline"
                size={15}
                color={KFitColors.text}
              />
              <Text style={styles.exportButtonText}>Export</Text>
            </Pressable>
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            {stats.map((s) => (
              <View
                key={s.label}
                style={[styles.statCard, { width: isWide ? "23.5%" : "48%" }]}
              >
                <View style={styles.statTop}>
                  <Text style={styles.statLabel} numberOfLines={1}>
                    {s.label}
                  </Text>
                  <View
                    style={[
                      styles.statIconBox,
                      {
                        backgroundColor: s.tone + "14",
                        borderColor: s.tone + "44",
                      },
                    ]}
                  >
                    <Ionicons name={s.icon} size={13} color={s.tone} />
                  </View>
                </View>
                <Text style={styles.statNumber}>{s.value}</Text>
                {s.bar !== undefined && (
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${s.bar}%`, backgroundColor: s.tone },
                      ]}
                    />
                  </View>
                )}
                <Text style={styles.statSubtitle} numberOfLines={2}>
                  {s.sub}
                </Text>
              </View>
            ))}
          </View>

          {/* Verify pass card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.flex}>
                <Text style={styles.sectionEyebrow}>VERIFY ACCESS</Text>
                <Text style={styles.sectionTitle}>Verify member pass</Text>
              </View>
              <View style={styles.smallIcon}>
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color={KFitColors.accent}
                />
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>
              Attendance is recorded only after a valid QR scan.
            </Text>

            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/admin-scanner" as any);
              }}
              style={({ pressed }) => [
                styles.qrButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Scan QR code"
            >
              <Ionicons name="qr-code" size={18} color={KFitColors.onAccent} />
              <Text style={styles.qrButtonText}>Scan QR code</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={KFitColors.onAccent}
              />
            </Pressable>
          </View>

          {/* Latest check-in */}
          {latest && (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.flex}>
                  <Text style={styles.sectionEyebrow}>MOST RECENT</Text>
                  <Text style={styles.sectionTitle}>Latest check-in</Text>
                </View>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.livePillText}>LIVE</Text>
                </View>
              </View>
              <View style={styles.checkInCard}>
                <View style={styles.checkInAvatar}>
                  <Text style={styles.avatarTextLg}>
                    {initials(latest.memberName)}
                  </Text>
                </View>
                <View style={styles.checkInDetails}>
                  <Text style={styles.checkInName}>{latest.memberName}</Text>
                  <Text style={styles.checkInId}>{latest.memberId}</Text>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="time-outline"
                      size={11}
                      color={KFitColors.mutedText}
                    />
                    <Text style={styles.checkInTime}>{latest.checkIn}</Text>
                  </View>
                </View>
                <StatusBadge status={latest.status} />
              </View>
            </View>
          )}

          {/* Records */}
          <View style={styles.recordsSection}>
            <View style={styles.recordsHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>LOG</Text>
                <Text style={styles.sectionTitle}>Attendance records</Text>
              </View>
            </View>

            <View style={styles.recordsTabs}>
              <TabChip
                label={`In club (${inClub})`}
                icon="people"
                active={tab === "club"}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setTab("club");
                }}
              />
              <TabChip
                label={`All (${records.length})`}
                icon="list"
                active={tab === "all"}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setTab("all");
                }}
              />
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color={KFitColors.mutedText} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search member or ID"
                placeholderTextColor={KFitColors.mutedText}
                value={recordSearch}
                onChangeText={setRecordSearch}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                accessibilityLabel="Search attendance"
              />
              {recordSearch.length > 0 && (
                <Pressable
                  onPress={() => setRecordSearch("")}
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

            <View style={styles.dateFilter}>
              <View style={styles.dateFilterItem}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={KFitColors.accent}
                />
                <Text style={styles.dateText}>Today, {today}</Text>
              </View>
              <View style={styles.dateFilterItem}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={KFitColors.mutedText}
                />
                <Text style={styles.filterText}>Asia/Manila</Text>
              </View>
            </View>

            {isWide && (
              <View style={styles.tableHeader}>
                <Text style={[styles.headerText, { flex: 2 }]}>MEMBER</Text>
                <Text style={[styles.headerText, { flex: 1.3 }]}>
                  DATE / IN
                </Text>
                <Text style={[styles.headerText, { flex: 1 }]}>OUT</Text>
                <Text style={[styles.headerText, { flex: 1.2 }]}>ACTIVITY</Text>
                <Text style={[styles.headerText, { flex: 1 }]}>STATUS</Text>
              </View>
            )}

            <View style={styles.attendanceList}>
              {isLoading ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons
                      name="hourglass"
                      size={22}
                      color={KFitColors.accent}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>Loading…</Text>
                  <Text style={styles.emptySub}>
                    Fetching attendance records.
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.emptyState}>
                  <View
                    style={[styles.emptyIconWrap, styles.emptyIconWrapError]}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={22}
                      color={KFitColors.error}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>Couldn&apos;t load</Text>
                  <Text style={styles.emptySub}>{error}</Text>
                  <Pressable
                    onPress={() => void refetch()}
                    style={({ pressed }) => [
                      styles.retryBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name="refresh"
                      size={13}
                      color={KFitColors.onAccent}
                    />
                    <Text style={styles.retryBtnText}>Retry</Text>
                  </Pressable>
                </View>
              ) : visibleRecords.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons
                      name="people-outline"
                      size={22}
                      color={KFitColors.accent}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {recordSearch ? "No matches" : "No records yet"}
                  </Text>
                  <Text style={styles.emptySub}>
                    {recordSearch
                      ? "Try a different search or filter."
                      : "Scan a member pass to record attendance."}
                  </Text>
                </View>
              ) : isWide ? (
                visibleRecords.map((r) => (
                  <Pressable
                    key={r.id}
                    style={({ pressed }) => [
                      styles.tableRow,
                      pressed && styles.pressed,
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/member-attendance/[memberId]",
                        params: {
                          memberId: r.memberId,
                          memberName: r.memberName,
                        },
                      } as any)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`View ${r.memberName} attendance`}
                  >
                    <View style={[styles.memberInfo, { flex: 2 }]}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.avatarText}>
                          {initials(r.memberName)}
                        </Text>
                      </View>
                      <View style={styles.memberDetails}>
                        <Text style={styles.memberName} numberOfLines={1}>
                          {r.memberName}
                        </Text>
                        <Text style={styles.memberId}>{r.memberId}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1.3, gap: 2 }}>
                      <Text style={styles.tableText}>{r.visitDate}</Text>
                      <Text style={styles.tableTextMono}>IN {r.checkIn}</Text>
                    </View>
                    <Text style={[styles.tableTextMono, { flex: 1 }]}>
                      {r.checkOut === "—" ? "—" : `OUT ${r.checkOut}`}
                    </Text>
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.tableText}>{r.activity}</Text>
                      <Text style={styles.tableTextMono}>{r.duration}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: "flex-start" }}>
                      <StatusBadge status={r.status} />
                    </View>
                  </Pressable>
                ))
              ) : (
                visibleRecords.map((r) => (
                  <Pressable
                    key={r.id}
                    style={({ pressed }) => [
                      styles.attendanceCard,
                      pressed && styles.pressed,
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/member-attendance/[memberId]",
                        params: {
                          memberId: r.memberId,
                          memberName: r.memberName,
                        },
                      } as any)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`View ${r.memberName} attendance`}
                  >
                    <View style={styles.cardTop}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.avatarText}>
                          {initials(r.memberName)}
                        </Text>
                      </View>
                      <View style={styles.memberDetails}>
                        <Text style={styles.memberName} numberOfLines={1}>
                          {r.memberName}
                        </Text>
                        <Text style={styles.memberId}>{r.memberId}</Text>
                      </View>
                      <StatusBadge status={r.status} />
                    </View>

                    <View style={styles.infoGrid}>
                      <Info label="DATE" value={r.visitDate} />
                      <Info label="CHECK IN" value={r.checkIn} mono />
                      <Info label="CHECK OUT" value={r.checkOut} mono />
                      <Info label="ACTIVITY" value={r.activity} />
                      <Info label="DURATION" value={r.duration} mono />
                    </View>
                  </Pressable>
                ))
              )}
            </View>

            <Text style={styles.footerText}>
              Showing {visibleRecords.length} of {records.length} check-ins ·
              times in Asia/Manila
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>K-FIT · GYM MANAGEMENT</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ─────────── Small components ─────────── */
function StatusBadge({ status }: { status: Status }) {
  const color =
    status === "In progress" ? KFitColors.accent : KFitColors.mutedText;
  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: color + "1A", borderColor: color + "44" },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>
        {status === "In progress" ? "IN CLUB" : "DONE"}
      </Text>
    </View>
  );
}

function TabChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.recordsTab,
        active && styles.recordsTabActive,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Ionicons
        name={icon}
        size={12}
        color={active ? KFitColors.onAccent : KFitColors.mutedText}
      />
      <Text
        style={[styles.recordsTabText, active && styles.recordsTabTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Info({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[styles.infoValue, mono && styles.infoValueMono]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, flexDirection: "row" },
  content: { flex: 1, backgroundColor: KFitColors.background },
  contentContainer: { paddingBottom: 128 },
  pressed: { opacity: 0.7 },
  flex: { flex: 1, minWidth: 0 },

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
  exportButton: {
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
  exportButtonText: {
    fontSize: 13,
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
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.5,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  barTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    overflow: "hidden",
    marginBottom: 6,
  },
  barFill: { height: "100%", borderRadius: 999 },
  statSubtitle: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },

  /* Cards / sections */
  card: {
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    gap: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  sectionEyebrow: {
    color: KFitColors.accent,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: KFitColors.text,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: KFitColors.mutedText,
    marginBottom: 12,
    marginTop: 2,
  },
  smallIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },

  /* QR button */
  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: KFitColors.onAccent,
    letterSpacing: 0.2,
    flex: 1,
    textAlign: "center",
  },

  /* Latest check-in */
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: KFitColors.accent,
  },
  livePillText: {
    color: KFitColors.accent,
    fontSize: 9,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.6,
  },
  checkInCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  checkInAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTextLg: {
    fontSize: 15,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
  },
  checkInDetails: { flex: 1, minWidth: 0 },
  checkInName: {
    fontSize: 14,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.2,
  },
  checkInId: {
    fontSize: 11,
    color: KFitColors.mutedText,
    marginTop: 2,
    fontFamily: "monospace",
  },
  checkInTime: {
    fontSize: 11,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },

  /* Records */
  recordsSection: { paddingHorizontal: 20, marginBottom: 14 },
  recordsHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  recordsTabs: { flexDirection: "row", gap: 6, marginBottom: 10 },
  recordsTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  recordsTabActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  recordsTabText: {
    fontSize: 12,
    color: KFitColors.mutedText,
    fontWeight: "700",
  },
  recordsTabTextActive: { color: KFitColors.onAccent, fontWeight: "900" },

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

  dateFilter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dateFilterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "700",
    color: KFitColors.text,
    fontFamily: "monospace",
  },
  filterText: {
    fontSize: 11,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },

  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 9,
    fontWeight: "900",
    color: KFitColors.mutedText,
    letterSpacing: 1.2,
    fontFamily: "monospace",
  },

  attendanceList: { gap: 8, marginBottom: 12 },
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
  tableText: { fontSize: 11, color: KFitColors.text },
  tableTextMono: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },

  attendanceCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    gap: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  infoItem: { width: "50%" },
  infoLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: KFitColors.mutedText,
    marginBottom: 2,
    fontFamily: "monospace",
  },
  infoValue: { fontSize: 12, fontWeight: "700", color: KFitColors.text },
  infoValueMono: {
    fontFamily: "monospace",
    fontWeight: "800",
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
  memberId: {
    fontSize: 10,
    color: KFitColors.mutedText,
    marginTop: 2,
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
  emptyIconWrapError: {
    backgroundColor: KFitColors.error + "14",
    borderColor: KFitColors.error + "33",
  },
  emptyTitle: { fontSize: 14, fontWeight: "800", color: KFitColors.text },
  emptySub: {
    fontSize: 11,
    color: KFitColors.mutedText,
    textAlign: "center",
    lineHeight: 16,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
    marginTop: 6,
  },
  retryBtnText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "900",
  },

  footerText: {
    fontSize: 10,
    color: KFitColors.mutedText,
    textAlign: "center",
    fontFamily: "monospace",
    opacity: 0.7,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  footerBrand: {
    color: KFitColors.mutedText,
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    opacity: 0.7,
  },
});
