import { useAuth } from "@clerk/expo";
import { Button, Column, Host } from "@expo/ui";
import { useSubscriptionAccess, type PricingPlan, type SubscriptionPeriod, type SubscriptionPlanType } from "@/hooks/use-subscription-access";
import { KFitColors, Spacing } from "@/constants/theme";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  children?: ReactNode;
  requireAppAccess?: boolean;
};

const clerkConfigured = Boolean(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);
const supabaseConfigured = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_KEY,
);

export default function SubscriptionPaywall({
  children,
  requireAppAccess = false,
}: Props) {
  if (!clerkConfigured) {
    return <MessagePanel message="Subscription access requires configured Clerk sign-in." />;
  }
  if (!supabaseConfigured) {
    return <MessagePanel message="Subscription access requires the Supabase URL and public key in the app environment." />;
  }

  return (
    <AuthenticatedSubscriptionPaywall requireAppAccess={requireAppAccess}>
      {children}
    </AuthenticatedSubscriptionPaywall>
  );
}

function AuthenticatedSubscriptionPaywall({
  children,
  requireAppAccess,
}: Props) {
  const { userId } = useAuth();
  const access = useSubscriptionAccess();
  const [startingFee, setStartingFee] = useState<SubscriptionPlanType | null>(
    null,
  );
  const [cancellingFee, setCancellingFee] = useState<SubscriptionPlanType | null>(
    null,
  );
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const startCheckout = useCallback(async (feeType: SubscriptionPlanType) => {
    if (!access.supabase) {
      Alert.alert("Checkout Error", "Payment service is unavailable. Please try again.");
      return;
    }

    setStartingFee(feeType);
    setActionMessage(null);
    try {
      // The Edge Function always returns HTTP 200 — errors come back as
      // { success: false, error: "..." } in the body so there is never a
      // FunctionsHttpError and we can always read data directly.
      const { data, error } = await access.supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            feeType,
            plan_type: feeType,
            user_id: access.data?.userId,
          },
        },
      );

      // Network / relay error (not an HTTP error from our function)
      if (error) {
        const msg = error instanceof Error
          ? error.message
          : "Could not reach checkout service.";
        Alert.alert("Checkout Error", msg);
        setActionMessage(msg);
        return;
      }

      // Application-level error returned as { success: false, error }
      const responseData = data as Record<string, unknown> | null;
      if (
        !responseData ||
        responseData.success === false ||
        typeof responseData.error === "string"
      ) {
        const msg = typeof responseData?.error === "string"
          ? responseData.error
          : "Could not start checkout.";
        Alert.alert("Checkout Error", msg);
        setActionMessage(msg);
        return;
      }

      const rawUrl =
        typeof responseData.checkout_url === "string"
          ? responseData.checkout_url
          : typeof responseData.checkoutUrl === "string"
            ? responseData.checkoutUrl
            : null;

      if (!rawUrl) {
        const msg = "The payment service returned an invalid checkout URL.";
        Alert.alert("Checkout Error", msg);
        setActionMessage(msg);
        return;
      }

      await WebBrowser.openBrowserAsync(rawUrl);
      access.refresh();
      setActionMessage(
        "Checkout opened. Access updates after PayMongo confirms payment.",
      );
    } catch (error) {
      const msg = error instanceof Error
        ? error.message
        : "Could not start checkout. Please try again.";
      Alert.alert("Checkout Error", msg);
      access.refresh();
      setActionMessage(msg);
    } finally {
      setStartingFee(null);
    }
  }, [access]);

  const cancelPlan = useCallback(async (feeType: SubscriptionPlanType) => {
    if (!access.supabase) {
      setActionMessage("Subscription service is unavailable. Please try again.");
      return;
    }

    setCancellingFee(feeType);
    setActionMessage(null);
    try {
      const { data, error } = await access.supabase.functions.invoke(
        "cancel-subscription",
        { body: { feeType } },
      );
      if (error) {
        throw new Error(error.message || "Could not cancel this subscription.");
      }
      if (
        typeof data !== "object" ||
        data === null ||
        !("expiresAt" in data) ||
        typeof data.expiresAt !== "string" ||
        !Number.isFinite(Date.parse(data.expiresAt))
      ) {
        throw new Error("The service returned an invalid cancellation result.");
      }

      setActionMessage(
        `${feeType === "app" ? "App" : "Gym"} access remains available until ${formatDate(data.expiresAt)}.`,
      );
      access.refresh();
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Could not cancel this subscription. Please try again.",
      );
    } finally {
      setCancellingFee(null);
    }
  }, [access]);

  const confirmCancellation = useCallback(
    (feeType: SubscriptionPlanType) => {
      const planName = feeType === "app" ? "App" : "Gym";
      const confirmationMessage =
        "Your access will continue through the paid-through date. The plan will not renew automatically.";

      if (process.env.EXPO_OS === "web") {
        if (
          typeof window !== "undefined" &&
          window.confirm(`Cancel ${planName} plan? ${confirmationMessage}`)
        ) {
          void cancelPlan(feeType);
        }
        return;
      }

      Alert.alert(
        `Cancel ${planName} plan?`,
        confirmationMessage,
        [
          { text: "Keep plan", style: "cancel" },
          {
            text: "Cancel plan",
            style: "destructive",
            onPress: () => void cancelPlan(feeType),
          },
        ],
      );
    },
    [cancelPlan],
  );

  if (!access.isLoaded || access.isLoading) {
    return (
      <View style={styles.statePanel}>
        <ActivityIndicator color={KFitColors.accent} />
        <Text style={styles.helperText}>Loading subscription status…</Text>
      </View>
    );
  }

  if (!access.isSignedIn || !userId) {
    if (requireAppAccess) {
      return <>{children}</>;
    }
    return (
      <MessagePanel message="Sign in to view and manage your subscriptions." />
    );
  }

  if ((!access.data || access.error) && requireAppAccess) {
    return (
      <View style={styles.statePanel}>
        <Text selectable style={styles.errorText}>
          {access.error ?? "Could not load subscription information."}
        </Text>
        <Host matchContents seedColor={KFitColors.surface}>
          <Button
            label="Retry"
            variant="outlined"
            onPress={access.refresh}
            disabled={access.isRefreshing}
          />
        </Host>
      </View>
    );
  }

  if (!access.data) {
    return (
      <View style={styles.statePanel}>
        <Text selectable style={styles.errorText}>
          {access.error ?? "Could not load subscription information."}
        </Text>
        <Host matchContents seedColor={KFitColors.surface}>
          <Button
            label="Retry"
            variant="outlined"
            onPress={access.refresh}
            disabled={access.isRefreshing}
          />
        </Host>
      </View>
    );
  }

  const data = access.data;
  const hasAppAccess = hasCurrentAccess(data.appSubscription);
  if (requireAppAccess && hasAppAccess) {
    return <>{children}</>;
  }

  if (!data.isProvisioned || !data.role) {
    return (
      <MessagePanel message="Your account is not provisioned for subscriptions. Contact your gym administrator to set up your member or coach record." />
    );
  }

  if (data.role === "admin") {
    return (
      <MessagePanel message="Subscription plans are not available for this account role." />
    );
  }

  const visiblePlanTypes: SubscriptionPlanType[] = data.role === "member"
    ? ["app", "gym"]
    : ["app"];

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>
        {requireAppAccess ? "App access is required" : "K-Fit subscriptions"}
      </Text>
      {requireAppAccess && (
        <Text style={styles.helperText}>
          Activate a monthly App plan to unlock your dashboard. You can renew
          manually through PayMongo Checkout.
        </Text>
      )}
      {access.error && (
        <View style={styles.errorBox}>
          <Text selectable style={styles.errorText}>
            {access.error} Showing the last loaded subscription details.
          </Text>
          <Host matchContents seedColor={KFitColors.surface}>
            <Button
              label="Retry"
              variant="outlined"
              onPress={access.refresh}
              disabled={access.isRefreshing}
            />
          </Host>
        </View>
      )}
      {data.plans.length === 0 ? (
        <Text selectable style={styles.helperText}>
          No subscription plans are currently available. Please try again later
          or contact your gym administrator.
        </Text>
      ) : (
        visiblePlanTypes.map((feeType) => (
          <PlanCard
            key={feeType}
            feeType={feeType}
            plan={data.plans.find((item) => item.planType === feeType) ?? null}
            subscription={feeType === "app"
              ? data.appSubscription
              : data.gymSubscription}
            isRefreshing={access.isRefreshing}
            disableActions={access.error !== null}
            isStarting={startingFee === feeType}
            isCancelling={cancellingFee === feeType}
            onCheckout={() => void startCheckout(feeType)}
            onCancel={() => confirmCancellation(feeType)}
          />
        ))
      )}
      {actionMessage && (
        <Text selectable style={styles.messageText}>{actionMessage}</Text>
      )}
      <Host matchContents seedColor={KFitColors.surface}>
        <Button
          label={access.isRefreshing ? "Refreshing…" : "Refresh status"}
          variant="text"
          onPress={access.refresh}
          disabled={access.isRefreshing || startingFee !== null ||
            cancellingFee !== null}
        />
      </Host>
    </View>
  );
}

