export type FeeType = "app" | "gym";

export type PaidCheckout = {
  sessionId: string;
  userId: string;
  pricingPlanId: string;
  feeType: FeeType;
  amountCentavos: number;
  paidAt: string;
};

type JsonRecord = Record<string, unknown>;

const UUID_PATTERN =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseFeeType(value: unknown): FeeType | null {
  return value === "app" || value === "gym" ? value : null;
}

export function parsePhpAmount(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const amountText = String(value);
  const match = /^([1-9]\d*)(?:\.(\d{1,2}))?$/.exec(amountText);
  if (!match) {
    return null;
  }

  const wholeAmount = Number(match[1]);
  const fractionalAmount = Number((match[2] ?? "").padEnd(2, "0"));
  const centavos = wholeAmount * 100 + fractionalAmount;
  return Number.isSafeInteger(centavos) && centavos > 0 ? centavos : null;
}

function parsePaidAt(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    return null;
  }

  const paidAt = new Date(value * 1000);
  if (!Number.isFinite(paidAt.getTime()) || paidAt.getTime() > Date.now()) {
    return null;
  }

  return paidAt.toISOString();
}

export async function verifyPayMongoSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature) {
    return false;
  }

  let expectedSignature: string;
  let receivedSignature: string;
  const signatureParts = signature.split(",").map((part) => part.trim());
  if (signatureParts.some((part) => part.includes("="))) {
    const fields = new Map<string, string>();
    for (const part of signatureParts) {
      const separator = part.indexOf("=");
      if (separator < 1) {
        return false;
      }
      const name = part.slice(0, separator);
      const value = part.slice(separator + 1);
      if (fields.has(name)) {
        return false;
      }
      fields.set(name, value);
    }

    const timestamp = fields.get("t");
    const testSignature = fields.get("te");
    const liveSignature = fields.get("li");
    if (
      !timestamp ||
      !/^\d+$/.test(timestamp) ||
      !testSignature ||
      !/^[\da-f]{64}$/i.test(testSignature) ||
      (liveSignature !== undefined && !/^[\da-f]{64}$/i.test(liveSignature)) ||
      [...fields.keys()].some((name) => !["t", "te", "li"].includes(name))
    ) {
      return false;
    }

    expectedSignature = await createHmacHex(
      `${timestamp}.${rawBody}`,
      secret,
    );
    receivedSignature = testSignature;
  } else {
    if (!/^[\da-f]{64}$/i.test(signature)) {
      return false;
    }
    expectedSignature = await createHmacHex(rawBody, secret);
    receivedSignature = signature;
  }

  let difference = expectedSignature.length ^ receivedSignature.length;
  for (let index = 0; index < expectedSignature.length; index += 1) {
    difference |= expectedSignature.charCodeAt(index) ^
      receivedSignature.toLowerCase().charCodeAt(index);
  }
  return difference === 0;
}

async function createHmacHex(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)),
  );
  return Array.from(
    digest,
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function parsePaidCheckoutEvent(value: unknown): PaidCheckout | null {
  if (!isRecord(value) || !isRecord(value.data)) {
    return null;
  }

  const event = value.data;
  if (
    event.type !== "checkout_session.payment.paid" ||
    event.livemode !== false ||
    !isRecord(event.data) ||
    event.data.type !== "checkout_session" ||
    typeof event.data.id !== "string" ||
    !isRecord(event.data.attributes)
  ) {
    return null;
  }

  const attributes = event.data.attributes;
  if (
    attributes.status === "expired" ||
    !isRecord(attributes.metadata) ||
    !Array.isArray(attributes.payments)
  ) {
    return null;
  }

  const metadata = attributes.metadata;
  const feeType = parseFeeType(metadata.kfit_fee_type);
  const userId = metadata.kfit_user_id;
  const pricingPlanId = metadata.kfit_pricing_plan_id;
  const amountValue = metadata.kfit_amount_centavos;
  if (
    !feeType ||
    typeof userId !== "string" ||
    !userId.trim() ||
    userId.length > 255 ||
    typeof pricingPlanId !== "string" ||
    !UUID_PATTERN.test(pricingPlanId) ||
    typeof amountValue !== "string" ||
    !/^[1-9]\d*$/.test(amountValue)
  ) {
    return null;
  }

  const amountCentavos = Number(amountValue);
  const paidPayments = attributes.payments.filter((payment) =>
    isRecord(payment) &&
    isRecord(payment.attributes) &&
    payment.attributes.status === "paid"
  );
  if (
    !Number.isSafeInteger(amountCentavos) ||
    amountCentavos <= 0 ||
    paidPayments.length !== 1
  ) {
    return null;
  }

  const paidPayment = paidPayments[0];
  if (!isRecord(paidPayment) || !isRecord(paidPayment.attributes)) {
    return null;
  }

  const paidAttributes = paidPayment.attributes;
  const paidAt = parsePaidAt(paidAttributes.paid_at);
  if (
    paidAttributes.currency !== "PHP" ||
    paidAttributes.amount !== amountCentavos ||
    !paidAt
  ) {
    return null;
  }

  return {
    sessionId: event.data.id,
    userId,
    pricingPlanId,
    feeType,
    amountCentavos,
    paidAt,
  };
}
