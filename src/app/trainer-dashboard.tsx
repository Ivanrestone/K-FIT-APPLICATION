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
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ------------------------------------------------------------------ */
/* Types + data                                                        */
/* ------------------------------------------------------------------ */
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

// Extra status colors that are not part of the shared theme
const WARNING = "#F59E0B";
const PURPLE = "#8B5CF6";

const DUTY_OPTIONS: { label: DutyStatus; short: string }[] = [
  { label: "On Floor", short: "On Floor" },
  { label: "In Session", short: "In Session" },
  { label: "On Break", short: "On Break" },
  { label: "Off Duty", short: "Off Duty" },
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

/* ------------------------------------------------------------------ */
/* Realtime door stream                                                */
/* ------------------------------------------------------------------ */
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

/**
 * MOCK door stream: emits a scan every 3 to 7 seconds.
 * To go live, replace the body with your real subscription (WebSocket,
 * Supabase realtime, Firebase onSnapshot...) and keep the same signature:
 * call onSignal() for every scan and return a function that unsubscribes.
 */
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

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Blinking live indicator                                             */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Number that flashes accent whenever its value changes               */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Live shift clock (own component so only it re-renders every second) */
/* ------------------------------------------------------------------ */
function ShiftClock({ active, start }: { active: boolean; start: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  return (
    <Text style={[styles.shiftValue, !active && { color: KFitColors.error }]}>
      {active ? formatElapsed(now - start) : "CLOCKED OUT"}
    </Text>
  );
}

/* ------------------------------------------------------------------ */
/* Access log row (flashes when a new scan arrives)                    */
/* ------------------------------------------------------------------ */
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
          { borderColor: tone + "59", backgroundColor: tone + "1A" },
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

/* ------------------------------------------------------------------ */
/* Small reusable pieces                                               */
/* ------------------------------------------------------------------ */
function StatusPill({ status }: { status: DutyStatus }) {
  const tone = statusTone(status);
  const live = status === "On Floor" || status === "In Session";
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: tone + "1F", borderColor: tone + "55" },
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

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */
export default function TrainerDashboardScreen() {
  const [duty, setDuty] = useState<DutyStatus>("On Floor");
  const [team, setTeam] = useState<Trainer[]>(INITIAL_TEAM);
  const [sessions, setSessions] = useState<ClientSession[]>(INITIAL_SESSIONS);

  /* ---------- Shift clock ---------- */
  const [shiftActive, setShiftActive] = useState(true);
  // Demo: shift started 4h 12m ago. Replace with the real clock-in time.
  const [shiftStart, setShiftStart] = useState(
    Date.now() - (4 * 60 + 12) * 60000,
  );

  /* ---------- Realtime state ---------- */
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

  /* ---------- Notes modal ---------- */
  const [activeSession, setActiveSession] = useState<ClientSession | null>(
    null,
  );
  const [weightsDraft, setWeightsDraft] = useState("");
  const [feedbackDraft, setFeedbackDraft] = useState("");

  /* ---------- Pull to refresh ---------- */
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  /* ---------- Beep (haptic) ---------- */
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

  /* ---------- One place that handles every door scan ---------- */
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

  // Listen to the door stream while the app is in the foreground and not paused
  useEffect(() => {
    if (paused) return;
    return subscribeToAccessEvents(handleAccessEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // Pause everything when the app goes to the background
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") setPaused(true);
      else if (state === "active") setPaused(false);
    });
    return () => sub.remove();
  }, []);

  /* ---------- Handlers ---------- */
  const changeDuty = (next: DutyStatus) => {
    void Haptics.selectionAsync();
    setDuty(next);
    setTeam((prev) =>
      prev.map((t) => (t.id === "TR-101" ? { ...t, status: next } : t)),
    );
  };

  const toggleShift = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (shiftActive) {
      setShiftActive(false);
      changeDuty("Off Duty");
    } else {
      setShiftStart(Date.now());
      setShiftActive(true);
      changeDuty("On Floor");
    }
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

  /* ---------- Derived ---------- */
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

  // Smooth occupancy bar
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
        {/* ---------------- Coach profile + duty ---------------- */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.profileLeft}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>MV</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.profileName}>Marcus Vance</Text>
                <Text style={styles.profileRole} numberOfLines={2}>
                  Head Strength & Conditioning Coach
                </Text>
              </View>
            </View>
            <View style={styles.shiftBox}>
              <View style={styles.shiftLabelRow}>
                <PulseDot active={shiftActive} size={5} />
                <Text style={styles.shiftLabel}>ACTIVE SHIFT</Text>
              </View>
              <ShiftClock active={shiftActive} start={shiftStart} />
            </View>
          </View>

          <View style={styles.dutyDivider} />
          <Text style={styles.dutyLabel}>UPDATE LIVE DUTY STATUS</Text>
          <View style={styles.dutyRow}>
            {DUTY_OPTIONS.map((opt) => {
              const selected = duty === opt.label;
              return (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => changeDuty(opt.label)}
                  disabled={!shiftActive && opt.label !== "Off Duty"}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.dutyButton,
                    selected && styles.dutyButtonActive,
                    !shiftActive && opt.label !== "Off Duty" && styles.disabled,
                  ]}
                >
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
        </View>

        {/* ---------------- Gym snapshot ---------------- */}
        <View style={styles.snapshotCard}>
          <View style={styles.snapshotHeader}>
            <View>
              <Text style={styles.chip}>LIVE GYM STATUS</Text>
              <Text style={styles.snapshotTitle}>REALTIME OCCUPANCY</Text>
            </View>
            <View
              style={[
                styles.onlineBadge,
                paused && {
                  borderColor: KFitColors.border,
                  backgroundColor: KFitColors.background,
                },
              ]}
            >
              <PulseDot active={!paused} size={5} />
              <Text
                style={[
                  styles.onlineText,
                  paused && { color: KFitColors.mutedText },
                ]}
              >
                {paused ? "PAUSED" : "ONLINE"}
              </Text>
            </View>
          </View>

          <View style={styles.snapshotNumbers}>
            <FlashValue value={occupancy} style={styles.snapshotBig} />
            <Text style={styles.snapshotMax}>/ {MAX_CAPACITY} Max</Text>
          </View>
          <Text style={styles.snapshotCaption}>
            Capacity at{" "}
            <Text
              style={[styles.snapshotCaptionAccent, { color: occupancyTone }]}
            >
              {occupancyPercent}%
            </Text>{" "}
            ({occupancyLabel})
          </Text>
          <View style={styles.barTrack}>
            <Animated.View
              style={[
                styles.barFill,
                { width: barWidth, backgroundColor: occupancyTone },
              ]}
            />
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Active Trainers</Text>
              <Feather name="users" size={14} color={KFitColors.accent} />
            </View>
            <FlashValue value={activeTrainers} style={styles.metricValue} />
            <Text style={styles.metricCaption}>On Floor Duty Now</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Gate Scans Today</Text>
              <Feather name="log-in" size={14} color={KFitColors.accent} />
            </View>
            <FlashValue value={gateScans} style={styles.metricValue} />
            <Text style={styles.metricCaption}>Door Face AI & QR</Text>
          </View>
        </View>

        {/* ---------------- Client sessions ---------------- */}
        <View style={styles.card}>
          <SectionHeading
            eyebrow="TODAY'S SHIFT"
            title="CLIENT SESSIONS"
            right={`${scheduledCount} Scheduled`}
          />

          {sessions.map((s) => {
            const inProgress = s.status === "In Progress";
            const completed = s.status === "Completed";
            const hasArrived = arrived.includes(s.clientName) && !completed;
            return (
              <View
                key={s.id}
                style={[
                  styles.sessionCard,
                  hasArrived && styles.sessionCardArrived,
                ]}
              >
                <View style={styles.sessionTop}>
                  <View style={styles.flex}>
                    <View style={styles.sessionNameRow}>
                      <Text style={styles.sessionName} numberOfLines={1}>
                        {s.clientName}
                      </Text>
                      <View
                        style={[
                          styles.sessionBadge,
                          inProgress && styles.sessionBadgeLive,
                          completed && styles.sessionBadgeDone,
                        ]}
                      >
                        {inProgress && <PulseDot size={4} />}
                        <Text
                          style={[
                            styles.sessionBadgeText,
                            (inProgress || completed) && {
                              color: KFitColors.accent,
                            },
                          ]}
                        >
                          {s.status}
                        </Text>
                      </View>
                      {hasArrived && (
                        <View style={styles.arrivedBadge}>
                          <PulseDot size={4} />
                          <Text style={styles.arrivedText}>CHECKED IN</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.sessionFocus}>{s.focus}</Text>
                    <Text style={styles.sessionTime}>{s.time}</Text>
                  </View>
                </View>

                {(s.weights || s.feedback) && (
                  <View style={styles.noteSaved}>
                    <Feather
                      name="check-circle"
                      size={12}
                      color={KFitColors.accent}
                    />
                    <Text style={styles.noteSavedText} numberOfLines={2}>
                      {[s.weights, s.feedback].filter(Boolean).join(" • ")}
                    </Text>
                  </View>
                )}

                <View style={styles.sessionActions}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => openNotes(s)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Log notes for ${s.clientName}`}
                  >
                    <Feather name="edit-3" size={13} color={KFitColors.text} />
                    <Text style={styles.secondaryButtonText}>Log Notes</Text>
                  </TouchableOpacity>
                  {!completed && (
                    <TouchableOpacity
                      style={styles.primarySmallButton}
                      onPress={() => completeSession(s.id)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Mark ${s.clientName} session complete`}
                    >
                      <Feather
                        name="check"
                        size={13}
                        color={KFitColors.onAccent}
                      />
                      <Text style={styles.primarySmallButtonText}>
                        Complete
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* ---------------- Shift timesheet ---------------- */}
        <View style={styles.timesheetCard}>
          <View style={styles.flex}>
            <Text style={styles.timesheetTitle}>Shift Timesheet</Text>
            <Text style={styles.timesheetSub}>
              {shiftActive
                ? "Clocked IN at 07:00 AM • Floor Station A"
                : "Clocked OUT • Tap Start Shift to begin"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={toggleShift}
            activeOpacity={0.8}
            accessibilityRole="button"
            style={[
              styles.shiftButton,
              shiftActive ? styles.shiftButtonEnd : styles.shiftButtonStart,
            ]}
          >
            <Text
              style={[
                styles.shiftButtonText,
                { color: shiftActive ? KFitColors.error : KFitColors.onAccent },
              ]}
            >
              {shiftActive ? "End Shift" : "Start Shift"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- Team on duty ---------------- */}
        <View style={styles.card}>
          <SectionHeading eyebrow="COACH DIRECTORY" title="TEAM ON DUTY" />
          {team.map((t) => (
            <View key={t.id} style={styles.teamRow}>
              <View style={styles.teamAvatar}>
                <Text style={styles.teamAvatarText}>{t.avatar}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.teamName}>{t.name}</Text>
                <Text style={styles.teamSpecialty} numberOfLines={1}>
                  {t.specialty}
                </Text>
              </View>
              <StatusPill status={t.status} />
            </View>
          ))}
        </View>

        {/* ---------------- Live access log ---------------- */}
        <View style={styles.card}>
          <SectionHeading
            eyebrow="DOOR TERMINAL"
            title="LIVE ACCESS LOG"
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
          <Text style={styles.footerName}>Marcus Vance</Text>
          <Text style={styles.footerLabel}>KFIT TRAINER WORKSPACE</Text>
        </View>
      </ScrollView>

      {/* Live arrival banner */}
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

      {/* Floating bottom navigation */}
      <TrainerBottomNav activeRoute="/trainer-dashboard" />

      {/* ---------------- Log notes modal ---------------- */}
      <Modal
        visible={!!activeSession}
        transparent
        animationType="fade"
        onRequestClose={closeNotes}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>LOG WORKOUT & NOTES</Text>
              <TouchableOpacity
                onPress={closeNotes}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Feather name="x" size={18} color={KFitColors.mutedText} />
              </TouchableOpacity>
            </View>

            {activeSession && (
              <View style={styles.modalClient}>
                <Text style={styles.modalClientName}>
                  {activeSession.clientName}
                </Text>
                <Text style={styles.modalClientMeta}>
                  {activeSession.focus} ({activeSession.time})
                </Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>WEIGHT & PERFORMANCE NOTES</Text>
            <TextInput
              style={styles.input}
              value={weightsDraft}
              onChangeText={setWeightsDraft}
              placeholder="e.g., Squat: 120kg 3x5, Bench: 90kg"
              placeholderTextColor={KFitColors.mutedText}
            />

            <Text style={styles.fieldLabel}>COACH RECOMMENDATIONS</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={feedbackDraft}
              onChangeText={setFeedbackDraft}
              placeholder="e.g., Work on ankle mobility during warmups..."
              placeholderTextColor={KFitColors.mutedText}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={closeNotes}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSave]}
                onPress={saveNotes}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Save Workout Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1, backgroundColor: KFitColors.background },
  container: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120, // room for the floating bottom nav
    gap: 14,
  },
  flex: { flex: 1, minWidth: 0 },
  disabled: { opacity: 0.4 },

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
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  profileLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  shiftBox: { alignItems: "flex-end" },
  shiftLabelRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  shiftLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 1,
    fontFamily: "monospace",
  },
  shiftValue: {
    color: KFitColors.accent,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "monospace",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
    overflow: "hidden",
  },
  dutyDivider: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginTop: 14,
    marginBottom: 12,
  },
  dutyLabel: {
    color: KFitColors.mutedText,
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: "monospace",
    marginBottom: 8,
  },
  dutyRow: { flexDirection: "row", gap: 6 },
  dutyButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  dutyButtonActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  dutyText: { color: KFitColors.mutedText, fontSize: 11, fontWeight: "700" },
  dutyTextActive: { color: KFitColors.onAccent },

  /* Snapshot */
  snapshotCard: {
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 16,
    padding: 16,
  },
  snapshotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  chip: {
    alignSelf: "flex-start",
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 1,
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
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    backgroundColor: KFitColors.accent + "1A",
  },
  onlineText: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  snapshotNumbers: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  snapshotBig: {
    fontSize: 38,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  snapshotMax: { color: KFitColors.mutedText, fontSize: 13, marginLeft: 6 },
  snapshotCaption: { color: KFitColors.mutedText, fontSize: 12, marginTop: 2 },
  snapshotCaptionAccent: { fontWeight: "800" },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    overflow: "hidden",
    marginTop: 12,
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
  },

  /* Metrics */
  metricRow: { flexDirection: "row", gap: 12 },
  metricCard: {
    flex: 1,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    padding: 14,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  metricLabel: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
    flexShrink: 1,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  metricCaption: { color: KFitColors.mutedText, fontSize: 10, marginTop: 4 },

  /* Generic card + headings */
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
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: "monospace",
  },
  sectionTitle: {
    color: KFitColors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },
  sectionRight: {
    color: KFitColors.mutedText,
    fontSize: 12,
    fontFamily: "monospace",
  },

  /* Sessions */
  sessionCard: {
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  sessionCardArrived: {
    borderColor: KFitColors.accent + "88",
  },
  sessionTop: { flexDirection: "row" },
  sessionNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  sessionName: { color: KFitColors.text, fontSize: 13, fontWeight: "800" },
  sessionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  sessionBadgeLive: {
    backgroundColor: KFitColors.accent + "26",
    borderColor: KFitColors.accent + "55",
    paddingLeft: 2,
  },
  sessionBadgeDone: {
    backgroundColor: KFitColors.accent + "14",
    borderColor: KFitColors.accent + "33",
  },
  sessionBadgeText: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  arrivedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: 2,
    paddingRight: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: KFitColors.accent + "26",
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
  },
  arrivedText: {
    color: KFitColors.accent,
    fontSize: 9,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  sessionFocus: { color: KFitColors.mutedText, fontSize: 12, marginTop: 4 },
  sessionTime: {
    color: KFitColors.accent,
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 4,
  },
  noteSaved: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: KFitColors.accent + "14",
  },
  noteSavedText: { color: KFitColors.mutedText, fontSize: 11, flex: 1 },
  sessionActions: { flexDirection: "row", gap: 8 },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  secondaryButtonText: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  primarySmallButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  primarySmallButtonText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "800",
  },

  /* Timesheet */
  timesheetCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    padding: 14,
  },
  timesheetTitle: { color: KFitColors.text, fontSize: 13, fontWeight: "800" },
  timesheetSub: { color: KFitColors.mutedText, fontSize: 11, marginTop: 3 },
  shiftButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  shiftButtonEnd: {
    backgroundColor: KFitColors.error + "26",
    borderColor: KFitColors.error + "55",
  },
  shiftButtonStart: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  shiftButtonText: { fontSize: 12, fontWeight: "800" },

  /* Team */
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    padding: 10,
  },
  teamAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  teamAvatarText: {
    color: KFitColors.accent,
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  teamName: { color: KFitColors.text, fontSize: 13, fontWeight: "700" },
  teamSpecialty: { color: KFitColors.mutedText, fontSize: 11, marginTop: 2 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 5 },
  pillText: { fontSize: 10, fontWeight: "700", fontFamily: "monospace" },

  /* Live access log */
  liveControls: { flexDirection: "row", gap: 6 },
  liveMiniButton: {
    width: 30,
    height: 30,
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
    letterSpacing: 1,
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
  logMethod: { color: KFitColors.mutedText, fontSize: 10, marginTop: 2 },
  logRight: { alignItems: "flex-end" },
  logDirection: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  logTime: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },

  /* Footer */
  footer: { alignItems: "center", paddingVertical: 20 },
  footerName: { color: KFitColors.text, fontSize: 18, fontWeight: "800" },
  footerLabel: {
    color: KFitColors.mutedText,
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 4,
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
  toastBody: { flex: 1, minWidth: 0 },
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
  toastTime: { color: KFitColors.mutedText, fontSize: 10 },
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
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    gap: 10,
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  modalTitle: { color: KFitColors.text, fontSize: 14, fontWeight: "900" },
  modalClient: {
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    padding: 12,
  },
  modalClientName: { color: KFitColors.text, fontSize: 13, fontWeight: "800" },
  modalClientMeta: {
    color: KFitColors.accent,
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 3,
  },
  fieldLabel: {
    color: KFitColors.mutedText,
    fontSize: 10,
    letterSpacing: 0.8,
    fontFamily: "monospace",
    marginTop: 4,
  },
  input: {
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 12,
    padding: 10,
    color: KFitColors.text,
    fontSize: 13,
  },
  inputMultiline: { minHeight: 84 },
  modalButtons: { flexDirection: "row", gap: 8, marginTop: 6 },
  modalButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
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
});
