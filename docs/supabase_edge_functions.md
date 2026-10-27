# Supabase Edge Functions & Secrets Cheatsheet

Project Reference: `fbkqieclbrypiyufzhnv`

This guide covers how to deploy and manage Supabase Edge Functions, configure backend environment secrets, and troubleshoot edge function runtime issues for K-Fit.

---

## 1. Deploying Edge Functions

Whenever you modify any function code under `supabase/functions/` (such as `provision-user`, `cancel-subscription`, `create-checkout-session`, or `paymongo-webhook`), you must deploy it to the live Supabase project.

### Deploy a Specific Function
```bash
npx supabase functions deploy provision-user --project-ref fbkqieclbrypiyufzhnv --no-verify-jwt
```
> **Note on `--no-verify-jwt`**:
> Because K-Fit handles authentication using Clerk tokens (which are decoded/verified manually or passed as custom bearer headers), Supabase gateway JWT verification is bypassed using `--no-verify-jwt` (configured in `supabase/config.toml`).

### Deploy All Functions at Once
```bash
npx supabase functions deploy --project-ref fbkqieclbrypiyufzhnv --no-verify-jwt
```

---

## 2. Managing Edge Functions

### List All Deployed Functions and Their Versions
Check which functions are active, their version numbers, and update timestamps:
```bash
npx supabase functions list --project-ref fbkqieclbrypiyufzhnv
```

### View Live Logs for an Edge Function
To view real-time execution logs and error messages from the remote function:
```bash
npx supabase functions logs provision-user --project-ref fbkqieclbrypiyufzhnv
```

---

## 3. Managing Edge Function Secrets

Edge functions run in an isolated Deno environment and read secrets via `Deno.env.get("KEY_NAME")`. These are managed separately from your local `.env`.

### List Current Secrets
```bash
npx supabase secrets list --project-ref fbkqieclbrypiyufzhnv
```

### Set or Update a Secret
```bash
npx supabase secrets set KEY_NAME=value --project-ref fbkqieclbrypiyufzhnv
```

Example for Clerk Secret Key:
```bash
npx supabase secrets set CLERK_SECRET_KEY=sk_test_... --project-ref fbkqieclbrypiyufzhnv
```

Example for PayMongo Keys:
```bash
npx supabase secrets set PAYMONGO_SECRET_KEY=sk_test_... --project-ref fbkqieclbrypiyufzhnv
npx supabase secrets set PAYMONGO_WEBHOOK_SECRET=whsec_... --project-ref fbkqieclbrypiyufzhnv
```

### Remove a Secret
```bash
npx supabase secrets unset KEY_NAME --project-ref fbkqieclbrypiyufzhnv
```

---

## 4. Database Migrations & RLS

When updating database schema or RLS policies:

### Push Local Migrations to Remote Database
```bash
npx supabase db push
```

### Pull Schema Changes from Remote Database
```bash
npx supabase db pull
```
