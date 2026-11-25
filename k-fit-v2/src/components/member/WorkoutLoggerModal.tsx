// src/components/member/WorkoutLoggerModal.tsx
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { ModalSheet } from "@/components/shared/ModalSheet";

interface WorkoutLoggerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (workout: {
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }) => Promise<boolean>;
}

export const WorkoutLoggerModal = ({
  visible,
  onClose,
  onSave,
}: WorkoutLoggerModalProps) => {
  const [name, setName] = useState("Incline Dumbbell Press");
  const [sets, setSets] = useState("4");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("30");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage("Enter an exercise name before saving.");
      return;
    }

    const setsValue = Number(sets);
    const repsValue = Number(reps);
    const weightValue = Number(weight);
    if (
      !Number.isInteger(setsValue) ||
      setsValue <= 0 ||
      !Number.isInteger(repsValue) ||
      repsValue <= 0 ||
      !Number.isFinite(weightValue) ||
      weightValue < 0
    ) {
      setErrorMessage("Enter valid sets, reps, and a non-negative weight.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const saved = await onSave({
        name: name.trim(),
        sets: setsValue,
        reps: repsValue,
        weight: weightValue,
      });
      if (!saved) {
        setErrorMessage("Workout was not saved. Please try again.");
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Failed to save workout:", error);
      setErrorMessage("Workout was not saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>TRAINING LOG</Text>
          <Text style={styles.title}>LOG WORKOUT SET</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Exercise Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#555"
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Sets</Text>
              <TextInput
                style={styles.input}
                value={sets}
                onChangeText={setSets}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.label}>Reps</Text>
              <TextInput
                style={styles.input}
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>
          </View>

          {errorMessage && (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving
                ? "Saving..."
                : `Save Set (+${(
                    Number(sets) *
                    Number(reps) *
                    Number(weight)
                  ).toLocaleString()} kg)`}
            </Text>
          </TouchableOpacity>
    </ModalSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  eyebrow: { fontSize: 10, color: "#9CA3AF", fontWeight: "800", letterSpacing: 1.4, marginBottom: 4 },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFD700",
    letterSpacing: 1,
  },
  closeButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#333", alignItems: "center", justifyContent: "center" },
  label: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#0B0B0D",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 14,
    color: "#FFF",
    fontSize: 14,
    marginBottom: 16,
  },
  row: { flexDirection: "row", marginBottom: 8 },
  saveBtn: {
    backgroundColor: "#FFD700",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#000", fontWeight: "900", fontSize: 14 },
  errorMessage: {
    color: "#EF4444",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
});
