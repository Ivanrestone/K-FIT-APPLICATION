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

export type WebhookPaidSession = {
  sessionId: string;
  userId: string;
  planType: FeeType;
  pricingPlanId?: string | null;
  amountCentavos?: number | null;
  paidAt: string;
};

export function parseWebhookPaidSession(value: unknown): WebhookPaidSession | null {
  if (!isRecord(value) || !isRecord(value.data)) {
    return null;
  }

  const data = value.data;
  let eventType: string | null = null;
  let sessionObj: Record<string, unknown> | null = null;

  if (isRecord(data.attributes) && typeof data.attributes.type === "string") {
    eventType = data.attributes.type;
    if (isRecord(data.attributes.data)) {
      sessionObj = data.attributes.data;
    }
  } else if (typeof data.type === "string") {
    eventType = data.type;
    if (isRecord(data.data)) {
      sessionObj = data.data;
    }
  }

  if (eventType !== "checkout_session.payment.paid" || !sessionObj) {
    return null;
  }

  const sessionId = typeof sessionObj.id === "string" ? sessionObj.id : "";
  const sessionAttributes = isRecord(sessionObj.attributes) ? sessionObj.attributes : {};
  const metadata = isRecord(sessionAttributes.metadata) ? sessionAttributes.metadata : {};

  const rawUserId = metadata.user_id ?? metadata.kfit_user_id;
  const userId = typeof rawUserId === "string" ? rawUserId.trim() : null;
  if (!userId) {
    return null;
  }

  const rawPlanType = metadata.plan_type ?? metadata.feeType ?? metadata.kfit_fee_type;
  const planType = parseFeeType(rawPlanType);
  if (!planType) {
    return null;
  }

  const rawPricingPlanId = metadata.kfit_pricing_plan_id;
  const pricingPlanId = typeof rawPricingPlanId === "string" && UUID_PATTERN.test(rawPricingPlanId)
    ? rawPricingPlanId
    : null;

  const rawAmount = metadata.kfit_amount_centavos;
  let amountCentavos: number | null = null;
  if (typeof rawAmount === "string" && /^[1-9]\d*$/.test(rawAmount)) {
    amountCentavos = Number(rawAmount);
  } else if (typeof rawAmount === "number" && Number.isSafeInteger(rawAmount) && rawAmount > 0) {
    amountCentavos = rawAmount;
  }

  let paidAt: string | null = null;
  if (Array.isArray(sessionAttributes.payments) && sessionAttributes.payments.length > 0) {
    const firstPayment = sessionAttributes.payments[0];
    if (isRecord(firstPayment) && isRecord(firstPayment.attributes)) {
      if (amountCentavos === null && typeof firstPayment.attributes.amount === "number") {
        amountCentavos = firstPayment.attributes.amount;
      }
      paidAt = parsePaidAt(firstPayment.attributes.paid_at);
    }
  }
  if (!paidAt) {
    paidAt = parsePaidAt(sessionAttributes.paid_at) ?? new Date().toISOString();
  }

  return {
    sessionId,
    userId,
    planType,
    pricingPlanId,
    amountCentavos,
    paidAt,
  };
}

export function parsePaidCheckoutEvent(value: unknown): PaidCheckout | null {
  const parsed = parseWebhookPaidSession(value);
  if (
    !parsed ||
    !parsed.pricingPlanId ||
    !parsed.amountCentavos ||
    !parsed.sessionId
  ) {
    return null;
  }

  return {
    sessionId: parsed.sessionId,
    userId: parsed.userId,
    pricingPlanId: parsed.pricingPlanId,
    feeType: parsed.planType,
    amountCentavos: parsed.amountCentavos,
    paidAt: parsed.paidAt,
  };
}

