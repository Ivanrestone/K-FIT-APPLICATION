import { getVerifiedClerkUserId } from "../_shared/clerk.ts";
import { createAdminClient } from "../_shared/server-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReminderKind = "membership_expiry" | "session";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function displayName(row: {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
}): string {
  const full = row.full_name?.trim();
  if (full) return full;
  const combined = [row.first_name, row.last_name]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ");
  if (combined) return combined;
  return row.email?.split("@")[0] ?? "there";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function subjectFor(kind: ReminderKind): string {
  return kind === "session"
    ? "Your K-Fit session reminder"
    : "Your K-Fit membership needs attention";
}

function defaultMessage(kind: ReminderKind, name: string): string {
  if (kind === "session") {
    return `Hi ${name}, this is a reminder about your upcoming coaching session at K-Fit. Reply to your coach if you need to reschedule.`;
  }
  return `Hi ${name}, your K-Fit gym membership is expired or expiring soon. Renew at the front desk to keep your facility access active.`;
}

async function sendWithResend(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return false;

  const from =
    Deno.env.get("RESEND_FROM_EMAIL") ?? "K-Fit <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: `<div style="font-family:system-ui,sans-serif;background:#0A0A0A;color:#ffffff;padding:24px;border-radius:12px">
        <h2 style="color:#D4AF37;margin:0 0 12px">K-FIT</h2>
        <p style="line-height:1.6;margin:0">${escapeHtml(input.text)}</p>
      </div>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Resend rejected the reminder:", response.status, detail);
    return false;
  }
  return true;
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const callerId = getVerifiedClerkUserId(request);
  if (!callerId) {
    return jsonResponse({ error: "A signed-in session is required." }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  if (!isRecord(body) || typeof body.memberId !== "string" || !body.memberId) {
    return jsonResponse({ error: "memberId is required." }, 400);
  }

  const kind: ReminderKind =
    body.kind === "session" ? "session" : "membership_expiry";

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("Supabase server credentials are unavailable:", error);
    return jsonResponse({ error: "Reminders are not configured." }, 503);
  }

  // Only staff may send reminders.
  const { data: caller, error: callerError } = await admin
    .from("users")
    .select("id, role")
    .eq("id", callerId)
    .maybeSingle();

  if (callerError) {
    return jsonResponse({ error: "Could not verify account permissions." }, 503);
  }
  if (!caller || (caller.role !== "coach" && caller.role !== "admin")) {
    return jsonResponse(
      { error: "Only coaches and admins can send reminders." },
      403,
    );
  }

  const { data: member, error: memberError } = await admin
    .from("users")
    .select("id, email, first_name, last_name, full_name")
    .eq("id", body.memberId)
    .maybeSingle();

  if (memberError) {
    return jsonResponse({ error: "Could not load that member." }, 503);
  }
  if (!member) {
    return jsonResponse({ error: "MEMBER_NOT_FOUND" }, 404);
  }

  const name = displayName(member);
  const message =
    typeof body.message === "string" && body.message.trim().length > 0
      ? body.message.trim()
      : defaultMessage(kind, name);
  const subject = subjectFor(kind);

  const { error: notificationError } = await admin
    .from("notifications")
    .insert({
      user_id: member.id,
      title: subject,
      body: message,
      kind,
    });

  if (notificationError) {
    console.error("Could not store the notification:", notificationError.message);
  }

  let emailSent = false;
  if (typeof member.email === "string" && member.email.includes("@")) {
    try {
      emailSent = await sendWithResend({
        to: member.email,
        subject,
        text: message,
      });
    } catch (error) {
      console.error("Resend request failed:", error);
    }
  }

  return jsonResponse({
    success: true,
    emailSent,
    notificationSent: !notificationError,
  });
}

Deno.serve(async (request) => {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error("send-reminder failed:", error);
    return jsonResponse({ error: "Could not send the reminder." }, 500);
  }
});
