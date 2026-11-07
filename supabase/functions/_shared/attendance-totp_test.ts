import {
  base32Encode,
  counterIsCurrent,
  generateTotp,
  parseAttendanceQr,
  verifyTotp,
} from "./attendance-totp.ts";

const vectors = [
  { counter: 1, code: "94287082" },
  { counter: 37_037_036, code: "07081804" },
  { counter: 37_037_037, code: "14050471" },
  { counter: 41_152_263, code: "89005924" },
  { counter: 66_666_666, code: "69279037" },
  { counter: 666_666_666, code: "65353130" },
];

Deno.test("decodes RFC 6238 SHA-1 TOTP vectors", async () => {
  const secret = base32Encode(new TextEncoder().encode("12345678901234567890"));
  for (const vector of vectors) {
    const code = await generateTotp(secret, vector.counter);
    if (code !== vector.code.slice(-6)) {
      throw new Error(`Counter ${vector.counter}: expected ${vector.code.slice(-6)}, got ${code}`);
    }
    if (!await verifyTotp(secret, code, vector.counter)) {
      throw new Error(`Counter ${vector.counter} should verify.`);
    }
    if (await verifyTotp(secret, "000000", vector.counter)) {
      throw new Error(`Forged code at counter ${vector.counter} should fail.`);
    }
  }
});

Deno.test("parses valid attendance QR payloads (pipe, JSON, and unencrypted USER_)", () => {
  const parsedPlain = parseAttendanceQr("USER_member_789");
  if (!parsedPlain || parsedPlain.memberId !== "member_789" || !parsedPlain.isPlain || parsedPlain.counter !== 0) {
    throw new Error("Expected unencrypted USER_ payload to parse correctly.");
  }
  const parsedPipe = parseAttendanceQr("KFIT1|user_123|59|123456");
  if (!parsedPipe || parsedPipe.memberId !== "user_123" || parsedPipe.counter !== 59 || parsedPipe.code !== "123456") {
    throw new Error("Expected pipe QR payload fields to parse correctly.");
  }
  const parsedJson = parseAttendanceQr(JSON.stringify({ memberId: "user_456", code: "654321", timestamp: 1_800_000_000_000 }));
  if (!parsedJson || parsedJson.memberId !== "user_456" || parsedJson.code !== "654321" || parsedJson.counter !== 60_000_000) {
    throw new Error("Expected JSON QR payload fields to parse correctly.");
  }
  for (const value of [null, 3, "", "KFIT2|user_123|59|123456", "KFIT1|user_123|x|123456", "KFIT1|user_123|59|12345"]) {
    if (parseAttendanceQr(value) !== null) throw new Error(`Expected ${String(value)} to be rejected.`);
  }
});

Deno.test("accepts current and adjacent time steps within tolerance window (window: 2)", () => {
  const now = 1_800_000_000_000;
  const current = Math.floor(now / 30_000);
  if (!counterIsCurrent(current, now) || !counterIsCurrent(current - 1, now) || !counterIsCurrent(current + 1, now) || !counterIsCurrent(current - 2, now) || !counterIsCurrent(current + 2, now)) {
    throw new Error("Counters within 2-step window should pass.");
  }
  if (counterIsCurrent(current - 3, now) || counterIsCurrent(current + 3, now)) {
    throw new Error("Counters outside the two-step clock window should fail.");
  }
});
