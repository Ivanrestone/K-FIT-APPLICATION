import { useMemberProfile } from "@/hooks/use-member-profile";
import { useUser } from "@clerk/expo";

/**
 * Placeholder stats shown in the header AND on the dashboard so they always match.
 * TODO: replace with real values once tier / streak / points exist in your database.
 */
export const MEMBER_PLACEHOLDER_STATS = {
  tier: "VIP",
  streakDays: 14,
  points: 1240,
};

/**
 * One call per screen. It loads the profile ONCE and gives you:
 *  - header:    spread into <MemberHeader {...header} />
 *  - profile:   the raw profile (firstName, lastName, email, role)
 *  - firstName: handy for greetings ("" if not loaded yet)
 */
export function useMemberHeaderData() {
  const { profile } = useMemberProfile();
  const { user } = useUser();

  const firstName = profile?.firstName?.trim() || user?.firstName?.trim() || "";
  const lastName = profile?.lastName?.trim() || user?.lastName?.trim() || "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Member";

  return {
    header: { name, ...MEMBER_PLACEHOLDER_STATS },
    profile,
    firstName,
  };
}
