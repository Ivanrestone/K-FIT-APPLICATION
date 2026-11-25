import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { createElement, useEffect, useState } from "react";
import { useSoundEffects } from "@/components/shared/SoundEffectsProvider";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Theme = {
  background: "#080808",
  surface: "#121212",
  surfaceHigh: "#1A1A1A",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD700",
  accentText: "#000000",
  error: "#EF4444",
  border: "#222222",
};

const webInputStyle = {
  padding: 14,
  fontSize: 15,
  border: "1px solid #222222",
  borderRadius: 12,
  width: "100%",
  boxSizing: "border-box" as const,
  backgroundColor: "#080808",
  color: "#FFFFFF",
};

// --- Custom Date Input ---
function DateInput({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (v: string) => void;
}) {
  if (Platform.OS === "web") {
    return createElement("input", {
      type: "date",
      value,
      onChange: (e: any) => onChangeText(e.target.value),
      style: webInputStyle,
    });
  }
  return (
    <TextInput
      style={styles.input}
      placeholder="YYYY-MM-DD"
      placeholderTextColor="#555"
      value={value}
      onChangeText={onChangeText}
    />
  );
}

// --- Custom Time Input ---
function TimeInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  if (Platform.OS === "web") {
    return createElement("input", {
      type: "time",
      value,
      onChange: (e: any) => onChangeText(e.target.value),
      style: webInputStyle,
    });
  }
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#555"
      value={value}
      onChangeText={onChangeText}
    />
  );
}

