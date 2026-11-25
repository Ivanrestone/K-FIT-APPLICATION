# Payment System (Xendit) — K-Fit

Documentation for the Xendit membership payment flow, its Edge Functions, and the
non-obvious constraints that have already caused production bugs. Read this before
touching anything under `supabase/functions/` or the `payments`/`memberships` tables.

## Architecture

```
member/membership.tsx
  ├─ supabase.functions.invoke('get-payment-status')   → list own payments
  ├─ supabase.functions.invoke('create-gym-invoice')   → create Xendit invoice
  └─ WebBrowser.openBrowserAsync(checkout_url)         → user pays on Xendit

Xendit ──webhook──▶ supabase/functions/xendit-webhook
                     → mark payment paid/failed
                     → activate pending membership
```

All money amounts and plan prices are resolved **server-side** from
`membership_plans` — never trust client-supplied amounts.

## Edge Functions (`supabase/functions/`)

| Function | Auth | Purpose |
|---|---|---|
| `get-payment-status` | User JWT (manual check) | Returns caller's last 10 payments with membership join |
| `create-gym-invoice` | User JWT (manual check) | Creates pending `memberships` + `payments` rows, calls Xendit `/v2/invoices`, stores `checkout_url` |
| `xendit-webhook` | `x-callback-token` header vs `XENDIT_WEBHOOK_TOKEN` secret (`verify_jwt: false`) | Marks payment `paid`/`failed`, activates membership |

### CORS — required on every function called from the app

The app runs on **web** too, and `supabase.functions.invoke()` sends an
`Authorization` header → the browser issues an `OPTIONS` preflight. Every app-facing
function MUST:

1. Handle `OPTIONS` and return `200` with CORS headers.
2. Include `Access-Control-Allow-Origin` (and allowed headers/methods) on ALL responses.

Reference implementation (copy this pattern):

```ts
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // adjust methods
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  // ...
});
```

`xendit-webhook` is server-to-server (Xendit → Supabase) and does NOT need CORS.

### Deploying

```bash
npx supabase functions deploy <name> --yes   # --yes required in agent/non-interactive runs
npx supabase functions list                  # verify deployed version
npx supabase secrets list                    # check env secrets (names + digests only)
```

Code changes do nothing until deployed. Project is linked to
`Kfitaccounts` (ref `ahicsoctvqxcutjbvnfl`, production).

## Database constraints that WILL break inserts (learned the hard way)

The `payments` table has CHECK constraints that are NOT in the migrations folder
(tables predate the repo's migration history). Verified empirically on
2026-11-11 — do not assume other values are allowed:

- `payments.payment_method` — only `'cash'` and `'online'` confirmed working.
  `'xendit'`, `'gcash'`, `'maya'`, `'card'`, `'bank_transfer'`, `'manual'`, etc. FAIL.
  → Xendit payments use `payment_method: 'online'`; the gateway is recorded in the
  `gateway` column (`'xendit'`) instead.
- `payments.status` — `'pending'`, `'paid'`, `'failed'` work.
  `'expired'` and `'cancelled'` FAIL.
  → Expired Xendit invoices are stored as `status: 'failed'` with
  `gateway_status: 'EXPIRED'` (raw gateway status is preserved there).
- `memberships.status` — `'pending'` (insert) and `'active'` (webhook update) work.
- `payments` columns: `id, member_id, membership_id, amount, payment_method, status,
  reference_number, proof_url, verified_by, paid_at, created_at, historical_member_id,
  gateway, external_id, gateway_invoice_id, checkout_url, gateway_status, updated_at`
- `memberships` columns: `id, member_id, plan_id, start_date, end_date, status,
  created_at, historical_member_id`
- `memberships.member_id` / `payments.member_id` reference `members.id`, which equals
  the Supabase auth user id.

If richer enum values are needed, the CHECK constraints must be altered via a new
migration or dashboard SQL — they cannot be discovered via `supabase db dump`
(no Docker on this machine) or PostgREST.

## Payment lifecycle

1. `create-gym-invoice`: validates plan → reuses existing pending checkout for same
   plan (idempotent) → inserts `memberships` row with `status: 'pending'` → inserts
   `payments` row (`status: 'pending'`, `gateway: 'xendit'`, `external_id` = UUID,
   `reference_number` = same UUID) → creates Xendit invoice → stores
   `gateway_invoice_id`, `checkout_url`, `gateway_status` on the payment.
2. Xendit sends webhook → `xendit-webhook` matches by `external_id` (fallback
   `gateway_invoice_id`), updates payment, activates membership on `PAID`, marks
   `failed` on `EXPIRED`. Idempotent: `paid` rows are never reprocessed.
3. `get-payment-status` joins `memberships(plan_id, status, end_date)` for display.

## Environment / secrets

Edge functions (set via `supabase secrets`, NOT `.env`):

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — auto-provided
- `XENDIT_SECRET_KEY` — Xendit API secret (Basic auth, `key:` base64)
- `XENDIT_WEBHOOK_TOKEN` — must match the callback token configured in the Xendit
  dashboard for the webhook endpoint

Client `.env` (Expo): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`,
`EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (see DEBUGGING.md for why the prefix matters).

## Debugging notes

- `FunctionsFetchError: Failed to send a request` on web → almost always CORS
  (missing OPTIONS handler / ACAO header). Check function version was redeployed.
- `FunctionsHttpError` / HTTP 500 → function returned a generic error. The real cause
  is a DB constraint violation or missing secret; probe the table directly with the
  service-role key via PostgREST (`/rest/v1/<table>`) to reproduce — error responses
  include the Postgres `code` (e.g. `23514` = check violation, `23503` = FK).
- Edge function logs are only visible in the Supabase dashboard
  (Functions → function → Logs); the CLI has no `functions logs` command.
- Never trust `payments`/`memberships` enum values from memory — probe first.
