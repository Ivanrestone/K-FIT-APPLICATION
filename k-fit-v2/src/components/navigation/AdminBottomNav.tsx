// components/navigation/AdminBottomNav.tsx
import { FloatingTabBar, NavTab } from "./FloatingTabBar";

/** Add this much bottom padding to scroll content so the bar never covers it. */
export const ADMIN_NAV_CLEARANCE = 132;

const LEFT_TABS: NavTab[] = [
  {
    key: "home",
    label: "Home",
    icon: "home-outline",
    activeIcon: "home",
    route: "/admin/dashboard",
  },
  {
    key: "members",
    label: "Members",
    icon: "people-outline",
    activeIcon: "people",
    route: "/admin/members",
  },
];

const RIGHT_TABS: NavTab[] = [
  {
    key: "attendance",
    label: "Attendance",
    icon: "clipboard-outline",
    activeIcon: "clipboard",
    route: "/admin/attendance",
  },
  {
    // Fully applied: Payments tab is now here!
    key: "payments",
    label: "Payments",
    icon: "card-outline",
    activeIcon: "card",
    route: "/admin/payments",
  },
];

type AdminBottomNavProps = {
  /** Optional badge counts keyed by tab key, for example { members: 3 }. */
  badges?: Partial<Record<string, number>>;
};

export function AdminBottomNav({ badges }: AdminBottomNavProps) {
  return (
    <FloatingTabBar
      leftTabs={LEFT_TABS}
      rightTabs={RIGHT_TABS}
      scanRoute="/admin/scan-qr"
      badges={badges}
      navMode="replace"
    />
  );
}
