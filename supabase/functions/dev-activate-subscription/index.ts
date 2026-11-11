/**
 * dev-activate-subscription — TEST/DEV ONLY
 *
 * Immediately sets `active = true` and extends `expires_at` by 30 days on the
 * caller's `subscriptions_app` and / or `subscriptions_gym` rows so the UI can
 * be verified end-to-end without waiting for a real PayMongo webhook. The
 * legacy `public.subscriptions` table is updated too when it exists.
 *
 * This function MUST NOT be deployed to production. It is intentionally
 * blocked when `SUPABASE_ENV` is set to `"production"`.
 *
 * Request body (JSON):
 *   {
 *     user_id?: string,
 *     plan_type?: "app" | "gym" | "both" | "all_access",
 *     action?: "activate" | "reset"
 *   }
 *   - `all_access` (and any unrecognised value) activates both plans.
 *   - `action: "reset"` does the opposite: both plans become `active = false`
 *     with `expires_at` one day in the past, so the UI falls back to Inactive.
 *   - `user_id` is only used when the request carries no verifiable session.
 *
 * Authentication, in order:
 *   1. Default Clerk session token, verified against Clerk's JWKS.
 *   2. Clerk `supabase` JWT template token (HS256): `sub` is read from the
 *      payload and PostgREST verifies the signature with the project key.
 *   3. `user_id` from the body, so a dev build whose token cannot be verified
 *      can still activate a plan. This path trusts the caller: anyone who can
 *      reach this URL can activate any account while SUPABASE_ENV is unset.
 *
 * Deployed with `verify_jwt = false` (see supabase/config.toml); otherwise the
 * Supabase gateway rejects Clerk's tokens with `UNAUTHORIZED_NO_AUTH_HEADER`.
 *
 * Success response (HTTP 200):
 *   { success: true, user_id: "<id>", status: "active" | "inactive" }
 */
import { verifyClerkToken } from "../_shared/attendance-auth.ts";
import { createAdminClient } from "../_shared/server-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Both plans, whichever alias the caller uses.
type PlanType = "app" | "gym" | "both";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function bearerToken(request: Request): string {
  const match = /^Bearer\s+([A-Za-z0-9._-]+)$/i.exec(
    request.headers.get("authorization") ?? "",
  );
  return match ? match[1] : "";
}

function normalizePlanType(value: unknown): PlanType {
  if (value === "app" || value === "gym") {
    return value;
  }
  // "both", "all_access", and anything unrecognised unlock everything.
  return "both";
}

// Reads `sub` from the JWT payload without trusting it yet. The signature is
// checked afterwards by PostgREST, which holds the project's signing key.
function unverifiedSubject(token: string): string {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return "";
    }
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(
      normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="),
    );
    const bytes = Uint8Array.from(
      binary,
      (character) => character.charCodeAt(0),
    );
    const claims: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!isRecord(claims) || typeof claims.sub !== "string") {
      return "";
    }
    if (typeof claims.exp === "number" && claims.exp * 1000 <= Date.now()) {
      return "";
    }
    return claims.sub.trim();
  } catch {
    return "";
  }
}

// The Clerk `supabase` JWT template is HS256, so Clerk's JWKS cannot verify it.
// PostgREST can: it holds the project's signing key and answers 401 for a token
// it cannot verify. A 200 therefore proves the signature, and the identity is
// the `sub` PostgREST just accepted — never a row it happened to return, since
// row-level security on `users` is not relied on here. The request carries the
// project's anon key, never the service role.
async function resolveUserIdViaPostgrest(
  request: Request,
): Promise<string> {
  const token = bearerToken(request);
  const subject = unverifiedSubject(token);
  const url = Deno.env.get("SUPABASE_URL");
  const apiKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!token || !subject || !url || !apiKey) {
    return "";
  }

  try {
    const response = await fetch(
      `${url}/rest/v1/users?select=id&id=eq.${encodeURIComponent(subject)}&limit=1`,
      {
        headers: {
          apikey: apiKey,
          authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      },
    );
    if (!response.ok) {
      return "";
    }

    await response.body?.cancel();
    return subject;
  } catch (error) {
    console.error("PostgREST token verification failed:", error);
    return "";
  }
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
      { success: false, error: "This endpoint is not available in production." },
      403,
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine — we default to "all access"
  }

  const rawPlanType = isRecord(body) ? body.plan_type : undefined;
  const planType = normalizePlanType(rawPlanType);
  const action = isRecord(body) && body.action === "reset"
    ? "reset"
    : "activate";
  const bodyUserId = isRecord(body) && typeof body.user_id === "string"
    ? body.user_id.trim()
    : "";

  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = await verifyClerkToken(request);
  let userId = auth.userId || await resolveUserIdViaPostgrest(request);
  if (!userId && bodyUserId) {
    // Dev builds can hand us the member id directly when their token cannot be
    // verified. Only safe because this endpoint is dev-only (see header).
    console.warn(
      "dev-activate-subscription: activating from request body without a verified session:",
      bodyUserId,
    );
    userId = bodyUserId;
  }
  if (!userId) {
    return json(
      { success: false, error: auth.error ?? "Authentication failed." },
      401,
    );
  }

  // ── Admin client ──────────────────────────────────────────────────────────
  // Service role: bypasses RLS so the subscription rows can always be written.
  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("Admin client unavailable:", error);
    return json(
      { success: false, error: "Service is not configured." },
      503,
    );
  }

  const now = Date.now();
  const newExpiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();

  const planTables: Array<"subscriptions_app" | "subscriptions_gym"> = [];
  if (planType === "app" || planType === "both") {
    planTables.push("subscriptions_app");
  }
  if (planType === "gym" || planType === "both") {
    planTables.push("subscriptions_gym");
  }

  // Reset always expires both plans, whatever plan_type was sent.
  const tables: Array<"subscriptions_app" | "subscriptions_gym"> =
    action === "reset"
      ? ["subscriptions_app", "subscriptions_gym"]
      : planTables;
  const values = action === "reset"
    ? {
      active: false,
      expires_at: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      cancelled_at: null,
    }
    : { active: true, expires_at: newExpiresAt, cancelled_at: null };

  const results: Record<string, { ok: boolean; error?: string }> = {};

  for (const table of tables) {
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
        .update(values)
        .eq("user_id", userId);
      results[table] = updateErr
        ? { ok: false, error: updateErr.message }
        : { ok: true };
    } else {
      const { error: insertErr } = await admin
        .from(table)
        .insert({ user_id: userId, ...values });
      results[table] = insertErr
        ? { ok: false, error: insertErr.message }
        : { ok: true };
    }
  }

  // Legacy table from earlier phases; updated when present.
  try {
    const { error: subErr } = await admin
      .from("subscriptions")
      .upsert({
        user_id: userId,
        status: action === "reset" ? "inactive" : "active",
        app_subscription_status: action === "reset" ? "inactive" : "active",
        gym_membership_status: action === "reset" ? "inactive" : "active",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    if (subErr) {
      console.warn("Notice: public.subscriptions upsert note:", subErr.message);
    }
  } catch (err) {
    console.warn("Notice: public.subscriptions table optional:", err);
  }

  const firstFailure = Object.values(results).find((result) => !result.ok);
  if (firstFailure) {
    return json(
      {
        success: false,
        error: firstFailure.error ?? "Subscription update failed.",
      },
      500,
    );
  }

  return json({
    success: true,
    user_id: userId,
    status: action === "reset" ? "inactive" : "active",
  });
});
