/**
 * dev-activate-subscription — TEST/DEV ONLY
 *
 * Immediately sets `active = true` and extends `expires_at` by 30 days on the
 * caller's `subscriptions_app` and / or `subscriptions_gym` rows so that the
 * UI can be verified end-to-end without waiting for a real PayMongo webhook.
 *
 * This function MUST NOT be deployed to production. It is intentionally
 * blocked when `SUPABASE_ENV` is set to `"production"`.
 *
 * Request body (JSON):
 *   { plan_type: "app" | "gym" | "both" }   — defaults to "both"
 *
 * Authentication: Clerk session token (Authorization: Bearer <token>)
 */
import { verifyClerkToken } from "../_shared/attendance-auth.ts";
import { createAdminClient } from "../_shared/server-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  // ── Safety gate ───────────────────────────────────────────────────────────
  // Block this endpoint in production so it can never be used to bypass payments.
  const env = Deno.env.get("SUPABASE_ENV") ?? "";
  if (env === "production") {
    return json(
      { error: "This endpoint is not available in production." },
      403,
    );
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = await verifyClerkToken(request);
  if (!auth.userId) {
    return json({ error: auth.error ?? "Authentication failed." }, 401);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine — we default to "both"
  }

  const rawPlanType = isRecord(body) ? body.plan_type : undefined;
  const planType: "app" | "gym" | "both" =
    rawPlanType === "app" || rawPlanType === "gym" ? rawPlanType : "both";

  // ── Admin client ──────────────────────────────────────────────────────────
  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("Admin client unavailable:", error);
    return json({ error: "Service is not configured." }, 503);
  }

  const userId = auth.userId;
  const newExpiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const tables: Array<"subscriptions_app" | "subscriptions_gym"> = [];
  if (planType === "app" || planType === "both") tables.push("subscriptions_app");
  if (planType === "gym" || planType === "both") tables.push("subscriptions_gym");

  const results: Record<string, { ok: boolean; error?: string }> = {};

  for (const table of tables) {
    // Check if the row already exists
    const { data: existing, error: selectErr } = await admin
      .from(table)
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (selectErr) {
      results[table] = { ok: false, error: selectErr.message };
      continue;
    }

    if (existing) {
      const { error: updateErr } = await admin
        .from(table)
        .update({ active: true, expires_at: newExpiresAt, cancelled_at: null })
        .eq("user_id", userId);
      results[table] = updateErr
        ? { ok: false, error: updateErr.message }
        : { ok: true };
    } else {
      const { error: insertErr } = await admin
        .from(table)
        .insert({ user_id: userId, active: true, expires_at: newExpiresAt, cancelled_at: null });
      results[table] = insertErr
        ? { ok: false, error: insertErr.message }
        : { ok: true };
    }
  }

  // Also attempt updating public.subscriptions if present
  try {
    const { error: subErr } = await admin
      .from("subscriptions")
      .upsert({
        user_id: userId,
        status: "active",
        app_subscription_status: "active",
        gym_membership_status: "active",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    if (subErr) {
      console.warn("Notice: public.subscriptions upsert note:", subErr.message);
    }
  } catch (err) {
    console.warn("Notice: public.subscriptions table optional:", err);
  }

  const anyFailed = Object.values(results).some((r) => !r.ok);
  return json({
    success: !anyFailed,
    userId,
    plan_type: planType,
    expires_at: newExpiresAt,
    results,
  });
});

