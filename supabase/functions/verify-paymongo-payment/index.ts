import {
  isRecord,
  parseFeeType,
  parseWebhookPaidSession,
  verifyPayMongoSignature,
} from "../_shared/paymongo.ts";
import { createAdminClient } from "../_shared/server-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, paymongo-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SESSION_ID_PATTERN = /^cs_[A-Za-z0-9_]+$/;
const UUID_PATTERN =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type PlanType = "app" | "gym";

type AdminClient = ReturnType<typeof createAdminClient>;

type CheckoutSessionState = {
  sessionId: string;
  status: string;
  paid: boolean;
  userId: string | null;
  planType: PlanType | null;
  pricingPlanId: string | null;
  amountCentavos: number | null;
  paidAt: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Always answer HTTP 200 so the app can read `success` / `paid` directly
// instead of decoding a FunctionsHttpError wrapper on Hermes.
function errorJson(message: string): Response {
  return jsonResponse({ success: false, paid: false, error: message });
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && /^[1-9]\d*$/.test(value)) {
    return Number(value);
  }
  return null;
}

function subscriptionTableFor(planType: PlanType): string {
  return planType === "app" ? "subscriptions_app" : "subscriptions_gym";
}

async function fetchCheckoutSession(
  sessionId: string,
  secretKey: string,
): Promise<{ payload: unknown } | { error: string }> {
  const authorization = `Basic ${btoa(`${secretKey}:`)}`;

  // Checkout sessions are created through v2; reads are documented on v1. Try
  // v1 first and fall back to v2 so both console generations resolve.
  for (const version of ["v1", "v2"]) {
    let response: Response;
    try {
      response = await fetch(
        `https://api.paymongo.com/${version}/checkout_sessions/${sessionId}`,
        {
          method: "GET",
          headers: {
            Authorization: authorization,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(15_000),
        },
      );
    } catch (error) {
      console.error("PayMongo checkout session lookup failed:", error);
      return { error: "Could not reach PayMongo. Please try again." };
    }

    if (response.status === 404) {
      continue;
    }

    if (!response.ok) {
      let detail = "";
      try {
        const body: unknown = await response.json();
        if (isRecord(body) && Array.isArray(body.errors) && body.errors.length > 0) {
          const first = body.errors[0];
          if (isRecord(first) && typeof first.detail === "string") {
            detail = first.detail;
          }
        }
      } catch {
        // Keep the generic message.
      }
      console.error(
        "PayMongo rejected checkout session lookup:",
        response.status,
        detail,
      );
      return { error: "PayMongo could not verify this checkout session." };
    }

    try {
      return { payload: await response.json() };
    } catch {
      return { error: "PayMongo returned an invalid checkout response." };
    }
  }

  return { error: "This checkout session no longer exists." };
}

function parseCheckoutSession(
  payload: unknown,
  fallbackSessionId: string,
): CheckoutSessionState | null {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return null;
  }

  const data = payload.data;
  const attributes = isRecord(data.attributes) ? data.attributes : {};
  const sessionId = typeof data.id === "string" && data.id.length > 0
    ? data.id
    : fallbackSessionId;

  const metadata = isRecord(attributes.metadata) ? attributes.metadata : {};
  const rawUserId = metadata.user_id ?? metadata.kfit_user_id;
  const userId = typeof rawUserId === "string" && rawUserId.trim().length > 0
    ? rawUserId.trim()
    : null;
  const planType = parseFeeType(metadata.plan_type ?? metadata.kfit_fee_type);

  const rawPlanId = metadata.kfit_pricing_plan_id;
  const pricingPlanId = typeof rawPlanId === "string" && UUID_PATTERN.test(rawPlanId)
    ? rawPlanId
    : null;

  let amountCentavos = parseAmount(metadata.kfit_amount_centavos);
  let paidAtSeconds: number | null = null;
  let paymentSettled = false;

  const rawPayments = Array.isArray(attributes.payments)
    ? attributes.payments
    : isRecord(attributes.payments) && Array.isArray(attributes.payments.data)
      ? attributes.payments.data
      : [];

  for (const payment of rawPayments) {
    if (!isRecord(payment) || !isRecord(payment.attributes)) {
      continue;
    }
    const paymentAttributes = payment.attributes;
    if (amountCentavos === null) {
      amountCentavos = parseAmount(paymentAttributes.amount);
    }
    const paymentStatus = typeof paymentAttributes.status === "string"
      ? paymentAttributes.status.toLowerCase()
      : "";
    const paidAt = paymentAttributes.paid_at;
    if (
      paymentStatus === "paid" ||
      paymentStatus === "succeeded" ||
      (typeof paidAt === "number" && paidAt > 0)
    ) {
      paymentSettled = true;
    }
    if (
      paidAtSeconds === null &&
      typeof paidAt === "number" &&
      Number.isSafeInteger(paidAt) &&
      paidAt > 0
    ) {
      paidAtSeconds = paidAt;
    }
  }

  const intentAttributes = isRecord(attributes.payment_intent) &&
      isRecord(attributes.payment_intent.attributes)
    ? attributes.payment_intent.attributes
    : {};
  const intentStatus = typeof intentAttributes.status === "string"
    ? intentAttributes.status.toLowerCase()
    : "";

  const status = typeof attributes.status === "string"
    ? attributes.status.toLowerCase()
    : "unknown";
  const paid = status === "paid" ||
    status === "succeeded" ||
    paymentSettled ||
    intentStatus === "paid" ||
    intentStatus === "succeeded";

  // The fulfillment RPC rejects a paid timestamp in the future, so clamp a
  // slightly fast PayMongo clock to now.
  const nowSeconds = Math.floor(Date.now() / 1000);
  const paidAt = new Date(
    Math.min(paidAtSeconds ?? nowSeconds, nowSeconds) * 1000,
  ).toISOString();

  return {
    sessionId,
    status,
    paid,
    userId,
    planType,
    pricingPlanId,
    amountCentavos,
    paidAt,
  };
}

