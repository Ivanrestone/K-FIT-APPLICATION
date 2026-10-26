import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
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
type Status = "In progress" | "Completed";

interface AttendanceRecord {
  id: string;
  memberName: string;
  memberId: string;
  plan: string;
  checkIn: string;
  checkOut: string;
  activity: string;
  duration: string;
  status: Status;
}

const INITIAL_RECORDS: AttendanceRecord[] = [
  {
    id: "1",
    memberName: "Jordan Lee",
    memberId: "FM-1042",
    plan: "Performance",
    checkIn: "07:04 AM",
    checkOut: "09:00 AM",
    activity: "Open gym",
    duration: "64 min",
    status: "Completed",
  },
  {
    id: "2",
    memberName: "Maya Patel",
    memberId: "FM-0851",
    plan: "Performance",
    checkIn: "08:15 AM",
    checkOut: "09:10 AM",
    activity: "Mobility Flow",
    duration: "55 min",
    status: "Completed",
  },
  {
    id: "3",
    memberName: "Sam Rivera",
    memberId: "FM-0908",
    plan: "Elite",
    checkIn: "08:30 AM",
    checkOut: "-",
    activity: "Personal training",
    duration: "-",
    status: "In progress",
  },
  {
    id: "4",
    memberName: "Emma Davis",
    memberId: "FM-0753",
    plan: "Performance",
    checkIn: "09:14 AM",
    checkOut: "-",
    activity: "Open gym",
    duration: "-",
    status: "In progress",
  },
  {
    id: "5",
    memberName: "Ethan Park",
    memberId: "FM-1284",
    plan: "Essential",
    checkIn: "09:38 AM",
    checkOut: "-",
    activity: "Strength floor",
    duration: "-",
    status: "In progress",
  },
];

/* Members the check-in box can recognise (by ID or name) */
const KNOWN_MEMBERS = [
  { id: "FM-1042", name: "Jordan Lee", plan: "Performance" },
  { id: "FM-0851", name: "Maya Patel", plan: "Performance" },
  { id: "FM-0908", name: "Sam Rivera", plan: "Elite" },
  { id: "FM-0753", name: "Emma Davis", plan: "Performance" },
  { id: "FM-1284", name: "Ethan Park", plan: "Essential" },
  { id: "FM-1100", name: "Noah Williams", plan: "Essential" },
];

const CAPACITY = 120;

const nowLabel = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

