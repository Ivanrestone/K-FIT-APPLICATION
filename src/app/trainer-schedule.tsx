import TrainerBottomNav from "@/components/TrainerBottomNav";
import TrainerHeader from "@/components/TrainerHeader";
import { KFitColors } from "@/constants/theme";
import {
  Booking,
  pickConfirmed,
  pickPending,
  statusTone,
  to12h,
  useBookingsStore,
} from "@/lib/bookings-store";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

function duration(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** "in 12 min" / "now" / "in 2h 15m" */
function untilLabel(startHHMM: string, dateIso: string, todayIso: string) {
  if (dateIso !== todayIso) return null;
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const diff = toMinutes(startHHMM) - nowMin;
  if (diff < -1) return "now";
  if (diff <= 1) return "starting now";
  if (diff < 60) return `in ${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m ? `in ${h}h ${m}m` : `in ${h}h`;
}

export default function TrainerScheduleScreen() {
  const insets = useSafeAreaInsets();
  const all = useBookingsStore((s) => s.bookings);
  const confirmed = useMemo(() => pickConfirmed(all), [all]);
  const pending = useMemo(() => pickPending(all), [all]);

  const [anchor, setAnchor] = useState(() => new Date());
  const todayIso = useMemo(() => toIso(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const week = useMemo(() => weekDates(anchor), [anchor]);
  const isCurrentWeek = week.some((d) => d.iso === todayIso);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const activityCountForDate = (iso: string) =>
    all.filter((b) => b.date === iso && b.status !== "cancelled").length;

  const daySessions = useMemo(
    () =>
      confirmed
        .filter((b) => b.date === selectedDate)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [confirmed, selectedDate],
  );

  const todayCount = confirmed.filter((b) => b.date === todayIso).length;
  const weekCount = week.reduce(
    (sum, d) => sum + confirmed.filter((b) => b.date === d.iso).length,
    0,
  );
  const completedCount = all.filter((b) => b.status === "completed").length;
  const pendingCount = pending.length;

  const nextUp: Booking | null = useMemo(() => {
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const todayRemaining = confirmed
      .filter((b) => b.date === todayIso && toMinutes(b.end) >= nowMin)
      .sort((a, b) => a.start.localeCompare(b.start));
    if (todayRemaining.length) return todayRemaining[0];
    const future = confirmed
      .filter((b) => b.date > todayIso)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    return future[0] ?? null;
  }, [confirmed, todayIso]);

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

  const selectedLabel = useMemo(() => {
    if (selectedDate === todayIso) return "Today";
    return new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, [selectedDate, todayIso]);

  const headerDate = useMemo(
    () =>
      new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [selectedDate],
  );

  const grid = useMemo(
    () => monthGrid(calMonth.year, calMonth.month),
    [calMonth.year, calMonth.month],
  );

  const nextUpCountdown = nextUp
    ? untilLabel(nextUp.start, nextUp.date, todayIso)
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <TrainerHeader />
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
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.headingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>CONFIRMED SESSIONS</Text>
            <Text style={styles.h1}>My Schedule</Text>
          </View>
          <TouchableOpacity
            onPress={openCalendar}
            activeOpacity={0.85}
            style={styles.calendarBtn}
            accessibilityRole="button"
            accessibilityLabel={`Open calendar. Selected ${headerDate}`}
          >
            <Feather name="calendar" size={13} color={KFitColors.accent} />
            <Text style={styles.calendarBtnText}>{headerDate}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats ──────────────────────────────────────── */}
        <View style={styles.statCard}>
          <StatInline
            label="Today"
            value={todayCount}
            tone={KFitColors.accent}
          />
          <View style={styles.statDivider} />
          <StatInline label="Week" value={weekCount} tone={KFitColors.text} />
          <View style={styles.statDivider} />
          <StatInline label="Pending" value={pendingCount} tone="#F59E0B" />
          <View style={styles.statDivider} />
          <StatInline label="Done" value={completedCount} tone="#3B82F6" />
        </View>

        {/* ── Up next ────────────────────────────────────── */}
        {nextUp && (
          <View style={styles.upNextCard}>
            <View style={styles.upNextTopRow}>
              <View style={styles.upNextPulseWrap}>
                <View style={styles.upNextPulse} />
              </View>
              <Text style={styles.upNextLabel}>UP NEXT</Text>
              {nextUpCountdown && (
                <View style={styles.upNextCountdown}>
                  <Text style={styles.upNextCountdownText}>
                    {nextUpCountdown}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.upNextBody}>
              <View style={styles.upNextTimeBlock}>
                <Text style={styles.upNextTime}>{to12h(nextUp.start)}</Text>
                <Text style={styles.upNextDuration}>
                  {duration(nextUp.start, nextUp.end)}
                </Text>
              </View>
              <View style={styles.upNextDivider} />
              <View style={styles.flex}>
                <Text style={styles.upNextName} numberOfLines={1}>
                  {nextUp.memberName}
                </Text>
                <Text style={styles.upNextFocus} numberOfLines={1}>
                  {nextUp.focus}
                </Text>
                <View style={styles.upNextMetaRow}>
                  <Feather
                    name="map-pin"
                    size={10}
                    color={KFitColors.mutedText}
                  />
                  <Text style={styles.upNextMeta} numberOfLines={1}>
                    {nextUp.location}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Week nav ───────────────────────────────────── */}
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
              {new Date(week[0].iso + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              {" – "}
              {new Date(week[6].iso + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
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
              <Feather name="chevron-right" size={16} color={KFitColors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Week strip ─────────────────────────────────── */}
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

        {/* ── Selected day sessions ──────────────────────── */}
        <View style={styles.dayCard}>
          <View style={styles.dayHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dayHeaderEyebrow}>SESSIONS</Text>
              <Text style={styles.dayHeaderLabel}>{selectedLabel}</Text>
            </View>
            <View style={styles.dayCountPill}>
              <Text style={styles.dayCountPillText}>{daySessions.length}</Text>
            </View>
          </View>

          {daySessions.length === 0 ? (
            <View style={styles.emptyInline}>
              <View style={styles.emptyIconWrap}>
                <Feather name="coffee" size={18} color={KFitColors.accent} />
              </View>
              <Text style={styles.emptyTitle}>No sessions booked</Text>
              <Text style={styles.emptyText}>
                A quiet day. Tap the calendar above to plan ahead.
              </Text>
            </View>
          ) : (
            <View style={styles.sessionList}>
              {daySessions.map((b: Booking, idx) => {
                const tone = statusTone(b.status);
                const isLast = idx === daySessions.length - 1;
                const isNow =
                  b.date === todayIso &&
                  toMinutes(b.start) <=
                    new Date().getHours() * 60 + new Date().getMinutes() &&
                  toMinutes(b.end) >
                    new Date().getHours() * 60 + new Date().getMinutes();
                return (
                  <View
                    key={b.id}
                    style={[styles.row, !isLast && styles.rowDivider]}
                  >
                    <View style={styles.timeCol}>
                      <Text style={styles.timeStart}>{to12h(b.start)}</Text>
                      <Text style={styles.timeEnd}>{to12h(b.end)}</Text>
                      <Text style={styles.timeDuration}>
                        {duration(b.start, b.end)}
                      </Text>
                    </View>
                    <View style={styles.rowDividerBar} />
                    <View style={styles.flex}>
                      <View style={styles.nameRow}>
                        <Text style={styles.memberName} numberOfLines={1}>
                          {b.memberName}
                        </Text>
                        {isNow && (
                          <View style={styles.liveTag}>
                            <View style={styles.liveTagDot} />
                            <Text style={styles.liveTagText}>LIVE</Text>
                          </View>
                        )}
                        <View
                          style={[
                            styles.pill,
                            {
                              backgroundColor: tone + "1F",
                              borderColor: tone + "44",
                            },
                          ]}
                        >
                          <View
                            style={[styles.pillDot, { backgroundColor: tone }]}
                          />
                          <Text style={[styles.pillText, { color: tone }]}>
                            {b.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.focus} numberOfLines={1}>
                        {b.focus}
                      </Text>
                      <View style={styles.metaRow}>
                        <Feather
                          name="map-pin"
                          size={10}
                          color={KFitColors.mutedText}
                        />
                        <Text style={styles.metaText}>{b.location}</Text>
                      </View>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={16}
                      color={KFitColors.mutedText}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>KFIT TRAINER WORKSPACE</Text>
        </View>
      </ScrollView>

      <TrainerBottomNav activeRoute="/trainer-schedule" />

      {/* ── Calendar modal ─────────────────────────────── */}
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
                <Feather name="target" size={14} color={KFitColors.onAccent} />
                <Text style={styles.calFooterTodayText}>Jump to today</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  content: { flex: 1, backgroundColor: KFitColors.background },
  container: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 16,
  },
  flex: { flex: 1, minWidth: 0 },

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

  /* Stats */
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
  statDivider: {
    width: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 10,
  },
  statInlineValue: {
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.4,
  },
  statInlineLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: "monospace",
  },

  /* Up next */
  upNextCard: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  upNextTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  upNextPulseWrap: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KFitColors.accent + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  upNextPulse: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: KFitColors.accent,
  },
  upNextLabel: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
    flex: 1,
  },
  upNextCountdown: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  upNextCountdownText: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  upNextBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  upNextTimeBlock: { alignItems: "flex-start" },
  upNextTime: {
    color: KFitColors.text,
    fontSize: 15,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.2,
  },
  upNextDuration: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },
  upNextDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: KFitColors.border,
    marginVertical: 4,
  },
  upNextName: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  upNextFocus: {
    color: KFitColors.mutedText,
    fontSize: 11,
    marginTop: 2,
  },
  upNextMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  upNextMeta: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
  },

  /* Week header */
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

  /* Week strip */
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

  /* Day card */
  dayCard: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  dayHeaderEyebrow: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  dayHeaderLabel: {
    color: KFitColors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: -0.2,
  },
  dayCountPill: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCountPillText: {
    color: KFitColors.accent,
    fontSize: 13,
    fontWeight: "900",
    fontFamily: "monospace",
  },

  sessionList: { paddingTop: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  rowDividerBar: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: KFitColors.border,
    marginVertical: 2,
  },
  timeCol: { width: 68 },
  timeStart: {
    color: KFitColors.accent,
    fontSize: 13,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  timeEnd: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },
  timeDuration: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontFamily: "monospace",
    marginTop: 4,
    letterSpacing: 0.3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  memberName: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "800",
    flexShrink: 1,
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
  },
  liveTagDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: KFitColors.accent,
  },
  liveTagText: {
    color: KFitColors.accent,
    fontSize: 7,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.6,
  },
  focus: { color: KFitColors.mutedText, fontSize: 11, marginTop: 2 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
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
  pillText: { fontSize: 8, fontWeight: "800", fontFamily: "monospace" },

  emptyInline: { alignItems: "center", gap: 8, paddingVertical: 32 },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
  },
  emptyTitle: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  emptyText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 16,
  },

  footer: { alignItems: "center", paddingVertical: 12 },
  footerLabel: {
    color: KFitColors.mutedText,
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    opacity: 0.7,
  },

  /* Calendar modal */
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
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
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: KFitColors.border,
    marginBottom: 8,
  },
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
});
