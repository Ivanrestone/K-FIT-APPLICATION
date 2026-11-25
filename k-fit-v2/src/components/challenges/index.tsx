import { MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  Challenge,
  ChallengeLeaderboardEntry,
  ChallengeType,
} from "@/lib/challenges";
import { Theme } from "@/components/admin/theme";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export function ChallengeTypeBadge({ type }: { type: ChallengeType }) {
  return (
    <View style={styles.typeBadge}>
      <Text style={styles.typeText}>
        {type === "individual" ? "INDIVIDUAL" : "COMPETITIVE"}
      </Text>
    </View>
  );
}

export function ChallengeStatusBadge({ status }: { status: string }) {
  const label = status.replaceAll("_", " ");
  const color =
    status === "active" || status === "published" || status === "completed"
      ? Theme.success
      : status === "paused" || status === "upcoming" || status === "draft"
        ? Theme.warning
        : Theme.textMuted;

  return (
    <View style={[styles.statusBadge, { borderColor: `${color}66` }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function ChallengeProgress({
  visits,
  target,
}: {
  visits: number;
  target: number;
}) {
  const percent =
    target > 0 ? Math.min(100, Math.round((visits / target) * 100)) : 0;
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressLabels}>
        <Text style={styles.mutedText}>
          {visits} / {target} eligible visits
        </Text>
        <Text style={styles.progressPercent}>{percent}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

export function ChallengeRewardCard({
  amount,
  label = "Reward",
}: {
  amount: number;
  label?: string;
}) {
  return (
    <View style={styles.rewardCard}>
      <MaterialCommunityIcons name="trophy-outline" size={18} color={Theme.accent} />
      <View>
        <Text style={styles.rewardAmount}>{amount.toLocaleString()} KP</Text>
        <Text style={styles.mutedText}>{label}</Text>
      </View>
    </View>
  );
}

export function ChallengeCard({
  challenge,
  participantCount = 0,
  status,
  visits,
  joined,
  onPress,
  action,
}: {
  challenge: Challenge;
  participantCount?: number;
  status: string;
  visits?: number;
  joined?: boolean;
  onPress?: () => void;
  action?: React.ReactNode;
}) {
  const dateRange = [
    challenge.start_at
      ? new Date(challenge.start_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : null,
    challenge.end_at
      ? new Date(challenge.end_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null,
  ]
    .filter(Boolean)
    .join(" – ");

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress && styles.pressed]}
    >
      {challenge.image_url ? (
        <Image source={{ uri: challenge.image_url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <MaterialCommunityIcons
            name="trophy-variant-outline"
            size={24}
            color={Theme.accent}
          />
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.badgeRow}>
          <ChallengeTypeBadge type={challenge.challenge_type} />
          <ChallengeStatusBadge status={status} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {challenge.title}
        </Text>
        <Text style={styles.mutedText} numberOfLines={2}>
          {challenge.description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {challenge.target_visits} visits · {participantCount} joined
          </Text>
          {!!dateRange && <Text style={styles.metaText}>{dateRange}</Text>}
        </View>
        {typeof visits === "number" && (
          <ChallengeProgress
            visits={visits}
            target={challenge.target_visits}
          />
        )}
        {challenge.challenge_type === "individual" ? (
          <ChallengeRewardCard
            amount={challenge.completion_reward_kp}
            label={joined ? "Completion reward" : "Reward"}
          />
        ) : (
          <View style={styles.rewardCard}>
            <MaterialCommunityIcons
              name="medal-outline"
              size={18}
              color={Theme.accent}
            />
            <Text style={styles.mutedText}>Placement rewards configured</Text>
          </View>
        )}
        {action && <View style={styles.actionWrap}>{action}</View>}
      </View>
    </Pressable>
  );
}

export function ChallengeLeaderboard({
  entries,
  currentMemberId,
}: {
  entries: ChallengeLeaderboardEntry[];
  currentMemberId?: string;
}) {
  if (entries.length === 0) {
    return <EmptyChallenges message="No participants have joined yet." />;
  }
  return (
    <View style={styles.listCard}>
      {entries.map((entry, index) => {
        const isCurrent = entry.member_id === currentMemberId;
        const name =
          [entry.first_name, entry.last_name].filter(Boolean).join(" ") ||
          "Member";
        return (
          <View
            key={entry.participant_id}
            style={[styles.participantRow, isCurrent && styles.currentRow]}
          >
            <Text style={styles.rank}>#{entry.final_rank || index + 1}</Text>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>
                {name}
                {isCurrent ? " · You" : ""}
              </Text>
              <Text style={styles.mutedText}>
                {entry.total_visits} visits · {Math.round(entry.progress_percentage)}%
              </Text>
            </View>
            {entry.completion_status === "completed" && (
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color={Theme.success}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

export function ChallengeFilters({
  values,
  selected,
  onSelect,
}: {
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.filters}>
      {values.map((value) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          onPress={() => onSelect(value)}
          style={[styles.filter, selected === value && styles.filterSelected]}
        >
          <Text
            style={[
              styles.filterText,
              selected === value && styles.filterTextSelected,
            ]}
          >
            {value}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function EmptyChallenges({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <MaterialCommunityIcons
        name="trophy-outline"
        size={30}
        color={Theme.textMuted}
      />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: Theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 12,
  },
  pressed: { opacity: 0.88 },
  image: { width: 82, minHeight: 140, backgroundColor: Theme.surfaceHigh },
  imagePlaceholder: {
    width: 82,
    minHeight: 140,
    backgroundColor: Theme.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: { flex: 1, padding: 12, gap: 8 },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  typeBadge: {
    backgroundColor: Theme.borderAccent,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  typeText: { color: Theme.accent, fontSize: 8, fontWeight: "900" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 8, fontWeight: "800" },
  cardTitle: { color: Theme.text, fontSize: 15, fontWeight: "800" },
  mutedText: { color: Theme.textMuted, fontSize: 11, lineHeight: 16 },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
  },
  metaText: { color: Theme.textMuted, fontSize: 9, fontWeight: "600" },
  progressWrap: { gap: 5, marginTop: 2 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressPercent: { color: Theme.accent, fontSize: 10, fontWeight: "800" },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: Theme.surfaceHigh,
  },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: Theme.accent },
  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  rewardAmount: { color: Theme.accent, fontSize: 11, fontWeight: "800" },
  actionWrap: { marginTop: 3 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 },
  filter: {
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  filterSelected: { backgroundColor: Theme.accent, borderColor: Theme.accent },
  filterText: { color: Theme.textMuted, fontSize: 10, fontWeight: "700" },
  filterTextSelected: { color: Theme.accentText },
  listCard: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    paddingHorizontal: 12,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  currentRow: { backgroundColor: "rgba(255,215,0,0.06)" },
  rank: { width: 34, color: Theme.accent, fontWeight: "900", fontSize: 13 },
  participantInfo: { flex: 1 },
  participantName: { color: Theme.text, fontSize: 12, fontWeight: "700" },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 140,
    padding: 18,
    backgroundColor: Theme.surface,
    borderColor: Theme.border,
    borderWidth: 1,
    borderRadius: 16,
  },
  emptyText: { textAlign: "center", color: Theme.textMuted, fontSize: 12 },
});
