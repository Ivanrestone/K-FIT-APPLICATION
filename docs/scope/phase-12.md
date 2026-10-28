# Phase 12: PayMongo Hosted Checkout Integration

## Objective
Connect the unlocked "Subscribe" buttons on the Paywall UI to PayMongo's Hosted Checkout API (`/v2/checkout_sessions`), allowing users to securely pay for their subscriptions.

## Context
The user provided documentation for PayMongo Hosted Checkout v2. When a user clicks "Subscribe for PHP 190.00" or "Subscribe for PHP 1585.00", the app must call a Supabase Edge Function, generate a Checkout Session, and redirect the user to the returned `checkout_url` using Expo WebBrowser.

## Requirements

1. **Supabase Edge Function (`create-checkout-session`):**
   - Create (or update) an Edge Function that accepts `user_id`, `plan_type` (app or gym), and `price_id`/`amount`.
   - Make a POST request to `https://api.paymongo.com/v2/checkout_sessions` using the PayMongo Secret Key.
   - The payload must include:
     - `line_items`: Name of the subscription, amount in centavos, currency ("PHP"), and quantity (1).
     - `payment_method_types`: `["card", "gcash", "paymaya", "qrph"]`.
     - `success_url` and `cancel_url`: Deep links back to the K-Fit app.
     - `metadata`: Include the `user_id` and `plan_type` (crucial for webhook fulfillment later).
     - `send_email_receipt`: true.
   - Return the `checkout_url` to the client.

2. **Frontend Integration (`src/app/member-qr.tsx` or Paywall component):**
   - Update the "Subscribe" buttons to trigger the Edge Function on press.
   - Show a loading state while the session is generating.
   - Once the function returns the `checkout_url`, open it using `expo-web-browser` (`WebBrowser.openBrowserAsync`).

## Implementation Steps
1. Write the Supabase Edge Function code using Deno.
2. Provide me (the user) with the exact Supabase CLI commands to deploy the function and set the `PAYMONGO_SECRET_KEY` in the Supabase secrets environment.
3. Update the frontend Paywall component to call the function and handle the browser redirect.

IMPORTANT: Stop and wait for my approval on this plan before writing the code. Do not implement the Webhook fulfillment just yet; let's get the checkout page opening first.