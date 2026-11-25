import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSoundEffects } from "../shared/SoundEffectsProvider";

type Action = {
  label: string;
  onPress: () => void;
} & (
  | { center: true }
  | {
      center?: false;
      icon: keyof typeof MaterialCommunityIcons.glyphMap;
    }
);

export function AnimatedQuickAction({ action }: { action: Action }) {
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const playSound = useSoundEffects();

  const animateScale = (toValue: number) => {
    Animated.spring(scaleAnim, {
      toValue,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      style={styles.actionItem}
      onPressIn={() => animateScale(0.94)}
      onPressOut={() => animateScale(1)}
      onPress={() => {
        playSound("tap");
        action.onPress();
      }}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={action.label}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {"center" in action ? (
          <View style={styles.centerCircle}>
            <Ionicons name="qr-code-outline" size={28} color="#000" />
          </View>
        ) : (
          <View style={styles.actionCircle}>
            <MaterialCommunityIcons
              name={action.icon}
              size={24}
              color="#FFD700"
            />
          </View>
        )}
      </Animated.View>
      <Text style={styles.actionLabel} numberOfLines={2}>
        {action.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionItem: {
    width: "33.33%",
    alignItems: "center",
    paddingHorizontal: 6,
    marginBottom: 16,
  },
  actionCircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  centerCircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#FFD700",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D1D5DB",
    textAlign: "center",
    lineHeight: 14,
  },
});
