import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  Easing,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type TurnstileEvent = {
  id: string;
  memberName: string;
  gate: string;
  direction: "IN" | "OUT";
  timestamp: string;
};

type FeatherIconName = keyof typeof Feather.glyphMap;

/* ------------------------------------------------------------------ */
/* Realtime gate stream                                                */
/* ------------------------------------------------------------------ */
type GateSignal = {
  memberName: string;
  gate: string;
  direction: "IN" | "OUT";
};

const MEMBER_NAMES = [
  "Sarah Johnson",
  "Mike Chen",
  "Emma Davis",
  "John Smith",
  "Alex Rivera",
  "Priya Patel",
  "Liam Brooks",
  "Naomi Park",
];
const GATES = ["Gate A", "Gate B", "Main Entrance", "Studio Wing"];

/* ------------------------------------------------------------------ */
/* Quick action routes (kept in sync with the Sidebar)                 */
/* ------------------------------------------------------------------ */
type QuickRoute = {
  title: string;
  subtitle: string;
  icon: FeatherIconName;
  route: string;
};

const QUICK_ROUTES: QuickRoute[] = [
  {
    title: "Manage Members",
    subtitle: "View and manage gym members",
    icon: "users",
    route: "/members",
  },
  {
    title: "Races & Challenges",
    subtitle: "Run challenges and view the leaderboard",
    icon: "award",
    route: "/challenges",
  },
  {
    title: "Attendance",
    subtitle: "Check-ins and class attendance",
    icon: "calendar",
    route: "/attendance",
  },
  {
    title: "Trainers",
    subtitle: "Manage trainers and PT sessions",
    icon: "user-check",
    route: "/trainers",
  },
  {
    title: "Memberships",
    subtitle: "Plans and renewals",
    icon: "credit-card",
    route: "/memberships",
  },
  {
    title: "Payments",
    subtitle: "View revenue and collect dues",
    icon: "dollar-sign",
    route: "/payments",
  },
  {
    title: "Gate Scanner",
    subtitle: "Scan member passes at the door",
    icon: "camera",
    route: "/admin-scanner",
  },
];

/**
 * MOCK gate stream: emits a turnstile scan every 1.5 to 4 seconds.
 * To go live, replace the body with your real subscription (WebSocket,
 * Supabase realtime, Firebase onSnapshot...) and keep the same signature:
 * call onSignal() for every scan, and return a function that unsubscribes.
 */
function subscribeToGateEvents(onSignal: (signal: GateSignal) => void) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;

  const schedule = (delay: number) => {
    timer = setTimeout(() => {
      if (stopped) return;
      onSignal({
        memberName:
          MEMBER_NAMES[Math.floor(Math.random() * MEMBER_NAMES.length)],
        gate: GATES[Math.floor(Math.random() * GATES.length)],
        direction: Math.random() > 0.45 ? "IN" : "OUT",
      });
      schedule(1500 + Math.random() * 2500);
    }, delay);
  };

  schedule(800);
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

/* ------------------------------------------------------------------ */
/* Blinking live indicator                                             */
/* ------------------------------------------------------------------ */
function PulseDot({
  active,
  color = KFitColors.accent,
  size = 7,
}: {
  active: boolean;
  color?: string;
  size?: number;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.8],
  });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 0],
  });
  const dotOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.4, 1],
  });
  const dotColor = active ? color : KFitColors.mutedText;

  return (
    <View
      style={{
        width: size * 2.6,
        height: size * 2.6,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {active && (
        <Animated.View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          }}
        />
      )}
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dotColor,
          opacity: active ? dotOpacity : 1,
        }}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Turnstile row (flashes when a new scan arrives)                     */
