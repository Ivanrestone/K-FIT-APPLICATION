import {
  isRecord,
  parsePaidCheckoutEvent,
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

  const secret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET");
  if (!secret) {
    console.error("PAYMONGO_WEBHOOK_SECRET is not configured.");
    return jsonResponse({ error: "Webhook is not configured." }, 500);
  }

  const rawBody = await request.text();
  if (rawBody.length > 1_000_000) {
    return jsonResponse({ error: "Webhook payload is too large." }, 413);
  }

  let signatureIsValid: boolean;
  try {
    signatureIsValid = await verifyPayMongoSignature(
      rawBody,
      request.headers.get("Paymongo-Signature") ??
        request.headers.get("X-Paymongo-Signature"),
      secret,
    );
  } catch (error) {
    console.error("PayMongo webhook signature verification failed:", error);
    return jsonResponse({ error: "Could not verify webhook signature." }, 500);
  }
  if (!signatureIsValid) {
    return jsonResponse({ error: "Invalid webhook signature." }, 400);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Webhook payload must be valid JSON." }, 400);
  }

  if (
    isRecord(payload) &&
    isRecord(payload.data) &&
    typeof payload.data.type === "string" &&
    payload.data.type !== "checkout_session.payment.paid"
  ) {
    return jsonResponse({ received: true, ignored: true });
  }

  const paidCheckout = parsePaidCheckoutEvent(payload);
  if (!paidCheckout) {
    return jsonResponse(
      { error: "Webhook is not a valid paid test checkout." },
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

  const { data, error } = await admin.rpc(
    "apply_paid_subscription_checkout",
    {
      p_checkout_session_id: paidCheckout.sessionId,
      p_user_id: paidCheckout.userId,
      p_pricing_plan_id: paidCheckout.pricingPlanId,
      p_plan_type: paidCheckout.feeType,
      p_paid_amount_centavos: paidCheckout.amountCentavos,
      p_paid_at: paidCheckout.paidAt,
    },
  );

  if (error) {
    console.error("Could not apply confirmed PayMongo payment:", error.message);
    const status = error.message.includes("plan_amount_mismatch") ||
        error.message.includes("role_not_allowed") ||
        error.message.includes("invalid_payment") ||
        error.message.includes("checkout_session_conflict")
      ? 400
      : 500;
    return jsonResponse(
      { error: "Could not apply subscription payment." },
      status,
    );
  }

  if (typeof data !== "boolean") {
    console.error("Payment RPC returned an invalid result.");
    return jsonResponse(
      { error: "Could not confirm subscription payment." },
      500,
    );
  }

  return jsonResponse({ received: true, duplicate: !data });
}

Deno.serve((request) =>
  handleWebhook(request).catch((error: unknown) => {
    console.error("Unexpected PayMongo webhook error:", error);
    return jsonResponse({ error: "Could not process webhook." }, 500);
  })
);
