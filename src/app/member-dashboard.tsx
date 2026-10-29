import MemberBottomNav from "@/components/MemberBottomNav";
import type { MemberLocalNotification } from "@/components/MemberHeader";
import MemberHeader from "@/components/MemberHeader";
import SubscriptionPaywall from "@/components/SubscriptionPaywall";
import { MEMBER_ROUTES } from "@/constants/member-routes";
import { KFitColors } from "@/constants/theme";
import {
  attendanceDuration,
  formatAttendanceDate,
  formatAttendanceTime,
  useAttendanceHistory,
} from "@/hooks/use-attendance";
import { useLogout } from "@/hooks/use-logout";
import {
  MEMBER_PLACEHOLDER_STATS,
  useMemberHeaderData,
} from "@/hooks/use-member-header-data";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useState } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ─────────── Palette ─────────── */
const C = {
  bg: KFitColors.background,
  surface: KFitColors.surface,
  border: KFitColors.border,
  text: KFitColors.text,
  muted: KFitColors.mutedText,
  accent: KFitColors.accent,
  accentLight: KFitColors.accentLight,
  onAccent: KFitColors.onAccent,
  error: KFitColors.error,
  amber: "#F59E0B",
  sky: "#38BDF8",
  green: "#22C55E",
};

/* ─────────── Data ─────────── */
const MEMBER = {
  ...MEMBER_PLACEHOLDER_STATS,
  visitTarget: 20,
  caloriesThisWeek: 3420,
};

const FLOOR = { occupancy: 156, capacity: 200 };

const OVERVIEW: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route?: string;
}[] = [
  { label: "Progress & goals", icon: "target" },
  { label: "Personal profile", icon: "user", route: MEMBER_ROUTES.profile },
  {
    label: "Attendance history",
    icon: "calendar",
    route: MEMBER_ROUTES.checkin,
  },
  { label: "My workouts", icon: "activity", route: MEMBER_ROUTES.workout },
];

const STATS = [
  { label: "Current weight", value: "75.8 kg", note: "4.2 kg from 80 kg" },
  { label: "Body fat", value: "19.2%", note: "+20% since Sep" },
  { label: "Squat PR", value: "70 kg", note: "+10 kg from first" },
  { label: "Consistency", value: "92%", note: "54 workouts in Oct" },
];

const STRENGTH = [
  { label: "Jul", value: 60 },
  { label: "Aug", value: 63 },
  { label: "Sep", value: 67 },
  { label: "Oct", value: 70 },
];

const GOALS = [
  { title: "Reach target weight", value: "75.8 → 74 kg", progress: 0.8 },
  { title: "Monthly attendance", value: "18/20 visits", progress: 0.9 },
  {
    title: "Build upper body strength",
    value: "70/80 kg",
    progress: 0.875,
    target: "Target date: Dec 2028",
  },
];

const DETAILS = [
  ["Email", "jordan.lee@email.com"],
  ["Name", "Jordan Lee"],
  ["Member ID", "PM-1042"],
  ["Joined", "Sep 11, 2016"],
  ["Phone", "+1 (917) 555-0142"],
  ["Date of birth", "June 12, 1996"],
  ["Height", "178 cm"],
  ["Emergency contact", "Casey Lee · (917) 555-0173"],
];

/* ─────────── Building blocks ─────────── */
function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.7}
          style={styles.sectionActionWrap}
        >
          <Text style={styles.sectionAction}>{action}</Text>
          <Feather name="arrow-right" size={12} color={C.accent} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function ProgressBar({
  progress,
  height = 6,
}: {
  progress: number;
  height?: number;
}) {
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
          height: "100%",
          borderRadius: height / 2,
          backgroundColor: C.accent,
        }}
      />
    </View>
  );
}

