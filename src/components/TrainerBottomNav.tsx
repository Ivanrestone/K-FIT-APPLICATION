import { KFitColors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Tab = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
  /** Optional count shown as a small red badge. */
  badge?: number;
};

/**
 * Edit this list to change the tabs. Every route must be a file in app/.
 * These are all TRAINER screens, so tapping a tab never lands on an admin page.
 */
const TABS: Tab[] = [
  { label: "Home", icon: "trending-up", route: "/trainer-dashboard" },
  { label: "Trainers", icon: "user-check", route: "/trainer-team" },
  { label: "Ranks", icon: "award", route: "/trainer-ranks" },
  { label: "POS", icon: "shopping-cart", route: "/trainer-pos" },
  { label: "Roster", icon: "users", route: "/trainer-roster" },
];

const DOCK_PADDING = 6;

// Remember the last active tab so the highlight slides from the previous
// tab to the new one, even though each screen mounts its own bar.
let lastActiveIndex = 0;

function TabButton({
  tab,
  active,
  onPress,
}: {
  tab: Tab;
  active: boolean;
  onPress: () => void;
}) {
  const lift = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(lift, {
      toValue: active ? 1 : 0,
      friction: 6,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [active, lift]);

  const scale = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const translateY = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });
  const color = active ? KFitColors.accent : KFitColors.mutedText;

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={{ transform: [{ scale }, { translateY }] }}>
        <Feather name={tab.icon} size={20} color={color} />
        {!!tab.badge && tab.badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {tab.badge > 9 ? "9+" : tab.badge}
            </Text>
          </View>
        )}
      </Animated.View>
      <Text style={[styles.label, { color }, active && styles.labelActive]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

export default function TrainerBottomNav({
  activeRoute,
}: {
  activeRoute: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const activeIndex = TABS.findIndex((t) => t.route === activeRoute);
  const [tabWidth, setTabWidth] = useState(0);

  // Position in "tab index" units; starts where the previous screen left off
  const position = useRef(new Animated.Value(lastActiveIndex)).current;

  useEffect(() => {
    if (activeIndex < 0) return;
    Animated.timing(position, {
      toValue: activeIndex,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    lastActiveIndex = activeIndex;
  }, [activeIndex, position]);

  const onDockLayout = (e: LayoutChangeEvent) => {
    const inner = e.nativeEvent.layout.width - DOCK_PADDING * 2;
    setTabWidth(inner / TABS.length);
  };

  const translateX =
    tabWidth > 0
      ? position.interpolate({
          inputRange: [0, TABS.length - 1],
          outputRange: [0, (TABS.length - 1) * tabWidth],
        })
      : 0;

  return (
    <View
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 8) + 4 }]}
      pointerEvents="box-none"
    >
      <View
        style={styles.dock}
        onLayout={onDockLayout}
        accessibilityRole="tablist"
      >
        {/* Sliding highlight */}
        {tabWidth > 0 && activeIndex >= 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              { width: tabWidth, transform: [{ translateX }] },
            ]}
          >
            <View style={styles.indicatorBar} />
          </Animated.View>
        )}

        {TABS.map((tab, i) => (
          <TabButton
            key={tab.route}
            tab={tab}
            active={i === activeIndex}
            onPress={() => {
              if (i === activeIndex) return;
              void Haptics.selectionAsync();
              router.replace(tab.route as any);
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  dock: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 420,
    padding: DOCK_PADDING,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(26,26,26,0.97)",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  indicator: {
    position: "absolute",
    left: DOCK_PADDING,
    top: DOCK_PADDING,
    bottom: DOCK_PADDING,
    borderRadius: 18,
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
    alignItems: "center",
  },
  indicatorBar: {
    position: "absolute",
    top: -1,
    width: 22,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: KFitColors.accent,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  labelActive: {
    fontWeight: "800",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: KFitColors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#000", fontSize: 8, fontWeight: "900" },
});