async function readExpiry(
  admin: AdminClient,
  userId: string,
  planType: PlanType,
): Promise<string | null> {
  const { data, error } = await admin
    .from(subscriptionTableFor(planType))
    .select("expires_at")
    .eq("user_id", userId)
    .maybeSingle<{ expires_at: string | null }>();

  if (error) {
    console.warn("Could not read the updated subscription expiry:", error.message);
    return null;
  }
  return data?.expires_at ?? null;
}

async function hasPaymentRecord(
  admin: AdminClient,
  sessionId: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("subscription_payments")
    .select("id")
    .eq("checkout_session_id", sessionId)
    .maybeSingle<{ id: string }>();

  if (error) {
    console.warn("Could not check the payment ledger:", error.message);
    return false;
  }
  return Boolean(data);
}

// Direct table fallback: the same 30-day extension the webhook applies when the
// atomic RPC is unavailable. Duplicate sessions never extend twice because the
// payment ledger is checked first.
async function applyFallbackExtension(
  admin: AdminClient,
  session: CheckoutSessionState & { userId: string; planType: PlanType },
): Promise<{ expiresAt: string | null; duplicate: boolean }> {
  if (await hasPaymentRecord(admin, session.sessionId)) {
    return {
      expiresAt: await readExpiry(admin, session.userId, session.planType),
      duplicate: true,
    };
  }

  const table = subscriptionTableFor(session.planType);
  const { data: existing, error: selectError } = await admin
    .from(table)
    .select("expires_at")
    .eq("user_id", session.userId)
    .maybeSingle<{ expires_at: string | null }>();

  if (selectError) {
    throw new Error(selectError.message);
  }
  if (!existing) {
    throw new Error("subscription_not_provisioned");
  }

  const now = Date.now();
  const currentExpiry = existing.expires_at
    ? Date.parse(existing.expires_at)
    : Number.NaN;
  const base = Number.isFinite(currentExpiry) && currentExpiry > now
    ? currentExpiry
    : now;
  const expiresAt = new Date(base + THIRTY_DAYS_MS).toISOString();

  const { error: updateError } = await admin
    .from(table)
    .update({ active: true, expires_at: expiresAt, cancelled_at: null })
    .eq("user_id", session.userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { data: plan } = await admin
    .from("pricing_plans")
    .select("id, billing_amount_php")
    .eq("plan_type", session.planType)
    .eq("is_active", true)
    .maybeSingle<{ id: string; billing_amount_php: string | number }>();

  const pricingPlanId = session.pricingPlanId ?? plan?.id ?? null;
  const amountCentavos = session.amountCentavos ??
    (plan ? Math.round(Number(plan.billing_amount_php) * 100) : null);

  if (pricingPlanId && amountCentavos) {
    const { error: insertError } = await admin
      .from("subscription_payments")
      .insert({
        checkout_session_id: session.sessionId,
        user_id: session.userId,
        pricing_plan_id: pricingPlanId,
        plan_type: session.planType,
        paid_amount_centavos: amountCentavos,
        paid_at: session.paidAt,
      });

    // A concurrent delivery may have written the ledger row first.
    if (insertError && insertError.code !== "23505") {
      console.warn("Could not record the verified payment:", insertError.message);
    }
  }

  return { expiresAt, duplicate: false };
}

async function fulfillPaidSession(
  session: CheckoutSessionState & { userId: string; planType: PlanType },
): Promise<{
  success: boolean;
  duplicate: boolean;
  expiresAt: string | null;
  error?: string;
}> {
  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("Supabase server credentials are unavailable:", error);
    return {
      success: false,
      duplicate: false,
      expiresAt: null,
      error: "Subscription updates are not configured.",
    };
  }

  if (session.pricingPlanId && session.amountCentavos) {
    const { data: applied, error } = await admin.rpc(
      "apply_paid_subscription_checkout",
      {
        p_checkout_session_id: session.sessionId,
        p_user_id: session.userId,
        p_pricing_plan_id: session.pricingPlanId,
        p_plan_type: session.planType,
        p_paid_amount_centavos: session.amountCentavos,
        p_paid_at: session.paidAt,
      },
    );

    if (!error && typeof applied === "boolean") {
      return {
        success: true,
        duplicate: !applied,
        expiresAt: await readExpiry(admin, session.userId, session.planType),
      };
    }

    if (error) {
      console.warn(
        "apply_paid_subscription_checkout failed, using direct update:",
        error.message,
      );
    }
  }

  try {
    const fallback = await applyFallbackExtension(admin, session);
    return { success: true, ...fallback };
  } catch (error) {
    console.error(
      "Could not activate the verified subscription:",
      error instanceof Error ? error.message : error,
    );
    return {
      success: false,
      duplicate: false,
      expiresAt: null,
      error: "Could not activate the subscription.",
    };
  }
}

