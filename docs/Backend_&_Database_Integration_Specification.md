**Date**: October 2026  
**Status**: Draft / Infrastructure Planning  
**Target Backend**: Supabase (PostgreSQL, Row Level Security, Edge Functions) & Clerk Identity

---

## 1. Overview

This document specifies the complete backend infrastructure required to power the K-Fit mobile application across all three user roles (**Member**, **Coach / Trainer**, **Admin / Gym Owner**) and the dedicated **Door Kiosk**.

The backend architecture consists of:
1. **Clerk Authentication**: Handles user identities, JWT tokens, and login/signup flows.
2. **Supabase Database (PostgreSQL with RLS)**: Sources of truth for profiles, subscriptions, attendance, challenges, trainer schedules, workout programs, POS transactions, and administrative memos.
3. **Supabase Edge Functions**: Isolated Deno runtimes for secure actions (PayMongo checkout creation, webhook payment processing, TOTP QR token verification, and role elevation approvals).

---

## 2. Required Supabase Database Tables & Columns

### 2.1 Identity & User Management

#### `users`
Stores user profile information, contact details, physical metrics, and assigned role.
* `id` (`text`, Primary Key): Clerk JWT `sub` (e.g., `user_2s...`).
* `email` (`text`, Unique, Nullable): User's primary email address.
* `first_name` (`text`, Nullable): Member's first name.
* `last_name` (`text`, Nullable): Member's last name.
* `phone` (`text`, Nullable): Contact phone number.
* `date_of_birth` (`date`, Nullable): Date of birth.
* `height_cm` (`numeric(5,2)`, Nullable): Height in centimeters.
* `emergency_contact` (`text`, Nullable): Emergency contact name and phone number.
* `membership_tier` (`text`, Default: `'Essential'`): Tier designation (`'Essential'`, `'Performance'`, `'Elite'`, `'VIP'`).
* `role` (`text`, Default: `'member'`): Enforces access control (`'member'`, `'coach'`, `'admin'`).
* `created_at` (`timestamptz`, Default: `now()`): Account creation timestamp.
* `updated_at` (`timestamptz`, Default: `now()`): Profile update timestamp.

#### `coach_requests`
Tracks requests submitted by members seeking elevation to Coach status.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Request identifier.
* `user_id` (`text`, FK -> `users.id`, Required): Requesting member ID.
* `status` (`text`, Default: `'pending'`): Request state (`'pending'`, `'approved'`, `'rejected'`).
* `reviewed_by` (`text`, FK -> `users.id`, Nullable): Admin who reviewed the request.
* `reviewed_at` (`timestamptz`, Nullable): Timestamp of approval/rejection decision.
* `created_at` (`timestamptz`, Default: `now()`): Request submission timestamp.

---

### 2.2 Subscriptions & Financial Ledger

#### `subscriptions_app`
Tracks software access rights for digital app features.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Subscription record ID.
* `user_id` (`text`, FK -> `users.id`, Unique, Required): Subscriber user ID.
* `active` (`boolean`, Default: `false`): Current active status flag.
* `expires_at` (`timestamptz`, Nullable): Paid period expiration timestamp.
* `cancelled_at` (`timestamptz`, Nullable): Cancellation timestamp.
* `created_at` (`timestamptz`, Default: `now()`): Record creation timestamp.

#### `subscriptions_gym`
Tracks physical facility access rights required for turnstile/gate check-in.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Subscription record ID.
* `user_id` (`text`, FK -> `users.id`, Unique, Required): Subscriber user ID.
* `active` (`boolean`, Default: `false`): Current active status flag.
* `expires_at` (`timestamptz`, Nullable): Paid period expiration timestamp.
* `cancelled_at` (`timestamptz`, Nullable): Cancellation timestamp.
* `created_at` (`timestamptz`, Default: `now()`): Record creation timestamp.

