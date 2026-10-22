# 0002. Supabase Schema and Access Rules

**Date**: 2026-10-22
**Status**: In Progress

## Summary

This decision defines production safe Supabase access and monthly subscription billing. Clerk remains the member identity provider, while Supabase stores versioned prices, subscription expiry, cancellation intent, and successful payments. The first production schema must not allow direct kiosk attendance inserts.

## Context

> ⚠️ Premise note: This update covers the schema and access contract. Payment behavior is detailed in `docs/phase-08.md`, and paywall behavior is detailed in `docs/phase-09.md`. Manual renewal has no scheduled charge to cancel, so the selected cancel action records the end of the current paid period and blocks another manual checkout rather than canceling a provider subscription.

K-Fit uses Clerk for sign in and Supabase for relational data. Clerk user identifiers are text values, so Supabase policies compare rows with the signed JWT `sub` claim. App access and physical gym access are separate, and Members may buy both while Coaches may buy App access only.

The existing schema draft stores access only as booleans and has no prices, expiry dates, cancellation state, or payment ledger. The connected production Supabase project has no tables or migrations yet. Its initial schema must therefore be prepared before first application, and must not include the development scanner insert policy. PayMongo remains in test mode, with one time hosted checkout and monthly manual renewal.

## Requirements

**User stories**:
1. As a member or coach, I want to see the current plan price and expiry so that I know what access I am paying for.
2. As a member, I want to buy App and Gym access, while a coach can buy App access only.
3. As a subscriber, I want to renew manually, cancel renewal for the current period, and keep access through the paid expiry date.
4. As an administrator, I want to update plan prices in Supabase without shipping a new app version.

**Acceptance criteria**:
1. **AC-1**: The production baseline creates `users`, separate `subscriptions_app` and `subscriptions_gym`, and `attendance_logs` with the keys and ownership rules below, and grants no direct attendance insert to `anon` or `authenticated`.
2. **AC-2**: `pricing_plans` stores versioned App and Gym prices and permits exactly one active row per type. App is seeded at USD 3.00 and PHP 190.00; Gym is seeded at USD 3.00 and PHP 170.00.
3. **AC-3**: Authenticated Clerk clients can read only active pricing plans and their own profile and subscription. They cannot write prices, roles, subscriptions, or payment records.
4. **AC-4**: Subscription access is active only when its active flag is true and its paid through timestamp is later than the current time. Cancellation keeps access through that timestamp and blocks another checkout until expiry.
5. **AC-5**: Trusted backend code permits Members to buy App or Gym plans and Coaches to buy App plans only after trusted provisioning creates the user and applicable subscription rows. Client supplied prices, member IDs, or subscription state are never trusted.
6. **AC-6**: A successful manual payment, including an early renewal, extends access by one calendar month from the later of the provider payment timestamp or existing expiry. End of month dates clamp to the last valid date in the next month. A unique Checkout Session ledger record makes repeated webhooks idempotent.
7. **AC-7**: A signed in user can cancel only their own eligible plan. Cancellation does not revoke current paid access; a new manual purchase is allowed after expiry. Repeated cancellation requests return the existing cancellation state.
8. **AC-8**: Attendance IDs and timestamps are database generated, attendance history cannot be removed through cascading user deletion, and production attendance writes remain restricted to trusted verifier code.
9. **AC-9**: Pricing reads, subscription reads, cancellation, checkout, and webhook failures are surfaced without success shaped fallbacks. Missing user or subscription rows, missing payment timestamps, or missing active plan data have explicit unavailable states and cannot grant or start access. No local Supabase or Docker command is required for deployment.

## Options considered

### Option 1: Use UUID keys and `auth.uid()`

Store the member identity as a UUID and compare it with Supabase's authenticated user ID. (basis: Supabase ownership conventions and Clerk's text subject format)

**Pros**:
1. Uses PostgreSQL UUID keys and the standard Supabase ownership helper.

**Cons**:
1. Standard Clerk user IDs are text values such as `user_...`, not UUIDs.
2. It would require a second identity mapping and could break the Clerk to Supabase ownership check.

