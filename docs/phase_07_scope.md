# Phase-07: Developer Workflow & Live Database Schema Sync

## Context
The K-Fit mobile application (for Members, Coaches, and Admins) and the Door Kiosk remain **strictly online**. We are abandoning the offline-first sync engine (PowerSync/WatermelonDB/SQLite) to avoid unnecessary local database complexity. This phase now focuses strictly on establishing the local development workflow using the Supabase CLI to pull and push schema migrations to the live Supabase project (`fbkqieclbrypiyufzhnv`).

## Scope
- Cancel and remove all planned mobile offline sync engine dependencies (SQLite, local cache background sync).
- Document the local developer setup for cloning, linking, and managing migrations against the live Supabase cloud database.
- Standardize the onboarding flow for team members joining the project.

## Developer Onboarding & Sync Workflow (SOP)

### 1. Supabase Dashboard Access
1. The project owner invites team members via **Organization Settings** -> **Team** -> **Invite a Member** in the Supabase Dashboard.
2. Invited developers accept the email invitation to gain access to project `https://fbkqieclbrypiyufzhnv.supabase.co`.

### 2. Local Terminal Authentication & Linking
When a developer pulls the latest repository code, they execute the following in their terminal:

1. **Authenticate CLI:**
   ```bash
   npx supabase login
   ```
2. **Link to Live Remote Project:**
   ```bash
   npx supabase link --project-ref fbkqieclbrypiyufzhnv
   ```
   *(Enter the remote database password when prompted).*

3. **Pull Remote Schema Changes to Local Repository:**
   ```bash
   npx supabase db pull
   ```

4. **Push New Local Schema Changes to Live Database:**
   ```bash
   npx supabase db push
   ```

### 3. Clerk JWT Template Configuration (Required for Supabase RLS)
To satisfy `- [x] Mobile app architecture remains strictly online-only using the Supabase JS Client with Clerk JWTs`:
1. In your **Supabase Dashboard** (`https://supabase.com/dashboard/project/fbkqieclbrypiyufzhnv`):
   - Go to **Project Settings** > **API**.
   - Copy the **JWT Secret**.
2. In your **Clerk Dashboard** (`https://dashboard.clerk.com`):
   - Go to **Configure** > **JWT Templates**.
   - Click **New template** and select **Supabase**.
   - Set the template name to `supabase` (lowercase).
   - Paste the **JWT Secret** copied from Supabase.
   - Leave the default claims (`aud: "authenticated"`, `role: "authenticated"`, `email`, `sub`).
   - Click **Save**.

## Verification
- [x] Mobile app architecture remains strictly online-only using the Supabase JS Client with Clerk JWTs.
- [ ] New developers can log in via `npx supabase login` and link to project `https://fbkqieclbrypiyufzhnv.supabase.co`.
- [ ] Migration changes pushed via `npx supabase db push` reflect instantly in the live Supabase dashboard.