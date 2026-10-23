import {
  isRecord,
  parseWebhookPaidSession,
  verifyPayMongoSignature,
} from "../_shared/paymongo.ts";
import { createAdminClient } from "../_shared/server-client.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleWebhook(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const rawBody = await request.text();
  if (rawBody.length > 1_000_000) {
    return jsonResponse({ error: "Webhook payload is too large." }, 413);
  }

  const secret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET");
  if (secret) {
    const signature = request.headers.get("Paymongo-Signature") ??
      request.headers.get("paymongo-signature") ??
      request.headers.get("X-Paymongo-Signature");

    if (!signature) {
      console.error("Missing Paymongo-Signature header.");
      return jsonResponse({ error: "Missing Paymongo-Signature header in request." }, 400);
    }

    let signatureIsValid: boolean;
    try {
      signatureIsValid = await verifyPayMongoSignature(
        rawBody,
        signature,
        secret,
      );
    } catch (error) {
      console.error("PayMongo webhook signature verification error:", error);
      return jsonResponse({ error: "Could not verify webhook signature." }, 500);
    }

    if (!signatureIsValid) {
      console.error("Invalid PayMongo webhook signature received:", signature);
      return jsonResponse({ error: "Invalid webhook signature." }, 400);
    }
  } else {
    console.warn(
      "PAYMONGO_WEBHOOK_SECRET is not configured. Proceeding without signature check for testing.",
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Webhook payload must be valid JSON." }, 400);
  }

  const parsed = parseWebhookPaidSession(payload);
  if (!parsed) {
    // If this is another PayMongo event type or a generic test event without K-Fit metadata,
    // acknowledge with 200 so PayMongo marks the delivery as successful without retrying.
    if (isRecord(payload) && isRecord(payload.data)) {
      const eventType = isRecord(payload.data.attributes) &&
          typeof payload.data.attributes.type === "string"
        ? payload.data.attributes.type
        : payload.data.type;

      if (eventType === "checkout_session.payment.paid") {
        console.warn("Received paid checkout session without K-Fit metadata (likely a dashboard test event). Acknowledged.");
        return jsonResponse({
          received: true,
          ignored: true,
          reason: "Missing K-Fit user_id or plan_type metadata.",
        });
      }

      if (typeof eventType === "string") {
        return jsonResponse({ received: true, ignored: true, event_type: eventType });
      }
    }
    return jsonResponse(
      { error: "Webhook is not a valid paid checkout session." },
      400,
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("Supabase server credentials are unavailable:", error);
    return jsonResponse(
      { error: "Subscription updates are not configured." },
      500,
    );
  }

  // 1. Try atomic RPC apply_paid_subscription_checkout if pricing details are available
  if (parsed.pricingPlanId && parsed.amountCentavos) {
    const { data: rpcSuccess, error: rpcError } = await admin.rpc(
      "apply_paid_subscription_checkout",
      {
        p_checkout_session_id: parsed.sessionId,
        p_user_id: parsed.userId,
        p_pricing_plan_id: parsed.pricingPlanId,
        p_plan_type: parsed.planType,
        p_paid_amount_centavos: parsed.amountCentavos,
        p_paid_at: parsed.paidAt,
      },
    );

    if (!rpcError && typeof rpcSuccess === "boolean") {
      return jsonResponse({
        received: true,
        success: true,
        method: "rpc",
        duplicate: !rpcSuccess,
        plan_type: parsed.planType,
        user_id: parsed.userId,
      });
    }

    if (rpcError) {
      console.warn("RPC apply_paid_subscription_checkout warning:", rpcError.message);
    }
  }

  // 2. Direct table update fallback
  const subscriptionTable = parsed.planType === "app"
    ? "subscriptions_app"
    : "subscriptions_gym";

  const { data: existingSub, error: selectErr } = await admin
    .from(subscriptionTable)
    .select("id, active, expires_at")
    .eq("user_id", parsed.userId)
    .maybeSingle();

  if (selectErr) {
    console.error("Could not fetch current subscription:", selectErr.message);
  }

  const now = new Date();
  let baseTimestamp = now.getTime();
  if (existingSub?.expires_at) {
    const currentExpiry = new Date(existingSub.expires_at).getTime();
    if (currentExpiry > baseTimestamp) {
      baseTimestamp = currentExpiry;
    }
  }
  const newExpiresAt = new Date(baseTimestamp + 30 * 24 * 60 * 60 * 1000).toISOString();

  let updateError = null;
  if (existingSub) {
    const { error } = await admin
      .from(subscriptionTable)
      .update({
        active: true,
        expires_at: newExpiresAt,
        cancelled_at: null,
      })
      .eq("user_id", parsed.userId);
    updateError = error;
  } else {
    const { error } = await admin
      .from(subscriptionTable)
      .insert({
        user_id: parsed.userId,
        active: true,
        expires_at: newExpiresAt,
        cancelled_at: null,
      });
    updateError = error;
  }

  if (updateError) {
    console.error("Failed to fulfill subscription in database:", updateError.message);
    return jsonResponse(
      { error: "Could not activate subscription in database." },
      500,
    );
  }

  // Idempotently record payment if active pricing plan exists
  if (parsed.sessionId) {
    const { data: plan } = await admin
      .from("pricing_plans")
      .select("id, billing_amount_php")
      .eq("plan_type", parsed.planType)
      .eq("is_active", true)
      .maybeSingle();

    if (plan) {
      const planId = parsed.pricingPlanId || plan.id;
      const amountCentavos = parsed.amountCentavos ||
        Math.round(Number(plan.billing_amount_php) * 100);

      try {
        await admin.from("subscription_payments").insert({
          checkout_session_id: parsed.sessionId,
          user_id: parsed.userId,
          pricing_plan_id: planId,
          plan_type: parsed.planType,
          paid_amount_centavos: amountCentavos,
          paid_at: parsed.paidAt,
        });
      } catch {
        // Payment record already exists or duplicate session; ignore
      }
    }
  }

  return jsonResponse({
    received: true,
    success: true,
    method: "direct",
    plan_type: parsed.planType,
    user_id: parsed.userId,
    expires_at: newExpiresAt,
  });
}

Deno.serve((request) =>
  handleWebhook(request).catch((error: unknown) => {
    console.error("Unexpected PayMongo webhook error:", error);
    return jsonResponse({ error: "Could not process webhook." }, 500);
  })
);

