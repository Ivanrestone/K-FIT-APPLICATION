# Phase 11: Pricing Update and Auto-Provisioning Subscriptions

## Objective
Fix the Paywall UI by updating the Gym Membership price and automatically creating default subscription records for new users so the PayMongo checkout buttons are unlocked immediately upon signup.

## Context
Currently, new users see a "Setup needed" error on the membership screen because their `subscriptions_app` and `subscriptions_gym` rows do not exist in Supabase. Additionally, the Gym Membership needs a pricing update to match $25.00 (1585 PHP).

## Requirements

1. **Database Migration / Seed Update (Pricing):**
   - Update the `pricing_plans` table for the Gym Membership.
   - Set the `display_price` to `USD 25.00`.
   - Set the `php_amount` to `158500` (which represents 1585 PHP in centavos).

2. **Auto-Provisioning Subscriptions (Database Trigger/Webhook):**
   - Modify the backend logic that handles new user creation (either the Clerk-to-Supabase sync function or a Supabase Postgres trigger on the `users` table).
   - Automatically insert a default row into `subscriptions_app` for the new `user_id` (defaulting to inactive/unpaid).
   - Automatically insert a default row into `subscriptions_gym` for the new `user_id` (defaulting to inactive/unpaid).

3. **UI Verification:**
   - Ensure the membership UI screen correctly reads these newly provisioned rows.
   - The PayMongo checkout buttons must be clickable (no longer grayed out with "Setup needed") for newly created accounts.

## Implementation Steps
1. Create a Supabase migration file to update the `pricing_plans` table with the new Gym Membership amounts.
2. Create or update the Supabase trigger/function (or Clerk webhook handler) to insert default rows into `subscriptions_app` and `subscriptions_gym` whenever a new user is added to the `users` table.
3. Run the database migrations locally.
4. Test the frontend Paywall UI with a newly created test account to confirm the checkout buttons are active.

## Verification
- [x] Gym Membership displays as USD 25.00 / PHP 1585 on the UI.
- [x] Creating a new account automatically creates rows in both subscription tables.
- [x] New accounts can immediately click the checkout buttons without seeing the "Setup needed" error.