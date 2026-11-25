import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { useSoundEffects } from "./SoundEffectsProvider";
import {
    Animated,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export const NAV_COLORS = {
  gold: "#FFD700",
  goldSoft: "rgba(255, 215, 0, 0.14)",
  onGold: "#111111",
  inactive: "#9A968C",
  barBackground: "#121212",
  badge: "#EF4444",
};

type IconName = keyof typeof Ionicons.glyphMap;

type NavItemProps = {
  label: string;
  icon: IconName;
  activeIcon: IconName;
  isActive: boolean;
  onPress: () => void;
  badge?: number;
};

export function NavItem({
  label,
  icon,
  activeIcon,
  isActive,
  onPress,
  badge,
}: NavItemProps) {
  const [progress] = useState(() => new Animated.Value(isActive ? 1 : 0));
  const playSound = useSoundEffects();

  useEffect(() => {
    Animated.spring(progress, {
      toValue: isActive ? 1 : 0,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [isActive, progress]);

  const pillScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });
  const iconLift = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });

  const showBadge = typeof badge === "number" && badge > 0;

  return (
    <Pressable
      onPress={() => {
        if (!isActive) {
          playSound("tap");
          void Haptics.selectionAsync();
        }
        onPress();
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={showBadge ? `${label}, ${badge} new` : label}
      hitSlop={{ top: 6, bottom: 6 }}
      // FIXED: Changed null to undefined
      android_ripple={undefined}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <View style={styles.iconSlot}>
        {/* Soft gold glow behind the active icon */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            { opacity: progress, transform: [{ scale: pillScale }] },
          ]}
        />
        {/* Solid gold pill */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pill,
            { opacity: progress, transform: [{ scale: pillScale }] },
          ]}
        />
        <Animated.View style={{ transform: [{ translateY: iconLift }] }}>
          <Ionicons
            name={isActive ? activeIcon : icon}
            size={22}
            color={isActive ? NAV_COLORS.onGold : NAV_COLORS.inactive}
          />
        </Animated.View>

        {showBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </View>

      <Text
        style={[styles.label, isActive && styles.labelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const webReset =
  Platform.OS === "web"
    ? ({
        outlineColor: NAV_COLORS.gold,
        WebkitTapHighlightColor: "transparent",
      } as object)
    : null;

const styles = StyleSheet.create({
  item: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    ...(webReset ?? {}),
  },
  pressed: { opacity: 0.7 },
  iconSlot: {
    width: 56,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 64,
    height: 40,
    borderRadius: 20,
    backgroundColor: NAV_COLORS.goldSoft,
  },
  pill: {
    // FIXED: Changed absoluteFillObject to absoluteFill
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
    backgroundColor: NAV_COLORS.gold,
    shadowColor: NAV_COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: NAV_COLORS.inactive,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: NAV_COLORS.gold,
    fontWeight: "800",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NAV_COLORS.badge,
    borderWidth: 2,
    borderColor: NAV_COLORS.barBackground,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },
});
