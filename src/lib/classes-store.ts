import { create } from "zustand";

export type ClassStatus = "scheduled" | "cancelled" | "completed";
export type ClassLevel = "all" | "beginner" | "intermediate" | "advanced";
export type CheckInStatus = "reserved" | "checked-in" | "no-show";

export interface ClassReservation {
  id: string;
  classId: string;
  memberId: string;
  memberName: string;
  memberInitials: string;
  status: CheckInStatus;
  reservedAt: number;
  checkedInAt?: number;
}

export interface FitnessClass {
  id: string;
  title: string;
  coach: string;
  date: string;
  start: string;
  end: string;
  location: string;
  capacity: number;
  enrolled: number;
  level: ClassLevel;
  focus: string;
  notes?: string;
  status: ClassStatus;
  createdAt: number;
}

interface ClassesState {
  classes: FitnessClass[];
  reservations: ClassReservation[];
  addClass: (
    input: Omit<FitnessClass, "id" | "createdAt" | "enrolled" | "status">,
  ) => string;
  updateClass: (
    id: string,
    patch: Partial<Omit<FitnessClass, "id" | "createdAt">>,
  ) => void;
  cancelClass: (id: string) => void;
  completeClass: (id: string) => void;
  removeClass: (id: string) => void;
  setReservationStatus: (reservationId: string, status: CheckInStatus) => void;
  checkInAll: (classId: string) => void;
}

const pad = (n: number) => String(n).padStart(2, "0");
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const tomorrowIso = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const SEED: FitnessClass[] = [
  {
    id: "cls-seed-1",
    title: "Morning HIIT Blast",
    coach: "K-Fit Coach",
    date: todayIso(),
    start: "07:00",
    end: "08:00",
    location: "Studio A",
    capacity: 16,
    enrolled: 4,
    level: "intermediate",
    focus: "HIIT",
    notes: "Bring a towel and water bottle.",
    status: "scheduled",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "cls-seed-2",
    title: "Strength Foundations",
    coach: "K-Fit Coach",
    date: tomorrowIso(),
    start: "18:00",
    end: "19:15",
    location: "Weight Room",
    capacity: 12,
    enrolled: 3,
    level: "beginner",
    focus: "Strength",
    status: "scheduled",
    createdAt: Date.now() - 43200000,
  },
];

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

const SEED_RESERVATIONS: ClassReservation[] = [
  ["r1", "cls-seed-1", "m1", "Ava Chen", "reserved"],
  ["r2", "cls-seed-1", "m2", "Marcus Lee", "checked-in"],
  ["r3", "cls-seed-1", "m3", "Priya Patel", "reserved"],
  ["r4", "cls-seed-1", "m4", "Diego Santos", "no-show"],
  ["r5", "cls-seed-2", "m5", "Nora Kim", "reserved"],
  ["r6", "cls-seed-2", "m6", "Theo Brooks", "reserved"],
  ["r7", "cls-seed-2", "m7", "Lina Rossi", "checked-in"],
].map(([id, classId, memberId, memberName, status], i) => ({
  id: id as string,
  classId: classId as string,
  memberId: memberId as string,
  memberName: memberName as string,
  memberInitials: initialsOf(memberName as string),
  status: status as CheckInStatus,
  reservedAt: Date.now() - (i + 1) * 3600000,
}));

let seq = 100;
const nextId = () => `cls-${++seq}-${Date.now().toString(36)}`;

export const useClassesStore = create<ClassesState>((set) => ({
  classes: SEED,
  reservations: SEED_RESERVATIONS,
  addClass: (input) => {
    const id = nextId();
    set((s) => ({
      classes: [
        {
          ...input,
          id,
          enrolled: 0,
          status: "scheduled",
          createdAt: Date.now(),
        },
        ...s.classes,
      ],
    }));
    return id;
  },
  updateClass: (id, patch) =>
    set((s) => ({
      classes: s.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  cancelClass: (id) =>
    set((s) => ({
      classes: s.classes.map((c) =>
        c.id === id ? { ...c, status: "cancelled" } : c,
      ),
    })),
  completeClass: (id) =>
    set((s) => ({
      classes: s.classes.map((c) =>
        c.id === id ? { ...c, status: "completed" } : c,
      ),
    })),
  removeClass: (id) =>
    set((s) => ({ classes: s.classes.filter((c) => c.id !== id) })),
  setReservationStatus: (reservationId, status) =>
    set((s) => ({
      reservations: s.reservations.map((r) =>
        r.id === reservationId
          ? {
              ...r,
              status,
              checkedInAt: status === "checked-in" ? Date.now() : undefined,
            }
          : r,
      ),
    })),
  checkInAll: (classId) =>
    set((s) => ({
      reservations: s.reservations.map((r) =>
        r.classId === classId && r.status === "reserved"
          ? { ...r, status: "checked-in", checkedInAt: Date.now() }
          : r,
      ),
    })),
}));
