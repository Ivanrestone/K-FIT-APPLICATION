import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BOTTOM_NAV_CLEARANCE } from "@/components/navigation/FloatingTabBar";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";

const Theme = {
  background: "#080808",
  surface: "#141418",
  surfaceHigh: "#1C1C22",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD600",
  accentText: "#000000",
  border: "#27272F",
};

type TrainingExercise = {
  id: string;
  plan_id: string;
  position: number;
  exercise_name: string;
  target_muscle_group: string;
  instructions: string;
  sets: number;
  repetitions: string;
  rest_seconds: number;
};

type TrainingPlan = {
  id: string;
  coach_id: string;
  name: string;
  description: string;
  category: string;
  target_muscle_groups: string[];
  scheduled_for: string | null;
  exercises: TrainingExercise[];
};

type Completion = {
  id: string;
  plan_id: string;
  completed_at: string;
};

function formatDataError(error: any) {
  if (error?.code === "PGRST205") {
    return "Assigned training plans are unavailable until migration 20261125000000_coach_portal.sql is applied.";
  }
  return error?.message || "Please try again.";
}

export default function MemberWorkoutsScreen() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const completionsByPlan = useMemo(() => {
    const result = new Map<string, Completion[]>();
    for (const completion of completions) {
      result.set(completion.plan_id, [
        ...(result.get(completion.plan_id) ?? []),
        completion,
      ]);
    }
    return result;
  }, [completions]);

  const loadPlans = useCallback(async (id: string) => {
    const supabase = getSupabaseClient() as any;
    const { data: planRows, error: plansError } = await supabase
      .from("coach_training_plans")
      .select(
        "id, coach_id, name, description, category, target_muscle_groups, scheduled_for",
      )
      .eq("member_id", id)
      .eq("status", "active")
      .order("scheduled_for", { ascending: true, nullsFirst: false });
    if (plansError) throw plansError;

    const planIds = (planRows ?? []).map((plan: any) => plan.id);
    let exerciseRows: TrainingExercise[] = [];
    if (planIds.length > 0) {
      const { data, error } = await supabase
        .from("coach_training_exercises")
        .select(
          "id, plan_id, position, exercise_name, target_muscle_group, instructions, sets, repetitions, rest_seconds",
        )
        .in("plan_id", planIds)
        .order("position", { ascending: true });
      if (error) throw error;
      exerciseRows = data ?? [];
    }

    const exercisesByPlan = new Map<string, TrainingExercise[]>();
    for (const exercise of exerciseRows) {
      exercisesByPlan.set(exercise.plan_id, [
        ...(exercisesByPlan.get(exercise.plan_id) ?? []),
        exercise,
      ]);
    }

    const { data: completionRows, error: completionsError } = await supabase
      .from("coach_training_completions")
      .select("id, plan_id, completed_at")
      .eq("member_id", id)
      .order("completed_at", { ascending: false });
    if (completionsError) throw completionsError;

    setPlans(
      (planRows ?? []).map((plan: any) => ({
        ...plan,
        target_muscle_groups: plan.target_muscle_groups ?? [],
        exercises: exercisesByPlan.get(plan.id) ?? [],
      })),
    );
    setCompletions(completionRows ?? []);
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.replace("/login");
          return;
        }
        if (currentUser.user_metadata?.role !== "member") {
          router.replace(
            currentUser.user_metadata?.role === "admin"
              ? "/admin/dashboard"
              : "/coach/dashboard",
          );
          return;
        }
        if (!active) return;
        setMemberId(currentUser.id);
        await loadPlans(currentUser.id);
      } catch (error) {
        if ((error as { code?: string })?.code !== "PGRST205") {
          console.error("Error loading assigned training plans:", error);
        }
        if (active) setErrorMessage(formatDataError(error));
      } finally {
        if (active) setLoading(false);
      }
    };
    void initialize();
    return () => {
      active = false;
    };
  }, [loadPlans]);

  const refresh = async () => {
    if (!memberId) return;
    setRefreshing(true);
    setErrorMessage("");
    try {
      await loadPlans(memberId);
    } catch (error) {
      console.error("Error refreshing assigned training plans:", error);
      setErrorMessage(formatDataError(error));
    } finally {
      setRefreshing(false);
    }
  };

  const markComplete = async (plan: TrainingPlan) => {
    if (!memberId) return;
    setProcessingId(plan.id);
    try {
      const supabase = getSupabaseClient() as any;
      const { error } = await supabase.rpc("complete_coach_training_plan", {
        p_plan_id: plan.id,
        p_notes: "",
      });
      if (error) throw error;
      await loadPlans(memberId);
    } catch (error) {
      console.error("Error recording training completion:", error);
      Alert.alert(
        "Unable to record workout",
        formatDataError(error),
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading your training plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={Theme.accent}
            colors={[Theme.accent]}
            progressBackgroundColor={Theme.surface}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>YOUR TRAINING</Text>
        <Text style={styles.title}>Assigned workouts</Text>
        <Text style={styles.subtitle}>
          Routines shared by your active coach appear here.
        </Text>

        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={18}
              color="#F87171"
            />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={42}
              color={Theme.textMuted}
            />
            <Text style={styles.emptyTitle}>No assigned plans yet</Text>
            <Text style={styles.emptyText}>
              When your coach shares a training plan, it will be available here.
            </Text>
          </View>
        ) : (
          plans.map((plan) => {
            const planCompletions = completionsByPlan.get(plan.id) ?? [];
            return (
              <View key={plan.id} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <View style={styles.iconBox}>
                    <MaterialCommunityIcons
                      name="dumbbell"
                      size={20}
                      color={Theme.accent}
                    />
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.category}>{plan.category}</Text>
                  </View>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeText}>ACTIVE</Text>
                  </View>
                </View>

                {!!plan.description && (
                  <Text style={styles.description}>{plan.description}</Text>
                )}
                {plan.scheduled_for && (
                  <View style={styles.dateRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={Theme.accent}
                    />
                    <Text style={styles.dateText}>
                      {new Date(
                        `${plan.scheduled_for}T00:00:00`,
                      ).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                )}
                {plan.target_muscle_groups.length > 0 && (
                  <Text style={styles.muscleGroups}>
                    Focus: {plan.target_muscle_groups.join(", ")}
                  </Text>
                )}

                <View style={styles.exerciseList}>
                  {plan.exercises.map((exercise, index) => (
                    <View key={exercise.id} style={styles.exerciseRow}>
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>
                          {exercise.exercise_name}
                        </Text>
                        <Text style={styles.exerciseMeta}>
                          {exercise.sets} sets × {exercise.repetitions} reps
                          {exercise.rest_seconds > 0
                            ? ` · ${exercise.rest_seconds}s rest`
                            : ""}
                        </Text>
                        {!!exercise.target_muscle_group && (
                          <Text style={styles.exerciseMeta}>
                            {exercise.target_muscle_group}
                          </Text>
                        )}
                        {!!exercise.instructions && (
                          <Text style={styles.instructions}>
                            {exercise.instructions}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.completionRow}>
                  <View style={styles.completionInfo}>
                    <Text style={styles.completionCount}>
                      {planCompletions.length}{" "}
                      {planCompletions.length === 1
                        ? "workout completed"
                        : "workouts completed"}
                    </Text>
                    {planCompletions[0] && (
                      <Text style={styles.lastCompleted}>
                        Last completed{" "}
                        {new Date(
                          planCompletions[0].completed_at,
                        ).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[
                      styles.completeButton,
                      processingId === plan.id && styles.disabled,
                    ]}
                    onPress={() => void markComplete(plan)}
                    disabled={processingId === plan.id}
                  >
                    {processingId === plan.id ? (
                      <ActivityIndicator
                        size="small"
                        color={Theme.accentText}
                      />
                    ) : (
                      <Text style={styles.completeButtonText}>Complete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.background,
  },
  content: {
    padding: 18,
    paddingTop: 24,
    paddingBottom: BOTTOM_NAV_CLEARANCE + 24,
  },
  loadingText: { color: Theme.accent, fontWeight: "600", marginTop: 12 },
  eyebrow: {
    color: Theme.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  title: { color: Theme.text, fontSize: 26, fontWeight: "900", marginTop: 4 },
  subtitle: {
    color: Theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 18,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.24)",
    marginBottom: 14,
  },
  errorText: { flex: 1, color: "#FCA5A5", fontSize: 13, lineHeight: 18 },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 46,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 18,
  },
  emptyTitle: {
    color: Theme.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 12,
  },
  emptyText: {
    color: Theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
  },
  planCard: {
    padding: 15,
    marginBottom: 13,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 18,
  },
  planHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,214,0,0.1)",
    borderRadius: 14,
  },
  planInfo: { flex: 1 },
  planName: { color: Theme.text, fontSize: 15, fontWeight: "800" },
  category: { color: Theme.textMuted, fontSize: 11, marginTop: 3 },
  activeBadge: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeText: { color: "#4ADE80", fontSize: 9, fontWeight: "900" },
  description: {
    color: Theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 11 },
  dateText: { color: Theme.textMuted, fontSize: 12 },
  muscleGroups: { color: Theme.accent, fontSize: 11, marginTop: 10 },
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    marginTop: 14,
    paddingTop: 5,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  exerciseNumber: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: Theme.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseNumberText: { color: Theme.accent, fontSize: 11, fontWeight: "900" },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: Theme.text, fontSize: 13, fontWeight: "700" },
  exerciseMeta: { color: Theme.textMuted, fontSize: 11, marginTop: 3 },
  instructions: {
    color: Theme.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  completionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 13,
  },
  completionInfo: { flex: 1 },
  completionCount: { color: Theme.text, fontSize: 12, fontWeight: "700" },
  lastCompleted: { color: Theme.textMuted, fontSize: 10, marginTop: 3 },
  completeButton: {
    minWidth: 94,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.accent,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  completeButtonText: { color: Theme.accentText, fontSize: 12, fontWeight: "900" },
  disabled: { opacity: 0.6 },
});
