import MemberBottomNav from "@/components/MemberBottomNav";
import MemberHeader from "@/components/MemberHeader";
import { MEMBER_ROUTES as R } from "@/constants/member-routes";
import { KFitColors } from "@/constants/theme";
import { useLogout } from "@/hooks/use-logout";
import { useMemberProfile } from "@/hooks/use-member-profile";
import {
    Booking,
    statusTone,
    to12h,
    toRelativeDay,
    useBookingsStore,
} from "@/lib/bookings-store";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

type Filter = "upcoming" | "pending" | "history" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "pending", label: "Pending" },
  { key: "history", label: "History" },
  { key: "all", label: "All" },
];

const EMPTY_COPY: Record<
  Filter,
  {
    title: string;
    body: string;
    icon: keyof typeof Feather.glyphMap;
    showCTA?: boolean;
  }
> = {
  upcoming: {
    title: "No upcoming sessions",
    body: "Book a session with a trainer to get started.",
    icon: "calendar",
    showCTA: true,
  },
  pending: {
    title: "No pending requests",
    body: "You don't have any booking requests waiting for confirmation.",
    icon: "clock",
  },
  history: {
    title: "No past bookings",
    body: "Completed, cancelled, and no-show sessions will show here.",
    icon: "check-circle",
  },
  all: {
    title: "No bookings yet",
    body: "All your bookings will appear here once you book a session.",
    icon: "inbox",
    showCTA: true,
  },
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function activityTier(count: number): 0 | 1 | 2 | 3 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  return 3;
}
const TIER_WIDTH = [0, 12, 18, 24];
const TIER_COLOR = ["transparent", "#22C55E", "#F59E0B", "#EF4444"];
const TIER_TINT = ["transparent", "#22C55E12", "#F59E0B12", "#EF444412"];

function weekDates(
  anchor: Date,
): { iso: string; label: string; dayNum: number }[] {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { iso: toIso(d), label: DAY_LABELS[i], dayNum: d.getDate() };
  });
}

