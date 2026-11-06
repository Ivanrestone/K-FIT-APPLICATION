# Phase 07: Supabase CLI Schema Workflow

## Context

K-Fit uses a hosted Supabase project for its database. Developers need a shared process for accessing the project, synchronizing its schema with the repository, and applying reviewed migration files.

This phase documents the Supabase CLI workflow only. The mobile app remains online only. It does not add local SQLite storage, offline data access, or queued writes. The Door Kiosk must stay online and send scans to the trusted verifier.

This workflow does not require starting a local Supabase service or using Docker. It uses the CLI to access the linked cloud database.

## Scope

- Onboard developers to the Supabase project.
- Authenticate the Supabase CLI and link the repository to the project.
- Pull the remote schema into local migration files when establishing or refreshing the baseline.
- Review and push approved migration files to the cloud.
- Keep database passwords, service credentials, and secret keys out of source control and chat.

Out of scope: an offline app database, PowerSync, WatermelonDB, local cache synchronization, background sync, offline kiosk scans, and app code changes.

## Developer workflow

### 1. Get project access

The project owner invites each developer through Supabase Dashboard organization settings. Developers accept the invitation and use their own Supabase account. Give each person only the permissions needed for their work.

Project reference:

```text
fbkqieclbrypiyufzhnv
```

### 2. Authenticate and link

From the repository root, each developer runs:

```powershell
npx supabase login
npx supabase link --project-ref fbkqieclbrypiyufzhnv
```

If the CLI asks for the database password, enter it in the local terminal prompt. Do not paste it into chat, commit it, or place it in an app environment variable.

### 3. Pull the cloud schema when needed

Review existing migrations before pulling:

```powershell
npx supabase migration list --linked
```

When setting up a clone or intentionally refreshing its schema baseline, run:

```powershell
npx supabase db pull
```

Review the generated migration files and migration history before committing them. This command pulls schema changes, not production rows. Depending on migration history, it may also update the remote migration history. Do not run it blindly when the repository already contains migrations that have not been reviewed.

### 4. Prepare a schema change

Create a migration file in the repository:

```powershell
npx supabase migration new <descriptive_name>
```

Add the SQL to the generated file under `supabase/migrations/`. Review the SQL and test it before it is considered ready for a cloud deployment.

### 5. Review and push migrations

First check migration history and preview the cloud change:

```powershell
npx supabase migration list --linked
npx supabase db push --dry-run
```

Confirm that the linked project is `fbkqieclbrypiyufzhnv` and that the dry run lists only the intended migrations. After review and approval, apply them:

```powershell
npx supabase db push
```

This changes the live cloud database. Never push an unreviewed migration. Do not use `--include-all` or `--include-seed` unless the specific change requires it and has been reviewed.

## Current migration warning

The initial K-Fit migration at `supabase/migrations/20261022150000_initial_kfit_schema.sql` has not been confirmed as applied to the cloud project. Its scanner policy currently accepts the `Scanner@gmail.com` email from any Supabase Auth issuer. That policy is not restricted to local development and must be corrected and reviewed before this migration is pushed to production.

Production kiosk scans must use the trusted verifier to validate TOTP, prevent replay, check both subscription flags, and write accepted attendance. The kiosk must not insert production attendance directly.

The Supabase JavaScript package is installed, but this phase does not establish that mobile requests are already wired to Clerk JWTs. That integration must be implemented and verified separately before treating it as complete.

## Verification

- [ ] Developers can authenticate with `npx supabase login`.
- [ ] Developers can link the repository using the project reference.
- [ ] `npx supabase db pull` generates reviewed schema migrations when a baseline refresh is needed.
- [ ] `npx supabase migration list --linked` shows the expected migration history.
- [ ] `npx supabase db push --dry-run` lists only the intended reviewed migrations.
- [ ] An approved `npx supabase db push` is reflected in the cloud migration history and schema.
- [ ] The mobile app remains online only, and production kiosk scans require the trusted verifier.

## You need to

1. Invite developers to the Supabase project with the least required access.
2. Give developers the project reference. Keep the database password private and enter it only in the local CLI prompt.
3. Correct and review the initial migration scanner policy before pushing it to production.
4. Implement and verify the Clerk JWT client integration separately if mobile database access is required.

## Test it yourself

1. From the repository root, run `npx supabase login`.
2. Run `npx supabase link --project-ref fbkqieclbrypiyufzhnv`.
3. Run `npx supabase migration list --linked` and confirm the intended project and migration history.
4. Run `npx supabase db push --dry-run` before any approved cloud push.

Expected: the CLI is linked to the K-Fit project, migration history is visible, and the dry run lists only migrations approved for the cloud database.

## Result

Status: Workflow documented. No cloud project was linked and no migration was pushed.
