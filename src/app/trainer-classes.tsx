import TrainerScreenShell from "@/components/TrainerScreenShell";
import { KFitColors } from "@/constants/theme";
import {
  useCoachClasses,
  type ClassInput,
} from "@/hooks/use-coach-classes";
import {
  combineDateAndTime,
  formatClassWhen,
  isoDate,
  type ClassRecord,
} from "@/lib/coach";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Draft = {
  title: string;
  category: string;
  room: string;
  date: string;
  time: string;
  duration: string;
  capacity: string;
};

const emptyDraft = (): Draft => ({
  title: "",
  category: "Strength",
  room: "Studio A",
  date: isoDate(new Date()),
  time: "18:00",
  duration: "45",
  capacity: "12",
});

const draftFromClass = (record: ClassRecord): Draft => {
  const start = new Date(record.startsAt);
  return {
    title: record.title,
    category: record.category,
    room: record.room,
    date: isoDate(start),
    time: `${String(start.getHours()).padStart(2, "0")}:${String(
      start.getMinutes(),
    ).padStart(2, "0")}`,
    duration: String(record.durationMinutes),
    capacity: String(record.capacity),
  };
};

export default function TrainerClassesScreen() {
  const insets = useSafeAreaInsets();
  const {
    classes,
    isLoading,
    error,
    createClass,
    updateClass,
    cancelClass,
    setCheckedIn,
  } = useCoachClasses();

  const [editing, setEditing] = useState<ClassRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...classes].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [classes],
  );

  const stats = useMemo(() => {
    const scheduled = sorted.filter((item) => item.status === "scheduled");
    const reserved = scheduled.reduce(
      (sum, item) => sum + item.reservations.length,
      0,
    );
    return { scheduled: scheduled.length, reserved };
  }, [sorted]);

  const openCreate = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditing(null);
    setDraft(emptyDraft());
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (record: ClassRecord) => {
    void Haptics.selectionAsync();
    setEditing(record);
    setDraft(draftFromClass(record));
    setFormError(null);
    setIsFormOpen(true);
  };

  const submit = async () => {
    if (draft.title.trim().length === 0) {
      setFormError("Give the class a title.");
      return;
    }
    const startsAt = combineDateAndTime(draft.date.trim(), draft.time.trim());
    if (!startsAt) {
      setFormError("Use a valid date (YYYY-MM-DD) and time (HH:MM).");
      return;
    }
    const durationMinutes = Number(draft.duration);
    const capacity = Number(draft.capacity);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 15) {
      setFormError("Duration must be at least 15 minutes.");
      return;
    }
    if (!Number.isFinite(capacity) || capacity < 1) {
      setFormError("Capacity must be at least 1.");
      return;
    }

    const input: ClassInput = {
      title: draft.title.trim(),
      category: draft.category.trim() || "Strength",
      room: draft.room.trim() || "Studio A",
      startsAt,
      durationMinutes,
      capacity,
    };

    setIsSaving(true);
    setFormError(null);
    try {
      if (editing) await updateClass(editing.id, input);
      else await createClass(input);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsFormOpen(false);
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save this class.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const cancel = async (record: ClassRecord) => {
    setBusyId(record.id);
    try {
      await cancelClass(record.id);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (cancelError) {
      console.warn("[Class cancel failed]", cancelError);
    } finally {
      setBusyId(null);
    }
  };

  const toggleCheckIn = async (
    reservationId: string,
    checkedIn: boolean,
  ) => {
    setBusyId(reservationId);
    try {
      await setCheckedIn(reservationId, checkedIn);
      void Haptics.selectionAsync();
    } catch (checkInError) {
      console.warn("[Class check-in failed]", checkInError);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <TrainerScreenShell
      eyebrow="GROUP TRAINING"
      title="Classes"
      activeRoute="/trainer-classes"
      headerRight={
        <TouchableOpacity
          onPress={openCreate}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create class"
          style={styles.newButton}
        >
          <Feather name="plus" size={14} color={KFitColors.onAccent} />
          <Text style={styles.newButtonText}>New class</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.statCard}>
        <StatInline label="Scheduled" value={stats.scheduled} tone={KFitColors.accent} />
        <View style={styles.statDivider} />
        <StatInline label="Reserved" value={stats.reserved} tone={KFitColors.text} />
      </View>

      {error ? (
        <View style={styles.noticeCard}>
          <Feather name="alert-circle" size={14} color={KFitColors.error} />
          <Text style={[styles.noticeText, { color: KFitColors.error }]}>
            {error}
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.noticeCard}>
          <ActivityIndicator size="small" color={KFitColors.accent} />
          <Text style={styles.noticeText}>Loading classes…</Text>
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Feather name="calendar" size={20} color={KFitColors.accent} />
          </View>
          <Text style={styles.emptyTitle}>No classes yet</Text>
          <Text style={styles.emptyText}>
            Create a group class and reserved members will show up here for
            check-in.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {sorted.map((record) => {
            const expanded = expandedId === record.id;
            const cancelled = record.status === "cancelled";
            const checkedIn = record.reservations.filter(
              (reservation) => reservation.checkedInAt,
            ).length;
            return (
              <View key={record.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.flex}>
                    <View style={styles.titleRow}>
                      <Text style={styles.title} numberOfLines={1}>
                        {record.title}
                      </Text>
                      <View
                        style={[
                          styles.statusPill,
                          cancelled ? styles.pillCancelled : styles.pillScheduled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: cancelled
                                ? KFitColors.error
                                : KFitColors.accent,
                            },
                          ]}
                        >
                          {cancelled ? "CANCELLED" : "SCHEDULED"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.meta}>
                      {formatClassWhen(record.startsAt)} · {record.durationMinutes}
                      m · {record.room}
                    </Text>
                    <Text style={styles.metaDim}>
                      {record.category} · {record.reservations.length}/
                      {record.capacity} reserved · {checkedIn} checked in
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => openEdit(record)}
                    style={styles.actionBtn}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${record.title}`}
                  >
                    <Feather name="edit-2" size={12} color={KFitColors.text} />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      setExpandedId(expanded ? null : record.id)
                    }
                    style={styles.actionBtn}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Show reserved members for ${record.title}`}
                  >
                    <Feather name="users" size={12} color={KFitColors.text} />
                    <Text style={styles.actionText}>
                      Members ({record.reservations.length})
                    </Text>
                  </TouchableOpacity>
                  {!cancelled && (
                    <TouchableOpacity
                      onPress={() => cancel(record)}
                      disabled={busyId === record.id}
                      style={[styles.actionBtn, styles.cancelBtn]}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`Cancel ${record.title}`}
                    >
                      <Feather name="x" size={12} color={KFitColors.error} />
                      <Text
                        style={[styles.actionText, { color: KFitColors.error }]}
                      >
                        {busyId === record.id ? "…" : "Cancel"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {expanded ? (
                  record.reservations.length === 0 ? (
                    <Text style={styles.metEmpty}>Nobody reserved this class yet.</Text>
                  ) : (
                    record.reservations.map((reservation) => {
                      const isIn = Boolean(reservation.checkedInAt);
                      return (
                        <View key={reservation.id} style={styles.memberRow}>
                          <View style={styles.flex}>
                            <Text style={styles.memberName}>
                              {reservation.memberName}
                            </Text>
                            <Text style={styles.memberMeta}>
                              {isIn ? "Checked in" : "Reserved"}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() =>
                              toggleCheckIn(reservation.id, !isIn)
                            }
                            disabled={busyId === reservation.id}
                            style={[
                              styles.checkBtn,
                              isIn && styles.checkBtnOn,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={
                              isIn
                                ? `Undo check-in for ${reservation.memberName}`
                                : `Check in ${reservation.memberName}`
                            }
                          >
                            <Feather
                              name={isIn ? "check" : "plus"}
                              size={12}
                              color={
                                isIn ? KFitColors.onAccent : KFitColors.accent
                              }
                            />
                            <Text
                              style={[
                                styles.checkText,
                                isIn && { color: KFitColors.onAccent },
                              ]}
                            >
                              {isIn ? "In" : "Check in"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <Modal
        visible={isFormOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFormOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsFormOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>
              {editing ? "Edit class" : "New class"}
            </Text>

            <Text style={styles.label}>TITLE</Text>
            <TextInput
              style={styles.input}
              value={draft.title}
              onChangeText={(value) =>
                setDraft((prev) => ({ ...prev, title: value }))
              }
              placeholder="Sunrise strength circuit"
              placeholderTextColor={KFitColors.mutedText}
              accessibilityLabel="Class title"
            />

            <View style={styles.fieldRow}>
              <View style={styles.flex}>
                <Text style={styles.label}>CATEGORY</Text>
                <TextInput
                  style={styles.input}
                  value={draft.category}
                  onChangeText={(value) =>
                    setDraft((prev) => ({ ...prev, category: value }))
                  }
                  placeholder="Strength"
                  placeholderTextColor={KFitColors.mutedText}
                  accessibilityLabel="Class category"
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.label}>ROOM</Text>
                <TextInput
                  style={styles.input}
                  value={draft.room}
                  onChangeText={(value) =>
                    setDraft((prev) => ({ ...prev, room: value }))
                  }
                  placeholder="Studio A"
                  placeholderTextColor={KFitColors.mutedText}
                  accessibilityLabel="Class room"
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.flex}>
                <Text style={styles.label}>DATE</Text>
                <TextInput
                  style={styles.input}
                  value={draft.date}
                  onChangeText={(value) =>
                    setDraft((prev) => ({ ...prev, date: value }))
                  }
                  placeholder="2026-11-20"
                  placeholderTextColor={KFitColors.mutedText}
                  accessibilityLabel="Class date"
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.label}>TIME</Text>
                <TextInput
                  style={styles.input}
                  value={draft.time}
                  onChangeText={(value) =>
                    setDraft((prev) => ({ ...prev, time: value }))
                  }
                  placeholder="18:00"
                  placeholderTextColor={KFitColors.mutedText}
                  accessibilityLabel="Class start time"
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.flex}>
                <Text style={styles.label}>MINUTES</Text>
                <TextInput
                  style={styles.input}
                  value={draft.duration}
                  onChangeText={(value) =>
                    setDraft((prev) => ({ ...prev, duration: value }))
                  }
                  keyboardType="number-pad"
                  accessibilityLabel="Class duration in minutes"
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.label}>MAX CAPACITY</Text>
                <TextInput
                  style={styles.input}
                  value={draft.capacity}
                  onChangeText={(value) =>
                    setDraft((prev) => ({ ...prev, capacity: value }))
                  }
                  keyboardType="number-pad"
                  accessibilityLabel="Class capacity"
                />
              </View>
            </View>

            {formError ? (
              <Text style={styles.errorText}>{formError}</Text>
            ) : null}

            <Pressable
              onPress={submit}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Save class"
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
                {isSaving ? "Saving…" : editing ? "Save changes" : "Create class"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </TrainerScreenShell>
  );
}

function StatInline({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <View style={styles.statInline}>
      <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  newButtonText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "900",
  },
  statCard: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  statInline: { flex: 1, alignItems: "center", paddingVertical: 10, gap: 2 },
  statValue: { fontSize: 16, fontWeight: "900", fontFamily: "monospace" },
  statLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 8,
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
  emptyCard: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  emptyTitle: { color: KFitColors.text, fontSize: 14, fontWeight: "800" },
  emptyText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  list: { gap: 10 },
  card: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  cardTop: { flexDirection: "row", gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: {
    flexShrink: 1,
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillScheduled: {
    borderColor: KFitColors.accent + "44",
    backgroundColor: KFitColors.accent + "14",
  },
  pillCancelled: {
    borderColor: KFitColors.error + "44",
    backgroundColor: KFitColors.error + "14",
  },
  statusText: { fontSize: 8, fontWeight: "900", fontFamily: "monospace" },
  meta: { color: KFitColors.text, fontSize: 11, marginTop: 4 },
  metaDim: { color: KFitColors.mutedText, fontSize: 10, marginTop: 2 },
  actions: {
    flexDirection: "row",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  cancelBtn: { borderColor: KFitColors.error + "44" },
  actionText: { color: KFitColors.text, fontSize: 10, fontWeight: "800" },
  metEmpty: {
    color: KFitColors.mutedText,
    fontSize: 11,
    paddingVertical: 6,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  memberName: { color: KFitColors.text, fontSize: 12, fontWeight: "700" },
  memberMeta: { color: KFitColors.mutedText, fontSize: 10, marginTop: 1 },
  checkBtn: {
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
  checkBtnOn: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  checkText: { color: KFitColors.accent, fontSize: 10, fontWeight: "900" },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  sheet: {
    maxHeight: "92%",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 6,
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
  label: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 1.2,
    fontFamily: "monospace",
    marginTop: 6,
  },
  input: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    color: KFitColors.text,
    fontSize: 13,
  },
  fieldRow: { flexDirection: "row", gap: 10 },
  errorText: { color: KFitColors.error, fontSize: 11, marginTop: 4 },
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
