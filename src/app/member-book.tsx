import MemberBottomNav from "@/components/MemberBottomNav";
import MemberHeader from "@/components/MemberHeader";
import { MEMBER_ROUTES as R } from "@/constants/member-routes";
import { KFitColors } from "@/constants/theme";
import { useLogout } from "@/hooks/use-logout";
import { useMemberProfile } from "@/hooks/use-member-profile";
import { to12h, useBookingsStore } from "@/lib/bookings-store";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Trainer = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  initials: string;
};

const TRAINERS: Trainer[] = [
  {
    id: "TR-101",
    name: "Marcus Vance",
    specialty: "Strength & Conditioning",
    rating: 4.9,
    reviews: 48,
    initials: "MV",
  },
  {
    id: "TR-102",
    name: "Elena Rostova",
    specialty: "Functional HIIT",
    rating: 5.0,
    reviews: 62,
    initials: "ER",
  },
  {
    id: "TR-103",
    name: "Jaxson Reed",
    specialty: "Powerlifting",
    rating: 4.8,
    reviews: 35,
    initials: "JR",
  },
  {
    id: "TR-104",
    name: "Aria Chen",
    specialty: "Mobility & Rehab",
    rating: 4.9,
    reviews: 51,
    initials: "AC",
  },
];

const DURATIONS = [30, 45, 60] as const;
type Duration = (typeof DURATIONS)[number];

