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

Deno.test("parses only valid attendance QR payloads", () => {
  const parsed = parseAttendanceQr("KFIT1|user_123|59|123456");
  if (!parsed || parsed.memberId !== "user_123" || parsed.counter !== 59 || parsed.code !== "123456") {
    throw new Error("Expected QR payload fields to parse correctly.");
  }
  for (const value of [null, 3, "", "KFIT2|user_123|59|123456", "KFIT1|user_123|x|123456", "KFIT1|user_123|59|12345"]) {
    if (parseAttendanceQr(value) !== null) throw new Error(`Expected ${String(value)} to be rejected.`);
  }
});

Deno.test("accepts only current or adjacent 30-second time steps", () => {
  const now = 1_800_000_000_000;
  const current = Math.floor(now / 30_000);
  if (!counterIsCurrent(current, now) || !counterIsCurrent(current - 1, now) || !counterIsCurrent(current + 1, now)) {
    throw new Error("Current and adjacent counters should pass the clock window.");
  }
  if (counterIsCurrent(current - 2, now) || counterIsCurrent(current + 2, now)) {
    throw new Error("Counters outside the one-step clock window should fail.");
  }
});
