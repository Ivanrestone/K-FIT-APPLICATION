# Phase 21: QR Pass Verification & Attendance Log Stabilization

Status: done

## Objective

Diagnose and resolve the "Pass rejected" error occurring during admin and kiosk QR code scanning, ensure TOTP verification succeeds in the Supabase Edge Function with clock skew tolerance and flexible payload parsing, correctly record check-in/check-out entries in `attendance_logs`, and display verified member feedback with real-time attendance dashboard updates and hardware door lock triggers.

## Decisions and constraints

- **Payload Compatibility:** Support both the canonical pipe-delimited format (`KFIT1|{memberId}|{counter}|{code}`) and JSON payload structures (`{"memberId": "...", "code": "...", "timestamp": ...}`) across client QR generation, admin/kiosk scanner parsing, and the Supabase Edge Function `attendance` handler.
- **Clock Skew Tolerance:** Increase the TOTP verification window tolerance from `window: 1` ($\pm 30$ seconds) to `window: 2` ($\pm 60$ seconds) in both the Edge Function (`attendance-totp.ts`) and the database RPC (`record_attendance_scan`) to accommodate clock drift between mobile devices, emulators, and Supabase servers.
- **Key Resolution:** Accept both `TOTP_ENCRYPTION_KEY` and `ATTENDANCE_ENCRYPTION_KEY` environment secrets when decrypting member TOTP seeds in the Edge Function.
- **Specific Error Reporting:** Replace generic "Pass rejected" errors with specific error codes and descriptive messages:
  - `EXPIRED_MEMBERSHIP`: When member subscriptions (`subscriptions_app` or `subscriptions_gym`) are inactive or expired.
  - `EXPIRED_TOTP`: When the QR time-step has lapsed beyond the allowable tolerance window.
  - `INVALID_TOTP`: When the cryptographic TOTP code does not match the decrypted secret.
  - `MEMBER_NOT_FOUND`: When the member record or pass secret is not provisioned.
  - `REPLAY_DETECTED`: When a time-step has already been consumed.
- **Test Account Activation:** Auto-activate subscriptions for seeded test accounts (`member@gmail.com`, `qrcode@gmail.com`, etc.) via database migration so development scanning succeeds without manual payment simulation.
- **Real-Time UI & Relay Integration:**
  - Upon successful verification (`outcome: check_in` or `check_out`), display "Pass Verified" with member name, action, and avatar/photo in `admin-scanner.tsx` and `(kiosk)/scanner.tsx`.
  - Trigger non-blocking LAN door unlock fetch via `triggerDoorUnlock()` supporting both `EXPO_PUBLIC_PI_LOCK_URL` and `NEXT_PUBLIC_PI_LOCK_URL`.
  - Emit an in-app attendance event so `useStaffAttendanceHistory` and `attendance.tsx` refresh immediately without waiting for the 30-second poll cycle.

## Scope

1. **Payload & Protocol Alignment:**
   - Update `parseAttendanceQr` in `supabase/functions/_shared/attendance-totp.ts` and `parseQrPayload` in `src/utils/totp.ts` to parse both `KFIT1|...` and JSON payload variants.
   - Update `admin-scanner.tsx` and `src/app/(kiosk)/scanner.tsx` to pre-validate payloads and pass normalized data to `useAttendance().scan`.

2. **Edge Function & Verification Stabilization:**
   - In `supabase/functions/attendance/index.ts`:
     - Allow both `TOTP_ENCRYPTION_KEY` and `ATTENDANCE_ENCRYPTION_KEY`.
     - Implement window tolerance of 2 ($\pm 60$s) in `counterIsCurrent` and TOTP check.
     - Return detailed error codes (`EXPIRED_MEMBERSHIP`, `INVALID_TOTP`, `MEMBER_NOT_FOUND`, etc.) and messages.
     - Include member name and avatar info in successful responses.

3. **Database Migration & RPC Updates:**
   - Create additive migration `supabase/migrations/20261107120000_phase21_qr_verification_stabilization.sql`:
     - Update `record_attendance_scan` to use step tolerance `> 2` (matching $\pm 60$s).
     - Return explicit `error` and `code` fields for all non-successful outcomes.
     - Ensure seeded test accounts have active subscriptions for testing.

