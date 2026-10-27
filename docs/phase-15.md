# Phase 15: Member App Premium Gold Theme Implementation

## Objective

Apply the new premium gold textured theme (established in Phase 14) to all member-facing screens, ensuring a consistent, high-end visual identity. **Crucially, this is a strict UI/design update only—no functional logic should be altered.**

## Context

In Phase 14, we successfully replaced the neon green accents in the Admin dashboard with a high-end gold texture (`gold-texture.jpg`). We now need to replicate this premium aesthetic on the member side of the app. 

Because the Member and Admin apps serve entirely different purposes, it is critical that we only touch the styling (CSS, ImageBackgrounds, colors) and leave all existing Member functionality exactly as it is.

## Requirements

1. **Strict Design-Only Constraint:**
   * Do NOT change any routing, database queries, state management, hooks, or component logic (like the PayMongo checkout).
   * The focus is 100% on visual components (Tailwind classes, inline styles, and React Native UI elements).

2. **Target Screens & Components:**
   * Update the member bottom navigation bar and all key member screens (e.g., Member Dashboard, Membership/Paywalls, Profile, Progress/Workouts).

3. **Primary Buttons:**
   * Replace flat green backgrounds on primary action buttons (like "Subscribe for PHP 1,585.00" or "Save Profile") with the `gold-texture.jpg` using `<ImageBackground resizeMode="cover">`.

4. **Navigation Tabs:**
   * Update the member bottom tab bar. The active tab indicator/background should now use the gold texture instead of the old neon green.

5. **Text & Icons Contrast:**
   * Any text or icons sitting *on top* of the gold texture must be changed to dark gray or black (e.g., `text-zinc-950` or `#09090b`) to ensure perfect readability.
   * For tiny accents where an `<ImageBackground>` isn't practical (like small icons or status text), use a fallback solid gold hex code (e.g., `#D4AF37`) instead of the old green.

## Implementation Steps

1. Scan the member directory (e.g., `src/app/(app)/(member)`) and shared components for the old green accent classes/colors.
2. Import the gold texture image using `require('../../assets/images/gold-texture.jpg')`.
3. Refactor primary buttons and active tabs to use `<ImageBackground>` with `overflow: 'hidden'` and the correct `borderRadius` so the texture stays inside the borders.
4. Update text/icon colors over the gold elements to ensure contrast.
5. **Final Review:** Double-check that no `onPress` actions or business logic were modified during the styling process.

IMPORTANT: Stop and wait for my approval before making the code changes.