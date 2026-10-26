import MemberBottomNav from "@/components/MemberBottomNav";
import { KFitColors } from "@/constants/theme";
import { useLogout } from "@/hooks/use-logout";
import { useMemberProfile } from "@/hooks/use-member-profile";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Clears the floating nav (dock + raised QR button + safe area).
const NAV_CLEARANCE = 140;

type FeatherName = keyof typeof Feather.glyphMap;

// Replace with real data from your workout API when available.
const WORKOUT = {
  title: "Lower body strength",
  program: "Foundation Strength · Week 4 of 8",
  level: "STRENGTH · INTERMEDIATE",
  tagline: "Strong from the ground up.",
  minutes: 55,
  workingSets: 19,
  equipment: "Barbells · Dumbbells · Machines",
  coach: "Marcus Reed",
  coachNote:
    "Keep 2 reps in reserve. Controlled tempo and full range of motion come before load.",
  effort: "RPE 7-8",
  lastCompleted: "Oct 18 · 52 min",
  warmup:
    "Easy cycling for 3 minutes, then bodyweight squats, leg swings and dynamic hip mobility.",
  finish: "Finish with 5 minutes of easy walking and lower-body stretching.",
  exercises: [
    {
      name: "Barbell back squat",
      muscle: "Quads",
      tip: "Keep chest tall",
      sets: "4",
      reps: "9-10",
      rest: "90s",
      load: "70 kg",
    },
    {
      name: "Romanian deadlift",
      muscle: "Hamstrings",
      tip: "Hinge at the hips",
      sets: "3",
      reps: "10",
      rest: "75s",
      load: "60 kg",
    },
    {
      name: "Reverse lunge",
      muscle: "Glutes",
      tip: "Dumbbells each hand",
      sets: "3",
      reps: "10/side",
      rest: "60s",
      load: "12 kg",
    },
    {
      name: "Seated leg curl",
      muscle: "Hamstrings",
      sets: "3",
      reps: "12",
      rest: "60s",
      load: "30 kg",
    },
    {
      name: "Standing calf raise",
      muscle: "Calves",
      sets: "4",
      reps: "15",
      rest: "60s",
      load: "40 kg",
    },
    {
      name: "Forearm plank",
      muscle: "Core",
      sets: "3",
      reps: "60s",
      rest: "60s",
      load: "-",
    },
  ],
};

const PROGRAM = {
  week: "Week 4",
  name: "Foundation Strength",
  description: "Build a strong base with four focused sessions per week.",
  todayLabel: "Tue",
  days: [
    { day: "Mon", plan: "Upper body A" },
    { day: "Tue", plan: "Lower body A" },
    { day: "Wed", plan: "Active recovery 20" },
    { day: "Thu", plan: "Upper body B" },
    { day: "Fri", plan: "Lower body B" },
    { day: "Sat", plan: "Optional mobility 20" },
    { day: "Sun", plan: "Rest & recharge" },
  ],
};

