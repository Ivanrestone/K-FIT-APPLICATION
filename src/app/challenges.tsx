import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Challenge = {
  id: string;
  title: string;
  target: string;
  progress: number;
  points: number;
  joined: boolean;
};

type Leader = {
  rank: number;
  name: string;
  badge: string;
  points: number;
  pct: number;
};

const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: "C-1",
    title: "Summer Shred 30-Day Sprint",
    target: "20 Workouts Completed",
    progress: 85,
    points: 650,
    joined: true,
  },
  {
    id: "C-2",
    title: "100k Steps Weekly Race",
    target: "100,000 Cardio Steps",
    progress: 42,
    points: 400,
    joined: false,
  },
  {
    id: "C-3",
    title: "500kg Powerlifting Club",
    target: "Bench + Squat + Deadlift",
    progress: 95,
    points: 1000,
    joined: true,
  },
  {
    id: "C-4",
    title: "Early Bird Streak",
    target: "7 AM Check-ins (5 days)",
    progress: 60,
    points: 300,
    joined: false,
  },
];

const LEADERBOARD: Leader[] = [
  { rank: 1, name: "Alex Rivera", badge: "🥇", points: 2450, pct: 98 },
  { rank: 2, name: "Jessica Taylor", badge: "🥈", points: 2100, pct: 84 },
  { rank: 3, name: "Elena Rostova", badge: "🥉", points: 1890, pct: 75 },
  { rank: 4, name: "David Miller", badge: "4", points: 1420, pct: 56 },
];