async function verifySession(
  checkoutSessionId: string,
  requestedUserId: string,
): Promise<Response> {
  const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
  if (!secretKey) {
    console.error("PAYMONGO_SECRET_KEY is not configured.");
    return errorJson("Payment service is not configured.");
  }

  const lookup = await fetchCheckoutSession(checkoutSessionId, secretKey);
  if ("error" in lookup) {
    return errorJson(lookup.error);
  }

  const session = parseCheckoutSession(lookup.payload, checkoutSessionId);
  if (!session) {
    return errorJson("PayMongo returned an invalid checkout response.");
  }

  if (!session.userId || !session.planType) {
    return errorJson("This checkout session is missing K-Fit payment details.");
  }

  if (session.userId !== requestedUserId) {
    return errorJson("This checkout session belongs to a different account.");
  }

  if (!session.paid) {
    return jsonResponse({
      success: true,
      paid: false,
      status: session.status,
      session_id: session.sessionId,
      plan_type: session.planType,
      message: "PayMongo has not confirmed this payment yet.",
    });
  }

  const result = await fulfillPaidSession({
    ...session,
    userId: session.userId,
    planType: session.planType,
  });

  if (!result.success) {
    return errorJson(result.error ?? "Could not activate the subscription.");
  }

  return jsonResponse({
    success: true,
    paid: true,
    status: "paid",
    session_id: session.sessionId,
    user_id: session.userId,
    plan_type: session.planType,
    planType: session.planType,
    expires_at: result.expiresAt,
    duplicate: result.duplicate,
  });
}

