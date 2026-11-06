# Phase 16: QR Attendance Scanner & Member Check-in Records

Status: approved

## Objective

Replace the placeholder QR scan and mock attendance views with a trusted check-in/check-out flow, and show persisted attendance history to members and authorized staff. Preserve the existing 30-second rotating QR, foreground concealment, Clerk identity, Supabase RLS, and trusted-backend-only attendance writes.

## Decisions and constraints

- Use offline-capable RFC 6238 TOTP generated on the member device. QR contains version, Clerk member ID, time-step, and six-digit code; it is not a static member identifier. Provision a per-member secret through an authenticated Edge Function and store it in the already-installed `expo-secure-store`. Add Expo SDK 57-compatible `expo-crypto` for secure secret generation; implement standard HMAC-SHA-1/TOTP in the project because Expo Crypto provides digest/random APIs, not HMAC. No third-party TOTP library.
- Encrypt the server copy of each TOTP secret at rest using an Edge Function secret. Never expose the encryption key or Supabase service-role key to the app. Missing keys, connectivity, subscriptions, or verification must fail closed.
- Validate Clerk JWT signature, issuer, and expiry before privileged Edge Function work; do not reuse the current `getVerifiedClerkUserId` helper as authorization because it only decodes claims. Check the authoritative `users.role` in Supabase for every privileged request.
- Preserve history by adding nullable `checkout_timestamp` to `attendance_logs`; use existing `scan_timestamp` as check-in, and derive displayed calendar date, year, and times from timestamps in `Asia/Manila`. IDs and timestamps remain database-generated; never cascade-delete attendance.
- A scan atomically consumes a TOTP time-step and toggles the member’s open attendance row. Only admin/coach may scan. Both App and Gym subscriptions must be active and unexpired for a check-in; a checkout must still be allowed for an already-open session. A repeated/expired/invalid QR never changes attendance.
- Staff can open a dedicated member profile from the member roster. Members see only their own history. Loading, error/retry, empty, and content states are required; failed reads never show success or grant access.
- Existing scanner presentation, K-Fit dashboard palette, and current member navigation are retained where practical. `prompts/TEMPLATE.md` is absent; this plan follows the existing numbered prompt convention.

## Scope

1. Member QR: replace the locally fabricated placeholder payload with a provisioned local TOTP secret and a rotating QR. Keep existing screen-capture concealment and clean up generation/countdown timers on unmount.
2. Trusted backend: additive migration for checkout, encrypted member TOTP secrets, replay-step tracking, and transactional attendance toggle; create authenticated secret-provisioning, scan, and attendance-history Edge Function operations. Validate role/subscription state server-side; expose no direct client attendance writes.
3. Admin scanner: send QR payload to the trusted verifier; show check-in vs check-out, member identity, invalid/expired/replayed/subscription-denied outcomes, and explicit offline/server errors. Stop repeat camera callbacks while a request is pending and resume after its result/cooldown.
4. Admin/member data: replace mocked attendance entries and manual client-side check-in/out with persisted history. Link roster rows to a dedicated member detail route. Show date, year, time in, and time out (open sessions show “In progress”) to staff and the signed-in member.
5. Tests: cover valid, expired, malformed, duplicate/replayed codes, inactive subscriptions, unauthorized roles, open/closed session toggle, error/empty history, and history privacy.

## Implementation steps

1. Implement and test shared RFC 6238 HOTP/TOTP generation and verification, secure secret provisioning/storage, and payload parsing. Verify known RFC test vectors and time-step boundaries.
2. Add an additive Supabase migration with encrypted per-member TOTP secret/replay state, nullable checkout timestamp, required indexes/constraints, and a restricted transactional attendance toggle. Preserve existing rows and RLS; no direct authenticated insert/update grants.
3. Implement authenticated Edge Function operations for secret provisioning, QR verification/attendance toggle, and attendance-history reads. Validate signed Clerk identity and database role; enforce subscription rules, replay prevention, and staff/member history access.
4. Wire the member QR screen and existing admin scanner to these operations. Retain secure hiding, timer cleanup, camera cooldown, and strict offline/error UI.
5. Replace mock history/check-in data and connect roster navigation to an authorized member attendance profile. Include loading, error/retry, empty, and populated states.
6. Run focused backend/TOTP tests, app typecheck and lint, and exercise valid/expired/replayed scans plus member/staff history access without deploying or applying a migration to a remote database.

## Verification

- The repository typecheck now passes after `src/app/member-workout.tsx` was updated to use fields present on `MemberProfile` and the shared placeholder header stats. Focused attendance ESLint passes; the roster retains three existing unused-code warnings.
- TOTP helper matches RFC 6238 vectors; payload/time-step is rejected outside the accepted clock window; timers are cleaned up on unmount.
- RFC TOTP, QR parsing, and time-window tests pass. A local pgTAP suite covers attendance transitions, subscription denial, replay protection, and member-history RLS privacy, but could not run because Docker/local Supabase is unavailable (Postgres at `127.0.0.1:54322` refused connection).
- Member/staff history loading, error, empty, and populated states are implemented; database authorization integration assertions are pending a local Supabase run.
- No remote migration, Edge Function deployment, or production mutation is part of this phase’s local implementation.

## User configuration / rollout

- Before release, set the TOTP encryption key as a Supabase Edge Function secret, apply the new migration to the intended Supabase project, and deploy the changed functions. Do not place server secrets in Expo environment variables. Existing issued placeholder QR codes will no longer be accepted; members must open the updated app to provision a secret.

## Result

Implemented the TOTP-backed member QR, authenticated staff scanner, fail-closed subscription and replay validation, and persisted member/staff history. Added an additive checkout/secret migration, member attendance route, and local pgTAP integration suite; fixed workout header profile typing. RFC 6238/payload/window tests, Edge Function checks, focused lint, and repository TypeScript pass. The pgTAP suite is not yet executed because the local Supabase Docker database is unavailable; no remote database migration or Edge Function deployment was performed.
