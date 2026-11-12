import TrainerHeader from "@/components/TrainerHeader";
import { KFitColors } from "@/constants/theme";
import { useMemberDetail, type RoutineDraft } from "@/hooks/use-member-detail";
import { useReminderSender } from "@/hooks/use-reminders";
import { initials, WEEKDAY_SHORT } from "@/lib/coach";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type ExerciseDraft = {
  dayOfWeek: number;
  name: string;
  sets: string;
  reps: string;
  restSeconds: string;
};

const emptyExercise = (): ExerciseDraft => ({
  dayOfWeek: 1,
  name: "",
  sets: "3",
  reps: "8-12",
  restSeconds: "60",
});

export default function TrainerMemberScreen() {
  const params = useLocalSearchParams<{ memberId?: string }>();
  const memberId = typeof params.memberId === "string" ? params.memberId : null;
  const insets = useSafeAreaInsets();

  const { detail, isLoading, error, saveRoutine, deleteRoutine } =
    useMemberDetail(memberId);
  const { sendReminder, isSending } = useReminderSender();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [routineId, setRoutineId] = useState<string | undefined>(undefined);
  const [routineName, setRoutineName] = useState("Weekly routine");
  const [routineNotes, setRoutineNotes] = useState("");
  const [exercises, setExercises] = useState<ExerciseDraft[]>([
    emptyExercise(),
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  const gymActive =
    detail?.subscriptions.some(
      (subscription) => subscription.plan === "gym" && subscription.isActive,
    ) ?? false;

  const openBuilder = (existing?: {
    id: string;
    name: string;
    notes: string | null;
    exercises: { dayOfWeek: number; name: string; sets: number; reps: string; restSeconds: number }[];
  }) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoutineId(existing?.id);
    setRoutineName(existing?.name ?? "Weekly routine");
    setRoutineNotes(existing?.notes ?? "");
    setExercises(
      existing && existing.exercises.length > 0
        ? existing.exercises.map((exercise) => ({
            dayOfWeek: exercise.dayOfWeek,
            name: exercise.name,
            sets: String(exercise.sets),
            reps: exercise.reps,
            restSeconds: String(exercise.restSeconds),
          }))
        : [emptyExercise()],
    );
    setFormError(null);
    setBuilderOpen(true);
  };

  const submitRoutine = async () => {
    const cleaned = exercises.filter((exercise) => exercise.name.trim());
    if (cleaned.length === 0) {
      setFormError("Add at least one exercise.");
      return;
    }
    if (routineName.trim().length === 0) {
      setFormError("Give the routine a name.");
      return;
    }

    const draft: RoutineDraft = {
      id: routineId,
      name: routineName.trim(),
      notes: routineNotes.trim(),
      exercises: cleaned.map((exercise) => ({
        dayOfWeek: exercise.dayOfWeek,
        name: exercise.name.trim(),
        sets: Math.max(1, Number(exercise.sets) || 3),
        reps: exercise.reps.trim() || "8-12",
        restSeconds: Math.max(0, Number(exercise.restSeconds) || 60),
      })),
    };

    setIsSaving(true);
    setFormError(null);
    try {
      await saveRoutine(draft);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBuilderOpen(false);
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save this routine.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Delete routine?", "This removes the routine and its exercises.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteRoutine(id).catch((deleteError) => {
            Alert.alert(
              "Could not delete",
              deleteError instanceof Error
                ? deleteError.message
                : "Try again.",
            );
          });
        },
      },
    ]);
  };

  const remind = () => {
    if (!detail) return;
    void sendReminder({
      memberId: detail.id,
      kind: "membership_expiry",
      message: gymActive
        ? "A quick reminder from your K-Fit coach: your gym membership is due soon. Renew at the front desk to keep your access."
        : "Your K-Fit gym membership has expired. Renew at the front desk to unlock the facility and keep training with your coach.",
    })
      .then(() => {
        setReminderSent(true);
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      })
      .catch((sendError) => {
        Alert.alert(
          "Reminder not sent",
          sendError instanceof Error ? sendError.message : "Try again.",
        );
      });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TrainerHeader showBack subtitle="MEMBER PROFILE" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <View style={styles.noticeCard}>
            <ActivityIndicator size="small" color={KFitColors.accent} />
            <Text style={styles.noticeText}>Loading member…</Text>
          </View>
        ) : error || !detail ? (
          <View style={styles.noticeCard}>
            <Feather name="alert-circle" size={14} color={KFitColors.error} />
            <Text style={[styles.noticeText, { color: KFitColors.error }]}>
              {error ?? "This member could not be loaded."}
            </Text>
          </View>
        ) : (
          <>
            {/* Identity */}
            <View style={styles.identityCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(detail.name)}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.name}>{detail.name}</Text>
                <Text style={styles.email} numberOfLines={1}>
                  {detail.email || detail.id}
                </Text>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: gymActive
                          ? KFitColors.accent + "14"
                          : KFitColors.error + "14",
                        borderColor: gymActive
                          ? KFitColors.accent + "55"
                          : KFitColors.error + "55",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: gymActive
                            ? KFitColors.accent
                            : KFitColors.error,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: gymActive
                            ? KFitColors.accent
                            : KFitColors.error,
                        },
                      ]}
                    >
                      {gymActive ? "MEMBERSHIP ACTIVE" : "MEMBERSHIP EXPIRED"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={remind}
              disabled={isSending}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Send membership reminder"
              style={[styles.remindBtn, reminderSent && styles.remindBtnSent]}
            >
              <Feather
                name={reminderSent ? "bell-off" : "bell"}
                size={14}
                color={KFitColors.onAccent}
              />
              <Text style={styles.remindText}>
                {isSending
                  ? "Sending reminder…"
                  : reminderSent
                    ? "Reminder sent"
                    : "Send membership reminder"}
              </Text>
            </TouchableOpacity>

            {/* Subscriptions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subscriptions</Text>
              {detail.subscriptions.length === 0 ? (
                <Text style={styles.emptyText}>No subscription records.</Text>
              ) : (
                detail.subscriptions.map((subscription) => {
                  const active = subscription.isActive;
                  return (
                    <View key={subscription.plan} style={styles.row}>
                      <Text style={styles.rowLabel}>
                        {subscription.plan === "app" ? "App access" : "Gym access"}
                      </Text>
                      <Text
                        style={[
                          styles.rowValue,
                          { color: active ? KFitColors.accent : KFitColors.error },
                        ]}
                      >
                        {active ? "Active" : "Inactive"}
                        {subscription.expiresAt
                          ? ` · ends ${new Date(
                              subscription.expiresAt,
                            ).toLocaleDateString()}`
                          : ""}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>

            {/* Visit history */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Visit history</Text>
              {detail.visits.length === 0 ? (
                <Text style={styles.emptyText}>No visits logged yet.</Text>
              ) : (
                detail.visits.slice(0, 8).map((visit) => (
                  <View key={visit.id} style={styles.row}>
                    <Text style={styles.rowLabel}>
                      {new Date(visit.scannedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Text>
                    <Text style={styles.rowDim}>
                      {visit.checkedOutAt ? "Checked out" : "Checked in"}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Routines */}
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Assigned workouts</Text>
                <TouchableOpacity
                  onPress={() => openBuilder()}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Create workout routine"
                  style={styles.addRoutineBtn}
                >
                  <Feather name="plus" size={12} color={KFitColors.accent} />
                  <Text style={styles.addRoutineText}>New</Text>
                </TouchableOpacity>
              </View>

              {detail.routines.length === 0 ? (
                <Text style={styles.emptyText}>
                  No workout routine assigned yet.
                </Text>
              ) : (
                detail.routines.map((routine) => (
                  <View key={routine.id} style={styles.routineCard}>
                    <View style={styles.sectionHead}>
                      <Text style={styles.routineName}>{routine.name}</Text>
                      <View style={styles.routineActions}>
                        <TouchableOpacity
                          onPress={() => openBuilder(routine)}
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${routine.name}`}
                          style={styles.iconBtn}
                        >
                          <Feather
                            name="edit-2"
                            size={12}
                            color={KFitColors.text}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => confirmDelete(routine.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${routine.name}`}
                          style={styles.iconBtn}
                        >
                          <Feather
                            name="trash-2"
                            size={12}
                            color={KFitColors.error}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {routine.notes ? (
                      <Text style={styles.routineNotes}>{routine.notes}</Text>
                    ) : null}
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                      const dayExercises = routine.exercises.filter(
                        (exercise) => exercise.dayOfWeek === day,
                      );
                      if (dayExercises.length === 0) return null;
                      return (
                        <View key={day} style={styles.dayBlock}>
                          <Text style={styles.dayLabel}>
                            {WEEKDAY_SHORT[day].toUpperCase()}
                          </Text>
                          {dayExercises.map((exercise) => (
                            <View key={exercise.id} style={styles.exerciseRow}>
                              <Text style={styles.exerciseName}>
                                {exercise.name}
                              </Text>
                              <Text style={styles.exerciseMeta}>
                                {exercise.sets} × {exercise.reps} ·{" "}
                                {exercise.restSeconds}s
                              </Text>
                            </View>
                          ))}
                        </View>
                      );
                    })}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={builderOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setBuilderOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setBuilderOpen(false)}
        >
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>
              {routineId ? "Edit routine" : "Workout routine builder"}
            </Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetBody}
            >
              <Text style={styles.label}>ROUTINE NAME</Text>
              <TextInput
                style={styles.input}
                value={routineName}
                onChangeText={setRoutineName}
                placeholder="Upper / lower split"
                placeholderTextColor={KFitColors.mutedText}
                accessibilityLabel="Routine name"
              />

              <Text style={styles.label}>NOTES</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={routineNotes}
                onChangeText={setRoutineNotes}
                placeholder="Progression, tempo, anything the member should know"
                placeholderTextColor={KFitColors.mutedText}
                multiline
                accessibilityLabel="Routine notes"
              />

              <Text style={styles.label}>EXERCISES</Text>
              {exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseEditor}>
                  <View style={styles.dayPicker}>
                    {WEEKDAY_SHORT.map((label, day) => {
                      const active = exercise.dayOfWeek === day;
                      return (
                        <Pressable
                          key={`${label}-${day}`}
                          onPress={() =>
                            setExercises((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, dayOfWeek: day }
                                  : item,
                              ),
                            )
                          }
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={`${label} for exercise ${index + 1}`}
                          style={[styles.dayChip, active && styles.dayChipOn]}
                        >
                          <Text
                            style={[
                              styles.dayChipText,
                              active && styles.dayChipTextOn,
                            ]}
                          >
                            {label.slice(0, 1)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    style={styles.input}
                    value={exercise.name}
                    onChangeText={(value) =>
                      setExercises((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, name: value } : item,
                        ),
                      )
                    }
                    placeholder="Exercise name (e.g. Back squat)"
                    placeholderTextColor={KFitColors.mutedText}
                    accessibilityLabel={`Exercise ${index + 1} name`}
                  />

                  <View style={styles.fieldRow}>
                    <View style={styles.flex}>
                      <Text style={styles.miniLabel}>SETS</Text>
                      <TextInput
                        style={styles.input}
                        value={exercise.sets}
                        onChangeText={(value) =>
                          setExercises((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, sets: value }
                                : item,
                            ),
                          )
                        }
                        keyboardType="number-pad"
                        accessibilityLabel={`Exercise ${index + 1} sets`}
                      />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.miniLabel}>REPS</Text>
                      <TextInput
                        style={styles.input}
                        value={exercise.reps}
                        onChangeText={(value) =>
                          setExercises((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, reps: value }
                                : item,
                            ),
                          )
                        }
                        placeholder="8-12"
                        placeholderTextColor={KFitColors.mutedText}
                        accessibilityLabel={`Exercise ${index + 1} reps`}
                      />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.miniLabel}>REST (S)</Text>
                      <TextInput
                        style={styles.input}
                        value={exercise.restSeconds}
                        onChangeText={(value) =>
                          setExercises((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, restSeconds: value }
                                : item,
                            ),
                          )
                        }
                        keyboardType="number-pad"
                        accessibilityLabel={`Exercise ${index + 1} rest seconds`}
                      />
                    </View>
                  </View>

                  {exercises.length > 1 ? (
                    <TouchableOpacity
                      onPress={() =>
                        setExercises((prev) =>
                          prev.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Remove exercise ${index + 1}`}
                      style={styles.removeBtn}
                    >
                      <Feather
                        name="minus-circle"
                        size={12}
                        color={KFitColors.error}
                      />
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}

              <TouchableOpacity
                onPress={() =>
                  setExercises((prev) => [...prev, emptyExercise()])
                }
                accessibilityRole="button"
                accessibilityLabel="Add another exercise"
                style={styles.addExerciseBtn}
              >
                <Feather name="plus" size={12} color={KFitColors.accent} />
                <Text style={styles.addExerciseText}>Add exercise</Text>
              </TouchableOpacity>

              {formError ? (
                <Text style={styles.errorText}>{formError}</Text>
              ) : null}

              <Pressable
                onPress={submitRoutine}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Save routine"
                style={({ pressed }) => [
                  styles.saveBtn,
                  (pressed || isSaving) && styles.pressed,
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={KFitColors.onAccent} />
                ) : (
                  <Feather name="save" size={14} color={KFitColors.onAccent} />
                )}
                <Text style={styles.saveText}>
                  {isSaving ? "Saving…" : "Save routine"}
                </Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },
  container: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  noticeText: { color: KFitColors.mutedText, fontSize: 12 },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  avatarText: {
    color: KFitColors.accent,
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  name: { color: KFitColors.text, fontSize: 17, fontWeight: "900" },
  email: { color: KFitColors.mutedText, fontSize: 11, marginTop: 2 },
  badgeRow: { flexDirection: "row", marginTop: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 8, fontWeight: "900", fontFamily: "monospace" },
  remindBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
  },
  remindBtnSent: { opacity: 0.7 },
  remindText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "900",
  },
  section: {
    gap: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sectionTitle: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontFamily: "monospace",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  rowLabel: { color: KFitColors.text, fontSize: 12 },
  rowValue: { fontSize: 11, fontWeight: "700" },
  rowDim: { color: KFitColors.mutedText, fontSize: 11 },
  emptyText: { color: KFitColors.mutedText, fontSize: 11 },
  addRoutineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.accent + "12",
  },
  addRoutineText: { color: KFitColors.accent, fontSize: 10, fontWeight: "900" },
  routineCard: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  routineName: { color: KFitColors.text, fontSize: 13, fontWeight: "800" },
  routineActions: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  routineNotes: { color: KFitColors.mutedText, fontSize: 11, lineHeight: 16 },
  dayBlock: { gap: 4 },
  dayLabel: {
    color: KFitColors.accent,
    fontSize: 9,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.8,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  exerciseName: { color: KFitColors.text, fontSize: 12, flex: 1 },
  exerciseMeta: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  sheet: {
    maxHeight: "94%",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: KFitColors.border,
    marginBottom: 8,
  },
  sheetTitle: { color: KFitColors.text, fontSize: 20, fontWeight: "900" },
  sheetBody: { gap: 6, paddingVertical: 12 },
  label: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 1.2,
    fontFamily: "monospace",
    marginTop: 8,
  },
  miniLabel: {
    color: KFitColors.mutedText,
    fontSize: 8,
    letterSpacing: 1,
    fontFamily: "monospace",
    marginTop: 4,
  },
  input: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    color: KFitColors.text,
    fontSize: 12,
  },
  multiline: { minHeight: 60, textAlignVertical: "top" },
  exerciseEditor: {
    gap: 6,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  dayPicker: { flexDirection: "row", gap: 4 },
  dayChip: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 7,
    alignItems: "center",
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  dayChipOn: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  dayChipText: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  dayChipTextOn: { color: KFitColors.onAccent },
  fieldRow: { flexDirection: "row", gap: 8 },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  removeText: { color: KFitColors.error, fontSize: 10, fontWeight: "700" },
  addExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: KFitColors.accent + "55",
  },
  addExerciseText: { color: KFitColors.accent, fontSize: 11, fontWeight: "800" },
  errorText: { color: KFitColors.error, fontSize: 11 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: KFitColors.accent,
  },
  saveText: { color: KFitColors.onAccent, fontSize: 14, fontWeight: "900" },
});