const TIME_SLOTS = [
  "06:00",
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

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const addMinutes = (hhmm: string, mins: number) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${pad(nh)}:${pad(nm)}`;
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function dayLabel(iso: string, todayIso: string) {
  if (iso === todayIso) return "Today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (iso === toIso(tomorrow)) return "Tomorrow";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function MemberBookScreen() {
  const router = useRouter();
  const { profile } = useMemberProfile();
  const { isSigningOut, logout } = useLogout();

  const all = useBookingsStore((s) => s.bookings);
  const createBooking = useBookingsStore((s) => s.createBooking);

  const todayIso = useMemo(() => toIso(new Date()), []);

  const [trainerId, setTrainerId] = useState<string>(TRAINERS[0].id);
  const [date, setDate] = useState<string>(todayIso);
  const [start, setStart] = useState<string>("09:00");
  const [duration, setDuration] = useState<Duration>(60);
  const [focus, setFocus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "Member";

  const trainer = TRAINERS.find((t) => t.id === trainerId)!;

  const dateChips = useMemo(() => {
    const out: { iso: string; label: string; dayNum: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      out.push({
        iso: toIso(d),
        label: dayLabel(toIso(d), todayIso),
        dayNum: d.getDate(),
      });
    }
    return out;
  }, [todayIso]);

  const takenRanges = useMemo(() => {
    return all
      .filter(
        (b) =>
          b.trainerId === trainerId &&
          b.date === date &&
          b.status !== "cancelled" &&
          b.status !== "no-show",
      )
      .map((b) => ({
        start: toMinutes(b.start),
        end: toMinutes(b.end),
      }));
  }, [all, trainerId, date]);

  const isSlotAvailable = (slot: string) => {
    const slotStart = toMinutes(slot);
    const slotEnd = slotStart + duration;
    if (date === todayIso) {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (slotStart <= nowMin + 15) return false;
    }
    return !takenRanges.some((r) => slotStart < r.end && slotEnd > r.start);
  };

  const canSubmit = isSlotAvailable(start) && !submitting;

  const handleConfirm = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    createBooking({
      memberId: "M-101",
      memberName: name,
      trainerId,
      trainerName: trainer.name,
      focus: focus.trim() || trainer.specialty,
      location: "Floor 1",
      date,
      start,
      end: addMinutes(start, duration),
      notes: notes.trim() || undefined,
    });

    setSubmitting(false);
    router.replace(R.bookings as any);
  };

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
          activeRoute={R.book}
          notifications={[]}
          setNotifications={() => {}}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ─────────────────────────── */}
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>NEW BOOKING</Text>
            <Text style={styles.h1}>Book a session</Text>
            <Text style={styles.sub}>
              Pick a trainer, choose a time, and send your request.
            </Text>
          </View>

          {/* ── Trainer picker ───────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PICK A TRAINER</Text>
            <View style={styles.trainerList}>
              {TRAINERS.map((t) => {
                const selected = t.id === trainerId;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setTrainerId(t.id);
                    }}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.trainerCard,
                      selected && styles.trainerCardActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.trainerAvatar,
                        selected && styles.trainerAvatarActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.trainerAvatarText,
                          selected && { color: KFitColors.onAccent },
                        ]}
                      >
                        {t.initials}
                      </Text>
                    </View>
                    <View style={styles.flex}>
                      <Text
                        style={[
                          styles.trainerName,
                          selected && { color: KFitColors.accent },
                        ]}
                        numberOfLines={1}
                      >
                        {t.name}
                      </Text>
                      <Text style={styles.trainerSpecialty} numberOfLines={1}>
                        {t.specialty}
                      </Text>
                      <View style={styles.trainerMetaRow}>
                        <Feather name="star" size={9} color="#F59E0B" />
                        <Text style={styles.trainerRating}>
                          {t.rating.toFixed(1)}
                        </Text>
                        <Text style={styles.trainerReviews}>· {t.reviews}</Text>
                      </View>
                    </View>
                    {selected && (
                      <View style={styles.checkBadge}>
                        <Feather
                          name="check"
                          size={11}
                          color={KFitColors.onAccent}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Date picker ──────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PICK A DATE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateChipsRow}
            >
              {dateChips.map((d) => {
                const selected = d.iso === date;
                return (
                  <TouchableOpacity
                    key={d.iso}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setDate(d.iso);
                    }}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.dateChip, selected && styles.dateChipActive]}
                  >
                    <Text
                      style={[
                        styles.dateChipLabel,
                        selected && styles.dateChipLabelActive,
                      ]}
                    >
                      {d.label}
                    </Text>
                    <Text
                      style={[
                        styles.dateChipNum,
                        selected && styles.dateChipNumActive,
                      ]}
                    >
                      {d.dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Duration ─────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DURATION</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map((d) => {
                const selected = d === duration;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setDuration(d);
                    }}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.durationBtn,
                      selected && styles.durationBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        selected && styles.durationTextActive,
                      ]}
                    >
                      {d} min
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Time slots ───────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>START TIME</Text>
              <Text style={styles.sectionHint}>
                {to12h(start)} – {to12h(addMinutes(start, duration))}
              </Text>
            </View>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((slot) => {
                const available = isSlotAvailable(slot);
                const selected = slot === start;
                return (
                  <TouchableOpacity
                    key={slot}
                    disabled={!available}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setStart(slot);
                    }}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected,
                      disabled: !available,
                    }}
                    style={[
                      styles.timeChip,
                      selected && styles.timeChipActive,
                      !available && styles.timeChipDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        selected && styles.timeChipTextActive,
                        !available && styles.timeChipTextDisabled,
                      ]}
                    >
                      {to12h(slot)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Focus ────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SESSION FOCUS</Text>
            <TextInput
              style={styles.input}
              value={focus}
              onChangeText={setFocus}
              placeholder={trainer.specialty}
              placeholderTextColor={KFitColors.mutedText}
              accessibilityLabel="Session focus"
            />
          </View>

          {/* ── Notes ────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTES (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything your trainer should know beforehand…"
              placeholderTextColor={KFitColors.mutedText}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Notes"
            />
          </View>

          {/* ── Summary + Confirm ────────────── */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryHeaderLabel}>SUMMARY</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Trainer</Text>
              <Text style={styles.summaryValue}>{trainer.name}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>
                {dayLabel(date, todayIso)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>
                {to12h(start)} – {to12h(addMinutes(start, duration))}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{duration} min</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                !canSubmit && styles.confirmBtnDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!canSubmit}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Confirm booking"
            >
              <Feather
                name="check"
                size={15}
                color={canSubmit ? KFitColors.onAccent : KFitColors.mutedText}
              />
              <Text
                style={[
                  styles.confirmBtnText,
                  !canSubmit && { color: KFitColors.mutedText },
                ]}
              >
                {submitting ? "Sending request…" : "Confirm booking"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.summaryFootnote}>
              Your trainer will confirm the request. You can cancel any time up
              to 4 hours before the session.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerLabel}>KFIT MEMBER WORKSPACE</Text>
          </View>
        </ScrollView>

        <MemberBottomNav activeRoute={R.book} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  main: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1 },
  container: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 140,
    gap: 16,
  },
  flex: { flex: 1, minWidth: 0 },

  hero: { gap: 2, marginTop: 2 },
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
  sub: {
    color: KFitColors.mutedText,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 20,
  },

  section: { gap: 8 },
  sectionLabel: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHint: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "monospace",
  },

  trainerList: { gap: 8 },
  trainerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  trainerCardActive: {
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.accent + "10",
  },
  trainerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  trainerAvatarActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  trainerAvatarText: {
    color: KFitColors.accent,
    fontSize: 13,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  trainerName: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  trainerSpecialty: {
    color: KFitColors.mutedText,
    fontSize: 11,
    marginTop: 2,
  },
  trainerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  trainerRating: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  trainerReviews: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent,
  },

  dateChipsRow: { flexDirection: "row", gap: 6, paddingVertical: 2 },
  dateChip: {
    minWidth: 64,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    gap: 2,
  },
  dateChipActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  dateChipLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontWeight: "800",
    fontFamily: "monospace",
    letterSpacing: 0.6,
  },
  dateChipLabelActive: { color: KFitColors.onAccent },
  dateChipNum: {
    color: KFitColors.text,
    fontSize: 15,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  dateChipNumActive: { color: KFitColors.onAccent },

  durationRow: { flexDirection: "row", gap: 6 },
  durationBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  durationBtnActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  durationText: {
    color: KFitColors.mutedText,
    fontSize: 12,
    fontWeight: "800",
  },
  durationTextActive: { color: KFitColors.onAccent },

  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  timeChip: {
    width: "31%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  timeChipActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  timeChipDisabled: {
    backgroundColor: KFitColors.background,
    borderColor: KFitColors.border,
    opacity: 0.4,
  },
  timeChipText: {
    color: KFitColors.text,
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  timeChipTextActive: { color: KFitColors.onAccent },
  timeChipTextDisabled: { color: KFitColors.mutedText },

  input: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: KFitColors.text,
    fontSize: 13,
  },
  inputMultiline: { minHeight: 80 },

  /* Summary + Confirm */
  summaryCard: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 0,
    marginTop: 4,
  },
  summaryHeader: {
    paddingBottom: 10,
  },
  summaryHeaderLabel: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: KFitColors.border,
  },
  summaryLabel: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontFamily: "monospace",
    letterSpacing: 0.6,
  },
  summaryValue: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "monospace",
  },

  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
    marginTop: 12,
  },
  confirmBtnDisabled: {
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  confirmBtnText: {
    color: KFitColors.onAccent,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  summaryFootnote: {
    color: KFitColors.mutedText,
    fontSize: 10,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 15,
    fontFamily: "monospace",
    opacity: 0.8,
  },

  footer: { alignItems: "center", paddingVertical: 12 },
  footerLabel: {
    color: KFitColors.mutedText,
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    opacity: 0.7,
  },
});
