import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { useSoundEffects } from "@/components/shared/SoundEffectsProvider";
import {
  Alert,
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Theme = {
  background: "#080A0E", // Slightly deeper background
  card: "#12151B",
  cardInner: "#0E1015",
  historyCard: "#12151B",
  pill: "#1A1F29",
  text: "#FFFFFF",
  textMuted: "#8E95A5",
  accent: "#F59E0B",
  accentDim: "rgba(245, 158, 11, 0.15)",
  border: "#1E242F",
  borderLight: "#2B3342",
  green: "#34D399",
  greenDim: "rgba(52, 211, 153, 0.12)",
  greenBorder: "rgba(52, 211, 153, 0.25)",
  crimson: "#EF4444",
  crimsonDim: "rgba(239, 68, 68, 0.12)",
  onAccent: "#080A0E",
};

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  status: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  gateway_status: string | null;
  paid_at: string | null;
  created_at: string;
}

interface Membership {
  id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

const STATUS_STYLES: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  paid: { color: Theme.green, bg: Theme.greenDim, border: Theme.greenBorder },
  pending: {
    color: Theme.accent,
    bg: Theme.accentDim,
    border: "rgba(245, 158, 11, 0.3)",
  },
  expired: {
    color: Theme.crimson,
    bg: Theme.crimsonDim,
    border: "rgba(239, 68, 68, 0.3)",
  },
  failed: {
    color: Theme.crimson,
    bg: Theme.crimsonDim,
    border: "rgba(239, 68, 68, 0.3)",
  },
  active: { color: Theme.green, bg: Theme.greenDim, border: Theme.greenBorder },
};

