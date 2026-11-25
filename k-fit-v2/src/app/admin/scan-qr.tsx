import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useSoundEffects } from "@/components/shared/SoundEffectsProvider";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Theme = {
  background: "#080808",
  surface: "#121212",
  surfaceHigh: "#1A1A1A",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD700",
  accentText: "#000000",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "#222222",
};

interface ScannedMember {
  id: string;
  name: string;
  email: string | null;
  membershipLabel: string;
  membershipStart: string | null;
  membershipEnd: string | null;
  planName: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
}

type ActionFeedback = {
  type: "success" | "error";
  message: string;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
};

export default function AdminScanQRScreen() {
  const playSound = useSoundEffects();
  const [qrToken, setQrToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<"checkin" | "checkout" | null>(
    null,
  );
  const [scannedMember, setScannedMember] = useState<ScannedMember | null>(
    null,
  );
  const [memberLookupLoading, setMemberLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [qrExpired, setQrExpired] = useState(false);
  const [actionFeedback, setActionFeedback] =
    useState<ActionFeedback | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const lastScannedRef = useRef<string | null>(null);
  const loadedTokenRef = useRef<string | null>(null);
  const ignoreRef = useRef<{ token: string; until: number } | null>(null);
  const [scanLineAnim] = useState(() => new Animated.Value(0));

  // Animated scan line
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scanLineAnim]);

  const resetScan = () => {
    const base = lastScannedRef.current?.split(":")[0];
    ignoreRef.current = base
      ? { token: base, until: Date.now() + 10000 }
      : null;
    setQrToken("");
    setScannedMember(null);
    setLookupError(null);
    setActionFeedback(null);
    setMemberLookupLoading(false);
    setQrExpired(false);
    lastScannedRef.current = null;
    loadedTokenRef.current = null;
  };

  const lookupMember = async (rawValue: string) => {
    const baseToken = rawValue.split(":")[0];
    if (baseToken === loadedTokenRef.current) return;

    setMemberLookupLoading(true);
    setLookupError(null);
    setScannedMember(null);
    setActionFeedback(null);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("id")
        .eq("qr_token", baseToken)
        .maybeSingle();

      if (memberError) throw memberError;
      const memberRow = memberData as { id: string } | null;
      if (!memberRow) {
        playSound("warning");
        setLookupError("Unknown QR code — no member found");
        return;
      }

      const memberId = memberRow.id;

      const [
        userRes,
        membershipsRes,
        attendanceRes,
        latestAttendanceRes,
      ] = await Promise.all([
        supabase
          .from("users")
          .select("first_name, last_name, email")
          .eq("id", memberId)
          .maybeSingle(),
        supabase
          .from("memberships")
          .select(
            "status, start_date, end_date, created_at, membership_plans(name)",
          )
          .eq("member_id", memberId),
        supabase
          .from("attendance")
          .select("check_in")
          .eq("member_id", memberId)
          .is("check_out", null)
          .order("check_in", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("attendance")
          .select("check_out")
          .eq("member_id", memberId)
          .not("check_out", "is", null)
          .order("check_out", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (userRes.error) throw userRes.error;
      if (membershipsRes.error) throw membershipsRes.error;
      if (attendanceRes.error) throw attendanceRes.error;
      if (latestAttendanceRes.error) throw latestAttendanceRes.error;

      const user = userRes.data as any;
      const memberships = (membershipsRes.data || []) as any[];
      const openSession = attendanceRes.data as { check_in: string } | null;
      const latestAttendance = latestAttendanceRes.data as {
        check_out: string;
      } | null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isActive = (m: any) =>
        m.status === "active" &&
        (!m.start_date || new Date(m.start_date) <= today) &&
        (!m.end_date || new Date(m.end_date) >= today);

      const sorted = [...memberships].sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime(),
      );
      const best = sorted.find(isActive) || sorted[0] || null;

      let membershipLabel = "No membership";
      if (best) {
        if (isActive(best)) membershipLabel = "Active";
        else if (best.status === "pending") membershipLabel = "Pending";
        else membershipLabel = "Expired";
      }

      const planRaw = best?.membership_plans;
      const planName = Array.isArray(planRaw)
        ? planRaw[0]?.name
        : planRaw?.name;

      loadedTokenRef.current = baseToken;
      setScannedMember({
        id: memberId,
        name:
          [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
          "Unknown Member",
        email: user?.email || null,
        membershipLabel,
        membershipStart: best?.start_date || null,
        membershipEnd: best?.end_date || null,
        planName: planName || null,
        checkedInAt: openSession?.check_in || null,
        checkedOutAt: latestAttendance?.check_out || null,
      });
    } catch (e) {
      console.error("Member lookup error:", e);
      playSound("warning");
      setLookupError("Failed to load member info");
    } finally {
      setMemberLookupLoading(false);
    }
  };

  const processScan = async (data: string) => {
    setQrToken(data);
    setQrExpired(false);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();
      const { data: parsed, error: parseError } = await supabase.rpc(
        "parse_qr_token",
        {
          qr_value: data,
        } as any,
      );
      if (parseError) throw parseError;
      if (!parseError && parsed === null) {
        playSound("warning");
        setQrExpired(true);
        return;
      }
    } catch (error) {
      console.error("QR validation failed:", error);
      playSound("warning");
      setLookupError("Could not validate this QR code. Please try again.");
      return;
    }
    await lookupMember(data);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (data === lastScannedRef.current) return;
    const base = data.split(":")[0];
    const ig = ignoreRef.current;
    if (ig && ig.token === base && Date.now() < ig.until) return;
    ignoreRef.current = null;
    lastScannedRef.current = data;
    playSound("tap");
    processScan(data);
  };

  const checkAuth = async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
    } else {
      const role = currentUser?.user_metadata?.role || "member";
      if (role !== "admin") {
        if (role === "member") router.replace("/member/dashboard");
        else if (role === "coach") router.replace("/coach/dashboard");
        else router.replace("/login");
      } else {
        setLoading(false);
      }
    }
  };

  const handleCheckIn = async () => {
    if (!qrToken.trim()) {
      Alert.alert("Error", "Please enter a QR token");
      return;
    }
    setProcessing(true);
    setLastAction("checkin");
    setActionFeedback(null);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc("scan_member_checkin", {
        qr_value: qrToken,
      } as any);
      if (error) {
        playSound("warning");
        setActionFeedback({
          type: "error",
          message: error.message || "Check-in failed.",
        });
      } else {
        const row = (Array.isArray(data) ? data[0] : data) as {
          success?: boolean;
          message?: string;
          attendance_id?: string;
        } | null;
        if (!row?.success) {
          playSound("warning");
          setActionFeedback({
            type: "error",
            message: row?.message || "Check-in was rejected.",
          });
        } else {
          playSound("scanIn");
          setActionFeedback({
            type: "success",
            message: row.message || "Member checked in successfully.",
          });
          if (row.attendance_id) {
            const { data: attendanceData, error: attendanceError } = await supabase
              .from("attendance")
              .select("check_in")
              .eq("id", row.attendance_id)
              .maybeSingle();
            if (attendanceError) {
              console.error("Failed to load check-in details:", attendanceError);
            } else {
              const attendance = attendanceData as {
                check_in: string | null;
              } | null;
              if (attendance?.check_in) {
                setScannedMember((member) =>
                  member
                    ? {
                        ...member,
                        checkedInAt: attendance.check_in,
                        checkedOutAt: null,
                      }
                    : member,
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Check-in failed:", error);
      playSound("warning");
      setActionFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Check-in failed.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!qrToken.trim()) {
      Alert.alert("Error", "Please enter a QR token");
      return;
    }
    setProcessing(true);
    setLastAction("checkout");
    setActionFeedback(null);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc("scan_member_checkout", {
        qr_value: qrToken,
      } as any);
      if (error) {
        playSound("warning");
        setActionFeedback({
          type: "error",
          message: error.message || "Check-out failed.",
        });
      } else {
        const row = (Array.isArray(data) ? data[0] : data) as {
          success?: boolean;
          message?: string;
          attendance_id?: string;
        } | null;
        if (!row?.success) {
          playSound("warning");
          setActionFeedback({
            type: "error",
            message: row?.message || "Check-out was rejected.",
          });
        } else {
          playSound("scanOut");
          setActionFeedback({
            type: "success",
            message: row.message || "Member checked out successfully.",
          });
          if (row.attendance_id) {
            const { data: attendanceData, error: attendanceError } = await supabase
              .from("attendance")
              .select("check_out")
              .eq("id", row.attendance_id)
              .maybeSingle();
            if (attendanceError) {
              console.error("Failed to load check-out details:", attendanceError);
              setActionFeedback({
                type: "success",
                message:
                  "Member checked out successfully. Check-out time could not be loaded.",
              });
            } else {
              const attendance = attendanceData as {
                check_out: string | null;
              } | null;
              if (attendance?.check_out) {
                setScannedMember((member) =>
                  member
                    ? {
                        ...member,
                        checkedInAt: null,
                        checkedOutAt: attendance.check_out,
                      }
                    : member,
                );
              }
            }
          } else {
            console.error("Check-out succeeded without an attendance ID");
            setActionFeedback({
              type: "success",
              message:
                "Member checked out successfully. Attendance details are unavailable.",
            });
          }
        }
      }
    } catch (error) {
      console.error("Check-out failed:", error);
      playSound("warning");
      setActionFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Check-out failed.",
      });
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading Scanner...</Text>
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
          <View style={styles.headerIcon}>
            <Ionicons name="scan-outline" size={26} color={Theme.accent} />
          </View>
          <Text style={styles.title}>Scan Member QR</Text>
          <Text style={styles.subtitle}>
            Scan member QR for check-in/check-out
          </Text>
        </View>

        {/* Camera Card */}
        <View style={[styles.card, styles.cameraCard]}>
          {permission?.granted ? (
            <View style={styles.cameraBox}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              {/* Custom Scan Overlay */}
              <View style={styles.scanOverlay} pointerEvents="none">
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 180],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
              <View style={styles.cameraFooter}>
                <Text style={styles.cameraHint}>
                  Position QR within the frame
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.permissionBox}>
              <Ionicons
                name="camera-outline"
                size={40}
                color={Theme.textMuted}
              />
              <Text style={styles.note}>
                Camera access is needed to scan QR codes.
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestPermission}
              >
                <Text style={styles.permissionButtonText}>Enable Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={Theme.accent}
            />
            <Text style={styles.sectionTitle}>How it works</Text>
          </View>
          {[
            "Ask member to show their QR code",
            "Member profile appears — verify name & membership",
            "Tap 'Check In' when they arrive or 'Check Out' when they leave",
            "Scanner resets automatically for the next member",
          ].map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Expired QR Modal */}
      <Modal
        visible={qrExpired}
        transparent
        animationType="fade"
        onRequestClose={resetScan}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            onPress={resetScan}
            activeOpacity={1}
          />
          <View style={styles.modalCard}>
            <View style={styles.expiredIconWrap}>
              <Ionicons name="time-outline" size={32} color={Theme.warning} />
            </View>
            <Text style={styles.modalTitle}>QR Code Expired</Text>
            <Text style={styles.modalSubtitle}>
              This code has rotated — ask the member to refresh their QR and
              scan again.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={resetScan}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Member Info Modal */}
      <Modal
        visible={qrToken !== "" && !qrExpired}
        transparent
        animationType="slide"
        onRequestClose={resetScan}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            onPress={resetScan}
            activeOpacity={1}
          />
          <View style={styles.memberModalCard}>
            {memberLookupLoading ? (
              <ActivityIndicator
                size="large"
                color={Theme.accent}
                style={{ marginVertical: 20 }}
              />
            ) : lookupError ? (
              <Text style={styles.memberError}>{lookupError}</Text>
            ) : scannedMember ? (
              <>
                <View style={styles.modalDragHandle} />
                <View style={styles.memberIdentity}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {scannedMember.name
                        .split(" ")
                        .map((w) => w[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberNameWrap}>
                    <Text style={styles.memberName}>{scannedMember.name}</Text>
                    <Text style={styles.memberEmail}>
                      {scannedMember.email || "Email unavailable"}
                    </Text>
                  </View>
                </View>

                <View style={styles.memberDetails}>
                  <Text style={styles.detailText}>
                    Plan: {scannedMember.planName || "No plan listed"}
                  </Text>
                  <Text style={styles.detailText}>
                    Membership: {scannedMember.membershipLabel}
                  </Text>
                  <Text style={styles.detailText}>
                    Starts: {formatDateTime(scannedMember.membershipStart)}
                  </Text>
                  <Text style={styles.detailText}>
                    Ends: {formatDateTime(scannedMember.membershipEnd)}
                  </Text>
                </View>

                <View style={styles.memberMetaRow}>
                  <View
                    style={[
                      styles.badge,
                      scannedMember.membershipLabel === "Active"
                        ? styles.badgeActive
                        : scannedMember.membershipLabel === "Pending"
                          ? styles.badgePending
                          : styles.badgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        scannedMember.membershipLabel === "Active"
                          ? styles.badgeTextActive
                          : scannedMember.membershipLabel === "Pending"
                            ? styles.badgeTextPending
                            : styles.badgeTextInactive,
                      ]}
                    >
                      {scannedMember.membershipLabel}
                    </Text>
                  </View>
                </View>

                <View style={styles.attendanceDetails}>
                  <Text style={styles.detailText}>
                    Check-in: {formatDateTime(scannedMember.checkedInAt)}
                  </Text>
                  <Text style={styles.detailText}>
                    Last check-out: {formatDateTime(scannedMember.checkedOutAt)}
                  </Text>
                </View>

                {actionFeedback && (
                  <View
                    style={[
                      styles.actionFeedback,
                      actionFeedback.type === "success"
                        ? styles.actionFeedbackSuccess
                        : styles.actionFeedbackError,
                    ]}
                  >
                    <Ionicons
                      name={
                        actionFeedback.type === "success"
                          ? "checkmark-circle"
                          : "alert-circle"
                      }
                      size={18}
                      color={
                        actionFeedback.type === "success"
                          ? Theme.success
                          : Theme.error
                      }
                    />
                    <Text style={styles.actionFeedbackText}>
                      {actionFeedback.message}
                    </Text>
                  </View>
                )}

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.checkInButton,
                      processing && { opacity: 0.6 },
                    ]}
                    onPress={handleCheckIn}
                    disabled={processing}
                  >
                    <Ionicons name="log-in-outline" size={20} color="#000" />
                    <Text style={[styles.buttonText, { color: "#000" }]}>
                      {processing && lastAction === "checkin"
                        ? "Processing..."
                        : "Check In"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.checkOutButton,
                      processing && { opacity: 0.6 },
                    ]}
                    onPress={handleCheckOut}
                    disabled={processing}
                  >
                    <Ionicons name="log-out-outline" size={20} color="#000" />
                    <Text style={[styles.buttonText, { color: "#000" }]}>
                      {processing && lastAction === "checkout"
                        ? "Processing..."
                        : "Check Out"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={resetScan}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  scrollContent: { flexGrow: 1 },
  content: { padding: 20, paddingBottom: 120 },
  loadingText: {
    fontSize: 14,
    color: Theme.accent,
    fontWeight: "600",
    marginTop: 12,
  },

  header: { alignItems: "center", marginBottom: 24 },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Theme.textMuted,
    marginTop: 4,
    textAlign: "center",
  },

  card: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Theme.text },

  // Camera
  cameraCard: { padding: 0, overflow: "hidden" },
  cameraBox: { height: 400, backgroundColor: "#000" },
  camera: { flex: 1 },
  scanOverlay: {
    position: "absolute",
    top: "25%",
    left: "15%",
    right: "15%",
    height: "50%",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: Theme.accent,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    width: "100%",
    height: 2,
    backgroundColor: Theme.accent,
    shadowColor: Theme.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  cameraFooter: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  cameraHint: {
    color: Theme.textMuted,
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },

  // Permission
  permissionBox: { alignItems: "center", paddingVertical: 30, gap: 12 },
  note: {
    fontSize: 13,
    color: Theme.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  permissionButton: {
    backgroundColor: Theme.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  permissionButtonText: {
    color: Theme.accentText,
    fontWeight: "800",
    fontSize: 14,
  },

  // Steps
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { fontSize: 11, fontWeight: "800", color: Theme.accent },
  stepText: { flex: 1, fontSize: 13, color: Theme.textMuted, lineHeight: 18 },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBackdropTouch: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 24,
    alignItems: "center",
  },
  expiredIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Theme.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Theme.textMuted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: Theme.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: { color: Theme.accentText, fontWeight: "800", fontSize: 15 },

  // Member Modal
  memberModalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 24,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
    alignSelf: "center",
    marginBottom: 16,
  },
  memberIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "900", color: Theme.accent },
  memberNameWrap: { flex: 1 },
  memberName: { fontSize: 20, fontWeight: "800", color: Theme.text },
  memberEmail: { fontSize: 12, color: Theme.textMuted, marginTop: 4 },

  memberDetails: { gap: 7, marginBottom: 16 },
  detailText: { fontSize: 12, color: Theme.textMuted, lineHeight: 18 },

  memberMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeActive: { backgroundColor: "rgba(16, 185, 129, 0.12)" },
  badgePending: { backgroundColor: "rgba(245, 158, 11, 0.12)" },
  badgeInactive: { backgroundColor: "rgba(239, 68, 68, 0.12)" },
  badgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  badgeTextActive: { color: Theme.success },
  badgeTextPending: { color: Theme.warning },
  badgeTextInactive: { color: Theme.error },

  attendanceDetails: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 12,
    gap: 5,
    marginBottom: 16,
  },
  actionFeedback: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionFeedbackSuccess: { backgroundColor: "rgba(16, 185, 129, 0.12)" },
  actionFeedbackError: { backgroundColor: "rgba(239, 68, 68, 0.12)" },
  actionFeedbackText: {
    flex: 1,
    fontSize: 13,
    color: Theme.text,
    lineHeight: 18,
  },

  modalActionRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  checkInButton: { backgroundColor: Theme.accent },
  checkOutButton: {
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  buttonText: { fontWeight: "800", fontSize: 15 },

  closeButton: { alignItems: "center", paddingVertical: 12 },
  closeButtonText: { color: Theme.textMuted, fontWeight: "600", fontSize: 14 },
  memberError: {
    color: Theme.error,
    fontSize: 14,
    textAlign: "center",
    marginVertical: 20,
  },
});
