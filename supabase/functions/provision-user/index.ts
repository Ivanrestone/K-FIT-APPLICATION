import { getVerifiedClerkUserId } from "../_shared/clerk.ts";
import { createAdminClient } from "../_shared/server-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ClerkEmailAddress = {
  id?: unknown;
  email_address?: unknown;
};

type ClerkUser = {
  email_addresses?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  primary_email_address_id?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getOptionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getPrimaryEmail(user: ClerkUser): string {
  if (
    typeof user.primary_email_address_id !== "string" ||
    !Array.isArray(user.email_addresses)
  ) {
    return "";
  }

  const primaryAddress = user.email_addresses.find(
    (value: ClerkEmailAddress) =>
      isRecord(value) && value.id === user.primary_email_address_id,
  );

  return isRecord(primaryAddress)
    ? getOptionalString(primaryAddress.email_address)
    : "";
}

async function provisionUser(request: Request): Promise<Response> {
  const userId = getVerifiedClerkUserId(request);
  if (!userId) {
    return jsonResponse({ error: "A signed in session is required." }, 401);
  }

  const clerkSecretKey = Deno.env.get("CLERK_SECRET_KEY");
  if (!clerkSecretKey) {
    console.error("Clerk server credentials are not configured.");
    return jsonResponse({ error: "Profile service is not configured." }, 500);
  }

  let clerkResponse: Response;
  try {
    clerkResponse = await fetch(
      `https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`,
      {
        headers: { Authorization: `Bearer ${clerkSecretKey}` },
      },
    );
  } catch (error) {
    console.error("Could not reach Clerk while provisioning a profile:", error);
    return jsonResponse({ error: "Could not load your Clerk profile." }, 502);
  }

  if (!clerkResponse.ok) {
    console.error(
      "Clerk profile lookup failed with status:",
      clerkResponse.status,
    );
    return jsonResponse({ error: "Could not load your Clerk profile." }, 502);
  }

  let clerkUserData: unknown;
  try {
    clerkUserData = await clerkResponse.json();
  } catch (error) {
    console.error("Clerk returned an invalid profile response:", error);
    return jsonResponse({ error: "Clerk returned an invalid profile." }, 502);
  }

  if (!isRecord(clerkUserData)) {
    console.error("Clerk returned an unexpected profile shape.");
    return jsonResponse({ error: "Clerk returned an invalid profile." }, 502);
  }

  const clerkUser = clerkUserData as ClerkUser;
  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("Supabase server credentials are unavailable:", error);
    return jsonResponse({ error: "Profile service is not configured." }, 500);
  }

  const { data: role, error } = await admin.rpc("provision_user_profile", {
    p_user_id: userId,
    p_email: getPrimaryEmail(clerkUser),
    p_first_name: getOptionalString(clerkUser.first_name),
    p_last_name: getOptionalString(clerkUser.last_name),
  });

  if (error) {
    console.error("Could not provision the signed in user:", error.message);
    return jsonResponse({ error: "Could not provision your profile." }, 500);
  }

  if (role !== "member" && role !== "coach" && role !== "admin") {
    console.error("Provisioning returned an invalid account role.");
    return jsonResponse({ error: "Your account role is not configured." }, 500);
  }

  return jsonResponse({ role });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  return await provisionUser(request);
});
