import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect } from "react";
import { useSoundEffects } from "./SoundEffectsProvider";

export type StatusModalType = "success" | "error" | "warning" | "info" | "loading";

type StatusModalProps = {
  visible: boolean;
  type?: StatusModalType;
  title: string;
  message: string;
  buttonText?: string;
  secondaryButtonText?: string;
  onPress?: () => void;
  onSecondaryPress?: () => void;
  onRequestClose?: () => void;
};

const palette = {
  success: { color: "#10B981", soft: "rgba(16,185,129,0.12)", icon: "checkmark" as const },
  error: { color: "#EF4444", soft: "rgba(239,68,68,0.12)", icon: "close" as const },
  warning: { color: "#F59E0B", soft: "rgba(245,158,11,0.12)", icon: "alert" as const },
  info: { color: "#3B82F6", soft: "rgba(59,130,246,0.12)", icon: "information" as const },
  loading: { color: "#FFD700", soft: "rgba(255,215,0,0.12)", icon: "hourglass" as const },
};

export function StatusModal({
  visible,
  type = "info",
  title,
  message,
  buttonText = "OK",
  secondaryButtonText,
  onPress,
  onSecondaryPress,
  onRequestClose,
}: StatusModalProps) {
  const status = palette[type];
  const dismissible = type !== "loading";
  const playSound = useSoundEffects();

  useEffect(() => {
    if (!visible) return;
    if (type === "success") playSound("success");
    else if (type === "error" || type === "warning") playSound("warning");
  }, [playSound, type, visible]);

  const close = () => {
    if (dismissible) {
      playSound("tap");
      onRequestClose?.();
    }
  };

  const pressPrimary = () => {
    playSound("tap");
    onPress?.();
  };

  const pressSecondary = () => {
    playSound("tap");
    onSecondaryPress?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />

        <View style={styles.card}>
          <View style={styles.topLine} />
          <View
            style={[
              styles.iconOuter,
              { backgroundColor: status.soft, borderColor: `${status.color}55` },
            ]}
          >
            {type === "loading" ? (
              <ActivityIndicator size="large" color={status.color} />
            ) : (
              <Ionicons name={status.icon} size={34} color={status.color} />
            )}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {secondaryButtonText ? (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={pressSecondary}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: status.color }]}
                onPress={pressPrimary}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>{buttonText}</Text>
              </TouchableOpacity>
            </View>
          ) : type !== "loading" ? (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                styles.fullButton,
                { backgroundColor: status.color },
              ]}
              onPress={pressPrimary}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{buttonText}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.82)",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    backgroundColor: "#121212",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#2B2B2B",
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 24,
  },
  topLine: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3A3A3A",
    marginBottom: 22,
  },
  iconOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  message: {
    color: "#A7ADB7",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 22,
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  fullButton: {
    width: "100%",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#353535",
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#D1D5DB",
    fontSize: 15,
    fontWeight: "800",
  },
});
