// components/admin/theme.ts

export const Theme = {
  // Backgrounds
  background: "#080808", // Deepest dark (main app background)
  surface: "#121212", // Standard card backgrounds
  surfaceHigh: "#1A1A1A", // Elevated elements, input fields, inner cards

  // Typography
  text: "#FFFFFF", // Primary text
  textMuted: "#9CA3AF", // Secondary text, placeholders, subtitles

  // Brand Colors
  accent: "#FFD700", // K-FIT Gold (primary actions, highlights)
  accentText: "#000000", // Text color to use ON TOP of the accent color

  // Status Colors
  success: "#10B981", // Green (verified, active, online, paid)
  error: "#EF4444", // Red (delete, expired, failed)
  errorContainer: "rgba(239, 68, 68, 0.1)", // Soft red background for delete buttons
  warning: "#F59E0B", // Amber (pending, expiring) <--- THIS FIXES YOUR ERROR
  warningContainer: "rgba(245, 158, 11, 0.1)", // Soft amber background
  warningText: "#78350F", // Text on top of warning color
  info: "#3B82F6", // Blue (informational highlights)

  // Borders & Dividers
  border: "#222222", // Subtle borders for cards and inputs
  borderAccent: "rgba(255, 215, 0, 0.2)", // Gold-tinted border for highlighted elements
} as const;
