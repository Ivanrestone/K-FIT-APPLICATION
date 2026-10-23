# Phase 13: PayMongo Webhook Fulfillment

Status: done

## Objective

Implement and deploy the `paymongo-webhook` Supabase Edge Function to process `checkout_session.payment.paid` events from PayMongo, verifying signatures, extracting `user_id` and `plan_type`, and activating the corresponding subscription in `subscriptions_app` or `subscriptions_gym` for 1 month.

## Context & PayMongo Webhook Structure

PayMongo sends webhook events as HTTP POST requests with a signature header (`Paymongo-Signature`). The event payload hierarchy is:
- Root object: `data`
- Event attributes: `data.attributes`
- Event type: `data.attributes.type` (we filter for `checkout_session.payment.paid`)
- Checkout session data: `data.attributes.data`
- Checkout session attributes: `data.attributes.data.attributes`
- Session ID: `data.attributes.data.id`
- Metadata: `data.attributes.data.attributes.metadata` (contains `user_id`, `plan_type`, `kfit_user_id`, `kfit_fee_type`, `kfit_pricing_plan_id`, `kfit_amount_centavos`)
- Payments array: `data.attributes.data.attributes.payments`

## Scope & Implementation Details

1. **Edge Function (`supabase/functions/paymongo-webhook/index.ts`):**
   - Accept POST requests from PayMongo.
   - Support signature verification using `PAYMONGO_WEBHOOK_SECRET` with `Paymongo-Signature` header. If `PAYMONGO_WEBHOOK_SECRET` is not set yet in test mode, log a warning and proceed, or enforce signature when present.
   - Accurately parse the event type from `data.attributes.type` (as well as legacy `data.type`).
   - If event is not `checkout_session.payment.paid`, return `200 OK` with `{ received: true, ignored: true }` so PayMongo does not retry unnecessary events.
   - Extract `user_id` (from `metadata.user_id` or `metadata.kfit_user_id`) and `plan_type` (from `metadata.plan_type` or `metadata.kfit_fee_type`).
   - Use `createAdminClient()` (Supabase Service Role Key) to bypass RLS.
   - **Database fulfillment:**
     - First attempt the robust atomic RPC `apply_paid_subscription_checkout` which records the payment in `subscription_payments` and extends `expires_at` by 1 month (`active = true`, `cancelled_at = null`).
     - Fallback to direct table update on `subscriptions_app` or `subscriptions_gym` setting `active = true`, `expires_at = now() + interval '1 month'`, `cancelled_at = null` where `user_id = user_id`.
   - Return `200 OK` with `{ received: true, success: true }`.

2. **Shared Helper Update (`supabase/functions/_shared/paymongo.ts`):**
   - Fix `parsePaidCheckoutEvent` to handle standard PayMongo webhook event nesting (`data.attributes.type === "checkout_session.payment.paid"` and `data.attributes.data`).
   - Extract metadata gracefully whether keyed with `kfit_` or direct (`user_id`, `plan_type`).

3. **Deployment & Setup Instructions:**
   - Exact CLI command to deploy the function: `npx supabase functions deploy paymongo-webhook --no-verify-jwt` (webhooks from PayMongo do not have Clerk/Supabase user JWTs).
   - Instructions to retrieve Supabase Project URL and register webhook in PayMongo dashboard.
   - CLI command to set `PAYMONGO_WEBHOOK_SECRET`.

## Decisions

1. **Verify JWT Flag:**
   The `paymongo-webhook` Edge Function must have `--no-verify-jwt` (or configured with `verify_jwt = false` in `supabase/config.toml`) because webhook requests come directly from PayMongo's servers, not from authenticated Clerk/Supabase mobile users.
2. **Subscription Schema Compatibility:**
   The database schema uses `active: boolean` and `expires_at: timestamptz` rather than `status: text` and `current_period_end`. The fulfillment updates `active = true`, `expires_at = now() + interval '1 month'`, and `cancelled_at = null`.
3. **Idempotency:**
   Fulfillment will be idempotent: if a duplicate webhook event is received for the same checkout session, it safely returns 200 without double-billing or erroring out.

## Verification Plan

1. Verify `supabase/config.toml` configures `verify_jwt = false` for `paymongo-webhook`.
2. Type check via `npx tsc --noEmit`.
3. Deploy function using `npx supabase functions deploy paymongo-webhook --no-verify-jwt`.
4. Test webhook payload processing with mock PayMongo test payload.

## Result

Implemented `paymongo-webhook` Edge Function with PayMongo standard event hierarchy support, flexible signature verification, and dual-layer database fulfillment (atomic RPC with direct table fallback). Deployed function with `--no-verify-jwt`. Verified live webhook fulfillment and idempotency against test user in Supabase.

