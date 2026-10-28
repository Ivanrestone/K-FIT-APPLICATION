import { createAdminClient } from "../_shared/server-client.ts";
import { verifyClerkSession } from "../_shared/attendance-auth.ts";
import { counterIsCurrent, decodeBase32, parseAttendanceQr, verifyTotp } from "../_shared/attendance-totp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
type Role = "member" | "coach" | "admin";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function encodeHex(value: Uint8Array): string {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function encryptionKeyBytes(): ArrayBuffer {
  const hex = Deno.env.get("TOTP_ENCRYPTION_KEY") ?? "";
  if (!/^(?:[0-9a-f]{2}){32}$/i.test(hex)) throw new Error("TOTP_ENCRYPTION_KEY must be 32 bytes in hex format.");
  const key = new Uint8Array(hex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
  const buffer = new ArrayBuffer(key.length);
  new Uint8Array(buffer).set(key);
  return buffer;
}
function arrayBuffer(value: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(value.length);
  new Uint8Array(buffer).set(value);
  return buffer;
}
async function decryptSecret(encryptedSecret: string): Promise<string> {
  const [ivHex, cipherHex] = encryptedSecret.split(".");
  if (!ivHex || !cipherHex || !/^(?:[0-9a-f]{2}){12}$/i.test(ivHex) || !/^(?:[0-9a-f]{2})+$/i.test(cipherHex)) {
    throw new Error("Malformed encrypted TOTP secret.");
  }
  const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
  const ciphertext = new Uint8Array(cipherHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
  const key = await crypto.subtle.importKey("raw", encryptionKeyBytes(), "AES-GCM", false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: arrayBuffer(iv) }, key, arrayBuffer(ciphertext));
  return new TextDecoder().decode(plaintext);
}

async function encryptSecret(secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey("raw", encryptionKeyBytes(), "AES-GCM", false, ["encrypt"]);
  const plaintext = new TextEncoder().encode(secret);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: arrayBuffer(iv) }, key, arrayBuffer(plaintext),
  ));
  return `${encodeHex(iv)}.${encodeHex(ciphertext)}`;
}

