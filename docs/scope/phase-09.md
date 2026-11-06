# Phase 09: Member and Coach Subscription Paywalls

## Context
Members and Coaches need active App access for paid digital features. Members can separately buy Gym access for physical facility rights. Coaches can buy App access only. The interface reads plan prices and the current user's subscription from Supabase through Clerk authenticated row level security.

## Scope
- Show a dynamic paywall on the Member and Coach dashboard when App access is inactive or expired. Keep the existing dashboard visible when App access is active.
- Show Member App and Gym plans, and Coach App plan only. Display the plan display price and PHP charge.
- Keep the Member membership screen as the place to review both access plans, expiry dates, cancellation state, and payment actions.
- Use manual PayMongo hosted Checkout for one calendar month at a time. Refresh the subscription from Supabase after returning; a return URL is not proof of payment.
- Provide a cancellation action that preserves access through the paid expiry, prevents another checkout during that active period, and permits repurchase after expiry.
- Do not add route guards, QR generation, or QR access protection in this phase. This is a UI paywall, not full navigation authorization.

## Design and behavior

1. Read active `pricing_plans` rows through the existing Clerk authenticated Supabase client. RLS returns only active plan versions.
2. Read the signed in user's own `subscriptions_app` and, for Members, `subscriptions_gym` rows, including active flags, expiry dates, and cancellation timestamps.
3. App access is active only when its row flag is true and its expiry is later than the current time. Gym access is evaluated independently from its own row.
4. A successful payment extends the plan by one calendar month from the later of payment time or existing expiry. Repeated webhooks must not extend access twice.
5. A canceled plan remains active through its stored expiry. Do not offer another checkout while the canceled period remains active; allow purchase after expiry.
6. Show loading, error with retry, missing subscription, and content states. Do not present an error as an inactive plan.
7. If there are no active price plans, show an explicit unavailable state and do not offer checkout. If subscription status cannot be read, do not show paid dashboard content as active.
8. Keep the dashboard content and current route structure unchanged when a subscription is active. The paywall replaces the dashboard content when App access is inactive, without adding route redirects or guards.
9. Use the existing `@expo/ui` components and K-Fit theme conventions. Do not add a dependency.

## Build status

The shared subscription data hook, Member plan panel, and Member/Coach dashboard paywalls are implemented locally. Focused ESLint and the Expo web export pass. Interactive device testing and hosted payment verification remain pending the Edge Function deployment prerequisites in Phase 08.

## Implementation steps

1. Add a shared subscription data hook for active plans and the user's subscription state.
2. Update the Member payment panel and dashboard paywall for App and Gym plans.
3. Add the Coach App paywall to `trainer-dashboard`; reject Gym checkout for Coach roles in the backend.
4. Add cancellation and checkout actions using hosted Edge Functions. Refresh status after browser return and show delayed webhook confirmation.
5. Keep QR components and route guards deferred.

## Verification

1. An inactive Member sees App and Gym prices; an inactive Coach sees App price only.
2. An active App subscriber sees the existing dashboard; an expired App subscription sees the paywall.
3. A Member can start a Gym checkout; a Coach cannot.
4. Cancellation keeps access through expiry, blocks checkout during the remaining paid period, and allows repurchase after expiry.
5. Initial loading, error with retry, missing subscription, no active plans, checkout cancellation, and delayed webhook confirmation are visible and recoverable states.
6. A subscription read error never grants dashboard content.
7. No new QR component, QR generation behavior, or navigation guard is introduced.