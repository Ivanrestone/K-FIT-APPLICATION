import TrainerScreenShell from "@/components/TrainerScreenShell";
import { KFitColors } from "@/constants/theme";
import { useCoachTeam } from "@/hooks/use-coach-team";
import { initials } from "@/lib/coach";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type DutyStatus = "On Floor" | "In Session" | "On Break" | "Off Duty";

type Coach = {
  id: string;
  name: string;
  specialty: string;
  status: DutyStatus;
  rating: number;
  reviews: number;
  rate: string;
  bio: string;
  avatar: string;
};

const WARNING = "#F59E0B";
const PURPLE = "#8B5CF6";

type StoredDutyStatus = "on_floor" | "in_session" | "on_break" | "off_duty";

const DUTY_LABELS: Record<StoredDutyStatus, DutyStatus> = {
  on_floor: "On Floor",
  in_session: "In Session",
  on_break: "On Break",
  off_duty: "Off Duty",
};

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Strength", value: "Strength & Conditioning" },
  { label: "HIIT", value: "Functional HIIT" },
  { label: "Powerlifting", value: "Powerlifting" },
  { label: "Mobility", value: "Mobility & Rehab" },
];

function tone(status: DutyStatus) {
  if (status === "On Floor") return KFitColors.accent;
  if (status === "In Session") return PURPLE;
  if (status === "On Break") return WARNING;
  return KFitColors.mutedText;
}

export default function TrainerTeamScreen() {
  const [filter, setFilter] = useState("all");
  const { coaches, isLoading, error } = useCoachTeam();

  const coachList = useMemo<Coach[]>(() =>
    coaches.map((coach) => ({
      id: coach.id,
      name: coach.name,
      specialty: coach.specialty || "General coaching",
      status: DUTY_LABELS[coach.dutyStatus],
      rating: 0,
      reviews: 0,
      rate:
        coach.hourlyRate > 0 ? `₱${coach.hourlyRate.toFixed(0)}/hr` : "—",
      bio: coach.bio || "No bio added yet.",
      avatar: initials(coach.name),
    })),
  [coaches]);

  const list = useMemo(
    () =>
      filter === "all"
        ? coachList
        : coachList.filter((c) => c.specialty === filter),
    [coachList, filter],
  );

  const stats = useMemo(() => {
    const onFloor = coachList.filter((c) => c.status === "On Floor").length;
    const inSession = coachList.filter((c) => c.status === "In Session").length;
    const onBreak = coachList.filter((c) => c.status === "On Break").length;
    return { onFloor, inSession, onBreak };
  }, [coachList]);

  const countFor = (value: string) =>
    value === "all"
      ? coachList.length
      : coachList.filter((c) => c.specialty === value).length;

  return (
    <TrainerScreenShell
      eyebrow="COACH DIRECTORY"
      title="Trainers"
      activeRoute="/trainer-team"
    >
      {/* ── Team status strip ─────────────────── */}
      <View style={styles.statCard}>
        <StatInline
          icon="check-circle"
          label="On floor"
          value={stats.onFloor}
          tone={KFitColors.accent}
        />
        <View style={styles.statDivider} />
        <StatInline
          icon="activity"
          label="In session"
          value={stats.inSession}
          tone={PURPLE}
        />
        <View style={styles.statDivider} />
        <StatInline
          icon="coffee"
          label="On break"
          value={stats.onBreak}
          tone={WARNING}
        />
        <View style={styles.statDivider} />
        <StatInline
          icon="users"
          label="Total"
          value={coachList.length}
          tone={KFitColors.text}
        />
      </View>

      {(isLoading || error) && (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyText, error && { color: KFitColors.error }]}>
            {error
              ? `Could not load the coach directory: ${error}`
              : "Loading coaches…"}
          </Text>
        </View>
      )}

      {/* ── Filter chips ──────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const selected = f.value === filter;
          const count = countFor(f.value);
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => {
                void Haptics.selectionAsync();
                setFilter(f.value);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${f.label}, ${count} coaches`}
              style={[styles.chip, selected && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, selected && styles.chipTextActive]}
              >
                {f.label}
              </Text>
              <View
                style={[styles.chipCount, selected && styles.chipCountActive]}
              >
                <Text
                  style={[
                    styles.chipCountText,
                    selected && styles.chipCountTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Coach list ────────────────────────── */}
      {list.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Feather name="user-x" size={20} color={KFitColors.accent} />
          </View>
          <Text style={styles.emptyTitle}>No coaches here</Text>
          <Text style={styles.emptyText}>
            No coaches specialize in this area yet. Try a different filter.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {list.map((c) => {
            const t = tone(c.status);
            return (
              <View key={c.id} style={styles.card}>
                {/* Top row */}
                <View style={styles.top}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{c.avatar}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.name} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={styles.specialty} numberOfLines={1}>
                      {c.specialty}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.pill,
                      { backgroundColor: t + "1A", borderColor: t + "44" },
                    ]}
                  >
                    <View style={[styles.pillDot, { backgroundColor: t }]} />
                    <Text style={[styles.pillText, { color: t }]}>
                      {c.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Bio */}
                <Text style={styles.bio} numberOfLines={2}>
                  {c.bio}
                </Text>

                {/* Footer: rating · reviews · rate */}
                <View style={styles.bottom}>
                  <View style={styles.ratingRow}>
                    <View style={styles.ratingIconWrap}>
                      <Feather name="star" size={11} color={WARNING} />
                    </View>
                    <Text style={styles.rating}>{c.rating.toFixed(1)}</Text>
                    <Text style={styles.reviews}>· {c.reviews} reviews</Text>
                  </View>
                  <View style={styles.ratePill}>
                    <Text style={styles.rate}>{c.rate}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </TrainerScreenShell>
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
  value: number;
  tone: string;
}) {
  return (
    <View style={styles.statInline}>
      <View style={styles.statInlineHeader}>
        <Feather name={icon} size={10} color={tone} />
        <Text style={styles.statInlineValue}>{value}</Text>
      </View>
      <Text style={styles.statInlineLabel}>{label}</Text>
    </View>
  );
}

