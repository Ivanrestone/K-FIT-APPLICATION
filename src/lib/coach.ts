import type { Booking, BookingStatus } from "@/lib/bookings-store";

/* ───────────────────────── Types ───────────────────────── */

export type DutyStatus = "on_floor" | "in_session" | "on_break" | "off_duty";

export const DUTY_STATUSES: DutyStatus[] = [
  "on_floor",
  "in_session",
  "on_break",
  "off_duty",
];

export type CoachRecord = {
  id: string;
  name: string;
  email: string;
  specialty: string;
  bio: string;
  hourlyRate: number;
  dutyStatus: DutyStatus;
};

export type MemberRecord = {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Expired";
  plan: string;
  visits: number;
  lastVisit: string | null;
  nextSession: string | null;
};

export type SessionStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type SessionRecord = {
  id: string;
  coachId: string;
  memberId: string;
  memberName: string;
  focus: string;
  location: string;
  startsAt: string;
  durationMinutes: number;
  status: SessionStatus;
  notes: string | null;
};

export type ClassReservation = {
  id: string;
  memberId: string;
  memberName: string;
  checkedInAt: string | null;
};

export type ClassRecord = {
  id: string;
  coachId: string;
  title: string;
  category: string;
  room: string;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  status: "scheduled" | "cancelled";
  reservations: ClassReservation[];
};

export type RoutineExercise = {
  id: string;
  dayOfWeek: number;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  position: number;
};

export type RoutineRecord = {
  id: string;
  memberId: string;
  name: string;
  notes: string | null;
  exercises: RoutineExercise[];
};

export type MemberWorkoutSummary = {
  routines: RoutineRecord[];
  totalExercises: number;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  kind: string;
  readAt: string | null;
  createdAt: string;
};

export type AvailabilityWindow = {
  weekday: number;
  startMinutes: number;
  endMinutes: number;
};

/* ───────────────────────── Constants ───────────────────────── */

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DUTY_LABELS: Record<DutyStatus, string> = {
  on_floor: "On floor",
  in_session: "In session",
  on_break: "On break",
  off_duty: "Off duty",
};

/* ───────────────────────── Formatting ───────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0");

export function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function displayName(row: {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  id?: string | null;
}): string {
  const full = row.full_name?.trim();
  if (full) return full;
  const combined = [row.first_name, row.last_name]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ");
  if (combined) return combined;
  if (row.email) return row.email.split("@")[0];
  return row.id ?? "Unknown member";
}

export function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad(h)}:${pad(m)}`;
}

export function labelToMinutes(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 24 || mins > 59) return null;
  return hours * 60 + mins;
}

export function isoDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function timeOfDay(value: string): string {
  const date = new Date(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatSessionWhen(value: string): string {
  const date = new Date(value);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatClassWhen(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isUpcoming(value: string): boolean {
  return new Date(value).getTime() >= Date.now();
}

/** Combine a `YYYY-MM-DD` date and `HH:mm` time into an ISO timestamp. */
export function combineDateAndTime(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(time)) {
    return null;
  }
  const [hours, minutes] = time.split(":").map(Number);
  if (hours > 23 || minutes > 59) return null;
  const local = new Date(`${date}T00:00:00`);
  local.setHours(hours, minutes, 0, 0);
  return Number.isNaN(local.getTime()) ? null : local.toISOString();
}

/* ───────────────────────── Session ↔ Booking adapter ───────────────────────── */

const BOOKING_STATUS: Record<SessionStatus, BookingStatus> = {
  pending: "pending",
  confirmed: "confirmed",
  cancelled: "cancelled",
  completed: "completed",
  no_show: "no-show",
};

const SESSION_STATUS: Record<BookingStatus, SessionStatus> = {
  pending: "pending",
  confirmed: "confirmed",
  cancelled: "cancelled",
  completed: "completed",
  "no-show": "no_show",
};

export const bookingToSessionStatus = (status: BookingStatus): SessionStatus =>
  SESSION_STATUS[status];

export function sessionToBooking(
  session: SessionRecord,
  coachName: string,
): Booking {
  const start = new Date(session.startsAt);
  const end = new Date(start.getTime() + session.durationMinutes * 60_000);
  return {
    id: session.id,
    memberId: session.memberId,
    memberName: session.memberName,
    focus: session.focus,
    trainerId: session.coachId,
    trainerName: coachName,
    location: session.location,
    date: isoDate(start),
    start: timeOfDay(session.startsAt),
    end: timeOfDay(end.toISOString()),
    status: BOOKING_STATUS[session.status],
    notes: session.notes ?? undefined,
    createdAt: start.getTime(),
  };
}
