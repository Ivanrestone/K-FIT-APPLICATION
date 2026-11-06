import TrainerScreenShell from "@/components/TrainerScreenShell";
import { KFitColors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Client = {
  id: string;
  name: string;
  plan: string;
  status: "Active" | "Expired";
  visits: number;
  next: string;
};

const CLIENTS: Client[] = [
  {
    id: "KF-8801",
    name: "Alex Mercer",
    plan: "VIP Cyber Elite",
    status: "Active",
    visits: 42,
    next: "Today 4:30 PM",
  },
  {
    id: "KF-8802",
    name: "Sarah Jenkins",
    plan: "Monthly Standard",
    status: "Active",
    visits: 18,
    next: "Today 11:00 AM",
  },
  {
    id: "KF-8803",
    name: "Devon Miles",
    plan: "VIP Cyber Elite",
    status: "Active",
    visits: 89,
    next: "Today 2:00 PM",
  },
  {
    id: "KF-8804",
    name: "Kira Nerys",
    plan: "Day Pass",
    status: "Expired",
    visits: 4,
    next: "None booked",
  },
  {
    id: "KF-8805",
    name: "Priya Patel",
    plan: "Monthly Standard",
    status: "Active",
    visits: 27,
    next: "Tomorrow 9:00 AM",
  },
  {
    id: "KF-8806",
    name: "Liam Brooks",
    plan: "VIP Cyber Elite",
    status: "Active",
    visits: 61,
    next: "Tomorrow 1:00 PM",
  },
];

const FILTERS = ["All", "Active", "Expired", "Has session"] as const;
type Filter = (typeof FILTERS)[number];

function isToday(next: string) {
  return next.startsWith("Today");
}

function isScheduled(next: string) {
  return next !== "None booked";
}

export default function TrainerRosterScreen() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return CLIENTS.filter((c) => {
      const matchesQuery =
        q.length === 0 ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q);
      const matchesFilter =
        filter === "All" ||
        (filter === "Active" && c.status === "Active") ||
        (filter === "Expired" && c.status === "Expired") ||
        (filter === "Has session" && isScheduled(c.next));
      return matchesQuery && matchesFilter;
    });
  }, [q, filter]);

  const stats = useMemo(() => {
    const active = CLIENTS.filter((c) => c.status === "Active").length;
    const expired = CLIENTS.filter((c) => c.status === "Expired").length;
    const scheduled = CLIENTS.filter((c) => isScheduled(c.next)).length;
    return { total: CLIENTS.length, active, expired, scheduled };
  }, []);

  const countFor = (f: Filter) =>
    f === "All"
      ? CLIENTS.length
      : f === "Active"
        ? stats.active
        : f === "Expired"
          ? stats.expired
          : stats.scheduled;

  return (
    <TrainerScreenShell
      eyebrow="MEMBER DATABASE"
      title="Roster"
      activeRoute="/trainer-roster"
    >
      {/* ── Stat strip ──────────────────────── */}
      <View style={styles.statCard}>
        <StatInline
          icon="users"
          label="Total"
          value={stats.total}
          tone={KFitColors.text}
        />
        <View style={styles.statDivider} />
        <StatInline
          icon="check-circle"
          label="Active"
          value={stats.active}
          tone={KFitColors.accent}
        />
        <View style={styles.statDivider} />
        <StatInline
          icon="x-circle"
          label="Expired"
          value={stats.expired}
          tone={KFitColors.error}
        />
        <View style={styles.statDivider} />
        <StatInline
          icon="calendar"
          label="Scheduled"
          value={stats.scheduled}
          tone="#F59E0B"
        />
      </View>

      {/* ── Search ──────────────────────────── */}
      <View style={styles.search}>
        <Feather name="search" size={14} color={KFitColors.mutedText} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or member ID"
          placeholderTextColor={KFitColors.mutedText}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search members"
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

      {/* ── Filter chips ────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {FILTERS.map((f) => {
          const selected = f === filter;
          const count = countFor(f);
          return (
            <TouchableOpacity
              key={f}
              onPress={() => {
                void Haptics.selectionAsync();
                setFilter(f);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${f}, ${count} members`}
              style={[styles.chip, selected && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, selected && styles.chipTextActive]}
              >
                {f}
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

      {/* ── Member list ─────────────────────── */}
      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Feather name="users" size={20} color={KFitColors.accent} />
          </View>
          <Text style={styles.emptyTitle}>
            {query ? "No matches" : "No members here"}
          </Text>
          <Text style={styles.emptyText}>
            {query
              ? `No members match "${query}" in this filter. Try a different search.`
              : "Switch to a different filter to see more members."}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map((c) => {
            const active = c.status === "Active";
            const tone = active ? KFitColors.accent : KFitColors.error;
            const today = isToday(c.next);
            const scheduled = isScheduled(c.next);
            const memberNum = c.id.split("-")[1];

            return (
              <TouchableOpacity
                key={c.id}
                style={styles.row}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`${c.name}, ${c.plan}, ${c.status}, ${c.visits} visits, next session ${c.next}`}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{memberNum}</Text>
                </View>

                <View style={styles.flex}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={styles.memberId}>#{memberNum}</Text>
                  </View>
                  <Text style={styles.meta} numberOfLines={1}>
                    {c.plan} · {c.visits} visits
                  </Text>
                  <View style={styles.nextRow}>
                    <Feather
                      name={scheduled ? "clock" : "minus"}
                      size={9}
                      color={
                        scheduled ? KFitColors.mutedText : KFitColors.mutedText
                      }
                    />
                    <Text
                      style={[
                        styles.next,
                        today && styles.nextToday,
                        !scheduled && styles.nextNone,
                      ]}
                      numberOfLines={1}
                    >
                      {scheduled ? `Next: ${c.next}` : "No session booked"}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: tone + "1A",
                      borderColor: tone + "44",
                    },
                  ]}
                >
                  <View style={[styles.badgeDot, { backgroundColor: tone }]} />
                  <Text style={[styles.badgeText, { color: tone }]}>
                    {c.status.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
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
        <Text style={[styles.statInlineValue, { color: tone }]}>{value}</Text>
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
    gap: 3,
  },
  statInlineValue: {
    fontSize: 15,
    fontWeight: "900",
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

  /* Search */
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: KFitColors.text,
    fontSize: 12,
    paddingVertical: 0,
    minHeight: 20,
  },

  /* Filter chips */
  chipRow: { flexDirection: "row", gap: 6, paddingVertical: 2 },
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
  chipCountTextActive: { color: KFitColors.onAccent },

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

  /* Row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    padding: 12,
  },
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
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  memberId: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontFamily: "monospace",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    overflow: "hidden",
  },
  meta: { color: KFitColors.mutedText, fontSize: 11, marginTop: 2 },
  nextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  next: {
    color: KFitColors.accent,
    fontSize: 10,
    fontFamily: "monospace",
  },
  nextToday: {
    color: KFitColors.accent,
    fontWeight: "900",
  },
  nextNone: {
    color: KFitColors.mutedText,
    fontWeight: "600",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: {
    fontSize: 9,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },
});
