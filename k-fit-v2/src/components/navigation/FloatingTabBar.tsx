// components/navigation/FloatingTabBar.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, usePathname } from "expo-router";
import { memo, useEffect, useRef, useState } from "react";
import {
    Animated,
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CenterQRButton } from "../shared/CenterQRButton";
import { useSoundEffects } from "../shared/SoundEffectsProvider";

/* ------------------------------ Design tokens ----------------------------- */

const Theme = {
  surface: "rgba(18, 18, 18, 0.96)",
  border: "rgba(255, 255, 255, 0.08)",
  borderTop: "rgba(255, 255, 255, 0.14)",
  textInactive: "#9CA3AF",
  onAccent: "#000000",
  badge: "#EF4444",
  badgeText: "#FFFFFF",
};

const BAR_HEIGHT = 72;
const MAX_BAR_WIDTH = 520;
const CENTER_SLOT = 72;
const PILL_WIDTH = 60;
const PILL_HEIGHT = 32;
const ICON_SIZE = 22;
const BAR_PADDING = 8;
const BAR_BORDER = 1;
// Icon pill (32) + gap (4) + label (~12) = 48 → vertically centered in the bar
const CONTENT_TOP = (BAR_HEIGHT - 48) / 2;

/** Add this much bottom padding to scroll content so nothing hides behind the bar. */
export const BOTTOM_NAV_CLEARANCE = BAR_HEIGHT + 32;

/* --------------------------------- Types ---------------------------------- */

export type NavTab = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  route: string;
};

export type FloatingTabBarProps = {
  leftTabs: NavTab[];
  rightTabs: NavTab[];
  scanRoute: string;
  badges?: Partial<Record<string, number>>;
  accent?: string;
  /** "replace" swaps the current screen instead of stacking (used by admin). */
  navMode?: "navigate" | "replace";
};

const isOn = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

/* -------------------------------- Tab button ------------------------------- */

type TabButtonProps = {
  tab: NavTab;
  isActive: boolean;
  badge?: number;
  accent: string;
  onPress: () => void;
};

const TabButton = memo(function TabButton({
  tab,
  isActive,
  badge,
  accent,
  onPress,
}: TabButtonProps) {
  const [scale] = useState(() => new Animated.Value(1));

  const animateTo = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      stiffness: 500,
      damping: 28,
      mass: 0.6,
      useNativeDriver: true,
    }).start();

  const hasBadge = badge !== undefined && badge > 0;

  return (
    <Pressable
      style={styles.tabItem}
      onPress={onPress}
      onPressIn={() => animateTo(0.88)}
      onPressOut={() => animateTo(1)}
      hitSlop={{ top: 8, bottom: 8 }}
      accessibilityRole="tab"
      accessibilityLabel={hasBadge ? `${tab.label}, ${badge} new` : tab.label}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={{ alignItems: "center", transform: [{ scale }] }}>
        <View style={styles.iconBox}>
          <Ionicons
            name={isActive ? tab.activeIcon : tab.icon}
            size={ICON_SIZE}
            color={isActive ? Theme.onAccent : Theme.textInactive}
          />
          {hasBadge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
            </View>
          )}
        </View>
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            isActive && { color: accent, fontWeight: "800" },
          ]}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

/* ------------------------------- Main component ---------------------------- */

export function FloatingTabBar({
  leftTabs,
  rightTabs,
  scanRoute,
  badges,
  accent = "#FFD600",
  navMode = "navigate",
}: FloatingTabBarProps) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const playSound = useSoundEffects();

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const tabs = [...leftTabs, ...rightTabs];
  const activeIndex = tabs.findIndex((t) => isOn(pathname, t.route));

  // Computed from the window width, so the pill is positioned on the very
  // first frame instead of waiting for a layout pass.
  const barWidth = Math.min(width - 32, MAX_BAR_WIDTH);
  const rowWidth = barWidth - BAR_PADDING * 2 - BAR_BORDER * 2;
  const slotWidth = (rowWidth - CENTER_SLOT) / tabs.length;

  /* Sliding highlight */
  const [pillX] = useState(() => new Animated.Value(0));
  const [pillOpacity] = useState(() => new Animated.Value(0));
  const hasPlaced = useRef(false);

  useEffect(() => {
    if (activeIndex < 0) {
      Animated.timing(pillOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
      return;
    }

    const x =
      activeIndex * slotWidth +
      (activeIndex >= leftTabs.length ? CENTER_SLOT : 0) +
      (slotWidth - PILL_WIDTH) / 2;

    if (!hasPlaced.current) {
      // First render: appear in place, no slide-in or fade-in.
      pillX.setValue(x);
      pillOpacity.setValue(1);
      hasPlaced.current = true;
      return;
    }

    Animated.spring(pillX, {
      toValue: x,
      stiffness: 420,
      damping: 34,
      mass: 0.8,
      useNativeDriver: true,
    }).start();

    Animated.timing(pillOpacity, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, slotWidth, leftTabs.length, pillX, pillOpacity]);

  /* Hide while the keyboard is open */
  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardVisible) return null;

  const go = (route: string) => {
    if (isOn(pathname, route)) return;
    playSound("tap");
    Haptics.selectionAsync().catch(() => {});
    if (navMode === "replace") router.replace(route as any);
    else router.navigate(route as any);
  };

  const renderTab = (tab: NavTab) => (
    <TabButton
      key={tab.key}
      tab={tab}
      accent={accent}
      isActive={isOn(pathname, tab.route)}
      badge={badges?.[tab.key]}
      onPress={() => go(tab.route)}
    />
  );

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.navWrapper,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View
        accessibilityRole="tablist"
        style={[styles.bar, { width: Math.min(width - 32, MAX_BAR_WIDTH) }]}
      >
        <View style={styles.row}>
          {/* Sliding pill sits behind the icons */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              {
                backgroundColor: accent,
                opacity: pillOpacity,
                transform: [{ translateX: pillX }],
              },
            ]}
          />

          {leftTabs.map(renderTab)}

          <View style={styles.centerSlot}>
            <View style={styles.centerButton}>
              <CenterQRButton onPress={() => go(scanRoute)} />
            </View>
          </View>

          {rightTabs.map(renderTab)}
        </View>
      </View>
    </View>
  );
}

/* --------------------------------- Styles ---------------------------------- */

const styles = StyleSheet.create({
  navWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  bar: {
    height: BAR_HEIGHT,
    paddingHorizontal: BAR_PADDING,
    borderRadius: 28,
    backgroundColor: Theme.surface,
    borderWidth: BAR_BORDER,
    borderColor: Theme.border,
    borderTopColor: Theme.borderTop,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
    overflow: "visible",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  pill: {
    position: "absolute",
    top: CONTENT_TOP,
    left: 0,
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
  },
  tabItem: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBox: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: Theme.textInactive,
    letterSpacing: 0.2,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: Theme.badge,
    borderWidth: 2,
    borderColor: Theme.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: Theme.badgeText,
    fontSize: 9,
    fontWeight: "800",
  },
  centerSlot: {
    width: CENTER_SLOT,
    height: BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    position: "absolute",
    top: -22,
    alignItems: "center",
    justifyContent: "center",
  },
});