/* ------------------------------------------------------------------ */
function TurnstileRow({ event }: { event: TurnstileEvent }) {
  const flash = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(flash, {
      toValue: 0,
      duration: 1800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [flash]);

  const isIn = event.direction === "IN";
  const tone = isIn ? KFitColors.accent : KFitColors.error;

  const backgroundColor = flash.interpolate({
    inputRange: [0, 1],
    outputRange: [KFitColors.background, tone + "40"],
  });
  const borderColor = flash.interpolate({
    inputRange: [0, 1],
    outputRange: [KFitColors.background, tone],
  });

  return (
    <Animated.View
      style={[
        styles.turnstileRow,
        { backgroundColor, borderColor, borderWidth: 1 },
      ]}
    >
      <View
        style={[
          styles.turnstileDirectionIcon,
          isIn ? styles.turnstileInIcon : styles.turnstileOutIcon,
        ]}
      >
        <Feather name={isIn ? "log-in" : "log-out"} size={12} color={tone} />
      </View>

      <View style={styles.turnstileRowContent}>
        <Text style={styles.turnstileMemberName} numberOfLines={1}>
          {event.memberName}
        </Text>
        <Text style={styles.turnstileMeta} numberOfLines={1}>
          {event.gate} · {event.timestamp}
        </Text>
      </View>

      <Text
        style={[
          styles.turnstileDirectionLabel,
          isIn ? styles.turnstileInLabel : styles.turnstileOutLabel,
        ]}
      >
        {isIn ? "+1" : "−1"}
      </Text>
    </Animated.View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/* ------------------------------------------------------------------ */
/* Facility Metrics + Live Occupancy + Turnstile Log                   */
/* ------------------------------------------------------------------ */
type FacilityMetricsProps = {
  occupancyPercent: number;
  occupancyStatus: string;
  gaugeCircumference: number;
  gaugeOffset: number;
  activeInside: number;
  capacity: number;
  gateScans: number;
  lastUpdated: number | null;
  isLive: boolean;
  isSyncing: boolean;
  isPaused: boolean;
  onTogglePause: () => void;
  onManualSync: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onSetCapacity: (limit: number) => void;
  streamLog: TurnstileEvent[];
};

function FacilityMetrics({
  occupancyPercent,
  occupancyStatus,
  gaugeCircumference,
  gaugeOffset,
  activeInside,
  capacity,
  gateScans,
  lastUpdated,
  isLive,
  isSyncing,
  isPaused,
  onTogglePause,
  onManualSync,
  onCheckIn,
  onCheckOut,
  onSetCapacity,
  streamLog,
}: FacilityMetricsProps) {
  // Re-render every second so "Updated Xs ago" stays accurate
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Smoothly animate the gauge ring
  const offsetAnim = useRef(new Animated.Value(gaugeOffset)).current;
  useEffect(() => {
    Animated.timing(offsetAnim, {
      toValue: gaugeOffset,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [gaugeOffset, offsetAnim]);

  const statusColor =
    occupancyStatus === "HIGH" ? KFitColors.error : KFitColors.accent;

  const lastUpdatedLabel = lastUpdated
    ? `${Math.max(0, Math.round((Date.now() - lastUpdated) / 1000))}s ago`
    : "—";

  return (
    <View style={styles.facilitySection}>
      <View style={styles.facilityHeading}>
        <Text style={styles.facilityEyebrow}>FACILITY METRICS</Text>
        <Text style={styles.facilityCaption}>TODAY'S OVERVIEW</Text>
      </View>

      {/* Metric Grid */}
      <View style={styles.facilityGrid}>
        <View style={styles.facilityCard}>
          <View style={styles.facilityCardHeader}>
            <Text style={styles.facilityLabel}>Active Members</Text>
            <Text style={styles.facilityChange}>+12%</Text>
          </View>
          <View style={styles.facilityValueGroup}>
            <Text style={styles.facilityValue}>248</Text>
            <Text style={styles.facilityDescription}>Subscribed Roster</Text>
          </View>
        </View>

        <View style={styles.facilityCard}>
          <View style={styles.facilityCardHeader}>
            <Text style={styles.facilityLabel}>Monthly Revenue</Text>
            <Text style={styles.facilityChange}>+8%</Text>
          </View>
          <View style={styles.facilityValueGroup}>
            <Text style={styles.facilityValue}>$12.5K</Text>
            <Text style={styles.facilityDescription}>MTD Collections</Text>
          </View>
        </View>

        <View style={styles.facilityCard}>
          <View style={styles.facilityCardHeader}>
            <Text style={styles.facilityLabel}>Today's Gate Scans</Text>
            <Text style={styles.facilityChange}>+5%</Text>
          </View>
          <View style={styles.facilityValueGroup}>
            <Text style={styles.facilityValue}>{gateScans}</Text>
            <Text style={styles.facilityDescription}>Turnstile Checks</Text>
          </View>
        </View>

        <View style={styles.facilityCard}>
          <View style={styles.facilityCardHeader}>
            <Text style={styles.facilityLabel}>Class Occupancy</Text>
            <Text style={styles.facilityChangeNegative}>-3%</Text>
          </View>
          <View style={styles.facilityValueGroup}>
            <Text style={styles.facilityValue}>78%</Text>
            <Text style={styles.facilityDescription}>Studio Attendance</Text>
          </View>
        </View>
      </View>

      {/* Live Gym Occupancy */}
      <View style={styles.occupancyCard}>
        <View style={styles.occupancyHeader}>
          <View style={styles.occupancyTitleGroup}>
            <View style={styles.liveEyebrowRow}>
              <PulseDot active={isLive && !isPaused} />
              <Text style={styles.occupancyEyebrow}>
                {isPaused ? "SENSORS PAUSED" : "REALTIME SENSORS"}
              </Text>
            </View>
            <Text style={styles.occupancyTitle}>Live Gym Occupancy</Text>
          </View>
          <View
            style={[
              styles.occupancyBadge,
              {
                borderColor: statusColor,
                backgroundColor: statusColor + "1A",
              },
            ]}
          >
            <PulseDot active={!isPaused} color={statusColor} size={6} />
            <Text style={[styles.occupancyStatusText, { color: statusColor }]}>
              {occupancyStatus}
            </Text>
          </View>
        </View>

        {/* Gauge */}
        <View style={styles.occupancyChartArea}>
          <View style={styles.occupancyRing}>
            <Svg width={150} height={150} viewBox="0 0 100 100">
              <Circle
                cx="50"
                cy="50"
                r="42"
                stroke={KFitColors.background}
                strokeWidth="9"
                fill="none"
              />
              <AnimatedCircle
                cx="50"
                cy="50"
                r="42"
                stroke={statusColor}
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${gaugeCircumference} ${gaugeCircumference}`}
                strokeDashoffset={offsetAnim}
                rotation="-90"
                origin="50, 50"
              />
            </Svg>
            <View style={styles.occupancyCenter}>
              <Text style={styles.occupancyPercentage}>
                {occupancyPercent}%
              </Text>
              <Text style={styles.occupancyCount}>
                {activeInside} / {capacity}
              </Text>
              <Text style={styles.occupancyCenterLabel}>ACTIVE INSIDE</Text>
            </View>
          </View>
        </View>

        {/* Live status row */}
        <View style={styles.liveStatusRow}>
          <View style={styles.liveStatusLeft}>
            <Feather
              name={
                isSyncing ? "loader" : isLive && !isPaused ? "wifi" : "wifi-off"
              }
              size={12}
              color={
                isLive && !isPaused ? KFitColors.accent : KFitColors.mutedText
              }
            />
            <Text style={styles.liveStatusText}>
              {isSyncing
                ? "Syncing…"
                : isPaused
                  ? "Paused"
                  : `Updated ${lastUpdatedLabel}`}
            </Text>
          </View>
          <View style={styles.liveStatusActions}>
            <TouchableOpacity
              onPress={onManualSync}
              disabled={isSyncing}
              activeOpacity={0.7}
              style={styles.liveMiniButton}
            >
              <Feather
                name="refresh-cw"
                size={12}
                color={KFitColors.mutedText}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onTogglePause}
              activeOpacity={0.7}
              style={styles.liveMiniButton}
            >
              <Feather
                name={isPaused ? "play" : "pause"}
                size={12}
                color={KFitColors.accent}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Check-In / Check-Out */}
        <View style={styles.occupancyButtonRow}>
          <TouchableOpacity
            style={[
              styles.occupancyCheckInButton,
              activeInside >= capacity && styles.occupancyDisabledButton,
            ]}
            onPress={onCheckIn}
            disabled={activeInside >= capacity}
            activeOpacity={0.8}
          >
            <Text style={styles.occupancyCheckInText}>+ Check-In (+1)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.occupancyCheckOutButton,
              activeInside <= 0 && styles.occupancyDisabledButton,
            ]}
            onPress={onCheckOut}
            disabled={activeInside <= 0}
            activeOpacity={0.8}
          >
            <Text style={styles.occupancyCheckOutText}>- Check-Out (-1)</Text>
          </TouchableOpacity>
        </View>

        {/* Capacity Limit */}
        <View style={styles.occupancyThresholdSection}>
          <View style={styles.occupancyThresholdHeader}>
            <Text style={styles.occupancyMutedText}>
              Capacity Limit Threshold:
            </Text>
            <Text style={styles.occupancyCapacityLabel}>
              Max Limit: {capacity}
            </Text>
          </View>
          <View style={styles.occupancyCapacityRow}>
            {[150, 200, 250, 300].map((limit) => (
              <TouchableOpacity
                key={limit}
                onPress={() => onSetCapacity(limit)}
                activeOpacity={0.8}
                style={[
                  styles.occupancyCapacityChip,
                  capacity === limit && styles.occupancyCapacityChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.occupancyCapacityChipText,
                    capacity === limit &&
                      styles.occupancyCapacityChipTextActive,
                  ]}
                >
                  {limit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Live Turnstile Stream Log */}
      <View style={styles.turnstileCard}>
        <View style={styles.turnstileHeader}>
          <View style={styles.turnstileTitleGroup}>
            <View style={styles.liveEyebrowRow}>
              <PulseDot active={!isPaused} />
              <Text style={styles.turnstileEyebrow}>
                {isPaused ? "GATE STREAM · PAUSED" : "GATE STREAM · LIVE"}
              </Text>
            </View>
            <Text style={styles.turnstileTitle}>Turnstile Activity Log</Text>
          </View>
          <View style={styles.turnstileCountBadge}>
            <Text style={styles.turnstileCountText}>
              {streamLog.length} events
            </Text>
          </View>
        </View>

        <View style={styles.turnstileList}>
          {streamLog.length === 0 ? (
            <Text style={styles.turnstileEmpty}>
              Waiting for gate activity…
            </Text>
          ) : (
            streamLog.map((event) => (
              <TurnstileRow key={event.id} event={event} />
            ))
          )}
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Attention item (icon + text + count)                                */
/* ------------------------------------------------------------------ */
function AttentionItem({
  icon,
  tone,
  title,
  subtitle,
  count,
}: {
  icon: FeatherIconName;
  tone: string;
  title: string;
  subtitle: string;
  count: number;
}) {
  return (
    <View style={styles.attentionItem}>
      <View style={[styles.attentionIcon, { backgroundColor: tone + "1A" }]}>
        <Feather name={icon} size={18} color={tone} />
      </View>
      <View style={styles.attentionContent}>
        <Text style={styles.attentionTitle}>{title}</Text>
        <Text style={styles.attentionSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.attentionCount}>{count}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Sound effects + voice announcements                                 */
/* ------------------------------------------------------------------ */
/**
 * Preloads the short sound files and exposes play helpers.
 * The helpers read `enabled` from a ref, so they are safe to call from the
 * gate-stream subscription (which would otherwise see a stale value).
 */
function useSoundEffects(enabled: boolean) {
  const scanIn = useAudioPlayer(require("@/assets/sounds/scan-in.wav"));
  const scanOut = useAudioPlayer(require("@/assets/sounds/scan-out.wav"));
  const alertChime = useAudioPlayer(require("@/assets/sounds/alert.wav"));
  const warning = useAudioPlayer(require("@/assets/sounds/warning.wav"));

  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) Speech.stop();
  }, [enabled]);

  // Let sounds play even when the iPhone silent switch is on
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    return () => {
      Speech.stop();
    };
  }, []);

  const play = (
    player: { seekTo: (s: number) => unknown; play: () => void },
    force = false,
  ) => {
    if (!force && !enabledRef.current) return;
    try {
      player.seekTo(0);
      player.play();
    } catch (error) {
      console.warn("Sound failed to play:", error);
    }
  };

  return {
    playScan: (direction: "IN" | "OUT") =>
      play(direction === "IN" ? scanIn : scanOut),
    playWarning: () => play(warning),
    playAlert: () => play(alertChime),
    preview: () => play(scanIn, true),
    speak: (text: string) => {
      if (!enabledRef.current) return;
      Speech.stop();
      Speech.speak(text, { rate: 0.95 });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Dashboard Screen                                                    */
/* ------------------------------------------------------------------ */
export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  /* ---------------- Push alert state ---------------- */
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------- Realtime occupancy state ---------------- */
  const [activeInside, setActiveInside] = useState(156);
  const [capacity, setCapacity] = useState(200);
  const [lastUpdated, setLastUpdated] = useState<number | null>(Date.now());
  const [isLive, setIsLive] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gateScans, setGateScans] = useState(156);

  /* ---------------- Turnstile stream log ---------------- */
  const [streamLog, setStreamLog] = useState<TurnstileEvent[]>([]);

  /* ---------------- Sound ---------------- */
  const [soundEnabled, setSoundEnabled] = useState(false);
  const sounds = useSoundEffects(soundEnabled);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) sounds.preview();
  };

  const activeInsideRef = useRef(activeInside);
  const capacityRef = useRef(capacity);
  useEffect(() => {
    activeInsideRef.current = activeInside;
  }, [activeInside]);
  useEffect(() => {
    capacityRef.current = capacity;
  }, [capacity]);

  /**
   * One place that handles every scan (live stream OR manual buttons):
   * updates the headcount, the gate-scan counter and the activity log together,
   * so the gauge and the turnstile log can never disagree.
   */
  const registerGateEvent = (
    requested: "IN" | "OUT",
    memberName: string,
    gate: string,
  ) => {
    const current = activeInsideRef.current;
    let direction = requested;
    if (direction === "IN" && current >= capacityRef.current) direction = "OUT";
    if (direction === "OUT" && current <= 0) direction = "IN";

    const next = Math.max(
      0,
      Math.min(capacityRef.current, current + (direction === "IN" ? 1 : -1)),
    );
    activeInsideRef.current = next;
    setActiveInside(next);

    const capNow = capacityRef.current;
    const crossedIntoHigh =
      (next / capNow) * 100 >= 90 && (current / capNow) * 100 < 90;
    if (crossedIntoHigh) sounds.playWarning();
    else sounds.playScan(direction);
    setGateScans((n) => n + 1);
    setLastUpdated(Date.now());
    setIsLive(true);

    const now = new Date();
    const event: TurnstileEvent = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
      memberName,
      gate,
      direction,
      timestamp: now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
    setStreamLog((prev) => [event, ...prev].slice(0, 6));
  };

  // Realtime: listen to the gate stream while not paused
  useEffect(() => {
    if (isPaused) return;
    return subscribeToGateEvents((signal) =>
      registerGateEvent(signal.direction, signal.memberName, signal.gate),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  // Manual refresh (button / pull-to-refresh): brief "Syncing…" state
  const syncOnce = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLastUpdated(Date.now());
    setIsLive(true);
    setIsSyncing(false);
  };

  // Pause everything when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        setIsPaused(true);
      } else if (state === "active") {
        setIsPaused(false);
      }
    });
    return () => sub.remove();
  }, []);

  const handleTogglePause = () => setIsPaused((p) => !p);
  const handleManualSync = () => {
    if (isPaused) setIsPaused(false);
    syncOnce();
  };

  /* ---------------- Derived gauge values ---------------- */
  const occupancyPercent = Math.min(
    100,
    Math.round((activeInside / capacity) * 100),
  );

  const occupancyStatus =
    occupancyPercent >= 90
      ? "HIGH"
      : occupancyPercent >= 50
        ? "MODERATE"
        : "LOW";

  const gaugeCircumference = 2 * Math.PI * 42;
  const gaugeOffset = gaugeCircumference * (1 - occupancyPercent / 100);

  /* ---------------- Manual overrides ---------------- */
  const handleCheckIn = () =>
    registerGateEvent("IN", "Walk-in Member", "Front Desk");

  const handleCheckOut = () =>
    registerGateEvent("OUT", "Walk-in Member", "Front Desk");

  /* ---------------- Pull to refresh ---------------- */
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const handlePullRefresh = async () => {
    if (isPullRefreshing) return;
    try {
      setIsPullRefreshing(true);
      await syncOnce();
    } catch (error) {
      console.error("Failed to refresh dashboard:", error);
      Alert.alert("Refresh failed", "Please try again.");
    } finally {
      setIsPullRefreshing(false);
    }
  };

  /* ---------------- Push alert handlers ---------------- */
  const dismissToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(null);
  };

  const dispatchBroadcast = () => {
    const message = broadcastText.trim() || "Gym floor closing in 30 minutes.";
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sounds.playAlert();
    sounds.speak(message);
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

  /* ---------------- Responsive layout ---------------- */
  const horizontalPadding = width < 360 ? 16 : width >= 768 ? 28 : 20;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/dashboard" theme="dashboard" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.container,
            { paddingHorizontal: horizontalPadding },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isPullRefreshing}
              onRefresh={handlePullRefresh}
              tintColor={KFitColors.accent}
              colors={[KFitColors.accent]}
              progressBackgroundColor={KFitColors.surface}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBrand}>
              <View style={styles.brandIconWrapper}>
                <Image
                  source={require("../../assets/images/logo.jpg")}
                  resizeMode="contain"
                  style={styles.brandLogo}
                  accessibilityLabel="K-Fit logo"
                />
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
                accessibilityLabel={
                  soundEnabled ? "Mute sounds" : "Turn sounds on"
                }
                style={[
                  styles.broadcastButton,
                  soundEnabled && styles.soundButtonOn,
                ]}
                onPress={handleToggleSound}
                activeOpacity={0.7}
              >
                <Feather
                  name={soundEnabled ? "volume-2" : "volume-x"}
                  size={15}
                  color={
                    soundEnabled ? KFitColors.accent : KFitColors.mutedText
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Compose push alert"
                style={styles.broadcastButton}
                onPress={() => setShowBroadcast(true)}
                activeOpacity={0.7}
              >
                <Feather name="bell" size={15} color={KFitColors.accent} />
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Open races and challenges"
                style={styles.broadcastButton}
                onPress={() => router.push("/challenges" as any)}
                activeOpacity={0.7}
              >
                <Feather name="award" size={15} color={KFitColors.accent} />
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Add member"
                style={styles.addButtonWrapper}
                onPress={() => router.push("/members")}
                activeOpacity={0.8}
              >
                <ImageBackground
                  source={require("../../assets/images/gold-texture.jpg")}
                  resizeMode="cover"
                  style={styles.addButton}
                  imageStyle={styles.addButtonImage}
                >
                  <Feather name="plus" size={18} color={KFitColors.onAccent} />
                </ImageBackground>
              </TouchableOpacity>
            </View>
          </View>

          {/* Facility Metrics */}
          <FacilityMetrics
            occupancyPercent={occupancyPercent}
            occupancyStatus={occupancyStatus}
            gaugeCircumference={gaugeCircumference}
            gaugeOffset={gaugeOffset}
            activeInside={activeInside}
            capacity={capacity}
            gateScans={gateScans}
            lastUpdated={lastUpdated}
            isLive={isLive}
            isSyncing={isSyncing}
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
            onManualSync={handleManualSync}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onSetCapacity={setCapacity}
            streamLog={streamLog}
          />

          {/* Attention Needed */}
          <Text style={styles.sectionTitle}>Attention Needed</Text>

          <View style={styles.attentionCard}>
            <AttentionItem
              icon="alert-triangle"
              tone={KFitColors.error}
              title="12 Membership Renewals"
              subtitle="Expiring this week"
              count={12}
            />
            <AttentionItem
              icon="credit-card"
              tone={KFitColors.accent}
              title="5 Unpaid Invoices"
              subtitle="Total: $1,250"
              count={5}
            />
            <AttentionItem
              icon="trending-up"
              tone={KFitColors.accent}
              title="3 Classes Near Capacity"
              subtitle="Yoga, HIIT, Spin"
              count={3}
            />
          </View>

          {/* Upcoming Sessions */}
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>

          <View style={styles.sessionsCard}>
            {[
              {
                time: "9:00",
                ap: "AM",
                title: "Morning Yoga",
                trainer: "Sarah Johnson",
                room: "Studio A",
                booked: "18/20",
              },
              {
                time: "10:30",
                ap: "AM",
                title: "HIIT Training",
                trainer: "Mike Chen",
                room: "Studio B",
                booked: "24/25",
              },
              {
                time: "2:00",
                ap: "PM",
                title: "Spin Class",
                trainer: "Emma Davis",
                room: "Studio C",
                booked: "15/20",
              },
              {
                time: "5:00",
                ap: "PM",
                title: "Strength Training",
                trainer: "John Smith",
                room: "Main Floor",
                booked: "12/15",
              },
            ].map((session) => (
              <View key={session.title} style={styles.sessionItem}>
                <View style={styles.sessionTime}>
                  <Text style={styles.sessionTimeText}>{session.time}</Text>
                  <Text style={styles.sessionAmPm}>{session.ap}</Text>
                </View>
                <View style={styles.sessionDivider} />
                <View style={styles.sessionContent}>
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                  <Text style={styles.sessionTrainer}>
                    with {session.trainer}
                  </Text>
                  <View style={styles.sessionMeta}>
                    <Text style={styles.sessionLocation}>{session.room}</Text>
                    <Text style={styles.sessionBooking}>
                      {session.booked} booked
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          {QUICK_ROUTES.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.actionButton}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <View style={styles.actionIconBox}>
                <Feather name={item.icon} size={18} color={KFitColors.accent} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{item.title}</Text>
                <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
              </View>
              <Feather
                name="chevron-right"
                size={20}
                color={KFitColors.mutedText}
              />
            </TouchableOpacity>
          ))}

          <Text style={styles.footer}>K-FIT · Gym Management Dashboard</Text>
        </ScrollView>
      </View>

      {/* Live push alert banner */}
      {toastMessage && (
        <View style={styles.toast}>
          <View style={styles.toastIcon}>
            <Feather name="bell" size={18} color={KFitColors.onAccent} />
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
              <View style={styles.modalTitleRow}>
                <Feather name="bell" size={16} color={KFitColors.accent} />
                <Text style={styles.modalTitle}>Dispatch Push Alert</Text>
              </View>
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
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles (single StyleSheet, every key defined once)                  */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: KFitColors.background,
  },

  mainContainer: {
    flex: 1,
    flexDirection: "row",
  },

  content: {
    flex: 1,
    backgroundColor: KFitColors.background,
  },

  container: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingTop: 20,
    paddingBottom: 144,
  },

  /* ---------------- Header ---------------- */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
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

  brandIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#181818",
    borderWidth: 1,
    borderColor: KFitColors.border,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexShrink: 0,
  },

  brandLogo: {
    width: 34,
    height: 34,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

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
    backgroundColor: KFitColors.accentDark + "33",
    borderWidth: 1,
    borderColor: KFitColors.accentDark,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  versionBadgeText: {
    color: KFitColors.accentLight,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
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

  soundButtonOn: {
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.accent + "1A",
  },

  addButtonWrapper: {
    borderRadius: 8,
    overflow: "hidden",
    elevation: 3,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },

  addButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonImage: {
    borderRadius: 8,
  },

  /* ---------------- Facility metrics ---------------- */
  facilitySection: {
    marginBottom: 24,
  },

  facilityHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  facilityEyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  facilityCaption: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
  },

  facilityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  facilityCard: {
    flexBasis: "48%",
    flexGrow: 1,
    maxWidth: "49%",
    minWidth: 0,
    minHeight: 112,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 12,
    justifyContent: "space-between",
  },

  facilityCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 5,
  },

  facilityLabel: {
    flexShrink: 1,
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "700",
  },

  facilityChange: {
    color: KFitColors.accent,
    backgroundColor: KFitColors.accent + "26",
    borderColor: KFitColors.accent + "66",
    borderWidth: 1,
    overflow: "hidden",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 9,
    fontWeight: "800",
  },

  facilityChangeNegative: {
    color: KFitColors.error,
    backgroundColor: KFitColors.error + "26",
    borderColor: KFitColors.error + "66",
    borderWidth: 1,
    overflow: "hidden",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 9,
    fontWeight: "800",
  },

  facilityValueGroup: {
    marginTop: 12,
  },

  facilityValue: {
    color: KFitColors.text,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  facilityDescription: {
    color: KFitColors.mutedText,
    fontSize: 9,
    marginTop: 3,
  },

  /* ---------------- Live gym occupancy ---------------- */
  occupancyCard: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    marginBottom: 10,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  occupancyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },

  occupancyTitleGroup: {
    flex: 1,
    minWidth: 140,
  },

  liveEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 3,
    marginLeft: -4,
  },

  occupancyEyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  occupancyTitle: {
    color: KFitColors.text,
    fontSize: 16,
    fontWeight: "800",
  },

  occupancyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.accent + "1A",
  },

  occupancyStatusText: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  occupancyChartArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 16,
    paddingVertical: 12,
  },

  occupancyRing: {
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },

  occupancyCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  occupancyPercentage: {
    color: KFitColors.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1,
  },

  occupancyCount: {
    color: KFitColors.accent,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },

  occupancyCenterLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 2,
  },

  liveStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginTop: 4,
    marginBottom: 4,
  },

  liveStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  liveStatusText: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "600",
  },

  liveStatusActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  liveMiniButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },

  occupancyButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  occupancyCheckInButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent,
    borderRadius: 12,
    paddingHorizontal: 6,
  },

  occupancyCheckInText: {
    color: KFitColors.onAccent,
    fontSize: 11,
    fontWeight: "900",
  },

  occupancyCheckOutButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    paddingHorizontal: 6,
  },

  occupancyCheckOutText: {
    color: KFitColors.text,
    fontSize: 11,
    fontWeight: "700",
  },

  occupancyDisabledButton: {
    opacity: 0.4,
  },

  occupancyThresholdSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },

  occupancyThresholdHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 5,
    marginBottom: 10,
  },

  occupancyMutedText: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "600",
  },

  occupancyCapacityLabel: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "800",
  },

  occupancyCapacityRow: {
    flexDirection: "row",
    gap: 6,
  },

  occupancyCapacityChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },

  occupancyCapacityChipActive: {
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.accent + "26",
  },

  occupancyCapacityChipText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontWeight: "700",
  },

  occupancyCapacityChipTextActive: {
    color: KFitColors.accent,
  },

  /* ---------------- Turnstile stream log ---------------- */
  turnstileCard: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 16,
    marginTop: 6,
    marginBottom: 10,
  },

  turnstileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  turnstileTitleGroup: {
    flex: 1,
    minWidth: 140,
  },

  turnstileEyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  turnstileTitle: {
    color: KFitColors.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },

  turnstileCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },

  turnstileCountText: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "700",
  },

  turnstileList: {
    gap: 8,
  },

  turnstileEmpty: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontStyle: "italic",
    paddingVertical: 10,
    textAlign: "center",
  },

  turnstileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: KFitColors.background,
  },

  turnstileDirectionIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  turnstileInIcon: {
    borderColor: KFitColors.accent + "59",
    backgroundColor: KFitColors.accent + "1A",
  },

  turnstileOutIcon: {
    borderColor: KFitColors.error + "59",
    backgroundColor: KFitColors.error + "1A",
  },

  turnstileRowContent: {
    flex: 1,
    minWidth: 0,
  },

  turnstileMemberName: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "700",
  },

  turnstileMeta: {
    color: KFitColors.mutedText,
    fontSize: 10,
    marginTop: 2,
  },

  turnstileDirectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  turnstileInLabel: {
    color: KFitColors.accent,
  },

  turnstileOutLabel: {
    color: KFitColors.error,
  },

  /* ---------------- Attention / Sessions ---------------- */
  sectionTitle: {
    color: KFitColors.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
  },

  attentionCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    marginBottom: 24,
  },

  attentionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },

  attentionIcon: {
    width: 40,
    minHeight: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: KFitColors.border,
  },

  attentionContent: {
    flex: 1,
    minWidth: 0,
  },

  attentionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: KFitColors.text,
    flexShrink: 1,
  },

  attentionSubtitle: {
    fontSize: 13,
    color: KFitColors.mutedText,
    marginTop: 2,
    flexShrink: 1,
  },

  attentionCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: KFitColors.accent,
    marginLeft: 8,
  },

  sessionsCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    marginBottom: 24,
  },

  sessionItem: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },

  sessionTime: {
    width: 56,
    flexShrink: 0,
    alignItems: "center",
  },

  sessionTimeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: KFitColors.text,
  },

  sessionAmPm: {
    fontSize: 11,
    color: KFitColors.mutedText,
  },

  sessionDivider: {
    width: 1,
    backgroundColor: KFitColors.border,
    marginHorizontal: 12,
  },

  sessionContent: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 8,
  },

  sessionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: KFitColors.text,
    flexShrink: 1,
  },

  sessionTrainer: {
    fontSize: 13,
    color: KFitColors.mutedText,
    marginTop: 2,
    flexShrink: 1,
  },

  sessionMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 12,
  },

  sessionLocation: {
    fontSize: 12,
    color: KFitColors.mutedText,
  },

  sessionBooking: {
    fontSize: 12,
    color: KFitColors.accent,
    fontWeight: "600",
  },

  /* ---------------- Quick actions ---------------- */
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    gap: 12,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1A",
  },

  actionContent: {
    flex: 1,
    minWidth: 0,
  },

  actionTitle: {
    color: KFitColors.text,
    fontWeight: "600",
    fontSize: 14,
  },

  actionSubtitle: {
    color: KFitColors.mutedText,
    fontSize: 13,
    marginTop: 3,
    flexShrink: 1,
  },

  footer: {
    color: KFitColors.mutedText,
    fontSize: 11,
    textAlign: "center",
    marginTop: 24,
  },

  /* ---------------- Push alert banner + modal ---------------- */
  toast: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.surface,
    elevation: 8,
  },

  toastIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  toastBody: {
    flex: 1,
    minWidth: 0,
  },

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

  toastTime: {
    color: KFitColors.mutedText,
    fontSize: 10,
  },

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

  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  modalTitle: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "800",
  },

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
