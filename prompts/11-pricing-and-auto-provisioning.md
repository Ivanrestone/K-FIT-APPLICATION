# Phase 11: Pricing Update and Auto-Provisioning Subscriptions

Status: done

## Objective

Fix the Paywall UI by updating the Gym Membership pricing to USD 25.00 (PHP 1,585.00) and automatically provisioning default (inactive) subscription records in `subscriptions_app` and `subscriptions_gym` upon user creation, unlocking the PayMongo checkout buttons immediately for newly created and existing accounts.

## Scope

1. **Pricing Update (`pricing_plans`):**
   * Deactivate existing active `gym` row in `pricing_plans`.
   * Insert new active `gym` plan row: `display_amount = 25.00`, `display_currency = 'USD'`, `billing_amount_php = 1585.00`, `is_active = true`.
2. **Auto-Provisioning Subscriptions (Postgres Trigger & RPC):**
   * Create a PostgreSQL trigger function `public.handle_new_user_subscriptions()` and attach an `AFTER INSERT` trigger `on_user_created_subscriptions` to `public.users`.
   * The trigger automatically inserts rows into `public.subscriptions_app` and `public.subscriptions_gym` with `user_id = new.id`, `active = false`, `expires_at = null`, `cancelled_at = null`, using `ON CONFLICT (user_id) DO NOTHING`.
   * Update the `public.provision_user_profile` function in Supabase to also defensively ensure subscription rows exist whenever a profile is provisioned or refreshed.
   * Include a backfill statement in the migration to insert default subscription rows for all existing users currently in `public.users` missing subscription records.
3. **Frontend & Checkout Verification:**
   * Verify that `useSubscriptionAccess` in `src/hooks/use-subscription-access.ts` loads the provisioned subscription rows.
   * Verify that `SubscriptionPaywall` in `src/components/SubscriptionPaywall.tsx` transitions from "Setup needed" to "Not active", unlocking the "Subscribe for 1,585.00 PHP" checkout button.
   * Verify that `supabase/functions/create-checkout-session` accepts checkout requests for accounts with default subscription records without returning 404 "Your subscription record is not provisioned."

## Decisions

1. **Postgres Trigger on `public.users`:**
   A database trigger on `public.users` (`AFTER INSERT`) is chosen as the primary auto-provisioning mechanism because it is decoupled, authoritative, and guarantees subscription rows are created regardless of whether a user is created via the Clerk provisioning Edge Function, direct SQL, or any future webhook.
2. **Defense-in-depth via `provision_user_profile` & Backfill:**
   In addition to the insert trigger, `provision_user_profile` will ensure subscription rows exist upon profile sync, and the migration will backfill all existing users in `public.users`. This ensures zero orphaned users.
3. **Pricing Format Consistency:**
   `billing_amount_php` is stored as `1585.00` in `pricing_plans` (matching existing numeric column definition `numeric(10, 2)`), which `create-checkout-session` and `apply_paid_subscription_checkout` convert to `158500` centavos (`billing_amount_php * 100`). `display_amount` is `25.00` and `display_currency` is `'USD'`.

## Implementation Steps

1. **Create Supabase Migration (`supabase/migrations/20261023000000_gym_pricing_and_subscription_autoprovision.sql`):**
   * Retire active `gym` row in `pricing_plans` and insert new row (`display_amount: 25.00`, `display_currency: 'USD'`, `billing_amount_php: 1585.00`, `is_active: true`).
   * Create `handle_new_user_subscriptions` function and `on_user_created_subscriptions` trigger on `public.users`.
   * Update `provision_user_profile` to ensure default rows in `subscriptions_app` and `subscriptions_gym`.
   * Run one-time idempotent backfill for existing users in `public.users`.
2. **Verify Frontend Logic & Edge Functions:**
   * Inspect `src/components/SubscriptionPaywall.tsx` and `src/hooks/use-subscription-access.ts` to ensure no unexpected edge cases when `active: false`, `expiresAt: null`.
   * Verify `create-checkout-session` edge function compatibility with newly provisioned records.
3. **Validation & Checks:**
   * Run type checking and linting on modified files.
   * Apply migration to linked remote database via Supabase CLI.

## Verification

1. ✅ Migration applied to remote database: `npx supabase db push --linked` succeeded.
2. ✅ Pricing plan verification: `select plan_type, display_amount, display_currency, billing_amount_php, is_active from public.pricing_plans where is_active = true;` confirmed `gym` is active with USD 25.00 / PHP 1585.00.
3. ✅ Existing users backfilled: `subscriptions_app` and `subscriptions_gym` row counts match `users` count.
4. ✅ User creation trigger verified: executed test block inserting into `public.users`, verified both subscription rows were auto-created.
5. ✅ Profile provisioning RPC verified: executed test block calling `public.provision_user_profile`, verified profile role returned `member` and both subscription rows were ensured.
6. ✅ `npx tsc --noEmit` passed with 0 errors.
7. ✅ `git diff --check` passed with 0 errors.

## Result

Applied database migration `20261023000000_gym_pricing_and_subscription_autoprovision.sql`. Updated Gym Membership pricing to USD 25.00 / PHP 1,585.00. Added an `AFTER INSERT` trigger `on_user_created_subscriptions` and updated `provision_user_profile` to automatically provision default inactive records in `subscriptions_app` and `subscriptions_gym`. Backfilled existing users so that the Paywall UI immediately unlocks the checkout buttons without "Setup needed" errors.

## Notes

The referenced `prompts/TEMPLATE.md` is absent. This plan follows the existing Phase 05/10 plan structure. App code and migrations will only be written after plan approval.
