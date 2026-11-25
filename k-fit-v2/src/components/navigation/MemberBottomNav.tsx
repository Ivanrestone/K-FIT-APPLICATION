// components/navigation/MemberBottomNav.tsx
import { FloatingTabBar, NavTab } from "./FloatingTabBar";

const LEFT_TABS: NavTab[] = [
  {
    key: "home",
    label: "Home",
    icon: "home-outline",
    activeIcon: "home",
    route: "/member/dashboard",
  },
  {
    key: "schedule",
    label: "Schedule",
    icon: "calendar-outline",
    activeIcon: "calendar",
    route: "/member/appointments",
  },
];

const RIGHT_TABS: NavTab[] = [
  {
    key: "challenges",
    label: "Challenges",
    icon: "trophy-outline",
    activeIcon: "trophy",
    route: "/member/challenges",
  },
  {
    key: "coach",
    label: "Coach",
    icon: "people-outline",
    activeIcon: "people",
    route: "/member/select-coach",
  },
];

type MemberBottomNavProps = {
  badges?: Partial<Record<string, number>>;
};

export function MemberBottomNav({ badges }: MemberBottomNavProps) {
  return (
    <FloatingTabBar
      leftTabs={LEFT_TABS}
      rightTabs={RIGHT_TABS}
      scanRoute="/member/qr"
      badges={badges}
    />
  );
}
