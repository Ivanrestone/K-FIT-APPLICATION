import MemberBottomNav from "@/components/MemberBottomNav";
import MemberPaymentOptions from "@/components/MemberPaymentOptions";
import { KFitColors } from "@/constants/theme";
import { useLogout } from "@/hooks/use-logout";
import { useMemberProfile } from "@/hooks/use-member-profile";
import {
  hasActiveSubscription,
  useSubscriptionAccess,
  type PricingPlan,
  type SubscriptionPlanType,
} from "@/hooks/use-subscription-access";
import { invokeDevSubscriptionAction } from "@/utils/supabase";
import { readPendingCheckout, verifyPendingPaymongoCheckout } from "@/utils/paymongo";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Clears the floating nav (dock + raised QR button + safe area).
const NAV_CLEARANCE = 140;

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

function LinkRow({
  label,
  icon,
  last,
  onPress,
}: {
  label: string;
  icon: FeatherName;
  last?: boolean;
  onPress?: () => void;
}) {
  return (
    <>
      <TouchableOpacity
        style={styles.linkRow}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.linkLeft}>
          <View style={styles.linkIconBox}>
            <Feather name={icon} size={16} color={KFitColors.accent} />
          </View>
          <Text style={styles.linkLabel}>{label}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={KFitColors.mutedText} />
      </TouchableOpacity>
      {!last ? <View style={styles.dividerInset} /> : null}
    </>
  );
}

function GoldButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.goldButton}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      <ImageBackground
        source={require("../../assets/images/gold-texture.jpg")}
        resizeMode="cover"
        style={styles.goldButtonBg}
        imageStyle={styles.goldButtonImage}
      >
        <Text style={styles.goldButtonText}>{label}</Text>
      </ImageBackground>
    </TouchableOpacity>
  );
}

function formatPlanDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function formatPlanPrice(plan: PricingPlan | null): string | null {
  if (!plan) {
    return null;
  }
  const locale = plan.displayCurrency === "PHP" ? "en-PH" : "en-US";
  const amount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(plan.displayAmount);
  return `${plan.displayCurrency} ${amount} / month`;
}

function planLabel(type: SubscriptionPlanType) {
  return type === "app" ? "App access" : "Gym access";
}