#### `pricing_plans`
Versioned catalog of subscription products and pricing.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Plan ID.
* `plan_type` (`text`, Required): Target access type (`'app'` or `'gym'`).
* `display_amount` (`numeric(10,2)`, Required): Price amount shown in UI (e.g. 3.00).
* `display_currency` (`text`, Required): Display currency code (e.g. `'USD'`, `'PHP'`).
* `billing_amount_php` (`numeric(10,2)`, Required): Exact charge amount in PHP (e.g. 190.00 for App, 170.00 for Gym).
* `is_active` (`boolean`, Default: `true`): Flag allowing exactly one active plan version per `plan_type`.
* `created_at` (`timestamptz`, Default: `now()`): Version creation timestamp.

#### `subscription_payments`
Idempotent payment transaction ledger for PayMongo checkout sessions.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Ledger entry ID.
* `checkout_session_id` (`text`, Unique, Required): PayMongo session ID preventing duplicate processing.
* `user_id` (`text`, FK -> `users.id`, Required): Payer user ID.
* `pricing_plan_id` (`uuid`, FK -> `pricing_plans.id`, Required): Purchased plan version ID.
* `plan_type` (`text`, Required): Purchased access type (`'app'` or `'gym'`).
* `paid_amount_php` (`numeric(10,2)`, Required): Confirmed paid amount in PHP.
* `payment_method` (`text`, Nullable): PayMongo payment channel (e.g. `'gcash'`, `'card'`, `'paymaya'`).
* `paid_at` (`timestamptz`, Required): Provider-verified payment timestamp.
* `created_at` (`timestamptz`, Default: `now()`): Database insertion timestamp.

---

### 2.3 Attendance, Gate Logs & Kiosk

#### `attendance_logs`
Logs all turnstile and door kiosk check-in/check-out events.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Attendance log ID.
* `member_id` (`text`, FK -> `users.id`, Required): Member checked in/out.
* `gate` (`text`, Default: `'Main Entrance'`): Access point identifier (`'Gate A'`, `'Gate B'`, `'Main Entrance'`, `'Studio Wing'`).
* `direction` (`text`, Default: `'IN'`): Flow direction (`'IN'` or `'OUT'`).
* `activity` (`text`, Default: `'Open gym'`): Activity type (`'Open gym'`, `'Personal training'`, `'Mobility Flow'`).
* `check_in` (`timestamptz`, Default: `now()`): Arrival timestamp.
* `check_out` (`timestamptz`, Nullable): Departure timestamp.
* `duration_min` (`integer`, Nullable): Session duration in minutes.
* `status` (`text`, Default: `'In progress'`): Attendance state (`'In progress'` or `'Completed'`).
* `scanned_by` (`text`, FK -> `users.id`, Nullable): ID of scanning Kiosk or Admin user.
* `scan_timestamp` (`timestamptz`, Default: `now()`): Scanning timestamp.

---

### 2.4 Challenges, Races & Community

#### `challenges`
Admin-created gym challenges and XP races.
* `id` (`text`, Primary Key): Challenge ID (e.g. `C-101`).
* `title` (`text`, Required): Challenge title.
* `target` (`text`, Required): Completion objective (e.g., "20 workouts completed").
* `points` (`integer`, Required): XP reward value.
* `created_at` (`timestamptz`, Default: `now()`): Creation timestamp.
* `ends_at` (`timestamptz`, Required): Challenge expiration timestamp.
* `created_by` (`text`, FK -> `users.id`, Required): Admin creator ID.

#### `challenge_participants`
Member progress and participation state in challenges.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Participant record ID.
* `challenge_id` (`text`, FK -> `challenges.id`, Required): Challenge reference.
* `user_id` (`text`, FK -> `users.id`, Required): Participant member ID.
* `progress_pct` (`integer`, Default: `0`): Completion progress (0 to 100).
* `status` (`text`, Default: `'joined'`): Participation status (`'joined'`, `'completed'`).
* `joined_at` (`timestamptz`, Default: `now()`): Enrollment timestamp.
* *Constraint*: Unique index on `(challenge_id, user_id)`.

