# Phase 24: Admin Coach Onboarding Flow

**Branch Name:** `magneticlock`
**File Path:** `docs/scope/phase-24.md`

---

## 1. Admin Coach Onboarding Flow

- Wire `+ Add trainer` on the Admin Coaching Team screen to an Add Trainer modal.
- Search existing users with role `member` (by name, email, or member ID), enter specialty, bio, and hourly rate, set status to `on_floor`, update their role to `coach` in Supabase, and refresh Admin Coaching Team stats and Coach Directory.

## 2. Coach Booking, Availability & Sessions UI Fix

- Add `paddingBottom: 120` to the Coach Sessions scroll container so Approve/Decline buttons clear the floating QR dock.
- Add a live floor status switcher (`on_floor`, `in_session`, `on_break`) in Coach Workspace.
- Add a weekly Availability & Hours editor and a Reschedule option on pending session requests.
- Bind Coach Sessions and Trainers Directory to live Supabase data.

## 3. Fitness Class Management

- Add a Classes view in Coach Workspace to create, edit, and cancel group classes (title, category, date/time, room, max capacity) and view/check-in reserved members.

## 4. Workout Planning & Roster Client Details

- Tapping a member in Roster opens a Member Detail screen with membership status, visit history, and assigned workouts.
- Add a Workout Routine Builder (exercises, sets, reps, rest, day) to assign routines to members.

## 5. Fitness & Membership Reminders

- Add a `Send Reminder` button on `Expired` members in Roster and upcoming confirmed sessions (triggering Resend email + in-app notification).
- Wire the top-right notification bell icon to a Notification Center sheet.

## 6. Verification

- Verify with `npx tsc --noEmit` (0 errors).

---

## Result

Status: done (pending migration + function deploy).

- **Migration** `20261112090000_phase24_coach_operations.sql`: `coach_profiles`, `coach_availability`, `training_sessions`, `fitness_classes`, `class_reservations`, `workout_routines`, `workout_exercises`, `notifications`, staff RLS helpers (`is_staff`, `is_admin`, `current_app_role`), staff read access on `users`, and the `promote_member_to_coach` / `set_coach_duty_status` RPCs.
- **Data layer**: `src/lib/coach.ts` plus hooks `use-staff-supabase`, `use-coach-team` (team, member search, promotion, roster, own duty status), `use-coach-sessions` (+ availability), `use-coach-classes`, `use-member-detail`, `use-reminders` (reminder + notification center).
- **Admin**: `+ Add trainer` opens `AddTrainerModal` (search members by name/email/ID, specialty, bio, hourly rate), promotes through the RPC, then refreshes the live Coaching Team list and the Coach Directory.
- **Coach Sessions**: bound to `training_sessions`; approve/decline/complete/no-show, reschedule, notes and confirmed-session reminders persist; the scroll container keeps `paddingBottom: 120` above the QR dock.
- **Coach Workspace**: floor status switcher now writes `coach_profiles.duty_status`; the Schedule screen gained a weekly Availability & Hours editor; new `trainer-classes` screen creates/edits/cancels classes and checks reserved members in.
- **Roster**: live member rows, tap-through to `trainer-member/[memberId]` (subscriptions, visit history, assigned workouts with a routine builder), and a reminder button on expired members.
- **Notification Center**: the header bell now merges stored `notifications` with challenge notices and marks both read.
- **Edge Function**: `send-reminder` (Clerk-verified, staff-only) stores the in-app notification and sends the email through Resend when configured.

### Verification

- `npx tsc --noEmit`: 0 errors.
- `npx expo lint`: fails on the pre-existing repo baseline (110 errors, mostly `react-hooks/set-state-in-effect` and `react-hooks/refs` in untouched files such as `dashboard.tsx`, `use-revenue.ts`, `use-coach-request.ts`). New hooks follow the same data-loading pattern, so they report the same rule — not fixed here because the whole app shares it.

### Follow-ups

- Apply the migration and deploy `send-reminder` (`supabase db push`, `supabase functions deploy send-reminder --no-verify-jwt`), then set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` secrets.
- Admin Coaching Team still sends coach profile taps to the legacy `/trainers/[id]` route, which has no screen yet.
