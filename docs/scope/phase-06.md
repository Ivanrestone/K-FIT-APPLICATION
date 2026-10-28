# Phase-06: Supabase CLI & Database Schema Setup

## Context
We are integrating Supabase as our backend database. The developer has already logged into the Supabase CLI locally. We need to initialize the local Supabase environment, create our initial database schema via migrations for the K-Fit app, and install the client SDK to connect the mobile app.

## Scope
- Initialize the Supabase CLI.
- Create a SQL migration file for three core tables: `users` (or `profiles`), `attendance_logs`, and `subscriptions`.
- Install `@supabase/supabase-js`.
- Set up the Supabase client connection utility in the Expo app.

## Steps

1. **Initialize Supabase & Install SDK:**
   - Run `npx expo install @supabase/supabase-js`.
   - Run `npx supabase init` to create the `supabase/` directory and config files.
   - Create a `src/utils/supabase.ts` file to initialize the Supabase client using environment variables (`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`).

2. **Create Database Migrations:**
   - Run `npx supabase migration new init_kfit_schema`.
   - In the newly generated SQL file, write the schema for:
     - `profiles`: id (UUID, matching Clerk user ID), role (text), created_at.
     - `subscriptions`: id, user_id (FK), app_subscription_status (boolean), gym_membership_status (boolean), valid_until.
     - `attendance_logs`: id, user_id (FK), scanned_by (FK), check_in_time, check_out_time.
   - Apply Row Level Security (RLS) policies: 
     - Members can only read their own attendance/subscriptions.
     - The `scanner` role (or authenticated door device) has `INSERT` privileges on `attendance_logs`.

3. **Apply the Migration:**
   - Run `npx supabase link --project-ref <REQUEST_FROM_USER>` (Ask the user for their Project Reference ID).
   - Run `npx supabase db push` to push the local migration to the remote Supabase database.

## Verification

- [ ] `supabase/migrations/` folder exists and contains valid SQL.
- [ ] `supabase db push` completes successfully without SQL syntax errors.
- [ ] The Expo app compiles successfully with the new `@supabase/supabase-js` dependency.

## You need to:
1. Provide the AI with your `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to put in the `.env` file.
2. Provide your Supabase Project Reference ID when the AI attempts to link the project.

## Test it yourself:
1. Go to your Supabase Dashboard online.
2. Navigate to the "Table Editor" tab.
3. **Expected:** You should see your newly created `profiles`, `subscriptions`, and `attendance_logs` tables ready to use.

## Result
Status: Pending Approval