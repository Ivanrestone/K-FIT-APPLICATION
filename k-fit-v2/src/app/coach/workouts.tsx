import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const CATEGORIES = [
  "Strength Training",
  "Hypertrophy",
  "Weight Loss",
  "Endurance",
  "Cardio",
  "Flexibility",
  "General Fitness",
] as const;

type ExerciseDraft = {
  exercise_name: string;
  target_muscle_group: string;
  instructions: string;
  sets: string;
  repetitions: string;
  rest_seconds: string;
};

type Exercise = {
  id: string;
  position: number;
  exercise_name: string;
  target_muscle_group: string;
  instructions: string;
  sets: number;
  repetitions: string;
  rest_seconds: number;
};

type Client = {
  id: string;
  name: string;
};

type TrainingPlan = {
  id: string;
  member_id: string;
  name: string;
  description: string;
  category: string;
  target_muscle_groups: string[];
  scheduled_for: string | null;
  status: "active" | "archived";
  exercises: Exercise[];
};

const emptyExercise = (): ExerciseDraft => ({
  exercise_name: "",
  target_muscle_group: "",
  instructions: "",
  sets: "3",
  repetitions: "8-12",
  rest_seconds: "60",
});

function formatDataError(error: any) {
  if (error?.code === "PGRST205") {
    return "Training plans are unavailable until migration 20261125000000_coach_portal.sql is applied.";
  }
  return error?.message || "Please try again.";
}

