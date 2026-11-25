import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export const AnimatedQuickAction = ({ action }: { action: any }) => {
  const [scaleAnim] = useState(() => new Animated.Value(1));

  return (
    <Animated.View
      style={{ transform: [{ scale: scaleAnim }], width: "33.33%" }}
    >
      <TouchableOpacity
        style={styles.actionItem}
        onPress={action.onPress}
        activeOpacity={0.8}
        onPressIn={() =>
          Animated.spring(scaleAnim, {
            toValue: 0.9,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
          }).start()
        }
      >
        {"center" in action ? (
          <View style={styles.centerCircle}>
            <Ionicons name="add" size={32} color="#000" />
          </View>
        ) : (
          <View
            style={[
              styles.actionCircle,
              action.danger && styles.actionCircleDanger,
            ]}
          >
            <MaterialCommunityIcons
              name={action.icon as any}
              size={26}
              color={action.danger ? "#EF4444" : "#FFD700"}
            />
          </View>
        )}
        <Text
          style={[styles.actionLabel, action.danger && { color: "#EF4444" }]}
        >
          {action.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  actionItem: { alignItems: "center", paddingHorizontal: 6, marginBottom: 24 },
  actionCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  actionCircleDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  centerCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#FFD700",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 14,
  },
});
