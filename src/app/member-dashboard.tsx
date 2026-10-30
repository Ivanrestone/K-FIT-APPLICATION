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
import { useMemberHeaderData } from "@/hooks/use-member-header-data";
import {
  statusTone,
  to12h,
  toRelativeDay,
  useBookingsStore,
} from "@/lib/bookings-store";
import { timeLeft, useChallengeStore } from "@/lib/challenges-store";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useMemo, useState } from "react";
import {
  RefreshControl,
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
  onAccent: KFitColors.onAccent,
  error: KFitColors.error,
  amber: "#F59E0B",
  sky: "#38BDF8",
  green: "#22C55E",
};

/* ─────────── Routes ─────────── */
// Some routes may not be in MEMBER_ROUTES yet, so each one has a safe fallback.
const R = MEMBER_ROUTES as unknown as Record<string, string | undefined>;
const ROUTE = {
  profile: R.profile ?? "/member-profile",
  checkin: R.checkin ?? "/member-checkin",
  workout: R.workout ?? "/member-workout",
  qr: R.qr ?? "/member-qr",
  membership: R.membership ?? "/member-membership",
  bookings: R.bookings ?? "/member-bookings",
  book: R.book ?? "/member-book",
  instructors: R.instructors ?? "/member-instructors",
  challenges: "/member-challenges",
  dashboard: R.dashboard ?? "/member-dashboard",
};

/* ─────────── Constants ─────────── */
const GYM = { name: "KFIT", location: "Brooklyn" };
const MEMBER_ID = "M-101"; // matches the bookings screens
const MONTHLY_VISIT_TARGET = 20;
const TIME_ZONE = "Asia/Manila";
const WEEK_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/*
 * SAMPLE DATA — replace with real API data when available.
 * Occupancy, today's workout and the progress figures are placeholders.
 */
const FLOOR = { occupancy: 62, capacity: 120 };

const TODAY_WORKOUT = {
  title: "Lower body strength",
  program: "Foundation Strength · Week 4 of 8",
  minutes: 55,
  exercises: 6,
  sets: 19,
};

const BODY = { start: 80, current: 75.8, target: 74 };

const PROGRESS_ROWS = [
  {
    label: "Current weight",
    value: `${BODY.current} kg`,
    note: `${(BODY.start - BODY.current).toFixed(1)} kg down from ${BODY.start} kg`,
  },
  { label: "Body fat", value: "19.2%", note: "1.1 points lower since Sep" },
  {
    label: "Squat personal best",
    value: "70 kg",
    note: "+10 kg since you started",
  },
];

const STRENGTH = [
  { label: "Jul", value: 60 },
  { label: "Aug", value: 63 },
  { label: "Sep", value: 67 },
  { label: "Oct", value: 70 },
];

const QUICK_LINKS: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
}[] = [
  { label: "My workouts", icon: "activity", route: ROUTE.workout },
  { label: "My bookings", icon: "calendar", route: ROUTE.bookings },
  { label: "Instructors", icon: "users", route: ROUTE.instructors },
  { label: "Challenges", icon: "flag", route: ROUTE.challenges },
  { label: "Progress & profile", icon: "user", route: ROUTE.profile },
  { label: "Membership", icon: "credit-card", route: ROUTE.membership },
];

/* ─────────── Helpers ─────────── */
const dayKey = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-CA", { timeZone: TIME_ZONE }); // YYYY-MM-DD

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function weekKeys(todayKey: string): string[] {
  const [y, m, d] = todayKey.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(y, m - 1, d - dow + i)).toISOString().slice(0, 10),
  );
}

