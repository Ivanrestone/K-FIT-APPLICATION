import { create } from "zustand";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no-show";

export type Booking = {
  id: string;
  memberId: string;
  memberName: string;
  focus: string;
  trainerId: string;
  trainerName: string; // NEW
  location: string;
  date: string; // "YYYY-MM-DD"
  start: string; // "HH:mm" 24h
  end: string; // "HH:mm" 24h
  status: BookingStatus;
  notes?: string;
  createdAt: number;
};

/** Input for creating a new booking. */
export type CreateBookingInput = {
  memberId: string;
  memberName: string;
  focus: string;
  trainerId: string;
  trainerName: string;
  location: string;
  date: string;
  start: string;
  end: string;
  notes?: string;
};

type State = {
  bookings: Booking[];
  accept: (id: string) => void;
  decline: (id: string) => void;
  complete: (id: string) => void;
  markNoShow: (id: string) => void;
  reschedule: (id: string, date: string, start: string, end: string) => void;
  saveNotes: (id: string, notes: string) => void;
  /** NEW: member creates a booking request. Returns the new booking id. */
  createBooking: (input: CreateBookingInput) => string;
};

/* ---------------- Date helpers (no deps) ---------------- */
const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shiftDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDate(d);
};

const TODAY = shiftDays(0);
const TOMORROW = shiftDays(1);
const YESTERDAY = shiftDays(-1);
const NEXT_WEEK = shiftDays(7);

/* ---------------- Seed data ---------------- */
const seed: Booking[] = [
  // ── Yesterday (history) ───────────────────────────────
  {
    id: "B-000",
    memberId: "M-201",
    memberName: "Chris Ortega",
    focus: "Deadlift Technique",
    trainerId: "TR-101",
    trainerName: "Marcus Vance",
    location: "Floor 1",
    date: YESTERDAY,
    start: "10:00",
    end: "11:00",
    status: "completed",
    notes: "Pulled 180kg x3. Solid lockout.",
    createdAt: Date.now() - 90000000,
  },

  // ── Today ─────────────────────────────────────────────
  {
    id: "B-1",
    memberId: "M-101",
    memberName: "Sarah Jenkins",
    focus: "Hypertrophy Legs",
    trainerId: "TR-101",
    trainerName: "Marcus Vance",
    location: "Floor 1",
    date: TODAY,
    start: "11:00",
    end: "12:00",
    status: "confirmed",
    createdAt: Date.now() - 7200000,
  },
  {
    id: "B-2",
    memberId: "M-102",
    memberName: "Devon Miles",
    focus: "Powerlifting Bench",
    trainerId: "TR-101",
    trainerName: "Marcus Vance",
    location: "Floor 2",
    date: TODAY,
    start: "14:00",
    end: "15:00",
    status: "confirmed",
    createdAt: Date.now() - 6800000,
  },
  {
    id: "B-3",
    memberId: "M-103",
    memberName: "Alex Mercer",
    focus: "HIIT & Conditioning",
    trainerId: "TR-101",
    trainerName: "Marcus Vance",
    location: "Studio B",
    date: TODAY,
    start: "16:30",
    end: "17:30",
    status: "pending",
    notes: "Requested 30-min earlier if possible.",
    createdAt: Date.now() - 3600000,
  },

  // ── Tomorrow ──────────────────────────────────────────
  {
    id: "B-4",
    memberId: "M-104",
    memberName: "Priya Patel",
    focus: "Mobility & Rehab",
    trainerId: "TR-101",
    trainerName: "Marcus Vance",
    location: "Rehab Room",
    date: TOMORROW,
    start: "09:00",
    end: "10:00",
    status: "pending",
    createdAt: Date.now() - 5400000,
  },
  {
    id: "B-5",
    memberId: "M-105",
    memberName: "Liam Brooks",
    focus: "Squat Depth Work",
    trainerId: "TR-101",
    trainerName: "Marcus Vance",
    location: "Floor 1",
    date: TOMORROW,
    start: "13:00",
    end: "14:00",
    status: "confirmed",
    createdAt: Date.now() - 43200000,
  },

  // ── Next week ─────────────────────────────────────────
  {
    id: "B-6",
    memberId: "M-106",
    memberName: "Naomi Park",
    focus: "Olympic Lifts",
    trainerId: "TR-101",
    trainerName: "Marcus Vance",
    location: "Platform 2",
    date: NEXT_WEEK,
    start: "10:30",
    end: "11:30",
    status: "confirmed",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "B-7",
    memberId: "M-107",
    memberName: "Hana Kim",
    focus: "Core & Stability",
    trainerId: "TR-101",
    trainerName: "Marcus Vance",
    location: "Studio A",
    date: NEXT_WEEK,
    start: "15:00",
    end: "16:00",
    status: "pending",
    createdAt: Date.now() - 1800000,
  },

  // ── One cancelled (history) ───────────────────────────
  {
    id: "B-8",
    memberId: "M-108",
    memberName: "Jordan Ellis",
    focus: "Intro Assessment",
    trainerId: "TR-101",
    trainerName: "Marcus Vance",
    location: "Floor 1",
    date: TODAY,
    start: "18:00",
    end: "18:30",
    status: "cancelled",
    createdAt: Date.now() - 172800000,
  },
];