export default function ChallengesScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [points, setPoints] = useState("");

  const toggleJoin = (id: string) =>
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, joined: !c.joined } : c)),
    );

  const saveChallenge = () => {
    setChallenges((prev) => [
      {
        id: `C-${Date.now()}`,
        title: title.trim() || "Sprint Challenge",
        target: target.trim() || "10 Workouts",
        progress: 0,
        points: parseInt(points, 10) || 250,
        joined: true,
      },
      ...prev,
    ]);
    setTitle("");
    setTarget("");
    setPoints("");
    setModalOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/challenges" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Challenges */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.eyebrow}>COMMUNITY MOTIVATION</Text>
                <Text style={styles.cardTitle}>Challenges & Races</Text>
              </View>
              <Pressable
                onPress={() => setModalOpen(true)}
                style={({ pressed }) => [
                  styles.addBtn,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Add challenge"
              >
                <Text style={styles.addBtnText}>+ Add Challenge</Text>
              </Pressable>
            </View>

            <View style={styles.gap12}>
              {challenges.map((c) => (
                <View key={c.id} style={styles.challengeCard}>
                  <View style={styles.rowBetween}>
                    <View style={styles.flex}>
                      <Text style={styles.challengeTitle}>{c.title}</Text>
                      <Text style={styles.muted}>{c.target}</Text>
                    </View>
                    <View style={styles.xpPill}>
                      <Text style={styles.xpPillText}>+{c.points} XP</Text>
                    </View>
                  </View>

                  <View style={styles.progressMeta}>
                    <Text style={styles.mutedSmall}>
                      Progress: {c.progress}%
                    </Text>
                    <Text style={styles.mutedSmall}>Target Achieved</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressFill, { width: `${c.progress}%` }]}
                    />
                  </View>

                  <View style={styles.joinRow}>
                    <Pressable
                      onPress={() => toggleJoin(c.id)}
                      style={({ pressed }) => [
                        styles.joinBtn,
                        c.joined ? styles.joinBtnOn : styles.joinBtnOff,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.joinBtnText,
                          {
                            color: c.joined
                              ? KFitColors.onAccent
                              : KFitColors.accent,
                          },
                        ]}
                      >
                        {c.joined ? "✓ Joined" : "+ Join Race"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Leaderboard */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.eyebrow}>XP POINTS RANKING</Text>
                <Text style={styles.cardTitleSm}>Live Member Leaderboard</Text>
              </View>
              <Text style={styles.cycle}>MONTHLY CYCLE</Text>
            </View>

            <View style={styles.gap8}>
              {LEADERBOARD.map((l) => (
                <View key={l.rank} style={styles.leaderRow}>
                  <View style={styles.leaderLeft}>
                    <View style={styles.badgeBox}>
                      <Text style={styles.badgeText}>{l.badge}</Text>
                    </View>
                    <View>
                      <Text style={styles.leaderName}>{l.name}</Text>
                      <Text style={styles.mutedSmall}>
                        {l.points} XP Earned
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.leaderPct}>{l.pct}% Completed</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* New challenge modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <Pressable
            style={styles.backdrop}
            onPress={() => setModalOpen(false)}
          >
            <Pressable
              style={styles.modalCard}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitleSm}>Create Challenge</Text>
                <Pressable onPress={() => setModalOpen(false)} hitSlop={10}>
                  <Text style={styles.muted}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.label}>TITLE</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. 50km Running Sprint"
                placeholderTextColor={KFitColors.mutedText}
                style={styles.input}
              />

              <Text style={styles.label}>TARGET & CATEGORY</Text>
              <TextInput
                value={target}
                onChangeText={setTarget}
                placeholder="e.g. 50 km distance"
                placeholderTextColor={KFitColors.mutedText}
                style={styles.input}
              />

              <Text style={styles.label}>REWARD XP POINTS</Text>
              <TextInput
                value={points}
                onChangeText={setPoints}
                placeholder="500"
                keyboardType="number-pad"
                placeholderTextColor={KFitColors.mutedText}
                style={styles.input}
              />

              <Pressable
                onPress={saveChallenge}
                style={({ pressed }) => [
                  styles.publishBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.publishBtnText}>Publish Challenge</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, flexDirection: "row" },
  content: { flex: 1, backgroundColor: KFitColors.background },
  contentContainer: { padding: 16, gap: 16, paddingBottom: 128 },
  flex: { flex: 1 },
  pressed: { opacity: 0.65 },

  card: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  cardTitle: { color: KFitColors.text, fontSize: 16, fontWeight: "800" },
  cardTitleSm: { color: KFitColors.text, fontSize: 13, fontWeight: "800" },
  cycle: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },

  addBtn: {
    backgroundColor: KFitColors.accent,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: { color: KFitColors.onAccent, fontSize: 10, fontWeight: "800" },

  gap12: { gap: 12 },
  gap8: { gap: 8 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },

  challengeCard: {
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  challengeTitle: { color: KFitColors.text, fontSize: 13, fontWeight: "700" },
  muted: { color: KFitColors.mutedText, fontSize: 11 },
  mutedSmall: { color: KFitColors.mutedText, fontSize: 9, fontWeight: "600" },

  xpPill: {
    backgroundColor: KFitColors.accent + "1A",
    borderColor: KFitColors.accent + "4D",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  xpPillText: { color: KFitColors.accent, fontSize: 10, fontWeight: "700" },

  progressMeta: { flexDirection: "row", justifyContent: "space-between" },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: KFitColors.surface,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: KFitColors.accent },

  joinRow: { alignItems: "flex-end", paddingTop: 2 },
  joinBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  joinBtnOn: { backgroundColor: KFitColors.accent },
  joinBtnOff: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  joinBtnText: { fontSize: 10, fontWeight: "700" },

  leaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    padding: 10,
  },
  leaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  badgeBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: KFitColors.accent, fontSize: 12, fontWeight: "700" },
  leaderName: { color: KFitColors.text, fontSize: 12, fontWeight: "700" },
  leaderPct: { color: KFitColors.accent, fontSize: 12, fontWeight: "800" },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  label: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
  },
  input: {
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    padding: 10,
    color: KFitColors.text,
    fontSize: 12,
  },
  publishBtn: {
    backgroundColor: KFitColors.accent,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 12,
  },
  publishBtnText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "800",
  },
});