#### `challenge_suggestions`
Trainer challenge suggestions awaiting admin approval.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Suggestion ID.
* `title` (`text`, Required): Proposed challenge title.
* `target` (`text`, Required): Proposed objective.
* `points` (`integer`, Required): Proposed XP reward.
* `days` (`integer`, Required): Proposed duration in days.
* `suggested_by` (`text`, FK -> `users.id`, Required): Suggesting coach ID.
* `status` (`text`, Default: `'pending'`): State (`'pending'`, `'published'`, `'dismissed'`).
* `created_at` (`timestamptz`, Default: `now()`): Submission timestamp.

#### `notices`
System broadcasts and target notifications.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Notice ID.
* `audience` (`text`, Required): Target audience (`'trainer'`, `'member'`, `'all'`).
* `icon` (`text`, Required): Feather icon identifier.
* `title` (`text`, Required): Notification title.
* `body` (`text`, Required): Notification body message.
* `created_at` (`timestamptz`, Default: `now()`): Publication timestamp.

---

### 2.5 Trainer Roster, Schedules & Workout Programs

#### `trainer_profiles`
Operational metrics and profile details for coaches.
* `user_id` (`text`, Primary Key, FK -> `users.id`): Coach user ID.
* `specialization` (`text`, Required): Specialty area (e.g., "Strength & Conditioning").
* `certification` (`text`, Required): Professional credentials (e.g., "NASM-CPT").
* `capacity` (`integer`, Default: `20`): Maximum client capacity.
* `working_hours` (`text`, Nullable): Operating hours schedule description.
* `duty_status` (`text`, Default: `'Off Duty'`): Current status (`'On Floor'`, `'In Session'`, `'On Break'`, `'Off Duty'`).
* `rating_avg` (`numeric(3,2)`, Default: `5.00`): Average rating.
* `review_count` (`integer`, Default: `0`): Total rating count.

#### `trainer_clients`
Active member assignments under a trainer.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Relationship ID.
* `trainer_id` (`text`, FK -> `users.id`, Required): Assigned coach ID.
* `client_id` (`text`, FK -> `users.id`, Required): Client member ID.
* `status` (`text`, Default: `'active'`): Assignment status (`'active'`, `'inactive'`).
* `assigned_at` (`timestamptz`, Default: `now()`): Assignment timestamp.

#### `trainer_sessions`
Scheduled 1-on-1 personal training sessions.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Session ID.
* `trainer_id` (`text`, FK -> `users.id`, Required): Coach ID.
* `client_id` (`text`, FK -> `users.id`, Required): Client member ID.
* `session_date` (`date`, Required): Date of training.
* `start_time` (`timestamptz`, Required): Session start time.
* `end_time` (`timestamptz`, Required): Session end time.
* `focus` (`text`, Required): Workout focus (e.g. "Hypertrophy Legs & Squats").
* `status` (`text`, Default: `'Upcoming'`): Status (`'In Progress'`, `'Upcoming'`, `'Completed'`, `'Cancelled'`).
* `weights_logged` (`text`, Nullable): Weight logs and notes.
* `feedback` (`text`, Nullable): Post-session coach feedback.

#### `workout_programs`
Custom workout programs built by coaches for members.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Program ID.
* `title` (`text`, Required): Program name (e.g., "Foundation Strength").
* `goal` (`text`, Required): Goal description.
* `duration_weeks` (`integer`, Default: `8`): Length in weeks.
* `sessions_per_week` (`integer`, Default: `4`): Weekly frequency.
* `trainer_id` (`text`, FK -> `users.id`, Required): Author coach ID.
* `assigned_member_id` (`text`, FK -> `users.id`, Required): Target member ID.
* `current_week` (`integer`, Default: `1`): Current progression week.
* `is_draft` (`boolean`, Default: `true`): Publication state.
* `created_at` (`timestamptz`, Default: `now()`): Creation timestamp.
* `updated_at` (`timestamptz`, Default: `now()`): Update timestamp.

