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

export type AttendanceQr = { memberId: string; counter: number; code: string };

export function parseAttendanceQr(value: unknown): AttendanceQr | null {
  if (typeof value !== "string" || value.length > 512) return null;
  const match = /^KFIT1\|([^|]+)\|(\d{1,12})\|(\d{6})$/.exec(value);
  if (!match) return null;
  try {
    const memberId = decodeURIComponent(match[1]);
    const counter = Number(match[2]);
    if (!memberId || memberId.length > 255 || !Number.isSafeInteger(counter)) return null;
    return { memberId, counter, code: match[3] };
  } catch {
    return null;
  }
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

export function counterIsCurrent(counter: number, nowMs = Date.now()): boolean {
  const current = Math.floor(nowMs / 1000 / PERIOD_SECONDS);
  return Math.abs(current - counter) <= 1;
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
