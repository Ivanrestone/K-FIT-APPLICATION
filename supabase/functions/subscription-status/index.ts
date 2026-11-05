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

// Fallback read for `subscriptions_app` / `subscriptions_gym` when the app's
// anon client cannot satisfy RLS (missing or non-`sub` Clerk token). The Clerk
// session is verified here, then the rows are read with the service role, so a
// paid plan is never reported as inactive because of a client-side policy.
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const auth = await verifyClerkToken(request);
  if (!auth.userId) {
    return json({ error: auth.error ?? "Authentication failed." }, 401);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("Subscription status server client unavailable:", error);
    return json({ error: "Subscription service is not configured." }, 503);
  }

  const [profileResult, appResult, gymResult] = await Promise.all([
    admin
      .from("users")
      .select("id, role")
      .eq("id", auth.userId)
      .maybeSingle(),
    admin
      .from("subscriptions_app")
      .select("active, expires_at, cancelled_at")
      .eq("user_id", auth.userId)
      .maybeSingle(),
    admin
      .from("subscriptions_gym")
      .select("active, expires_at, cancelled_at")
      .eq("user_id", auth.userId)
      .maybeSingle(),
  ]);

  const readError = profileResult.error ?? appResult.error ??
    gymResult.error;
  if (readError) {
    console.error("Could not read subscription status:", readError.message);
    return json({ error: "Could not load subscription status." }, 503);
  }

  const role = profileResult.data?.role === "admin" ||
      profileResult.data?.role === "coach"
    ? profileResult.data.role
    : "member";

  return json({
    userId: auth.userId,
    role,
    isProvisioned: profileResult.data !== null,
    app: appResult.data ?? null,
    gym: gymResult.data ?? null,
  });
});