export default function MembershipScreen() {
  const playSound = useSoundEffects();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [pulse] = useState(() => new Animated.Value(1));

  const checkAuth = async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
    } else {
      const role = currentUser?.user_metadata?.role || "member";
      if (role !== "member" && role !== "coach") {
        if (role === "admin") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/login");
        }
      } else {
        setUser(currentUser);
        await fetchData();
      }
    }
  };

  const fetchData = async () => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const [plansRes, paymentsRes, membershipsRes] = await Promise.all([
        supabase.from("membership_plans").select("*").eq("status", "active"),
        supabase.functions.invoke("get-payment-status"),
        supabase
          .from("memberships")
          .select("id, status, start_date, end_date")
          .order("created_at", { ascending: false }),
      ]);

      if (plansRes.error) {
        console.error("Error fetching plans:", plansRes.error);
      } else {
        setPlans(plansRes.data || []);
      }

      if (paymentsRes.error) {
        console.error("Error fetching payments:", paymentsRes.error);
      } else {
        setPayments(paymentsRes.data?.payments || []);
      }

      if (membershipsRes.error) {
        console.error("Error fetching memberships:", membershipsRes.error);
      } else {
        const list = (membershipsRes.data || []) as Membership[];
        setMemberships(list);
        const active = list.find((m: Membership) => m.status === "active");
        setDaysRemaining(
          active?.end_date
            ? Math.max(
                0,
                Math.ceil(
                  (new Date(active.end_date).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
              )
            : null,
        );
      }
    } catch (error: any) {
      console.error("Error fetching membership data:", error);
      Alert.alert("Error", "Failed to load membership data");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (plan: Plan) => {
    setPurchasing(plan.id);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const redirectUrl =
        Platform.OS === "web" && typeof window !== "undefined"
          ? `${window.location.origin}/member/membership`
          : undefined;

      const { data, error } = await supabase.functions.invoke(
        "create-gym-invoice",
        {
          body: {
            plan_id: plan.id,
            success_redirect_url: redirectUrl,
            failure_redirect_url: redirectUrl,
          },
        },
      );

      if (error || !data?.checkout_url) {
        playSound("warning");
        Alert.alert(
          "Error",
          data?.error || error?.message || "Failed to create payment invoice",
        );
        return;
      }

      await WebBrowser.openBrowserAsync(data.checkout_url);
      await fetchData();
    } catch (error: any) {
      playSound("warning");
      Alert.alert("Error", error.message || "Failed to start payment");
    } finally {
      setPurchasing(null);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      checkAuth();
    }, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const activeMembership = memberships.find((m) => m.status === "active");
  const hasPendingPayment = payments.some((p) => p.status === "pending");
  const daysLeft = daysRemaining;
  const canPay = !hasPendingPayment && (daysLeft === null || daysLeft <= 5);
  const memberId = `#KF-${(user?.id || "").slice(0, 4).toUpperCase()}-${((user?.email || "").split("@")[0] || "MEM").slice(0, 3).toUpperCase()}`;
  const planName = plans[0]?.name || "K-FIT All-Access Pass";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.replace("/member/dashboard")}
        >
          <SymbolView
            name={{
              ios: "chevron.left",
              android: "arrow_back",
              web: "arrow_back",
            }}
            tintColor={Theme.accent}
            size={14}
          />
          <Text style={styles.backText}>BACK TO DASHBOARD</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Text style={styles.title}>Membership & Payments</Text>
            <Text style={styles.subtitle}>
              Manage plan access, dues, & transaction receipts
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <SymbolView
              name={{
                ios: "checkmark.shield.fill",
                android: "verified_user",
                web: "verified_user",
              }}
              tintColor={Theme.accent}
              size={20}
            />
          </View>
        </View>
      </View>

      {/* Premium Membership Pass Card */}
      <View style={styles.passCard}>
        <View style={styles.passGlow} pointerEvents="none" />
        {/* Subtle dot pattern overlay (simulated with borders) */}
        <View style={styles.passPattern} pointerEvents="none" />

        <View style={styles.passTopRow}>
          <View>
            <View style={styles.passLabelRow}>
              <Animated.View
                style={[
                  styles.passDot,
                  {
                    backgroundColor: activeMembership
                      ? Theme.green
                      : Theme.crimson,
                    opacity: pulse,
                  },
                ]}
              />
              <Text style={styles.passLabel}>CURRENT MEMBERSHIP</Text>
            </View>
            <Text style={styles.passTitle}>{planName}</Text>
          </View>
          {activeMembership && (
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>ACTIVE TIER</Text>
            </View>
          )}
        </View>

        <View style={styles.passDetails}>
          <View style={styles.passDetailItem}>
            <Text style={styles.passDetailLabel}>ACTIVE UNTIL</Text>
            <View style={styles.passDetailValueRow}>
              <SymbolView
                name={{ ios: "calendar", android: "event", web: "event" }}
                tintColor={Theme.accent}
                size={13}
              />
              <Text style={styles.passDetailValue}>
                {activeMembership?.end_date
                  ? new Date(activeMembership.end_date).toLocaleDateString()
                  : "No active plan"}
              </Text>
            </View>
          </View>
          <View style={styles.passDetailItem}>
            <Text style={styles.passDetailLabel}>MEMBER ID</Text>
            <Text style={styles.passDetailMono}>{memberId}</Text>
          </View>
        </View>

        <View style={styles.coverageRow}>
          <View style={styles.coverageLeft}>
            <SymbolView
              name={{
                ios: "sparkles",
                android: "auto_awesome",
                web: "auto_awesome",
              }}
              tintColor={Theme.accent}
              size={14}
            />
            <Text style={styles.coverageText}>Continuous Plan Coverage</Text>
          </View>
          <View style={styles.daysBadge}>
            <Text style={styles.daysBadgeText}>
              {daysRemaining !== null
                ? `${daysRemaining} Days Remaining`
                : "No Coverage"}
            </Text>
          </View>
        </View>
      </View>

      {/* Membership Plans */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Membership Plans</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{plans.length} Available</Text>
          </View>
        </View>
      </View>

      {plans.length === 0 ? (
        <Text style={styles.emptyText}>No plans available</Text>
      ) : (
        plans.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planTopRow}>
              <View style={styles.planTag}>
                <Text style={styles.planTagText}>FAST RENEWAL</Text>
              </View>
              <View style={styles.planDuration}>
                <SymbolView
                  name={{ ios: "clock", android: "schedule", web: "schedule" }}
                  tintColor={Theme.accent}
                  size={11}
                />
                <Text style={styles.planDurationText}>
                  {plan.duration_days} Days Pass
                </Text>
              </View>
            </View>

            <Text style={styles.planName}>{plan.name}</Text>
            {plan.description ? (
              <Text style={styles.planDesc}>{plan.description}</Text>
            ) : null}

            <View style={styles.priceRow}>
              <Text style={styles.planPrice}>₱{plan.price}</Text>
              <Text style={styles.planPriceUnit}>
                / {plan.duration_days} days cycle
              </Text>
              {plan.price <= 100 && (
                <View style={styles.offerBadge}>
                  <Text style={styles.offerBadgeText}>Special Offer</Text>
                </View>
              )}
            </View>

            <View style={styles.featuresRow}>
              <View style={styles.featurePill}>
                <SymbolView
                  name={{ ios: "checkmark", android: "check", web: "check" }}
                  tintColor={Theme.accent}
                  size={10}
                />
                <Text style={styles.featurePillText}>
                  {plan.duration_days}-Day Access
                </Text>
              </View>
              <View style={styles.featurePill}>
                <SymbolView
                  name={{ ios: "checkmark", android: "check", web: "check" }}
                  tintColor={Theme.accent}
                  size={10}
                />
                <Text style={styles.featurePillText}>All Gym Zones</Text>
              </View>
              <View style={styles.featurePill}>
                <SymbolView
                  name={{ ios: "checkmark", android: "check", web: "check" }}
                  tintColor={Theme.accent}
                  size={10}
                />
                <Text style={styles.featurePillText}>Cardio + Weights</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.payButton,
                (purchasing === plan.id || !canPay) && styles.payButtonDisabled,
              ]}
              onPress={() => handlePay(plan)}
              disabled={purchasing === plan.id || !canPay}
              activeOpacity={0.8}
            >
              <Text style={styles.payButtonText}>
                {purchasing === plan.id
                  ? "Creating invoice..."
                  : hasPendingPayment
                    ? "Payment Pending"
                    : daysLeft !== null && daysLeft > 5
                      ? `Renewal in ${daysLeft - 5} days`
                      : "Pay with Xendit"}
              </Text>
              <SymbolView
                name={{
                  ios: "arrow.right",
                  android: "arrow_forward",
                  web: "arrow_forward",
                }}
                tintColor={Theme.onAccent}
                size={14}
              />
            </TouchableOpacity>

            <View style={styles.securityRow}>
              <View style={styles.securityLeft}>
                <SymbolView
                  name={{ ios: "lock.fill", android: "lock", web: "lock" }}
                  tintColor="#71717A"
                  size={10}
                />
                <Text style={styles.securityText}>
                  SECURE 256-BIT ENCRYPTION
                </Text>
              </View>
              <View style={styles.gatewayRow}>
                {["GCash", "Maya", "Cards"].map((g) => (
                  <View key={g} style={styles.gatewayBadge}>
                    <Text style={styles.gatewayBadgeText}>{g}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))
      )}

      {/* Payment History */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{payments.length} Logs</Text>
          </View>
        </View>
      </View>

      {payments.length === 0 ? (
        <Text style={styles.emptyText}>No payments yet</Text>
      ) : (
        <View style={styles.historyList}>
          {payments.map((payment) => {
            const statusStyle =
              STATUS_STYLES[payment.status] || STATUS_STYLES.pending;
            const isPaid = payment.status === "paid";
            return (
              <View key={payment.id} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <View
                    style={[
                      styles.historyIcon,
                      {
                        backgroundColor: statusStyle.bg,
                        borderColor: statusStyle.border,
                      },
                    ]}
                  >
                    <SymbolView
                      name={
                        isPaid
                          ? {
                              ios: "checkmark.circle.fill",
                              android: "check_circle",
                              web: "check_circle",
                            }
                          : {
                              ios: "clock.fill",
                              android: "schedule",
                              web: "schedule",
                            }
                      }
                      tintColor={statusStyle.color}
                      size={18}
                    />
                  </View>
                  <View>
                    <View style={styles.historyAmountRow}>
                      <Text style={styles.historyAmount}>
                        ₱{payment.amount.toFixed(2)}
                      </Text>
                      <Text style={styles.historyRef}>
                        #{(payment.id || "").slice(0, 8).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.historyMeta} numberOfLines={1}>
                      {payment.payment_method || "Online"}
                      {payment.paid_at
                        ? ` • ${new Date(payment.paid_at).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`
                        : payment.created_at
                          ? ` • ${new Date(payment.created_at).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`
                          : ""}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: statusStyle.bg,
                        borderColor: statusStyle.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: statusStyle.color },
                      ]}
                    >
                      {payment.status.toUpperCase()}
                    </Text>
                  </View>
                  <SymbolView
                    name={{
                      ios: "doc.text",
                      android: "receipt_long",
                      web: "receipt_long",
                    }}
                    tintColor="#71717A"
                    size={14}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Refresh Button */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={fetchData}
        activeOpacity={0.8}
      >
        <SymbolView
          name={{ ios: "arrow.clockwise", android: "refresh", web: "refresh" }}
          tintColor={Theme.accent}
          size={14}
        />
        <Text style={styles.refreshText}>REFRESH PAYMENT STATUS</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  loadingText: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    color: Theme.textMuted,
    textAlign: "center",
    marginTop: 40,
  },
  header: {
    marginBottom: 20,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  backText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    fontWeight: "700",
    color: Theme.accent,
    letterSpacing: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleLeft: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 26,
    fontWeight: "800",
    color: Theme.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Theme.textMuted,
    marginTop: 4,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Theme.card,
    borderWidth: 1,
    borderColor: Theme.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Pass Card */
  passCard: {
    backgroundColor: "#151A21",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2C3545",
    padding: 20,
    marginBottom: 26,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  passGlow: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
  },
  passPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
    borderWidth: 20,
    borderColor: "#fff",
    borderStyle: "dotted",
  },
  passTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  passLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  passDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  passLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 10,
    fontWeight: "700",
    color: Theme.textMuted,
    letterSpacing: 1.5,
  },
  passTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 20,
    fontWeight: "800",
    color: Theme.text,
    letterSpacing: -0.3,
  },
  tierBadge: {
    backgroundColor: Theme.greenDim,
    borderWidth: 1,
    borderColor: Theme.greenBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tierBadgeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 9,
    fontWeight: "800",
    color: Theme.green,
    letterSpacing: 1,
  },
  passDetails: {
    flexDirection: "row",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: "#232934",
    marginTop: 18,
    paddingTop: 16,
  },
  passDetailItem: {
    flex: 1,
  },
  passDetailLabel: {
    fontFamily: "Poppins-Medium",
    fontSize: 9,
    fontWeight: "600",
    color: Theme.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  passDetailValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  passDetailValue: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    fontWeight: "700",
    color: Theme.text,
  },
  passDetailMono: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    fontWeight: "700",
    color: "#D4D4D8",
    letterSpacing: 0.5,
  },
  coverageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.cardInner,
    borderWidth: 1,
    borderColor: "#232832",
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },
  coverageLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  coverageText: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  daysBadge: {
    backgroundColor: Theme.accentDim,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  daysBadgeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    fontWeight: "700",
    color: Theme.accent,
  },

  /* Sections */
  sectionHeader: {
    marginBottom: 14,
    marginTop: 6,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 17,
    fontWeight: "700",
    color: Theme.text,
  },
  countBadge: {
    backgroundColor: Theme.card,
    borderWidth: 1,
    borderColor: Theme.borderLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 10,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  emptyText: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Theme.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },

  /* Plan Card */
  planCard: {
    backgroundColor: Theme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
  },
  planTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  planTag: {
    backgroundColor: Theme.accentDim,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planTagText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 9,
    fontWeight: "800",
    color: Theme.accent,
    letterSpacing: 1,
  },
  planDuration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  planDurationText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
    fontWeight: "600",
    color: Theme.textMuted,
  },
  planName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 20,
    fontWeight: "800",
    color: Theme.text,
    marginBottom: 4,
  },
  planDesc: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Theme.textMuted,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 16,
  },
  planPrice: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 34,
    fontWeight: "800",
    color: Theme.accent,
    letterSpacing: -0.5,
  },
  planPriceUnit: {
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    fontWeight: "600",
    color: Theme.textMuted,
  },
  offerBadge: {
    marginLeft: "auto",
    backgroundColor: Theme.greenDim,
    borderWidth: 1,
    borderColor: Theme.greenBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  offerBadgeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 10,
    fontWeight: "700",
    color: Theme.green,
  },
  featuresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#232A35",
    paddingTop: 16,
    marginBottom: 20,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Theme.pill,
    borderWidth: 1,
    borderColor: Theme.borderLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  featurePillText: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
    fontWeight: "600",
    color: "#D4D4D8",
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Theme.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: Theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  payButtonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    fontWeight: "800",
    color: Theme.onAccent,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  securityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  securityText: {
    fontFamily: "Poppins-Medium",
    fontSize: 9,
    fontWeight: "600",
    color: "#71717A",
    letterSpacing: 0.5,
  },
  gatewayRow: {
    flexDirection: "row",
    gap: 8,
  },
  gatewayBadge: {
    backgroundColor: "#101318",
    borderWidth: 1,
    borderColor: "#2A313E",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  gatewayBadgeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 9,
    fontWeight: "700",
    color: "#D4D4D8",
  },

  /* Payment History */
  historyList: {
    marginBottom: 4,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.historyCard,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexShrink: 1,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  historyAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyAmount: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    fontWeight: "700",
    color: Theme.text,
  },
  historyRef: {
    fontFamily: "Poppins-Medium",
    fontSize: 10,
    fontWeight: "600",
    color: Theme.textMuted,
  },
  historyMeta: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Theme.textMuted,
    marginTop: 4,
  },
  historyRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Theme.card,
    borderWidth: 1,
    borderColor: Theme.borderLight,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 20,
  },
  refreshText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    fontWeight: "700",
    color: "#D4D4D8",
    letterSpacing: 1,
  },
});
