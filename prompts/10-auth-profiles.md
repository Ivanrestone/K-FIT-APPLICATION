# Phase 10: Authentication and Member Profiles

Status: done

## Objective

Make Clerk sign in, sign out, account provisioning, profile data, and Coach requests work reliably for real K Fit accounts. Keep Clerk responsible for authentication and Supabase responsible for profile data and roles.

## Scope

1. Replace email based demo routing with routing based on the signed in user's Supabase role. Do not use dummy account addresses to select a dashboard.
2. Keep Google OAuth and email and password sign in. Add email and password account registration so new accounts can be provisioned.
3. Make Logout call Clerk `signOut`, clear any user scoped app state, and return to the login screen only after sign out completes.
4. Create a trusted first login provisioning flow that uses the Clerk user ID, email, first name, and last name to create the matching Supabase profile. Use empty values when Clerk does not provide a field.
5. Extend the `users` profile with email, first name, and last name fields. Allow a member to fill missing fields from the Profile UI without allowing them to change their role.
6. Ensure new Supabase profiles receive the `member` role from a trusted server side path. A client must never select or update its role.
7. Add a persistent Coach request status for members. Let a member submit one request and see that it is pending. Do not promote the member to Coach from the client.
8. Keep other Profile UI content and navigation unchanged unless it must change to replace dummy profile data or provide the requested editing and Coach request states.

## Decisions

1. Clerk remains the authentication provider. Supabase `users` remains the source of truth for application roles and profile data.
2. Provision profiles through a Supabase Edge Function using the signed in Clerk identity and a server side Clerk credential to retrieve the authoritative user fields. Store all credentials only in Supabase Function secrets.
3. The provisioning function creates a missing profile with role `member`, and updates profile fields only when creating the profile. Missing Clerk fields remain empty and are editable in the app. Later sign ins must not overwrite member entered profile values.
4. Add nullable email, first name, and last name columns to `users`. Preserve the existing `id` and `role` behavior.
5. Store Coach requests in a separate `coach_requests` table with a pending status and creation time. Members may view their own request and submit a request, but may not change its status or their role. Coach review and approval UI are out of scope.
6. Require explicit sign in after Logout and clear user scoped state. Use Clerk supported Google account selection behavior where available. Do not claim that app sign out clears Google cookies owned by the browser or operating system.
7. Do not apply schema changes to the remote Supabase project or deploy Edge Functions without separate confirmation after inspecting the remote project and required Function secrets.

## Implementation Steps

1. **Verify the current auth behavior**
   * Read the SDK 57 Clerk documentation for the installed `@clerk/expo` APIs before changing sign in or sign out.
   * Review the root Clerk provider, token cache, login route, Profile route, Supabase client, existing database migrations, and relevant Edge Function patterns.
   * Remove the login route's hard coded email to dashboard mapping. Route users using a successfully loaded Supabase role, and fail closed if the profile cannot be loaded or provisioned.
2. **Complete Clerk account flows**
   * Preserve the existing Google OAuth and email and password sign in paths.
   * Add email and password registration through Clerk, including loading and failure states.
   * Make Logout await Clerk `signOut`, clear user scoped UI and query state, then navigate to login. Prevent a prior local Clerk session from silently restoring after Logout.
   * Confirm and implement the Clerk supported Google account selection behavior. Do not work around Google browser session persistence by clearing unrelated browser data.
3. **Provision and sync profiles safely**
   * Add a migration for nullable profile fields and a `coach_requests` table with constraints, indexes, grants, and row level security.
   * Add a provisioning Edge Function that validates the caller's Clerk identity, fetches the Clerk profile on the server, and creates the Supabase row with role `member`.
   * Make provisioning safe to retry. Never accept a role from the client and never put a Clerk secret or Supabase service role key in the app bundle.
   * Call provisioning after successful sign in or registration. Show a retryable error and do not route into role protected content if provisioning fails.
   * Keep existing user profile fields when provisioning is retried. Leave missing email or name fields empty.
4. **Connect Profile UI**
   * Replace hard coded name and email values with the signed in member's Supabase profile.
   * Make missing email, first name, and last name editable, and save only those profile fields for the current user.
   * Add a Coach request action for members with no request. Show a pending status after successful submission, and prevent duplicate active requests.
   * Add loading, empty, and error states. A failed read or write must not show a false success state.
5. **Verify authorization and behavior**
   * Test role and profile boundaries locally before considering remote deployment.
   * Inspect the linked remote Supabase project before any migration is applied. Stop if it contains unexpected schema or data.
   * Deploy the provisioning function only after the user has approved the remote change and configured its Clerk secret in Supabase Function secrets.

## Verification

1. ✅ Focused ESLint check passed for `src/app/index.tsx`, `src/app/member-profile.tsx`, `src/hooks/use-member-profile.ts`, `src/hooks/use-logout.ts`, and `src/hooks/use-subscription-access.ts`.
2. ✅ `git diff --check` passed.
3. ❌ `npx tsc --noEmit` is blocked by the existing `src/app/member-qr.tsx:30` `NodeJS.Timeout` type error.
4. ❌ `npx expo lint` reports existing errors in `attendance.tsx`, `member-checkin.tsx`, `member-qr.tsx`, `member-workout.tsx`, `payments.tsx`, `trainers.tsx`, and `use-color-scheme.web.ts`. The edited auth/profile modules have no lint errors.
5. ❌ Edge Function type checking was unavailable because Deno is not installed.
6. ❌ App runtime flows, migration/RLS behavior, remote project configuration, and Edge Function deployment were not tested. No remote schema or function changes were applied.

## Required User Actions

1. Enable the Clerk third-party auth provider for the Supabase project with the correct Clerk domain; the checked-in local config currently has it disabled.
2. Before deploying the provisioning function, add `CLERK_SECRET_KEY` to Supabase Function secrets. Do not send the secret value in chat.
3. Inspect the linked Supabase project, then separately approve the migration and Edge Function deployment.
4. After configuration and deployment, exercise the sign-in, sign-out, provisioning, profile edit, and Coach request flows described above.

## Result

Implemented local Clerk email/password registration and sign-in, Google account selection, role-based routing after trusted profile provisioning, shared Clerk sign out, missing-profile-field editing, and persistent Coach requests. Added the local migration and Edge Function, but neither has been applied or deployed. End-to-end behavior remains unverified until Clerk third-party auth and the remote Supabase Function secret are configured.

## Notes

The referenced `prompts/TEMPLATE.md` is absent. This plan follows the existing Phase 05 plan structure instead. The plan was approved before implementation. Existing repository-wide lint and type-check failures are recorded above and were not changed as part of this work.
