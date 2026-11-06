import {
  ChallengeFormModal,
  Leaderboard,
  ProgressBar,
} from "@/components/ChallengeParts";
import TrainerBottomNav from "@/components/TrainerBottomNav";
import TrainerHeader from "@/components/TrainerHeader";
import { KFitColors } from "@/constants/theme";
import {
  markChallengesSeen,
  suggestChallenge,
  timeLeft,
  useChallengeStore,
} from "@/lib/challenges-store";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NAV_CLEARANCE = 140;
const TRAINER_NAME = "Marcus Vance"; // Replace with the signed-in trainer.

export default function TrainerChallengesScreen() {
  const { challenges } = useChallengeStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [sent, setSent] = useState(false);

  // Clear the "new" badge when the trainer opens this screen.
  useFocusEffect(
    useCallback(() => {
      markChallengesSeen("trainer");
    }, []),
  );

  // Automatically hide the suggestion confirmation message.
  useEffect(() => {
    if (!sent) return;

    const timer = setTimeout(() => setSent(false), 3500);

    return () => clearTimeout(timer);
  }, [sent]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.main}>
        <TrainerHeader subtitle="CHALLENGES & RACES" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Text style={styles.eyebrow}>COMMUNITY MOTIVATION</Text>

            <Text style={styles.title}>Challenges & Races</Text>

            <Text style={styles.sub}>
              Published by the gym admin. Have an idea? Suggest one and the
              admin can publish it.
            </Text>
          </View>

          <Pressable
            onPress={() => setModalOpen(true)}
            style={({ pressed }) => [
              styles.suggestBtn,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Suggest a challenge to admin"
          >
            <Feather name="send" size={15} color={KFitColors.onAccent} />

            <Text style={styles.suggestText}>Suggest a challenge to admin</Text>
          </Pressable>

          {sent ? (
            <View style={styles.sentBanner}>
              <Feather
                name="check-circle"
                size={15}
                color={KFitColors.accent}
              />

              <Text style={styles.sentText}>
                Suggestion sent to the admin for review.
              </Text>
            </View>
          ) : null}

          {challenges.length === 0 ? (
            <Text style={styles.empty}>No active challenges right now.</Text>
          ) : (
            challenges.map((challenge) => (
              <View key={challenge.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.cardTitle}>{challenge.title}</Text>

                    <Text style={styles.muted}>{challenge.target}</Text>
                  </View>

                  <View style={styles.xpPill}>
                    <Text style={styles.xpText}>+{challenge.points} XP</Text>
                  </View>
                </View>

                <View style={styles.rowBetween}>
                  <Text style={styles.mutedSmall}>
                    Avg. completion {challenge.avgProgress}%
                  </Text>

                  <Text style={styles.mutedSmall}>
                    {timeLeft(challenge.endsAt)}
                  </Text>
                </View>

                <ProgressBar value={challenge.avgProgress} />

                <View style={styles.inline}>
                  <Feather
                    name="users"
                    size={13}
                    color={KFitColors.mutedText}
                  />

                  <Text style={styles.mutedSmall}>
                    {challenge.participants} members joined
                  </Text>
                </View>
              </View>
            ))
          )}

          <View style={styles.card}>
            <View style={styles.inline}>
              <Feather name="award" size={16} color={KFitColors.accent} />

              <Text style={styles.cardTitle}>Member leaderboard</Text>
            </View>

            <Leaderboard />
          </View>
        </ScrollView>

        <TrainerBottomNav activeRoute="/trainer-challenges" />
      </View>

      <ChallengeFormModal
        visible={modalOpen}
        heading="Suggest a challenge"
        note="The admin reviews every suggestion before it goes live."
        submitLabel="Send to admin"
        onClose={() => setModalOpen(false)}
        onSubmit={(value) => {
          suggestChallenge(value, TRAINER_NAME, "trainer");
          setModalOpen(false);
          setSent(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: KFitColors.background,
  },
  main: {
    flex: 1,
    backgroundColor: KFitColors.background,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: NAV_CLEARANCE,
  },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: {
    color: KFitColors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  sub: {
    color: KFitColors.mutedText,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  suggestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
  },
  suggestText: {
    color: KFitColors.onAccent,
    fontSize: 14,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.7,
  },
  sentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  sentText: {
    color: KFitColors.text,
    fontSize: 13,
    flex: 1,
  },
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
  challengeInfo: {
    flex: 1,
  },
  cardTitle: {
    color: KFitColors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  muted: {
    color: KFitColors.mutedText,
    fontSize: 12,
    marginTop: 2,
  },
  mutedSmall: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  xpPill: {
    backgroundColor: KFitColors.accent + "1A",
    borderColor: KFitColors.accent + "4D",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  xpText: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "800",
  },
});
