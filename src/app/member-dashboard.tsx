import MemberBottomNav from "@/components/MemberBottomNav";
import SubscriptionPaywall from "@/components/SubscriptionPaywall";
import { KFitColors } from "@/constants/theme";
import { useLogout } from "@/hooks/use-logout";
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

/* ------------------------------------------------------------------ */
/* Palette (same KFit dark palette as the admin + trainer navs)        */
/* ------------------------------------------------------------------ */
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
};

/* ------------------------------------------------------------------ */
/* Data (swap for real API data later)                                 */
/* ------------------------------------------------------------------ */
const MEMBER = {
  name: "Jordan Lee",
  firstName: "Jordan",
  id: "PM-1042",
  tier: "VIP",
  streakDays: 14,
  points: 1240,
  visitsThisMonth: 18,
  visitTarget: 20,
  caloriesThisWeek: 3420,
};

const FLOOR = { occupancy: 156, capacity: 200 };

const OVERVIEW: { label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { label: "Progress & goals", icon: "target" },
  { label: "Personal profile", icon: "user" },
  { label: "Attendance history", icon: "calendar" },
  { label: "My workouts", icon: "activity" },
];

const STATS = [
  { label: "Current weight", value: "75.8 kg", note: "4.2 kg from 80 kg" },
  { label: "Body fat", value: "19.2%", note: "+20% since September" },
  {
    label: "Squat personal best",
    value: "70 kg",
    note: "+10 kg from your first",
  },
  {
    label: "Training consistency",
    value: "92%",
    note: "54 workouts in October",
  },
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
  ["Emergency contact", "Casey Lee (917) 555-0173"],
];

const ATTENDANCE = [
  {
    date: "Oct 20",
    time: "07:04 AM",
    activity: "Open gym",
    workout: "Mobility & cardio",
    duration: "64 min",
  },
  {
    date: "Oct 19",
    time: "06:00 PM",
    activity: "Strength training",
    workout: "Upper body A",
    duration: "55 min",
  },
  {
    date: "Oct 17",
    time: "08:12 AM",
    activity: "Strength training",
    workout: "Full body",
    duration: "60 min",
  },
];

