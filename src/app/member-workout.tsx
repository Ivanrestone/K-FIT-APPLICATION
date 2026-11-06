import MemberBottomNav from "@/components/MemberBottomNav";
import MemberHeader, {
  MemberLocalNotification,
} from "@/components/MemberHeader";
import { KFitColors } from "@/constants/theme";
import { useLogout } from "@/hooks/use-logout";
import { MEMBER_PLACEHOLDER_STATS } from "@/hooks/use-member-header-data";
import { useMemberProfile } from "@/hooks/use-member-profile";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

const NAV_CLEARANCE = 140;

type FeatherName = keyof typeof Feather.glyphMap;

const WORKOUT = {
  title: "Lower body strength",
  program: "Foundation Strength · Week 4 of 8",
  week: 4,
  totalWeeks: 8,
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
      load: "—",
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

/* ─────────── Building blocks ─────────── */
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
          <View style={styles.sectionIconWrap}>
            <Feather name={icon} size={12} color={KFitColors.accent} />
          </View>
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
            <Feather name={icon} size={15} color={KFitColors.accent} />
          </View>
          <Text style={styles.linkLabel}>{label}</Text>
        </View>
        <Feather name="chevron-right" size={16} color={KFitColors.mutedText} />
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

/* ─────────── Screen ─────────── */
export default function MemberWorkoutScreen() {
  const router = useRouter();
  const { isSigningOut, logout } = useLogout();
  const { profile } = useMemberProfile();
  const [notes, setNotes] = useState("");

  const [notifications, setNotifications] = useState<MemberLocalNotification[]>(
    [],
  );

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
  const name =
    [firstName, profile?.lastName?.trim()].filter(Boolean).join(" ") ||
    "Member";
  const go = (route: string) => router.replace(route as any);

  const weekProgress = WORKOUT.week / WORKOUT.totalWeeks;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.mainContainer}>
        <MemberHeader
          name={name}
          tier={MEMBER_PLACEHOLDER_STATS.tier}
          streakDays={MEMBER_PLACEHOLDER_STATS.streakDays}
          points={MEMBER_PLACEHOLDER_STATS.points}
          checkedIn={false}
          isSigningOut={isSigningOut}
          onLogout={logout}
          notifications={notifications}
          setNotifications={setNotifications}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.date}>{today}</Text>

          {/* ── Hero ─────────────────────────── */}
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>
              {firstName
                ? `TODAY'S SESSION · ${firstName.toUpperCase()}`
                : "TODAY'S SESSION"}
            </Text>
            <Text style={styles.heroTitle}>{WORKOUT.title}</Text>
            <Text style={styles.heroSubtitle}>{WORKOUT.program}</Text>

            {/* Week progress bar */}
            <View style={styles.weekProgressRow}>
              <Text style={styles.weekProgressLabel}>
                WEEK {WORKOUT.week} OF {WORKOUT.totalWeeks}
              </Text>
              <View style={styles.weekTrack}>
                <View
                  style={[styles.weekFill, { width: `${weekProgress * 100}%` }]}
                />
              </View>
            </View>
          </View>

          {/* ── Start CTA ────────────────────── */}
          <TouchableOpacity
            style={styles.startButtonWrapper}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Start workout"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <ImageBackground
              source={require("../../assets/images/gold-texture.jpg")}
              resizeMode="cover"
              style={styles.startButtonBg}
              imageStyle={styles.startButtonImage}
            >
              <View style={styles.startLeft}>
                <View style={styles.startIconWrap}>
                  <Feather name="play" size={14} color="#121212" />
                </View>
                <Text style={styles.startButtonText}>Start workout</Text>
              </View>
              <View style={styles.startDurationPill}>
                <Feather name="clock" size={11} color="#121212" />
                <Text style={styles.startDurationText}>
                  {WORKOUT.minutes} min
                </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          {/* ── Summary ──────────────────────── */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryHeaderLabel}>AT A GLANCE</Text>
              <Text style={styles.summaryLevel}>{WORKOUT.level}</Text>
            </View>
            <Text style={styles.tagline}>{WORKOUT.tagline}</Text>

            <View style={styles.statCard}>
              <Stat value={WORKOUT.exercises.length} label="exercises" />
              <View style={styles.statDivider} />
              <Stat value={WORKOUT.minutes} label="minutes" />
              <View style={styles.statDivider} />
              <Stat value={WORKOUT.workingSets} label="working sets" />
            </View>

            <View style={styles.equipmentRow}>
              <View style={styles.equipmentIcon}>
                <Feather name="tool" size={11} color={KFitColors.mutedText} />
              </View>
              <Text style={styles.equipmentText}>{WORKOUT.equipment}</Text>
            </View>
          </View>

          {/* ── Today's focus ────────────────── */}
          <Section title="Today's focus" icon="target">
            <View style={styles.card}>
              <View style={styles.coachRow}>
                <View style={styles.coachIcon}>
                  <Feather name="award" size={16} color={KFitColors.accent} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.coachName}>{WORKOUT.coach}</Text>
                  <Text style={styles.coachRole}>Your coach</Text>
                </View>
                <View style={styles.messagePill}>
                  <Feather
                    name="message-circle"
                    size={10}
                    color={KFitColors.accent}
                  />
                  <Text style={styles.messagePillText}>NOTE</Text>
                </View>
              </View>
              <View style={styles.quoteDivider} />
              <Text style={styles.quote}>“{WORKOUT.coachNote}”</Text>
            </View>
          </Section>

          {/* ── Target effort ────────────────── */}
          <Section title="Target effort" icon="activity">
            <View style={styles.effortCard}>
              <View style={styles.effortCol}>
                <Text style={styles.effortEyebrow}>TARGET EFFORT</Text>
                <Text style={styles.effortValue}>{WORKOUT.effort}</Text>
              </View>
              <View style={styles.effortDivider} />
              <View style={styles.effortCol}>
                <Text style={styles.effortEyebrow}>LAST COMPLETED</Text>
                <Text style={styles.lastCompletedValue}>
                  {WORKOUT.lastCompleted}
                </Text>
              </View>
              <View style={styles.effortTrend}>
                <Feather name="trending-up" size={14} color="#22C55E" />
              </View>
            </View>
          </Section>

          {/* ── Warm-up ──────────────────────── */}
          <Section title="Warm-up" icon="sunrise">
            <View style={styles.card}>
              <Text style={styles.bodyText}>{WORKOUT.warmup}</Text>
            </View>
          </Section>

          {/* ── Exercises table ──────────────── */}
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
                <Text style={[styles.tableHeaderText, styles.colLoad]}>
                  LOAD
                </Text>
              </View>

              {WORKOUT.exercises.map((ex, i) => (
                <View key={ex.name}>
                  <View style={styles.exerciseRow}>
                    <View style={styles.colName}>
                      <Text style={styles.exerciseName} numberOfLines={1}>
                        {ex.name}
                      </Text>
                      <View style={styles.musclePill}>
                        <Text style={styles.musclePillText}>{ex.muscle}</Text>
                      </View>
                      {ex.tip ? (
                        <Text style={styles.exerciseTip} numberOfLines={1}>
                          {ex.tip}
                        </Text>
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
                    <Text
                      style={[
                        styles.exerciseValue,
                        styles.colLoad,
                        styles.colLoadText,
                      ]}
                    >
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

          {/* ── Finish ───────────────────────── */}
          <Section title="Finish" icon="flag">
            <View style={styles.card}>
              <Text style={styles.bodyText}>{WORKOUT.finish}</Text>
            </View>
          </Section>

          {/* ── Notes ────────────────────────── */}
          <Section title="Workout notes" icon="edit-3">
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

          {/* ── Weekly program ───────────────── */}
          <Section title="Your weekly program" icon="calendar">
            <View style={styles.card}>
              <View style={styles.programHeader}>
                <View style={styles.programHeaderLeft}>
                  <Text style={styles.programWeek}>{PROGRAM.week}</Text>
                  <Text style={styles.programName}>{PROGRAM.name}</Text>
                </View>
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
                      <Text
                        style={[
                          styles.programDayLabel,
                          isToday && styles.programDayLabelToday,
                        ]}
                      >
                        {d.day}
                      </Text>
                      <Text
                        style={[
                          styles.programDayValue,
                          isToday && styles.programDayToday,
                        ]}
                        numberOfLines={1}
                      >
                        {d.plan}
                      </Text>
                      {isToday ? (
                        <View style={styles.todayChip}>
                          <View style={styles.todayChipDot} />
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
                <Feather
                  name="arrow-right"
                  size={13}
                  color={KFitColors.accent}
                />
              </TouchableOpacity>
            </View>
          </Section>

          {/* ── Quick links ──────────────────── */}
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

          {/* ── Footer ───────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>KFIT ATHLETICS</Text>
            <Text style={styles.footerLabel}>MEMBER WORKSPACE</Text>
          </View>
        </ScrollView>

        <MemberBottomNav activeRoute="/member-workout" />
      </View>
    </SafeAreaView>
  );
}

/* ─────────── Styles ─────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1 },
  contentInner: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: NAV_CLEARANCE,
    gap: 16,
  },
  flex: { flex: 1, minWidth: 0 },

  date: {
    fontSize: 11,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
    opacity: 0.75,
  },

  /* Hero */
  hero: { gap: 4, marginTop: 2 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: KFitColors.accent,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: KFitColors.mutedText,
    marginTop: 2,
  },
  weekProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  weekProgressLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  weekTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: KFitColors.border,
    overflow: "hidden",
  },
  weekFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: KFitColors.accent,
  },

  /* Start CTA */
  startButtonWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    elevation: 4,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  startButtonBg: {
    minHeight: 58,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  startButtonImage: { borderRadius: 14 },
  startLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  startIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  startButtonText: {
    color: "#121212",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  startDurationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  startDurationText: {
    color: "#121212",
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "monospace",
  },

  /* Summary */
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
    gap: 12,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryHeaderLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: KFitColors.accent,
    fontFamily: "monospace",
  },
  summaryLevel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  tagline: {
    fontSize: 20,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.3,
    marginTop: -4,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  stat: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 2 },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    color: KFitColors.text,
    fontFamily: "monospace",
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 9,
    color: KFitColors.mutedText,
    letterSpacing: 0.8,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 10,
  },
  equipmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  equipmentIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  equipmentText: {
    fontSize: 11,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
    flex: 1,
  },

  /* Section */
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.2,
  },

  /* Card */
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
  bodyText: {
    fontSize: 13,
    color: KFitColors.text,
    lineHeight: 20,
  },
  divider: { height: 1, backgroundColor: KFitColors.border },
  dividerInset: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginLeft: 60,
  },

  /* Coach */
  coachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coachIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  coachName: { fontSize: 14, fontWeight: "800", color: KFitColors.text },
  coachRole: {
    fontSize: 11,
    color: KFitColors.mutedText,
    marginTop: 1,
    fontFamily: "monospace",
  },
  messagePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  messagePillText: {
    color: KFitColors.accent,
    fontSize: 8,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.6,
  },
  quoteDivider: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 12,
  },
  quote: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    color: KFitColors.mutedText,
  },

  /* Effort */
  effortCard: {
    flexDirection: "row",
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: "center",
  },
  effortCol: { flex: 1, minWidth: 0 },
  effortEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  effortValue: {
    fontSize: 22,
    fontWeight: "900",
    color: KFitColors.accent,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  effortDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: KFitColors.border,
    marginVertical: 4,
  },
  lastCompletedValue: {
    fontSize: 12,
    fontWeight: "700",
    color: KFitColors.text,
    marginTop: 3,
    fontFamily: "monospace",
  },
  effortTrend: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E" + "14",
    borderWidth: 1,
    borderColor: "#22C55E" + "44",
  },

  /* Table */
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: KFitColors.accent + "14",
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.accent + "44",
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: KFitColors.accent,
    fontFamily: "monospace",
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  colName: { flex: 1, paddingRight: 8 },
  colData: { width: 42, textAlign: "center" },
  colLoad: { width: 56 },
  colLoadText: { textAlign: "right" },
  exerciseName: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.text,
    marginBottom: 4,
  },
  musclePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
    marginBottom: 3,
  },
  musclePillText: {
    fontSize: 8,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },
  exerciseTip: { fontSize: 10, color: KFitColors.mutedText },
  exerciseValue: {
    fontSize: 12,
    fontWeight: "700",
    color: KFitColors.text,
    fontFamily: "monospace",
  },

  /* Notes */
  notesInput: {
    minHeight: 90,
    fontSize: 13,
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
  programHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  programWeek: {
    fontSize: 11,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  programName: {
    fontSize: 15,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.2,
  },
  programDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: KFitColors.mutedText,
    marginBottom: 12,
  },
  programDay: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 4,
    gap: 8,
  },
  programDayActive: {
    backgroundColor: KFitColors.accent + "10",
    borderRadius: 10,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderLeftWidth: 2,
    borderLeftColor: KFitColors.accent,
  },
  programDayLabel: {
    width: 40,
    fontSize: 12,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  programDayLabelToday: {
    color: KFitColors.accent,
  },
  programDayValue: {
    flex: 1,
    fontSize: 13,
    color: KFitColors.text,
    fontWeight: "600",
  },
  programDayToday: {
    color: KFitColors.accent,
    fontWeight: "800",
  },
  todayChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  todayChipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: KFitColors.accent,
  },
  todayChipText: {
    fontSize: 9,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },
  outlineButton: {
    marginTop: 14,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.accent + "10",
  },
  outlineButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: KFitColors.accent,
    letterSpacing: 0.2,
  },

  /* Link rows */
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 14,
  },
  linkLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  linkIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  linkLabel: {
    fontSize: 13,
    color: KFitColors.text,
    fontWeight: "700",
  },

  /* Footer */
  footer: { paddingVertical: 20, alignItems: "center", gap: 4 },
  footerBrand: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: KFitColors.text,
    fontFamily: "monospace",
  },
  footerLabel: {
    fontSize: 9,
    color: KFitColors.mutedText,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    opacity: 0.7,
  },
});
