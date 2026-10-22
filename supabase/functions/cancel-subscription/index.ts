import { getVerifiedClerkUserId } from "../_shared/clerk.ts";
import { isRecord, parseFeeType } from "../_shared/paymongo.ts";
import { createAdminClient } from "../_shared/server-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

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
    return jsonResponse({ error: "Cancellation is not configured." }, 500);
  }

  const { data, error } = await admin.rpc("cancel_subscription_period", {
    p_user_id: userId,
    p_plan_type: feeType,
  });

  if (error) {
    console.error("Could not cancel subscription period:", error.message);
    const status = error.message.includes("role_not_allowed")
      ? 403
      : error.message.includes("subscription_not_active")
      ? 409
      : error.message.includes("user_not_found")
      ? 404
      : 500;
    return jsonResponse(
      { error: "Could not cancel this subscription." },
      status,
    );
  }

  if (!Array.isArray(data) || data.length !== 1 || !isRecord(data[0])) {
    console.error("Cancellation RPC returned an invalid result.");
    return jsonResponse(
      { error: "Could not confirm subscription cancellation." },
      500,
    );
  }

  const cancelledAt = data[0].cancelled_at;
  const expiresAt = data[0].expires_at;
  if (
    typeof cancelledAt !== "string" ||
    typeof expiresAt !== "string" ||
    !Number.isFinite(Date.parse(cancelledAt)) ||
    !Number.isFinite(Date.parse(expiresAt))
  ) {
    console.error("Cancellation RPC returned invalid subscription dates.");
    return jsonResponse(
      { error: "Could not confirm subscription cancellation." },
      500,
    );
  }

  return jsonResponse({ cancelledAt, expiresAt });
}

Deno.serve((request) =>
  handleRequest(request).catch((error: unknown) => {
    console.error("Unexpected cancellation function error:", error);
    return jsonResponse(
      { error: "Could not process subscription cancellation." },
      500,
    );
  })
);
