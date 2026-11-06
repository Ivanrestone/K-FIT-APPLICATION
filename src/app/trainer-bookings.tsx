import TrainerBottomNav from "@/components/TrainerBottomNav";
import TrainerHeader from "@/components/TrainerHeader";
import { KFitColors } from "@/constants/theme";
import {
  Booking,
  pickPending,
  statusTone,
  to12h,
  toRelativeDay,
  useBookingsStore,
} from "@/lib/bookings-store";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type Filter = "requests" | "confirmed" | "history" | "all";
type SortMode = "date" | "requested";
type ConfirmAction = "accept" | "decline" | "complete" | "noshow" | null;

const FILTERS: {
  key: Filter;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { key: "requests", label: "Requests", icon: "inbox" },
  { key: "confirmed", label: "Confirmed", icon: "check-circle" },
  { key: "history", label: "History", icon: "clock" },
  { key: "all", label: "All", icon: "layers" },
];

const EMPTY_COPY: Record<
  Filter,
  { title: string; body: string; icon: keyof typeof Feather.glyphMap }
> = {
  requests: {
    title: "No pending requests",
    body: "You're all caught up. New booking requests will appear here.",
    icon: "check-circle",
  },
  confirmed: {
    title: "No confirmed sessions",
    body: "Accept a request to add a confirmed session to your schedule.",
    icon: "calendar",
  },
  history: {
    title: "No past bookings",
    body: "Completed, cancelled, and no-show sessions will show here.",
    icon: "clock",
  },
  all: {
    title: "No bookings yet",
    body: "New bookings from members will appear here.",
    icon: "inbox",
  },
};

const CONFIRM_COPY: Record<
  Exclude<ConfirmAction, null>,
  {
    title: string;
    body: (b: Booking) => string;
    confirm: string;
    danger: boolean;
  }