/* ---------------------------- Small building blocks ---------------------------- */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: FeatherName;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon ? (
          <Feather name={icon} size={16} color={KFitColors.accent} />
        ) : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function LinkRow({
  label,
  icon,
  last,
  onPress,
}: {
  label: string;
  icon: FeatherName;
  last?: boolean;
  onPress?: () => void;
}) {
  return (
    <>
      <TouchableOpacity
        style={styles.linkRow}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.linkLeft}>
          <View style={styles.linkIconBox}>
            <Feather name={icon} size={16} color={KFitColors.accent} />
          </View>
          <Text style={styles.linkLabel}>{label}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={KFitColors.mutedText} />
      </TouchableOpacity>
      {!last ? <View style={styles.dividerInset} /> : null}
    </>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ---------------------------------- Screen ---------------------------------- */

export default function MemberWorkoutScreen() {
  const router = useRouter();
  const { isSigningOut, logout } = useLogout();
  const { profile } = useMemberProfile();
  const [notes, setNotes] = useState("");

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );

  const firstName = profile?.firstName?.trim();
  const go = (route: string) => router.replace(route as any);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: NAV_CLEARANCE }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>FORM ATHLETICS</Text>
              <Text style={styles.brandSubtitle}>
                FORM / Brooklyn · Performance club
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              disabled={isSigningOut}
              onPress={logout}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Feather name="log-out" size={14} color={KFitColors.error} />
              <Text style={styles.logoutText}>
                {isSigningOut ? "Signing out…" : "Logout"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.date}>{today}</Text>

          {/* Workout hero */}
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>
              {firstName
                ? `TODAY'S SESSION · ${firstName.toUpperCase()}`
                : "TODAY'S SESSION"}
            </Text>
            <Text style={styles.heroTitle}>{WORKOUT.title}</Text>
            <Text style={styles.heroSubtitle}>{WORKOUT.program}</Text>
          </View>

          {/* Start workout */}
          <TouchableOpacity
            style={styles.startButtonWrapper}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Start workout"
            onPress={() => {}}
          >
            <ImageBackground
              source={require("../../assets/images/gold-texture.jpg")}
              resizeMode="cover"
              style={styles.startButtonBg}
              imageStyle={styles.startButtonImage}
            >
              <Feather name="play" size={16} color="#121212" />
              <Text style={styles.startButtonText}>Start workout</Text>
            </ImageBackground>
          </TouchableOpacity>

          {/* Session summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.level}>{WORKOUT.level}</Text>
            <Text style={styles.tagline}>{WORKOUT.tagline}</Text>
            <View style={styles.statsRow}>
              <Stat value={WORKOUT.exercises.length} label="exercises" />
              <View style={styles.statDivider} />
              <Stat value={WORKOUT.minutes} label="minutes" />
              <View style={styles.statDivider} />
              <Stat value={WORKOUT.workingSets} label="working sets" />
            </View>
            <View style={styles.equipmentRow}>
              <Feather name="tool" size={13} color={KFitColors.mutedText} />
              <Text style={styles.equipmentText}>{WORKOUT.equipment}</Text>
            </View>
          </View>

          {/* Coach */}
          <Section title="Today's Focus" icon="target">
            <View style={styles.card}>
              <View style={styles.coachRow}>
                <View style={styles.coachIcon}>
                  <Feather name="award" size={16} color={KFitColors.accent} />
                </View>
                <View>
                  <Text style={styles.coachName}>{WORKOUT.coach}</Text>
                  <Text style={styles.coachRole}>Your coach</Text>
                </View>
              </View>
              <Text style={styles.quote}>“{WORKOUT.coachNote}”</Text>
            </View>
          </Section>

          {/* Effort */}
          <Section title="Target Effort" icon="activity">
            <View style={[styles.card, styles.effortCard]}>
              <Text style={styles.effortValue}>{WORKOUT.effort}</Text>
              <View style={styles.lastCompleted}>
                <Text style={styles.lastCompletedLabel}>LAST COMPLETED</Text>
                <Text style={styles.lastCompletedValue}>
                  {WORKOUT.lastCompleted}
                </Text>
              </View>
            </View>
          </Section>

          {/* Warm-up */}
          <Section title="Warm-up" icon="sunrise">
            <View style={styles.card}>
              <Text style={styles.bodyText}>{WORKOUT.warmup}</Text>
            </View>
          </Section>

          {/* Exercises */}
          <Section title="Exercises" icon="zap">
            <View style={styles.cardFlush}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colName]}>
                  EXERCISE
                </Text>
                <Text style={[styles.tableHeaderText, styles.colData]}>
                  SETS
                </Text>
                <Text style={[styles.tableHeaderText, styles.colData]}>
                  REPS
                </Text>
                <Text style={[styles.tableHeaderText, styles.colData]}>
                  REST
                </Text>
                <Text style={[styles.tableHeaderText, styles.colData]}>
                  LOAD
                </Text>
              </View>
              {WORKOUT.exercises.map((ex, i) => (
                <View key={ex.name}>
                  <View style={styles.exerciseRow}>
                    <View style={styles.colName}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                      <Text style={styles.exerciseMuscle}>{ex.muscle}</Text>
                      {ex.tip ? (
                        <Text style={styles.exerciseTip}>{ex.tip}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.exerciseValue, styles.colData]}>
                      {ex.sets}
                    </Text>
                    <Text style={[styles.exerciseValue, styles.colData]}>
                      {ex.reps}
                    </Text>
                    <Text style={[styles.exerciseValue, styles.colData]}>
                      {ex.rest}
                    </Text>
                    <Text style={[styles.exerciseValue, styles.colData]}>
                      {ex.load}
                    </Text>
                  </View>
                  {i < WORKOUT.exercises.length - 1 ? (
                    <View style={styles.divider} />
                  ) : null}
                </View>
              ))}
            </View>
          </Section>

          {/* Finish */}
          <Section title="Finish" icon="flag">
            <View style={styles.card}>
              <Text style={styles.bodyText}>{WORKOUT.finish}</Text>
            </View>
          </Section>

          {/* Notes */}
          <Section title="Workout Notes" icon="edit-3">
            <View style={styles.card}>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
                placeholder="How are you feeling today? Add notes about your energy, technique or any discomfort…"
                placeholderTextColor={KFitColors.mutedText}
                accessibilityLabel="Workout notes"
              />
            </View>
          </Section>

          {/* Weekly program */}
          <Section title="Your Weekly Program" icon="calendar">
            <View style={styles.card}>
              <View style={styles.programHeader}>
                <Text style={styles.programWeek}>{PROGRAM.week}</Text>
                <Text style={styles.programName}>{PROGRAM.name}</Text>
              </View>
              <Text style={styles.programDescription}>
                {PROGRAM.description}
              </Text>

              {PROGRAM.days.map((d, i) => {
                const isToday = d.day === PROGRAM.todayLabel;
                return (
                  <View key={d.day}>
                    <View
                      style={[
                        styles.programDay,
                        isToday && styles.programDayActive,
                      ]}
                    >
                      <Text style={styles.programDayLabel}>{d.day}</Text>
                      <Text
                        style={[
                          styles.programDayValue,
                          isToday && styles.programDayToday,
                        ]}
                      >
                        {d.plan}
                      </Text>
                      {isToday ? (
                        <View style={styles.todayChip}>
                          <Text style={styles.todayChipText}>Today</Text>
                        </View>
                      ) : null}
                    </View>
                    {i < PROGRAM.days.length - 1 ? (
                      <View style={styles.divider} />
                    ) : null}
                  </View>
                );
              })}

              <TouchableOpacity
                style={styles.outlineButton}
                activeOpacity={0.8}
                accessibilityRole="button"
                onPress={() => {}}
              >
                <Text style={styles.outlineButtonText}>View full program</Text>
              </TouchableOpacity>
            </View>
          </Section>

          {/* Quick links */}
          <Section title="More" icon="compass">
            <View style={styles.cardFlush}>
              <LinkRow
                label="Progress"
                icon="activity"
                onPress={() => go("/member-dashboard")}
              />
              <LinkRow
                label="Progress & profile"
                icon="user"
                onPress={() => go("/member-profile")}
              />
              <LinkRow
                label="Membership & billing"
                icon="credit-card"
                onPress={() => go("/member-membership")}
                last
              />
            </View>
          </Section>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>FORM ATHLETICS</Text>
            <Text style={styles.footerVersion}>Member workspace</Text>
          </View>
        </ScrollView>

        <MemberBottomNav activeRoute="/member-workout" />
      </View>
    </SafeAreaView>
  );
}