/* ─────────── Styles ─────────── */
const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },

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
    paddingVertical: 10,
    gap: 2,
  },
  statInlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statInlineValue: {
    fontSize: 16,
    fontWeight: "900",
    color: KFitColors.text,
    fontFamily: "monospace",
    letterSpacing: -0.3,
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
    marginVertical: 8,
  },

  /* Filter chips */
  filterRow: { flexDirection: "row", gap: 6, paddingVertical: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  chipActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  chipText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontWeight: "700",
  },
  chipTextActive: { color: KFitColors.onAccent, fontWeight: "900" },
  chipCount: {
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
  chipCountActive: {
    backgroundColor: KFitColors.onAccent + "22",
    borderColor: KFitColors.onAccent + "44",
  },
  chipCountText: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  chipCountTextActive: {
    color: KFitColors.onAccent,
  },

  /* List */
  list: { gap: 10 },
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: KFitColors.text,
  },
  emptyText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },

  /* Card */
  card: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: KFitColors.accent,
    fontSize: 13,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },
  name: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  specialty: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillDot: { width: 5, height: 5, borderRadius: 3 },
  pillText: {
    fontSize: 9,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },
  bio: {
    color: KFitColors.mutedText,
    fontSize: 12,
    lineHeight: 17,
  },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  ratingIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WARNING + "14",
    borderWidth: 1,
    borderColor: WARNING + "44",
  },
  rating: {
    color: WARNING,
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  reviews: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
  },
  ratePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  rate: {
    color: KFitColors.text,
    fontSize: 11,
    fontWeight: "900",
    fontFamily: "monospace",
  },
});