4. **Scanner Feedback & Real-Time Sync:**
   - In `src/app/admin-scanner.tsx` and `src/app/(kiosk)/scanner.tsx`:
     - Render "Pass Verified" card with member name, photo/avatar badge, and check-in/out status.
     - Ensure `triggerDoorUnlock()` fires asynchronously upon verified scan.
   - In `src/hooks/use-attendance.ts`:
     - Add an attendance event emitter/listener to trigger immediate refetch across active staff history listeners upon a successful scan.

5. **Typecheck & Quality:**
   - Verify `npx tsc --noEmit` and focused ESLint pass cleanly.

## Implementation steps

1. Update `supabase/functions/_shared/attendance-totp.ts` and `src/utils/totp.ts` to handle both `KFIT1` and JSON payload formats, and expand window tolerance to $\pm 2$ steps ($\pm 60$s).
2. Create migration `supabase/migrations/20261107120000_phase21_qr_verification_stabilization.sql` updating `record_attendance_scan` with tolerance window 2, structured error codes, and test user subscription activation.
3. Update `supabase/functions/attendance/index.ts` to support fallback encryption key names, structured error responses, and member detail enrichment.
4. Enhance `src/hooks/use-attendance.ts` with real-time scan event dispatching and specific error propagation.
5. Upgrade `src/app/admin-scanner.tsx` and `src/app/(kiosk)/scanner.tsx` with "Pass Verified" UI, member photo/avatar display, and door relay triggering.
6. Verify type check and lint passes, and document test steps.

## Verification

- Type check `npx tsc --noEmit` passes.
- Focused ESLint on modified files passes.
- QR parsing handles both pipe-delimited `KFIT1|...` and JSON `{ memberId, code, timestamp }`.
- Scans return clear codes: `EXPIRED_MEMBERSHIP`, `INVALID_TOTP`, `MEMBER_NOT_FOUND`, `REPLAY_DETECTED`, `EXPIRED_TOTP`.
- Successful scan displays "Pass Verified" card and triggers attendance list refresh.

## Rollout / user configuration

- Deploy updated Supabase Edge Function `attendance`.
- Apply migration `20261107120000_phase21_qr_verification_stabilization.sql` to target Supabase instance.
- Ensure `TOTP_ENCRYPTION_KEY` or `ATTENDANCE_ENCRYPTION_KEY` is set in Supabase function secrets.
- Optionally configure `EXPO_PUBLIC_PI_LOCK_URL` in `.env.local` for door relay.

## Result

Stabilized QR pass verification and attendance recording across client, Edge Function, and database tiers.
- Unified QR payload parsing in `attendance-totp.ts` and `src/utils/totp.ts` to support canonical pipe-delimited format (`KFIT1|...`) and JSON payloads (`{ memberId, code, timestamp/counter }`).
- Expanded TOTP window tolerance to $\pm 2$ steps ($\pm 60$ seconds clock skew) in both the Edge Function and `record_attendance_scan` RPC.
- Accepted either `TOTP_ENCRYPTION_KEY` or `ATTENDANCE_ENCRYPTION_KEY` when decrypting secrets.
- Returned explicit, actionable rejection codes (`EXPIRED_MEMBERSHIP`, `INVALID_TOTP`, `MEMBER_NOT_FOUND`, `EXPIRED_TOTP`, `REPLAY_DETECTED`) instead of generic "Pass rejected" failures.
- Added database migration `20261107120000_phase21_qr_verification_stabilization.sql` updating `record_attendance_scan` and auto-activating subscriptions for seeded test accounts.
- Redesigned the scanner result overlay in `admin-scanner.tsx` and `(kiosk)/scanner.tsx` to show a high-visibility "Pass Verified" card with member initials/avatar, name, email, check-in/out badge, and door unlock indicator.
- Connected verified scans to asynchronous door unlock (`triggerDoorUnlock`) and real-time attendance update broadcasting via `subscribeToAttendanceUpdates`.
- All checks verified: `npx tsc --noEmit` and focused ESLint pass with 0 errors.
