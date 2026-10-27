import {
  ChallengeFormModal,
  Leaderboard,
  ProgressBar,
} from "@/components/ChallengeParts";
import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import {
  dismissSuggestion,
  publishChallenge,
  publishSuggestion,
  removeChallenge,
  timeAgo,
  timeLeft,
  useChallengeStore,
} from "@/lib/challenges-store";
import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChallengesScreen() {
  const { challenges, suggestions } = useChallengeStore();
  const [modalOpen, setModalOpen] = useState(false);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      active: challenges.filter((c) => c.endsAt > now).length,
      participants: challenges.reduce((sum, c) => sum + c.participants, 0),
      xp: challenges.reduce((sum, c) => sum + c.points, 0),
    };
  }, [challenges]);

  const confirmRemove = (id: string, title: string) =>
    Alert.alert(
      "End challenge?",
      `"${title}" will be removed for all trainers and members.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End challenge",
          style: "destructive",
          onPress: () => removeChallenge(id, "admin"),
        },
      ],
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/challenges" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Header */}
          <View style={styles.pageHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>COMMUNITY MOTIVATION</Text>
              <Text style={styles.pageTitle}>Challenges & Races</Text>
              <Text style={styles.pageSub}>
                Only admins publish challenges. Trainers and members are
                notified instantly.
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => setModalOpen(true)}
            style={({ pressed }) => [
              styles.createBtn,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create challenge"
          >
            <Feather name="plus" size={16} color={KFitColors.onAccent} />
            <Text style={styles.createBtnText}>Create challenge</Text>
          </Pressable>

          {/* Stats */}
          <View style={styles.statsRow}>
            <Stat label="Active" value={String(stats.active)} />
            <Stat label="Participants" value={String(stats.participants)} />
            <Stat label="XP pool" value={stats.xp.toLocaleString()} />
          </View>

          {/* Trainer suggestions */}
          {suggestions.length > 0 ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="inbox" size={16} color={KFitColors.accent} />
                <Text style={styles.cardTitle}>
                  Trainer suggestions ({suggestions.length})
                </Text>
              </View>
              <View style={{ gap: 10 }}>
                {suggestions.map((sg) => (
                  <View key={sg.id} style={styles.item}>
                    <Text style={styles.itemTitle}>{sg.title}</Text>
                    <Text style={styles.muted}>{sg.target}</Text>
                    <Text style={styles.mutedSmall}>
                      From {sg.by} · {timeAgo(sg.createdAt)} · +{sg.points} XP ·{" "}
                      {sg.days} days
                    </Text>
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={() => dismissSuggestion(sg.id, "admin")}
                        style={({ pressed }) => [
                          styles.ghostBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.ghostBtnText}>Dismiss</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => publishSuggestion(sg.id, "admin")}
                        style={({ pressed }) => [
                          styles.smallGold,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.smallGoldText}>Publish</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Challenges */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="flag" size={16} color={KFitColors.accent} />
              <Text style={styles.cardTitle}>All challenges</Text>
            </View>

            {challenges.length === 0 ? (
              <Text style={styles.empty}>
                No challenges yet. Create the first one.
              </Text>
            ) : (
              <View style={{ gap: 12 }}>
                {challenges.map((c) => {
                  const ended = c.endsAt <= Date.now();
                  return (
                    <View key={c.id} style={styles.item}>
                      <View style={styles.rowBetween}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>{c.title}</Text>
                          <Text style={styles.muted}>{c.target}</Text>
                        </View>
                        <View style={styles.xpPill}>
                          <Text style={styles.xpPillText}>+{c.points} XP</Text>
                        </View>
                      </View>

                      <View style={styles.rowBetween}>
                        <Text style={styles.mutedSmall}>
                          Avg. completion {c.avgProgress}%
                        </Text>
                        <Text
                          style={[
                            styles.mutedSmall,
                            ended && { color: KFitColors.error },
                          ]}
                        >
                          {timeLeft(c.endsAt)}
                        </Text>
                      </View>
                      <ProgressBar value={c.avgProgress} />

                      <View style={styles.rowBetween}>
                        <View style={styles.inline}>
                          <Feather
                            name="users"
                            size={13}
                            color={KFitColors.mutedText}
                          />
                          <Text style={styles.mutedSmall}>
                            {c.participants} joined
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => confirmRemove(c.id, c.title)}
                          hitSlop={8}
                          style={({ pressed }) => [
                            styles.inline,
                            pressed && styles.pressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`End ${c.title}`}
                        >
                          <Feather
                            name="trash-2"
                            size={13}
                            color={KFitColors.error}
                          />
                          <Text style={styles.endText}>End challenge</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Leaderboard */}
          <View style={styles.card}>
            <View
              style={[styles.cardHeader, { justifyContent: "space-between" }]}
            >
              <View style={styles.inline}>
                <Feather name="award" size={16} color={KFitColors.accent} />
                <Text style={styles.cardTitle}>Live member leaderboard</Text>
              </View>
              <Text style={styles.cycle}>MONTHLY</Text>
            </View>
            <Leaderboard />
          </View>
        </ScrollView>
      </View>

      <ChallengeFormModal
        visible={modalOpen}
        heading="Create challenge"
        note="Trainers and members will be notified as soon as you publish."
        submitLabel="Publish challenge"
        onClose={() => setModalOpen(false)}
        onSubmit={(value) => publishChallenge(value, "admin")}
      />
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, flexDirection: "row" },
  content: { flex: 1, backgroundColor: KFitColors.background },
  contentContainer: { padding: 16, gap: 14, paddingBottom: 128 },
  pressed: { opacity: 0.65 },

  pageHeader: { flexDirection: "row", alignItems: "center" },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  pageTitle: {
    color: KFitColors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  pageSub: {
    color: KFitColors.mutedText,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
  },
  createBtnText: {
    color: KFitColors.onAccent,
    fontSize: 14,
    fontWeight: "800",
  },

  statsRow: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    padding: 12,
  },
  statValue: { color: KFitColors.text, fontSize: 20, fontWeight: "900" },
  statLabel: { color: KFitColors.mutedText, fontSize: 11, marginTop: 2 },

  card: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { color: KFitColors.text, fontSize: 15, fontWeight: "800" },
  cycle: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  empty: {
    color: KFitColors.mutedText,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 20,
  },

  item: {
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  itemTitle: { color: KFitColors.text, fontSize: 14, fontWeight: "700" },
  muted: { color: KFitColors.mutedText, fontSize: 12 },
  mutedSmall: { color: KFitColors.mutedText, fontSize: 11, fontWeight: "600" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  inline: { flexDirection: "row", alignItems: "center", gap: 6 },

  xpPill: {
    backgroundColor: KFitColors.accent + "1A",
    borderColor: KFitColors.accent + "4D",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  xpPillText: { color: KFitColors.accent, fontSize: 11, fontWeight: "800" },
  endText: { color: KFitColors.error, fontSize: 12, fontWeight: "700" },

  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 2,
  },
  ghostBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  ghostBtnText: {
    color: KFitColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  smallGold: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  smallGoldText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "800",
  },
});