/* ---------------------------------- Styles ---------------------------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  brand: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: KFitColors.text,
  },
  brandSubtitle: { fontSize: 12, color: KFitColors.mutedText, marginTop: 2 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  logoutText: { fontSize: 12, fontWeight: "700", color: KFitColors.error },
  date: {
    paddingHorizontal: 20,
    marginTop: 10,
    fontSize: 12,
    color: KFitColors.mutedText,
  },

  /* Hero */
  hero: { paddingHorizontal: 20, marginTop: 20, marginBottom: 16 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: KFitColors.accent,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: KFitColors.text,
    marginBottom: 4,
  },
  heroSubtitle: { fontSize: 14, color: KFitColors.mutedText },

  /* Start button */
  startButtonWrapper: {
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 4,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  startButtonBg: {
    minHeight: 54,
    paddingVertical: 16,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonImage: { borderRadius: 14 },
  startButtonText: {
    color: "#121212",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  /* Summary card */
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 18,
    borderRadius: 16,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  level: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: KFitColors.accent,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 18,
    fontWeight: "800",
    color: KFitColors.text,
    marginBottom: 16,
  },
  statsRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "900", color: KFitColors.text },
  statLabel: { fontSize: 12, color: KFitColors.mutedText, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: KFitColors.border },
  equipmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  equipmentText: { fontSize: 13, color: KFitColors.mutedText },

  /* Sections & cards */
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: KFitColors.text },
  card: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  cardFlush: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  bodyText: { fontSize: 14, color: KFitColors.text, lineHeight: 21 },
  divider: { height: 1, backgroundColor: KFitColors.border },
  dividerInset: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginLeft: 64,
  },

  /* Coach */
  coachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  coachIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1F",
  },
  coachName: { fontSize: 15, fontWeight: "700", color: KFitColors.text },
  coachRole: { fontSize: 12, color: KFitColors.mutedText, marginTop: 1 },
  quote: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: "italic",
    color: KFitColors.mutedText,
  },

  /* Effort */
  effortCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  effortValue: { fontSize: 22, fontWeight: "900", color: KFitColors.accent },
  lastCompleted: { alignItems: "flex-end" },
  lastCompletedLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: KFitColors.mutedText,
  },
  lastCompletedValue: {
    fontSize: 13,
    fontWeight: "600",
    color: KFitColors.text,
    marginTop: 2,
  },

  /* Exercise table */
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: KFitColors.accent + "1F",
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: KFitColors.accent,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  colName: { flex: 1, paddingRight: 8 },
  colData: { width: 44, textAlign: "center" },
  exerciseName: {
    fontSize: 14,
    fontWeight: "700",
    color: KFitColors.text,
    marginBottom: 3,
  },
  exerciseMuscle: { fontSize: 12, color: KFitColors.accent, marginBottom: 2 },
  exerciseTip: { fontSize: 11, color: KFitColors.mutedText },
  exerciseValue: { fontSize: 13, fontWeight: "600", color: KFitColors.text },

  /* Notes */
  notesInput: {
    minHeight: 90,
    fontSize: 14,
    lineHeight: 20,
    color: KFitColors.text,
    padding: 0,
  },

  /* Program */
  programHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  programWeek: { fontSize: 13, fontWeight: "800", color: KFitColors.accent },
  programName: { fontSize: 16, fontWeight: "800", color: KFitColors.text },
  programDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: KFitColors.mutedText,
    marginBottom: 12,
  },
  programDay: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
  },
  programDayActive: {
    backgroundColor: KFitColors.accent + "14",
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  programDayLabel: { width: 44, fontSize: 13, color: KFitColors.mutedText },
  programDayValue: { flex: 1, fontSize: 14, color: KFitColors.text },
  programDayToday: { color: KFitColors.accent, fontWeight: "800" },
  todayChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  todayChipText: { fontSize: 11, fontWeight: "800", color: KFitColors.accent },
  outlineButton: {
    marginTop: 16,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: KFitColors.accent,
  },

  /* Link rows */
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 16,
  },
  linkLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  linkIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1F",
  },
  linkLabel: { fontSize: 14, color: KFitColors.text, fontWeight: "500" },

  /* Footer */
  footer: { paddingVertical: 24, alignItems: "center" },
  footerBrand: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: KFitColors.text,
  },
  footerVersion: { fontSize: 12, color: KFitColors.mutedText, marginTop: 4 },
});