#### `workout_exercises`
Individual exercises within a workout program.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Exercise record ID.
* `program_id` (`uuid`, FK -> `workout_programs.id`, Required): Parent program ID.
* `exercise_name` (`text`, Required): Name of exercise.
* `muscle_group` (`text`, Required): Target muscle group.
* `sets` (`text`, Required): Targeted sets count or range.
* `reps` (`text`, Required): Targeted rep count or range.
* `rest_seconds` (`text`, Required): Rest interval.
* `target_load` (`text`, Required): Target weight/load.
* `coaching_tip` (`text`, Nullable): Coaching cue.
* `sequence_order` (`integer`, Required): Exercise order in session.

#### `trainer_reviews`
Member ratings and written feedback for instructors.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Review ID.
* `trainer_id` (`text`, FK -> `users.id`, Required): Evaluated coach ID.
* `member_id` (`text`, FK -> `users.id`, Required): Reviewer member ID.
* `rating` (`integer`, Required): Star score (1 to 5).
* `comment` (`text`, Required): Written feedback.
* `created_at` (`timestamptz`, Default: `now()`): Submission timestamp.

---

### 2.6 Admin Invoices, POS & Broadcast Memos

#### `invoices`
Billing invoices and payment tracking.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Invoice UUID.
* `invoice_code` (`text`, Unique, Required): Readable reference (e.g. `"INV-261042"`).
* `user_id` (`text`, FK -> `users.id`, Required): Billed member ID.
* `description` (`text`, Required): Invoice description.
* `amount` (`numeric(10,2)`, Required): Amount due/paid.
* `date` (`date`, Required): Issue date.
* `status` (`text`, Default: `'Pending'`): Status (`'Paid'`, `'Pending'`, `'Overdue'`).

#### `pos_products`
Inventory catalog for gym point-of-sale items.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Product ID.
* `name` (`text`, Required): Item title.
* `category` (`text`, Required): Category (`'Supplements'`, `'Gear'`, `'Drinks'`, `'Snacks'`).
* `price` (`numeric(10,2)`, Required): Unit price.
* `icon` (`text`, Required): Feather icon name.
* `is_available` (`boolean`, Default: `true`): Inventory availability.

#### `pos_transactions`
Point-of-sale sales ledger.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Transaction ID.
* `tx_code` (`text`, Unique, Required): Transaction code (e.g. `"TX-90412"`).
* `user_id` (`text`, FK -> `users.id`, Nullable): Purchasing customer/member.
* `sold_by` (`text`, FK -> `users.id`, Required): Staff/Trainer seller ID.
* `payment_method` (`text`, Required): Payment channel (`'Card'`, `'Cash'`, `'Digital'`, `'Google Pay'`, `'NFC Card Tap'`).
* `total_amount` (`numeric(10,2)`, Required): Total transaction amount.
* `created_at` (`timestamptz`, Default: `now()`): Timestamp.

#### `memos`
Gym-wide announcement notices published by administrators.
* `id` (`uuid`, Primary Key, Default: `gen_random_uuid()`): Memo ID.
* `title` (`text`, Required): Memo headline.
* `content` (`text`, Required): Memo text body.
* `priority` (`text`, Default: `'Medium'`): Priority level (`'High'`, `'Medium'`, `'Low'`).
* `author_id` (`text`, FK -> `users.id`, Required): Author admin ID.
* `created_at` (`timestamptz`, Default: `now()`): Publication timestamp.

---

## 3. Required Supabase Edge Functions

To enforce zero-trust client security, sensitive actions run through serverless Edge Functions deployed with `--no-verify-jwt` (with internal Clerk JWT verification).