// Optional webhook entrypoint: PayMongo can also be pointed at this function.
// Without a configured secret the event is refused instead of trusted.
async function handleWebhookEvent(
  request: Request,
  rawBody: string,
  payload: unknown,
): Promise<Response> {
  const secret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET");
  if (!secret) {
    console.error(
      "Rejected a webhook payload because PAYMONGO_WEBHOOK_SECRET is not configured.",
    );
    return errorJson("Webhook signature verification is not configured.");
  }

  const signature = request.headers.get("Paymongo-Signature") ??
    request.headers.get("paymongo-signature") ??
    request.headers.get("X-Paymongo-Signature");

  if (!signature) {
    return errorJson("Missing Paymongo-Signature header.");
  }

  let signatureIsValid: boolean;
  try {
    signatureIsValid = await verifyPayMongoSignature(rawBody, signature, secret);
  } catch (error) {
    console.error("Could not verify the webhook signature:", error);
    return errorJson("Could not verify the webhook signature.");
  }
  if (!signatureIsValid) {
    return errorJson("Invalid webhook signature.");
  }

  const parsed = parseWebhookPaidSession(payload);
  if (!parsed) {
    // Acknowledge unrelated events so PayMongo does not retry them.
    return jsonResponse({ received: true, ignored: true });
  }

  if (!parsed.pricingPlanId || !parsed.amountCentavos) {
    return errorJson("The paid event is missing pricing details.");
  }

  const result = await fulfillPaidSession({
    sessionId: parsed.sessionId,
    status: "paid",
    paid: true,
    userId: parsed.userId,
    planType: parsed.planType,
    pricingPlanId: parsed.pricingPlanId,
    amountCentavos: parsed.amountCentavos,
    paidAt: parsed.paidAt,
  });

  if (!result.success) {
    return errorJson(result.error ?? "Could not activate the subscription.");
  }

  return jsonResponse({
    received: true,
    success: true,
    paid: true,
    plan_type: parsed.planType,
    user_id: parsed.userId,
    expires_at: result.expiresAt,
    duplicate: result.duplicate,
  });
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return errorJson("Method not allowed.");
  }

  const rawBody = await request.text();
  if (rawBody.length > 100_000) {
    return errorJson("Request body is too large.");
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return errorJson("Request body must be valid JSON.");
  }

  if (!isRecord(body)) {
    return errorJson("Request body must be a JSON object.");
  }

  // PayMongo event envelope: { data: { attributes: { type, data } } }
  if (isRecord(body.data)) {
    return await handleWebhookEvent(request, rawBody, body);
  }

  const rawSessionId = body.checkout_session_id ?? body.session_id ??
    body.sessionId;
  const checkoutSessionId = typeof rawSessionId === "string"
    ? rawSessionId.trim()
    : "";
  if (!SESSION_ID_PATTERN.test(checkoutSessionId)) {
    return errorJson("checkout_session_id must be a PayMongo checkout session id.");
  }

  const rawUserId = body.user_id;
  const requestedUserId = typeof rawUserId === "string" ? rawUserId.trim() : "";
  if (!requestedUserId) {
    return errorJson("user_id is required.");
  }

  return await verifySession(checkoutSessionId, requestedUserId);
}

Deno.serve((request) =>
  handleRequest(request).catch((error: unknown) => {
    console.error("Unexpected PayMongo verification error:", error);
    return errorJson("Could not verify the payment.");
  })
);