/* ---------------- Store ---------------- */
export const useBookingsStore = create<State>((set) => ({
  bookings: seed,

  accept: (id) =>
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, status: "confirmed" } : b,
      ),
    })),

  decline: (id) =>
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, status: "cancelled" } : b,
      ),
    })),

  complete: (id) =>
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, status: "completed" } : b,
      ),
    })),

  markNoShow: (id) =>
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, status: "no-show" } : b,
      ),
    })),

  reschedule: (id, date, start, end) =>
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, date, start, end } : b,
      ),
    })),

  saveNotes: (id, notes) =>
    set((s) => ({
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, notes } : b)),
    })),

  /** NEW: create a pending booking request. Returns the new booking id. */
  createBooking: (input) => {
    const id = `B-${Date.now().toString().slice(-6)}`;
    const booking: Booking = {
      id,
      memberId: input.memberId,
      memberName: input.memberName,
      focus: input.focus,
      trainerId: input.trainerId,
      trainerName: input.trainerName,
      location: input.location,
      date: input.date,
      start: input.start,
      end: input.end,
      status: "pending",
      notes: input.notes,
      createdAt: Date.now(),
    };
    set((s) => ({ bookings: [booking, ...s.bookings] }));
    return id;
  },
}));

/* ------------------------------------------------------------------ */
/* Pure list helpers                                                   */
/* ------------------------------------------------------------------ */
/* IMPORTANT:                                                         */
/* These take a Booking[] and return a new array. Do NOT pass them    */
/* directly into useBookingsStore(...) — that causes an infinite      */
/* re-render loop ("Maximum update depth exceeded").                  */
/*                                                                    */
/* Correct usage in screens:                                          */
/*   const all = useBookingsStore((s) => s.bookings);                 */
/*   const confirmed = useMemo(() => pickConfirmed(all), [all]);      */
/* ------------------------------------------------------------------ */

export const pickPending = (list: Booking[]) =>
  list.filter((b) => b.status === "pending");

export const pickConfirmed = (list: Booking[]) =>
  list.filter((b) => b.status === "confirmed");

export const pickTodayConfirmed = (list: Booking[]) => {
  const today = shiftDays(0);
  return list
    .filter((b) => b.status === "confirmed" && b.date === today)
    .sort((a, b) => a.start.localeCompare(b.start));
};

export const pickUpcoming = (list: Booking[]) => {
  const today = shiftDays(0);
  const nowHHMM = new Date().toTimeString().slice(0, 5);
  return list
    .filter(
      (b) =>
        (b.status === "confirmed" || b.status === "pending") &&
        (b.date > today || (b.date === today && b.end >= nowHHMM)),
    )
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
};

export const pickHistory = (list: Booking[]) =>
  list.filter(
    (b) =>
      b.status === "completed" ||
      b.status === "cancelled" ||
      b.status === "no-show",
  );

export const groupByDate = (list: Booking[]) =>
  list.reduce<Record<string, Booking[]>>((acc, b) => {
    (acc[b.date] ??= []).push(b);
    return acc;
  }, {});

/* ---------------- Formatting helpers ---------------- */

export const statusTone = (status: BookingStatus) => {
  switch (status) {
    case "confirmed":
      return "#22C55E";
    case "pending":
      return "#F59E0B";
    case "completed":
      return "#3B82F6";
    case "cancelled":
      return "#EF4444";
    case "no-show":
      return "#6B7280";
    default:
      return "#9CA3AF";
  }
};

/** "11:00" → "11:00 AM" */
export const to12h = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m)} ${period}`;
};

/** "2026-10-29" → "Thu, Oct 29" */
export const toDayLabel = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

/** Returns "TODAY" / "TOMORROW" / formatted date */
export const toRelativeDay = (iso: string) => {
  if (iso === shiftDays(0)) return "TODAY";
  if (iso === shiftDays(1)) return "TOMORROW";
  return toDayLabel(iso).toUpperCase();
};

/** Expose date helpers for screens that need them. */
export const dateHelpers = {
  pad,
  isoDate,
  shiftDays,
  today: () => shiftDays(0),
  tomorrow: () => shiftDays(1),
};
