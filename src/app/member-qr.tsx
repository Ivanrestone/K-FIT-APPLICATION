import MemberBottomNav from "@/components/MemberBottomNav";
import { KFitColors } from "@/constants/theme";
import { useAttendance } from "@/hooks/use-attendance";
import { createQrPayload, currentTotpCounter, generateTotp, generateTotpSecret, TOTP_PERIOD_SECONDS } from "@/utils/totp";
import { useLogout } from "@/hooks/use-logout";
import { useMemberProfile } from "@/hooks/use-member-profile";
import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";

// Clears the floating nav (dock + raised QR button + safe area).
const NAV_CLEARANCE = 140;
const PASS_LIFETIME = TOTP_PERIOD_SECONDS; // seconds a code stays valid
const URGENT_AT = 10; // seconds left when the countdown turns red
const QR_SIZE = 210;


type FeatherName = keyof typeof Feather.glyphMap;

/* ---------------------------- Small building blocks ---------------------------- */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: FeatherName;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon ? (
          <Feather name={icon} size={16} color={KFitColors.accent} />
        ) : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function GoldButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon?: FeatherName;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.goldButton}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <ImageBackground
        source={require("../../assets/images/gold-texture.jpg")}
        resizeMode="cover"
        style={styles.goldButtonBg}
        imageStyle={styles.goldButtonImage}
      >
        {icon ? <Feather name={icon} size={16} color="#121212" /> : null}
        <Text style={styles.goldButtonText}>{label}</Text>
      </ImageBackground>
    </TouchableOpacity>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepNumber}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

/* ---------------------------------- Screen ---------------------------------- */