> = {
  accept: {
    title: "Approve this booking?",
    body: (b) =>
      `Confirm ${b.memberName}'s request for ${b.focus} on ${toRelativeDay(b.date)} at ${to12h(b.start)}. The member will be notified.`,
    confirm: "Approve",
    danger: false,
  },
  decline: {
    title: "Decline this request?",
    body: (b) =>
      `Decline ${b.memberName}'s request for ${b.focus} on ${toRelativeDay(b.date)} at ${to12h(b.start)}. This cannot be undone.`,
    confirm: "Decline",
    danger: true,
  },
  complete: {
    title: "Mark as complete?",
    body: (b) =>
      `Confirm the session with ${b.memberName} is finished. This moves it to history.`,
    confirm: "Complete",
    danger: false,
  },
  noshow: {
    title: "Mark as no-show?",
    body: (b) =>
      `${b.memberName} didn't show up for this session. This is logged to their record.`,
    confirm: "Mark no-show",
    danger: true,
  },
};

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function durationMin(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

function matchesFilter(b: Booking, f: Filter) {
  if (f === "all") return true;
  if (f === "requests") return b.status === "pending";
  if (f === "confirmed") return b.status === "confirmed";
  return (
    b.status === "completed" ||
    b.status === "cancelled" ||
    b.status === "no-show"
  );
}

/* ─────────────── Card ─────────────── */
function BookingCard({
  booking,
  selected,
  selectMode,
  onPress,
  onLongPress,
  onToggle,
  onAccept,
  onDecline,
  onComplete,
  onNoShow,
}: {
  booking: Booking;
  selected: boolean;
  selectMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggle: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onComplete: () => void;
  onNoShow: () => void;
}) {
  const tone = statusTone(booking.status);
  const isPending = booking.status === "pending";
  const isConfirmed = booking.status === "confirmed";
  const mins = durationMin(booking.start, booking.end);

  return (
    <Pressable
      onPress={selectMode ? onToggle : onPress}
      onLongPress={onLongPress}
      delayLongPress={280}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${booking.memberName}, ${booking.focus}, ${booking.status}. ${selectMode ? "Tap to toggle selection" : "Tap to open details"}`}
    >
      {selectMode && (
        <View style={styles.selectIndicator}>
          <View style={[styles.checkbox, selected && styles.checkboxActive]}>
            {selected && (
              <Feather name="check" size={11} color={KFitColors.onAccent} />
            )}
          </View>
        </View>
      )}

      <View style={styles.cardTop}>
        <View
          style={[
            styles.timeBox,
            { borderColor: tone + "44", backgroundColor: tone + "12" },
          ]}
        >
          <Text style={[styles.timeStart, { color: tone }]}>
            {to12h(booking.start)}
          </Text>
          <Text style={styles.timeEnd}>{to12h(booking.end)}</Text>
          <Text style={styles.timeDuration}>{mins} min</Text>
        </View>

        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName} numberOfLines={1}>
              {booking.memberName}
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
          <Text style={styles.focus} numberOfLines={1}>
            {booking.focus}
          </Text>
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={10} color={KFitColors.mutedText} />
            <Text style={styles.metaText}>{booking.location}</Text>
          </View>
        </View>

        {!selectMode && (
          <Feather
            name="chevron-right"
            size={16}
            color={KFitColors.mutedText}
          />
        )}
      </View>

      {!!booking.notes && (
        <View style={styles.noteRow}>
          <View style={styles.noteLabelWrap}>
            <Text style={styles.noteLabel}>NOTE</Text>
          </View>
          <Text style={styles.noteText} numberOfLines={2}>
            {booking.notes}
          </Text>
        </View>
      )}

      {!selectMode && isPending && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={onDecline}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Decline booking from ${booking.memberName}`}
          >
            <Feather name="x" size={12} color={KFitColors.error} />
            <Text style={[styles.actionText, { color: KFitColors.error }]}>
              Decline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={onAccept}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Accept booking from ${booking.memberName}`}
          >
            <Feather name="check" size={12} color={KFitColors.onAccent} />
            <Text style={[styles.actionText, { color: KFitColors.onAccent }]}>
              Approve
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!selectMode && isConfirmed && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.secondaryBtn]}
            onPress={onNoShow}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${booking.memberName} as no-show`}
          >
            <Feather name="slash" size={12} color={KFitColors.mutedText} />
            <Text style={[styles.actionText, { color: KFitColors.mutedText }]}>
              No-show
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={onComplete}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Complete session with ${booking.memberName}`}
          >
            <Feather
              name="check-circle"
              size={12}
              color={KFitColors.onAccent}
            />
            <Text style={[styles.actionText, { color: KFitColors.onAccent }]}>
              Complete
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Pressable>
  );
}

/* ─────────────── Detail Modal ─────────────── */
function DetailModal({
  booking,
  visible,
  onClose,
  onAskAction,
  onSaveNotes,
  onReschedule,
}: {
  booking: Booking | null;
  visible: boolean;
  onClose: () => void;
  onAskAction: (action: Exclude<ConfirmAction, null>) => void;
  onSaveNotes: (notes: string) => void;
  onReschedule: (date: string, start: string, end: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [notesDraft, setNotesDraft] = useState("");
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [newDate, setNewDate] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  useEffect(() => {
    if (booking) {
      setNotesDraft(booking.notes ?? "");
      setNewDate(booking.date);
      setNewStart(booking.start);
      setNewEnd(booking.end);
      setMode("view");
    }
  }, [booking]);

  if (!booking) return null;

  const tone = statusTone(booking.status);
  const isPending = booking.status === "pending";
  const isConfirmed = booking.status === "confirmed";

  const dateChips = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { iso: toIso(d), label: toRelativeDay(toIso(d)), sub: d.getDate() };
  });

  const timeOptions = [
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ];

  const notesDirty = notesDraft !== (booking.notes ?? "");
  const rescheduleDirty =
    newDate !== booking.date ||
    newStart !== booking.start ||
    newEnd !== booking.end;
  const rescheduleValid = newStart < newEnd;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ width: "100%" }}
        >
          <Pressable
            style={[
              styles.detailSheet,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.detailHeader}>
              <View style={styles.flex}>
                <Text style={styles.detailEyebrow}>BOOKING DETAILS</Text>
                <Text style={styles.detailName}>{booking.memberName}</Text>
                <Text style={styles.detailSub} numberOfLines={1}>
                  {toRelativeDay(booking.date)} · {to12h(booking.start)} –{" "}
                  {to12h(booking.end)}
                </Text>
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
              <DetailMeta icon="activity" label="Focus" value={booking.focus} />
              <DetailMeta
                icon="map-pin"
                label="Location"
                value={booking.location}
              />
            </View>

            {mode === "reschedule" ? (
              <View style={styles.rescheduleBlock}>
                <Text style={styles.fieldLabel}>PICK A NEW DATE</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dateChipsRow}
                >
                  {dateChips.map((d) => {
                    const active = d.iso === newDate;
                    return (
                      <TouchableOpacity
                        key={d.iso}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setNewDate(d.iso);
                        }}
                        activeOpacity={0.85}
                        style={[
                          styles.dateChip,
                          active && styles.dateChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateChipLabel,
                            active && styles.dateChipLabelActive,
                          ]}
                        >
                          {d.label}
                        </Text>
                        <Text
                          style={[
                            styles.dateChipNum,
                            active && styles.dateChipNumActive,
                          ]}
                        >
                          {d.sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.fieldLabel}>START</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {timeOptions.map((t) => {
                    const active = t === newStart;
                    return (
                      <TouchableOpacity
                        key={`s-${t}`}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setNewStart(t);
                        }}
                        style={[
                          styles.timeChip,
                          active && styles.timeChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            active && styles.timeChipTextActive,
                          ]}
                        >
                          {to12h(t)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.fieldLabel}>END</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {timeOptions.map((t) => {
                    const active = t === newEnd;
                    const disabled = t <= newStart;
                    return (
                      <TouchableOpacity
                        key={`e-${t}`}
                        onPress={() => {
                          if (disabled) return;
                          void Haptics.selectionAsync();
                          setNewEnd(t);
                        }}
                        style={[
                          styles.timeChip,
                          active && styles.timeChipActive,
                          disabled && styles.timeChipDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            active && styles.timeChipTextActive,
                            disabled && styles.timeChipTextDisabled,
                          ]}
                        >
                          {to12h(t)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.rescheduleActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.secondaryBtn]}
                    onPress={() => setMode("view")}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        { color: KFitColors.mutedText },
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.acceptBtn,
                      (!rescheduleDirty || !rescheduleValid) &&
                        styles.actionDisabled,
                    ]}
                    onPress={() => {
                      if (!rescheduleDirty || !rescheduleValid) return;
                      void Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success,
                      );
                      onReschedule(newDate, newStart, newEnd);
                      setMode("view");
                    }}
                    activeOpacity={0.85}
                  >
                    <Feather
                      name="check"
                      size={13}
                      color={KFitColors.onAccent}
                    />
                    <Text
                      style={[
                        styles.actionText,
                        { color: KFitColors.onAccent },
                      ]}
                    >
                      Save new time
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.fieldLabel}>SESSION NOTES</Text>
                <TextInput
                  style={styles.notesInput}
                  value={notesDraft}
                  onChangeText={setNotesDraft}
                  placeholder="Add coaching notes, member prep, focus adjustments…"
                  placeholderTextColor={KFitColors.mutedText}
                  multiline
                  textAlignVertical="top"
                />
                {notesDirty && (
                  <TouchableOpacity
                    style={styles.saveNotesBtn}
                    onPress={() => {
                      void Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success,
                      );
                      onSaveNotes(notesDraft.trim());
                    }}
                    activeOpacity={0.85}
                  >
                    <Feather
                      name="save"
                      size={13}
                      color={KFitColors.onAccent}
                    />
                    <Text style={styles.saveNotesText}>Save notes</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* ─── Sticky action bar (only when there's a real action) ─── */}
            {mode === "view" && (isPending || isConfirmed) && (
              <View style={styles.detailActionBar}>
                {isPending && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.declineBtn]}
                      onPress={() => onAskAction("decline")}
                      activeOpacity={0.85}
                    >
                      <Feather name="x" size={13} color={KFitColors.error} />
                      <Text
                        style={[styles.actionText, { color: KFitColors.error }]}
                      >
                        Decline
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.acceptBtn]}
                      onPress={() => onAskAction("accept")}
                      activeOpacity={0.85}
                    >
                      <Feather
                        name="check"
                        size={13}
                        color={KFitColors.onAccent}
                      />
                      <Text
                        style={[
                          styles.actionText,
                          { color: KFitColors.onAccent },
                        ]}
                      >
                        Approve
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                {isConfirmed && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.secondaryBtn]}
                      onPress={() => setMode("reschedule")}
                      activeOpacity={0.85}
                    >
                      <Feather
                        name="calendar"
                        size={13}
                        color={KFitColors.text}
                      />
                      <Text
                        style={[styles.actionText, { color: KFitColors.text }]}
                      >
                        Reschedule
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.acceptBtn]}
                      onPress={() => onAskAction("complete")}
                      activeOpacity={0.85}
                    >
                      <Feather
                        name="check-circle"
                        size={13}
                        color={KFitColors.onAccent}
                      />
                      <Text
                        style={[
                          styles.actionText,
                          { color: KFitColors.onAccent },
                        ]}
                      >
                        Complete
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {mode === "view" && isConfirmed && (
              <TouchableOpacity
                style={styles.noShowBtn}
                onPress={() => onAskAction("noshow")}
                activeOpacity={0.85}
              >
                <Feather name="slash" size={12} color={KFitColors.mutedText} />
                <Text style={styles.noShowText}>Mark as no-show</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
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

/* ─────────────── Confirm Dialog ─────────────── */
function ConfirmDialog({
  action,
  booking,
  onCancel,
  onConfirm,
}: {
  action: ConfirmAction;
  booking: Booking | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!action || !booking) return null;
  const copy = CONFIRM_COPY[action];

  return (
    <Modal
      visible={!!action}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.confirmBackdrop} onPress={onCancel}>
        <Pressable
          style={styles.confirmCard}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[
              styles.confirmIconWrap,
              copy.danger && styles.confirmIconDanger,
            ]}
          >
            <Feather
              name={
                action === "accept"
                  ? "check-circle"
                  : action === "decline"
                    ? "x-circle"
                    : action === "complete"
                      ? "check"
                      : "slash"
              }
              size={22}
              color={copy.danger ? KFitColors.error : KFitColors.accent}
            />
          </View>
          <Text style={styles.confirmTitle}>{copy.title}</Text>
          <Text style={styles.confirmBody}>{copy.body(booking)}</Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={[styles.confirmBtn, styles.confirmCancelBtn]}
              onPress={onCancel}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                copy.danger ? styles.confirmDanger : styles.confirmPrimary,
              ]}
              onPress={onConfirm}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={copy.confirm}
            >
              <Feather
                name={copy.danger ? "x" : "check"}
                size={13}
                color="#fff"
              />
              <Text style={styles.confirmPrimaryText}>{copy.confirm}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ─────────────── Screen ─────────────── */
export default function TrainerBookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const all = useBookingsStore((s) => s.bookings);
  const accept = useBookingsStore((s) => s.accept);
  const decline = useBookingsStore((s) => s.decline);
  const complete = useBookingsStore((s) => s.complete);
  const markNoShow = useBookingsStore((s) => s.markNoShow);
  const saveNotes = useBookingsStore((s) => s.saveNotes);
  const reschedule = useBookingsStore((s) => s.reschedule);

  const [filter, setFilter] = useState<Filter>("requests");
  const [sort, setSort] = useState<SortMode>("date");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const pendingCount = useMemo(() => pickPending(all).length, [all]);
  const confirmedCount = useMemo(
    () => all.filter((b) => b.status === "confirmed").length,
    [all],
  );
  const completedCount = useMemo(
    () => all.filter((b) => b.status === "completed").length,
    [all],
  );
  const weekCount = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    const startIso = toIso(start);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const endIso = toIso(end);
    return all.filter(
      (b) => b.status === "confirmed" && b.date >= startIso && b.date <= endIso,
    ).length;
  }, [all]);

  const countFor = (key: Filter) =>
    all.filter((b) => matchesFilter(b, key)).length;

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = all
      .filter((b) => matchesFilter(b, filter))
      .filter((b) =>
        q.length === 0
          ? true
          : b.memberName.toLowerCase().includes(q) ||
            b.focus.toLowerCase().includes(q) ||
            b.location.toLowerCase().includes(q),
      )
      .sort((a, b) =>
        sort === "date"
          ? (a.date + a.start).localeCompare(b.date + b.start)
          : b.createdAt - a.createdAt,
      );

    if (sort === "requested") {
      return [
        {
          date: "__all__",
          label: "BY REQUEST DATE",
          items: list,
        },
      ];
    }

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
  }, [all, filter, query, sort]);

  const totalVisible = grouped.reduce((sum, g) => sum + g.items.length, 0);
  const empty = EMPTY_COPY[filter];

  const detailBooking = detailId
    ? (all.find((b) => b.id === detailId) ?? null)
    : null;

  const confirmTarget = confirmTargetId
    ? (all.find((b) => b.id === confirmTargetId) ?? null)
    : null;

  const selectedArray = all.filter((b) => selected.has(b.id));
  const selectedPending = selectedArray.filter((b) => b.status === "pending");

  const askConfirm = (action: Exclude<ConfirmAction, null>, id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfirmAction(action);
    setConfirmTargetId(id);
  };

  const cancelConfirm = () => {
    void Haptics.selectionAsync();
    setConfirmAction(null);
    setConfirmTargetId(null);
  };

  const runConfirm = () => {
    if (!confirmAction || !confirmTargetId) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (confirmAction === "accept") accept(confirmTargetId);
    else if (confirmAction === "decline") decline(confirmTargetId);
    else if (confirmAction === "complete") complete(confirmTargetId);
    else if (confirmAction === "noshow") markNoShow(confirmTargetId);

    setConfirmAction(null);
    setConfirmTargetId(null);
    setDetailId(null);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    void Haptics.selectionAsync();
  };

  const enterSelectMode = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectMode(true);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const selectAllPending = () => {
    void Haptics.selectionAsync();
    setSelected(new Set(selectedPending.map((b) => b.id)));
  };

  const bulkAccept = () => {
    if (selectedArray.length === 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    selectedArray.forEach((b) => accept(b.id));
    exitSelectMode();
  };

  const bulkDecline = () => {
    if (selectedArray.length === 0) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectedArray.forEach((b) => decline(b.id));
    exitSelectMode();
  };

  useEffect(() => {
    if (selectMode) exitSelectMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>MEMBER REQUESTS</Text>
            <Text style={styles.h1}>Sessions</Text>
          </View>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <View style={styles.pendingDot} />
              <Text style={styles.pendingBadgeText}>
                {pendingCount} pending
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statCard}>
          <StatInline label="Requests" value={pendingCount} tone="#F59E0B" />
          <View style={styles.statDivider} />
          <StatInline label="Confirmed" value={confirmedCount} tone="#22C55E" />
          <View style={styles.statDivider} />
          <StatInline label="Week" value={weekCount} tone={KFitColors.accent} />
          <View style={styles.statDivider} />
          <StatInline label="Done" value={completedCount} tone="#3B82F6" />
        </View>

        <View style={styles.searchWrap}>
          <Feather name="search" size={14} color={KFitColors.mutedText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search member, focus, or location"
            placeholderTextColor={KFitColors.mutedText}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Search bookings"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Feather name="x" size={14} color={KFitColors.mutedText} />
            </TouchableOpacity>
          )}
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
                accessibilityLabel={`${f.label}, ${count} bookings`}
                style={[styles.filterBtn, active && styles.filterBtnActive]}
              >
                <Feather
                  name={f.icon}
                  size={11}
                  color={active ? KFitColors.onAccent : KFitColors.mutedText}
                />
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
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

        <View style={styles.toolbarRow}>
          <TouchableOpacity
            onPress={() => {
              void Haptics.selectionAsync();
              setSort((s) => (s === "date" ? "requested" : "date"));
            }}
            activeOpacity={0.85}
            style={styles.toolbarBtn}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${sort === "date" ? "requested date" : "scheduled date"}`}
          >
            <Feather
              name={sort === "date" ? "calendar" : "clock"}
              size={12}
              color={KFitColors.accent}
            />
            <Text style={styles.toolbarText}>
              {sort === "date" ? "By date" : "By request"}
            </Text>
            <Feather
              name="chevrons-up"
              size={11}
              color={KFitColors.mutedText}
            />
          </TouchableOpacity>

          {!selectMode ? (
            <TouchableOpacity
              onPress={enterSelectMode}
              activeOpacity={0.85}
              style={styles.toolbarBtn}
              accessibilityRole="button"
              accessibilityLabel="Enter bulk select mode"
            >
              <Feather
                name="check-square"
                size={12}
                color={KFitColors.accent}
              />
              <Text style={styles.toolbarText}>Select</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={exitSelectMode}
              activeOpacity={0.85}
              style={[styles.toolbarBtn, styles.toolbarBtnCancel]}
              accessibilityRole="button"
              accessibilityLabel="Exit select mode"
            >
              <Feather name="x" size={12} color={KFitColors.error} />
              <Text style={[styles.toolbarText, { color: KFitColors.error }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {totalVisible === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Feather name={empty.icon} size={22} color={KFitColors.accent} />
            </View>
            <Text style={styles.emptyTitle}>
              {query.length > 0 ? "No matches" : empty.title}
            </Text>
            <Text style={styles.emptyText}>
              {query.length > 0
                ? `No bookings match "${query}". Try a different search or filter.`
                : empty.body}
            </Text>
            {filter === "all" && query.length === 0 && (
              <TouchableOpacity
                style={styles.emptyCTA}
                onPress={() => router.push("/trainer-roster" as any)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Open roster"
              >
                <Feather name="users" size={13} color={KFitColors.onAccent} />
                <Text style={styles.emptyCTAText}>Open Roster</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          grouped.map((group) => (
            <View key={group.date} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                <Text style={styles.groupCount}>
                  {group.items.length} booking
                  {group.items.length === 1 ? "" : "s"}
                </Text>
              </View>
              {group.items.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  selected={selected.has(b.id)}
                  selectMode={selectMode}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDetailId(b.id);
                  }}
                  onLongPress={() => {
                    if (!selectMode) {
                      enterSelectMode();
                      toggleSelect(b.id);
                    }
                  }}
                  onToggle={() => toggleSelect(b.id)}
                  onAccept={() => askConfirm("accept", b.id)}
                  onDecline={() => askConfirm("decline", b.id)}
                  onComplete={() => askConfirm("complete", b.id)}
                  onNoShow={() => askConfirm("noshow", b.id)}
                />
              ))}
            </View>
          ))
        )}

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>KFIT TRAINER WORKSPACE</Text>
        </View>
      </ScrollView>

      {selectMode && (
        <View
          style={[styles.bulkBar, { bottom: Math.max(insets.bottom, 8) + 100 }]}
        >
          <View style={styles.bulkInfo}>
            <Text style={styles.bulkCount}>{selected.size}</Text>
            <Text style={styles.bulkLabel}>selected</Text>
          </View>
          <TouchableOpacity
            onPress={selectAllPending}
            activeOpacity={0.85}
            style={styles.bulkLink}
          >
            <Text style={styles.bulkLinkText}>Select all pending</Text>
          </TouchableOpacity>
          <View style={styles.bulkActions}>
            <TouchableOpacity
              onPress={bulkDecline}
              activeOpacity={0.85}
              disabled={selected.size === 0}
              style={[
                styles.bulkBtn,
                styles.bulkDecline,
                selected.size === 0 && styles.actionDisabled,
              ]}
            >
              <Feather name="x" size={13} color={KFitColors.error} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={bulkAccept}
              activeOpacity={0.85}
              disabled={selected.size === 0}
              style={[
                styles.bulkBtn,
                styles.bulkAccept,
                selected.size === 0 && styles.actionDisabled,
              ]}
            >
              <Feather name="check" size={13} color={KFitColors.onAccent} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TrainerBottomNav activeRoute="/trainer-bookings" />

      <DetailModal
        booking={detailBooking}
        visible={!!detailBooking}
        onClose={() => setDetailId(null)}
        onAskAction={(action) => {
          if (detailBooking) askConfirm(action, detailBooking.id);
        }}
        onSaveNotes={(notes) => {
          if (detailBooking) saveNotes(detailBooking.id, notes);
        }}
        onReschedule={(date, start, end) => {
          if (detailBooking) reschedule(detailBooking.id, date, start, end);
        }}
      />

      <ConfirmDialog
        action={confirmAction}
        booking={confirmTarget}
        onCancel={cancelConfirm}
        onConfirm={runConfirm}
      />
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
    gap: 12,
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
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F59E0B14",
    borderWidth: 1,
    borderColor: "#F59E0B55",
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F59E0B",
  },
  pendingBadgeText: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "monospace",
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

  /* Search */
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  searchInput: {
    flex: 1,
    color: KFitColors.text,
    fontSize: 12,
    paddingVertical: 0,
    minHeight: 20,
  },

  /* Filters */
  filterRow: { flexDirection: "row", gap: 6 },
  filterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
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
    fontSize: 10,
    fontWeight: "700",
  },
  filterTextActive: { color: KFitColors.onAccent },
  filterCount: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
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
    fontSize: 8,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  filterCountTextActive: { color: KFitColors.onAccent },

  /* Toolbar */
  toolbarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  toolbarBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  toolbarBtnCancel: {
    borderColor: KFitColors.error + "55",
    backgroundColor: KFitColors.error + "10",
  },
  toolbarText: {
    color: KFitColors.text,
    fontSize: 11,
    fontWeight: "700",
  },

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
    position: "relative",
  },
  cardSelected: {
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.accent + "10",
  },
  cardPressed: { opacity: 0.92 },

  selectIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },

  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  timeBox: {
    width: 74,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 1,
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
  },
  timeDuration: {
    color: KFitColors.mutedText,
    fontSize: 8,
    fontFamily: "monospace",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  memberName: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 1,
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
  pillText: {
    fontSize: 8,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },

  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  noteLabelWrap: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
  },
  noteLabel: {
    color: KFitColors.accent,
    fontSize: 7,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.6,
  },
  noteText: { color: KFitColors.mutedText, fontSize: 11, flex: 1 },

  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  acceptBtn: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  declineBtn: {
    backgroundColor: KFitColors.error + "1A",
    borderColor: KFitColors.error + "55",
  },
  secondaryBtn: {
    backgroundColor: KFitColors.background,
    borderColor: KFitColors.border,
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
    borderColor: KFitColors.accent + "33",
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

  /* Bulk bar */
  bulkBar: {
    position: "absolute",
    left: 16,
    right: 16,
    maxWidth: 660,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(26,26,26,0.97)",
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  bulkInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  bulkCount: {
    color: KFitColors.accent,
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  bulkLabel: {
    color: KFitColors.mutedText,
    fontSize: 11,
  },
  bulkLink: { flex: 1, alignItems: "flex-end" },
  bulkLinkText: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "800",
  },
  bulkActions: { flexDirection: "row", gap: 6 },
  bulkBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  bulkAccept: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  bulkDecline: {
    backgroundColor: KFitColors.error + "1A",
    borderColor: KFitColors.error + "55",
  },

  /* Detail modal */
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
  detailName: {
    color: KFitColors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: -0.3,
  },
  detailSub: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 2,
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

  fieldLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    fontWeight: "900",
    marginTop: 4,
  },

  notesInput: {
    minHeight: 80,
    maxHeight: 140,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: KFitColors.text,
    fontSize: 12,
  },
  saveNotesBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
    marginTop: 4,
  },
  saveNotesText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "900",
  },

  detailActionBar: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },

  noShowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  noShowText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontWeight: "700",
  },

  /* Reschedule */
  rescheduleBlock: { gap: 8 },
  dateChipsRow: { flexDirection: "row", gap: 6, paddingVertical: 2 },
  dateChip: {
    minWidth: 52,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  dateChipActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  dateChipLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  dateChipLabelActive: { color: KFitColors.onAccent },
  dateChipNum: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "monospace",
    marginTop: 2,
  },
  dateChipNumActive: { color: KFitColors.onAccent },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  timeChipActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  timeChipDisabled: { opacity: 0.35 },
  timeChipText: {
    color: KFitColors.text,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  timeChipTextActive: { color: KFitColors.onAccent },
  timeChipTextDisabled: { color: KFitColors.mutedText },
  rescheduleActions: { flexDirection: "row", gap: 8, marginTop: 8 },

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

  /* Confirm dialog */
  confirmBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  confirmCard: {
    width: "100%",
    maxWidth: 340,
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
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    marginBottom: 4,
  },
  confirmIconDanger: {
    backgroundColor: KFitColors.error + "14",
    borderColor: KFitColors.error + "44",
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
  confirmPrimary: {
    backgroundColor: KFitColors.accent,
  },
  confirmDanger: {
    backgroundColor: KFitColors.error,
  },
  confirmPrimaryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
});