const toMinutes = (label: string) => {
  const m = label.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + parseInt(m[2], 10);
};

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

  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_RECORDS);
  const [checkedInToday, setCheckedInToday] = useState(186);
  const [inClub, setInClub] = useState(42);
  const [tab, setTab] = useState<"club" | "all">("club");
  const [memberQuery, setMemberQuery] = useState("");
  const [recordSearch, setRecordSearch] = useState("");

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const capacityPct = Math.min(100, Math.round((inClub / CAPACITY) * 100));

  const stats: {
    label: string;
    value: string;
    sub: string;
    icon: IconName;
    bar?: number;
  }[] = [
    {
      label: "Checked in",
      value: `${checkedInToday}`,
      sub: "Total visits today",
      icon: "log-in",
    },
    {
      label: "Currently in club",
      value: `${inClub}`,
      sub: `${capacityPct}% of ${CAPACITY}-person capacity`,
      icon: "people",
      bar: capacityPct,
    },
    {
      label: "Average visit",
      value: "68 min",
      sub: "Based on today's visits",
      icon: "time",
    },
    {
      label: "Class attendance",
      value: "94%",
      sub: "86 attended, 4 no-shows",
      icon: "checkmark-done",
    },
  ];

  const handleCheckIn = () => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) {
      Alert.alert("Enter a member", "Type a member ID or name to check in.");
      return;
    }
    const member = KNOWN_MEMBERS.find(
      (m) => m.id.toLowerCase() === q || m.name.toLowerCase().includes(q),
    );
    if (!member) {
      Alert.alert("Member not found", `No member matches "${memberQuery}".`);
      return;
    }
    if (
      records.some(
        (r) => r.memberId === member.id && r.status === "In progress",
      )
    ) {
      Alert.alert("Already checked in", `${member.name} is already inside.`);
      return;
    }
    setRecords((prev) => [
      {
        id: `${Date.now()}`,
        memberName: member.name,
        memberId: member.id,
        plan: member.plan,
        checkIn: nowLabel(),
        checkOut: "-",
        activity: "Open gym",
        duration: "-",
        status: "In progress",
      },
      ...prev,
    ]);
    setCheckedInToday((n) => n + 1);
    setInClub((n) => n + 1);
    setMemberQuery("");
  };

  const handleCheckOut = (id: string) => {
    const out = nowLabel();
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const mins = Math.max(1, toMinutes(out) - toMinutes(r.checkIn));
        return {
          ...r,
          checkOut: out,
          duration: `${mins} min`,
          status: "Completed",
        };
      }),
    );
    setInClub((n) => Math.max(0, n - 1));
  };

  const latest = records[0];

  const visibleRecords = records.filter((r) => {
    const q = recordSearch.toLowerCase();
    const matchesSearch =
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
        >
          {/* Header */}
          <View style={[styles.header, isWide && styles.headerWide]}>
            <View style={styles.headerLeft}>
              <Text style={styles.eyebrow}>LIVE ATTENDANCE</Text>
              <Text style={styles.headerTitle}>Attendance & check-ins</Text>
              <Text style={styles.headerSubtitle}>
                Know who's here. Keep the club moving.
              </Text>
            </View>
            <Pressable
              onPress={() =>
                Alert.alert("Export", "Attendance export is coming soon.")
              }
              style={({ pressed }) => [
                styles.exportButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Export attendance"
            >
              <Ionicons
                name="download-outline"
                size={16}
                color={KFitColors.text}
              />
              <Text style={styles.exportButtonText}>Export attendance</Text>
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
                  <View style={styles.statIconBox}>
                    <Ionicons
                      name={s.icon}
                      size={14}
                      color={KFitColors.accent}
                    />
                  </View>
                </View>
                <Text style={styles.statNumber}>{s.value}</Text>
                {s.bar !== undefined && (
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${s.bar}%` }]} />
                  </View>
                )}
                <Text style={styles.statSubtitle} numberOfLines={2}>
                  {s.sub}
                </Text>
              </View>
            ))}
          </View>

          {/* Member check-in */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Member check-in</Text>
            <Text style={styles.sectionSubtitle}>
              Member ID or name. Try FM-1042 or "Noah".
            </Text>

            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={18}
                color={KFitColors.mutedText}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="FM-1042"
                placeholderTextColor={KFitColors.mutedText}
                value={memberQuery}
                onChangeText={setMemberQuery}
                autoCapitalize="characters"
                autoCorrect={false}
                onSubmitEditing={handleCheckIn}
                returnKeyType="done"
              />
              {memberQuery.length > 0 && (
                <Pressable
                  onPress={() => setMemberQuery("")}
                  hitSlop={10}
                  accessibilityLabel="Clear"
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={KFitColors.mutedText}
                  />
                </Pressable>
              )}
            </View>

            <View style={styles.checkInActions}>
              <Pressable
                onPress={() => router.push("/admin-scanner" as any)}
                style={({ pressed }) => [
                  styles.qrButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Scan QR code"
              >
                <Ionicons name="qr-code" size={16} color={KFitColors.accent} />
                <Text style={styles.qrButtonText}>Scan QR code</Text>
              </Pressable>

              <Pressable
                onPress={handleCheckIn}
                style={({ pressed }) => [
                  styles.checkInButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Check in"
              >
                <Ionicons
                  name="log-in-outline"
                  size={18}
                  color={KFitColors.onAccent}
                />
                <Text style={styles.checkInButtonText}>Check in</Text>
              </Pressable>
            </View>
          </View>

          {/* Latest check-in */}
          {latest && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Latest check-in</Text>
              <View style={styles.checkInCard}>
                <View style={styles.checkInAvatar}>
                  <Text style={styles.avatarTextLg}>
                    {initials(latest.memberName)}
                  </Text>
                </View>
                <View style={styles.checkInDetails}>
                  <Text style={styles.checkInName}>{latest.memberName}</Text>
                  <Text style={styles.checkInId}>
                    {latest.memberId} • {latest.plan}
                  </Text>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="time-outline"
                      size={12}
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
            <Text style={styles.sectionTitle}>Attendance records</Text>

            <View style={styles.recordsTabs}>
              <TabChip
                label={`In club (${inClub})`}
                active={tab === "club"}
                onPress={() => setTab("club")}
              />
              <TabChip
                label="All check-ins"
                active={tab === "all"}
                onPress={() => setTab("all")}
              />
            </View>

            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={18}
                color={KFitColors.mutedText}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search member or ID"
                placeholderTextColor={KFitColors.mutedText}
                value={recordSearch}
                onChangeText={setRecordSearch}
                autoCorrect={false}
              />
              {recordSearch.length > 0 && (
                <Pressable
                  onPress={() => setRecordSearch("")}
                  hitSlop={10}
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

            <View style={styles.dateFilter}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={KFitColors.accent}
                />
                <Text style={styles.dateText}>Today, {today}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name="funnel-outline"
                  size={13}
                  color={KFitColors.mutedText}
                />
                <Text style={styles.filterText}>All activities</Text>
              </View>
            </View>

            {isWide && (
              <View style={styles.tableHeader}>
                <Text style={[styles.headerText, { flex: 2 }]}>MEMBER</Text>
                <Text style={[styles.headerText, { flex: 1 }]}>CHECK IN</Text>
                <Text style={[styles.headerText, { flex: 1 }]}>CHECK OUT</Text>
                <Text style={[styles.headerText, { flex: 1.4 }]}>ACTIVITY</Text>
                <Text style={[styles.headerText, { flex: 1 }]}>DURATION</Text>
                <Text style={[styles.headerText, { flex: 1.2 }]}>STATUS</Text>
                <View style={{ width: 96 }} />
              </View>
            )}

            <View style={styles.attendanceList}>
              {visibleRecords.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="people-outline"
                    size={34}
                    color={KFitColors.mutedText}
                  />
                  <Text style={styles.emptyTitle}>No records found</Text>
                  <Text style={styles.emptySub}>
                    Check someone in or change the filter.
                  </Text>
                </View>
              ) : isWide ? (
                visibleRecords.map((r) => (
                  <View key={r.id} style={styles.tableRow}>
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
                    <Text style={[styles.tableText, { flex: 1 }]}>
                      {r.checkIn}
                    </Text>
                    <Text style={[styles.tableText, { flex: 1 }]}>
                      {r.checkOut}
                    </Text>
                    <Text style={[styles.tableText, { flex: 1.4 }]}>
                      {r.activity}
                    </Text>
                    <Text style={[styles.tableText, { flex: 1 }]}>
                      {r.duration}
                    </Text>
                    <View style={{ flex: 1.2, alignItems: "flex-start" }}>
                      <StatusBadge status={r.status} />
                    </View>
                    <View style={{ width: 96, alignItems: "flex-end" }}>
                      {r.status === "In progress" && (
                        <CheckOutButton onPress={() => handleCheckOut(r.id)} />
                      )}
                    </View>
                  </View>
                ))
              ) : (
                visibleRecords.map((r) => (
                  <View key={r.id} style={styles.attendanceCard}>
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
                      <Info label="CHECK IN" value={r.checkIn} />
                      <Info label="CHECK OUT" value={r.checkOut} />
                      <Info label="ACTIVITY" value={r.activity} />
                      <Info label="DURATION" value={r.duration} />
                    </View>

                    {r.status === "In progress" && (
                      <CheckOutButton
                        full
                        onPress={() => handleCheckOut(r.id)}
                      />
                    )}
                  </View>
                ))
              )}
            </View>

            <Text style={styles.footerText}>
              Showing {visibleRecords.length} of {records.length} check-ins
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>K-FIT · Gym Management</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- Small components ---------------- */
function StatusBadge({ status }: { status: Status }) {
  const color =
    status === "In progress" ? KFitColors.accent : KFitColors.mutedText;
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

function TabChip({
  label,
  active,
  onPress,
}: {
  label: string;
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
    >
      <Text
        style={[styles.recordsTabText, active && styles.recordsTabTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function CheckOutButton({
  onPress,
  full,
}: {
  onPress: () => void;
  full?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.checkOutButton,
        full && styles.checkOutButtonFull,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Check out"
    >
      <Ionicons name="log-out-outline" size={14} color={KFitColors.error} />
      <Text style={styles.checkOutText}>Check out</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, flexDirection: "row" },
  content: { flex: 1, backgroundColor: KFitColors.background },
  contentContainer: { paddingBottom: 128 },
  pressed: { opacity: 0.7 },

  /* Header */
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 14,
  },
  headerWide: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerLeft: { flexShrink: 1 },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: KFitColors.text,
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 13, color: KFitColors.mutedText },
  exportButton: {
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
  exportButtonText: { fontSize: 14, fontWeight: "700", color: KFitColors.text },

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
  statNumber: {
    fontSize: 26,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  barTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: KFitColors.background,
    overflow: "hidden",
    marginBottom: 6,
  },
  barFill: { height: "100%", backgroundColor: KFitColors.accent },
  statSubtitle: { fontSize: 11, color: KFitColors.mutedText },

  /* Cards / sections */
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: KFitColors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: KFitColors.mutedText,
    marginBottom: 14,
  },

  /* Search */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: KFitColors.text,
  },

  checkInActions: { flexDirection: "row", gap: 10 },
  qrButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.accent + "66",
    backgroundColor: KFitColors.accent + "14",
  },
  qrButtonText: { fontSize: 13, fontWeight: "700", color: KFitColors.accent },
  checkInButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkInButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: KFitColors.onAccent,
  },

  /* Latest check-in */
  checkInCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  checkInAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTextLg: { fontSize: 16, fontWeight: "900", color: KFitColors.onAccent },
  checkInDetails: { flex: 1, minWidth: 0 },
  checkInName: { fontSize: 15, fontWeight: "700", color: KFitColors.text },
  checkInId: { fontSize: 12, color: KFitColors.mutedText, marginTop: 2 },
  checkInTime: { fontSize: 11, color: KFitColors.mutedText },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },

  /* Records */
  recordsSection: { paddingHorizontal: 20, marginBottom: 16 },
  recordsTabs: { flexDirection: "row", gap: 8, marginVertical: 12 },
  recordsTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  recordsTabActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  recordsTabText: { fontSize: 13, color: KFitColors.text, fontWeight: "600" },
  recordsTabTextActive: { color: KFitColors.onAccent, fontWeight: "800" },
  dateFilter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  dateText: { fontSize: 13, fontWeight: "600", color: KFitColors.text },
  filterText: { fontSize: 13, color: KFitColors.mutedText },

  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 11,
    fontWeight: "700",
    color: KFitColors.mutedText,
    letterSpacing: 0.8,
  },

  attendanceList: { gap: 10, marginBottom: 14 },
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
  tableText: { fontSize: 12, color: KFitColors.text },

  attendanceCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    gap: 12,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  infoItem: { width: "50%" },
  infoLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: KFitColors.mutedText,
    marginBottom: 2,
  },
  infoValue: { fontSize: 13, fontWeight: "600", color: KFitColors.text },

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
  memberId: { fontSize: 11, color: KFitColors.mutedText, marginTop: 2 },

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

  checkOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.error + "66",
    backgroundColor: KFitColors.error + "14",
  },
  checkOutButtonFull: { minHeight: 40 },
  checkOutText: { fontSize: 12, fontWeight: "700", color: KFitColors.error },

  emptyState: {
    alignItems: "center",
    paddingVertical: 36,
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: KFitColors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: KFitColors.text },
  emptySub: { fontSize: 12, color: KFitColors.mutedText },

  footerText: {
    fontSize: 12,
    color: KFitColors.mutedText,
    textAlign: "center",
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
