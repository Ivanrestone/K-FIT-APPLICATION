// components/navigation/CoachBottomNav.tsx
import { FloatingTabBar, NavTab } from "./FloatingTabBar";

const LEFT_TABS: NavTab[] = [
  {
    key: "home",
    label: "Home",
    icon: "home-outline",
    activeIcon: "home",
    route: "/coach/dashboard",
  },
  {
    key: "clients",
    label: "Clients",
    icon: "people-outline",
    activeIcon: "people",
    route: "/coach/clients",
  },
];

const RIGHT_TABS: NavTab[] = [
  {
    key: "requests",
    label: "Requests",
    icon: "mail-outline",
    activeIcon: "mail",
    route: "/coach/requests",
  },
  {
    key: "schedule",
    label: "Schedule",
    icon: "calendar-outline",
    activeIcon: "calendar",
    route: "/coach/appointments",
  },
];

type CoachBottomNavProps = {
  badges?: Partial<Record<string, number>>;
};

export function CoachBottomNav({ badges }: CoachBottomNavProps) {
  return (
    <FloatingTabBar
      leftTabs={LEFT_TABS}
      rightTabs={RIGHT_TABS}
      scanRoute="/coach/qr"
      badges={badges}
    />
  );
}