function MembershipPlanCard({
  access,
  onCancelSubscription,
  cancellingPlan,
  isVerifyingPayment,
}: {
  access: ReturnType<typeof useSubscriptionAccess>;
  onCancelSubscription: (type: SubscriptionPlanType) => void;
  cancellingPlan: SubscriptionPlanType | null;
  isVerifyingPayment?: boolean;
}) {
  const { data, error, isLoading, isRefreshing, isSignedIn, refresh } = access;

  if (isLoading || isVerifyingPayment) {
    return (
      <View style={[styles.planCard, styles.planLoading]}>
        <ActivityIndicator color={KFitColors.accent} />
        <Text style={styles.planMetaText}>
          {isVerifyingPayment ? "Verifying payment with PayMongo…" : "Checking your plan…"}
        </Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.planCard}>
        <Text selectable style={styles.planError}>
          {!isSignedIn
            ? "Sign in to view your membership plan."
            : error ?? "Membership details are unavailable right now."}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={refresh}
          disabled={isRefreshing}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Retry loading membership plan"
        >
          <Feather name="refresh-cw" size={14} color={KFitColors.accent} />
          <Text style={styles.retryButtonText}>
            {isRefreshing ? "Retrying…" : "Retry"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const planTypes: SubscriptionPlanType[] = data.role === "member"
    ? ["app", "gym"]
    : ["app"];
  const rows = planTypes.map((type) => {
    const subscription = type === "app"
      ? data.appSubscription
      : data.gymSubscription;
    const isPlanActive = type === "app"
      ? (data.app_subscription_status === "active" || hasActiveSubscription(subscription))
      : (data.gym_membership_status === "active" || hasActiveSubscription(subscription));
    return {
      type,
      subscription,
      plan: data.plans.find((item) => item.planType === type) ?? null,
      active: isPlanActive,
    };
  });
  const activeRows = rows.filter((row) => row.active);
  const isAnyActive =
    activeRows.length > 0 ||
    data.app_subscription_status === "active" ||
    data.gym_membership_status === "active";
  const planName = activeRows.length === 0
    ? "No active plan"
    : activeRows.length === rows.length
      ? planTypes.map((type) => (type === "app" ? "App" : "Gym")).join(" + ")
      : activeRows[0].type === "app"
        ? "App plan"
        : "Gym membership";
  const nextExpiry = activeRows
    .map((row) => row.subscription?.expiresAt)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? null;
  const isCancelled = activeRows.some((row) => row.subscription?.cancelledAt);

  return (
    <View style={styles.planCard}>
      <View style={styles.planTop}>
        <View>
          <Text style={styles.planLabel}>Current plan</Text>
          <Text style={styles.planName}>{planName}</Text>
        </View>
        <View
          style={[
            styles.statusChip,
            isAnyActive && !isCancelled && styles.statusChipGreen,
            !isAnyActive && styles.statusChipInactive,
          ]}
        >
          <Text
            style={[
              styles.statusChipText,
              isAnyActive && !isCancelled && styles.statusChipTextGreen,
              !isAnyActive && styles.statusChipTextInactive,
            ]}
          >
            {!isAnyActive ? "Inactive" : isCancelled ? "Canceled" : "Active"}
          </Text>
        </View>
      </View>

      {rows.map((row) => {
        const price = formatPlanPrice(row.plan);
        const expiry = row.subscription?.expiresAt
          ? `${row.active ? "Paid through" : "Ended"} ${formatPlanDate(row.subscription.expiresAt)}`
          : row.active
            ? "No expiry on record"
            : "Not started";
        const isBusy = cancellingPlan === row.type;
        return (
          <View key={row.type} style={styles.planItemBlock}>
            <View style={styles.planRow}>
              <View style={styles.planRowCopy}>
                <Text style={styles.planRowLabel}>{planLabel(row.type)}</Text>
                <Text style={styles.planRowMeta}>
                  {[price, expiry].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <View
                style={[
                  styles.planBadge,
                  row.active ? styles.planBadgeGreen : styles.planBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.planBadgeText,
                    row.active ? styles.planBadgeTextGreen : styles.planBadgeTextInactive,
                  ]}
                >
                  {row.active ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>

            {/* Cancel Subscription button under active plan */}
            {row.active && !row.subscription?.cancelledAt && (
              <TouchableOpacity
                style={[styles.cancelPlanButton, isBusy && styles.btnDisabled]}
                onPress={() => onCancelSubscription(row.type)}
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel={`Cancel ${planLabel(row.type)}`}
              >
                <Feather name="x-circle" size={13} color={KFitColors.error} />
                <Text style={styles.cancelPlanButtonText}>
                  {isBusy ? "Cancelling…" : "Cancel Subscription"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {activeRows.length === 0 ? (
        <Text selectable style={styles.planNotice}>
          Start or renew a plan under Payment Options below to use the gym and
          the app.
        </Text>
      ) : null}
      {error ? (
        <Text selectable style={styles.planNotice}>
          {error} Showing the last loaded status.
        </Text>
      ) : null}

      <View style={[styles.divider, styles.planDivider]} />
      <View style={styles.renewRow}>
        <Feather
          name="calendar"
          size={14}
          color={isAnyActive ? "#10B981" : KFitColors.mutedText}
        />
        <Text
          style={[styles.renewText, isAnyActive && styles.renewTextActive]}
        >
          {nextExpiry
            ? `${isCancelled ? "Access ends" : "Renews on"} ${formatPlanDate(nextExpiry)}`
            : "No renewal scheduled"}
        </Text>
      </View>

    </View>
  );
}

/* ------------------------------- Dev panel ---------------------------------- */

// Kept out of MembershipPlanCard so it still renders while the plan is loading
// or when the subscription fetch failed — the states where testing needs it.
function DevActivationPanel({
  onDevActivate,
  isDevActivating,
  onDevReset,
  isDevResetting,
}: {
  onDevActivate: (planType?: "app" | "gym" | "all_access") => void;
  isDevActivating: boolean;
  onDevReset: () => void;
  isDevResetting: boolean;
}) {
  const busy = isDevActivating || isDevResetting;

  return (
    <View style={styles.devCard}>
      <View style={styles.devHeader}>
        <Feather name="terminal" size={14} color={KFitColors.accent} />
        <Text style={styles.devCardTitle}>Dev / Test Activation</Text>
      </View>
      <Text style={styles.devCardSubtitle}>
        Invokes deployed edge function to mark status active / inactive and invalidate cache:
      </Text>
      <View style={styles.devButtonRow}>
        <TouchableOpacity
          style={[styles.devActivateBtn, busy && styles.btnDisabled]}
          onPress={() => onDevActivate("all_access")}
          disabled={busy}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Feather name="zap" size={14} color="#121212" />
          <Text style={styles.devActivateBtnText}>
            {isDevActivating ? "Activating…" : "Activate (App + Gym)"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.devActivateOutlineBtn, busy && styles.btnDisabled]}
          onPress={() => onDevActivate("app")}
          disabled={busy}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.devActivateOutlineBtnText}>App Only</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.devResetBtn, busy && styles.btnDisabled]}
        onPress={onDevReset}
        disabled={busy}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Feather name="rotate-ccw" size={14} color={KFitColors.error} />
        <Text style={styles.devResetBtnText}>
          {isDevResetting ? "Resetting…" : "Reset / Expire Subscriptions"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------------------------------- Screen ---------------------------------- */

export default function MemberMembershipScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ payment?: string }>();
  const { isSigningOut, logout } = useLogout();
  const { profile } = useMemberProfile();
  const { user } = useUser();
  const subscription = useSubscriptionAccess();

  const [isDevActivating, setIsDevActivating] = useState(false);
  const [isDevResetting, setIsDevResetting] = useState(false);
  const [cancellingPlan, setCancellingPlan] = useState<SubscriptionPlanType | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  const { refetch: refetchSubscription } = subscription;
  const subscriptionUserId = subscription.data?.userId;
  const paymentVerificationRef = useRef(false);

  // When PayMongo sends the member back, confirm the checkout with PayMongo
  // before refreshing. The webhook can be late or not forwarding at all, and
  // the plan must flip to Active without the manual simulation button.
  const confirmReturnedPayment = useCallback(async () => {
    if (paymentVerificationRef.current) {
      return;
    }
    const pending = await readPendingCheckout();
    const targetUserId = user?.id ?? subscriptionUserId ?? pending?.userId;
    if (!targetUserId) {
      return;
    }
    // If no checkout was pending on this device, refresh the subscription state directly
    if (!pending) {
      await refetchSubscription();
      return;
    }

    paymentVerificationRef.current = true;
    setIsVerifyingPayment(true);
    try {
      const result = await verifyPendingPaymongoCheckout({
        userId: targetUserId,
      });
      // Nothing started on this device (or another account did): just refresh.
      if (result.idle) {
        await refetchSubscription();
        return;
      }
      if (!result.success) {
        console.warn("[PayMongo] Payment verification failed:", result.error);
        await refetchSubscription();
        return;
      }

      if (result.paid) {
        await refetchSubscription();
        const activeUserId = user?.id || subscriptionUserId || targetUserId;
        if (typeof (globalThis as any).queryClient?.invalidateQueries === "function") {
          (globalThis as any).queryClient.invalidateQueries({
            queryKey: ["subscription", activeUserId],
          });
        }
        // The webhook may have already applied this exact session.
        if (!result.duplicate) {
          Alert.alert(
            "Payment Confirmed",
            result.planType === "gym"
              ? "Your gym membership is active! Your plan has been extended by 30 days."
              : "Your app subscription is active! Digital features and gate pass are now unlocked.",
          );
        }
      } else {
        // Cancelled, or the payment is still being settled
        await refetchSubscription();
      }
    } catch (error) {
      console.warn(
        "[PayMongo] Payment verification error:",
        error instanceof Error ? error.message : String(error),
      );
      await refetchSubscription();
    } finally {
      setIsVerifyingPayment(false);
      paymentVerificationRef.current = false;
    }
  }, [refetchSubscription, subscriptionUserId, user]);

  // PayMongo success/cancel redirect: k-fit://member-membership?payment=success
  useEffect(() => {
    if (!params.payment) {
      return;
    }
    void WebBrowser.dismissBrowser();
    const timer = setTimeout(() => {
      void confirmReturnedPayment();
    }, 0);
    return () => clearTimeout(timer);
  }, [confirmReturnedPayment, params.payment]);

  // Also listen for incoming deep link URLs
  useEffect(() => {
    const sub = Linking.addEventListener("url", (event) => {
      if (event.url.includes("payment=") || event.url.includes("member-membership")) {
        void WebBrowser.dismissBrowser();
        void confirmReturnedPayment();
      }
    });
    return () => sub.remove();
  }, [confirmReturnedPayment]);

  // The member can also close the browser manually. Verify again whenever the
  // app returns to the foreground so the plan still activates without a deep
  // link; a paid session is cleared, so this is a cheap no-op afterwards.
  useEffect(() => {
    let previousState = AppState.currentState;
    const listener = AppState.addEventListener("change", (nextState) => {
      const returnedToForeground = nextState === "active" &&
        previousState !== "active";
      previousState = nextState;
      if (returnedToForeground) {
        void confirmReturnedPayment();
      }
    });
    return () => listener.remove();
  }, [confirmReturnedPayment]);

  // Dev / Test activation calling deployed edge function dev-activate-subscription
  const handleDevActivate = async (planType: "app" | "gym" | "all_access" = "all_access") => {
    if (!subscription.supabase) {
      Alert.alert("Error", "Payment / Supabase service is unavailable.");
      return;
    }
    const targetUserId = user?.id ?? subscription.data?.userId;
    if (!targetUserId) {
      Alert.alert("Activation Error", "Your account is not ready yet. Try again in a moment.");
      return;
    }
    setIsDevActivating(true);
    try {
      // Posts the member id straight to the function, so activation works even
      // when this device has no session token for the Supabase client.
      const result = await invokeDevSubscriptionAction({
        userId: targetUserId,
        planType,
      });
      if (!result.success) {
        Alert.alert(
          "Activation Error",
          result.error ?? "Dev activation returned an error.",
        );
        return;
      }
      // Immediately call refetch() and invalidate ['subscription', user.id] cache
      await subscription.refetch();
      const activeUserId = user?.id || subscription.data?.userId;
      if (typeof (globalThis as any).queryClient?.invalidateQueries === "function") {
        (globalThis as any).queryClient.invalidateQueries({
          queryKey: ["subscription", activeUserId],
        });
      }
      Alert.alert(
        "Activated Successfully",
        "Your subscription has been activated! Gate pass and digital features are now unlocked.",
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Dev activation failed.");
    } finally {
      setIsDevActivating(false);
    }
  };

  // Dev / Test reset: expire both plans through the same edge function.
  // The client is granted SELECT only on the subscription tables, so the write
  // has to happen server-side with the service role.
  const handleDevReset = async () => {
    if (!subscription.supabase) {
      Alert.alert("Error", "Payment / Supabase service is unavailable.");
      return;
    }
    const targetUserId = user?.id ?? subscription.data?.userId;
    if (!targetUserId) {
      Alert.alert("Reset Error", "Your account is not ready yet. Try again in a moment.");
      return;
    }
    setIsDevResetting(true);
    try {
      const result = await invokeDevSubscriptionAction({
        userId: targetUserId,
        action: "reset",
      });
      if (!result.success) {
        Alert.alert(
          "Reset Error",
          result.error ?? "Subscriptions could not be reset.",
        );
        return;
      }
      // Same refresh path as activation: refetch, then drop the cached query.
      await subscription.refetch();
      const activeUserId = user?.id || subscription.data?.userId;
      if (typeof (globalThis as any).queryClient?.invalidateQueries === "function") {
        (globalThis as any).queryClient.invalidateQueries({
          queryKey: ["subscription", activeUserId],
        });
      }
      Alert.alert(
        "Subscriptions Reset",
        "App and Gym access are now inactive and expired, and the screen has been refreshed.",
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Reset failed.");
    } finally {
      setIsDevResetting(false);
    }
  };

  // Subscription cancellation with confirmation modal
  const handleCancelSubscription = (type: SubscriptionPlanType) => {
    const label = type === "app" ? "App access" : "Gym access";
    Alert.alert(
      "Cancel Subscription",
      `Are you sure you want to cancel your ${label}? Your access will remain active until the end of the paid period.`,
      [
        { text: "Keep Subscription", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            if (!subscription.supabase) return;
            setCancellingPlan(type);
            try {
              // 1. Invoke cancel-subscription Edge Function
              const { error: fnErr } = await subscription.supabase.functions.invoke(
                "cancel-subscription",
                { body: { feeType: type } },
              );
              if (fnErr) {
                console.warn("cancel-subscription error:", fnErr.message);
              }

              // 2. Also update public.subscriptions if present
              const activeUserId = user?.id || subscription.data?.userId;
              if (activeUserId) {
                try {
                  await subscription.supabase
                    .from("subscriptions")
                    .update({ status: "cancelled", auto_renew: false })
                    .eq("user_id", activeUserId);
                } catch (subErr) {
                  console.warn("Notice: public.subscriptions update ignored:", subErr);
                }
              }

              Alert.alert(
                "Subscription Cancelled",
                `Your ${label} has been cancelled. It will remain active until the current period expires.`,
              );
              await subscription.refetch();
              if (typeof (globalThis as any).queryClient?.invalidateQueries === "function") {
                (globalThis as any).queryClient.invalidateQueries({
                  queryKey: ["subscription", activeUserId],
                });
              }
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to cancel subscription.");
            } finally {
              setCancellingPlan(null);
            }
          },
        },
      ],
    );
  };

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
  const initials =
    nameParts
      .map((n) => n.trim().charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "KF";

  const go = (route: string) => router.replace(route as any);

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

          {/* Greeting */}
          <View style={styles.greetingSection}>
            <View style={styles.memberRow}>
              <ImageBackground
                source={require("../../assets/images/gold-texture.jpg")}
                resizeMode="cover"
                style={styles.avatar}
                imageStyle={styles.avatarImage}
              >
                <Text style={styles.avatarInitials}>{initials}</Text>
              </ImageBackground>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberLabel}>MEMBER</Text>
                <Text style={styles.memberName} numberOfLines={1}>
                  {fullName}
                </Text>
              </View>
            </View>
            <Text style={styles.greeting}>Your club, your membership.</Text>
            <Text style={styles.greetingSubtitle}>
              Everything you need to manage your plan and payments.
            </Text>
          </View>

          {/* Plan summary: real App/Gym subscription records */}
          <MembershipPlanCard
            access={subscription}
            onCancelSubscription={handleCancelSubscription}
            cancellingPlan={cancellingPlan}
            isVerifyingPayment={isVerifyingPayment}
          />

          <DevActivationPanel
            onDevActivate={handleDevActivate}
            isDevActivating={isDevActivating}
            onDevReset={handleDevReset}
            isDevResetting={isDevResetting}
          />

          {/* Manage */}
          <Section title="Membership & Payments" icon="credit-card">
            <View style={styles.cardFlush}>
              <LinkRow label="Plan options" icon="layers" />
              <LinkRow label="Billing details" icon="file-text" />
              <LinkRow
                label="My workouts"
                icon="zap"
                onPress={() => go("/member-workout")}
              />
              <LinkRow
                label="Progress & profile"
                icon="user"
                onPress={() => go("/member-profile")}
                last
              />
            </View>
          </Section>

          {/* Payment options */}
          <Section title="Payment Options" icon="dollar-sign">
            <MemberPaymentOptions onCheckoutComplete={confirmReturnedPayment} />
          </Section>

          {/* Help */}
          <Section title="Need a hand?" icon="help-circle">
            <View style={styles.card}>
              <Text style={styles.bodyText}>
                Questions about billing, freezing, or changing your plan? Our
                team can help.
              </Text>
              <GoldButton label="Get help" onPress={() => {}} />
            </View>
          </Section>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>FORM ATHLETICS</Text>
            <Text style={styles.footerVersion}>Member workspace</Text>
          </View>
        </ScrollView>

        <MemberBottomNav activeRoute="/member-membership" />
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
  brandSubtitle: {
    fontSize: 12,
    color: KFitColors.mutedText,
    marginTop: 2,
  },
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

  /* Greeting */
  greetingSection: { paddingHorizontal: 20, marginTop: 20, marginBottom: 20 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: KFitColors.accentDark,
  },
  avatarImage: { borderRadius: 24 },
  avatarInitials: { color: "#121212", fontSize: 16, fontWeight: "900" },
  memberLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: KFitColors.mutedText,
  },
  memberName: {
    fontSize: 20,
    fontWeight: "800",
    color: KFitColors.text,
    marginTop: 2,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: KFitColors.text,
    marginBottom: 6,
  },
  greetingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: KFitColors.mutedText,
  },

  /* Plan card */
  planCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  planTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  planLabel: { fontSize: 12, color: KFitColors.mutedText },
  planName: {
    fontSize: 22,
    fontWeight: "900",
    color: KFitColors.text,
    marginTop: 2,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  statusChipText: { fontSize: 12, fontWeight: "800", color: KFitColors.accent },
  statusChipInactive: {
    backgroundColor: KFitColors.warning + "1A",
    borderColor: KFitColors.warning + "40",
  },
  statusChipTextInactive: { color: KFitColors.warning },
  statusChipGreen: {
    backgroundColor: "#10B98126",
    borderColor: "#10B981",
  },
  statusChipTextGreen: { color: "#10B981" },
  planItemBlock: {
    marginTop: 12,
    paddingBottom: 4,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  planBadgeGreen: {
    backgroundColor: "#10B98126",
    borderColor: "#10B981",
  },
  planBadgeTextGreen: {
    color: "#10B981",
    fontWeight: "800",
    fontSize: 11,
  },
  planBadgeInactive: {
    backgroundColor: KFitColors.warning + "1A",
    borderColor: KFitColors.warning + "40",
  },
  planBadgeTextInactive: {
    color: KFitColors.warning,
    fontWeight: "800",
    fontSize: 11,
  },
  cancelPlanButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: KFitColors.error + "15",
    borderWidth: 1,
    borderColor: KFitColors.error + "30",
  },
  cancelPlanButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: KFitColors.error,
  },
  planMetaText: { fontSize: 12, color: KFitColors.mutedText },
  planLoading: { flexDirection: "row", alignItems: "center", gap: 10 },
  planError: { fontSize: 13, lineHeight: 19, color: KFitColors.error },
  planNotice: {
    fontSize: 12,
    lineHeight: 18,
    color: KFitColors.warning,
    marginTop: 12,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  planRowCopy: { flex: 1, gap: 2 },
  planRowLabel: { fontSize: 14, fontWeight: "700", color: KFitColors.text },
  planRowMeta: { fontSize: 12, color: KFitColors.mutedText },
  planRowStatus: { fontSize: 12, fontWeight: "800" },
  planRowStatusActive: { color: KFitColors.accent },
  planRowStatusInactive: { color: KFitColors.warning },
  planDivider: { marginVertical: 14 },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.accent,
  },
  retryButtonText: { fontSize: 13, fontWeight: "800", color: KFitColors.accent },
  renewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 14,
  },
  renewText: { fontSize: 13, fontWeight: "600", color: KFitColors.text },
  renewTextActive: {
    color: "#10B981",
    fontWeight: "700",
  },

  /* Dev Card */
  devCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 12,
    borderRadius: 12,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  devHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  devCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: KFitColors.accent,
  },
  devCardSubtitle: {
    fontSize: 11,
    color: KFitColors.mutedText,
    lineHeight: 16,
    marginBottom: 10,
  },
  devButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  devActivateBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: KFitColors.accent,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  devActivateBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#121212",
  },
  devActivateOutlineBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.accent + "15",
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  devActivateOutlineBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: KFitColors.accent,
  },
  devResetBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.error + "50",
    backgroundColor: KFitColors.error + "15",
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  devResetBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: KFitColors.error,
  },
  btnDisabled: {
    opacity: 0.5,
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
  cardFlush: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  bodyText: {
    fontSize: 14,
    color: KFitColors.text,
    lineHeight: 21,
    marginBottom: 14,
  },

  /* Rows */
  divider: { height: 1, backgroundColor: KFitColors.border },
  dividerInset: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginLeft: 64,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 16,
  },
  linkLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  linkIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1F",
  },
  linkLabel: { fontSize: 14, color: KFitColors.text, fontWeight: "500" },

  /* Gold button */
  goldButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  goldButtonBg: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  goldButtonImage: { borderRadius: 12 },
  goldButtonText: { color: "#121212", fontSize: 14, fontWeight: "800" },

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
