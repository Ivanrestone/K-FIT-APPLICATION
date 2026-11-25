// src/components/member/GatePassModal.tsx
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ModalSheet } from "@/components/shared/ModalSheet";

interface GatePassModalProps {
  visible: boolean;
  onClose: () => void;
  onCheckIn: (method: string) => void;
  isCheckedIn: boolean;
}

export const GatePassModal = ({
  visible,
  onClose,
  onCheckIn,
  isCheckedIn,
}: GatePassModalProps) => {
  const [pin, setPin] = useState("849-210");
  const [seconds, setSeconds] = useState(30);

  // Animated countdown for the Door PIN
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setPin(
            `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`,
          );
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>K-FIT ACCESS</Text>
          <Text style={styles.title}>SMART GATE PASS</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.qrBox}>
        <Ionicons name="qr-code" size={150} color="#000" />
      </View>

      <View style={styles.pinContainer}>
        <View>
          <Text style={styles.pinLabel}>BACKUP DOOR PIN</Text>
          <Text style={styles.pinText}>{pin}</Text>
        </View>
        <View style={styles.countdownPill}>
          <Ionicons name="time-outline" size={14} color="#FFD700" />
          <Text style={styles.countdown}>{seconds}s</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            onCheckIn("QR Gate");
            onClose();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>
            {isCheckedIn ? "Checked In ✓" : "Scan QR Entry"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            onCheckIn(`PIN (${pin})`);
            onClose();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Use PIN</Text>
        </TouchableOpacity>
      </View>
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
  qrBox: {
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: 24,
    alignSelf: "center",
    marginBottom: 24,
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  pinLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "700" },
  pinText: {
    fontSize: 20,
    color: "#FFF",
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 4,
  },
  countdownPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,215,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.18)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  countdown: { fontSize: 12, color: "#FFD700", fontWeight: "700" },
  actions: { flexDirection: "row", gap: 12 },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#FFD700",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryBtnText: { color: "#000", fontWeight: "900", fontSize: 14 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  secondaryBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
});