/* ─────────── Screen ─────────── */
export default function MemberDashboardScreen() {
  const router = useRouter();
  const { isSigningOut, logout } = useLogout();
  const { header, firstName } = useMemberHeaderData();
  const {
    records: attendanceRecords,
    isLoading: attendanceLoading,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useAttendanceHistory();

  const activeAttendance = attendanceRecords.find(
    (record) => record.checkout_timestamp === null,
  );
  const checkedIn = Boolean(activeAttendance);
  const checkInTime = activeAttendance
    ? formatAttendanceTime(activeAttendance.scan_timestamp)
    : null;

  const [notifications, setNotifications] = useState<MemberLocalNotification[]>(
    [
      {
        id: 1,
        title: "Check-in reminder",
        msg: "Don't forget to scan your QR pass at the turnstile today.",
        time: "10m ago",
        read: false,
      },
      {
        id: 2,
        title: "Class confirmed",
        msg: "Your spot in High-Intensity CrossFit is locked in.",
        time: "1h ago",
        read: false,
      },
    ],
  );

  const occPct = Math.round(
    (Math.min(FLOOR.occupancy + (checkedIn ? 1 : 0), FLOOR.capacity) /
      FLOOR.capacity) *
      100,
  );
  const busy = occPct >= 50;
  const maxStrength = Math.max(...STRENGTH.map((s) => s.value));

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const attendanceTone = attendanceError
    ? C.error
    : attendanceLoading
      ? C.muted
      : checkedIn
        ? C.accent
        : C.muted;

  const thisMonthVisits = attendanceRecords.filter((record) => {
    const visitDate = new Date(record.scan_timestamp);
    const currentDate = new Date();
    return (
      visitDate.toLocaleDateString("en-US", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "numeric",
      }) ===
      currentDate.toLocaleDateString("en-US", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "numeric",
      })
    );
  }).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.mainContainer}>
        <MemberHeader
          {...header}
          checkedIn={checkedIn}
          isSigningOut={isSigningOut}
          onLogout={logout}
          notifications={notifications}
          setNotifications={setNotifications}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          <SubscriptionPaywall requireAppAccess>
            {/* ── Brand block ──────────────────────── */}
            <View style={styles.brandBlock}>
              <View style={styles.brandRow}>
                <Text style={styles.brand}>FORM</Text>
                <View style={styles.brandBadge}>
                  <Feather name="map-pin" size={10} color={C.accent} />
                  <Text style={styles.brandBadgeText}>BROOKLYN</Text>
                </View>
              </View>
              <Text style={styles.date}>{today}</Text>
            </View>

            {/* ── Greeting ─────────────────────────── */}
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>Progress, not perfection.</Text>
              <Text style={styles.greetingSubtitle}>
                Your effort adds up. See how far you&apos;ve come,{" "}
                {firstName || "champ"}.
              </Text>
              <TouchableOpacity
                style={styles.logButtonWrapper}
                activeOpacity={0.85}
              >
                <ImageBackground
                  source={require("../../assets/images/gold-texture.jpg")}
                  resizeMode="cover"
                  style={styles.logButtonBg}
                  imageStyle={styles.logButtonImage}
                >
                  <Feather name="plus" size={14} color={C.onAccent} />
                  <Text style={styles.logButtonText}>Log measurements</Text>
                </ImageBackground>
              </TouchableOpacity>
            </View>

            {/* ── Attendance status ────────────────── */}
            <Card style={styles.statusCard}>
              <View
                style={[
                  styles.statusIconWrap,
                  {
                    borderColor: attendanceTone + "44",
                    backgroundColor: attendanceTone + "14",
                  },
                ]}
              >
                <Feather
                  name={checkedIn ? "check-circle" : "circle"}
                  size={16}
                  color={attendanceTone}
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.eyebrow}>ATTENDANCE</Text>
                <Text style={styles.cardHeading} numberOfLines={1}>
                  {attendanceLoading
                    ? "Checking status…"
                    : attendanceError
                      ? "Status unavailable"
                      : checkedIn
                        ? `Checked in · ${checkInTime}`
                        : "Not checked in"}
                </Text>
                <Text style={styles.cardNote} numberOfLines={2}>
                  {attendanceLoading
                    ? "Fetching your latest attendance…"
                    : (attendanceError ??
                      (checkedIn
                        ? "Your session is active."
                        : "Scan your secure QR pass at the kiosk."))}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push(MEMBER_ROUTES.checkin as any)}
                activeOpacity={0.85}
                style={styles.smallBtn}
              >
                <Text style={styles.smallBtnText}>Records</Text>
                <Feather name="chevron-right" size={12} color={C.onAccent} />
              </TouchableOpacity>
            </Card>

            {/* ── Live floor meter ─────────────────── */}
            <Card style={{ gap: 12 }}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.eyebrow}>LIVE FLOOR</Text>
                  <View style={styles.nameRow}>
                    <Feather name="map-pin" size={13} color={C.accent} />
                    <Text style={styles.cardHeading}>FORM / Brooklyn</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: (busy ? C.amber : C.accent) + "1A",
                      borderColor: (busy ? C.amber : C.accent) + "44",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: busy ? C.amber : C.accent },
                    ]}
                  >
                    {busy ? "BUSY" : "MODERATE"}
                  </Text>
                </View>
              </View>
              <View style={{ gap: 6 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardNote}>Current occupancy</Text>
                  <Text style={styles.mono}>
                    {FLOOR.occupancy + (checkedIn ? 1 : 0)} / {FLOOR.capacity}
                  </Text>
                </View>
                <ProgressBar progress={occPct / 100} height={8} />
              </View>
            </Card>

            {/* ── Quick metrics ───────────────────── */}
            <View style={styles.statCard}>
              <StatInline
                icon="zap"
                label="Calories"
                value={MEMBER.caloriesThisWeek.toLocaleString()}
                tone={C.amber}
              />
              <View style={styles.statDivider} />
              <StatInline
                icon="check-circle"
                label="Visits"
                value={String(thisMonthVisits)}
                tone={C.accent}
              />
              <View style={styles.statDivider} />
              <StatInline
                icon="award"
                label="Points"
                value={String(MEMBER.points)}
                tone={C.sky}
              />
            </View>

            {/* ── Digital pass banner ──────────────── */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.passBanner}
              onPress={() => router.replace(MEMBER_ROUTES.qr as any)}
              accessibilityRole="button"
              accessibilityLabel="Open my QR gate pass"
            >
              <View style={styles.passIcon}>
                <Feather name="maximize" size={20} color={C.onAccent} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.passTitle}>Scan access gate pass</Text>
                <Text style={styles.cardNote}>
                  Tap to show your turnstile QR code
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={C.accent} />
            </TouchableOpacity>

            {/* ── Overview grid ───────────────────── */}
            <View style={styles.section}>
              <SectionTitle title="Overview" />
              <View style={styles.overviewGrid}>
                {OVERVIEW.map((o) => (
                  <TouchableOpacity
                    key={o.label}
                    style={styles.overviewTile}
                    activeOpacity={0.85}
                    disabled={!o.route}
                    onPress={() => {
                      if (!o.route) return;
                      void Haptics.selectionAsync();
                      router.replace(o.route as any);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={o.label}
                  >
                    <View style={styles.overviewIcon}>
                      <Feather name={o.icon} size={15} color={C.accent} />
                    </View>
                    <Text style={styles.overviewLabel} numberOfLines={1}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Progress & profile ──────────────── */}
            <View style={styles.section}>
              <SectionTitle title="Progress & profile" />
              <Card style={{ paddingVertical: 2 }}>
                {STATS.map((s, i) => (
                  <View
                    key={s.label}
                    style={[
                      styles.statRow,
                      i < STATS.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <Text style={styles.statLabel}>{s.label}</Text>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.statValue}>{s.value}</Text>
                      <Text style={styles.statNote}>{s.note}</Text>
                    </View>
                  </View>
                ))}
              </Card>
            </View>

            {/* ── Strength progression ────────────── */}
            <View style={styles.section}>
              <SectionTitle title="Strength progression" />
              <Card>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.eyebrow}>BARBELL SQUAT</Text>
                    <Text style={styles.bigValue}>70 kg</Text>
                  </View>
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor: C.accent + "1A",
                        borderColor: C.accent + "44",
                      },
                    ]}
                  >
                    <Feather name="trending-up" size={10} color={C.accent} />
                    <Text style={[styles.pillText, { color: C.accent }]}>
                      +10 kg
                    </Text>
                  </View>
                </View>
                <View style={styles.chartBars}>
                  {STRENGTH.map((s, i) => {
                    const last = i === STRENGTH.length - 1;
                    return (
                      <View key={s.label} style={styles.chartCol}>
                        <Text
                          style={[styles.barValue, last && { color: C.accent }]}
                        >
                          {s.value}
                        </Text>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: (s.value / maxStrength) * 100,
                              backgroundColor: last
                                ? C.accent
                                : C.accent + "44",
                            },
                          ]}
                        />
                        <Text
                          style={[styles.barLabel, last && { color: C.accent }]}
                        >
                          {s.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            </View>

            {/* ── Body weight ─────────────────────── */}
            <View style={styles.section}>
              <SectionTitle title="Body weight" />
              <Card style={{ gap: 14 }}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.eyebrow}>CURRENT</Text>
                    <Text style={styles.bigValue}>75.8 kg</Text>
                  </View>
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor: C.sky + "1A",
                        borderColor: C.sky + "44",
                      },
                    ]}
                  >
                    <Feather name="trending-up" size={10} color={C.sky} />
                    <Text style={[styles.pillText, { color: C.sky }]}>
                      +4.2 kg / 7w
                    </Text>
                  </View>
                </View>
                <View style={styles.weightTrack}>
                  <View style={styles.weightLine} />
                  <View style={[styles.weightDot, { left: 0 }]} />
                  <View
                    style={[
                      styles.weightDot,
                      styles.weightDotNow,
                      { right: 0 },
                    ]}
                  />
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.statNote}>Sep 01 · 71.6 kg</Text>
                  <Text style={styles.statNote}>Oct 20 · 75.8 kg</Text>
                </View>
              </Card>
            </View>

            {/* ── Goals ───────────────────────────── */}
            <View style={styles.section}>
              <SectionTitle title="Goals worth showing up for" />
              <View style={{ gap: 10 }}>
                {GOALS.map((g) => (
                  <Card key={g.title} style={{ gap: 8 }}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.cardNote}>{g.title}</Text>
                      <Text style={styles.goalPct}>
                        {Math.round(g.progress * 100)}%
                      </Text>
                    </View>
                    <Text style={styles.goalValue}>{g.value}</Text>
                    <ProgressBar progress={g.progress} />
                    {g.target ? (
                      <Text style={styles.statNote}>{g.target}</Text>
                    ) : null}
                  </Card>
                ))}
                <TouchableOpacity
                  style={styles.editButton}
                  activeOpacity={0.85}
                >
                  <Feather name="edit-2" size={13} color={C.accent} />
                  <Text style={styles.editButtonText}>Edit goals</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Personal details ─────────────────── */}
            <View style={styles.section}>
              <SectionTitle title="Personal details" />
              <Card style={{ paddingVertical: 2 }}>
                {DETAILS.map(([label, value], i) => (
                  <View
                    key={label}
                    style={[
                      styles.detailRow,
                      i < DETAILS.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <Text style={styles.statLabel}>{label}</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {value}
                    </Text>
                  </View>
                ))}
              </Card>
            </View>

            {/* ── Recent attendance ────────────────── */}
            <View style={styles.section}>
              <SectionTitle
                title="Recent attendance"
                action="View all"
                onAction={() => router.push(MEMBER_ROUTES.checkin as any)}
              />
              {attendanceLoading ? (
                <Text style={styles.statNote}>Loading attendance…</Text>
              ) : attendanceError ? (
                <TouchableOpacity
                  onPress={() => void refetchAttendance()}
                  accessibilityRole="button"
                >
                  <Text style={styles.attValue}>{attendanceError} · Retry</Text>
                </TouchableOpacity>
              ) : attendanceRecords.length === 0 ? (
                <Text style={styles.statNote}>No attendance records yet.</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {attendanceRecords.slice(0, 3).map((record) => (
                    <Card key={record.id} style={{ gap: 10 }}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.attDate}>
                          {formatAttendanceDate(record.scan_timestamp)}
                        </Text>
                        <View style={styles.durationChip}>
                          <Feather name="clock" size={10} color={C.accent} />
                          <Text style={styles.durationText}>
                            {attendanceDuration(
                              record.scan_timestamp,
                              record.checkout_timestamp,
                            )}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.rowBetween}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.attLabel}>TIME IN</Text>
                          <Text style={styles.attValue}>
                            {formatAttendanceTime(record.scan_timestamp)}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.attLabel}>TIME OUT</Text>
                          <Text style={styles.attValue}>
                            {record.checkout_timestamp
                              ? formatAttendanceTime(record.checkout_timestamp)
                              : "In progress"}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  ))}
                </View>
              )}
            </View>

            {/* ── Footer ───────────────────────────── */}
            <View style={styles.footer}>
              <Text style={styles.footerName}>{header.name}</Text>
              <Text style={styles.footerLabel}>
                FORM ATHLETICS MEMBER WORKSPACE
              </Text>
            </View>
          </SubscriptionPaywall>
        </ScrollView>

        <MemberBottomNav activeRoute={MEMBER_ROUTES.dashboard} />
      </View>
    </SafeAreaView>
  );
}

