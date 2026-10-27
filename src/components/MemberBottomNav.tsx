import { MEMBER_ROUTES as R } from "@/constants/member-routes";
import { KFitColors } from "@/constants/theme";
import { unseenCount, useChallengeStore } from "@/lib/challenges-store";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
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
  badge?: number;
};

/**
 * Bottom-nav: Progress · Workouts — [QR] — Instructor · Challenges
 * Payments/Profile/Membership live in the header avatar menu.
 * Check-in lives in the QR screen.
 */
const ALL_TABS: Tab[] = [
  { label: "Progress", icon: "activity", route: R.dashboard },
  { label: "Workouts", icon: "zap", route: R.workout },
  { label: "Instructor", icon: "user-check", route: R.instructors },
  { label: "Challenges", icon: "flag", route: R.challenges },
];

// Center QR button route.
const QR_ROUTE: string = R.qr;

// Dock: 2 left of QR, 2 right of QR.
const LEFT_ROUTES: string[] = [R.dashboard, R.workout];
const RIGHT_ROUTES: string[] = [R.instructors, R.challenges];

const pick = (routes: string[]) =>
  routes
    .map((r) => ALL_TABS.find((t) => t.route === r))
    .filter(Boolean) as Tab[];

const LEFT = pick(LEFT_ROUTES);
const RIGHT = pick(RIGHT_ROUTES);

// Slot order in the dock: [left..., QR spacer, right...]
const QR_SLOT = LEFT.length;
const SLOT_COUNT = LEFT.length + 1 + RIGHT.length;

const DOCK_PADDING = 6;
const QR_SIZE = 60;
const CORNER = 9;

let lastActiveSlot = 0;

function TabButton({
  label,
  icon,
  badge,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  badge?: number;
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
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={{ transform: [{ scale }, { translateY }] }}>
        <Feather name={icon} size={20} color={color} />
        {!!badge && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
          </View>
        )}
      </Animated.View>
      <Text
        style={[styles.label, { color }, active && styles.labelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function MemberBottomNav({
  activeRoute,
}: {
  activeRoute: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const store = useChallengeStore();
  const newChallenges = unseenCount(store, "member");

  const badgeFor = (route: string) =>
    route === R.challenges ? newChallenges : 0;

  const qrActive = activeRoute === QR_ROUTE;

  let activeSlot = -1;
  const leftIdx = LEFT.findIndex((t) => t.route === activeRoute);
  const rightIdx = RIGHT.findIndex((t) => t.route === activeRoute);
  if (leftIdx >= 0) activeSlot = leftIdx;
  else if (rightIdx >= 0) activeSlot = QR_SLOT + 1 + rightIdx;

  const [tabWidth, setTabWidth] = useState(0);
  const position = useRef(new Animated.Value(lastActiveSlot)).current;

  useEffect(() => {
    if (activeSlot < 0) return;
    Animated.timing(position, {
      toValue: activeSlot,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    lastActiveSlot = activeSlot;
  }, [activeSlot, position]);

  const onDockLayout = (e: LayoutChangeEvent) => {
    const inner = e.nativeEvent.layout.width - DOCK_PADDING * 2;
    setTabWidth(inner / SLOT_COUNT);
  };

  const translateX =
    tabWidth > 0
      ? position.interpolate({
          inputRange: [0, SLOT_COUNT - 1],
          outputRange: [0, (SLOT_COUNT - 1) * tabWidth],
        })
      : 0;

  const go = (route: string) => {
    void Haptics.selectionAsync();
    router.replace(route as any);
  };

  return (
    <View
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 8) + 4 }]}
      pointerEvents="box-none"
    >
      <View style={styles.qrWrap} pointerEvents="box-none">
        <Pressable
          onPress={() => {
            if (qrActive) return;
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.replace(QR_ROUTE as any);
          }}
          style={({ pressed }) => [
            styles.qrOuter,
            qrActive && styles.qrOuterActive,
            pressed && styles.qrPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open my QR code"
        >
          <View style={styles.qrInner}>
            <View style={[styles.qrCorner, styles.qrCornerTL]} />
            <View style={[styles.qrCorner, styles.qrCornerTR]} />
            <View style={[styles.qrCorner, styles.qrCornerBL]} />
            <View style={[styles.qrCorner, styles.qrCornerBR]} />
            <Ionicons name="qr-code" size={24} color={KFitColors.onAccent} />
          </View>
        </Pressable>
      </View>

      <View
        style={styles.dock}
        onLayout={onDockLayout}
        accessibilityRole="tablist"
      >
        {tabWidth > 0 && activeSlot >= 0 && (
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

        {LEFT.map((tab) => (
          <TabButton
            key={tab.route}
            label={tab.label}
            icon={tab.icon}
            badge={tab.badge ?? badgeFor(tab.route)}
            active={tab.route === activeRoute}
            onPress={() => tab.route !== activeRoute && go(tab.route)}
          />
        ))}

        <View style={styles.tab} pointerEvents="none" />

        {RIGHT.map((tab) => (
          <TabButton
            key={tab.route}
            label={tab.label}
            icon={tab.icon}
            badge={tab.badge ?? badgeFor(tab.route)}
            active={tab.route === activeRoute}
            onPress={() => tab.route !== activeRoute && go(tab.route)}
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
    paddingTop: QR_SIZE / 2 + 2,
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
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },
  labelActive: { fontWeight: "800" },
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

  qrWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 40,
    elevation: 20,
  },
  qrOuter: {
    width: QR_SIZE,
    height: QR_SIZE,
    borderRadius: QR_SIZE / 2,
    borderWidth: 4,
    borderColor: KFitColors.background,
    backgroundColor: KFitColors.background,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
  },
  qrOuterActive: { borderColor: KFitColors.accent },
  qrPressed: { transform: [{ scale: 0.94 }] },
  qrInner: {
    flex: 1,
    borderRadius: QR_SIZE / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent,
  },
  qrCorner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: KFitColors.onAccent,
    opacity: 0.85,
  },
  qrCornerTL: {
    top: 11,
    left: 11,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 3,
  },
  qrCornerTR: {
    top: 11,
    right: 11,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 3,
  },
  qrCornerBL: {
    bottom: 11,
    left: 11,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 3,
  },
  qrCornerBR: {
    bottom: 11,
    right: 11,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 3,
  },
});
