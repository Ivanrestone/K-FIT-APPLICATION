import { KFitColors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
  /** Override what the "+" button does. Defaults to opening /members. */
  onAddPress?: () => void;
};

export default function AppHeader({ onAddPress }: Props) {
  const router = useRouter();

  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(null);
  };

  const dispatchBroadcast = () => {
    const message = broadcastText.trim() || "Gym floor closing in 30 minutes.";
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowBroadcast(false);
    setBroadcastText("");

    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  return (
    <View>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>K</Text>
          </View>
          <View style={styles.headerText}>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>KFIT ADMIN</Text>
              <View style={styles.versionBadge}>
                <Text style={styles.versionBadgeText}>POS V3.0</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>GYM MANAGEMENT</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Compose push alert"
            style={styles.broadcastButton}
            onPress={() => setShowBroadcast(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.broadcastEmoji}>📢</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open races and challenges"
            style={styles.broadcastButton}
            onPress={() => router.push("/challenges" as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.broadcastEmoji}>🏆</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Add member"
            style={styles.addButton}
            onPress={onAddPress ?? (() => router.push("/members" as any))}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Live push alert banner (sits under the header so it never gets clipped) */}
      {toastMessage && (
        <View style={styles.toast}>
          <View style={styles.toastIcon}>
            <Text style={styles.toastIconText}>📢</Text>
          </View>
          <View style={styles.toastBody}>
            <View style={styles.toastHeaderRow}>
              <Text style={styles.toastLabel}>LIVE PUSH ALERT</Text>
              <Text style={styles.toastTime}>Just now</Text>
            </View>
            <Text style={styles.toastMessage}>{toastMessage}</Text>
          </View>
          <TouchableOpacity
            onPress={dismissToast}
            accessibilityRole="button"
            accessibilityLabel="Dismiss alert"
            hitSlop={10}
          >
            <Feather name="x" size={16} color={KFitColors.mutedText} />
          </TouchableOpacity>
        </View>
      )}

      {/* Push alert composer */}
      <Modal
        visible={showBroadcast}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBroadcast(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📢 Dispatch Push Alert</Text>
              <TouchableOpacity
                onPress={() => setShowBroadcast(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={10}
              >
                <Feather name="x" size={18} color={KFitColors.mutedText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalFieldLabel}>BROADCAST CONTENT:</Text>
            <TextInput
              style={styles.modalInput}
              value={broadcastText}
              onChangeText={setBroadcastText}
              placeholder="Type notification message..."
              placeholderTextColor={KFitColors.mutedText}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={dispatchBroadcast}
              activeOpacity={0.8}
            >
              <Text style={styles.modalPrimaryText}>Dispatch Push Banner</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: KFitColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
    gap: 10,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    elevation: 3,
  },
  brandIconText: {
    color: KFitColors.onAccent,
    fontSize: 16,
    fontWeight: "900",
  },
  headerText: { flex: 1, minWidth: 0 },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  brandTitle: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  versionBadge: {
    backgroundColor: KFitColors.accent + "33",
    borderWidth: 1,
    borderColor: KFitColors.accent + "66",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  versionBadgeText: {
    color: KFitColors.accent,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  brandSubtitle: {
    color: KFitColors.mutedText,
    fontSize: 10,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  broadcastButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  broadcastEmoji: { fontSize: 14 },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  addButtonText: {
    color: KFitColors.onAccent,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 20,
  },

  toast: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    margin: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.surface,
  },
  toastIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  toastIconText: { fontSize: 18 },
  toastBody: { flex: 1, minWidth: 0 },
  toastHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toastLabel: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  toastTime: { color: KFitColors.mutedText, fontSize: 10 },
  toastMessage: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    gap: 12,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { color: KFitColors.text, fontSize: 14, fontWeight: "800" },
  modalFieldLabel: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  modalInput: {
    minHeight: 84,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    padding: 10,
    color: KFitColors.text,
    fontSize: 13,
  },
  modalPrimaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
  },
  modalPrimaryText: {
    color: KFitColors.onAccent,
    fontSize: 13,
    fontWeight: "800",
  },
});
