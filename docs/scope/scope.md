# Scope: K Fit

K Fit is an Expo app for gym members, coaches, and administrators to manage gym access and operations.

**Build approach:** Tracer Bullet (prove a thin path through the app, then expand).
**Workflow:** Beta (run verification, then tests).

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | App wide theme | Foundation | in-progress |
| 2 | Dynamic pricing and monthly paywalls | Payments | in-progress |

## Foundations

### 1. App wide theme · in-progress
Apply one black and neon green visual system to every existing screen and shared component while preserving app behavior and the approved splash, QR, kiosk, and status color exceptions.
**Done when:** all current UI uses the shared theme on Android, iOS, and web, linting prevents direct color literals in app UI, and verification and tests pass.
- [x] Design it (spec): `/architect app wide theme`
- [ ] Build it: `/develop app wide theme`
   - [ ] Unify shared tokens and fixed dark navigation theme (AC-2, AC-3)
   - [ ] Theme existing screens and shared UI components (AC-1, AC-5, AC-8, AC-9)
   - [ ] Preserve splash, QR, kiosk, and status color exceptions (AC-4, AC-6, AC-7)
   - [ ] Add lint enforcement for shared color tokens (AC-10)
- [ ] Verify it: `/check verify app wide theme`
- [ ] Test it: `/test app wide theme`
Spec [0001](../specs/0001-kfit-app-wide-theme.md)

## Payments

### 2. Dynamic pricing and monthly paywalls · in-progress
Keep App and Gym access independent, show versioned prices to Members and Coaches, and collect manual monthly payments through hosted Checkout.
**Done when:** Members can buy App and Gym access, Coaches can buy App access only, paid time and cancellation behave correctly, and remote access policies and payment handling are verified.
- [x] Design it (spec): `/architect dynamic pricing and monthly paywalls`
- [ ] Build it: `/develop dynamic pricing and monthly paywalls`
   - [x] Production safe schema, separate subscription tables, and versioned plans (AC-1, AC-2, AC-3, AC-8)
   - [ ] Role checked checkout, expiry, cancellation, and idempotent payments (AC-4, AC-5, AC-6, AC-7, AC-8)
   - [ ] Member and Coach dynamic paywalls and failure states (AC-2, AC-3, AC-4, AC-5, AC-9)
   - [ ] Remote migration, function deployment, and verification (AC-1 through AC-9)
- [ ] Verify it: `/check verify dynamic pricing and monthly paywalls`
- [ ] Test it: `/test dynamic pricing and monthly paywalls`
Spec [0002](../specs/0002-supabase-schema-and-access.md)

## Deferred
Out of scope for this build pass, kept so the plan stays honest.

## Legend

**The decision box.** Every feature carries exactly one decision box, the sub task whose label ends with `(spec)`. Every other box is an execution task.

**Feature lifecycle:** `planned` means the feature is queued, `in-progress` means design or implementation has started, and `done` means the required build and verification work is complete.