### 3.1 `provision-user`
* **Trigger**: Clerk Auth webhook on user creation or initial authenticated app launch.
* **Responsibilities**:
  1. Inserts a row in `users` with `id = clerk_id`, `role = 'member'`, and profile data.
  2. Idempotently provisions default inactive records in `subscriptions_app` and `subscriptions_gym`.
* **Security**: Executed with Supabase Service Role key.

### 3.2 `create-checkout-session`
* **Endpoint**: `POST /functions/v1/create-checkout-session`
* **Input**: `{ feeType: "app" | "gym" }`
* **Responsibilities**:
  1. Validates user session token via Clerk.
  2. Verifies user role (Coach can buy `app` only; Member can buy `app` or `gym`).
  3. Rejects request if subscriber currently has an active non-expired plan or active canceled period.
  4. Reads the authoritative price from `pricing_plans` (`is_active = true`).
  5. Invokes PayMongo API to create a hosted checkout session.
  6. Returns payment URL and session ID.

### 3.3 `cancel-subscription`
* **Endpoint**: `POST /functions/v1/cancel-subscription`
* **Input**: `{ feeType: "app" | "gym" }`
* **Responsibilities**:
  1. Validates user session token via Clerk.
  2. Updates `cancelled_at = now()` on the target subscription table without revoking paid access.
  3. Returns updated paid-through timestamp.

### 3.4 `paymongo-webhook`
* **Endpoint**: `POST /functions/v1/paymongo-webhook`
* **Input**: Signed PayMongo event payload (`checkout_session.payment.paid`).
* **Responsibilities**:
  1. Validates PayMongo HMAC signature (`PAYMONGO_WEBHOOK_SECRET`).
  2. Extracts `checkout_session_id`, `paid_at`, and payment amount.
  3. Calls PostgreSQL atomic RPC `apply_paid_subscription_checkout` to insert into `subscription_payments` and extend `subscriptions_app` or `subscriptions_gym` by 1 calendar month.

### 3.5 `verify-qr-checkin`
* **Endpoint**: `POST /functions/v1/verify-qr-checkin`
* **Input**: `{ qrData: "FORM|member_id|timestamp|hash", gate: string }`
* **Responsibilities**:
  1. Decodes QR token and checks timestamp freshness (valid for 15–30s).
  2. Verifies cryptographic signature/hash using secret HMAC key.
  3. Checks `subscriptions_app.active` AND `subscriptions_gym.active` for the member. Access is denied if either plan is inactive or expired.
  4. Enforces replay protection (ensures token has not already been scanned).
  5. Inserts an entry into `attendance_logs` (`direction = 'IN'`).
  6. Returns verification result (`{ success: true, memberName, status: "granted" }`).

### 3.6 `manage-coach-request`
* **Endpoint**: `POST /functions/v1/manage-coach-request`
* **Input**: `{ requestId: string, action: "approve" | "reject" }`
* **Responsibilities**:
  1. Validates caller is an Admin (`users.role == 'admin'`).
  2. Updates `coach_requests.status` and `reviewed_by`.
  3. If approved, updates `users.role = 'coach'` in the database.

---

## 4. API Calls & Queries Required per Role

### 4.1 Member Role (`app/(member)`)

