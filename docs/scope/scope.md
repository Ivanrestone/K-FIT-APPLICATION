# Scope: K Fit

K Fit is an Expo app for gym members, coaches, and administrators to manage gym access and operations.

**Build approach:** Tracer Bullet (prove a thin path through the app, then expand).
**Workflow:** Beta (run verification, then tests).

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | App wide theme | Foundation | in-progress |

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

## Deferred
Out of scope for this build pass, kept so the plan stays honest.

## Legend

**The decision box.** Every feature carries exactly one decision box, the sub task whose label ends with `(spec)`. Every other box is an execution task.

**Feature lifecycle:** `planned` means the feature is queued, `in-progress` means design or implementation has started, and `done` means the required build and verification work is complete.