export default function MemberQRScreen() {
  const { isSigningOut, logout } = useLogout();
  const { profile, isLoading: profileLoading, error: profileError } = useMemberProfile();
  const { provision } = useAttendance();

  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [passError, setPassError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(PASS_LIFETIME);
  const [hidden, setHidden] = useState(false);
  const isGeneratingRef = useRef(false);

  const memberId = profile?.id;

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );

  const nameParts = [profile?.firstName, profile?.lastName].filter(
    (n): n is string => Boolean(n?.trim()),
  );
  const fullName = nameParts.join(" ") || "Member";

  /* Generate a fresh code and restart the countdown. */
  const generate = useCallback(async (activeSecret: string) => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    try {
      const counter = currentTotpCounter();
      const code = await generateTotp(activeSecret, counter);
      if (!memberId) throw new Error("Member profile is unavailable.");
      setToken(createQrPayload(memberId, counter, code));
      setExpiresAt((counter + 1) * PASS_LIFETIME * 1000);
      setSecondsLeft(Math.max(1, Math.ceil(((counter + 1) * PASS_LIFETIME * 1000 - Date.now()) / 1000)));
      setPassError(null);
    } catch {
      setToken("");
      setPassError("Could not generate your secure QR pass.");
    } finally {
      isGeneratingRef.current = false;
    }
  }, [memberId]);

  // First code (and a new one if the member id changes).
  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;
    void (async () => {
      try {
        setToken("");
        setPassError(null);
        const key = `kfit.attendance.totp.${memberId}`;
        let stored = await SecureStore.getItemAsync(key);
        if (stored) {
          await provision(stored);
          if (!cancelled) {
            setSecret(stored);
            await generate(stored);
          }
          return;
        }
        stored = await generateTotpSecret();
        await provision(stored);
        await SecureStore.setItemAsync(key, stored);
        if (!cancelled) {
          setSecret(stored);
          await generate(stored);
        }
      } catch (error) {
        if (!cancelled) {
          setToken("");
          setPassError(error instanceof Error ? error.message : "Could not provision your secure QR pass.");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [generate, memberId, provision]);

  // Countdown based on the real clock, so it stays accurate after the app
  // has been in the background.
  useEffect(() => {
    if (!expiresAt || !secret || hidden) return;
    const id = setInterval(() => {
      const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
      if (remaining <= 0) void generate(secret);
      else setSecondsLeft(remaining);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, generate, hidden, secret]);

  // Hide the code whenever the app leaves the foreground (app switcher
  // screenshots, screen recording). The member taps to reveal it again.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next.match(/inactive|background/)) {
        setHidden(true);
      }
    });
    return () => sub.remove();
  }, []);

  const reveal = async () => {
    // Keep the old code concealed until a fresh time-step has been generated.
    if (secret && Date.now() >= expiresAt) await generate(secret);
    setHidden(false);
  };

  const urgent = secondsLeft <= URGENT_AT;
  const progress = Math.max(0, Math.min(secondsLeft / PASS_LIFETIME, 1));

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

          {/* Page title */}
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>CHECK-IN PASS</Text>
            <Text style={styles.heroTitle}>Your Pass</Text>
            <Text style={styles.heroSubtitle}>
              Scan at the kiosk to check in
            </Text>
          </View>

          {/* QR card */}
          <View style={styles.qrCard}>
            <View style={styles.qrFrame}>
              {hidden ? (
                <TouchableOpacity
                  style={styles.hiddenOverlay}
                  onPress={reveal}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Tap to reveal QR code"
                >
                  <Feather name="eye-off" size={28} color={KFitColors.accent} />
                  <Text style={styles.hiddenTitle}>Code hidden</Text>
                  <Text style={styles.hiddenSubtitle}>Tap to reveal</Text>
                </TouchableOpacity>
              ) : token ? (
                <QRCode
                  value={token}
                  size={QR_SIZE}
                  color="#121212"
                  backgroundColor="#FFFFFF"
                />
              ) : (
                <Text style={styles.loadingText}>{passError ?? "Preparing secure pass…"}</Text>
              )}
            </View>

            {/* Countdown */}
            <View style={styles.countdownRow}>
              <Text style={styles.metaLabel}>Refreshes in</Text>
              <Text style={[styles.countdownValue, urgent && styles.urgent]}>
                {secret ? `${secondsLeft}s` : "—"}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%` },
                  urgent && styles.progressUrgent,
                ]}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Member ID</Text>
              <Text style={styles.metaValue}>{memberId}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Name</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {fullName}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <GoldButton
              label="Generate new code"
              icon="refresh-cw"
              onPress={() => { if (secret) void generate(secret); }}
            />
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => (hidden ? reveal() : setHidden(true))}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={hidden ? "Show code" : "Hide code"}
            >
              <Feather
                name={hidden ? "eye" : "eye-off"}
                size={16}
                color={KFitColors.accent}
              />
              <Text style={styles.outlineButtonText}>
                {hidden ? "Show" : "Hide"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security notice */}
          <View style={styles.notice}>
            <View style={styles.noticeIcon}>
              <Feather name="shield" size={16} color={KFitColors.accent} />
            </View>
            <Text style={styles.noticeText}>
              This code refreshes every {PASS_LIFETIME} seconds and hides itself
              when you leave the app.
            </Text>
          </View>

          {/* How to use */}
          <Section title="How to Use" icon="help-circle">
            <View style={styles.card}>
              <Step number={1} text="Go to the gym kiosk at the entrance" />
              <Step
                number={2}
                text="Hold your phone with this QR code visible"
              />
              <Step
                number={3}
                text="Wait for the kiosk to scan and confirm check-in"
              />
            </View>
          </Section>

          {/* Status */}
          <Section title="Check-in Status" icon="map-pin">
            <View style={styles.card}>
              <View style={styles.statusChip}>
                <View style={[styles.statusDot, passError && styles.statusDotError]} />
                <Text style={[styles.statusChipText, passError && styles.statusChipTextError]}>
                  {passError || profileError ? "Pass unavailable" : secret ? "Ready to check in" : "Securing your pass"}
                </Text>
              </View>
              <Text style={styles.statusTime}>
                {passError ?? profileError ?? (profileLoading ? "Loading your member profile…" : "Your QR is verified online at the gym entrance.")}
              </Text>
            </View>
          </Section>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>FORM ATHLETICS</Text>
            <Text style={styles.footerVersion}>Member workspace</Text>
          </View>
        </ScrollView>

        <MemberBottomNav activeRoute="/member-qr" />
      </View>
    </SafeAreaView>
  );
}

/* ---------------------------------- Styles ---------------------------------- */

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

  /* Hero */
  hero: { paddingHorizontal: 20, marginTop: 20, marginBottom: 16 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: KFitColors.accent,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: KFitColors.text,
    marginBottom: 4,
  },
  heroSubtitle: { fontSize: 14, color: KFitColors.mutedText },

  /* QR card */
  qrCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  // The QR sits on a white tile: scanners need a light quiet zone.
  qrFrame: {
    alignSelf: "center",
    minWidth: QR_SIZE + 40,
    minHeight: QR_SIZE + 40,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: KFitColors.accentDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  hiddenOverlay: {
    width: QR_SIZE,
    height: QR_SIZE,
    borderRadius: 12,
    backgroundColor: KFitColors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  hiddenTitle: { fontSize: 16, fontWeight: "800", color: KFitColors.text },
  hiddenSubtitle: { fontSize: 13, color: KFitColors.mutedText },
  loadingText: { fontSize: 14, color: "#6B7280" },

  countdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  countdownValue: { fontSize: 16, fontWeight: "800", color: KFitColors.accent },
  urgent: { color: KFitColors.error },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: KFitColors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: KFitColors.accent,
  },
  progressUrgent: { backgroundColor: KFitColors.error },
  divider: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 16,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  metaLabel: { fontSize: 13, color: KFitColors.mutedText },
  metaValue: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    color: KFitColors.text,
    textAlign: "right",
  },

  /* Actions */
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  goldButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  goldButtonBg: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  goldButtonImage: { borderRadius: 12 },
  goldButtonText: { color: "#121212", fontSize: 14, fontWeight: "800" },
  outlineButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.accent,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: KFitColors.accent,
  },

  /* Notice */
  notice: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  noticeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1F",
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: KFitColors.text,
  },

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

  /* Steps */
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: { fontSize: 12, fontWeight: "900", color: "#121212" },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: KFitColors.mutedText,
    paddingTop: 3,
  },

  /* Status */
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
    marginBottom: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KFitColors.accent,
  },
  statusDotError: { backgroundColor: KFitColors.error },
  statusChipText: { fontSize: 12, fontWeight: "800", color: KFitColors.accent },
  statusChipTextError: { color: KFitColors.error },
  statusTime: { fontSize: 13, color: KFitColors.mutedText },

  /* Footer */
  footer: { paddingVertical: 24, alignItems: "center" },
  footerBrand: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: KFitColors.text,
  },
  footerVersion: { fontSize: 12, color: KFitColors.mutedText, marginTop: 4 },
});