async function handle(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const auth = await verifyClerkSession(request);
  if (!auth.userId) return json({ error: auth.error ?? "Authentication failed." }, 401);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: "Request body must be valid JSON." }, 400); }
  if (!isRecord(body) || typeof body.action !== "string") return json({ error: "A supported action is required." }, 400);

  let admin;
  try { admin = createAdminClient(); } catch (error) {
    console.error("Attendance server client unavailable:", error);
    return json({ error: "Attendance service is not configured." }, 503);
  }
  const { data: caller, error: callerError } = await admin.from("users")
    .select("id, role").eq("id", auth.userId).maybeSingle();
  if (callerError) return json({ error: "Could not verify account permissions." }, 503);
  if (!caller || !["member", "coach", "admin"].includes(caller.role)) {
    return json({ error: "Account is not provisioned for attendance." }, 403);
  }
  const role = caller.role as Role;

  if (body.action === "provision") {
    if (role !== "member") return json({ error: "Only members can provision a pass." }, 403);
    if (typeof body.secret !== "string") return json({ error: "A TOTP secret is required." }, 400);
    try {
      if (decodeBase32(body.secret).length !== 20) return json({ error: "TOTP secret must be 160 bits." }, 400);
      const { data: existing, error: readError } = await admin.from("member_totp_secrets")
        .select("encrypted_secret").eq("user_id", auth.userId).maybeSingle();
      if (readError) throw readError;
      if (existing && await decryptSecret(existing.encrypted_secret) === body.secret) {
        return json({ provisioned: true, unchanged: true });
      }
      const encryptedSecret = await encryptSecret(body.secret);
      const { data, error } = await admin.rpc("provision_attendance_secret", {
        p_member_id: auth.userId,
        p_encrypted_secret: encryptedSecret,
      });
      if (error) throw error;
      return json({ provisioned: true, unchanged: data === "unchanged" });
    } catch (error) {
      console.error("Could not provision attendance pass:", error);
      return json({ error: "Could not securely provision your attendance pass." }, 503);
    }
  }

  if (body.action === "scan") {
    if (role !== "admin" && role !== "coach") return json({ error: "Staff access is required to scan passes." }, 403);
    const qr = parseAttendanceQr(body.payload);
    if (!qr) return json({ outcome: "invalid", error: "QR code is invalid." });
    const { data: secretRow, error: secretError } = await admin.from("member_totp_secrets")
      .select("encrypted_secret, last_used_step").eq("user_id", qr.memberId).maybeSingle();
    if (secretError) {
      console.error("Could not load member attendance secret:", secretError.message);
      return json({ error: "Attendance verification is unavailable." }, 503);
    }
    if (!secretRow) return json({ outcome: "not_provisioned", error: "Member pass is not provisioned." });
    let secret: string;
    try {
      secret = await decryptSecret(secretRow.encrypted_secret);
    } catch (error) {
      console.error("Could not decrypt member attendance secret:", error);
      return json({ error: "Attendance verification is unavailable." }, 503);
    }
    if (!counterIsCurrent(qr.counter)) return json({ outcome: "expired", error: "QR code expired." });
    if (!await verifyTotp(secret, qr.code, qr.counter)) return json({ outcome: "invalid", error: "QR code is invalid." });

    const { data, error } = await admin.rpc("record_attendance_scan", {
      p_member_id: qr.memberId,
      p_time_step: qr.counter,
    });
    if (error) {
      console.error("Attendance transaction failed:", error.message);
      return json({ error: "Could not verify or record attendance. Try again." }, 503);
    }
    if (!isRecord(data) || typeof data.outcome !== "string") return json({ error: "Attendance service returned invalid data." }, 503);
    if (data.outcome !== "check_in" && data.outcome !== "check_out") return json(data);
    const { data: member, error: memberError } = await admin.from("users")
      .select("id, full_name, first_name, last_name").eq("id", qr.memberId).maybeSingle();
    if (memberError || !member) return json({ error: "Attendance was recorded, but member details could not be loaded." }, 503);
    const name = member.full_name || [member.first_name, member.last_name].filter(Boolean).join(" ") || "Member";
    return json({ ...data, member: { id: member.id, name } });
  }

  if (body.action === "history") {
    const rawMemberId = typeof body.memberId === "string" ? body.memberId : auth.userId;
    if (rawMemberId.length < 1 || rawMemberId.length > 255) {
      return json({ error: "A valid member ID is required." }, 400);
    }
    let memberId = rawMemberId;
    try { memberId = decodeURIComponent(rawMemberId); } catch { /* Accept literal IDs that are not URI-encoded. */ }
    if (memberId !== auth.userId && role !== "admin" && role !== "coach") return json({ error: "You cannot view this member's attendance." }, 403);
    const { data, error } = await admin.from("attendance_logs")
      .select("id, member_id, scan_timestamp, checkout_timestamp")
      .eq("member_id", memberId).order("scan_timestamp", { ascending: false }).limit(200);
    if (error) {
      console.error("Could not read attendance history:", error.message);
      return json({ error: "Could not load attendance history." }, 503);
    }
    return json({ records: data ?? [] });
  }

  if (body.action === "staff_history") {
    if (role !== "admin" && role !== "coach") return json({ error: "Staff access is required to view attendance records." }, 403);
    const { data, error } = await admin.from("attendance_logs")
      .select("id, member_id, scan_timestamp, checkout_timestamp")
      .order("scan_timestamp", { ascending: false }).limit(200);
    if (error) {
      console.error("Could not read staff attendance records:", error.message);
      return json({ error: "Could not load attendance records." }, 503);
    }
    const memberIds = [...new Set((data ?? []).map((record) => record.member_id))];
    const names = new Map<string, string>();
    for (let start = 0; start < memberIds.length; start += 100) {
      const ids = memberIds.slice(start, start + 100);
      const { data: users, error: usersError } = await admin.from("users")
        .select("id, full_name, first_name, last_name").in("id", ids);
      if (usersError) {
        console.error("Could not read attendance member names:", usersError.message);
        return json({ error: "Could not load attendance records." }, 503);
      }
      for (const user of users ?? []) {
        names.set(user.id, user.full_name || [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || "Member");
      }
    }
    const records = (data ?? []).map((record) => ({
      id: record.id,
      member_id: record.member_id,
      scan_timestamp: record.scan_timestamp,
      checkout_timestamp: record.checkout_timestamp,
      member_name: names.get(record.member_id) ?? "Member",
    }));
    return json({ records });
  }
  return json({ error: "Unsupported action." }, 400);
}

Deno.serve((request) => handle(request).catch((error: unknown) => {
  console.error("Unexpected attendance request failure:", error);
  return json({ error: "Could not process attendance request." }, 500);
}));
