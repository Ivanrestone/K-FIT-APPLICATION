import { KFitColors } from "@/constants/theme";
import { useCoachAvailability } from "@/hooks/use-coach-sessions";
import type { AvailabilityWindow } from "@/lib/coach";
import {
  minutesToLabel,
  labelToMinutes,
  WEEKDAYS,
  WEEKDAY_SHORT,
} from "@/lib/coach";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Draft = Record<number, { enabled: boolean; start: string; end: string }>;

const buildDraft = (windows: AvailabilityWindow[]): Draft => {
  const draft: Draft = {};
  for (let day = 0; day < 7; day += 1) {
    const saved = windows.find((window) => window.weekday === day);
    draft[day] = {
      enabled: Boolean(saved),
      start: minutesToLabel(saved?.startMinutes ?? 9 * 60),
      end: minutesToLabel(saved?.endMinutes ?? 17 * 60),
    };
  }
  return draft;
};

export default function AvailabilityCard() {
  const insets = useSafeAreaInsets();
  const { windows, isLoading, error, isSaving, save } = useCoachAvailability();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => buildDraft([]));
  const [formError, setFormError] = useState<string | null>(null);

  const summary = useMemo(() => {
    if (windows.length === 0) return "No availability set";
    const totalHours = windows.reduce(
      (sum, window) => sum + (window.endMinutes - window.startMinutes),
      0,
    );
    return `${windows.length} day${windows.length === 1 ? "" : "s"} · ${(
      totalHours / 60
    ).toFixed(1)}h / week`;
  }, [windows]);

  const saveDraft = async () => {
    const next: AvailabilityWindow[] = [];
    for (let day = 0; day < 7; day += 1) {
      const entry = draft[day];
      if (!entry?.enabled) continue;
      const start = labelToMinutes(entry.start);
      const end = labelToMinutes(entry.end);
      if (start === null || end === null || end <= start) {
        setFormError(
          `${WEEKDAYS[day]}: enter times as HH:MM with the end after the start.`,
        );
        return;
      }
      next.push({ weekday: day, startMinutes: start, endMinutes: end });
    }

    try {
      await save(next);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsOpen(false);
    } catch (saveError) {
      setFormError(
        saveError instanceof Error ? saveError.message : "Could not save hours.",
      );
    }
  };

  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.iconBox}>
            <Feather name="clock" size={14} color={KFitColors.accent} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>Availability & hours</Text>
            <Text style={styles.cardSub}>
              {isLoading ? "Loading…" : error ? error : summary}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setDraft(buildDraft(windows));
              setFormError(null);
              setIsOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Edit weekly availability"
            style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
          >
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.dayRow}>
          {WEEKDAY_SHORT.map((label, day) => {
            const saved = windows.find((window) => window.weekday === day);
            return (
              <View
                key={`${label}-${day}`}
                style={[styles.dayPill, saved && styles.dayPillActive]}
              >
                <Text
                  style={[styles.dayPillText, saved && styles.dayPillTextActive]}
                >
                  {label.slice(0, 1)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Weekly availability</Text>
            <Text style={styles.sheetSub}>
              Turn a day on and set the hours you coach. Times use 24h HH:MM.
            </Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
            >
              {WEEKDAYS.map((label, day) => {
                const entry = draft[day];
                return (
                  <View key={label} style={styles.dayRowEditor}>
                    <Pressable
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setDraft((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], enabled: !prev[day].enabled },
                        }));
                      }}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: entry.enabled }}
                      accessibilityLabel={`${label} availability`}
                      style={[
                        styles.toggle,
                        entry.enabled && styles.toggleOn,
                      ]}
                    >
                      {entry.enabled ? (
                        <Feather
                          name="check"
                          size={12}
                          color={KFitColors.onAccent}
                        />
                      ) : null}
                    </Pressable>
                    <Text style={styles.dayLabel}>{label}</Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        !entry.enabled && styles.inputDisabled,
                      ]}
                      value={entry.start}
                      editable={entry.enabled}
                      onChangeText={(value) =>
                        setDraft((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], start: value },
                        }))
                      }
                      placeholder="09:00"
                      placeholderTextColor={KFitColors.mutedText}
                      accessibilityLabel={`${label} start time`}
                    />
                    <Text style={styles.dash}>–</Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        !entry.enabled && styles.inputDisabled,
                      ]}
                      value={entry.end}
                      editable={entry.enabled}
                      onChangeText={(value) =>
                        setDraft((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], end: value },
                        }))
                      }
                      placeholder="17:00"
                      placeholderTextColor={KFitColors.mutedText}
                      accessibilityLabel={`${label} end time`}
                    />
                  </View>
                );
              })}

              {formError ? (
                <Text style={styles.errorText}>{formError}</Text>
              ) : null}
            </ScrollView>

            <Pressable
              onPress={saveDraft}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Save availability"
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
                {isSaving ? "Saving…" : "Save hours"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },
  card: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  cardTitle: { color: KFitColors.text, fontSize: 13, fontWeight: "800" },
  cardSub: { color: KFitColors.mutedText, fontSize: 11, marginTop: 2 },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.accent + "12",
  },
  editText: { color: KFitColors.accent, fontSize: 11, fontWeight: "800" },
  dayRow: { flexDirection: "row", gap: 6 },
  dayPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  dayPillActive: {
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.accent + "1F",
  },
  dayPillText: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  dayPillTextActive: { color: KFitColors.accent },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  sheet: {
    maxHeight: "90%",
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
    marginBottom: 10,
  },
  sheetTitle: { color: KFitColors.text, fontSize: 20, fontWeight: "900" },
  sheetSub: {
    color: KFitColors.mutedText,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  list: { gap: 8, paddingVertical: 12 },
  dayRowEditor: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  toggleOn: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  dayLabel: { flex: 1, color: KFitColors.text, fontSize: 12, fontWeight: "700" },
  timeInput: {
    width: 68,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    color: KFitColors.text,
    fontSize: 12,
    textAlign: "center",
    fontFamily: "monospace",
  },
  inputDisabled: { opacity: 0.4 },
  dash: { color: KFitColors.mutedText, fontSize: 12 },
  errorText: { color: KFitColors.error, fontSize: 11 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: KFitColors.accent,
  },
  saveText: { color: KFitColors.onAccent, fontSize: 14, fontWeight: "900" },
});
