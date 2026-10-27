/**
 * Every member route in ONE place.
 * Each value must match a file in src/app/, e.g. "/member-qr" -> src/app/member-qr.tsx
 */
export const MEMBER_ROUTES = {
  dashboard: "/member-dashboard",
  workout: "/member-workout",
  instructors: "/member-instructors",
  checkin: "/member-checkin",
  membership: "/member-membership",
  profile: "/member-profile",
  challenges: "/member-challenges",
  payments: "/member-payments",
  pass: "/member-pass",
  qr: "/member-qr",
} as const;
