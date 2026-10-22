# Phase 05: Dynamic Pricing and Monthly Paywalls

Status: approved

## Objective

Replace fixed payment amounts and indefinite boolean access with versioned monthly plans, hosted manual renewal, expiry aware access, and dynamic Member and Coach paywalls. Prepare and deploy the production safe schema and Edge Functions to the connected remote Supabase project.

## Scope

1. Update the unapplied initial migration to remove the development scanner insert policy and authenticated attendance insert grant.
2. Add a migration for versioned App and Gym prices, separate `subscriptions_app` and `subscriptions_gym` expiry and cancellation fields, a private payment ledger, and a restricted idempotent payment function.
3. Update checkout to select the active database price, permit Member App and Gym purchases and Coach App purchases only, and reject checkout during a canceled active period.
4. Update the PayMongo webhook to validate the exact plan version, PHP amount, and provider paid timestamp, then extend access once per successful Checkout Session.
5. Add an idempotent cancellation Edge Function that keeps access through expiry and permits a new purchase after expiry.
6. Update Member and Coach dashboard paywalls and the Member membership screen to read active prices and own subscription state through RLS.
7. Apply migrations and deploy Edge Functions only to the connected remote project. Do not run Docker, `npx supabase start`, local Supabase services, or local migration commands.
8. Keep PayMongo in test mode. Do not enable live payments.

## Decisions

1. App and Gym plans each display USD 3.00 and charge PHP 170.00 per calendar month.
2. Price versions remain stored after deactivation, with exactly one active row per plan type. Prices are managed in the Supabase dashboard, with no new Admin screen.
3. Members may buy App and Gym access. Coaches may buy App access only.
4. The app reads active plans through Clerk authenticated Supabase RLS. The checkout function chooses the authoritative active plan and amount.
5. Renewal is manual through hosted PayMongo Checkout. No automatic charge or payment method vaulting.
6. Early renewal adds one calendar month to the existing expiry. An expired subscription starts a new month from the confirmed payment time.
7. Cancellation keeps access through the current expiry and blocks another checkout while that period is active. A new manual purchase is allowed after expiry.
8. QR generation and route guards are deferred. The App paywall replaces dashboard content when App access is inactive, without changing route behavior.
9. The connected remote Supabase project was inspected and found empty. Stop before applying migrations if any schema or data appears.

## Implementation Steps

1. **Prepare the production schema**
   * Remove development scanner policy and authenticated attendance insert grant from the initial migration.
   * Add the dynamic plan, expiry, cancellation, payment ledger, RLS, grants, and service role only payment RPC migration.
   * Seed one active App plan and one active Gym plan at the confirmed prices.
2. **Implement trusted payment lifecycle**
   * Verify trusted Clerk provisioning creates the user row and each applicable subscription row. Keep checkout fail closed when a required row is missing.
   * Update checkout and webhook functions for roles, exact plan versions, PHP amount validation, one calendar month expiry, and idempotency.
   * Add the self service cancellation function.
   * Extend focused Deno tests for invalid role, price version mismatch, duplicate webhooks, calendar month renewal, expiry, and cancellation.
3. **Implement dynamic paywalls**
   * Add a shared data hook for active plans and the signed in user's subscription.
   * Show Member App and Gym choices and Coach App only.
   * Show active, expired, canceled, loading, error, retry, missing subscription, and no active plan states. A failed subscription read must not unlock dashboard content.
   * Open hosted Checkout and refresh from Supabase on return without treating the return URL as proof of payment.
4. **Deploy remotely**
   * Recheck that the linked remote project is empty.
   * Apply the migrations and verify the tables, policies, grants, seeded plans, and RPC.
   * Deploy the three Edge Functions after rotated PayMongo test credentials and webhook secret are set in hosted Supabase secrets.
   * Register the test webhook and verify the remote flow. Do not use local Supabase or Docker.

## Verification

1. Run focused Deno tests, Deno checks, formatting checks, and ESLint for changed files.
2. Run `npx tsc --noEmit` and `npx expo lint`; report existing unrelated failures separately.
3. Run the Expo web export and `git diff --check`.
4. Verify RLS denies cross user reads, inactive plan reads, client price or subscription writes, ledger access, and direct attendance inserts.
5. Verify Member App and Gym checkout, Coach App checkout, and denied Coach Gym checkout.
6. Verify a paid session uses the verified provider payment timestamp, extends one calendar month with end of month clamping, early renewal preserves time, expired renewal starts from payment time, duplicate events extend once, repeated cancellation returns the same state, access remains through expiry, and repurchase works after expiry.
7. Verify remote functions and a signed PayMongo test webhook only after required secrets and webhook setup are complete.

## Required User Actions

1. Rotate the PayMongo test secret and any exposed account or database password in their respective dashboards. Do not send replacement secret values in chat.
2. Set the rotated PayMongo credentials, webhook signing secret, and Supabase server credential in hosted Supabase Function secrets before remote function deployment.
3. Confirm the PayMongo test webhook endpoint can be registered after deployment.
4. Confirm trusted provisioning creates the required user and subscription rows for test Members and Coaches before end to end checkout tests.

## Notes

The prescribed `prompts/TEMPLATE.md` is absent. This plan follows the existing Phase 04 plan structure instead. No app code, migration, remote schema, secret, or function deployment is changed before plan approval.

## Result

The production baseline and dynamic pricing migrations were applied to the linked hosted project after confirming it was empty. Local checkout, cancellation, webhook, and paywall code is implemented and focused checks pass. Function deployment and end to end payment verification remain blocked until the exposed credentials are rotated, Clerk's hosted third party integration is confirmed, and the test webhook secret is configured.
