export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

export const getInitials = (name?: string | null) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** "Today • 1:00 PM", "Tomorrow • 9:00 AM", or "Mon, Nov 24 • 4:30 PM". */
export function formatSessionTime(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return `Today • ${time}`;
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow • ${time}`;
  const day = d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${day} • ${time}`;
}

export const minutesUntil = (iso: string) =>
  Math.round((new Date(iso).getTime() - Date.now()) / 60000);