// Change this to your real digital-pass screen in app/
const PASS_ROUTE = "/member-pass";

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */
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
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
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

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */
export default function MemberDashboardScreen() {
  const router = useRouter();
  const { isSigningOut, logout } = useLogout();

  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
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
  ]);

  const unread = notifications.filter((n) => !n.read).length;
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

  const toggleCheckIn = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (!checkedIn) {
      setCheckedIn(true);
      setCheckInTime(now);
      setNotifications((p) => [
        {
          id: Date.now(),
          title: "Attendance logged",
          msg: `Checked in at ${now}.`,
          time: "Just now",
          read: false,
        },
        ...p,
      ]);
    } else {
      setCheckedIn(false);
      setCheckInTime(null);
      setNotifications((p) => [
        {
          id: Date.now(),
          title: "Session complete",
          msg: "You checked out. Great session!",
          time: "Just now",
          read: false,
        },
        ...p,
      ]);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications((v) => !v);
    if (unread > 0)
      setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.mainContainer}>
        {/* ---------------- Fixed member header ---------------- */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {MEMBER.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </Text>
              </View>
              <View
                style={[
                  styles.presenceDot,
                  { backgroundColor: checkedIn ? C.accent : "#6B7280" },
                ]}
              />
            </View>
            <View>
              <View style={styles.nameRow}>
                <Text style={styles.topName}>{MEMBER.name}</Text>
                <View style={styles.vipBadge}>
                  <Text style={styles.vipBadgeText}>{MEMBER.tier}</Text>
                </View>
              </View>
              <View style={styles.nameRow}>
                <Feather name="zap" size={10} color={C.amber} />
                <Text style={styles.topSub}>
                  {MEMBER.streakDays} day streak • {MEMBER.points} pts
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.topRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={toggleNotifications}
              accessibilityLabel="Notifications"
            >
              <Feather name="bell" size={16} color={C.muted} />
              {unread > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unread}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              disabled={isSigningOut}
              onPress={logout}
              accessibilityLabel="Logout"
            >
              <Feather name="log-out" size={16} color={C.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications drawer */}
        {showNotifications && (
          <View style={styles.notifPanel}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Attendance & alerts</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Feather name="x" size={16} color={C.muted} />
              </TouchableOpacity>
            </View>
            {notifications.slice(0, 5).map((n) => (
              <View key={n.id} style={styles.notifItem}>
                <View style={styles.notifRow}>
                  <Text style={styles.notifItemTitle}>{n.title}</Text>
                  <Text style={styles.notifTime}>{n.time}</Text>
                </View>
                <Text style={styles.notifMsg}>{n.msg}</Text>
              </View>
            ))}
          </View>
        )}

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          <SubscriptionPaywall requireAppAccess>
            {/* Brand + date */}
            <View style={styles.brandBlock}>
              <Text style={styles.brand}>FORM</Text>
              <Text style={styles.brandSubtitle}>
                FORM/Brooklyn • Performance club
              </Text>
              <Text style={styles.date}>{today}</Text>
            </View>

            {/* Greeting */}
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>Progress, not perfection.</Text>
              <Text style={styles.greetingSubtitle}>
                Your effort adds up. See how far you&apos;ve come,{" "}
                {MEMBER.firstName}.
              </Text>
              <TouchableOpacity
                style={styles.logButtonWrapper}
                activeOpacity={0.8}
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

            {/* Attendance status */}
            <Card style={styles.rowBetween}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.eyebrow}>Attendance status</Text>
                <View style={styles.nameRow}>
                  <Feather
                    name="check-circle"
                    size={14}
                    color={checkedIn ? C.accent : "#6B7280"}
                  />
                  <Text style={styles.cardHeading}>
                    {checkedIn
                      ? `Checked in (${checkInTime})`
                      : "Not checked in"}
                  </Text>
                </View>
                <Text style={styles.cardNote}>
                  {checkedIn
                    ? "Your session is being logged."
                    : "Tap to mark manual attendance."}
                </Text>
              </View>
              <TouchableOpacity
                onPress={toggleCheckIn}
                activeOpacity={0.8}
                style={[styles.checkBtn, checkedIn && styles.checkBtnOut]}
              >
                <Text
                  style={[styles.checkBtnText, checkedIn && { color: C.error }]}
                >
                  {checkedIn ? "Check out" : "Check in now"}
                </Text>
              </TouchableOpacity>
            </Card>

            {/* Live floor meter */}
            <Card style={{ gap: 10 }}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.eyebrow}>Live floor meter</Text>
                  <View style={styles.nameRow}>
                    <Feather name="map-pin" size={13} color={C.accent} />
                    <Text style={styles.cardHeading}>FORM/Brooklyn</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: (busy ? C.amber : C.accent) + "1A",
                      borderColor: (busy ? C.amber : C.accent) + "4D",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: busy ? C.amber : C.accent },
                    ]}
                  >
                    {busy ? "BUSY FLOOR" : "MODERATE"}
                  </Text>
                </View>
              </View>
              <View style={{ gap: 6 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardNote}>Current occupancy</Text>
                  <Text style={styles.mono}>
                    {FLOOR.occupancy + (checkedIn ? 1 : 0)} / {FLOOR.capacity}{" "}
                    athletes
                  </Text>
                </View>
                <ProgressBar progress={occPct / 100} height={8} />
              </View>
            </Card>

            {/* Quick metrics */}
            <View style={styles.metricsRow}>
              <Card style={styles.metric}>
                <View style={styles.rowBetween}>
                  <Text style={styles.metricLabel}>Calories burned</Text>
                  <Feather name="zap" size={14} color={C.amber} />
                </View>
                <Text style={styles.metricValue}>
                  {MEMBER.caloriesThisWeek.toLocaleString()}
                </Text>
                <Text
                  style={[
                    styles.cardNote,
                    { color: C.accent, fontWeight: "700" },
                  ]}
                >
                  This week&apos;s total
                </Text>
              </Card>
              <Card style={styles.metric}>
                <View style={styles.rowBetween}>
                  <Text style={styles.metricLabel}>Gym check-ins</Text>
                  <Feather name="check-circle" size={14} color={C.accent} />
                </View>
                <Text style={styles.metricValue}>
                  {MEMBER.visitsThisMonth} visits
                </Text>
                <Text style={styles.cardNote}>
                  Target: {MEMBER.visitTarget} / month
                </Text>
              </Card>
            </View>

            {/* Digital pass banner */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.passBanner}
              onPress={() => router.push(PASS_ROUTE as any)}
            >
              <View style={styles.passIcon}>
                <Feather name="maximize" size={20} color={C.onAccent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.passTitle}>Scan access gate pass</Text>
                <Text style={styles.cardNote}>
                  Tap to show your turnstile QR code
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={C.accent} />
            </TouchableOpacity>

            {/* Overview */}
            <View style={styles.section}>
              <SectionTitle title="Overview" />
              <View style={styles.overviewGrid}>
                {OVERVIEW.map((o) => (
                  <TouchableOpacity
                    key={o.label}
                    style={styles.overviewTile}
                    activeOpacity={0.8}
                  >
                    <View style={styles.overviewIcon}>
                      <Feather name={o.icon} size={16} color={C.accent} />
                    </View>
                    <Text style={styles.overviewLabel}>{o.label}</Text>
                    <Feather name="chevron-right" size={16} color={C.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Progress & profile */}
            <View style={styles.section}>
              <SectionTitle title="Progress & profile" />
              <Card style={{ paddingVertical: 4 }}>
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

            {/* Strength progression */}
            <View style={styles.section}>
              <SectionTitle title="Strength progression" />
              <Card>
                <View style={styles.rowBetween}>
                  <Text style={styles.bigValue}>70 kg</Text>
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor: C.accent + "1A",
                        borderColor: C.accent + "4D",
                      },
                    ]}
                  >
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
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: (s.value / maxStrength) * 100,
                              backgroundColor: last
                                ? C.accent
                                : C.accent + "55",
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
                <Text style={styles.cardNote}>Barbell squat</Text>
              </Card>
            </View>

            {/* Body weight */}
            <View style={styles.section}>
              <SectionTitle title="Body weight" />
              <Card style={{ gap: 12 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.bigValue}>75.8 kg</Text>
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor: C.sky + "1A",
                        borderColor: C.sky + "4D",
                      },
                    ]}
                  >
                    <Text style={[styles.pillText, { color: C.sky }]}>
                      +4.2 kg / 7 w
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
                  <Text style={styles.cardNote}>Sep 01 • 71.6 kg</Text>
                  <Text style={styles.cardNote}>Oct 20 • 75.8 kg</Text>
                </View>
              </Card>
            </View>

            {/* Goals */}
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
                <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
                  <Feather name="edit-2" size={14} color={C.accent} />
                  <Text style={styles.editButtonText}>Edit goals</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Personal details */}
            <View style={styles.section}>
              <SectionTitle title="Personal details" />
              <Card style={{ paddingVertical: 4 }}>
                {DETAILS.map(([label, value], i) => (
                  <View
                    key={label}
                    style={[
                      styles.detailRow,
                      i < DETAILS.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <Text style={styles.statLabel}>{label}</Text>
                    <Text style={styles.detailValue}>{value}</Text>
                  </View>
                ))}
              </Card>
            </View>

            {/* Recent attendance */}
            <View style={styles.section}>
              <SectionTitle title="Recent attendance" action="View all" />
              <View style={{ gap: 10 }}>
                {ATTENDANCE.map((a) => (
                  <Card key={a.date} style={{ gap: 10 }}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.attDate}>{a.date}</Text>
                      <Text style={styles.statNote}>{a.time}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.attLabel}>ACTIVITY</Text>
                        <Text style={styles.attValue}>{a.activity}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.attLabel}>WORKOUT</Text>
                        <Text style={styles.attValue}>{a.workout}</Text>
                      </View>
                      <View style={styles.durationChip}>
                        <Feather name="clock" size={11} color={C.accent} />
                        <Text style={styles.durationText}>{a.duration}</Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerName}>{MEMBER.name}</Text>
              <Text style={styles.statNote}>
                Member • {MEMBER.id} • Joined Sep 11, 2016
              </Text>
              <Text style={styles.footerBrand}>
                FORM ATHLETICS MEMBER WORKSPACE
              </Text>
            </View>
          </SubscriptionPaywall>
        </ScrollView>

        <MemberBottomNav activeRoute="/member-dashboard" />
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  mainContainer: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, backgroundColor: C.bg },
  // extra bottom room so the raised QR dock never covers content
  contentInner: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 140,
    gap: 14,
  },

  /* header */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    zIndex: 20,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarRing: { width: 42, height: 42 },
  avatar: {
    flex: 1,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: C.accent,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: C.accent, fontWeight: "900", fontSize: 14 },
  presenceDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.surface,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  topName: { color: C.text, fontSize: 13, fontWeight: "700" },
  topSub: { color: C.muted, fontSize: 10 },
  vipBadge: {
    backgroundColor: C.accent + "33",
    borderColor: C.accent + "4D",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  vipBadgeText: { color: C.accent, fontSize: 8, fontWeight: "900" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.amber,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: C.bg, fontSize: 9, fontWeight: "900" },

  /* notifications */
  notifPanel: {
    position: "absolute",
    top: 64,
    right: 16,
    left: 16,
    zIndex: 50,
    elevation: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  notifTitle: { color: C.text, fontSize: 12, fontWeight: "700" },
  notifItem: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  notifRow: { flexDirection: "row", justifyContent: "space-between" },
  notifItemTitle: { color: C.accent, fontSize: 12, fontWeight: "700" },
  notifTime: { color: C.muted, fontSize: 9 },
  notifMsg: { color: C.muted, fontSize: 11 },

  /* brand + greeting */
  brandBlock: { gap: 2 },
  brand: { color: C.text, fontSize: 30, fontWeight: "900", letterSpacing: 1 },
  brandSubtitle: { color: C.muted, fontSize: 13 },
  date: { color: C.muted, fontSize: 11, opacity: 0.7, marginTop: 4 },
  greetingBlock: { gap: 6, marginVertical: 4 },
  greeting: {
    color: C.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
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
  logButtonText: { color: C.onAccent, fontSize: 14, fontWeight: "800" },

  /* generic card */
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
    color: C.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardHeading: { color: C.text, fontSize: 13, fontWeight: "800" },
  cardNote: { color: C.muted, fontSize: 11 },
  mono: {
    color: C.text,
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  pill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.4 },
  track: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  divider: { height: 1, backgroundColor: C.border },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: C.border },

  /* check-in */
  checkBtn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.accent,
  },
  checkBtnOut: { backgroundColor: C.bg, borderColor: C.error + "66" },
  checkBtnText: { color: C.onAccent, fontSize: 12, fontWeight: "900" },

  /* metrics */
  metricsRow: { flexDirection: "row", gap: 10 },
  metric: { flex: 1, gap: 6 },
  metricLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricValue: {
    color: C.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  /* pass banner */
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

  /* sections */
  section: { gap: 10, marginTop: 6 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { color: C.text, fontSize: 17, fontWeight: "800" },
  sectionAction: { color: C.accent, fontSize: 12, fontWeight: "700" },

  overviewGrid: { gap: 8 },
  overviewTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    backgroundColor: C.accent + "1A",
    borderWidth: 1,
    borderColor: C.accent + "4D",
    alignItems: "center",
    justifyContent: "center",
  },
  overviewLabel: { flex: 1, color: C.text, fontSize: 14, fontWeight: "600" },

  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  statLabel: { color: C.muted, fontSize: 13 },
  statValue: { color: C.text, fontSize: 17, fontWeight: "800" },
  statNote: { color: C.muted, fontSize: 11, opacity: 0.8 },

  bigValue: {
    color: C.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 130,
    marginVertical: 14,
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  barFill: { width: 28, borderRadius: 6 },
  barLabel: { color: C.muted, fontSize: 11, fontWeight: "600" },

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

  goalValue: { color: C.text, fontSize: 18, fontWeight: "800" },
  goalPct: { color: C.accent, fontSize: 12, fontWeight: "800" },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.accent + "66",
    backgroundColor: C.accent + "14",
  },
  editButtonText: { color: C.accent, fontSize: 13, fontWeight: "800" },

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
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },

  attDate: { color: C.text, fontSize: 15, fontWeight: "800" },
  attLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  attValue: { color: C.text, fontSize: 12, fontWeight: "600" },
  durationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.accent + "1A",
    borderWidth: 1,
    borderColor: C.accent + "4D",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationText: { color: C.accent, fontSize: 11, fontWeight: "800" },

  footer: { alignItems: "center", gap: 4, paddingVertical: 24 },
  footerName: { color: C.text, fontSize: 18, fontWeight: "800" },
  footerBrand: {
    color: C.muted,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 6,
    opacity: 0.7,
  },
});
