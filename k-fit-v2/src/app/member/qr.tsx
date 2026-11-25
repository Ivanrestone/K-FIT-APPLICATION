// app/member/qr.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ScreenCapture from "expo-screen-capture";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

const Theme = {
  background: "#080808",
  surface: "#121212",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD700",
  accentText: "#000000",
  error: "#EF4444",
  border: "#222222",
};

// CHANGED: 15 to 5
const QR_WINDOW_SECONDS = 5;

export default function MemberQRScreen() {
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QR_WINDOW_SECONDS);
  const lastFetchRef = useRef(0);

  // Animation for the scanning line
  const [scanLineAnim] = useState(() => new Animated.Value(0));

  // Security States
  const [isScreenshotBlocked, setIsScreenshotBlocked] = useState(false);
  const [isAppBackgrounded, setIsAppBackgrounded] = useState(false);

  // --- Security Effects ---
  useEffect(() => {
    if (Platform.OS === "web") return;

    const preventScreenshot = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch (e) {
        console.warn("Could not prevent screen capture", e);
      }
    };
    preventScreenshot();

    let screenshotSubscription:
      | ReturnType<typeof ScreenCapture.addScreenshotListener>
      | undefined;
    try {
      screenshotSubscription = ScreenCapture.addScreenshotListener(() => {
        setIsScreenshotBlocked(true);
        setTimeout(() => setIsScreenshotBlocked(false), 3000);
      });
    } catch (error) {
      console.warn("Could not listen for screenshots", error);
    }

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState !== "active") {
          setIsAppBackgrounded(true);
        } else {
          setIsAppBackgrounded(false);
        }
      },
    );

    return () => {
      void ScreenCapture.allowScreenCaptureAsync().catch((error) =>
        console.warn("Could not allow screen capture", error),
      );
      screenshotSubscription?.remove();
      appStateSubscription.remove();
    };
  }, []);

  const fetchMemberData = useCallback(async (userId: string) => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data: memberInfo, error } = await supabase
        .from("members")
        .select("qr_token")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setMemberData(memberInfo);
    } catch (error) {
      console.error("Error fetching QR token:", error);
      Alert.alert("Error", "Failed to load QR token");
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
    } else {
      const role = currentUser?.user_metadata?.role || "member";
      if (role !== "member" && role !== "coach") {
        if (role === "admin") router.replace("/admin/dashboard");
        else router.replace("/login");
      } else {
        const { getMembershipAccess } = await import("@/lib/membership");
        const access = await getMembershipAccess(currentUser.id);
        if (access === "none") {
          setLoading(false);
          router.replace("/member/membership");
          return;
        }
        await fetchMemberData(currentUser.id);
      }
    }
  }, [fetchMemberData]);

  const fetchQrPayload = useCallback(async () => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc(
        "get_my_qr_payload" as any,
      );
      if (error) throw error;
      const payload = data as unknown;
      if (typeof payload !== "string" || payload.length === 0) {
        throw new Error("The QR payload was empty.");
      }
      setQrPayload(payload);
      lastFetchRef.current = Date.now();
      setSecondsLeft(QR_WINDOW_SECONDS);
    } catch (error) {
      console.error("Error fetching QR payload:", error);
      setQrPayload(null);
    }
  }, []);

  useEffect(() => {
    if (!memberData) return;
    const timeout = setTimeout(() => {
      void fetchQrPayload();
    }, 0);
    const interval = setInterval(() => {
      void fetchQrPayload();
    }, QR_WINDOW_SECONDS * 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchQrPayload, memberData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(
        Math.max(
          0,
          QR_WINDOW_SECONDS -
            Math.floor((Date.now() - lastFetchRef.current) / 1000),
        ),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
  }, [checkAuth]);

  // Start the "Scanning Laser" animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scanLineAnim]);

  const isQrExpired = qrPayload != null && secondsLeft <= 0;

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Securing Connection...</Text>
      </View>
    );
  }

  // If app is backgrounded (app switcher), show a blank secure screen
  if (isAppBackgrounded) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons
          name="shield-lock"
          size={48}
          color={Theme.border}
        />
        <Text style={styles.loadingText}>App Secured</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="shield-check"
            size={32}
            color={Theme.accent}
          />
          <Text style={styles.title}>Smart Gate Pass</Text>
          <Text style={styles.subtitle}>Scan at the turnstile to enter</Text>
        </View>

        {/* QR Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrBadge}>
            <View
              style={[
                styles.liveDot,
                { backgroundColor: isQrExpired ? Theme.error : Theme.accent },
              ]}
            />
            <Text style={styles.qrBadgeText}>
              {isQrExpired ? "GENERATING NEW CODE" : "LIVE ACCESS CODE"}
            </Text>
          </View>

          <View style={styles.qrBox}>
            {isScreenshotBlocked ? (
              <View style={styles.screenshotBlockOverlay}>
                <Ionicons name="warning" size={48} color="#FF3B30" />
                <Text style={styles.blockTitle}>SCREENSHOT BLOCKED</Text>
                <Text style={styles.blockSub}>
                  This pass is for in-person scanning only.
                </Text>
              </View>
            ) : qrPayload ? (
              <>
                <QRCode
                  value={qrPayload}
                  size={220}
                  backgroundColor="white"
                  color="black"
                />
                {/* Animated Scanning Laser */}
                {!isQrExpired && (
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        transform: [
                          {
                            translateY: scanLineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 220],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                )}
              </>
            ) : (
              <Text style={styles.qrToken}>No QR token available</Text>
            )}

            {/* Expired Overlay */}
            {isQrExpired && !isScreenshotBlocked && (
              <View style={styles.qrExpiredOverlay}>
                <Ionicons name="time" size={32} color="#FF9500" />
                <Text style={styles.qrExpiredTitle}>CODE EXPIRED</Text>
                <Text style={styles.qrExpiredSub}>
                  Fetching new secure code…
                </Text>
              </View>
            )}
          </View>

          {qrPayload ? (
            <View style={styles.countdownRow}>
              <View
                style={[
                  styles.countdownDot,
                  secondsLeft <= 2 && styles.countdownDotUrgent, // Changed from 5 to 2 for a faster warning
                ]}
              />
              <Text style={styles.countdownText}>
                {isQrExpired ? "Refreshing…" : `Refreshes in ${secondsLeft}s`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Anti-Screenshot / Security Warning */}
        <TouchableOpacity
          style={styles.warningCard}
          activeOpacity={0.8}
          onPress={() =>
            Alert.alert(
              "Security Notice",
              Platform.OS === "web"
                ? "Keep the live QR code open for the gate scanner. It refreshes every 5 seconds."
                : "This QR code changes every 5 seconds. If you screenshot or forward this code, it will instantly become invalid and will not grant gym access.",
            )
          }
        >
          <Ionicons name="warning" size={20} color={Theme.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>
              {Platform.OS === "web"
                ? "Rotating Access Code"
                : "Screenshot Protection Enabled"}
            </Text>
            <Text style={styles.warningText}>
              {Platform.OS === "web"
                ? "Keep this screen open while the gate scanner reads your code."
                : "Taking a screenshot will instantly hide this code and block forwarding."}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/member/dashboard")}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  center: { justifyContent: "center", alignItems: "center" },
  scrollContent: { flexGrow: 1, paddingBottom: 100 },
  content: { padding: 20, alignItems: "center" },
  loadingText: {
    color: Theme.textMuted,
    fontSize: 14,
    marginTop: 12,
    fontWeight: "600",
  },

  // Header
  header: { alignItems: "center", marginBottom: 32, marginTop: 10 },
  title: { fontSize: 24, fontWeight: "900", color: Theme.text, marginTop: 12 },
  subtitle: { fontSize: 13, color: Theme.textMuted, marginTop: 4 },

  // QR Card
  qrCard: {
    width: "100%",
    backgroundColor: Theme.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  qrBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  qrBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Theme.accent,
    letterSpacing: 1,
  },

  qrBox: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: "rgba(255, 215, 0, 0.8)",
    shadowColor: Theme.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 5,
  },
  qrToken: {
    fontSize: 16,
    fontFamily: "monospace",
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    paddingVertical: 40,
  },

  // Security / Screenshot Blocked Overlay
  screenshotBlockOverlay: {
    width: 220,
    height: 220,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FF3B30",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  blockSub: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // Expired State
  qrExpiredOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  qrExpiredTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FF9500",
    letterSpacing: 1,
  },
  qrExpiredSub: { fontSize: 12, color: "#A3A3A3", fontWeight: "500" },

  // Countdown
  countdownRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  countdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  countdownDotUrgent: { backgroundColor: "#FF9500" },
  countdownText: { fontSize: 12, fontWeight: "700", color: Theme.textMuted },

  // Security Warning Card
  warningCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Theme.accent,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  warningText: {
    fontSize: 12,
    color: Theme.textMuted,
    lineHeight: 18,
    fontWeight: "500",
  },

  // Done Button
  button: {
    width: "100%",
    backgroundColor: Theme.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: Theme.accentText,
    fontSize: 16,
    fontWeight: "900",
  },
});