export default function ScheduleAppointmentScreen() {
  const playSound = useSoundEffects();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const params = useLocalSearchParams<{
    member_id?: string | string[];
    member_name?: string | string[];
    appointment_id?: string | string[];
    appointment_date?: string | string[];
    start_time?: string | string[];
    end_time?: string | string[];
    notes?: string | string[];
  }>();
  const appointmentId =
    typeof params.appointment_id === "string" ? params.appointment_id : "";
  const memberId =
    typeof params.member_id === "string" ? params.member_id : "";
  const memberName =
    typeof params.member_name === "string" ? params.member_name : "your client";

  const [appointmentDate, setAppointmentDate] = useState(
    typeof params.appointment_date === "string" ? params.appointment_date : "",
  );
  const [appointmentTime, setAppointmentTime] = useState(
    typeof params.start_time === "string" ? params.start_time : "",
  );
  const [endTime, setEndTime] = useState(
    typeof params.end_time === "string" ? params.end_time : "",
  );
  const [notes, setNotes] = useState(
    typeof params.notes === "string" ? params.notes : "",
  );

  const [fadeAnim] = useState(() => new Animated.Value(0));

  const checkAuth = async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
    } else {
      const role = currentUser?.user_metadata?.role || "member";
      if (role !== "coach") {
        if (role === "admin") router.replace("/admin/dashboard");
        else if (role === "member") router.replace("/member/dashboard");
        else router.replace("/login");
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    }
  };

  const handleSchedule = async () => {
    if (!memberId || !user?.id) {
      playSound("warning");
      Alert.alert("Select a client", "Choose an active client to schedule.");
      return;
    }

    if (!appointmentDate || !appointmentTime || !endTime) {
      playSound("warning");
      Alert.alert(
        "Missing Details",
        "Please fill in the date and both time fields.",
      );
      return;
    }

    const startDate = new Date(`${appointmentDate}T${appointmentTime}:00`);
    const endDate = new Date(`${appointmentDate}T${endTime}:00`);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      playSound("warning");
      Alert.alert("Invalid", "The date or time format is invalid.");
      return;
    }
    if (startDate.getTime() <= Date.now()) {
      playSound("warning");
      Alert.alert("Invalid date", "Choose a future date and start time.");
      return;
    }
    if (endDate <= startDate) {
      playSound("warning");
      Alert.alert(
        "Invalid session time",
        "The end time must be later than the start time on the selected date.",
      );
      return;
    }

    setProcessing(true);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient() as any;

      const startDateTime = startDate.toISOString();
      const endDateTime = endDate.toISOString();
      const { error } = appointmentId
        ? await supabase.rpc("manage_coach_appointment", {
            p_appointment_id: appointmentId,
            p_action: "reschedule",
            p_starts_at: startDateTime,
            p_ends_at: endDateTime,
            p_notes: notes,
          })
        : await supabase.rpc("create_coach_appointment", {
            p_member_id: memberId,
            p_starts_at: startDateTime,
            p_ends_at: endDateTime,
            p_notes: notes,
          });

      if (error) {
        console.error("Error saving appointment:", error);
        playSound("warning");
        Alert.alert(
          "Unable to save session",
          error.code === "23P01"
            ? "The coach or member already has a session during that time."
            : error.message ||
                "Apply migration 20261125000000_coach_portal.sql and try again.",
        );
      } else {
        playSound("success");
        router.replace("/coach/appointments");
      }
    } catch (error: any) {
      console.error("Exception in schedule:", error);
      playSound("warning");
      Alert.alert("Error", error.message || "Failed to schedule appointment");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading Form...</Text>
      </View>
    );
  }

  if (!memberId) {
    return (
      <View style={[styles.container, styles.missingClientContainer]}>
        <MaterialCommunityIcons
          name="account-alert-outline"
          size={44}
          color={Theme.accent}
        />
        <Text style={styles.missingClientTitle}>Choose a client first</Text>
        <Text style={styles.missingClientText}>
          Select an active client before creating a session.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/coach/clients")}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Go to clients</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.replace(
                appointmentId ? "/coach/appointments" : "/coach/clients",
              )
            }
          >
            <Ionicons name="arrow-back" size={20} color={Theme.accent} />
            <Text style={styles.backButtonText}>
              {appointmentId ? "Back to Appointments" : "Back to Clients"}
            </Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {appointmentId ? "Reschedule Session" : "Schedule Session"}
            </Text>
            <Text style={styles.subtitle}>For {memberName}</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formSection}>
            {/* Date */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={Theme.accent}
                />
                <Text style={styles.label}>Date</Text>
              </View>
              <DateInput
                value={appointmentDate}
                onChangeText={setAppointmentDate}
              />
            </View>

            {/* Times */}
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.labelRow}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={Theme.accent}
                  />
                  <Text style={styles.label}>Start Time</Text>
                </View>
                <TimeInput
                  value={appointmentTime}
                  onChangeText={setAppointmentTime}
                  placeholder="09:00"
                />
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.labelRow}>
                  <Ionicons name="time" size={16} color={Theme.accent} />
                  <Text style={styles.label}>End Time</Text>
                </View>
                <TimeInput
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="10:00"
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <MaterialCommunityIcons
                  name="text-box-outline"
                  size={16}
                  color={Theme.accent}
                />
                <Text style={styles.label}>Notes (Optional)</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g. Focus on leg day, bring resistance bands"
                placeholderTextColor="#555"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, processing && { opacity: 0.7 }]}
              onPress={handleSchedule}
              disabled={processing}
              activeOpacity={0.85}
            >
              {processing ? (
                <ActivityIndicator size="small" color={Theme.accentText} />
              ) : (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Theme.accentText}
                />
              )}
              <Text style={styles.buttonText}>
                {processing
                  ? "Saving..."
                  : appointmentId
                    ? "Save new time"
                    : "Confirm Appointment"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Footer */}
          <View style={styles.infoSection}>
            <Ionicons
              name="information-circle"
              size={20}
              color={Theme.textMuted}
            />
            <Text style={styles.infoText}>
              Session conflicts are checked by the database before saving.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  scrollContent: { padding: 20, paddingTop: 16, paddingBottom: 120 },
  loadingText: { color: Theme.accent, fontWeight: "600", marginTop: 12 },

  // Header
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  backButtonText: { fontSize: 14, fontWeight: "600", color: Theme.accent },
  header: { marginBottom: 24 },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 13, color: Theme.textMuted, marginTop: 4 },

  // Form
  missingClientContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 12,
  },
  missingClientTitle: {
    color: Theme.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  missingClientText: {
    color: Theme.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 8,
  },
  formSection: {
    backgroundColor: Theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 20,
    marginBottom: 20,
  },
  fieldGroup: { marginBottom: 20 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  timeRow: { flexDirection: "row", gap: 12, marginBottom: 20 },

  input: {
    backgroundColor: Theme.background,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: Theme.text,
  },
  textArea: { height: 100, textAlignVertical: "top" },

  // Button
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Theme.accent,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
  },
  buttonText: { color: Theme.accentText, fontSize: 16, fontWeight: "800" },

  // Info Footer
  infoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  infoText: { flex: 1, fontSize: 13, color: Theme.textMuted, lineHeight: 18 },
});
