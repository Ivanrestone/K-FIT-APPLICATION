import MemberBottomNav from "@/components/MemberBottomNav";
import { KFitColors } from "@/constants/theme";
import { useAttendanceHistory, formatAttendanceDate, formatAttendanceTime, attendanceDuration } from "@/hooks/use-attendance";
import { useLogout } from "@/hooks/use-logout";
import { useMemberProfile } from "@/hooks/use-member-profile";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NAV_CLEARANCE = 140;

type FeatherName = keyof typeof Feather.glyphMap;

const formatDuration = (ms: number) => {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder}m` : `${minutes} min`;
};

const formatClock = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

function StatCard({
  icon,
  value,
  label,
}: {
  icon: FeatherName;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconBox}>
        <Feather name={icon} size={16} color={KFitColors.accent} />
      </View>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function MemberCheckinScreen() {
  const router = useRouter();
  const { isSigningOut, logout } = useLogout();

  const { profile } = useMemberProfile();
  const { records, isLoading, error, refetch } = useAttendanceHistory();
  const [now, setNow] = useState(() => Date.now());

  // One ticking clock drives both the session timer and the QR countdown.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const today = new Date(now).toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const openSession = records.find((record) => record.checkout_timestamp === null);
  const checkedInAt = openSession ? new Date(openSession.scan_timestamp) : null;
  const isCheckedIn = checkedInAt !== null;
  const sessionMs = checkedInAt ? now - checkedInAt.getTime() : 0;
  const token = "Tap to open your secure QR pass";
  const visitsThisMonth = records.filter((record) => {
    const visitMonth = new Date(record.scan_timestamp).toLocaleDateString("en-US", {
      timeZone: "Asia/Manila", year: "numeric", month: "numeric",
    });
    const currentMonth = new Date(now).toLocaleDateString("en-US", {
      timeZone: "Asia/Manila", year: "numeric", month: "numeric",
    });
    return visitMonth === currentMonth;
  }).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: NAV_CLEARANCE }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>FORM ATHLETICS</Text>
              <Text style={styles.brandSubtitle}>
                FORM / Brooklyn · Performance club
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              disabled={isSigningOut}
              onPress={logout}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Feather name="log-out" size={14} color={KFitColors.error} />
              <Text style={styles.logoutText}>
                {isSigningOut ? "Signing out…" : "Logout"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.date}>{today}</Text>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.memberLabel}>Member · {[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Member"}</Text>
            <Text style={styles.title}>Check in</Text>
            <Text style={styles.subtitle}>
              Scan your QR code at the kiosk to check in.
            </Text>
          </View>

          {/* QR card */}
          <View style={styles.qrCard}>
            <View style={styles.qrFrame}>
              <TouchableOpacity onPress={() => router.replace("/member-qr" as any)} accessibilityRole="button">
                <Ionicons name="qr-code" size={150} color={KFitColors.accent} />
              </TouchableOpacity>
              <Text style={styles.qrToken}>{token}</Text>
            </View>

            <View style={styles.qrMetaRow}>
              <Text style={styles.qrLabel}>Member ID</Text>
              <Text style={styles.qrValue}>{profile?.id ?? "—"}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.qrMetaRow}>
              <Text style={styles.qrLabel}>Pass status</Text>
              <Text style={[styles.qrValue, styles.qrCountdown]}>
                {isLoading ? "Loading" : error ? "Unavailable" : "Ready"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.fullQrButton}
              onPress={() => router.replace("/member-qr" as any)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Feather name="maximize" size={14} color={KFitColors.accent} />
              <Text style={styles.fullQrText}>Open full-screen QR</Text>
            </TouchableOpacity>
          </View>

          {/* Current status */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="radio" size={16} color={KFitColors.accent} />
              <Text style={styles.sectionTitle}>Current Status</Text>
            </View>
            <View style={styles.card}>
              <View
                style={[
                  styles.statusBadge,
                  isCheckedIn && styles.statusBadgeActive,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    isCheckedIn && styles.statusDotActive,
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    isCheckedIn && styles.statusBadgeTextActive,
                  ]}
                >
                  {isCheckedIn ? "Checked In" : "Not Checked In"}
                </Text>
              </View>
              <Text style={styles.statusMain}>
                {isLoading
                  ? "Loading attendance status…"
                  : error
                    ? "Attendance status unavailable"
                    : checkedInAt
                      ? `Checked in at ${formatAttendanceTime(openSession!.scan_timestamp)}`
                      : "Ready when you are"}
              </Text>
              <Text style={styles.statusSub}>
                {isLoading
                  ? "Checking latest attendance…"
                  : error ?? (checkedInAt
                    ? checkedInAt.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "Asia/Manila",
                      })
                    : "Scan your QR pass at the kiosk to check in.")}
              </Text>
            </View>
          </View>

          {/* Today's session */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="clock" size={16} color={KFitColors.accent} />
              <Text style={styles.sectionTitle}>Today&apos;s Session</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.sessionActivity}>Open gym</Text>
              <Text style={styles.sessionTimer}>
                {isCheckedIn ? formatClock(sessionMs) : "00:00:00"}
              </Text>
              <Text style={styles.sessionHint}>
                {isCheckedIn
                  ? `Duration: ${formatDuration(sessionMs)}`
                  : "Check-in and check-out are recorded by the staff scanner."}
              </Text>
            </View>
          </View>

          {/* Recent check-ins */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="list" size={16} color={KFitColors.accent} />
              <Text style={styles.sectionTitle}>Recent Check-ins</Text>
            </View>
            {isLoading ? (
              <Text style={styles.historyMeta}>Loading attendance…</Text>
            ) : error ? (
              <View style={styles.card}>
                <Text style={styles.statusSub}>{error}</Text>
                <TouchableOpacity onPress={() => void refetch()} accessibilityRole="button">
                  <Text style={styles.fullQrText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : records.length === 0 ? (
              <Text style={styles.historyMeta}>No attendance records yet.</Text>
            ) : (
              <View style={styles.list}>
                {records.slice(0, 5).map((record) => (
                  <View key={record.id} style={styles.historyCard}>
                    <View style={styles.historyIconBox}>
                      <Feather name="map-pin" size={16} color={KFitColors.accent} />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyActivity}>{formatAttendanceDate(record.scan_timestamp)}</Text>
                      <Text style={styles.historyMeta}>
                        IN {formatAttendanceTime(record.scan_timestamp)} · OUT {record.checkout_timestamp ? formatAttendanceTime(record.checkout_timestamp) : "In progress"}
                      </Text>
                    </View>
                    <Text style={styles.historyDuration}>{attendanceDuration(record.scan_timestamp, record.checkout_timestamp, now)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* This month */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="trending-up" size={16} color={KFitColors.accent} />
              <Text style={styles.sectionTitle}>This Month</Text>
            </View>
            <View style={styles.statsGrid}>
              <StatCard icon="check-circle" value={String(visitsThisMonth)} label="Visits" />
              <StatCard icon="clock" value={formatDuration(records.reduce((total, record) => total + (record.checkout_timestamp ? Math.max(0, Date.parse(record.checkout_timestamp) - Date.parse(record.scan_timestamp)) : Math.max(0, now - Date.parse(record.scan_timestamp))), 0))} label="Total Time" />
              <StatCard icon="zap" value="—" label="Day Streak" />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerName}>{[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Member"}</Text>
            <Text style={styles.footerLabel}>
              FORM ATHLETICS MEMBER WORKSPACE
            </Text>
          </View>
        </ScrollView>

        <MemberBottomNav activeRoute="/member-checkin" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  brand: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: KFitColors.text,
  },
  brandSubtitle: { fontSize: 12, color: KFitColors.mutedText, marginTop: 2 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  logoutText: { fontSize: 12, fontWeight: "700", color: KFitColors.error },
  date: {
    paddingHorizontal: 20,
    marginTop: 10,
    fontSize: 12,
    color: KFitColors.mutedText,
  },

  /* Title */
  titleSection: { paddingHorizontal: 20, marginTop: 20, marginBottom: 20 },
  memberLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: KFitColors.accent,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: KFitColors.text,
    marginTop: 6,
  },
  subtitle: { fontSize: 14, color: KFitColors.mutedText, marginTop: 6 },

  /* QR card */
  qrCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 18,
    borderRadius: 20,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  qrFrame: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  qrToken: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: KFitColors.mutedText,
  },
  qrMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  qrLabel: { fontSize: 13, color: KFitColors.mutedText },
  qrValue: { fontSize: 14, fontWeight: "700", color: KFitColors.text },
  qrCountdown: { color: KFitColors.accent },
  divider: { height: 1, backgroundColor: KFitColors.border },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: KFitColors.accent,
  },
  fullQrButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    height: 44,
    borderRadius: 12,
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  fullQrText: { fontSize: 13, fontWeight: "800", color: KFitColors.accent },

  /* Sections & cards */
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: KFitColors.text },
  card: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },

  /* Status */
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  statusBadgeActive: {
    backgroundColor: KFitColors.accent + "1F",
    borderColor: KFitColors.accent + "40",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KFitColors.mutedText,
  },
  statusDotActive: { backgroundColor: KFitColors.accent },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: KFitColors.mutedText,
  },
  statusBadgeTextActive: { color: KFitColors.accent },
  statusMain: { fontSize: 16, fontWeight: "800", color: KFitColors.text },
  statusSub: { fontSize: 13, color: KFitColors.mutedText, marginTop: 4 },

  /* Session */
  sessionActivity: {
    fontSize: 14,
    fontWeight: "700",
    color: KFitColors.mutedText,
  },
  sessionTimer: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 1,
    color: KFitColors.text,
    marginTop: 6,
    fontVariant: ["tabular-nums"],
  },
  sessionHint: {
    fontSize: 13,
    color: KFitColors.mutedText,
    marginTop: 4,
    marginBottom: 16,
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: KFitColors.error + "1F",
    borderWidth: 1,
    borderColor: KFitColors.error + "55",
  },
  checkoutText: { fontSize: 14, fontWeight: "800", color: KFitColors.error },
  checkinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: KFitColors.accent,
  },
  checkinText: { fontSize: 14, fontWeight: "800", color: KFitColors.onAccent },

  /* History */
  list: { gap: 10 },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  historyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1F",
  },
  historyInfo: { flex: 1 },
  historyActivity: { fontSize: 14, fontWeight: "700", color: KFitColors.text },
  historyMeta: { fontSize: 12, color: KFitColors.mutedText, marginTop: 2 },
  historyDuration: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.accent,
  },

  /* Stats */
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  statIconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1F",
    marginBottom: 8,
  },
  statNumber: { fontSize: 18, fontWeight: "900", color: KFitColors.text },
  statLabel: { fontSize: 11, color: KFitColors.mutedText, marginTop: 2 },

  /* Footer */
  footer: { paddingVertical: 24, alignItems: "center" },
  footerName: { fontSize: 18, fontWeight: "800", color: KFitColors.text },
  footerLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: KFitColors.mutedText,
    marginTop: 4,
  },
});