function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toIso(new Date(year, month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function canCancel(b: Booking): boolean {
  if (b.status === "cancelled" || b.status === "completed") return false;
  const start = new Date(`${b.date}T${b.start}:00`);
  const hoursUntil = (start.getTime() - Date.now()) / 3_600_000;
  return hoursUntil > 4;
}

function matchesFilter(b: Booking, f: Filter) {
  if (f === "all") return true;
  if (f === "pending") return b.status === "pending";
  if (f === "history")
    return (
      b.status === "completed" ||
      b.status === "cancelled" ||
      b.status === "no-show"
    );
  return b.status === "confirmed" || b.status === "pending";
}

/* ─────────── Card ─────────── */
function BookingCard({
  booking,
  onPress,
  onCancel,
  onReschedule,
}: {
  booking: Booking;
  onPress: () => void;
  onCancel: () => void;
  onReschedule: () => void;
}) {
  const tone = statusTone(booking.status);
  const isPending = booking.status === "pending";
  const isConfirmed = booking.status === "confirmed";
  const cancellable = canCancel(booking);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
      accessibilityLabel={`${booking.focus} with ${booking.trainerName}, ${booking.status}`}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.timeBox,
            { borderColor: tone + "55", backgroundColor: tone + "14" },
          ]}
        >
          <Text style={[styles.timeStart, { color: tone }]}>
            {to12h(booking.start)}
          </Text>
          <Text style={styles.timeEnd}>{to12h(booking.end)}</Text>
        </View>

        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <Text style={styles.title} numberOfLines={1}>
              {booking.focus}
            </Text>
            <View
              style={[
                styles.pill,
                { backgroundColor: tone + "1A", borderColor: tone + "44" },
              ]}
            >
              <View style={[styles.pillDot, { backgroundColor: tone }]} />
              <Text style={[styles.pillText, { color: tone }]}>
                {booking.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Feather name="user" size={10} color={KFitColors.mutedText} />
            <Text style={styles.metaText} numberOfLines={1}>
              {booking.trainerName}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={10} color={KFitColors.mutedText} />
            <Text style={styles.metaText} numberOfLines={1}>
              {booking.location}
            </Text>
          </View>
        </View>

        <Feather name="chevron-right" size={16} color={KFitColors.mutedText} />
      </View>

      {!!booking.notes && (
        <View style={styles.noteRow}>
          <Feather
            name="message-square"
            size={11}
            color={KFitColors.mutedText}
          />
          <Text style={styles.noteText} numberOfLines={2}>
            {booking.notes}
          </Text>
        </View>
      )}

      {(isPending || isConfirmed) && (
        <View style={styles.actions}>
          {isConfirmed && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn]}
              onPress={onReschedule}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Reschedule ${booking.focus}`}
            >
              <Feather name="calendar" size={12} color={KFitColors.text} />
              <Text style={[styles.actionText, { color: KFitColors.text }]}>
                Reschedule
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.declineBtn,
              !cancellable && styles.actionDisabled,
            ]}
            onPress={onCancel}
            disabled={!cancellable}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Cancel ${booking.focus}`}
          >
            <Feather name="x" size={12} color={KFitColors.error} />
            <Text style={[styles.actionText, { color: KFitColors.error }]}>
              {cancellable ? "Cancel" : "Too late"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Pressable>
  );
}

/* ─────────── Detail Sheet ─────────── */
function DetailSheet({
  booking,
  visible,
  onClose,
  onCancel,
  onReschedule,
}: {
  booking: Booking | null;
  visible: boolean;
  onClose: () => void;
  onCancel: () => void;
  onReschedule: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!booking) return null;

  const tone = statusTone(booking.status);
  const cancellable = canCancel(booking);
  const isConfirmed = booking.status === "confirmed";
  const isPending = booking.status === "pending";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.detailSheet,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.detailHeader}>
            <View style={styles.flex}>
              <Text style={styles.detailEyebrow}>BOOKING</Text>
              <Text style={styles.detailTitle}>{booking.focus}</Text>
            </View>
            <View
              style={[
                styles.detailPill,
                { backgroundColor: tone + "1A", borderColor: tone + "44" },
              ]}
            >
              <View style={[styles.pillDot, { backgroundColor: tone }]} />
              <Text style={[styles.pillText, { color: tone }]}>
                {booking.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.detailMetaGrid}>
            <DetailMeta
              icon="calendar"
              label="Date"
              value={toRelativeDay(booking.date)}
            />
            <DetailMeta
              icon="clock"
              label="Time"
              value={`${to12h(booking.start)} – ${to12h(booking.end)}`}
            />
            <DetailMeta
              icon="user"
              label="Trainer"
              value={booking.trainerName}
            />
            <DetailMeta
              icon="map-pin"
              label="Location"
              value={booking.location}
            />
          </View>

          {!!booking.notes && (
            <View style={styles.detailNotes}>
              <Text style={styles.fieldLabel}>SESSION NOTES</Text>
              <Text style={styles.detailNotesText}>{booking.notes}</Text>
            </View>
          )}

          {(isPending || isConfirmed) && (
            <View style={styles.detailActions}>
              {isConfirmed && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.secondaryBtn]}
                  onPress={onReschedule}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Feather name="calendar" size={13} color={KFitColors.text} />
                  <Text style={[styles.actionText, { color: KFitColors.text }]}>
                    Reschedule
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.declineBtn,
                  !cancellable && styles.actionDisabled,
                ]}
                onPress={onCancel}
                disabled={!cancellable}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Feather name="x" size={13} color={KFitColors.error} />
                <Text style={[styles.actionText, { color: KFitColors.error }]}>
                  {cancellable ? "Cancel booking" : "Too late to cancel"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DetailMeta({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailMeta}>
      <View style={styles.detailMetaHeader}>
        <Feather name={icon} size={11} color={KFitColors.mutedText} />
        <Text style={styles.detailMetaLabel}>{label}</Text>
      </View>
      <Text style={styles.detailMetaValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

/* ─────────── Cancel confirmation ─────────── */
function CancelConfirm({
  booking,
  visible,
  onCancel,
  onConfirm,
}: {
  booking: Booking | null;
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!booking) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.confirmBackdrop} onPress={onCancel}>
        <Pressable
          style={styles.confirmCard}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.confirmIconWrap}>
            <Feather name="x-circle" size={22} color={KFitColors.error} />
          </View>
          <Text style={styles.confirmTitle}>Cancel this session?</Text>
          <Text style={styles.confirmBody}>
            {booking.focus} with {booking.trainerName} on{" "}
            {toRelativeDay(booking.date)} at {to12h(booking.start)}. This cannot
            be undone.
          </Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={[styles.confirmBtn, styles.confirmCancelBtn]}
              onPress={onCancel}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Keep booking"
            >
              <Text style={styles.confirmCancelText}>Keep</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, styles.confirmDanger]}
              onPress={onConfirm}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Cancel booking"
            >
              <Feather name="x" size={13} color="#fff" />
              <Text style={styles.confirmDangerText}>Cancel booking</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ─────────── Screen ─────────── */