### Option 2: Use Clerk subject text and row level security

Store the Clerk JWT subject as text, compare it with `auth.jwt()->>'sub'`, and use Supabase row level security to scope table access. Keep prices in versioned rows and payment state in a trusted server ledger. (basis: existing Clerk integration and the current schema draft)

**Pros**:
1. Uses Clerk as the member identity provider without a duplicate identity mapping.
2. Keeps member data access checks in the database.

**Cons**:
1. Trusted server code is needed to provision user and subscription rows.
2. Trusted server functions and explicit migration ordering are required.

### Option 3: Use Supabase Auth as the canonical identity provider

Move member identities to Supabase Auth and map Clerk accounts to Supabase user IDs. (basis: Supabase Auth identity model)

**Pros**:
1. Uses Supabase's native UUID identity and ownership helpers.

**Cons**:
1. Adds a second account mapping and synchronization path while Clerk is already the app's identity provider.

### Option 4: Use automatic PayMongo subscriptions

Create a recurring provider subscription and let PayMongo collect each month. (basis: PayMongo subscription lifecycle and payment method requirements)

**Pros**:
1. Subscribers do not need to start checkout each month.
2. The provider owns recurring charge scheduling.

**Cons**:
1. This conflicts with the selected manual renewal behavior and adds payment method vaulting and provider cancellation state.
2. It creates additional provider lifecycle states that are not needed for the current product.

## Decision

**Chosen option**: Option 2: Use Clerk subject text and row level security.

Use text for Clerk IDs and their foreign keys. Members and Coaches use signed Clerk tokens for Supabase reads. Version prices in `pricing_plans`, keep subscription dates and payment idempotency in the database, and allow writes only through trusted Edge Functions. Use manual hosted Checkout, not automatic PayMongo subscriptions. The production baseline grants no direct attendance insert to authenticated clients. (basis: current Clerk integration, Supabase row level security, and idempotency for payment processing)

**Implementation skills**: `expo-data-fetching` (`Ivanrestone/K-FIT-APPLICATION`, `.agents/skills/expo-data-fetching/`) · `expo-native-ui` (`Ivanrestone/K-FIT-APPLICATION`, `.agents/skills/expo-native-ui/`) · `expo-ui` (`Ivanrestone/K-FIT-APPLICATION`, `.agents/skills/expo-ui/`)

## Rationale

The project already uses Clerk, and its Supabase integration supplies the user identifier in the JWT subject. Keeping that subject as text avoids a second identity mapping and lets database policies compare ownership directly. A versioned pricing table lets the app display current prices through RLS while the checkout function selects the authoritative active version.

Manual renewals fit the selected business flow and avoid storing payment methods for automatic charging. The payment ledger and a database transaction make webhook retries safe, while expiry and cancellation timestamps preserve paid access and prevent checkout during a canceled period. The remote project is empty, so the baseline can be corrected before first application without altering existing production data.

## Feature design

**Data model sketch**:

| Entity | Fields and constraints |
|---|---|
| `users` | `id text` primary key containing the Clerk JWT `sub`; `role text` required, defaults to `member`, and permits only `member`, `coach`, or `admin`; `created_at timestamptz` required, defaults to `now()` |
| `subscriptions_app` | `id uuid` primary key; unique `user_id text` foreign key to `users.id`; `active boolean` defaults to false; nullable `expires_at timestamptz` and `cancelled_at timestamptz` |
| `subscriptions_gym` | `id uuid` primary key; unique `user_id text` foreign key to `users.id`; `active boolean` defaults to false; nullable `expires_at timestamptz` and `cancelled_at timestamptz`; trusted backend permits Member roles only |
| `pricing_plans` | `id uuid` primary key; `plan_type text` limited to `app` or `gym`; positive `display_amount numeric(10,2)` and three letter `display_currency`; positive `billing_amount_php numeric(10,2)`; `is_active boolean`; generated `created_at`; partial unique index permits one active row per type |
| `subscription_payments` | Database generated UUID; unique PayMongo `checkout_session_id`; `user_id text` and `pricing_plan_id uuid` foreign keys; `plan_type`, paid PHP centavos, `paid_at`, and generated `created_at`; clients have no access |
| `attendance_logs` | `id uuid` primary key, generated by the database; `member_id text` required and a foreign key to `users.id`; `scan_timestamp timestamptz` required and defaults to `now()` |