function PlanCard({
  feeType,
  plan,
  subscription,
  isRefreshing,
  disableActions,
  isStarting,
  isCancelling,
  onCheckout,
  onCancel,
}: {
  feeType: SubscriptionPlanType;
  plan: PricingPlan | null;
  subscription: SubscriptionPeriod | null;
  isRefreshing: boolean;
  disableActions: boolean;
  isStarting: boolean;
  isCancelling: boolean;
  onCheckout: () => void;
  onCancel: () => void;
}) {
  const expiry = subscription?.expiresAt
    ? Date.parse(subscription.expiresAt)
    : Number.NaN;
  const hasAccess = hasCurrentAccess(subscription);
  const isCancelled = hasAccess && subscription?.cancelledAt !== null;
  const isInvalid = subscription?.active === true && !Number.isFinite(expiry);
  const canCheckout = Boolean(
    plan &&
      subscription &&
      !isInvalid &&
      !disableActions &&
      !(isCancelled && hasAccess),
  );
  const isBusy = isRefreshing || isStarting || isCancelling || disableActions;

  return (
    <View style={styles.planCard}>
      <View style={styles.planHeader}>
        <View style={styles.planCopy}>
          <Text style={styles.planTitle}>
            {feeType === "app" ? "App Subscription" : "Gym Membership"}
          </Text>
          <Text style={styles.helperText}>
            {feeType === "app"
              ? "Digital access to member and coach features"
              : "Physical access to the gym"}
          </Text>
        </View>
        <Text style={[
          styles.statusText,
          hasAccess ? styles.activeStatus : styles.inactiveStatus,
        ]}>
          {getStatusLabel(subscription, isInvalid)}
        </Text>
      </View>
      {plan ? (
        <View style={styles.priceBlock}>
          <Text style={styles.priceText}>
            {formatAmount(plan.displayAmount, plan.displayCurrency)} / month
          </Text>
          <Text style={styles.helperText}>
            Charged as {formatAmount(plan.billingAmountPhp, "PHP")} per month
          </Text>
        </View>
      ) : (
        <Text selectable style={styles.helperText}>
          This plan has no active price and is currently unavailable.
        </Text>
      )}
      {subscription?.expiresAt && (
        <Text selectable style={styles.helperText}>
          Paid through {formatDate(subscription.expiresAt)}
        </Text>
      )}
      {!subscription && (
        <Text selectable style={styles.warningText}>
          Your subscription record is not set up. Contact your gym
          administrator before purchasing.
        </Text>
      )}
      {isInvalid && (
        <Text selectable style={styles.errorText}>
          This subscription has an invalid expiry date. Contact your gym
          administrator before purchasing.
        </Text>
      )}
      <Host matchContents seedColor={KFitColors.surface}>
        <Column spacing={Spacing.two}>
          <Button
            label={isStarting
              ? "Opening checkout…"
              : `${hasAccess ? "Renew" : "Subscribe"} for ${
                plan
                  ? formatAmount(plan.billingAmountPhp, "PHP")
                  : "unavailable"
              }`}
            variant="filled"
            onPress={onCheckout}
            disabled={!canCheckout || isBusy}
          />
          {hasAccess && !isCancelled && (
            <Button
              label={isCancelling ? "Cancelling…" : "Cancel at period end"}
              variant="outlined"
              onPress={onCancel}
              disabled={isBusy}
            />
          )}
        </Column>
      </Host>
      {isCancelled && (
        <Text selectable style={styles.warningText}>
          Cancellation is scheduled. Access remains available until the paid
          period ends.
        </Text>
      )}
    </View>
  );
}