| Screen / Feature | Operation | Target Table / Endpoint | RLS / Auth Constraint |
|---|---|---|---|
| **Member Dashboard** | `GET` | `users`, `subscriptions_app`, `subscriptions_gym`, `attendance_logs` | Reads own profile & access |
| **Profile Screen** | `GET / PATCH` | `users` | Read & update own `first_name`, `last_name`, `email` |
| **Coach Request** | `GET / POST` | `coach_requests` | Read own requests, insert new request |
| **Membership & Paywall** | `GET` | `pricing_plans` (`is_active = true`), `subscriptions_app`, `subscriptions_gym` | Read active prices & own subscription dates |
| **Buy App / Gym Plan** | `POST` | `/functions/v1/create-checkout-session` | Authenticated Clerk JWT |
| **Cancel Plan** | `POST` | `/functions/v1/cancel-subscription` | Authenticated Clerk JWT |
| **QR Pass Display** | Local TOTP | Generates `FORM|member_id|timestamp|hash` | Unmounts/blurs on backgrounding |
| **Check-in History** | `GET` | `attendance_logs?member_id=eq.{userId}` | Read own attendance history |
| **Workout Program** | `GET` | `workout_programs`, `workout_exercises` | Read assigned workout programs |
| **Challenges & Leaderboard**| `GET / POST` | `challenges`, `challenge_participants` | Read challenges, join challenge |
| **Instructor Reviews** | `GET / POST` | `trainer_profiles`, `trainer_reviews` | Read coach profiles & submit reviews |

---

### 4.2 Coach / Trainer Role (`app/(trainer)`)

| Screen / Feature | Operation | Target Table / Endpoint | RLS / Auth Constraint |
|---|---|---|---|
| **Trainer Dashboard** | `GET / PATCH` | `trainer_profiles?user_id=eq.{userId}` | Update own duty status (`'On Floor'`, `'In Session'`, etc.) |
| **Member Roster** | `GET` | `trainer_clients` joined with `users`, `subscriptions_gym` | Read assigned client list & gym access status |
| **Training Schedule** | `GET / POST` | `trainer_sessions?trainer_id=eq.{userId}` | Read & update personal training sessions |
| **Workout Builder** | `GET/POST/PATCH`| `workout_programs`, `workout_exercises` | Create & publish workout programs for clients |
| **Suggest Challenge** | `POST` | `challenge_suggestions` | Insert challenge idea for admin review |
| **Trainer POS** | `GET / POST` | `pos_products`, `pos_transactions` | Read product catalog & log retail sales |
| **Team Roster** | `GET` | `trainer_profiles` joined with `users` | Read duty statuses of fellow trainers |

---

### 4.3 Admin / Gym Owner Role (`app/(admin)`)

| Screen / Feature | Operation | Target Table / Endpoint | RLS / Auth Constraint |
|---|---|---|---|
| **Admin Dashboard** | `GET` | `attendance_logs`, `users`, `invoices`, `subscription_payments` | Full aggregate view of gym metrics |
| **Member Management** | `GET / POST` | `users`, `/rpc/provision_user_profile` | Manage all members, view active/pending status |
| **Coach Approvals** | `GET / POST` | `coach_requests`, `/functions/v1/manage-coach-request` | Approve or reject member requests for Coach role |
| **Door Kiosk / Scanner** | `POST` | `/functions/v1/verify-qr-checkin` | Validate TOTP QR token, check dual plans, log scan |
| **Memberships Admin** | `GET / PATCH` | `subscriptions_app`, `subscriptions_gym`, `pricing_plans` | Manage member billing states & price versions |
| **Challenges & Races** | `POST / DELETE` | `challenges`, `challenge_suggestions` | Create/end challenges, approve suggestions |
| **Payments & Revenue** | `GET` | `invoices`, `subscription_payments`, `pos_transactions` | View revenue breakdown and collect dues |
| **Broadcast Memos** | `GET/POST/DELETE`| `memos` | Publish and remove announcements |

---

## 5. Next Steps for Phase 16 Execution

1. **Database Migration**: Deploy schema SQL creating all 18 tables, indices, RLS policies, and RPC functions (`apply_paid_subscription_checkout`, `provision_user_profile`).
2. **Edge Functions Deployment**: Deploy `provision-user`, `create-checkout-session`, `cancel-subscription`, `paymongo-webhook`, `verify-qr-checkin`, and `manage-coach-request` to Supabase project `fbkqieclbrypiyufzhnv`.
3. **Frontend Hook Integration**: Connect React Native UI components to Supabase data streams and Edge Functions, replacing mock data across Admin, Coach, and Member screens.