Each user has zero or one App row and zero or one Gym row, plus many attendance rows. Each paid Checkout Session has at most one ledger row. The active App plan displays USD 3.00 and charges PHP 190.00; the active Gym plan displays USD 3.00 and charges PHP 170.00. Foreign keys use restrictive deletion so deleting a user cannot cascade away subscription, payment, or attendance history.

**State transitions**: A successful payment creates one ledger row and extends the matching plan by one calendar month from the later of the provider timestamp on the verified paid payment object or the existing expiry. PostgreSQL month addition clamps dates such as January 31 to the last valid day in February. A cancel request records cancellation intent without reducing access; a repeat returns the existing state. An active non-canceled plan permits early renewal. Checkout is blocked while a canceled period remains active; after expiry, a new manual purchase is allowed and clears the cancellation marker.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/rest/v1/users` | GET | JWT `sub` filter, page range | Own user row | Clerk JWT | 401 unauthenticated, 403 denied |
| `/rest/v1/subscriptions_app` | GET | JWT `sub` filter, page range | Own App active flag, expiry, and cancellation date | Clerk JWT | 401 unauthenticated, 403 denied |
| `/rest/v1/subscriptions_gym` | GET | JWT `sub` filter, page range | Own Gym active flag, expiry, and cancellation date | Clerk JWT | 401 unauthenticated, 403 denied |
| `/rest/v1/pricing_plans` | GET | Active plan filter | Active versions and display/billing prices | Clerk JWT, RLS | 401 unauthenticated, 403 denied |
| `/rest/v1/attendance_logs` | GET | JWT `sub` filter, ordered page range | Own attendance rows | Clerk JWT | 401 unauthenticated, 403 denied |
| `/functions/v1/create-checkout-session` | POST | `feeType: app or gym` | Hosted Checkout URL and session ID | Clerk JWT, Edge Function | 401, 403 role denied, 409 canceled active period, 502 provider error |
| `/functions/v1/cancel-subscription` | POST | `feeType: app or gym` | Cancellation confirmation and paid through date | Clerk JWT, Edge Function | 401, 403 role denied, 409 inactive plan |
| `/functions/v1/paymongo-webhook` | POST | Signed PayMongo event with provider paid timestamp | Idempotent payment ledger update | PayMongo signature | 400 invalid event or missing timestamp, 500 transient database error |
| `public.apply_paid_subscription_checkout` | RPC | Verified session, user, plan, PHP amount, paid time | Whether the unique payment was applied | Service role only | Invalid plan or price, missing subscription |

The app reads plans and its own subscription through the existing Supabase JavaScript client and Clerk JWT. The checkout function selects the active plan version on the server; the client never supplies a price or member ID. The webhook verifies the signed event and invokes the restricted RPC. A successful event is recorded and the expiry updated in one database transaction.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Read user | User identity, role, and creation time | `users` columns, scoped by the verified Clerk JWT `sub` |
| Read subscription | App or Gym status, paid through date, cancellation state | Own row in the matching subscription table; active is the flag plus expiry later than database time |
| Read active prices | Plan type, display amount/currency, PHP charge | `pricing_plans` active rows allowed by RLS |
| Read attendance | Attendance ID, member ID, and scan time | `attendance_logs` columns, scoped by the verified Clerk JWT `sub` |
| Create checkout | Member ID and plan type | Verified Clerk JWT subject and server validated role |
| Create checkout | PHP amount and exact plan version | Active `pricing_plans` row read by trusted function |
| Apply paid checkout | Checkout session, plan version, amount, and paid time | Signed PayMongo paid payment object, matched to its immutable plan version; reject if its provider timestamp is absent or invalid |
| Extend access | New paid through timestamp | Later of existing expiry or verified provider payment time, plus one PostgreSQL calendar month |
| Cancel plan | User ID and selected plan type | Verified Clerk JWT subject and request body; server checks role and current paid period |
| Attendance write | Verified member and accepted scan time | Trusted verifier after TOTP validation, replay prevention, and active subscription checks |

**Key invariants**:
1. `users.id` stores the Clerk JWT subject as text.
2. Each user has at most one row in each subscription table.
3. Each plan type has exactly one active price version; inactive versions remain available to verify pending checkouts.
4. App access requires `subscriptions_app.active` and `subscriptions_app.expires_at > now()`; Gym access uses the corresponding Gym row.
5. Only trusted backend code changes subscription flags, expiry, and cancellation state.
6. A successful Checkout Session can extend access only once, enforced by the unique ledger session ID and transaction.
7. An active non-canceled subscription can be renewed early; each successful payment adds one calendar month to the existing expiry, with end of month clamping.
8. A canceled active subscription cannot start another checkout, but a new purchase is allowed after expiry.
9. A successful payment uses the signed provider payment timestamp; an invalid or missing timestamp cannot activate access.
10. Repeating a cancellation request returns the existing cancellation state without changing its timestamp.
11. Coaches may buy App access only; Members may buy App or Gym access.
12. The production baseline grants no direct attendance insert to `anon` or `authenticated`.
13. The database generates attendance IDs and scan timestamps, and deleting a user cannot cascade delete history.

**Security model**:

1. Enable row level security on all public tables.
2. Authenticated Clerk users can select only rows whose owner matches `auth.jwt()->>'sub'`; plan reads are restricted to active versions.
3. Mobile clients cannot insert or update user roles, prices, subscriptions, or payment records. Trusted functions use a server side Supabase credential.
4. No scanner identity or development attendance insert policy is installed in the production baseline. Attendance writes require trusted verifier code.
5. The payment ledger is not readable or writable by `anon` or `authenticated`; the payment RPC is executable only by `service_role`.
6. Checkout and cancellation derive the user from the gateway verified Clerk subject and enforce the role and plan type server side.
7. Never bundle a Supabase service role credential, PayMongo secret, or kiosk password in the app. The public Supabase key is not an authorization boundary; row level security is.

**Configuration required**:
1. `EXPO_PUBLIC_SUPABASE_URL`: connected hosted Supabase project URL.
2. `EXPO_PUBLIC_SUPABASE_KEY`: public Supabase key used with the Clerk session JWT.
3. Clerk's Supabase integration: configured as a trusted third party JWT issuer in the hosted project.
4. `PAYMONGO_SECRET_KEY` and `PAYMONGO_WEBHOOK_SECRET`: rotated PayMongo test credentials stored only as hosted Supabase Edge Function secrets.
5. Supabase server credentials: available to trusted Edge Functions only; never bundled in the app.

**Critical test scenarios**:
1. Happy path: a provisioned Member reads active App and Gym prices and only their own subscription rows, verifies **AC-2**, **AC-3**, and **AC-5**.
2. Role permissions: a Coach can start App checkout but cannot buy Gym access; a Member can buy either, verifies **AC-5**.
3. Payment retry: a repeated signed event for one session creates one ledger row and extends the period once, verifies **AC-6**.
4. Renewal: early renewal adds one clamped calendar month to the existing expiry; an expired plan starts from provider payment time, verifies **AC-6**.
5. Invalid payment time: a missing or invalid provider timestamp cannot create an access grant, verifies **AC-6** and **AC-9**.
6. Cancellation: repeated requests return the same state, access remains through expiry, checkout is blocked during the canceled active period, and repurchase is permitted after expiry, verifies **AC-4**, **AC-7**, and **AC-9**.
7. Auth and permission: another user's rows, inactive price versions, client price writes, payment ledger access, and direct attendance inserts are denied, verifies **AC-1**, **AC-3**, and **AC-8**.
8. Provisioning: missing user or applicable subscription rows return a setup error and cannot start a payment, verifies **AC-5** and **AC-9**.
9. Data integrity: duplicate rows per user and deleting a user with attendance or payment history are rejected, verifies **AC-1** and **AC-8**.

## Build plan

1. Correct the unapplied baseline to remove the development scanner policy and authenticated attendance insert grant, and create separate App and Gym subscription tables. Add the versioned plans, expiry and cancellation fields, payment ledger, policies, and restricted payment RPC in one pricing migration, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-6**, **AC-7**, and **AC-8**.
2. Verify trusted provisioning creates the App row for Members and Coaches and the Gym row for Members. Extend hosted Edge Functions for role checked manual checkout, exact plan version validation, cancellation, and atomic idempotent payment application, satisfies **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, and **AC-9**.
3. Update Member and Coach paywalls to read active plans and own subscription status through the Clerk authenticated Supabase client, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**, and **AC-9**.
4. Apply migrations and deploy functions only to the linked remote project after confirming it remains empty and required rotated test secrets are configured; verify RLS and payment behavior online without Docker or local Supabase commands, satisfies **AC-1** through **AC-9**.

## Consequences

**Positive**:
1. Clerk identity remains the source of member ownership without a second UUID mapping.
2. Plan prices can change without an app release while checkout remains server priced.
3. Expiry, cancellation, and payment idempotency are represented in the database.
4. The production baseline cannot be bypassed with a direct Clerk attendance insert.

**Negative and tradeoffs**:
1. Trusted server code must provision users and subscriptions and perform production attendance writes.
2. Price changes require dashboard SQL and must preserve exactly one active plan version per type.
3. Subscription updates require a restricted database function and hosted Edge Function tests, not only TypeScript checks.

**Neutral**:
1. The Supabase JavaScript dependency is already present, so this decision does not require another package.
2. The schema does not store TOTP secrets or token replay records.

## Follow-up

1. Implement trusted Clerk user provisioning with idempotent handling before relying on automatic profile creation.
2. Design and build the production TOTP verifier and replay protection before enabling real kiosk attendance writes.
3. Keep Supabase server credentials and PayMongo secrets out of the mobile bundle and source control.
4. `expo-data-fetching` conventions are not referenced in root `AGENTS.md`; record them there before expanding app data fetching.
5. `expo-native-ui` conventions are not referenced in root `AGENTS.md`; record them there before broad UI work.
6. `expo-ui` conventions are not referenced in root `AGENTS.md`; record them there before broad UI work.

## References

**Project sources**:
1. `AGENTS.md`, Clerk identity, role, and secret handling rules.
2. `docs/phase-08.md`, PayMongo hosted checkout and webhook behavior.
3. `docs/phase-09.md`, Member and Coach paywall scope.
4. `supabase/migrations/20261022150000_initial_kfit_schema.sql`, the unapplied baseline to correct before production use.
5. Installed `expo-data-fetching`, `expo-native-ui`, and `expo-ui` skills.

**Practices & standards**:
1. Row level security for client data access.
2. Idempotency keys for payment processing.
3. Additive production schema rollout and fail closed authorization.

## Migration plan

**Strategy**: Big bang on the confirmed empty remote schema, followed by function deployment before app release.
**Phases**:
1. Reconfirm the hosted project has no application tables or migration records. Stop if it contains data or schema not covered here.
2. Apply the corrected baseline and the pricing migration to the linked remote project. Verify the seeded plans, grants, policies, and functions.
3. After exposed credentials have been rotated and hosted test secrets are configured, deploy the updated checkout, cancellation, and webhook functions.
4. Release the app only after remote RLS, role checks, webhook retries, expiry, and cancellation have been verified.
**Rollback**: Keep applied migrations and data. If functions fail, disable checkout and cancellation while fixing forward; do not redeploy the previous webhook, which grants access without expiry.
**Risks**: An unexpected remote table or migration means the empty project assumption is false. A missing or stale test secret prevents checkout. Manual dashboard price changes must deactivate the previous version and insert the new version in one transaction.
