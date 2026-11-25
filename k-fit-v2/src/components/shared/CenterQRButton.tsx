import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSoundEffects } from "./SoundEffectsProvider";

type CenterQRButtonProps = {
  onPress: () => void;
};

export function CenterQRButton({ onPress }: CenterQRButtonProps) {
  const playSound = useSoundEffects();

  return (
    <TouchableOpacity
      style={styles.centerNavButton}
      onPress={() => {
        playSound("tap");
        onPress();
      }}
      activeOpacity={0.8}
    >
      <View style={styles.centerButtonInner}>
        <Ionicons name="qr-code" size={28} color="#000000" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  centerNavButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30, // Perfectly circular
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",

    // The dark border creates the floating effect
    borderWidth: 4,
    borderColor: "#121212",

    // Neon Glow Shadow
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
});
