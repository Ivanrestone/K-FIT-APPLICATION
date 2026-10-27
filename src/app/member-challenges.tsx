import { Leaderboard, ProgressBar } from "@/components/ChallengeParts";
import MemberBottomNav from "@/components/MemberBottomNav";
import { KFitColors } from "@/constants/theme";
import {
    markChallengesSeen,
    timeLeft,
    toggleJoin,
    useChallengeStore,
} from "@/lib/challenges-store";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NAV_CLEARANCE = 140;

export default function MemberChallengesScreen() {
  const { challenges, member } = useChallengeStore();

  // Clear the "new" badge once the member has opened this screen.
  useEffect(() => {
    markChallengesSeen("member");
  }, [challenges.length]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            gap: 14,
            paddingBottom: NAV_CLEARANCE,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Text style={styles.eyebrow}>COMMUNITY MOTIVATION</Text>
            <Text style={styles.title}>Challenges & Races</Text>
            <Text style={styles.sub}>
              Join a challenge, hit the target and earn XP.
            </Text>
          </View>

          {challenges.length === 0 ? (
            <Text style={styles.empty}>
              No active challenges right now. Check back soon.
            </Text>
          ) : (
            challenges.map((c) => {
              const entry = member[c.id] ?? { joined: false, progress: 0 };
              const ended = c.endsAt <= Date.now();
              return (
                <View
                  key={c.id}
                  style={[styles.card, entry.joined && styles.cardJoined]}
                >
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{c.title}</Text>
                      <Text style={styles.muted}>{c.target}</Text>
                    </View>
                    <View style={styles.xpPill}>
                      <Text style={styles.xpText}>+{c.points} XP</Text>
                    </View>
                  </View>

                  {entry.joined ? (
                    <View style={{ gap: 6 }}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.mutedSmall}>
                          Your progress: {entry.progress}%
                        </Text>
                        <Text style={styles.mutedSmall}>
                          {timeLeft(c.endsAt)}
                        </Text>
                      </View>
                      <ProgressBar value={entry.progress} />
                    </View>
                  ) : (
                    <Text style={styles.mutedSmall}>
                      {timeLeft(c.endsAt)} · {c.participants} joined
                    </Text>
                  )}

                  <Pressable
                    disabled={ended}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      toggleJoin(c.id);
                    }}
                    style={({ pressed }) => [
                      styles.joinBtn,
                      entry.joined ? styles.joinOn : styles.joinOff,
                      ended && { opacity: 0.4 },
                      pressed && { opacity: 0.7 },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: entry.joined,
                      disabled: ended,
                    }}
                  >
                    <Feather
                      name={entry.joined ? "check" : "plus"}
                      size={14}
                      color={
                        entry.joined ? KFitColors.onAccent : KFitColors.accent
                      }
                    />
                    <Text
                      style={[
                        styles.joinText,
                        {
                          color: entry.joined
                            ? KFitColors.onAccent
                            : KFitColors.accent,
                        },
                      ]}
                    >
                      {ended
                        ? "Ended"
                        : entry.joined
                          ? "Joined"
                          : "Join challenge"}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          )}

          <View style={styles.card}>
            <View style={styles.inline}>
              <Feather name="award" size={16} color={KFitColors.accent} />
              <Text style={styles.cardTitle}>Leaderboard</Text>
            </View>
            <Leaderboard />
          </View>
        </ScrollView>

        <MemberBottomNav activeRoute="/member-challenges" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  main: { flex: 1, backgroundColor: KFitColors.background },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: {
    color: KFitColors.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },
  sub: { color: KFitColors.mutedText, fontSize: 13, marginTop: 4 },
  empty: {
    color: KFitColors.mutedText,
    textAlign: "center",
    paddingVertical: 24,
    fontSize: 14,
  },
  card: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  cardJoined: { borderColor: KFitColors.accent + "66" },
  cardTitle: { color: KFitColors.text, fontSize: 15, fontWeight: "800" },
  muted: { color: KFitColors.mutedText, fontSize: 12, marginTop: 2 },
  mutedSmall: { color: KFitColors.mutedText, fontSize: 11, fontWeight: "600" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },
  xpPill: {
    backgroundColor: KFitColors.accent + "1A",
    borderColor: KFitColors.accent + "4D",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  xpText: { color: KFitColors.accent, fontSize: 11, fontWeight: "800" },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 42,
    borderRadius: 12,
  },
  joinOn: { backgroundColor: KFitColors.accent },
  joinOff: { borderWidth: 1, borderColor: KFitColors.accent },
  joinText: { fontSize: 13, fontWeight: "800" },
});
