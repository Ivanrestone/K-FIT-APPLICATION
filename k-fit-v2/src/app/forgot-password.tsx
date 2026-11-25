// app/forgot-password.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useSoundEffects } from "@/components/shared/SoundEffectsProvider";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const playSound = useSoundEffects();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      playSound("warning");
      Alert.alert("Error", "Please enter your email");
      return;
    }

    setLoading(true);
    const { resetPassword } = await import("@/lib/auth");
    const result = await resetPassword(email);
    setLoading(false);

    if (result.success) {
      playSound("success");
      Alert.alert("Success", "Password reset email sent");
      router.replace("/login");
    } else {
      playSound("warning");
      Alert.alert("Error", result.error || "Reset password failed");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#f0d995" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={40} color="#f0d995" />
        </View>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we&apos;ll send you a link to get back into your
          account.
        </Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#8a8a8f"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "SENDING..." : "SEND RESET LINK"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const GOLD_BORDER = "#c8aa68";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    padding: 24,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 24,
    zIndex: 10,
    padding: 8,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(240, 217, 149, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(240, 217, 149, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    color: "#e1c991",
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 12,
  },
  subtitle: {
    color: "#8a8a8f",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  inputWrapper: {
    width: "100%",
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    borderRadius: 8,
    backgroundColor: "rgba(38, 40, 39, 0.85)",
    marginBottom: 24,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: "#f0d995",
    fontSize: 15,
  },
  button: {
    width: "100%",
    backgroundColor: "#b9842d",
    borderWidth: 1,
    borderColor: "#e6c879",
    borderRadius: 13,
    paddingVertical: 16,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#6b5626",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
});
