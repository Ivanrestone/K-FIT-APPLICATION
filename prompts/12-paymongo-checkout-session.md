# Phase 12: PayMongo Hosted Checkout Integration

Status: done

## Objective

Connect the Paywall UI "Subscribe" buttons to PayMongo's Hosted Checkout API (`v2/checkout_sessions`) via the Supabase Edge Function `create-checkout-session`, opening the checkout page in the browser via `expo-web-browser` (`WebBrowser.openBrowserAsync`).

## Scope

1. **Supabase Edge Function (`create-checkout-session`):**
   * Update request parsing to support `plan_type` alongside `feeType` and `user_id`.
   * Update the PayMongo `/v2/checkout_sessions` payload:
     * Add `paymaya` to `payment_method_types` (`["card", "gcash", "paymaya", "qrph"]`).
     * Set `send_email_receipt: true`.
     * Include `user_id` and `plan_type` in `metadata` along with existing internal identifiers (`kfit_user_id`, `kfit_fee_type`, `kfit_pricing_plan_id`, `kfit_amount_centavos`).
     * Ensure `success_url` and `cancel_url` deep link back to `k-fit://member-membership`.
   * Return both `checkout_url` and `checkoutUrl` in the JSON response.
2. **Frontend Paywall Integration (`src/components/SubscriptionPaywall.tsx`):**
   * Ensure the Subscribe button displays loading state ("Opening checkout…") and disables interaction while the checkout session is being generated.
   * Send `{ feeType, plan_type: feeType, user_id }` to `create-checkout-session`.
   * Open the validated PayMongo checkout URL using `WebBrowser.openBrowserAsync`.
   * Refresh subscription status and show user-facing status feedback upon returning from the browser.
3. **Deployment & Environment Instructions:**
   * Document exact Supabase CLI commands for the user to set `PAYMONGO_SECRET_KEY` in Supabase secrets and deploy `create-checkout-session`.

## Decisions

1. **Deno Edge Function Security & Parameter Compatibility:**
   The function will extract user identity from the verified Clerk JWT while supporting `user_id` from the body if provided. It will accept both `plan_type` and `feeType` (`"app"` or `"gym"`) to maintain compatibility.
2. **Payment Method Types:**
   Support the requested methods: `card`, `gcash`, `paymaya`, and `qrph`.
3. **Browser Mechanism:**
   Use `WebBrowser.openBrowserAsync(checkoutUrl.toString())` as requested in Phase 12, allowing in-app browser sessions across iOS and Android with automatic return via deep linking.
4. **Scope Boundary:**
   Webhook fulfillment is out of scope for Phase 12 as instructed. The focus is generating checkout sessions and opening the PayMongo hosted checkout page.

## Implementation Steps

1. **Update `supabase/functions/create-checkout-session/index.ts`:**
   * Add support for `plan_type` and `user_id` parameter aliases.
   * Include `"paymaya"` in `payment_method_types`.
   * Add `send_email_receipt: true` in PayMongo session attributes.
   * Add `user_id` and `plan_type` to `metadata`.
   * Return `checkout_url` in the response object.
2. **Update `src/components/SubscriptionPaywall.tsx`:**
   * Update `startCheckout` to handle `checkout_url` and invoke `WebBrowser.openBrowserAsync(checkoutUrl.toString())`.
   * Keep loading state indicators on the button ("Opening checkout…") and busy lock.
3. **Verification & Deployment Documentation:**
   * Type check with `npx tsc --noEmit`.
   * Run git diff checks.
   * Deploy function via `npx supabase functions deploy create-checkout-session`.

## Verification

1. ✅ Edge Function payload contains `payment_method_types: ["card", "gcash", "paymaya", "qrph"]`, `send_email_receipt: true`, and metadata (`user_id`, `plan_type`).
2. ✅ Edge Function returns `{ checkout_url, checkoutUrl, sessionId }`.
3. ✅ Frontend `SubscriptionPaywall.tsx` passes `plan_type` and `feeType`, validates the PayMongo URL, and invokes `WebBrowser.openBrowserAsync`.
4. ✅ TypeScript check (`npx tsc --noEmit`) passes with 0 errors.
5. ✅ Edge Function deployed to remote Supabase project: `npx supabase functions deploy create-checkout-session` succeeded.

## Result

Updated `create-checkout-session` with the PayMongo Hosted Checkout v2 attributes, including `paymaya`, `send_email_receipt: true`, metadata `user_id` & `plan_type`, and returning `checkout_url`. Updated `src/components/SubscriptionPaywall.tsx` to call the Edge Function with loading indicators and launch the checkout page using `WebBrowser.openBrowserAsync`. Deployed the updated function to the remote Supabase project.

## Notes

The referenced `prompts/TEMPLATE.md` is absent. This plan follows the existing Phase 05/10/11 plan structure. App code and Edge Function changes will only be written after user approval.
