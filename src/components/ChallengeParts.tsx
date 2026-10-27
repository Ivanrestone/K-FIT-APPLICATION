import { KFitColors } from "@/constants/theme";
import {
    ChallengeInput,
    LEADERBOARD,
    parseChallengeInput,
} from "@/lib/challenges-store";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export function ProgressBar({
  value,
  height = 8,
}: {
  value: number;
  height?: number;
}) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <View style={[s.track, { height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: height / 2,
          backgroundColor: KFitColors.accent,
        }}
      />
    </View>
  );
}

export function Leaderboard() {
  return (
    <View style={{ gap: 8 }}>
      {LEADERBOARD.map((l) => (
        <View key={l.rank} style={s.leaderRow}>
          <View style={s.leaderLeft}>
            <View style={s.badgeBox}>
              <Text style={s.badgeText}>{l.badge}</Text>
            </View>
            <View>
              <Text style={s.leaderName}>{l.name}</Text>
              <Text style={s.leaderSub}>
                {l.points.toLocaleString()} XP earned
              </Text>
            </View>
          </View>
          <Text style={s.leaderPct}>{l.pct}%</Text>
        </View>
      ))}
    </View>
  );
}

export function ChallengeFormModal({
  visible,
  heading,
  note,
  submitLabel,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  heading: string;
  note?: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (value: ChallengeInput) => void;
}) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [points, setPoints] = useState("500");
  const [days, setDays] = useState("14");
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    onClose();
  };

  const submit = () => {
    const result = parseChallengeInput({ title, target, points, days });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSubmit(result.value);
    setTitle("");
    setTarget("");
    setPoints("500");
    setDays("14");
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Pressable style={s.backdrop} onPress={close}>
          <Pressable style={s.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{heading}</Text>
              <Pressable
                onPress={close}
                hitSlop={10}
                accessibilityLabel="Close"
              >
                <Feather name="x" size={18} color={KFitColors.mutedText} />
              </Pressable>
            </View>
            {note ? <Text style={s.note}>{note}</Text> : null}

            <Text style={s.label}>TITLE</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. 50km Running Sprint"
              placeholderTextColor={KFitColors.mutedText}
              style={s.input}
            />

            <Text style={s.label}>TARGET</Text>
            <TextInput
              value={target}
              onChangeText={setTarget}
              placeholder="e.g. 50 km total distance"
              placeholderTextColor={KFitColors.mutedText}
              style={s.input}
            />

            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>REWARD (XP)</Text>
                <TextInput
                  value={points}
                  onChangeText={setPoints}
                  keyboardType="number-pad"
                  placeholderTextColor={KFitColors.mutedText}
                  style={s.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>DURATION (DAYS)</Text>
                <TextInput
                  value={days}
                  onChangeText={setDays}
                  keyboardType="number-pad"
                  placeholderTextColor={KFitColors.mutedText}
                  style={s.input}
                />
              </View>
            </View>

            {error ? (
              <Text style={s.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}

            <Pressable
              onPress={submit}
              style={({ pressed }) => [s.submit, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
            >
              <Text style={s.submitText}>{submitLabel}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  track: {
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    overflow: "hidden",
  },
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
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: KFitColors.accent, fontSize: 14, fontWeight: "700" },
  leaderName: { color: KFitColors.text, fontSize: 14, fontWeight: "700" },
  leaderSub: { color: KFitColors.mutedText, fontSize: 11, marginTop: 1 },
  leaderPct: { color: KFitColors.accent, fontSize: 14, fontWeight: "800" },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 18,
    padding: 20,
    gap: 6,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { color: KFitColors.text, fontSize: 17, fontWeight: "800" },
  note: {
    color: KFitColors.mutedText,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  label: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: KFitColors.text,
    fontSize: 14,
  },
  twoCol: { flexDirection: "row", gap: 10 },
  error: { color: KFitColors.error, fontSize: 13, marginTop: 8 },
  submit: {
    backgroundColor: KFitColors.accent,
    borderRadius: 12,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  submitText: { color: KFitColors.onAccent, fontSize: 14, fontWeight: "800" },
});
