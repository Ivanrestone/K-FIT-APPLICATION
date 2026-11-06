Following the updated rules in AGENTS.md, please copy `prompts/TEMPLATE.md` to create `prompts/10-auth-profiles.md`. 

Please include the following requirements in the plan:
1. **Fix Logout & Dummy Account Bug:** Ensure Clerk's `signOut()` completely clears the session and local cache so the app doesn't auto-login to a previous Google or dummy account.
2. **Auth Methods:** Fully support both Clerk Google OAuth and manual Email/Password login flows.
3. **Profile Syncing:** On first login, automatically pull the user's Email, First Name, and Last Name from Clerk to populate their K-Fit profile in Supabase. If fields are missing, leave them blank so the user can input them manually.
4. **Default Role:** All new accounts must default to the `member` role in the Supabase `users` table.
5. **Coach Request:** Add a "Request to become a Coach" button/status in the Profile UI for standard members.

IMPORTANT: Stop and wait for my approval on the generated markdown plan before you write any application code.