export default function CoachWorkoutsScreen() {
  const params = useLocalSearchParams<{
    member_id?: string | string[];
    member_name?: string | string[];
  }>();
  const initialMemberId =
    typeof params.member_id === "string" ? params.member_id : "";
  const initialMemberName =
    typeof params.member_name === "string" ? params.member_name : "";
  const [coachId, setCoachId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(Boolean(initialMemberId));
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]>("General Fitness");
  const [muscleGroups, setMuscleGroups] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [exercises, setExercises] = useState<ExerciseDraft[]>([
    emptyExercise(),
  ]);

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients],
  );

  const loadData = useCallback(async (id: string) => {
    const supabase = getSupabaseClient() as any;
    const { data: assignmentRows, error: assignmentError } = await supabase
      .from("coach_clients")
      .select("member_id")
      .eq("coach_id", id)
      .eq("status", "active");
    if (assignmentError) throw assignmentError;

    const memberIds = (assignmentRows ?? [])
      .map((row: { member_id: string }) => row.member_id)
      .filter(Boolean);

    let activeClients: Client[] = [];
    if (memberIds.length > 0) {
      const { data: members, error: membersError } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("id", memberIds);
      if (membersError) throw membersError;
      activeClients = (members ?? []).map((member: any) => ({
        id: member.id,
        name:
          [member.first_name, member.last_name].filter(Boolean).join(" ") ||
          "Member",
      }));
    }

    const { data: planRows, error: plansError } = await supabase
      .from("coach_training_plans")
      .select(
        "id, member_id, name, description, category, target_muscle_groups, scheduled_for, status",
      )
      .eq("coach_id", id)
      .order("updated_at", { ascending: false });
    if (plansError) throw plansError;

    const planIds = (planRows ?? []).map((plan: any) => plan.id);
    let exercisesByPlan = new Map<string, Exercise[]>();
    if (planIds.length > 0) {
      const { data: exerciseRows, error: exercisesError } = await supabase
        .from("coach_training_exercises")
        .select(
          "id, plan_id, position, exercise_name, target_muscle_group, instructions, sets, repetitions, rest_seconds",
        )
        .in("plan_id", planIds)
        .order("position", { ascending: true });
      if (exercisesError) throw exercisesError;
      exercisesByPlan = new Map<string, Exercise[]>();
      for (const exercise of (exerciseRows ?? []) as (Exercise & {
        plan_id: string;
      })[]) {
        exercisesByPlan.set(exercise.plan_id, [
          ...(exercisesByPlan.get(exercise.plan_id) ?? []),
          exercise,
        ]);
      }
    }

    setClients(activeClients);
    setPlans(
      (planRows ?? []).map((plan: any) => ({
        ...plan,
        target_muscle_groups: plan.target_muscle_groups ?? [],
        exercises: exercisesByPlan.get(plan.id) ?? [],
      })),
    );
    return activeClients;
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
        if (currentUser.user_metadata?.role !== "coach") {
          router.replace(
            currentUser.user_metadata?.role === "admin"
              ? "/admin/dashboard"
              : "/member/dashboard",
          );
          return;
        }
        if (!active) return;
        setCoachId(currentUser.id);
        const activeClients = await loadData(currentUser.id);
        if (!initialMemberId && activeClients.length > 0) {
          setSelectedMemberId(activeClients[0].id);
        }
      } catch (error) {
        if ((error as { code?: string })?.code !== "PGRST205") {
          console.error("Error loading coach training plans:", error);
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
  }, [initialMemberId, loadData]);

  const resetForm = () => {
    setEditingPlanId(null);
    setName("");
    setDescription("");
    setCategory("General Fitness");
    setMuscleGroups("");
    setScheduledFor("");
    setExercises([emptyExercise()]);
  };

  const editPlan = (plan: TrainingPlan) => {
    setEditingPlanId(plan.id);
    setSelectedMemberId(plan.member_id);
    setName(plan.name);
    setDescription(plan.description ?? "");
    setCategory(
      CATEGORIES.includes(plan.category as (typeof CATEGORIES)[number])
        ? (plan.category as (typeof CATEGORIES)[number])
        : "General Fitness",
    );
    setMuscleGroups((plan.target_muscle_groups ?? []).join(", "));
    setScheduledFor(plan.scheduled_for ?? "");
    setExercises(
      plan.exercises.length > 0
        ? plan.exercises.map((exercise) => ({
            exercise_name: exercise.exercise_name,
            target_muscle_group: exercise.target_muscle_group,
            instructions: exercise.instructions,
            sets: String(exercise.sets),
            repetitions: exercise.repetitions,
            rest_seconds: String(exercise.rest_seconds),
          }))
        : [emptyExercise()],
    );
    setFormVisible(true);
  };

  const savePlan = async () => {
    if (!coachId) return;
    if (!selectedMemberId) {
      Alert.alert("Choose a client", "Assign each plan to an active client.");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Plan name required", "Enter a name for this training plan.");
      return;
    }
    if (
      scheduledFor &&
      !/^\d{4}-\d{2}-\d{2}$/.test(scheduledFor.trim())
    ) {
      Alert.alert("Invalid date", "Use YYYY-MM-DD or leave the date blank.");
      return;
    }

    const normalizedExercises = exercises.map((exercise) => ({
      exercise_name: exercise.exercise_name.trim(),
      target_muscle_group: exercise.target_muscle_group.trim(),
      instructions: exercise.instructions.trim(),
      sets: Number(exercise.sets),
      repetitions: exercise.repetitions.trim(),
      rest_seconds: Number(exercise.rest_seconds || 0),
    }));
    if (
      normalizedExercises.length === 0 ||
      normalizedExercises.some(
        (exercise) =>
          !exercise.exercise_name ||
          !exercise.repetitions ||
          !Number.isInteger(exercise.sets) ||
          exercise.sets <= 0 ||
          !Number.isInteger(exercise.rest_seconds) ||
          exercise.rest_seconds < 0,
      )
    ) {
      Alert.alert(
        "Check exercise details",
        "Every exercise needs a name, positive sets, repetitions, and a valid rest time.",
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      const supabase = getSupabaseClient() as any;
      const { error } = await supabase.rpc("save_coach_training_plan", {
        p_plan_id: editingPlanId,
        p_member_id: selectedMemberId,
        p_name: name.trim(),
        p_description: description.trim(),
        p_category: category,
        p_target_muscle_groups: muscleGroups
          .split(",")
          .map((group) => group.trim())
          .filter(Boolean),
        p_scheduled_for: scheduledFor.trim() || null,
        p_exercises: normalizedExercises,
      });
      if (error) throw error;

      await loadData(coachId);
      resetForm();
      setFormVisible(false);
    } catch (error) {
      console.error("Error saving coach training plan:", error);
      setErrorMessage(formatDataError(error));
    } finally {
      setSaving(false);
    }
  };

  const archivePlan = (plan: TrainingPlan) => {
    Alert.alert(
      "Archive training plan",
      `This removes "${plan.name}" from the member's active workout list.`,
      [
        { text: "Keep plan", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: () => void confirmArchive(plan.id),
        },
      ],
    );
  };

  const confirmArchive = async (planId: string) => {
    if (!coachId) return;
    try {
      const supabase = getSupabaseClient() as any;
      const { error } = await supabase.rpc("archive_coach_training_plan", {
        p_plan_id: planId,
      });
      if (error) throw error;
      await loadData(coachId);
    } catch (error) {
      console.error("Error archiving training plan:", error);
      setErrorMessage(formatDataError(error));
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading training plans...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingRow}>
          <View style={styles.headingText}>
            <Text style={styles.eyebrow}>COACHING TOOLS</Text>
            <Text style={styles.title}>Training plans</Text>
            {!!initialMemberName && (
              <Text style={styles.subtitle}>For {initialMemberName}</Text>
            )}
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.newButton}
            onPress={() => {
              resetForm();
              if (!selectedMemberId && clients.length > 0) {
                setSelectedMemberId(clients[0].id);
              }
              setFormVisible((visible) => !visible);
            }}
          >
            <Ionicons name="add" size={18} color={Theme.accentText} />
            <Text style={styles.newButtonText}>New plan</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Create real, member-specific routines. Assigned plans appear in each
          member&apos;s Training Plans screen.
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

        {formVisible && (
          <View style={styles.formCard}>
            <View style={styles.formTitleRow}>
              <Text style={styles.sectionTitle}>
                {editingPlanId ? "Edit plan" : "Create a plan"}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close plan form"
                onPress={() => {
                  setFormVisible(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={21} color={Theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Assigned client</Text>
            {clients.length === 0 ? (
              <Text style={styles.helperText}>
                Accept a client request before assigning a training plan.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {clients.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    style={[
                      styles.choiceChip,
                      selectedMemberId === client.id && styles.choiceChipActive,
                    ]}
                    onPress={() => setSelectedMemberId(client.id)}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        selectedMemberId === client.id &&
                          styles.choiceTextActive,
                      ]}
                    >
                      {client.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={styles.label}>Plan name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Foundation strength"
              placeholderTextColor="#686868"
              maxLength={100}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.choiceChip,
                    category === item && styles.choiceChipActive,
                  ]}
                  onPress={() => setCategory(item)}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      category === item && styles.choiceTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Training focus and instructions"
              placeholderTextColor="#686868"
              multiline
              maxLength={1000}
            />

            <Text style={styles.label}>Target muscle groups</Text>
            <TextInput
              style={styles.input}
              value={muscleGroups}
              onChangeText={setMuscleGroups}
              placeholder="e.g. legs, back, core"
              placeholderTextColor="#686868"
            />

            <Text style={styles.label}>Schedule date (optional)</Text>
            <TextInput
              style={styles.input}
              value={scheduledFor}
              onChangeText={setScheduledFor}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#686868"
              autoCapitalize="none"
            />

            <View style={styles.exerciseHeading}>
              <Text style={styles.sectionTitle}>Exercises</Text>
              <TouchableOpacity
                onPress={() =>
                  setExercises((current) =>
                    current.length < 40
                      ? [...current, emptyExercise()]
                      : current,
                  )
                }
                disabled={exercises.length >= 40}
              >
                <Text style={styles.addExerciseText}>+ Add exercise</Text>
              </TouchableOpacity>
            </View>

            {exercises.map((exercise, index) => (
              <View key={`exercise-${index}`} style={styles.exerciseCard}>
                <View style={styles.exerciseTitleRow}>
                  <Text style={styles.exerciseTitle}>Exercise {index + 1}</Text>
                  {exercises.length > 1 && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Remove exercise ${index + 1}`}
                      onPress={() =>
                        setExercises((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color="#F87171"
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.input}
                  value={exercise.exercise_name}
                  onChangeText={(value) =>
                    setExercises((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, exercise_name: value }
                          : item,
                      ),
                    )
                  }
                  placeholder="Exercise name"
                  placeholderTextColor="#686868"
                />
                <View style={styles.numberRow}>
                  <TextInput
                    style={[styles.input, styles.numberInput]}
                    value={exercise.sets}
                    onChangeText={(value) =>
                      setExercises((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, sets: value } : item,
                        ),
                      )
                    }
                    placeholder="Sets"
                    placeholderTextColor="#686868"
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={[styles.input, styles.numberInput]}
                    value={exercise.repetitions}
                    onChangeText={(value) =>
                      setExercises((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, repetitions: value }
                            : item,
                        ),
                      )
                    }
                    placeholder="Reps"
                    placeholderTextColor="#686868"
                  />
                  <TextInput
                    style={[styles.input, styles.numberInput]}
                    value={exercise.rest_seconds}
                    onChangeText={(value) =>
                      setExercises((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, rest_seconds: value }
                            : item,
                        ),
                      )
                    }
                    placeholder="Rest sec"
                    placeholderTextColor="#686868"
                    keyboardType="number-pad"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={exercise.target_muscle_group}
                  onChangeText={(value) =>
                    setExercises((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, target_muscle_group: value }
                          : item,
                      ),
                    )
                  }
                  placeholder="Target muscle group (optional)"
                  placeholderTextColor="#686868"
                />
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={exercise.instructions}
                  onChangeText={(value) =>
                    setExercises((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, instructions: value }
                          : item,
                      ),
                    )
                  }
                  placeholder="Exercise instructions (optional)"
                  placeholderTextColor="#686868"
                  multiline
                />
              </View>
            ))}

            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.saveButton, saving && styles.disabled]}
              onPress={() => void savePlan()}
              disabled={saving || clients.length === 0}
            >
              {saving ? (
                <ActivityIndicator color={Theme.accentText} />
              ) : (
                <MaterialCommunityIcons
                  name="content-save-outline"
                  size={18}
                  color={Theme.accentText}
                />
              )}
              <Text style={styles.saveButtonText}>
                {saving
                  ? "Saving..."
                  : editingPlanId
                    ? "Save changes"
                    : "Assign training plan"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.listHeading}>
          <Text style={styles.sectionTitle}>Your plans</Text>
          <Text style={styles.countText}>{plans.length}</Text>
        </View>
        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="dumbbell"
              size={36}
              color={Theme.textMuted}
            />
            <Text style={styles.emptyTitle}>No training plans yet</Text>
            <Text style={styles.helperText}>
              Create a plan to share a structured routine with an active client.
            </Text>
          </View>
        ) : (
          plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={styles.planIcon}>
                  <MaterialCommunityIcons
                    name="dumbbell"
                    size={19}
                    color={Theme.accent}
                  />
                </View>
                <View style={styles.planHeading}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planMeta}>
                    {clientNameById.get(plan.member_id) ?? "Assigned client"} ·{" "}
                    {plan.category}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusChip,
                    plan.status === "archived" && styles.archivedChip,
                  ]}
                >
                  <Text style={styles.statusText}>{plan.status}</Text>
                </View>
              </View>
              {!!plan.description && (
                <Text style={styles.planDescription}>{plan.description}</Text>
              )}
              <Text style={styles.planSummary}>
                {plan.exercises.length} exercises
                {plan.scheduled_for
                  ? ` · Scheduled ${new Date(
                      `${plan.scheduled_for}T00:00:00`,
                    ).toLocaleDateString()}`
                  : ""}
              </Text>
              <View style={styles.planActions}>
                <TouchableOpacity
                  style={styles.planAction}
                  onPress={() => editPlan(plan)}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={Theme.accent}
                  />
                  <Text style={styles.planActionText}>Edit</Text>
                </TouchableOpacity>
                {plan.status === "active" && (
                  <TouchableOpacity
                    style={styles.planAction}
                    onPress={() => archivePlan(plan)}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="archive-outline"
                      size={16}
                      color={Theme.textMuted}
                    />
                    <Text style={styles.planActionText}>Archive</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.background,
  },
  content: {
    padding: 18,
    paddingTop: 22,
    paddingBottom: BOTTOM_NAV_CLEARANCE + 24,
  },
  loadingText: { marginTop: 12, color: Theme.accent, fontWeight: "600" },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headingText: { flex: 1 },
  eyebrow: {
    color: Theme.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  title: { color: Theme.text, fontSize: 25, fontWeight: "900", marginTop: 3 },
  subtitle: {
    color: Theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 16,
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Theme.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  newButtonText: { color: Theme.accentText, fontSize: 12, fontWeight: "900" },
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
  formCard: {
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 18,
    padding: 15,
    marginBottom: 18,
  },
  formTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  sectionTitle: { color: Theme.text, fontSize: 16, fontWeight: "800" },
  label: {
    color: Theme.textMuted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 13,
    marginBottom: 7,
  },
  chipRow: { flexDirection: "row", gap: 8, paddingRight: 8 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  choiceChip: {
    backgroundColor: Theme.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  choiceChipActive: {
    backgroundColor: "rgba(255,214,0,0.14)",
    borderColor: Theme.accent,
  },
  choiceText: { color: Theme.textMuted, fontSize: 11, fontWeight: "700" },
  choiceTextActive: { color: Theme.accent },
  input: {
    minHeight: 46,
    backgroundColor: Theme.background,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: Theme.text,
    fontSize: 13,
    marginTop: 7,
  },
  multiline: { minHeight: 76, textAlignVertical: "top" },
  helperText: {
    color: Theme.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  exerciseHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 6,
  },
  addExerciseText: { color: Theme.accent, fontSize: 12, fontWeight: "800" },
  exerciseCard: {
    backgroundColor: Theme.background,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 14,
    padding: 11,
    marginTop: 10,
  },
  exerciseTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  exerciseTitle: { color: Theme.text, fontSize: 12, fontWeight: "800" },
  numberRow: { flexDirection: "row", gap: 7 },
  numberInput: { flex: 1, minWidth: 0 },
  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: Theme.accent,
    marginTop: 17,
  },
  saveButtonText: { color: Theme.accentText, fontSize: 13, fontWeight: "900" },
  disabled: { opacity: 0.6 },
  listHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 11,
  },
  countText: {
    color: Theme.accent,
    fontSize: 12,
    fontWeight: "800",
    backgroundColor: "rgba(255,214,0,0.1)",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 30,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 18,
  },
  emptyTitle: {
    color: Theme.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 10,
  },
  planCard: {
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 17,
    padding: 14,
    marginBottom: 11,
  },
  planHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  planIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,214,0,0.1)",
  },
  planHeading: { flex: 1 },
  planName: { color: Theme.text, fontSize: 14, fontWeight: "800" },
  planMeta: { color: Theme.textMuted, fontSize: 11, marginTop: 3 },
  statusChip: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255,214,0,0.1)",
  },
  archivedChip: { backgroundColor: "rgba(156,163,175,0.12)" },
  statusText: {
    color: Theme.textMuted,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  planDescription: {
    color: Theme.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 11,
  },
  planSummary: { color: Theme.accent, fontSize: 11, marginTop: 10 },
  planActions: {
    flexDirection: "row",
    gap: 14,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    paddingTop: 11,
  },
  planAction: { flexDirection: "row", alignItems: "center", gap: 5 },
  planActionText: { color: Theme.textMuted, fontSize: 12, fontWeight: "700" },
});
