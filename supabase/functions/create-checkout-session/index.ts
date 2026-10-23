import { isRecord, parseFeeType, parsePhpAmount } from "../_shared/paymongo.ts";
import { getVerifiedClerkUserId } from "../_shared/clerk.ts";
import { createAdminClient } from "../_shared/server-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Subscription = {
  active: boolean;
  expires_at: string | null;
  cancelled_at: string | null;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Always return HTTP 200 for errors so supabase-js never wraps the response
// in FunctionsHttpError. This lets the frontend read data.error reliably on
// every JS runtime (including Hermes), without needing to parse error bodies.
function errorJson(message: string): Response {
  return jsonResponse({ success: false, error: message });
}

async function createCheckout(request: Request): Promise<Response> {
  const verifiedUserId = getVerifiedClerkUserId(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson("Request body must be valid JSON.");
  }

  const rawFeeType = isRecord(body)
    ? (body.plan_type ?? body.feeType)
    : null;
  const feeType = parseFeeType(rawFeeType);
  if (!feeType) {
    return errorJson("feeType must be app or gym.");
  }

  const bodyUserId = isRecord(body) && typeof body.user_id === "string"
    ? body.user_id.trim()
    : null;
  const userId = verifiedUserId || bodyUserId;
  if (!userId) {
    return errorJson("A signed-in session is required.");
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("Supabase server credentials are unavailable:", error);
    return errorJson("Payment service is not configured.");
  }

  const { data: user, error: userError } = await admin
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    console.error("Could not load checkout user role:", userError.message);
    return errorJson("Could not verify account access.");
  }
  if (!user) {
    return errorJson("Your account is not provisioned for subscriptions.");
  }
  if (
    (feeType === "gym" && user.role !== "member") ||
    (feeType === "app" && user.role !== "member" && user.role !== "coach")
  ) {
    return errorJson("This account cannot buy that plan.");
  }

  const subscriptionTable = feeType === "app"
    ? "subscriptions_app"
    : "subscriptions_gym";
  const { data: subscription, error: subscriptionError } = await admin
    .from(subscriptionTable)
    .select("active, expires_at, cancelled_at")
    .eq("user_id", userId)
    .maybeSingle<Subscription>();

  if (subscriptionError) {
    console.error(
      "Could not load checkout subscription:",
      subscriptionError.message,
    );
    return errorJson("Could not verify subscription status.");
  }
  if (!subscription) {
    return errorJson("Your subscription record is not provisioned.");
  }

  const expiresAt = subscription.expires_at
    ? Date.parse(subscription.expires_at)
    : Number.NaN;
  if (subscription.active && !Number.isFinite(expiresAt)) {
    return errorJson("Subscription status is incomplete. Contact your gym administrator.");
  }
  if (
    subscription.active &&
    subscription.cancelled_at !== null &&
    Number.isFinite(expiresAt) &&
    expiresAt > Date.now()
  ) {
    return errorJson("This canceled plan remains active until its paid-through date.");
  }

  const { data: plans, error: planError } = await admin
    .from("pricing_plans")
    .select(
      "id, plan_type, billing_amount_php, display_amount, display_currency",
    )
    .eq("plan_type", feeType)
    .eq("is_active", true)
    .limit(2);

  if (planError) {
    console.error("Could not load active checkout plan:", planError.message);
    return errorJson("Could not load the current plan price.");
  }
  if (!plans || plans.length !== 1) {
    return errorJson("This plan is currently unavailable for purchase.");
  }

  const plan = plans[0];
  const amountCentavos = parsePhpAmount(plan.billing_amount_php);
  if (
    typeof plan.id !== "string" ||
    plan.plan_type !== feeType ||
    amountCentavos === null
  ) {
    console.error("The active checkout plan contains invalid pricing data.");
    return errorJson("The current plan price is invalid.");
  }

  const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
  if (!secretKey?.startsWith("sk_test_")) {
    console.error("PAYMONGO_SECRET_KEY must be a rotated test-mode key.");
    return errorJson("Payment service is not configured for test mode.");
  }

  const title = feeType === "app"
    ? "K-Fit App Subscription"
    : "K-Fit Gym Membership";
  let paymongoResponse: Response;
  try {
    paymongoResponse = await fetch(
      "https://api.paymongo.com/v2/checkout_sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${secretKey}:`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            attributes: {
              send_email_receipt: true,
              line_items: [{
                name: title,
                amount: amountCentavos,
                currency: "PHP",
                quantity: 1,
              }],
              payment_method_types: ["card", "gcash", "paymaya", "qrph"],
              pass_on_fees: false,
              success_url: "k-fit://member-membership?payment=success",
              cancel_url: "k-fit://member-membership?payment=cancelled",
              reference_number: `KF-${feeType}-${crypto.randomUUID()}`,
              metadata: {
                user_id: userId,
                plan_type: feeType,
                kfit_user_id: userId,
                kfit_fee_type: feeType,
                kfit_pricing_plan_id: plan.id,
                kfit_amount_centavos: String(amountCentavos),
              },
            },
          },
        }),
      },
    );
  } catch (error) {
    console.error("PayMongo Checkout Session request failed:", error);
    return errorJson("Could not connect to PayMongo. Please try again.");
  }

  if (!paymongoResponse.ok) {
    let paymongoError = "PayMongo could not start checkout. Please try again.";
    try {
      const errBody: unknown = await paymongoResponse.json();
      console.error(
        "PayMongo rejected Checkout Session:",
        paymongoResponse.status,
        JSON.stringify(errBody),
      );
      // PayMongo error shape: { errors: [{ code, detail }] }
      if (
        isRecord(errBody) &&
        Array.isArray(errBody.errors) &&
        errBody.errors.length > 0 &&
        isRecord(errBody.errors[0]) &&
        typeof errBody.errors[0].detail === "string"
      ) {
        paymongoError = `PayMongo: ${errBody.errors[0].detail}`;
      }
    } catch {
      console.error(
        "PayMongo rejected Checkout Session:",
        paymongoResponse.status,
      );
    }
    return errorJson(paymongoError);
  }

  let payload: unknown;
  try {
    payload = await paymongoResponse.json();
  } catch {
    return errorJson("PayMongo returned an invalid checkout response.");
  }

  if (!isRecord(payload) || !isRecord(payload.data)) {
    return errorJson("PayMongo returned an invalid checkout response.");
  }

  const attributes = payload.data.attributes;
  const checkoutUrl = isRecord(attributes) ? attributes.checkout_url : null;
  const sessionId = payload.data.id;
  if (typeof checkoutUrl !== "string" || typeof sessionId !== "string") {
    return errorJson("PayMongo returned an incomplete checkout response.");
  }

  let parsedCheckoutUrl: URL;
  try {
    parsedCheckoutUrl = new URL(checkoutUrl);
  } catch {
    return errorJson("PayMongo returned an invalid checkout URL.");
  }
  if (
    parsedCheckoutUrl.protocol !== "https:" ||
    parsedCheckoutUrl.hostname !== "checkout.paymongo.com"
  ) {
    return errorJson("PayMongo returned an untrusted checkout URL.");
  }

  return jsonResponse({
    success: true,
    checkout_url: checkoutUrl,
    checkoutUrl,
    sessionId,
  });
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return errorJson("Method not allowed.");
  }

  return createCheckout(request);
}

Deno.serve((request) =>
  handleRequest(request).catch((error: unknown) => {
    console.error("Unexpected checkout function error:", error);
    return errorJson("Could not process checkout request.");
  })
);
