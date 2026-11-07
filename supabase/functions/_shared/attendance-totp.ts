const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PERIOD_SECONDS = 30;

export function decodeBase32(secret: string): Uint8Array {
  const normalized = secret.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const character of normalized) {
    const digit = BASE32.indexOf(character);
    if (digit < 0) throw new Error("Invalid Base32 secret.");
    value = (value << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  if (bytes.length < 10) throw new Error("TOTP secret is too short.");
  return new Uint8Array(bytes);
}

export type AttendanceQr = { memberId: string; counter: number; code: string; isPlain?: boolean };

export function parseAttendanceQr(value: unknown): AttendanceQr | null {
  if (!value) return null;

  // 1. If it's already an object
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const rawMemberId = obj.memberId ?? obj.member_id ?? obj.userId ?? obj.user_id;
    const rawCode = obj.code ?? obj.totp ?? obj.token;
    const rawCounter = obj.counter ?? obj.timeStep ?? obj.time_step;
    const rawTimestamp = obj.timestamp;

    if (typeof rawMemberId === "string" && typeof rawCode === "string" && /^\d{6}$/.test(rawCode)) {
      let counter: number;
      if (typeof rawCounter === "number" && Number.isSafeInteger(rawCounter)) {
        counter = rawCounter;
      } else if (typeof rawTimestamp === "number" && Number.isSafeInteger(rawTimestamp)) {
        counter = Math.floor(rawTimestamp > 1e11 ? rawTimestamp / (PERIOD_SECONDS * 1000) : rawTimestamp / PERIOD_SECONDS);
      } else {
        counter = Math.floor(Date.now() / (PERIOD_SECONDS * 1000));
      }
      return { memberId: rawMemberId, counter, code: rawCode };
    }
    return null;
  }

  if (typeof value !== "string" || value.length > 1024) return null;
  const trimmed = value.trim();

  // 2. Unencrypted USER_<userId> format (Phase 22 direct plain-text)
  if (trimmed.startsWith("USER_")) {
    const memberId = trimmed.slice(5).trim();
    if (memberId && memberId.length <= 255) {
      return { memberId, counter: 0, code: "", isPlain: true };
    }
  }

  // 3. Try JSON parse if it looks like a JSON string
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsedJson = JSON.parse(trimmed);
      return parseAttendanceQr(parsedJson);
    } catch {
      // not valid JSON, proceed to regex
    }
  }

  // 3. Match KFIT1|memberId|counter|code
  const matchKfit1 = /^KFIT1\|([^|]+)\|(\d{1,12})\|(\d{6})$/.exec(trimmed);
  if (matchKfit1) {
    try {
      const memberId = decodeURIComponent(matchKfit1[1]);
      const counter = Number(matchKfit1[2]);
      if (memberId && memberId.length <= 255 && Number.isSafeInteger(counter)) {
        return { memberId, counter, code: matchKfit1[3] };
      }
    } catch {
      // fall through
    }
  }

  // 4. Match KFIT:memberId:counter:code or colon format
  const matchColon = /^KFIT:([^:]+):(\d{1,12}):(\d{6})$/.exec(trimmed);
  if (matchColon) {
    try {
      const memberId = decodeURIComponent(matchColon[1]);
      const counter = Number(matchColon[2]);
      if (memberId && memberId.length <= 255 && Number.isSafeInteger(counter)) {
        return { memberId, counter, code: matchColon[3] };
      }
    } catch {
      // fall through
    }
  }

  return null;
}

export async function generateTotp(secret: string, counter: number): Promise<string> {
  if (!Number.isSafeInteger(counter) || counter < 0) throw new Error("Invalid TOTP counter.");
  const counterBytes = new Uint8Array(8);
  const view = new DataView(counterBytes.buffer);
  view.setUint32(0, Math.floor(counter / 0x100000000), false);
  view.setUint32(4, counter >>> 0, false);
  const decodedSecret = decodeBase32(secret);
  const keyData = new ArrayBuffer(decodedSecret.length);
  new Uint8Array(keyData).set(decodedSecret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, counterBytes));
  const offset = digest[digest.length - 1] & 15;
  const binary = ((digest[offset] & 127) << 24) |
    ((digest[offset + 1] & 255) << 16) |
    ((digest[offset + 2] & 255) << 8) |
    (digest[offset + 3] & 255);
  return String(binary % 1_000_000).padStart(6, "0");
}

export async function verifyTotp(secret: string, code: string, counter: number): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const expected = await generateTotp(secret, counter);
  let difference = 0;
  for (let i = 0; i < expected.length; i++) {
    difference |= expected.charCodeAt(i) ^ code.charCodeAt(i);
  }
  return difference === 0;
}

export async function verifyTotpWithWindow(
  secret: string,
  code: string,
  counter: number,
  window = 2,
): Promise<{ valid: boolean; matchedCounter: number }> {
  if (!/^\d{6}$/.test(code)) return { valid: false, matchedCounter: counter };
  if (await verifyTotp(secret, code, counter)) {
    return { valid: true, matchedCounter: counter };
  }
  for (let offset = 1; offset <= window; offset++) {
    if (counter - offset >= 0 && (await verifyTotp(secret, code, counter - offset))) {
      return { valid: true, matchedCounter: counter - offset };
    }
    if (await verifyTotp(secret, code, counter + offset)) {
      return { valid: true, matchedCounter: counter + offset };
    }
  }
  return { valid: false, matchedCounter: counter };
}

export function counterIsCurrent(counter: number, nowMs = Date.now(), tolerance = 2): boolean {
  const current = Math.floor(nowMs / 1000 / PERIOD_SECONDS);
  return Math.abs(current - counter) <= tolerance;
}

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}