/* ─────────── Small components ─────────── */
function StatInline({
  icon,
  label,
  value,
  tone,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <View style={styles.statInline}>
      <View style={styles.statInlineHeader}>
        <Feather name={icon} size={11} color={tone} />
        <Text style={styles.statInlineLabel}>{label}</Text>
      </View>
      <Text style={[styles.statInlineValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

/* ─────────── Styles ─────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  mainContainer: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, backgroundColor: C.bg },
  contentInner: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 140,
    gap: 16,
  },
  flex: { flex: 1, minWidth: 0 },

  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },

  /* Brand */
  brandBlock: { gap: 4 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: {
    color: C.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: C.accent + "14",
    borderWidth: 1,
    borderColor: C.accent + "44",
  },
  brandBadgeText: {
    color: C.accent,
    fontSize: 9,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.8,
  },
  date: { color: C.muted, fontSize: 11, opacity: 0.75, marginTop: 4 },

  /* Greeting */
  greetingBlock: { gap: 6, marginVertical: 4 },
  greeting: {
    color: C.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  greetingSubtitle: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  logButtonWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "flex-start",
    elevation: 4,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  logButtonBg: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logButtonImage: { borderRadius: 12 },
  logButtonText: {
    color: C.onAccent,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  /* Card */
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  cardHeading: { color: C.text, fontSize: 14, fontWeight: "800", marginTop: 2 },
  cardNote: { color: C.muted, fontSize: 11, marginTop: 2 },
  mono: {
    color: C.text,
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
    fontFamily: "monospace",
  },
  track: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  divider: { height: 1, backgroundColor: C.border },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: C.border },

  /* Status card */
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.accent,
  },
  smallBtnText: {
    color: C.onAccent,
    fontSize: 11,
    fontWeight: "900",
  },

  /* Stat card (inline metrics) */
  statCard: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  statInline: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
  },
  statInlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statInlineLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "800",
    fontFamily: "monospace",
    letterSpacing: 0.6,
  },
  statInlineValue: {
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.4,
  },
  statDivider: {
    width: 1,
    backgroundColor: C.border,
    marginVertical: 10,
  },

  /* Pass banner */
  passBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.accent + "66",
    backgroundColor: C.surface,
  },
  passIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  passTitle: { color: C.text, fontSize: 13, fontWeight: "800" },

  /* Sections */
  section: { gap: 10, marginTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  sectionActionWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sectionAction: { color: C.accent, fontSize: 12, fontWeight: "800" },

  /* Overview grid */
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  overviewTile: {
    width: "48%",
    flexGrow: 1,
    flexBasis: "46%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 12,
  },
  overviewIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.accent + "14",
    borderWidth: 1,
    borderColor: C.accent + "44",
    alignItems: "center",
    justifyContent: "center",
  },
  overviewLabel: {
    flex: 1,
    color: C.text,
    fontSize: 12,
    fontWeight: "700",
  },

  /* Progress rows */
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  statLabel: { color: C.muted, fontSize: 13 },
  statValue: {
    color: C.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  statNote: {
    color: C.muted,
    fontSize: 10,
    marginTop: 2,
    fontFamily: "monospace",
  },

  /* Chart */
  bigValue: {
    color: C.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 2,
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 140,
    marginVertical: 12,
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  barValue: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  barFill: { width: 28, borderRadius: 6 },
  barLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },

  /* Body weight */
  weightTrack: { height: 16, justifyContent: "center" },
  weightLine: { height: 2, backgroundColor: C.border, borderRadius: 1 },
  weightDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.muted,
  },
  weightDotNow: {
    backgroundColor: C.accent,
    borderWidth: 2,
    borderColor: C.surface,
  },

  /* Goals */
  goalValue: {
    color: C.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  goalPct: {
    color: C.accent,
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.accent + "55",
    backgroundColor: C.accent + "10",
  },
  editButtonText: { color: C.accent, fontSize: 13, fontWeight: "900" },

  /* Details */
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  detailValue: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
    fontFamily: "monospace",
  },

  /* Attendance */
  attDate: {
    color: C.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  attLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    fontFamily: "monospace",
    marginBottom: 3,
  },
  attValue: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  durationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.accent + "1A",
    borderWidth: 1,
    borderColor: C.accent + "44",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationText: {
    color: C.accent,
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "monospace",
  },

  /* Footer */
  footer: { alignItems: "center", gap: 4, paddingVertical: 24 },
  footerName: { color: C.text, fontSize: 16, fontWeight: "800" },
  footerLabel: {
    color: C.muted,
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    marginTop: 4,
    opacity: 0.7,
  },
});
