import TrainerBottomNav from "@/components/TrainerBottomNav";
import TrainerHeader from "@/components/TrainerHeader";
import { KFitColors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ─────────────── Types & data ─────────────── */
type DutyStatus = "On Floor" | "In Session" | "On Break" | "Off Duty";

type ClientSession = {
  id: string;
  clientName: string;
  time: string;
  focus: string;
  status: "In Progress" | "Upcoming" | "Completed";
  weights?: string;
  feedback?: string;
};

type Trainer = {
  id: string;
  name: string;
  specialty: string;
  status: DutyStatus;
  avatar: string;
  rating: number;
};

type AccessEvent = {
  id: string;
  name: string;
  method: string;
  time: string;
  direction: "IN" | "OUT";
};

const WARNING = "#F59E0B";
const PURPLE = "#8B5CF6";
const SUCCESS = "#22C55E";

const DUTY_OPTIONS: {
  label: DutyStatus;
  short: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { label: "On Floor", short: "On Floor", icon: "activity" },
  { label: "In Session", short: "In Session", icon: "users" },
  { label: "On Break", short: "On Break", icon: "coffee" },
  { label: "Off Duty", short: "Off Duty", icon: "power" },
];

const INITIAL_SESSIONS: ClientSession[] = [
  {
    id: "S-101",
    clientName: "Sarah Jenkins",
    time: "11:00 AM - 12:00 PM",
    focus: "Hypertrophy Legs & Squats",
    status: "In Progress",
  },
  {
    id: "S-102",
    clientName: "Devon Miles",
    time: "02:00 PM - 03:00 PM",
    focus: "Powerlifting Bench Deadlift",
    status: "Upcoming",
  },
  {
    id: "S-103",
    clientName: "Alex Mercer",
    time: "04:30 PM - 05:30 PM",
    focus: "HIIT & Conditioning",
    status: "Upcoming",
  },
];

const CLIENT_NAMES = INITIAL_SESSIONS.map((s) => s.clientName);

const INITIAL_TEAM: Trainer[] = [
  {
    id: "TR-101",
    name: "Marcus Vance",
    specialty: "Strength & Conditioning",
    status: "On Floor",
    avatar: "MV",
    rating: 4.9,
  },
  {
    id: "TR-102",
    name: "Elena Rostova",
    specialty: "Functional HIIT",
    status: "In Session",
    avatar: "ER",
    rating: 5.0,
  },
  {
    id: "TR-103",
    name: "Jaxson Reed",
    specialty: "Powerlifting",
    status: "On Floor",
    avatar: "JR",
    rating: 4.8,
  },
  {
    id: "TR-104",
    name: "Aria Chen",
    specialty: "Mobility & Rehab",
    status: "On Break",
    avatar: "AC",
    rating: 4.9,
  },
];

const INITIAL_LOGS: AccessEvent[] = [
  {
    id: "L-1",
    time: "10:32 AM",
    name: "Sarah Jenkins",
    method: "Door Face AI",
    direction: "IN",
  },
  {
    id: "L-2",
    time: "10:28 AM",
    name: "Devon Miles",
    method: "App QR Scan",
    direction: "IN",
  },
  {
    id: "L-3",
    time: "10:14 AM",
    name: "Alex Mercer",
    method: "Door Keypad PIN",
    direction: "IN",
  },
];

const MAX_CAPACITY = 120;
const START_OCCUPANCY = 42;
const START_GATE_SCANS = 189;

/* ─────────────── Realtime stream ─────────────── */
type AccessSignal = {
  name: string;
  method: string;
  direction: "IN" | "OUT";
};

const STREAM_NAMES = [
  ...CLIENT_NAMES,
  "Priya Patel",
  "Liam Brooks",
  "Naomi Park",
  "Chris Ortega",
  "Hana Kim",
];
const STREAM_METHODS = ["Door Face AI", "App QR Scan", "Door Keypad PIN"];

function subscribeToAccessEvents(onSignal: (signal: AccessSignal) => void) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;

  const schedule = (delay: number) => {
    timer = setTimeout(() => {
      if (stopped) return;
      onSignal({
        name: STREAM_NAMES[Math.floor(Math.random() * STREAM_NAMES.length)],
        method:
          STREAM_METHODS[Math.floor(Math.random() * STREAM_METHODS.length)],
        direction: Math.random() > 0.42 ? "IN" : "OUT",
      });
      schedule(3000 + Math.random() * 4000);
    }, delay);
  };

  schedule(1500);
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

/* ─────────────── Helpers ─────────────── */
function statusTone(status: DutyStatus) {
  switch (status) {
    case "On Floor":
      return KFitColors.accent;
    case "In Session":
      return PURPLE;
    case "On Break":
      return WARNING;
    default:
      return KFitColors.mutedText;
  }
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}h ${m}m ${s}s`;
}

const clockLabel = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

/* ─────────────── Shift clock model ─────────────── */
type ClockMode = "work" | "break" | "off";

type ShiftClockState = {
  workMs: number; // net paid time banked so far
  breakMs: number; // unpaid break time banked so far
  since: number; // when the current segment started
  mode: ClockMode;
};

const modeFor = (d: DutyStatus): ClockMode =>
  d === "On Break" ? "break" : d === "Off Duty" ? "off" : "work";

/** Bank the elapsed time of the current segment into the right bucket. */
function settle(c: ShiftClockState, now: number): ShiftClockState {
  const delta = Math.max(0, now - c.since);
  if (c.mode === "work") return { ...c, workMs: c.workMs + delta, since: now };
  if (c.mode === "break")
    return { ...c, breakMs: c.breakMs + delta, since: now };
  return { ...c, since: now };
}

const clockTone = (mode: ClockMode) =>
  mode === "work"
    ? KFitColors.accent
    : mode === "break"
      ? WARNING
      : KFitColors.error;

/* ─────────────── Pulse dot ─────────────── */
function PulseDot({
  active = true,
  color = KFitColors.accent,
  size = 7,
}: {
  active?: boolean;
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

/* ─────────────── Flash value ─────────────── */
function FlashValue({
  value,
  style,
}: {
  value: string | number;
  style: object;
}) {
  const flash = useRef(new Animated.Value(0)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    flash.setValue(1);
    Animated.timing(flash, {
      toValue: 0,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [value, flash]);

  const color = flash.interpolate({
    inputRange: [0, 1],
    outputRange: [KFitColors.text, KFitColors.accent],
  });

  return <Animated.Text style={[style, { color }]}>{value}</Animated.Text>;
}

/* ─────────────── Shift clock ─────────────── */
function ShiftClock({ clock }: { clock: ShiftClockState }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (clock.mode !== "work") return; // frozen on break / off
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [clock.mode]);

  const worked =
    clock.workMs + (clock.mode === "work" ? Math.max(0, now - clock.since) : 0);
  const tone = clockTone(clock.mode);

  return (
    <Text style={[styles.shiftValue, { color: tone }]}>
      {formatElapsed(clock.mode === "off" ? 0 : worked)}
    </Text>
  );
}

/* ─────────────── Access row ─────────────── */
function AccessRow({ event }: { event: AccessEvent }) {
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
    outputRange: [KFitColors.border, tone],
  });

  return (
    <Animated.View
      style={[styles.logRow, { backgroundColor, borderColor, borderWidth: 1 }]}
    >
      <View
        style={[
          styles.logIcon,
          { borderColor: tone + "55", backgroundColor: tone + "14" },
        ]}
      >
        <Feather name={isIn ? "log-in" : "log-out"} size={12} color={tone} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.logName} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={styles.logMethod} numberOfLines={1}>
          {event.method}
        </Text>
      </View>
      <View style={styles.logRight}>
        <Text style={[styles.logDirection, { color: tone }]}>
          {isIn ? "IN" : "OUT"}
        </Text>
        <Text style={styles.logTime}>{event.time}</Text>
      </View>
    </Animated.View>
  );
}

/* ─────────────── Status pill ─────────────── */
function StatusPill({ status }: { status: DutyStatus }) {
  const tone = statusTone(status);
  const live = status === "On Floor" || status === "In Session";
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: tone + "1A", borderColor: tone + "44" },
      ]}
    >
      {live ? (
        <PulseDot color={tone} size={5} />
      ) : (
        <View style={[styles.pillDot, { backgroundColor: tone }]} />
      )}
      <Text style={[styles.pillText, { color: tone }]}>{status}</Text>
    </View>
  );
}

/* ─────────────── Section heading ─────────────── */
function SectionHeading({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {typeof right === "string" ? (
        <Text style={styles.sectionRight}>{right}</Text>
      ) : (
        right
      )}
    </View>
  );
}

/* ─────────────── Screen ─────────────── */
export default function TrainerDashboardScreen() {
  const [duty, setDuty] = useState<DutyStatus>("On Floor");
  const [team, setTeam] = useState<Trainer[]>(INITIAL_TEAM);
  const [sessions, setSessions] = useState<ClientSession[]>(INITIAL_SESSIONS);

  const [clock, setClock] = useState<ShiftClockState>({
    workMs: (4 * 60 + 12) * 60000, // demo: already 4h12m in
    breakMs: 0,
    since: Date.now(),
    mode: "work",
  });

  // Derived, so picking "Off Duty" from the selector also clocks you out
  const shiftActive = duty !== "Off Duty";

  /** Confirm dialog state for ending a shift */
  const [endShiftConfirm, setEndShiftConfirm] = useState(false);

  const [occupancy, setOccupancy] = useState(START_OCCUPANCY);
  const [gateScans, setGateScans] = useState(START_GATE_SCANS);
  const [logs, setLogs] = useState<AccessEvent[]>(INITIAL_LOGS);
  const [arrived, setArrived] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const occRef = useRef(START_OCCUPANCY);
  const mutedRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const [activeSession, setActiveSession] = useState<ClientSession | null>(
    null,
  );
  const [weightsDraft, setWeightsDraft] = useState("");
  const [feedbackDraft, setFeedbackDraft] = useState("");

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const beep = (kind: "scan" | "alert") => {
    if (mutedRef.current) return;
    if (kind === "alert") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(
        () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        110,
      );
    }
  };

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const dismissToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleAccessEvent = (signal: AccessSignal) => {
    const current = occRef.current;
    let direction = signal.direction;
    if (direction === "IN" && current >= MAX_CAPACITY) direction = "OUT";
    if (direction === "OUT" && current <= 0) direction = "IN";

    const next = Math.max(
      0,
      Math.min(MAX_CAPACITY, current + (direction === "IN" ? 1 : -1)),
    );
    occRef.current = next;
    setOccupancy(next);
    setGateScans((n) => n + 1);

    const event: AccessEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: signal.name,
      method: signal.method,
      time: clockLabel(),
      direction,
    };
    setLogs((prev) => [event, ...prev].slice(0, 6));

    const isClient = CLIENT_NAMES.includes(signal.name);
    if (direction === "IN" && isClient) {
      setArrived((prev) =>
        prev.includes(signal.name) ? prev : [...prev, signal.name],
      );
      showToast(`${signal.name} just arrived for their session`);
      beep("alert");
    } else {
      beep("scan");
    }
  };

  useEffect(() => {
    if (paused) return;
    return subscribeToAccessEvents(handleAccessEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") setPaused(true);
      else if (state === "active") setPaused(false);
    });
    return () => sub.remove();
  }, []);

  const changeDuty = (next: DutyStatus) => {
    if (next === duty) return;
    void Haptics.selectionAsync();

    const prevMode = modeFor(duty);
    const nextMode = modeFor(next);

    setClock((prev) => {
      const banked = settle(prev, Date.now());
      // Off Duty = clocked out: reset everything
      if (nextMode === "off") {
        return { workMs: 0, breakMs: 0, since: Date.now(), mode: "off" };
      }
      return { ...banked, mode: nextMode };
    });

    setDuty(next);
    setTeam((prev) =>
      prev.map((t) => (t.id === "TR-101" ? { ...t, status: next } : t)),
    );

    if (nextMode === "break" && prevMode === "work") {
      showToast("On break. Shift timer paused.");
    } else if (nextMode === "work" && prevMode === "break") {
      showToast("Back on duty. Shift timer running.");
    }
  };

  /** Ask before ending shift, then confirm */
  const askEndShift = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEndShiftConfirm(true);
  };

  const cancelEndShift = () => {
    void Haptics.selectionAsync();
    setEndShiftConfirm(false);
  };

  const confirmEndShift = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setEndShiftConfirm(false);
    changeDuty("Off Duty"); // resets the clock
    showToast("Shift ended. Clocked out successfully.");
  };

  const startShift = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setClock({ workMs: 0, breakMs: 0, since: Date.now(), mode: "work" });
    setDuty("On Floor");
    setTeam((prev) =>
      prev.map((t) => (t.id === "TR-101" ? { ...t, status: "On Floor" } : t)),
    );
    showToast("Shift started. You are back on the floor.");
  };

  const openNotes = (session: ClientSession) => {
    setActiveSession(session);
    setWeightsDraft(session.weights ?? "");
    setFeedbackDraft(session.feedback ?? "");
  };

  const closeNotes = () => setActiveSession(null);

  const saveNotes = () => {
    if (!activeSession) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              weights: weightsDraft.trim(),
              feedback: feedbackDraft.trim(),
            }
          : s,
      ),
    );
    closeNotes();
  };

  const completeSession = (id: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "Completed" } : s)),
    );
  };

  const occupancyPercent = Math.round((occupancy / MAX_CAPACITY) * 100);
  const occupancyTone =
    occupancyPercent >= 90
      ? KFitColors.error
      : occupancyPercent >= 75
        ? WARNING
        : KFitColors.accent;
  const occupancyLabel =
    occupancyPercent >= 90
      ? "At Capacity"
      : occupancyPercent >= 75
        ? "Busy"
        : "Optimal Flow";

  const activeTrainers = team.filter(
    (t) => t.status === "On Floor" || t.status === "In Session",
  ).length;
  const scheduledCount = sessions.filter(
    (s) => s.status !== "Completed",
  ).length;
  const completedCount = sessions.filter(
    (s) => s.status === "Completed",
  ).length;
  const inProgressCount = sessions.filter(
    (s) => s.status === "In Progress",
  ).length;

  const barAnim = useRef(new Animated.Value(occupancyPercent)).current;
  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: occupancyPercent,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [occupancyPercent, barAnim]);
  const barWidth = barAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <TrainerHeader />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={KFitColors.accent}
            colors={[KFitColors.accent]}
            progressBackgroundColor={KFitColors.surface}
          />
        }
      >
        {/* ── Header ─────────────────────────────── */}
        <View style={styles.headingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>TRAINER WORKSPACE</Text>
            <Text style={styles.h1}>Today</Text>
          </View>
          <View style={styles.onlineBadge}>
            <PulseDot active={!paused} size={5} />
            <Text
              style={[
                styles.onlineText,
                paused && { color: KFitColors.mutedText },
              ]}
            >
              {paused ? "PAUSED" : "LIVE"}
            </Text>
          </View>
        </View>

        {/* ── Hero profile card ───────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>MV</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.profileName}>Marcus Vance</Text>
              <Text style={styles.profileRole} numberOfLines={1}>
                Head Strength & Conditioning
              </Text>
            </View>
            <View style={styles.shiftBox}>
              <View style={styles.shiftLabelRow}>
                <PulseDot
                  active={clock.mode === "work"}
                  color={clockTone(clock.mode)}
                  size={5}
                />
                <Text
                  style={[
                    styles.shiftLabel,
                    clock.mode === "break" && { color: WARNING },
                  ]}
                >
                  {clock.mode === "break" ? "ON BREAK" : "SHIFT"}
                </Text>
              </View>
              <ShiftClock clock={clock} />
            </View>
          </View>

          <View style={styles.dutyDivider} />

          {/* ── Current status banner (BIG & CLEAR) ── */}
          <View
            style={[
              styles.currentStatusBanner,
              {
                backgroundColor: statusTone(duty) + "14",
                borderColor: statusTone(duty) + "44",
              },
            ]}
          >
            <View
              style={[
                styles.currentStatusIcon,
                {
                  backgroundColor: statusTone(duty) + "22",
                  borderColor: statusTone(duty) + "55",
                },
              ]}
            >
              <Feather
                name={
                  DUTY_OPTIONS.find((o) => o.label === duty)?.icon ?? "activity"
                }
                size={18}
                color={statusTone(duty)}
              />
            </View>
            <View style={styles.flex}>
              <Text
                style={[
                  styles.currentStatusEyebrow,
                  { color: statusTone(duty) },
                ]}
              >
                CURRENT DUTY
              </Text>
              <Text style={styles.currentStatusLabel}>{duty}</Text>
            </View>
            <View style={styles.currentStatusRight}>
              <Text
                style={[
                  styles.currentStatusState,
                  { color: clockTone(clock.mode) },
                ]}
              >
                {clock.mode === "work"
                  ? "CLOCKED IN"
                  : clock.mode === "break"
                    ? "ON BREAK"
                    : "CLOCKED OUT"}
              </Text>
              <Text style={styles.currentStatusHint}>
                {clock.mode === "work"
                  ? "Timer running"
                  : clock.mode === "break"
                    ? "Timer paused"
                    : "Tap Start Shift"}
              </Text>
            </View>
          </View>

          {/* ── Duty selector (icons + tinted active state) ── */}
          <Text style={styles.dutyLabel}>SET DUTY STATUS</Text>
          <View style={styles.dutyRow}>
            {DUTY_OPTIONS.map((opt) => {
              const selected = duty === opt.label;
              const tone = statusTone(opt.label);
              const disabled = !shiftActive && opt.label !== "Off Duty";
              return (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => changeDuty(opt.label)}
                  disabled={disabled}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Set duty to ${opt.label}`}
                  style={[
                    styles.dutyButton,
                    selected && {
                      backgroundColor: tone,
                      borderColor: tone,
                    },
                    disabled && styles.disabled,
                  ]}
                >
                  <Feather
                    name={opt.icon}
                    size={13}
                    color={
                      selected ? KFitColors.onAccent : KFitColors.mutedText
                    }
                  />
                  <Text
                    style={[styles.dutyText, selected && styles.dutyTextActive]}
                    numberOfLines={1}
                  >
                    {opt.short}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.dutyDivider} />

          {/* ── Shift control (BIG, unmistakable Start/End button) ── */}
          <View style={styles.shiftControlRow}>
            <View style={styles.flex}>
              <Text style={styles.timesheetTitle}>Shift Timesheet</Text>
              <Text style={styles.timesheetSub} numberOfLines={1}>
                {clock.mode === "work"
                  ? "Clocked IN • Timer running"
                  : clock.mode === "break"
                    ? "On break • Timer paused"
                    : "Clocked OUT • Tap Start Shift to begin"}
              </Text>
            </View>
          </View>

          {shiftActive ? (
            <TouchableOpacity
              onPress={askEndShift}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="End shift"
              style={[styles.bigShiftButton, styles.bigShiftButtonEnd]}
            >
              <View
                style={[
                  styles.bigShiftIconWrap,
                  { backgroundColor: KFitColors.error + "22" },
                ]}
              >
                <Feather name="log-out" size={18} color={KFitColors.error} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.bigShiftTitleEnd}>End Shift</Text>
                <Text style={styles.bigShiftHintEnd}>
                  Stop the clock · set Off Duty
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={18}
                color={KFitColors.error}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={startShift}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Start shift"
              style={[styles.bigShiftButton, styles.bigShiftButtonStart]}
            >
              <View
                style={[
                  styles.bigShiftIconWrap,
                  { backgroundColor: KFitColors.onAccent + "22" },
                ]}
              >
                <Feather name="play" size={18} color={KFitColors.onAccent} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.bigShiftTitleStart}>Start Shift</Text>
                <Text style={styles.bigShiftHintStart}>
                  Clock IN · set On Floor
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={18}
                color={KFitColors.onAccent}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Unified stat card ──────────────────── */}
        <View style={styles.statCard}>
          <StatInline
            label="Sessions"
            value={scheduledCount}
            tone={KFitColors.accent}
          />
          <View style={styles.statDivider} />
          <StatInline label="Active" value={inProgressCount} tone={PURPLE} />
          <View style={styles.statDivider} />
          <StatInline label="Trainers" value={activeTrainers} tone={SUCCESS} />
          <View style={styles.statDivider} />
          <StatInline label="Done" value={completedCount} tone="#3B82F6" />
        </View>

        {/* ── Live occupancy ──────────────────────── */}
        <View style={styles.snapshotCard}>
          <View style={styles.snapshotHeader}>
            <View style={styles.flex}>
              <Text style={styles.chip}>LIVE GYM STATUS</Text>
              <Text style={styles.snapshotTitle}>Occupancy</Text>
            </View>
            <View style={styles.snapshotNumbers}>
              <FlashValue value={occupancy} style={styles.snapshotBig} />
              <Text style={styles.snapshotMax}>/ {MAX_CAPACITY}</Text>
            </View>
          </View>

          <Text style={styles.snapshotCaption}>
            <Text
              style={[styles.snapshotCaptionAccent, { color: occupancyTone }]}
            >
              {occupancyPercent}%
            </Text>{" "}
            · {occupancyLabel}
          </Text>

          <View style={styles.barTrack}>
            <Animated.View
              style={[
                styles.barFill,
                { width: barWidth, backgroundColor: occupancyTone },
              ]}
            />
          </View>

          <View style={styles.snapshotMetaRow}>
            <View style={styles.snapshotMetaItem}>
              <Feather name="users" size={11} color={KFitColors.mutedText} />
              <Text style={styles.snapshotMetaLabel}>Active trainers</Text>
              <FlashValue
                value={activeTrainers}
                style={styles.snapshotMetaValue}
              />
            </View>
            <View style={styles.snapshotMetaItem}>
              <Feather name="log-in" size={11} color={KFitColors.mutedText} />
              <Text style={styles.snapshotMetaLabel}>Gate scans</Text>
              <FlashValue value={gateScans} style={styles.snapshotMetaValue} />
            </View>
          </View>
        </View>

        {/* ── Sessions ────────────────────────────── */}
        <View style={styles.card}>
          <SectionHeading
            eyebrow="TODAY'S SHIFT"
            title="Client Sessions"
            right={`${scheduledCount} scheduled`}
          />

          <View style={styles.sessionList}>
            {sessions.map((s, idx) => {
              const inProgress = s.status === "In Progress";
              const completed = s.status === "Completed";
              const hasArrived = arrived.includes(s.clientName) && !completed;
              const isLast = idx === sessions.length - 1;
              return (
                <View
                  key={s.id}
                  style={[styles.sessionRow, !isLast && styles.rowDivider]}
                >
                  <View style={styles.sessionTimeBlock}>
                    <Text style={styles.sessionTimeValue} numberOfLines={1}>
                      {s.time.split(" - ")[0]}
                    </Text>
                    <Text style={styles.sessionTimeEnd} numberOfLines={1}>
                      to {s.time.split(" - ")[1]}
                    </Text>
                    <View style={styles.sessionStatusDotWrap}>
                      <View
                        style={[
                          styles.sessionStatusDot,
                          {
                            backgroundColor: completed
                              ? KFitColors.mutedText
                              : inProgress
                                ? KFitColors.accent
                                : KFitColors.border,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.rowDividerBar} />

                  <View style={styles.flex}>
                    <View style={styles.nameRow}>
                      <Text style={styles.sessionName} numberOfLines={1}>
                        {s.clientName}
                      </Text>
                      {inProgress && (
                        <View style={styles.liveTag}>
                          <View style={styles.liveTagDot} />
                          <Text style={styles.liveTagText}>LIVE</Text>
                        </View>
                      )}
                      {hasArrived && !inProgress && (
                        <View style={styles.arrivedTag}>
                          <Feather
                            name="check"
                            size={8}
                            color={KFitColors.accent}
                          />
                          <Text style={styles.arrivedText}>CHECKED IN</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.sessionFocus} numberOfLines={1}>
                      {s.focus}
                    </Text>
                    {(s.weights || s.feedback) && (
                      <View style={styles.noteSaved}>
                        <Feather
                          name="check-circle"
                          size={10}
                          color={KFitColors.accent}
                        />
                        <Text style={styles.noteSavedText} numberOfLines={1}>
                          {[s.weights, s.feedback].filter(Boolean).join(" • ")}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.sessionFooter}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                const next = sessions.find((s) => s.status !== "Completed");
                if (next) openNotes(next);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Log notes for next session"
            >
              <Feather name="edit-3" size={13} color={KFitColors.text} />
              <Text style={styles.secondaryButtonText}>Log Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primarySmallButton}
              onPress={() => {
                const next = sessions.find((s) => s.status !== "Completed");
                if (next) completeSession(next.id);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Complete next session"
            >
              <Feather name="check" size={13} color={KFitColors.onAccent} />
              <Text style={styles.primarySmallButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Team on duty ────────────────────────── */}
        <View style={styles.card}>
          <SectionHeading
            eyebrow="COACH DIRECTORY"
            title="Team on Duty"
            right={`${team.length} coaches`}
          />
          {team.map((t, idx) => (
            <View
              key={t.id}
              style={[
                styles.teamRow,
                idx !== team.length - 1 && styles.teamRowDivider,
              ]}
            >
              <View style={styles.teamAvatar}>
                <Text style={styles.teamAvatarText}>{t.avatar}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.teamName}>{t.name}</Text>
                <Text style={styles.teamSpecialty} numberOfLines={1}>
                  {t.specialty}
                </Text>
              </View>
              <View style={styles.teamRating}>
                <Feather name="star" size={10} color={KFitColors.accent} />
                <Text style={styles.teamRatingText}>{t.rating.toFixed(1)}</Text>
              </View>
              <StatusPill status={t.status} />
            </View>
          ))}
        </View>

        {/* ── Live access log ─────────────────────── */}
        <View style={styles.card}>
          <SectionHeading
            eyebrow="DOOR TERMINAL"
            title="Live Access Log"
            right={
              <View style={styles.liveControls}>
                <TouchableOpacity
                  onPress={() => setMuted((m) => !m)}
                  activeOpacity={0.7}
                  style={styles.liveMiniButton}
                  accessibilityRole="button"
                  accessibilityLabel={muted ? "Unmute beeps" : "Mute beeps"}
                >
                  <Feather
                    name={muted ? "volume-x" : "volume-2"}
                    size={13}
                    color={muted ? KFitColors.mutedText : KFitColors.accent}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPaused((p) => !p)}
                  activeOpacity={0.7}
                  style={styles.liveMiniButton}
                  accessibilityRole="button"
                  accessibilityLabel={paused ? "Resume stream" : "Pause stream"}
                >
                  <Feather
                    name={paused ? "play" : "pause"}
                    size={13}
                    color={KFitColors.accent}
                  />
                </TouchableOpacity>
              </View>
            }
          />

          <View style={styles.liveStatusRow}>
            <PulseDot active={!paused} size={5} />
            <Text style={styles.liveStatusText}>
              {paused ? "STREAM PAUSED" : "LISTENING FOR SCANS"}
              {muted ? " • BEEP OFF" : ""}
            </Text>
          </View>

          {logs.map((log) => (
            <AccessRow key={log.id} event={log} />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>KFIT TRAINER WORKSPACE</Text>
        </View>
      </ScrollView>

      {/* Toast */}
      {toast && (
        <View style={styles.toast}>
          <View style={styles.toastIcon}>
            <Feather name="bell" size={16} color={KFitColors.onAccent} />
          </View>
          <View style={styles.toastBody}>
            <View style={styles.toastHeaderRow}>
              <Text style={styles.toastLabel}>LIVE ALERT</Text>
              <Text style={styles.toastTime}>Just now</Text>
            </View>
            <Text style={styles.toastMessage}>{toast}</Text>
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

      <TrainerBottomNav activeRoute="/trainer-dashboard" />

      {/* Notes modal */}
      <Modal
        visible={!!activeSession}
        transparent
        animationType="slide"
        onRequestClose={closeNotes}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.flex}>
                <Text style={styles.modalEyebrow}>WORKOUT LOG</Text>
                <Text style={styles.modalTitle}>
                  {activeSession?.clientName ?? ""}
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeNotes}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={16} color={KFitColors.mutedText} />
              </TouchableOpacity>
            </View>

            {activeSession && (
              <View style={styles.modalClient}>
                <Text style={styles.modalClientMeta}>
                  {activeSession.focus} · {activeSession.time}
                </Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>WEIGHT & PERFORMANCE</Text>
            <TextInput
              style={styles.input}
              value={weightsDraft}
              onChangeText={setWeightsDraft}
              placeholder="e.g. Squat 120kg 3×5 · Bench 90kg"
              placeholderTextColor={KFitColors.mutedText}
            />

            <Text style={styles.fieldLabel}>COACH RECOMMENDATIONS</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={feedbackDraft}
              onChangeText={setFeedbackDraft}
              placeholder="e.g. Focus on ankle mobility during warmups…"
              placeholderTextColor={KFitColors.mutedText}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={closeNotes}
                activeOpacity={0.85}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSave]}
                onPress={saveNotes}
                activeOpacity={0.85}
              >
                <Feather name="save" size={13} color={KFitColors.onAccent} />
                <Text style={styles.modalSaveText}>Save log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* End Shift confirmation dialog */}
      <Modal
        visible={endShiftConfirm}
        transparent
        animationType="fade"
        onRequestClose={cancelEndShift}
      >
        <Pressable style={styles.confirmBackdrop} onPress={cancelEndShift}>
          <Pressable
            style={styles.confirmCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.confirmIconWrap}>
              <Feather name="log-out" size={22} color={KFitColors.error} />
            </View>
            <Text style={styles.confirmTitle}>End shift?</Text>
            <Text style={styles.confirmBody}>
              The clock will stop, your duty will be set to Off Duty, and
              members will not see you on the floor.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmCancel]}
                onPress={cancelEndShift}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Cancel ending shift"
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmDanger]}
                onPress={confirmEndShift}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Confirm end shift"
              >
                <Feather name="log-out" size={13} color="#fff" />
                <Text style={styles.confirmDangerText}>End Shift</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* ─────────────── Small components ─────────────── */
function StatInline({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <View style={styles.statInline}>
      <Text style={[styles.statInlineValue, { color: tone }]}>{value}</Text>
      <Text style={styles.statInlineLabel}>{label}</Text>
    </View>
  );
}

/* ─────────────── Styles ─────────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1, backgroundColor: KFitColors.background },
  container: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 14,
  },
  flex: { flex: 1, minWidth: 0 },
  disabled: { opacity: 0.4 },

  /* Header */
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  h1: {
    color: KFitColors.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: -0.4,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    backgroundColor: KFitColors.accent + "12",
  },
  onlineText: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "monospace",
    letterSpacing: 0.6,
  },

  /* Profile */
  profileCard: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 16,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    color: KFitColors.onAccent,
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  profileName: { color: KFitColors.text, fontSize: 15, fontWeight: "800" },
  profileRole: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  shiftBox: { alignItems: "flex-end" },
  shiftLabelRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  shiftLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 1.2,
    fontFamily: "monospace",
  },
  shiftValue: {
    color: KFitColors.accent,
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "monospace",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 3,
    overflow: "hidden",
  },
  dutyDivider: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 12,
  },

  /* Current status banner */
  currentStatusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  currentStatusIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  currentStatusEyebrow: {
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    fontWeight: "800",
  },
  currentStatusLabel: {
    color: KFitColors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: -0.2,
  },
  currentStatusRight: { alignItems: "flex-end" },
  currentStatusState: {
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.6,
  },
  currentStatusHint: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },

  /* Duty */
  dutyLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    marginBottom: 8,
  },
  dutyRow: { flexDirection: "row", gap: 6 },
  dutyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  dutyText: { color: KFitColors.mutedText, fontSize: 11, fontWeight: "700" },
  dutyTextActive: { color: KFitColors.onAccent, fontWeight: "900" },

  /* Shift control */
  shiftControlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  timesheetTitle: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  timesheetSub: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },

  /* Big, unmistakable Start / End Shift button */
  bigShiftButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  bigShiftButtonEnd: {
    backgroundColor: KFitColors.error + "12",
    borderColor: KFitColors.error + "55",
  },
  bigShiftButtonStart: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  bigShiftIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bigShiftTitleEnd: {
    color: KFitColors.error,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  bigShiftHintEnd: {
    color: KFitColors.error,
    opacity: 0.75,
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 2,
  },
  bigShiftTitleStart: {
    color: KFitColors.onAccent,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  bigShiftHintStart: {
    color: KFitColors.onAccent,
    opacity: 0.85,
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 2,
  },

  /* Stat card */
  statCard: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  statInline: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 10,
  },
  statInlineValue: {
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.4,
  },
  statInlineLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: "monospace",
  },

  /* Snapshot */
  snapshotCard: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  snapshotHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  chip: {
    alignSelf: "flex-start",
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
  },
  snapshotTitle: {
    color: KFitColors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
    letterSpacing: -0.3,
  },
  snapshotNumbers: { flexDirection: "row", alignItems: "baseline" },
  snapshotBig: {
    fontSize: 32,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.8,
  },
  snapshotMax: {
    color: KFitColors.mutedText,
    fontSize: 12,
    marginLeft: 4,
    fontFamily: "monospace",
  },
  snapshotCaption: { color: KFitColors.mutedText, fontSize: 12 },
  snapshotCaptionAccent: { fontWeight: "800" },
  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 999 },
  snapshotMetaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  snapshotMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  snapshotMetaLabel: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
  },
  snapshotMetaValue: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "monospace",
  },

  /* Generic card */
  card: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    color: KFitColors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: -0.2,
  },
  sectionRight: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontFamily: "monospace",
  },

  /* Sessions */
  sessionList: { marginTop: 4 },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  rowDividerBar: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: KFitColors.border,
    marginVertical: 2,
  },
  sessionTimeBlock: { width: 76, position: "relative" },
  sessionTimeValue: {
    color: KFitColors.accent,
    fontSize: 13,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  sessionTimeEnd: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },
  sessionStatusDotWrap: {
    position: "absolute",
    top: 5,
    left: -10,
    width: 4,
    height: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionStatusDot: { width: 4, height: 4, borderRadius: 2 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  sessionName: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 1,
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
  },
  liveTagDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: KFitColors.accent,
  },
  liveTagText: {
    color: KFitColors.accent,
    fontSize: 7,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.6,
  },
  arrivedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "10",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
  },
  arrivedText: {
    color: KFitColors.accent,
    fontSize: 7,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.6,
  },
  sessionFocus: { color: KFitColors.mutedText, fontSize: 11, marginTop: 2 },
  noteSaved: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: KFitColors.accent + "10",
    marginTop: 4,
    alignSelf: "flex-start",
  },
  noteSavedText: {
    color: KFitColors.mutedText,
    fontSize: 9,
    flex: 1,
    fontFamily: "monospace",
  },

  sessionFooter: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  secondaryButtonText: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  primarySmallButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  primarySmallButtonText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "800",
  },

  /* Team */
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  teamRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  teamAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  teamAvatarText: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  teamName: { color: KFitColors.text, fontSize: 13, fontWeight: "700" },
  teamSpecialty: { color: KFitColors.mutedText, fontSize: 10, marginTop: 2 },
  teamRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  teamRatingText: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillDot: { width: 5, height: 5, borderRadius: 3, marginHorizontal: 4 },
  pillText: { fontSize: 9, fontWeight: "800", fontFamily: "monospace" },

  /* Live access */
  liveControls: { flexDirection: "row", gap: 6 },
  liveMiniButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  liveStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: -4,
  },
  liveStatusText: {
    color: KFitColors.mutedText,
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: "monospace",
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    padding: 10,
  },
  logIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  logName: { color: KFitColors.text, fontSize: 12, fontWeight: "700" },
  logMethod: {
    color: KFitColors.mutedText,
    fontSize: 10,
    marginTop: 2,
    fontFamily: "monospace",
  },
  logRight: { alignItems: "flex-end" },
  logDirection: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
    fontFamily: "monospace",
  },
  logTime: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },

  /* Footer */
  footer: { alignItems: "center", paddingVertical: 12 },
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.surface,
    elevation: 8,
  },
  toastIcon: {
    width: 32,
    height: 32,
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

  /* Notes modal */
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalSheet: {
    backgroundColor: KFitColors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: KFitColors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: KFitColors.border,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalEyebrow: {
    color: KFitColors.accent,
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  modalTitle: {
    color: KFitColors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: -0.2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  modalClient: {
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 10,
    padding: 10,
  },
  modalClientMeta: {
    color: KFitColors.accent,
    fontSize: 11,
    fontFamily: "monospace",
  },
  fieldLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    marginTop: 4,
  },
  input: {
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 10,
    padding: 10,
    color: KFitColors.text,
    fontSize: 12,
  },
  inputMultiline: { minHeight: 80 },
  modalButtons: { flexDirection: "row", gap: 8, marginTop: 6 },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  modalCancel: { borderWidth: 1, borderColor: KFitColors.border },
  modalCancelText: {
    color: KFitColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  modalSave: { backgroundColor: KFitColors.accent },
  modalSaveText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "800",
  },

  /* End shift confirmation dialog */
  confirmBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  confirmCard: {
    width: "100%",
    maxWidth: 320,
    gap: 12,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    alignItems: "center",
  },
  confirmIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.error + "14",
    borderWidth: 1,
    borderColor: KFitColors.error + "44",
    marginBottom: 4,
  },
  confirmTitle: {
    color: KFitColors.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  confirmBody: {
    color: KFitColors.mutedText,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    width: "100%",
  },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmCancel: {
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  confirmCancelText: {
    color: KFitColors.mutedText,
    fontSize: 13,
    fontWeight: "800",
  },
  confirmDanger: {
    backgroundColor: KFitColors.error,
  },
  confirmDangerText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
});