function hasCurrentAccess(subscription: SubscriptionPeriod | null): boolean {
  if (!subscription?.active || !subscription.expiresAt) {
    return false;
  }
  const expiry = Date.parse(subscription.expiresAt);
  return Number.isFinite(expiry) && expiry > Date.now();
}

function getStatusLabel(
  subscription: SubscriptionPeriod | null,
  isInvalid: boolean,
): string {
  if (!subscription) {
    return "Setup needed";
  }
  if (isInvalid) {
    return "Check status";
  }
  if (hasCurrentAccess(subscription)) {
    return subscription.cancelledAt ? "Canceled" : "Active";
  }
  if (subscription.expiresAt && Date.parse(subscription.expiresAt) <= Date.now()) {
    return "Expired";
  }
  return "Not active";
}

function formatAmount(amount: number, currency: string): string {
  const locale = currency === "PHP" ? "en-PH" : "en-US";
  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${currency} ${formattedAmount}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function MessagePanel({ message }: { message: string }) {
  return (
    <View style={styles.statePanel}>
      <Text selectable style={styles.helperText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: KFitColors.surface,
    borderColor: KFitColors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  statePanel: {
    alignItems: "flex-start",
    backgroundColor: KFitColors.surface,
    borderColor: KFitColors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  title: {
    color: KFitColors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  planCard: {
    backgroundColor: KFitColors.background,
    borderColor: KFitColors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  planHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.two,
    justifyContent: "space-between",
  },
  planCopy: {
    flex: 1,
    gap: Spacing.half,
  },
  planTitle: {
    color: KFitColors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  priceBlock: {
    gap: Spacing.half,
  },
  priceText: {
    color: KFitColors.accent,
    fontSize: 18,
    fontWeight: "700",
  },
  helperText: {
    color: KFitColors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  activeStatus: {
    color: KFitColors.accent,
  },
  inactiveStatus: {
    color: KFitColors.warning,
  },
  warningText: {
    color: KFitColors.warning,
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: KFitColors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  errorBox: {
    gap: Spacing.two,
  },
  messageText: {
    color: KFitColors.text,
    fontSize: 13,
    lineHeight: 19,
  },
});
