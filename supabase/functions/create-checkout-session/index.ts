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

async function createCheckout(request: Request): Promise<Response> {
  const userId = getVerifiedClerkUserId(request);
  if (!userId) {
    return jsonResponse({ error: "A signed-in session is required." }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const feeType = isRecord(body) ? parseFeeType(body.feeType) : null;
  if (!feeType) {
    return jsonResponse({ error: "feeType must be app or gym." }, 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("Supabase server credentials are unavailable:", error);
    return jsonResponse({ error: "Payment service is not configured." }, 500);
  }

  const { data: user, error: userError } = await admin
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    console.error("Could not load checkout user role:", userError.message);
    return jsonResponse({ error: "Could not verify account access." }, 500);
  }
  if (!user) {
    return jsonResponse({
      error: "Your account is not provisioned for subscriptions.",
    }, 404);
  }
  if (
    (feeType === "gym" && user.role !== "member") ||
    (feeType === "app" && user.role !== "member" && user.role !== "coach")
  ) {
    return jsonResponse({ error: "This account cannot buy that plan." }, 403);
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
    return jsonResponse(
      { error: "Could not verify subscription status." },
      500,
    );
  }
  if (!subscription) {
    return jsonResponse({
      error: "Your subscription record is not provisioned.",
    }, 404);
  }

  const expiresAt = subscription.expires_at
    ? Date.parse(subscription.expires_at)
    : Number.NaN;
  if (subscription.active && !Number.isFinite(expiresAt)) {
    return jsonResponse({
      error:
        "Subscription status is incomplete. Contact your gym administrator.",
    }, 409);
  }
  if (
    subscription.active &&
    subscription.cancelled_at !== null &&
    Number.isFinite(expiresAt) &&
    expiresAt > Date.now()
  ) {
    return jsonResponse({
      error: "This canceled plan remains active until its paid-through date.",
    }, 409);
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
    return jsonResponse(
      { error: "Could not load the current plan price." },
      500,
    );
  }
  if (!plans || plans.length !== 1) {
    return jsonResponse({
      error: "This plan is currently unavailable for purchase.",
    }, 409);
  }

  const plan = plans[0];
  const amountCentavos = parsePhpAmount(plan.billing_amount_php);
  if (
    typeof plan.id !== "string" ||
    plan.plan_type !== feeType ||
    amountCentavos === null
  ) {
    console.error("The active checkout plan contains invalid pricing data.");
    return jsonResponse({ error: "The current plan price is invalid." }, 500);
  }

  const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
  if (!secretKey?.startsWith("sk_test_")) {
    console.error("PAYMONGO_SECRET_KEY must be a rotated test-mode key.");
    return jsonResponse({
      error: "Payment service is not configured for test mode.",
    }, 500);
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
              line_items: [{
                name: title,
                amount: amountCentavos,
                currency: "PHP",
                quantity: 1,
              }],
              payment_method_types: ["card", "gcash", "qrph"],
              pass_on_fees: false,
              success_url: "k-fit://member-membership?payment=success",
              cancel_url: "k-fit://member-membership?payment=cancelled",
              reference_number: `KF-${feeType}-${crypto.randomUUID()}`,
              metadata: {
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
    return jsonResponse({
      error: "Could not connect to PayMongo. Please try again.",
    }, 502);
  }

  if (!paymongoResponse.ok) {
    console.error(
      "PayMongo rejected Checkout Session request:",
      paymongoResponse.status,
    );
    return jsonResponse({
      error: "PayMongo could not start checkout. Please try again.",
    }, 502);
  }

  let payload: unknown;
  try {
    payload = await paymongoResponse.json();
  } catch {
    return jsonResponse({
      error: "PayMongo returned an invalid checkout response.",
    }, 502);
  }

  if (!isRecord(payload) || !isRecord(payload.data)) {
    return jsonResponse({
      error: "PayMongo returned an invalid checkout response.",
    }, 502);
  }

  const attributes = payload.data.attributes;
  const checkoutUrl = isRecord(attributes) ? attributes.checkout_url : null;
  const sessionId = payload.data.id;
  if (typeof checkoutUrl !== "string" || typeof sessionId !== "string") {
    return jsonResponse({
      error: "PayMongo returned an incomplete checkout response.",
    }, 502);
  }

  let parsedCheckoutUrl: URL;
  try {
    parsedCheckoutUrl = new URL(checkoutUrl);
  } catch {
    return jsonResponse(
      { error: "PayMongo returned an invalid checkout URL." },
      502,
    );
  }
  if (
    parsedCheckoutUrl.protocol !== "https:" ||
    parsedCheckoutUrl.hostname !== "checkout.paymongo.com"
  ) {
    return jsonResponse({
      error: "PayMongo returned an untrusted checkout URL.",
    }, 502);
  }

  return jsonResponse({ checkoutUrl, sessionId });
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  return createCheckout(request);
}

Deno.serve((request) =>
  handleRequest(request).catch((error: unknown) => {
    console.error("Unexpected checkout function error:", error);
    return jsonResponse({ error: "Could not process checkout request." }, 500);
  })
);