export default function MemberBookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useMemberProfile();
  const { isSigningOut, logout } = useLogout();

  const all = useBookingsStore((s) => s.bookings);
  const decline = useBookingsStore((s) => s.decline);

  const [filter, setFilter] = useState<Filter>("upcoming");
  const [refreshing, setRefreshing] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const [anchor, setAnchor] = useState(() => new Date());
  const todayIso = useMemo(() => toIso(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "Member";

  const myBookings = useMemo(
    () => all.filter((b) => b.memberId === "M-101"),
    [all],
  );

  const confirmedMine = useMemo(
    () => myBookings.filter((b) => b.status === "confirmed"),
    [myBookings],
  );

  const week = useMemo(() => weekDates(anchor), [anchor]);
  const isCurrentWeek = week.some((d) => d.iso === todayIso);

  const stats = useMemo(() => {
    const now = Date.now();
    const upcoming = myBookings.filter((b) => {
      const start = new Date(`${b.date}T${b.start}:00`).getTime();
      return b.status === "confirmed" && start > now;
    }).length;
    const pending = myBookings.filter((b) => b.status === "pending").length;
    const completed = myBookings.filter((b) => b.status === "completed").length;
    const cancelled = myBookings.filter((b) => b.status === "cancelled").length;
    return { upcoming, pending, completed, cancelled };
  }, [myBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const countFor = (f: Filter) =>
    myBookings.filter((b) => matchesFilter(b, f)).length;

  const activityCountForDate = (iso: string) =>
    confirmedMine.filter((b) => b.date === iso).length;

  // Fixed: removed the no-op filter; list now respects both the filter pills
  // AND the selected day from the week strip.
  const grouped = useMemo(() => {
    const list = myBookings
      .filter((b) => matchesFilter(b, filter))
      .filter((b) => b.date === selectedDate) // ← filter to selected day
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

    const groups: { date: string; label: string; items: Booking[] }[] = [];
    for (const b of list) {
      const last = groups[groups.length - 1];
      if (last && last.date === b.date) last.items.push(b);
      else
        groups.push({
          date: b.date,
          label: toRelativeDay(b.date),
          items: [b],
        });
    }
    return groups;
  }, [myBookings, filter, selectedDate]);

  const totalVisible = grouped.reduce((s, g) => s + g.items.length, 0);

  // Different empty copy when a specific day is selected vs the default
  const empty = useMemo(() => {
    const isToday = selectedDate === todayIso;
    if (!isToday) {
      const dayName = new Date(selectedDate + "T00:00:00").toLocaleDateString(
        "en-US",
        { weekday: "long" },
      );
      return {
        title: `Nothing on ${dayName}`,
        body: "This day is free. Try another day or book a new session.",
        icon: "coffee" as keyof typeof Feather.glyphMap,
        showCTA: filter === "upcoming" || filter === "all",
      };
    }
    return EMPTY_COPY[filter];
  }, [filter, selectedDate, todayIso]);

  const detailBooking = detailId
    ? (myBookings.find((b) => b.id === detailId) ?? null)
    : null;

  const cancelBooking = cancelId
    ? (myBookings.find((b) => b.id === cancelId) ?? null)
    : null;

  const askCancel = (id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCancelId(id);
  };

  const confirmCancel = () => {
    if (!cancelId) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    decline(cancelId);
    setCancelId(null);
    setDetailId(null);
  };

  const handleReschedule = (_id: string) => {
    void Haptics.selectionAsync();
  };

  const shiftWeek = (dir: -1 | 1) => {
    void Haptics.selectionAsync();
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + dir * 7);
    setAnchor(d);
    const target = weekDates(d).find(
      (w) =>
        w.label === DAY_LABELS[new Date(selectedDate + "T00:00:00").getDay()],
    );
    setSelectedDate(target?.iso ?? weekDates(d)[0].iso);
  };

  const goToday = () => {
    void Haptics.selectionAsync();
    setAnchor(new Date());
    setSelectedDate(todayIso);
  };

  const pickDate = (iso: string) => {
    void Haptics.selectionAsync();
    setSelectedDate(iso);
    setAnchor(new Date(iso + "T00:00:00"));
    setCalendarOpen(false);
  };

  const openCalendar = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const d = new Date(selectedDate + "T00:00:00");
    setCalMonth({ year: d.getFullYear(), month: d.getMonth() });
    setCalendarOpen(true);
  };

  const shiftMonth = (dir: -1 | 1) => {
    void Haptics.selectionAsync();
    setCalMonth((m) => {
      const d = new Date(m.year, m.month + dir, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const grid = useMemo(
    () => monthGrid(calMonth.year, calMonth.month),
    [calMonth.year, calMonth.month],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.main}>
        <MemberHeader
          name={name}
          tier="VIP"
          streakDays={0}
          points={0}
          checkedIn={false}
          isSigningOut={isSigningOut}
          onLogout={logout}
          activeRoute={R.bookings}
          notifications={[]}
          setNotifications={() => {}}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.container}
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
          <View style={styles.headingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>MY SESSIONS</Text>
              <Text style={styles.h1}>Schedule & Bookings</Text>
            </View>
            <TouchableOpacity
              onPress={openCalendar}
              activeOpacity={0.85}
              style={styles.calendarBtn}
              accessibilityRole="button"
              accessibilityLabel="Open month calendar"
            >
              <Feather name="calendar" size={13} color={KFitColors.accent} />
              <Text style={styles.calendarBtnText}>
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" },
                )}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statCard}>
            <StatInline
              label="Upcoming"
              value={stats.upcoming}
              tone={KFitColors.accent}
            />
            <View style={styles.statDivider} />
            <StatInline label="Pending" value={stats.pending} tone="#F59E0B" />
            <View style={styles.statDivider} />
            <StatInline label="Done" value={stats.completed} tone="#22C55E" />
            <View style={styles.statDivider} />
            <StatInline
              label="Cancelled"
              value={stats.cancelled}
              tone="#EF4444"
            />
          </View>

          <View style={styles.weekHeader}>
            <TouchableOpacity
              onPress={() => shiftWeek(-1)}
              hitSlop={10}
              style={styles.weekNavBtn}
              accessibilityRole="button"
              accessibilityLabel="Previous week"
            >
              <Feather name="chevron-left" size={16} color={KFitColors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openCalendar}
              activeOpacity={0.7}
              style={styles.weekRangeBtn}
              accessibilityRole="button"
              accessibilityLabel="Open month calendar"
            >
              <Text style={styles.weekRange}>
                {new Date(week[0].iso + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" },
                )}
                {" – "}
                {new Date(week[6].iso + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" },
                )}
              </Text>
              <Feather
                name="chevron-down"
                size={12}
                color={KFitColors.mutedText}
              />
            </TouchableOpacity>
            <View style={styles.weekHeaderRight}>
              {!isCurrentWeek && (
                <TouchableOpacity
                  onPress={goToday}
                  activeOpacity={0.8}
                  hitSlop={6}
                  style={styles.todayChipSmall}
                  accessibilityRole="button"
                  accessibilityLabel="Jump to today"
                >
                  <Feather name="target" size={10} color={KFitColors.accent} />
                  <Text style={styles.todayChipSmallText}>Today</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => shiftWeek(1)}
                hitSlop={10}
                style={styles.weekNavBtn}
                accessibilityRole="button"
                accessibilityLabel="Next week"
              >
                <Feather
                  name="chevron-right"
                  size={16}
                  color={KFitColors.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weekStrip}>
            {week.map((d) => {
              const selected = d.iso === selectedDate;
              const isToday = d.iso === todayIso;
              const count = activityCountForDate(d.iso);
              const tier = activityTier(count);
              return (
                <TouchableOpacity
                  key={d.iso}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedDate(d.iso);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`${d.label} ${d.dayNum}, ${count} session${count === 1 ? "" : "s"}`}
                  accessibilityState={{ selected }}
                  style={[
                    styles.dayChip,
                    isToday && !selected && styles.dayChipToday,
                    selected && styles.dayChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      isToday && !selected && styles.dayLabelToday,
                      selected && styles.dayLabelActive,
                    ]}
                  >
                    {d.label}
                  </Text>
                  <Text
                    style={[
                      styles.dayNum,
                      isToday && !selected && styles.dayNumToday,
                      selected && styles.dayNumActive,
                    ]}
                  >
                    {d.dayNum}
                  </Text>
                  <View style={styles.dayBarSlot}>
                    {tier > 0 && (
                      <View
                        style={[
                          styles.dayBar,
                          {
                            width: TIER_WIDTH[tier] * 0.65,
                            backgroundColor: selected
                              ? KFitColors.onAccent
                              : TIER_COLOR[tier],
                          },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.filterRow}>
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const count = countFor(f.key);
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setFilter(f.key);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.filterBtn, active && styles.filterBtnActive]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                    numberOfLines={1}
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
                </TouchableOpacity>
              );
            })}
          </View>

          {totalVisible === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Feather
                  name={empty.icon}
                  size={20}
                  color={KFitColors.accent}
                />
              </View>
              <Text style={styles.emptyTitle}>{empty.title}</Text>
              <Text style={styles.emptyText}>{empty.body}</Text>
              {empty.showCTA && (
                <TouchableOpacity
                  style={styles.emptyCTA}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    router.push(((R as any).book ?? "/member-book") as any);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Book a session"
                >
                  <Feather name="plus" size={13} color={KFitColors.onAccent} />
                  <Text style={styles.emptyCTAText}>Book a session</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            grouped.map((group) => (
              <View key={group.date} style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupLabel}>{group.label}</Text>
                  <Text style={styles.groupCount}>
                    {group.items.length} session
                    {group.items.length === 1 ? "" : "s"}
                  </Text>
                </View>
                {group.items.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onPress={() => {
                      void Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Light,
                      );
                      setDetailId(b.id);
                    }}
                    onCancel={() => askCancel(b.id)}
                    onReschedule={() => handleReschedule(b.id)}
                  />
                ))}
              </View>
            ))
          )}

          <View style={styles.footer}>
            <Text style={styles.footerLabel}>KFIT MEMBER WORKSPACE</Text>
          </View>
        </ScrollView>

        <MemberBottomNav activeRoute={R.bookings} />

        <DetailSheet
          booking={detailBooking}
          visible={!!detailBooking}
          onClose={() => setDetailId(null)}
          onCancel={() => {
            if (detailBooking) askCancel(detailBooking.id);
          }}
          onReschedule={() => {
            if (detailBooking) handleReschedule(detailBooking.id);
          }}
        />

        <CancelConfirm
          booking={cancelBooking}
          visible={!!cancelBooking}
          onCancel={() => setCancelId(null)}
          onConfirm={confirmCancel}
        />

        <Modal
          visible={calendarOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCalendarOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setCalendarOpen(false)}
          >
            <Pressable
              style={[
                styles.calendarSheet,
                { paddingBottom: Math.max(insets.bottom, 20) },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.sheetHandle} />

              <View style={styles.calHeader}>
                <TouchableOpacity
                  onPress={() => shiftMonth(-1)}
                  hitSlop={10}
                  style={styles.calNavBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                >
                  <Feather
                    name="chevron-left"
                    size={18}
                    color={KFitColors.text}
                  />
                </TouchableOpacity>
                <Text style={styles.calMonthLabel}>
                  {MONTH_NAMES[calMonth.month]} {calMonth.year}
                </Text>
                <TouchableOpacity
                  onPress={() => shiftMonth(1)}
                  hitSlop={10}
                  style={styles.calNavBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                >
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={KFitColors.text}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.calDowRow}>
                {DAY_LABELS.map((l, i) => (
                  <Text key={i} style={styles.calDow}>
                    {l}
                  </Text>
                ))}
              </View>

              <View style={styles.calGrid}>
                {grid.map((iso, i) => {
                  if (!iso)
                    return <View key={`empty-${i}`} style={styles.calCell} />;
                  const isSelected = iso === selectedDate;
                  const isToday = iso === todayIso;
                  const count = activityCountForDate(iso);
                  const tier = activityTier(count);
                  const barWidth = TIER_WIDTH[tier];
                  const barColor = isSelected
                    ? KFitColors.onAccent
                    : TIER_COLOR[tier];
                  return (
                    <TouchableOpacity
                      key={iso}
                      style={styles.calCell}
                      onPress={() => pickDate(iso)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${iso}, ${count} session${count === 1 ? "" : "s"}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View
                        style={[
                          styles.calDayWrap,
                          !isSelected &&
                            tier > 0 && { backgroundColor: TIER_TINT[tier] },
                        ]}
                      >
                        <View
                          style={[
                            styles.calDayCircle,
                            isToday && styles.calDayCircleToday,
                            isSelected && styles.calDayCircleSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.calDayNum,
                              isToday && !isSelected && styles.calDayNumToday,
                              isSelected && styles.calDayNumSelected,
                            ]}
                          >
                            {Number(iso.slice(8))}
                          </Text>
                        </View>
                        <View style={styles.calBarSlot}>
                          {tier > 0 && (
                            <View
                              style={[
                                styles.calBar,
                                {
                                  width: barWidth,
                                  backgroundColor: barColor,
                                },
                              ]}
                            />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.calLegend}>
                <LegendItem color={TIER_COLOR[1]} label="1" />
                <LegendItem color={TIER_COLOR[2]} label="2–3" />
                <LegendItem color={TIER_COLOR[3]} label="4+" />
              </View>

              <View style={styles.calFooter}>
                <TouchableOpacity
                  style={[styles.calFooterBtn, styles.calFooterCancel]}
                  onPress={() => setCalendarOpen(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.calFooterCancelText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.calFooterBtn, styles.calFooterToday]}
                  onPress={() => {
                    goToday();
                    setCalendarOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="target"
                    size={14}
                    color={KFitColors.onAccent}
                  />
                  <Text style={styles.calFooterTodayText}>Jump to today</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function StatInline({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <View style={styles.statInline}>
      <Text style={[styles.statInlineValue, { color: tone }]}>{value}</Text>
      <Text style={styles.statInlineLabel}>{label}</Text>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendBar, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  main: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1, backgroundColor: KFitColors.background },
  container: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 140,
    gap: 14,
  },
  flex: { flex: 1, minWidth: 0 },
  actionDisabled: { opacity: 0.4 },

  /* Header */
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  h1: {
    color: KFitColors.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: -0.4,
  },
  calendarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    backgroundColor: KFitColors.accent + "12",
  },
  calendarBtnText: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  /* Stat strip */
  statCard: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  statInline: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 2,
  },
  statInlineValue: {
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.4,
  },
  statInlineLabel: {
    fontSize: 9,
    color: KFitColors.mutedText,
    letterSpacing: 0.8,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 10,
  },

  /* Week strip */
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekHeaderRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  weekNavBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  weekRangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  weekRange: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "monospace",
    letterSpacing: 0.3,
  },
  todayChipSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    backgroundColor: KFitColors.accent + "12",
  },
  todayChipSmallText: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "800",
  },
  weekStrip: { flexDirection: "row", gap: 6 },
  dayChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    gap: 2,
  },
  dayChipToday: { borderColor: KFitColors.accent + "55" },
  dayChipActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  dayLabel: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  dayLabelToday: { color: KFitColors.accent },
  dayLabelActive: { color: KFitColors.onAccent },
  dayNum: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  dayNumToday: { color: KFitColors.accent },
  dayNumActive: { color: KFitColors.onAccent },
  dayBarSlot: {
    height: 4,
    marginTop: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBar: { height: 3, borderRadius: 2 },

  /* Filters */
  filterRow: { flexDirection: "row", gap: 6 },
  filterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  filterBtnActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  filterText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontWeight: "700",
  },
  filterTextActive: { color: KFitColors.onAccent },
  filterCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  filterCountActive: {
    backgroundColor: KFitColors.onAccent + "22",
    borderColor: KFitColors.onAccent + "44",
  },
  filterCountText: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  filterCountTextActive: { color: KFitColors.onAccent },

  /* Group */
  group: { gap: 8, marginTop: 4 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  groupLabel: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    fontFamily: "monospace",
  },
  groupCount: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
  },

  /* Card */
  card: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  timeBox: {
    width: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
  },
  timeStart: {
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  timeEnd: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  title: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillDot: { width: 5, height: 5, borderRadius: 3 },
  pillText: {
    fontSize: 8,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },

  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  noteText: { color: KFitColors.mutedText, fontSize: 11, flex: 1 },

  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryBtn: {
    backgroundColor: KFitColors.background,
    borderColor: KFitColors.border,
  },
  declineBtn: {
    backgroundColor: KFitColors.error + "1A",
    borderColor: KFitColors.error + "55",
  },
  actionText: { fontSize: 12, fontWeight: "800" },

  /* Empty */
  emptyCard: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    marginBottom: 4,
  },
  emptyTitle: { color: KFitColors.text, fontSize: 14, fontWeight: "800" },
  emptyText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  emptyCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
    marginTop: 8,
  },
  emptyCTAText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "900",
  },

  footer: { alignItems: "center", paddingVertical: 12 },
  footerLabel: {
    color: KFitColors.mutedText,
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    opacity: 0.7,
  },

  /* Detail sheet */
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  detailSheet: {
    backgroundColor: KFitColors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: KFitColors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    maxHeight: "92%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: KFitColors.border,
    marginBottom: 4,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  detailEyebrow: {
    color: KFitColors.accent,
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    fontWeight: "900",
  },
  detailTitle: {
    color: KFitColors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: -0.3,
  },
  detailPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  detailMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailMeta: {
    flexGrow: 1,
    flexBasis: "48%",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    gap: 4,
  },
  detailMetaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailMetaLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontFamily: "monospace",
    letterSpacing: 0.8,
  },
  detailMetaValue: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "700",
  },

  detailNotes: { gap: 6 },
  fieldLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    fontWeight: "900",
  },
  detailNotesText: {
    color: KFitColors.text,
    fontSize: 12,
    lineHeight: 18,
  },

  detailActions: { flexDirection: "row", gap: 8, marginTop: 4 },

  closeBtn: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    marginTop: 4,
  },
  closeText: {
    color: KFitColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },

  /* Cancel confirmation */
  confirmBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  confirmCard: {
    width: "100%",
    maxWidth: 320,
    gap: 12,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    alignItems: "center",
  },
  confirmIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.error + "14",
    borderWidth: 1,
    borderColor: KFitColors.error + "44",
    marginBottom: 4,
  },
  confirmTitle: {
    color: KFitColors.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  confirmBody: {
    color: KFitColors.mutedText,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    width: "100%",
  },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmCancelBtn: {
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  confirmCancelText: {
    color: KFitColors.mutedText,
    fontSize: 13,
    fontWeight: "800",
  },
  confirmDanger: {
    backgroundColor: KFitColors.error,
  },
  confirmDangerText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },

  /* Calendar modal */
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  calMonthLabel: {
    color: KFitColors.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  calDowRow: {
    flexDirection: "row",
    marginTop: 2,
  },
  calDow: {
    flex: 1,
    textAlign: "center",
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 0.8,
    paddingVertical: 6,
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 4,
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calDayWrap: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  calDayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  calDayCircleToday: {
    borderWidth: 1,
    borderColor: KFitColors.accent + "77",
  },
  calDayCircleSelected: {
    backgroundColor: KFitColors.accent,
  },
  calDayNum: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  calDayNumToday: { color: KFitColors.accent },
  calDayNumSelected: { color: KFitColors.onAccent, fontWeight: "900" },
  calBarSlot: {
    height: 4,
    marginTop: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  calBar: {
    height: 3,
    borderRadius: 2,
  },
  calLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendBar: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },
  calFooter: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  calFooterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  calFooterCancel: {
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  calFooterCancelText: {
    color: KFitColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  calFooterToday: { backgroundColor: KFitColors.accent },
  calFooterTodayText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "800",
  },
  calendarSheet: {
    backgroundColor: KFitColors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: KFitColors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
});
