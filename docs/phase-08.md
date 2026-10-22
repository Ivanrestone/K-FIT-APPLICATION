# Phase 08: PayMongo Payment Integration (Test Mode)

**Status:** In Progress

## Context

K-Fit needs monthly manual payments for App access and physical Gym access. PayMongo stays in test mode while the connected hosted Supabase project is prepared for production use. Members can buy both plan types; Coaches can buy App access only. Subscription access must expire from stored paid through dates rather than remain active indefinitely.

## Decision

Use Supabase Edge Functions for checkout, cancellation, and PayMongo webhooks, with PayMongo hosted Checkout Sessions. This reuses the existing Supabase backend and keeps payment credentials out of the Expo bundle. The app reads active prices through Clerk authenticated Supabase RLS; the checkout function independently chooses the active plan version and amount.

The initial App and Gym prices each display USD 3.00 and charge PHP 170.00 monthly. Price versions remain in the database after deactivation, with exactly one active version per type. Renewals are manual and each confirmed payment adds one calendar month from the later of payment time or current expiry. There is no automatic charge or payment method vaulting.

## Configuration

| Variable | Where it is used | Purpose |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Expo app environment | Existing Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_KEY` | Expo app environment | Existing public Supabase publishable key, used with Clerk-authenticated RLS requests |
| `PAYMONGO_SECRET_KEY` | Supabase Edge Function secret | PayMongo test API key used only to create Checkout Sessions |
| `PAYMONGO_WEBHOOK_SECRET` | Supabase Edge Function secret | PayMongo webhook signing secret used to authenticate events |
| `EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY` | Not required | Hosted Checkout does not require a PayMongo key in the app |

Set PayMongo test credentials only as hosted Supabase Edge Function secrets. Do not put them in Expo environment variables, `.env.local`, source control, or client code. Never use `EXPO_PUBLIC_` for a secret. Keep only variable names, without values, in any committed example configuration. Hosted Checkout does not use the PayMongo public key or amount secrets.

## Setup

1. Confirm in the Supabase dashboard that the linked hosted project is the intended production project and still has no application schema or migration records. Stop if it contains unreviewed data.
2. Apply the corrected production baseline and the pricing and renewal migration remotely. Do not use Docker, `npx supabase start`, or other local Supabase commands.
3. Keep `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` in the Expo app environment. Configure Clerk as a trusted third party JWT issuer in the hosted Supabase project.
4. Rotate the PayMongo test secret and any exposed account or database password before configuring remote secrets. Set the rotated PayMongo secret, webhook signing secret, and Supabase server credential only in hosted Supabase Function secrets. Do not send secret values in chat.
5. Deploy `create-checkout-session`, `cancel-subscription`, and `paymongo-webhook` to the linked hosted project after secrets are set.
6. Register the hosted `paymongo-webhook` URL in the PayMongo test dashboard for `checkout_session.payment.paid`. Do not configure a live PayMongo key or live webhook.
7. Confirm trusted Clerk provisioning creates a `users` row, an App subscription row for Members and Coaches, and a Gym subscription row for Members. Checkout must fail closed when required rows are absent.

## Payment flow

1. A signed in Member chooses App or Gym access. A Coach can choose App access only.
2. The app reads active plan versions through RLS and displays both the USD display price and PHP billing price. It sends only the plan type to checkout.
3. The checkout function verifies the Clerk identity and role, selects the active plan version, checks current expiry and cancellation state, then creates a one time PHP Checkout Session with the exact plan version in server created metadata.
4. The app opens the hosted URL. Closing checkout or returning through a success URL never grants access.
5. PayMongo sends a signed paid event. The webhook validates the raw body signature, test mode, session, plan version, amount, currency, and user metadata.
6. A restricted database function records the Checkout Session once and adds one calendar month to the relevant paid through date in the same transaction. It uses the verified provider timestamp on the paid payment object, rejects a missing or invalid timestamp, clamps month end to the last valid date, and does not extend access twice on webhook retry.
7. A signed in user can cancel a plan for the end of the paid period. Access remains through expiry, repeated cancellation returns the existing state, and another checkout is blocked until expiry. After expiry, the user may purchase again.
8. When the app returns, it reloads subscription state through its Clerk/Supabase RLS path. The browser return URL is informational only.

The checkout function does not change subscription state. The webhook does not trust client supplied member IDs, amounts, or plan IDs. Mobile clients retain no write permission to subscription state or payment records.

## Current implementation

1. The production baseline and dynamic pricing migration have been applied to the linked hosted project after confirming it had no tables or migrations.
2. The remote schema now has separate App and Gym subscriptions, active USD and PHP prices, a private payment ledger, an idempotent payment RPC, and a period cancellation RPC.
3. Local checkout reads the authoritative active plan, permits Member App/Gym and Coach App checkout, and blocks checkout during a canceled active period.
4. The webhook supports timestamped test signatures and the legacy raw body signature, requires the provider paid timestamp, and calls the idempotent payment RPC. Cancellation is handled by a separate authenticated Edge Function.
5. The Member membership screen and Member/Coach dashboards use a shared Clerk authenticated subscription reader. Dashboard content remains hidden unless App access is active.

## Verification completed

- `npx --yes deno test supabase/functions/_shared/paymongo_test.ts`: 6 passed, covering both signature forms, paid event parsing, rejected event cases, required timestamps, and PHP centavo parsing.
- `npx --yes deno check supabase/functions/create-checkout-session/index.ts supabase/functions/cancel-subscription/index.ts supabase/functions/paymongo-webhook/index.ts`: passed.
- Deno formatting checks for all changed Edge Function files: passed.
- ESLint for the changed subscription screens, component, and hook: passed.
- `npx expo export --platform web`: passed and bundled all 26 routes.
- `git diff --check`: passed.
- Remote catalog checks confirmed both migrations, all six expected tables, two seeded active plans at USD 3.00 and PHP 170.00, the own row and active price policies, no client insert/update grants, and service role only RPC execution.
- Full `npx expo lint` still reports existing errors in unrelated screens and hooks. Full `npx tsc --noEmit` still reports the existing `NodeJS.Timeout` error in `src/app/member-qr.tsx:30`; no changed payment files were reported.

## Remaining deployment and verification

1. Rotate the exposed PayMongo test credential and any exposed account or database password before setting hosted secrets. Never send replacement values in chat.
2. Confirm Clerk's Supabase third party integration and `authenticated` session claim in the hosted dashboards.
3. Configure the rotated PayMongo key, webhook signing secret, and Supabase server credential through hosted Function secrets, then deploy the three Edge Functions.
4. Register and exercise a signed PayMongo test webhook. The hosted payment and cancellation flows have not been end to end tested.
5. Verify Member and Coach permissions, monthly renewal dates, expiry, cancellation, duplicate delivery, and repurchase after expiry with provisioned test accounts.
6. Do not use Docker or local Supabase commands.

## Result

The dynamic pricing schema and seed plans are live in the hosted project, and the local checkout, webhook, cancellation, and paywall implementation passes focused checks. Edge Functions and payment flows are not deployed or end to end verified because the exposed credentials must be rotated and hosted Clerk trust must be confirmed first.
