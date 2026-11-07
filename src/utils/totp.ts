import * as Crypto from "expo-crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const TOTP_PERIOD_SECONDS = 30;

export function encodeBase32(bytes: Uint8Array): string {
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

export function decodeBase32(secret: string): Uint8Array {
  const normalized = secret.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const character of normalized) {
    const digit = BASE32.indexOf(character);
    if (digit < 0) throw new Error("Invalid Base32 secret.");
    value = (value << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  if (output.length < 10) throw new Error("TOTP secret must contain at least 80 bits.");
  return new Uint8Array(output);
}

export async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  if (key.length > 64) key = new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA1, new Uint8Array(key)));
  const block = new Uint8Array(64);
  block.set(key);
  const inner = new Uint8Array(64 + message.length);
  const outer = new Uint8Array(84);
  for (let i = 0; i < 64; i++) {
    inner[i] = block[i] ^ 0x36;
    outer[i] = block[i] ^ 0x5c;
  }
  inner.set(message, 64);
  outer.set(new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA1, new Uint8Array(inner))), 64);
  return new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA1, new Uint8Array(outer)));
}

export async function generateTotp(secret: string, counter: number): Promise<string> {
  if (!Number.isSafeInteger(counter) || counter < 0) throw new Error("Invalid TOTP counter.");
  const movingFactor = new Uint8Array(8);
  const view = new DataView(movingFactor.buffer);
  view.setUint32(0, Math.floor(counter / 0x100000000), false);
  view.setUint32(4, counter >>> 0, false);
  const digest = await hmacSha1(decodeBase32(secret), movingFactor);
  const offset = digest[19] & 15;
  const binary = ((digest[offset] & 127) << 24) |
    ((digest[offset + 1] & 255) << 16) |
    ((digest[offset + 2] & 255) << 8) |
    (digest[offset + 3] & 255);
  return String(binary % 1_000_000).padStart(6, "0");
}

export async function generateTotpSecret(): Promise<string> {
  return encodeBase32(await Crypto.getRandomBytesAsync(20));
}

export function currentTotpCounter(unixTimeMs = Date.now()): number {
  return Math.floor(unixTimeMs / (TOTP_PERIOD_SECONDS * 1000));
}

export function generateCurrentTotp(secret: string, unixTimeMs = Date.now()): Promise<string> {
  return generateTotp(secret, currentTotpCounter(unixTimeMs));
}

export function counterIsCurrent(counter: number, unixTimeMs = Date.now(), tolerance = 2): boolean {
  const current = currentTotpCounter(unixTimeMs);
  return Math.abs(current - counter) <= tolerance;
}

export function createQrPayload(memberId: string, counter: number, code: string): string {
  return `KFIT1|${encodeURIComponent(memberId)}|${counter}|${code}`;
}

export function parseQrPayload(value: unknown): { memberId: string; counter: number; code: string } | null {
  if (!value) return null;

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
        counter = Math.floor(rawTimestamp > 1e11 ? rawTimestamp / (TOTP_PERIOD_SECONDS * 1000) : rawTimestamp / TOTP_PERIOD_SECONDS);
      } else {
        counter = currentTotpCounter();
      }
      return { memberId: rawMemberId, counter, code: rawCode };
    }
    return null;
  }

  if (typeof value !== "string" || value.length > 1024) return null;
  const trimmed = value.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsedJson = JSON.parse(trimmed);
      return parseQrPayload(parsedJson);
    } catch {
      // proceed to regex
    }
  }

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
