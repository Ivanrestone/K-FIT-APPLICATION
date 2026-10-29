import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import { useMembers } from "@/hooks/use-members";
import { useRevenue } from "@/hooks/use-revenue";
import { Feather } from "@expo/vector-icons";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
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

/* ─────────── Types ─────────── */
type TurnstileEvent = {
  id: string;
  memberName: string;
  gate: string;
  direction: "IN" | "OUT";
  timestamp: string;
};

type FeatherIconName = keyof typeof Feather.glyphMap;

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

/* ─────────── Quick routes ─────────── */
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

/* ─────────── Gate stream ─────────── */
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

/* ─────────── Pulse dot ─────────── */
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

/* ─────────── Turnstile row ─────────── */
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

      <View
        style={[
          styles.turnstilePill,
          { backgroundColor: tone + "1A", borderColor: tone + "44" },
        ]}
      >
        <Text style={[styles.turnstilePillText, { color: tone }]}>
          {isIn ? "+1" : "−1"}
        </Text>
      </View>
    </Animated.View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/* ─────────── Facility Metrics ─────────── */
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
  memberCount: number;
  monthlyRevenue: number;
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
  memberCount,
  monthlyRevenue,
}: FacilityMetricsProps) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

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
      <View style={styles.sectionHead}>
        <Text style={styles.sectionEyebrow}>FACILITY METRICS</Text>
        <Text style={styles.sectionCaption}>TODAY'S OVERVIEW</Text>
      </View>

      {/* Metric Grid */}
      <View style={styles.facilityGrid}>
        <View style={styles.facilityCard}>
          <View style={styles.facilityCardHeader}>
            <Text style={styles.facilityLabel}>Active Members</Text>
            <View
              style={[
                styles.facilityPill,
                {
                  backgroundColor: KFitColors.accent + "1A",
                  borderColor: KFitColors.accent + "44",
                },
              ]}
            >
              <Text
                style={[styles.facilityPillText, { color: KFitColors.accent }]}
              >
                +12%
              </Text>
            </View>
          </View>
          <Text style={styles.facilityValue}>{memberCount}</Text>
          <Text style={styles.facilityDescription}>Subscribed Roster</Text>
        </View>

        <View style={styles.facilityCard}>
          <View style={styles.facilityCardHeader}>
            <Text style={styles.facilityLabel}>Monthly Revenue</Text>
            <View
              style={[
                styles.facilityPill,
                {
                  backgroundColor: KFitColors.accent + "1A",
                  borderColor: KFitColors.accent + "44",
                },
              ]}
            >
              <Text
                style={[styles.facilityPillText, { color: KFitColors.accent }]}
              >
                +8%
              </Text>
            </View>
          </View>
          <Text style={styles.facilityValue}>
            ${(monthlyRevenue / 1000).toFixed(1)}K
          </Text>
          <Text style={styles.facilityDescription}>MTD Collections</Text>
        </View>

        <View style={styles.facilityCard}>
          <View style={styles.facilityCardHeader}>
            <Text style={styles.facilityLabel}>Today's Gate Scans</Text>
            <View
              style={[
                styles.facilityPill,
                {
                  backgroundColor: KFitColors.accent + "1A",
                  borderColor: KFitColors.accent + "44",
                },
              ]}
            >
              <Text
                style={[styles.facilityPillText, { color: KFitColors.accent }]}
              >
                +5%
              </Text>
            </View>
          </View>
          <Text style={styles.facilityValue}>{gateScans}</Text>
          <Text style={styles.facilityDescription}>Turnstile Checks</Text>
        </View>

        <View style={styles.facilityCard}>
          <View style={styles.facilityCardHeader}>
            <Text style={styles.facilityLabel}>Class Occupancy</Text>
            <View
              style={[
                styles.facilityPill,
                {
                  backgroundColor: KFitColors.error + "1A",
                  borderColor: KFitColors.error + "44",
                },
              ]}
            >
              <Text
                style={[styles.facilityPillText, { color: KFitColors.error }]}
              >
                −3%
              </Text>
            </View>
          </View>
          <Text style={styles.facilityValue}>78%</Text>
          <Text style={styles.facilityDescription}>Studio Attendance</Text>
        </View>
      </View>

      {/* Live Gym Occupancy */}
      <View style={styles.occupancyCard}>
        <View style={styles.occupancyHeader}>
          <View style={styles.occupancyTitleGroup}>
            <View style={styles.liveEyebrowRow}>
              <PulseDot active={isLive && !isPaused} size={5} />
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
                borderColor: statusColor + "55",
                backgroundColor: statusColor + "1A",
              },
            ]}
          >
            <PulseDot active={!isPaused} color={statusColor} size={5} />
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
              accessibilityRole="button"
              accessibilityLabel="Sync now"
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
              accessibilityRole="button"
              accessibilityLabel={isPaused ? "Resume sensors" : "Pause sensors"}
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
              styles.checkInBtn,
              activeInside >= capacity && styles.disabledBtn,
            ]}
            onPress={onCheckIn}
            disabled={activeInside >= capacity}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={13} color={KFitColors.onAccent} />
            <Text style={styles.checkInText}>Check-In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.checkOutBtn,
              activeInside <= 0 && styles.disabledBtn,
            ]}
            onPress={onCheckOut}
            disabled={activeInside <= 0}
            activeOpacity={0.8}
          >
            <Feather name="minus" size={13} color={KFitColors.text} />
            <Text style={styles.checkOutText}>Check-Out</Text>
          </TouchableOpacity>
        </View>

        {/* Capacity chips */}
        <View style={styles.capacitySection}>
          <View style={styles.capacityHeader}>
            <Text style={styles.capacityLabel}>CAPACITY LIMIT</Text>
            <Text style={styles.capacityValue}>Max: {capacity}</Text>
          </View>
          <View style={styles.capacityRow}>
            {[150, 200, 250, 300].map((limit) => (
              <TouchableOpacity
                key={limit}
                onPress={() => onSetCapacity(limit)}
                activeOpacity={0.8}
                style={[
                  styles.capacityChip,
                  capacity === limit && styles.capacityChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.capacityChipText,
                    capacity === limit && styles.capacityChipTextActive,
                  ]}
                >
                  {limit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Turnstile log */}
      <View style={styles.turnstileCard}>
        <View style={styles.turnstileHeader}>
          <View style={styles.turnstileTitleGroup}>
            <View style={styles.liveEyebrowRow}>
              <PulseDot active={!isPaused} size={5} />
              <Text style={styles.turnstileEyebrow}>
                {isPaused ? "GATE STREAM · PAUSED" : "GATE STREAM · LIVE"}
              </Text>
            </View>
            <Text style={styles.turnstileTitle}>Turnstile Activity</Text>
          </View>
          <View style={styles.turnstileCountBadge}>
            <Text style={styles.turnstileCountText}>
              {streamLog.length} events
            </Text>
          </View>
        </View>

        <View style={styles.turnstileList}>
          {streamLog.length === 0 ? (
            <View style={styles.turnstileEmpty}>
              <Feather name="radio" size={16} color={KFitColors.mutedText} />
              <Text style={styles.turnstileEmptyText}>
                Waiting for gate activity…
              </Text>
            </View>
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

/* ─────────── Attention item ─────────── */
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
      <View
        style={[
          styles.attentionIcon,
          {
            backgroundColor: tone + "14",
            borderColor: tone + "44",
            borderWidth: 1,
          },
        ]}
      >
        <Feather name={icon} size={16} color={tone} />
      </View>
      <View style={styles.attentionContent}>
        <Text style={styles.attentionTitle}>{title}</Text>
        <Text style={styles.attentionSubtitle}>{subtitle}</Text>
      </View>
      <View
        style={[
          styles.attentionCountPill,
          { backgroundColor: tone + "1A", borderColor: tone + "44" },
        ]}
      >
        <Text style={[styles.attentionCount, { color: tone }]}>{count}</Text>
      </View>
    </View>
  );
}

/* ─────────── Sound effects hook ─────────── */
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

/* ─────────── Screen ─────────── */
export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { members } = useMembers();
  const { monthlyRevenue } = useRevenue();

  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeInside, setActiveInside] = useState(156);
  const [capacity, setCapacity] = useState(200);
  const [lastUpdated, setLastUpdated] = useState<number | null>(Date.now());
  const [isLive, setIsLive] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gateScans, setGateScans] = useState(156);

  const [streamLog, setStreamLog] = useState<TurnstileEvent[]>([]);

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

  useEffect(() => {
    if (isPaused) return;
    return subscribeToGateEvents((signal) =>
      registerGateEvent(signal.direction, signal.memberName, signal.gate),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  const syncOnce = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLastUpdated(Date.now());
    setIsLive(true);
    setIsSyncing(false);
  };

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") setIsPaused(true);
      else if (state === "active") setIsPaused(false);
    });
    return () => sub.remove();
  }, []);

  const handleTogglePause = () => setIsPaused((p) => !p);
  const handleManualSync = () => {
    if (isPaused) setIsPaused(false);
    syncOnce();
  };

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

  const handleCheckIn = () =>
    registerGateEvent("IN", "Walk-in Member", "Front Desk");

  const handleCheckOut = () =>
    registerGateEvent("OUT", "Walk-in Member", "Front Desk");

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
            memberCount={members.length}
            monthlyRevenue={monthlyRevenue}
          />

          {/* Attention Needed */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionEyebrow}>ATTENTION NEEDED</Text>
            <Text style={styles.sectionCaption}>PRIORITY TASKS</Text>
          </View>

          <View style={styles.attentionCard}>
            <AttentionItem
              icon="alert-triangle"
              tone={KFitColors.error}
              title="Membership Renewals"
              subtitle="12 expiring this week"
              count={12}
            />
            <View style={styles.attentionDivider} />
            <AttentionItem
              icon="credit-card"
              tone="#F59E0B"
              title="Unpaid Invoices"
              subtitle="Total: $1,250"
              count={5}
            />
            <View style={styles.attentionDivider} />
            <AttentionItem
              icon="trending-up"
              tone={KFitColors.accent}
              title="Classes Near Capacity"
              subtitle="Yoga, HIIT, Spin"
              count={3}
            />
          </View>

          {/* Upcoming Sessions */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionEyebrow}>TODAY'S SCHEDULE</Text>
            <Text style={styles.sectionCaption}>UPCOMING SESSIONS</Text>
          </View>

          <View style={styles.sessionsCard}>
            {[
              {
                time: "9:00",
                ap: "AM",
                title: "Morning Yoga",
                trainer: "Sarah Johnson",
                room: "Studio A",
                booked: "18/20",
                tone: KFitColors.accent,
              },
              {
                time: "10:30",
                ap: "AM",
                title: "HIIT Training",
                trainer: "Mike Chen",
                room: "Studio B",
                booked: "24/25",
                tone: "#F59E0B",
              },
              {
                time: "2:00",
                ap: "PM",
                title: "Spin Class",
                trainer: "Emma Davis",
                room: "Studio C",
                booked: "15/20",
                tone: KFitColors.accent,
              },
              {
                time: "5:00",
                ap: "PM",
                title: "Strength Training",
                trainer: "John Smith",
                room: "Main Floor",
                booked: "12/15",
                tone: KFitColors.accent,
              },
            ].map((session, i, arr) => (
              <View key={session.title}>
                <View style={styles.sessionItem}>
                  <View style={styles.sessionTime}>
                    <Text
                      style={[styles.sessionTimeText, { color: session.tone }]}
                    >
                      {session.time}
                    </Text>
                    <Text style={styles.sessionAmPm}>{session.ap}</Text>
                  </View>
                  <View style={styles.sessionDivider} />
                  <View style={styles.sessionContent}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    <Text style={styles.sessionTrainer}>
                      with {session.trainer}
                    </Text>
                    <View style={styles.sessionMeta}>
                      <Feather
                        name="map-pin"
                        size={10}
                        color={KFitColors.mutedText}
                      />
                      <Text style={styles.sessionMetaText}>{session.room}</Text>
                      <Text style={styles.sessionMetaDot}>·</Text>
                      <Text
                        style={[styles.sessionBooking, { color: session.tone }]}
                      >
                        {session.booked} booked
                      </Text>
                    </View>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={styles.attentionDivider} />}
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionEyebrow}>SHORTCUTS</Text>
            <Text style={styles.sectionCaption}>QUICK ACTIONS</Text>
          </View>

          <View style={styles.quickList}>
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
                  <Feather
                    name={item.icon}
                    size={16}
                    color={KFitColors.accent}
                  />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{item.title}</Text>
                  <Text style={styles.actionSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={18}
                  color={KFitColors.mutedText}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerLabel}>
              K-FIT · GYM MANAGEMENT DASHBOARD
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Live push alert banner */}
      {toastMessage && (
        <View style={styles.toast}>
          <View style={styles.toastIcon}>
            <Feather name="bell" size={16} color={KFitColors.onAccent} />
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
                <View style={styles.modalIcon}>
                  <Feather name="bell" size={14} color={KFitColors.accent} />
                </View>
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

            <Text style={styles.modalFieldLabel}>BROADCAST CONTENT</Text>
            <TextInput
              style={styles.modalInput}
              value={broadcastText}
              onChangeText={setBroadcastText}
              placeholder="Type notification message…"
              placeholderTextColor={KFitColors.mutedText}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={dispatchBroadcast}
              activeOpacity={0.8}
            >
              <Feather name="send" size={13} color={KFitColors.onAccent} />
              <Text style={styles.modalPrimaryText}>
                Dispatch to All Members
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ─────────── Styles ─────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, flexDirection: "row" },
  content: { flex: 1, backgroundColor: KFitColors.background },
  container: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingTop: 16,
    paddingBottom: 144,
    gap: 4,
  },

  /* Section head */
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionEyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  sectionCaption: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: "monospace",
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
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
    flexShrink: 0,
  },
  brandLogo: { width: 34, height: 34 },
  headerText: { flex: 1, minWidth: 0 },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  brandTitle: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  versionBadge: {
    backgroundColor: KFitColors.accentDark + "33",
    borderWidth: 1,
    borderColor: KFitColors.accentDark,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  versionBadgeText: {
    color: KFitColors.accentLight,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
    fontFamily: "monospace",
  },
  brandSubtitle: {
    color: KFitColors.mutedText,
    fontSize: 9,
    marginTop: 2,
    letterSpacing: 1,
    fontFamily: "monospace",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    backgroundColor: KFitColors.accent + "14",
  },
  addButtonWrapper: {
    borderRadius: 8,
    overflow: "hidden",
    width: 32,
    height: 32,
  },
  addButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonImage: { borderRadius: 8 },

  /* Facility */
  facilitySection: { gap: 0 },
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
    minHeight: 108,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    padding: 12,
    justifyContent: "space-between",
    gap: 6,
  },
  facilityCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
  },
  facilityLabel: {
    flexShrink: 1,
    color: KFitColors.mutedText,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  facilityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  facilityPillText: {
    fontSize: 8,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.3,
  },
  facilityValue: {
    color: KFitColors.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    fontFamily: "monospace",
  },
  facilityDescription: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontFamily: "monospace",
  },

  /* Occupancy */
  occupancyCard: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    gap: 4,
  },
  occupancyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  occupancyTitleGroup: { flex: 1, minWidth: 140 },
  liveEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 3,
    marginLeft: -4,
  },
  occupancyEyebrow: {
    color: KFitColors.accent,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  occupancyTitle: {
    color: KFitColors.text,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  occupancyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  occupancyStatusText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
    fontFamily: "monospace",
  },
  occupancyChartArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
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
    fontFamily: "monospace",
  },
  occupancyCount: {
    color: KFitColors.accent,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
    fontFamily: "monospace",
  },
  occupancyCenterLabel: {
    color: KFitColors.mutedText,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 2,
    fontFamily: "monospace",
  },
  liveStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginTop: 4,
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
    fontFamily: "monospace",
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
  checkInBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 42,
    backgroundColor: KFitColors.accent,
    borderRadius: 10,
  },
  checkInText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  checkOutBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 42,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 10,
  },
  checkOutText: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  disabledBtn: { opacity: 0.4 },
  capacitySection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
    gap: 8,
  },
  capacityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  capacityLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    fontFamily: "monospace",
  },
  capacityValue: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  capacityRow: { flexDirection: "row", gap: 6 },
  capacityChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  capacityChipActive: {
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.accent + "1A",
  },
  capacityChipText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  capacityChipTextActive: { color: KFitColors.accent },

  /* Turnstile */
  turnstileCard: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    gap: 12,
  },
  turnstileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  turnstileTitleGroup: { flex: 1, minWidth: 140 },
  turnstileEyebrow: {
    color: KFitColors.accent,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  turnstileTitle: {
    color: KFitColors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: -0.2,
  },
  turnstileCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  turnstileCountText: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },
  turnstileList: { gap: 6 },
  turnstileEmpty: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
  },
  turnstileEmptyText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontStyle: "italic",
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
  turnstileRowContent: { flex: 1, minWidth: 0 },
  turnstileMemberName: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  turnstileMeta: {
    color: KFitColors.mutedText,
    fontSize: 10,
    marginTop: 2,
    fontFamily: "monospace",
  },
  turnstilePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  turnstilePillText: {
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },

  /* Attention */
  attentionCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  attentionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  attentionDivider: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginHorizontal: 12,
  },
  attentionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  attentionContent: { flex: 1, minWidth: 0, gap: 2 },
  attentionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.text,
  },
  attentionSubtitle: {
    fontSize: 11,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  attentionCountPill: {
    minWidth: 28,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  attentionCount: {
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "monospace",
  },

  /* Sessions */
  sessionsCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  sessionTime: {
    width: 52,
    alignItems: "center",
    flexShrink: 0,
  },
  sessionTimeText: {
    fontSize: 15,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.3,
  },
  sessionAmPm: {
    fontSize: 9,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
    fontWeight: "700",
    marginTop: 1,
  },
  sessionDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: KFitColors.border,
    marginVertical: 2,
  },
  sessionContent: { flex: 1, minWidth: 0, gap: 2 },
  sessionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.text,
  },
  sessionTrainer: {
    fontSize: 11,
    color: KFitColors.mutedText,
  },
  sessionMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  sessionMetaText: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  sessionMetaDot: {
    fontSize: 10,
    color: KFitColors.mutedText,
  },
  sessionBooking: {
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "monospace",
  },

  /* Quick actions */
  quickList: { gap: 8 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    gap: 12,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  actionContent: { flex: 1, minWidth: 0 },
  actionTitle: {
    color: KFitColors.text,
    fontWeight: "800",
    fontSize: 13,
  },
  actionSubtitle: {
    color: KFitColors.mutedText,
    fontSize: 11,
    marginTop: 2,
  },

  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  footerLabel: {
    color: KFitColors.mutedText,
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    opacity: 0.7,
  },

  /* Toast */
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.surface,
    elevation: 8,
  },
  toastIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  toastBody: { flex: 1, minWidth: 0 },
  toastHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toastLabel: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  toastTime: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
  },
  toastMessage: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
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
  modalIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  modalTitle: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  modalFieldLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  modalInput: {
    minHeight: 84,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 10,
    padding: 10,
    color: KFitColors.text,
    fontSize: 12,
  },
  modalPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  modalPrimaryText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});
