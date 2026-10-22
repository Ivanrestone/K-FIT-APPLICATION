import {
  parsePaidCheckoutEvent,
  parsePhpAmount,
  verifyPayMongoSignature,
} from "./paymongo.ts";

const paidAtSeconds = Date.UTC(2025, 0, 15, 12) / 1000;
const pricingPlanId = "6c83a5e5-3a8c-4ab1-ae0e-84be1bdc40d8";

function createPaidEvent(overrides: {
  livemode?: boolean;
  feeType?: string;
  amount?: number;
  metadataAmount?: string;
  currency?: string;
  paymentStatus?: string;
  sessionStatus?: string;
  paidAt?: unknown;
  pricingPlanId?: string;
  paymentCount?: number;
} = {}) {
  const paidAt = Object.hasOwn(overrides, "paidAt")
    ? overrides.paidAt
    : paidAtSeconds;
  const payment = {
    attributes: {
      status: overrides.paymentStatus ?? "paid",
      amount: overrides.amount ?? 17_000,
      currency: overrides.currency ?? "PHP",
      paid_at: paidAt,
    },
  };
  return {
    data: {
      type: "checkout_session.payment.paid",
      livemode: overrides.livemode ?? false,
      data: {
        id: "cs_test_123",
        type: "checkout_session",
        attributes: {
          status: overrides.sessionStatus ?? "active",
          metadata: {
            kfit_user_id: "user_test_123",
            kfit_fee_type: overrides.feeType ?? "app",
            kfit_pricing_plan_id: overrides.pricingPlanId ?? pricingPlanId,
            kfit_amount_centavos: overrides.metadataAmount ?? "17000",
          },
          payments: Array.from(
            { length: overrides.paymentCount ?? 1 },
            () => payment,
          ),
        },
      },
    },
  };
}

async function sign(rawBody: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)),
  );
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

Deno.test("verifies PayMongo HMAC against the exact raw body", async () => {
  const body = JSON.stringify(createPaidEvent());
  const signature = await sign(body, "test-webhook-secret");

  if (!await verifyPayMongoSignature(body, signature, "test-webhook-secret")) {
    throw new Error("Expected valid webhook signature to pass.");
  }
  if (
    await verifyPayMongoSignature(`${body} `, signature, "test-webhook-secret")
  ) {
    throw new Error(
      "Expected altered raw body to fail signature verification.",
    );
  }
  if (
    await verifyPayMongoSignature(body, "0".repeat(64), "test-webhook-secret")
  ) {
    throw new Error("Expected a forged signature to fail verification.");
  }
});

Deno.test("verifies the timestamped PayMongo test signature", async () => {
  const body = JSON.stringify(createPaidEvent());
  const timestamp = "1792000000";
  const signature = await sign(
    `${timestamp}.${body}`,
    "test-webhook-secret",
  );

  if (
    !await verifyPayMongoSignature(
      body,
      `t=${timestamp},te=${signature},li=${"0".repeat(64)}`,
      "test-webhook-secret",
    )
  ) {
    throw new Error("Expected valid timestamped test signature to pass.");
  }
  if (
    await verifyPayMongoSignature(
      `${body} `,
      `t=${timestamp},te=${signature}`,
      "test-webhook-secret",
    )
  ) {
    throw new Error("Expected an altered signed payload to fail.");
  }
  if (
    await verifyPayMongoSignature(
      body,
      `t=${timestamp},te=${"0".repeat(64)}`,
      "test-webhook-secret",
    )
  ) {
    throw new Error("Expected a forged timestamped signature to fail.");
  }
});

Deno.test("parses one paid test checkout with the provider paid timestamp", () => {
  const checkout = parsePaidCheckoutEvent(createPaidEvent());
  if (
    checkout?.userId !== "user_test_123" ||
    checkout.feeType !== "app" ||
    checkout.pricingPlanId !== pricingPlanId ||
    checkout.sessionId !== "cs_test_123" ||
    checkout.amountCentavos !== 17_000 ||
    checkout.paidAt !== new Date(paidAtSeconds * 1000).toISOString()
  ) {
    throw new Error(
      "Expected the paid checkout to preserve verified metadata.",
    );
  }
});

Deno.test("rejects live, unpaid, expired, mismatched, and duplicate payments", () => {
  const invalidEvents = [
    createPaidEvent({ livemode: true }),
    createPaidEvent({ paymentStatus: "pending" }),
    createPaidEvent({ sessionStatus: "expired" }),
    createPaidEvent({ currency: "USD" }),
    createPaidEvent({ amount: 17_001 }),
    createPaidEvent({ metadataAmount: "17001" }),
    createPaidEvent({ feeType: "other" }),
    createPaidEvent({ pricingPlanId: "not-a-uuid" }),
    createPaidEvent({ paymentCount: 2 }),
  ];

  if (invalidEvents.some((event) => parsePaidCheckoutEvent(event) !== null)) {
    throw new Error("Expected invalid checkout events to be rejected.");
  }
});

Deno.test("requires an explicit valid provider paid timestamp", () => {
  for (const paidAt of [undefined, null, "2025-01-15T12:00:00Z", 0, -1, 1.5]) {
    const event = createPaidEvent({ paidAt });
    if (parsePaidCheckoutEvent(event) !== null) {
      throw new Error(
        `Expected invalid paid_at ${String(paidAt)} to be rejected.`,
      );
    }
  }

  if (
    parsePaidCheckoutEvent(createPaidEvent({
      paidAt: Math.ceil(Date.now() / 1000) + 1,
    })) !== null
  ) {
    throw new Error("Expected a future provider timestamp to be rejected.");
  }
});

Deno.test("converts positive PHP prices to centavos without rounding", () => {
  if (
    parsePhpAmount("170.00") !== 17_000 ||
    parsePhpAmount("1.5") !== 150 ||
    parsePhpAmount(2) !== 200
  ) {
    throw new Error("Expected valid PHP amounts to convert to centavos.");
  }

  for (const value of ["0", "-1", "1.234", "1e2", "not-a-price", null]) {
    if (parsePhpAmount(value) !== null) {
      throw new Error(`Expected invalid PHP amount ${String(value)} to fail.`);
    }
  }
});