function crowdLevel(pct: number) {
  if (pct >= 75) return { label: "BUSY", tone: C.amber };
  if (pct >= 40) return { label: "MODERATE", tone: C.sky };
  return { label: "QUIET", tone: C.green };
}

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
          accessibilityRole="button"
          accessibilityLabel={`${action}: ${title}`}
          hitSlop={8}
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
  color = C.accent,
}: {
  progress: number;
  height?: number;
  color?: string;
}) {
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
          height: "100%",
          borderRadius: height / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

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

function EmptyHint({
  icon,
  text,
  cta,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  cta: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.emptyRow}>
      <View style={styles.emptyIcon}>
        <Feather name={icon} size={16} color={C.accent} />
      </View>
      <Text style={[styles.cardNote, styles.flex]}>{text}</Text>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.smallBtn}
        accessibilityRole="button"
        accessibilityLabel={cta}
      >
        <Text style={styles.smallBtnText}>{cta}</Text>
      </TouchableOpacity>
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

  const allBookings = useBookingsStore((s) => s.bookings);
  const { challenges, member: challengeEntries } = useChallengeStore();

  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<MemberLocalNotification[]>(
    [
      {
        id: 1,
        title: "Check-in reminder",
        msg: "Remember to scan your QR pass at the turnstile today.",
        time: "10m ago",
        read: false,
      },
      {
        id: 2,
        title: "Class confirmed",
        msg: "Your spot in High-Intensity CrossFit is confirmed.",
        time: "1h ago",
        read: false,
      },
    ],
  );

  /* Navigation helpers */
  const goTab = (route: string) => {
    void Haptics.selectionAsync();
    router.replace(route as any);
  };
  const open = (route: string) => {
    void Haptics.selectionAsync();
    router.push(route as any);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.resolve(refetchAttendance());
    } finally {
      setRefreshing(false);
    }
  };

  /* Attendance */
  const activeAttendance = attendanceRecords.find(
    (record) => record.checkout_timestamp === null,
  );
  const checkedIn = Boolean(activeAttendance);
  const checkInTime = activeAttendance
    ? formatAttendanceTime(activeAttendance.scan_timestamp)
    : null;

  const attendanceTone = attendanceError
    ? C.error
    : attendanceLoading
      ? C.muted
      : checkedIn
        ? C.accent
        : C.muted;

  const todayKey = dayKey(new Date());
  const visitedDays = useMemo(
    () => new Set(attendanceRecords.map((r) => dayKey(r.scan_timestamp))),
    [attendanceRecords],
  );
  const week = useMemo(() => weekKeys(todayKey), [todayKey]);
  const monthVisits = useMemo(
    () =>
      [...visitedDays].filter((k) => k.slice(0, 7) === todayKey.slice(0, 7))
        .length,
    [visitedDays, todayKey],
  );
  const weekVisits = week.filter((k) => visitedDays.has(k)).length;
  const monthProgress = monthVisits / MONTHLY_VISIT_TARGET;

  /* Bookings: next session for this member */
  const nextSession = useMemo(() => {
    const now = Date.now();
    return (
      allBookings
        .filter(
          (b) =>
            b.memberId === MEMBER_ID &&
            (b.status === "confirmed" || b.status === "pending") &&
            new Date(`${b.date}T${b.end}:00`).getTime() > now,
        )
        .sort((a, b) =>
          (a.date + a.start).localeCompare(b.date + b.start),
        )[0] ?? null
    );
  }, [allBookings]);

  /* Challenges the member has joined */
  const activeChallenges = useMemo(() => {
    const now = Date.now();
    return challenges
      .filter((c) => challengeEntries[c.id]?.joined && c.endsAt > now)
      .slice(0, 2);
  }, [challenges, challengeEntries]);

  /* Floor */
  const occPct = Math.round((FLOOR.occupancy / FLOOR.capacity) * 100);
  const crowd = crowdLevel(occPct);

  /* Progress */
  const maxStrength = Math.max(...STRENGTH.map((s) => s.value));
  const lastStrength = STRENGTH[STRENGTH.length - 1].value;
  const firstStrength = STRENGTH[0].value;
  const weightProgress =
    (BODY.start - BODY.current) / (BODY.start - BODY.target);

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  );
  const greeting = greetingFor(new Date().getHours());

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.accent}
              colors={[C.accent]}
              progressBackgroundColor={C.surface}
            />
          }
        >
          <SubscriptionPaywall requireAppAccess>
            {/* ── Greeting ─────────────────────────── */}
            <View style={styles.greetingBlock}>
              <View style={styles.brandRow}>
                <Text style={styles.date}>{dateLabel}</Text>
                <View style={styles.brandBadge}>
                  <Feather name="map-pin" size={10} color={C.accent} />
                  <Text style={styles.brandBadgeText}>
                    {GYM.name} · {GYM.location.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.greeting}>
                {greeting}
                {firstName ? `, ${firstName}` : ""}
              </Text>
              <Text style={styles.greetingSubtitle}>
                {weekVisits === 0
                  ? "A fresh week starts with your first visit."
                  : `You've trained ${weekVisits} ${weekVisits === 1 ? "day" : "days"} this week. Keep it going.`}
              </Text>
            </View>

            {/* ── Check-in status ──────────────────── */}
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
                <Text style={styles.eyebrow}>TODAY'S VISIT</Text>
                <Text style={styles.cardHeading} numberOfLines={1}>
                  {attendanceLoading
                    ? "Checking your status…"
                    : attendanceError
                      ? "Status unavailable"
                      : checkedIn
                        ? `Checked in at ${checkInTime}`
                        : "You're not checked in"}
                </Text>
                <Text style={styles.cardNote} numberOfLines={2}>
                  {attendanceLoading
                    ? "Loading your latest attendance."
                    : attendanceError
                      ? attendanceError
                      : checkedIn && activeAttendance
                        ? `Session in progress · ${attendanceDuration(
                            activeAttendance.scan_timestamp,
                            null,
                          )}`
                        : "Show your QR pass at the turnstile to start your visit."}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  attendanceError
                    ? void refetchAttendance()
                    : open(ROUTE.checkin)
                }
                activeOpacity={0.85}
                style={styles.smallBtn}
                accessibilityRole="button"
                accessibilityLabel={
                  attendanceError
                    ? "Retry loading attendance"
                    : "View attendance history"
                }
              >
                <Text style={styles.smallBtnText}>
                  {attendanceError ? "Retry" : "History"}
                </Text>
                <Feather
                  name={attendanceError ? "refresh-cw" : "chevron-right"}
                  size={12}
                  color={C.onAccent}
                />
              </TouchableOpacity>
            </Card>

            {/* ── Gate pass ────────────────────────── */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.passBanner}
              onPress={() => goTab(ROUTE.qr)}
              accessibilityRole="button"
              accessibilityLabel="Open my QR gate pass"
            >
              <View style={styles.passIcon}>
                <Feather name="maximize" size={20} color={C.onAccent} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.passTitle}>Open gate pass</Text>
                <Text style={styles.cardNote}>
                  Show your QR code at the turnstile
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={C.accent} />
            </TouchableOpacity>

            {/* ── Quick stats ──────────────────────── */}
            <View style={styles.statCard}>
              <StatInline
                icon="check-circle"
                label="VISITS"
                value={String(monthVisits)}
                tone={C.accent}
              />
              <View style={styles.statDivider} />
              <StatInline
                icon="zap"
                label="STREAK"
                value={`${header.streakDays ?? 0}d`}
                tone={C.amber}
              />
              <View style={styles.statDivider} />
              <StatInline
                icon="award"
                label="POINTS"
                value={String(header.points ?? 0)}
                tone={C.sky}
              />
            </View>

            {/* ── This week + monthly goal ─────────── */}
            <Card style={{ gap: 12 }}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.eyebrow}>THIS WEEK</Text>
                  <Text style={styles.cardHeading}>
                    {weekVisits} {weekVisits === 1 ? "visit" : "visits"}
                  </Text>
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
                  <Text style={[styles.pillText, { color: C.accent }]}>
                    {monthVisits}/{MONTHLY_VISIT_TARGET} THIS MONTH
                  </Text>
                </View>
              </View>

              <View style={styles.weekRow}>
                {week.map((key, i) => {
                  const attended = visitedDays.has(key);
                  const isToday = key === todayKey;
                  return (
                    <View
                      key={key}
                      style={styles.weekCol}
                      accessibilityLabel={`${key}: ${attended ? "visited" : "no visit"}`}
                    >
                      <Text
                        style={[
                          styles.weekLabel,
                          isToday && { color: C.accent },
                        ]}
                      >
                        {WEEK_LABELS[i]}
                      </Text>
                      <View
                        style={[
                          styles.weekDot,
                          attended && styles.weekDotDone,
                          isToday && !attended && styles.weekDotToday,
                        ]}
                      >
                        {attended ? (
                          <Feather name="check" size={12} color={C.onAccent} />
                        ) : (
                          <Text style={styles.weekDotNum}>
                            {Number(key.slice(8))}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              <ProgressBar progress={monthProgress} />
              <Text style={styles.statNote}>
                {monthVisits >= MONTHLY_VISIT_TARGET
                  ? "Monthly goal reached. Great work!"
                  : `${MONTHLY_VISIT_TARGET - monthVisits} more ${
                      MONTHLY_VISIT_TARGET - monthVisits === 1
                        ? "visit"
                        : "visits"
                    } to reach your monthly goal`}
              </Text>
            </Card>

            {/* ── Next session ─────────────────────── */}
            <View style={styles.section}>
              <SectionTitle
                title="Next session"
                action="All bookings"
                onAction={() => goTab(ROUTE.bookings)}
              />
              {nextSession ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => goTab(ROUTE.bookings)}
                  accessibilityRole="button"
                  accessibilityLabel={`${nextSession.focus} with ${nextSession.trainerName}, ${nextSession.status}`}
                >
                  <Card style={styles.sessionCard}>
                    <View
                      style={[
                        styles.timeBox,
                        {
                          borderColor: statusTone(nextSession.status) + "55",
                          backgroundColor:
                            statusTone(nextSession.status) + "14",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeStart,
                          { color: statusTone(nextSession.status) },
                        ]}
                      >
                        {to12h(nextSession.start)}
                      </Text>
                      <Text style={styles.timeEnd}>
                        {to12h(nextSession.end)}
                      </Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.cardHeading} numberOfLines={1}>
                        {nextSession.focus}
                      </Text>
                      <Text style={styles.cardNote} numberOfLines={1}>
                        {toRelativeDay(nextSession.date)} · with{" "}
                        {nextSession.trainerName}
                      </Text>
                      <Text style={styles.cardNote} numberOfLines={1}>
                        {nextSession.location}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.pill,
                        {
                          backgroundColor:
                            statusTone(nextSession.status) + "1A",
                          borderColor: statusTone(nextSession.status) + "44",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          { color: statusTone(nextSession.status) },
                        ]}
                      >
                        {nextSession.status.toUpperCase()}
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              ) : (
                <Card>
                  <EmptyHint
                    icon="calendar"
                    text="No upcoming sessions. Book time with a trainer."
                    cta="Book"
                    onPress={() => open(ROUTE.book)}
                  />
                </Card>
              )}
            </View>

            {/* ── Today's workout ──────────────────── */}
            <View style={styles.section}>
              <SectionTitle
                title="Today's workout"
                action="Open"
                onAction={() => goTab(ROUTE.workout)}
              />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => goTab(ROUTE.workout)}
                accessibilityRole="button"
                accessibilityLabel={`Open today's workout: ${TODAY_WORKOUT.title}`}
              >
                <Card style={{ gap: 12 }}>
                  <View style={styles.rowBetween}>
                    <View style={styles.flex}>
                      <Text style={styles.eyebrow}>
                        {TODAY_WORKOUT.program.toUpperCase()}
                      </Text>
                      <Text style={styles.cardHeading}>
                        {TODAY_WORKOUT.title}
                      </Text>
                    </View>
                    <View style={styles.playBtn}>
                      <Feather name="play" size={14} color={C.onAccent} />
                    </View>
                  </View>
                  <View style={styles.workoutMeta}>
                    <View style={styles.metaChip}>
                      <Feather name="clock" size={11} color={C.muted} />
                      <Text style={styles.metaChipText}>
                        {TODAY_WORKOUT.minutes} min
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Feather name="list" size={11} color={C.muted} />
                      <Text style={styles.metaChipText}>
                        {TODAY_WORKOUT.exercises} exercises
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Feather name="layers" size={11} color={C.muted} />
                      <Text style={styles.metaChipText}>
                        {TODAY_WORKOUT.sets} sets
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </View>

            {/* ── Live floor meter ─────────────────── */}
            <Card style={{ gap: 12 }}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.eyebrow}>GYM FLOOR</Text>
                  <View style={styles.nameRow}>
                    <Feather name="map-pin" size={13} color={C.accent} />
                    <Text style={styles.cardHeading}>
                      {GYM.name} / {GYM.location}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: crowd.tone + "1A",
                      borderColor: crowd.tone + "44",
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: crowd.tone }]}>
                    {crowd.label}
                  </Text>
                </View>
              </View>
              <View style={{ gap: 6 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardNote}>Current occupancy</Text>
                  <Text style={styles.mono}>
                    {FLOOR.occupancy} / {FLOOR.capacity}
                  </Text>
                </View>
                <ProgressBar
                  progress={occPct / 100}
                  height={8}
                  color={crowd.tone}
                />
              </View>
            </Card>

            {/* ── Challenges ───────────────────────── */}
            <View style={styles.section}>
              <SectionTitle
                title="Your challenges"
                action="Browse"
                onAction={() => goTab(ROUTE.challenges)}
              />
              {activeChallenges.length === 0 ? (
                <Card>
                  <EmptyHint
                    icon="flag"
                    text="Join a challenge to earn XP and climb the leaderboard."
                    cta="Join"
                    onPress={() => goTab(ROUTE.challenges)}
                  />
                </Card>
              ) : (
                <View style={{ gap: 10 }}>
                  {activeChallenges.map((c) => {
                    const progress = challengeEntries[c.id]?.progress ?? 0;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        activeOpacity={0.85}
                        onPress={() => goTab(ROUTE.challenges)}
                        accessibilityRole="button"
                        accessibilityLabel={`${c.title}, ${progress}% complete`}
                      >
                        <Card style={{ gap: 8 }}>
                          <View style={styles.rowBetween}>
                            <Text
                              style={[styles.cardHeading, styles.flex]}
                              numberOfLines={1}
                            >
                              {c.title}
                            </Text>
                            <Text style={styles.goalPct}>{progress}%</Text>
                          </View>
                          <ProgressBar progress={progress / 100} />
                          <Text style={styles.statNote}>
                            {c.target} · {timeLeft(c.endsAt)}
                          </Text>
                        </Card>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* ── Quick links ──────────────────────── */}
            <View style={styles.section}>
              <SectionTitle title="Quick links" />
              <View style={styles.overviewGrid}>
                {QUICK_LINKS.map((o) => (
                  <TouchableOpacity
                    key={o.label}
                    style={styles.overviewTile}
                    activeOpacity={0.85}
                    onPress={() => goTab(o.route)}
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

            {/* ── Progress ─────────────────────────── */}
            <View style={styles.section}>
              <SectionTitle
                title="Your progress"
                action="Details"
                onAction={() => goTab(ROUTE.profile)}
              />
              <Card style={{ paddingVertical: 2 }}>
                {PROGRESS_ROWS.map((s, i) => (
                  <View
                    key={s.label}
                    style={[
                      styles.statRow,
                      i < PROGRESS_ROWS.length - 1 && styles.rowDivider,
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

              <Card>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.eyebrow}>BARBELL SQUAT</Text>
                    <Text style={styles.bigValue}>{lastStrength} kg</Text>
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
                      +{lastStrength - firstStrength} kg
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

            {/* ── Goals ────────────────────────────── */}
            <View style={styles.section}>
              <SectionTitle title="Your goals" />
              <View style={{ gap: 10 }}>
                <Card style={{ gap: 8 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardNote}>Reach target weight</Text>
                    <Text style={styles.goalPct}>
                      {Math.round(weightProgress * 100)}%
                    </Text>
                  </View>
                  <Text style={styles.goalValue}>
                    {BODY.current} → {BODY.target} kg
                  </Text>
                  <ProgressBar progress={weightProgress} />
                </Card>
                <Card style={{ gap: 8 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardNote}>Monthly attendance</Text>
                    <Text style={styles.goalPct}>
                      {Math.round(Math.min(monthProgress, 1) * 100)}%
                    </Text>
                  </View>
                  <Text style={styles.goalValue}>
                    {monthVisits} of {MONTHLY_VISIT_TARGET} visits
                  </Text>
                  <ProgressBar progress={monthProgress} />
                </Card>
                <Card style={{ gap: 8 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardNote}>
                      Build upper body strength
                    </Text>
                    <Text style={styles.goalPct}>
                      {Math.round((lastStrength / 80) * 100)}%
                    </Text>
                  </View>
                  <Text style={styles.goalValue}>{lastStrength} of 80 kg</Text>
                  <ProgressBar progress={lastStrength / 80} />
                  <Text style={styles.statNote}>Target date: Dec 2026</Text>
                </Card>
                <TouchableOpacity
                  style={styles.editButton}
                  activeOpacity={0.85}
                  onPress={() => goTab(ROUTE.profile)}
                  accessibilityRole="button"
                  accessibilityLabel="Manage goals in your profile"
                >
                  <Feather name="edit-2" size={13} color={C.accent} />
                  <Text style={styles.editButtonText}>Manage goals</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Recent attendance ────────────────── */}
            <View style={styles.section}>
              <SectionTitle
                title="Recent visits"
                action="View all"
                onAction={() => open(ROUTE.checkin)}
              />
              {attendanceLoading ? (
                <Text style={styles.statNote}>Loading your visits…</Text>
              ) : attendanceError ? (
                <TouchableOpacity
                  onPress={() => void refetchAttendance()}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading visits"
                >
                  <Text style={styles.attValue}>
                    {attendanceError} · Tap to retry
                  </Text>
                </TouchableOpacity>
              ) : attendanceRecords.length === 0 ? (
                <Text style={styles.statNote}>
                  No visits yet. Your check-ins will appear here.
                </Text>
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
                        <View style={styles.flex}>
                          <Text style={styles.attLabel}>CHECKED IN</Text>
                          <Text style={styles.attValue}>
                            {formatAttendanceTime(record.scan_timestamp)}
                          </Text>
                        </View>
                        <View style={styles.flex}>
                          <Text style={styles.attLabel}>CHECKED OUT</Text>
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
                {GYM.name} MEMBER WORKSPACE
              </Text>
            </View>
          </SubscriptionPaywall>
        </ScrollView>

        <MemberBottomNav activeRoute={MEMBER_ROUTES.dashboard} />
      </View>
    </SafeAreaView>
  );
}

/* ─────────── Styles ─────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  mainContainer: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, backgroundColor: C.bg },
  contentInner: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 140,
    gap: 16,
  },
  flex: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },

  /* Greeting */
  greetingBlock: { gap: 6 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  date: { color: C.muted, fontSize: 11, fontFamily: "monospace" },
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
  greeting: {
    color: C.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  greetingSubtitle: { color: C.muted, fontSize: 14, lineHeight: 20 },

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
    gap: 8,
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
  statusCard: { flexDirection: "row", alignItems: "center", gap: 12 },
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
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.accent,
  },
  smallBtnText: { color: C.onAccent, fontSize: 11, fontWeight: "900" },

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
  passTitle: { color: C.text, fontSize: 14, fontWeight: "800" },

  /* Stat strip */
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
  statInlineHeader: { flexDirection: "row", alignItems: "center", gap: 4 },
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
  statDivider: { width: 1, backgroundColor: C.border, marginVertical: 10 },

  /* Week */
  weekRow: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  weekCol: { flex: 1, alignItems: "center", gap: 6 },
  weekLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  weekDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  weekDotDone: { backgroundColor: C.accent, borderColor: C.accent },
  weekDotToday: { borderColor: C.accent + "99" },
  weekDotNum: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
  },

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
  sectionActionWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  sectionAction: { color: C.accent, fontSize: 12, fontWeight: "800" },

  /* Next session */
  sessionCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  timeBox: {
    width: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
  },
  timeStart: { fontSize: 12, fontWeight: "900", fontFamily: "monospace" },
  timeEnd: {
    color: C.muted,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },

  /* Workout */
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  workoutMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  metaChipText: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "monospace",
  },

  /* Empty hint */
  emptyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  emptyIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.accent + "14",
    borderWidth: 1,
    borderColor: C.accent + "44",
  },

  /* Quick links */
  overviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
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
  overviewLabel: { flex: 1, color: C.text, fontSize: 12, fontWeight: "700" },

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
