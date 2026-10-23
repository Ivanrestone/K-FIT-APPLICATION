# Phase 13: PayMongo Webhook Fulfillment

## Objective
Create a Supabase Edge Function to listen for PayMongo webhook events and automatically activate the user's K-Fit subscription in the database when a payment succeeds.

## Context
In Phase 12, we successfully passed `user_id` and `plan_type` into the PayMongo Checkout Session `metadata`. Now, we need an endpoint that PayMongo can send a POST request to whenever a customer successfully pays.

## Requirements

1. **Supabase Edge Function (`paymongo-webhook`):**
   - Create a new Edge Function named `paymongo-webhook`.
   - The function must accept POST requests from PayMongo.
   - Extract the event type. We only care about `checkout_session.payment.paid`.
   - From the payload, extract `data.attributes.data.attributes.metadata.user_id` and `metadata.plan_type`.
   - **Important Security:** Use the Supabase Service Role Key (Admin) to bypass RLS when updating the database, since this request comes from PayMongo, not an authenticated app user.
   
2. **Database Fulfillment Logic:**
   - Based on the `plan_type` ("app" or "gym"), update the corresponding table (`subscriptions_app` or `subscriptions_gym`).
   - Set the `status` to `'active'`.
   - Update `current_period_start` to `now()`.
   - Update `current_period_end` to `now() + interval '1 month'`.
   - Return a `200 OK` response so PayMongo knows the webhook was received successfully.

## Implementation Steps
1. Write the `paymongo-webhook` Edge Function using Deno.
2. Provide me with the exact Supabase CLI command to deploy this new function.
3. Provide instructions on how I can find my Supabase Project URL so I can register the endpoint in the PayMongo dashboard.

IMPORTANT: Stop and wait for my approval on this plan before writing the code.