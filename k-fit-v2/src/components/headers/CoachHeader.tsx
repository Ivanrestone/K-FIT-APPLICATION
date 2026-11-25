import { RoleHeader } from "./RoleHeader";

type Props = {
  unreadCount?: number;
  onSearchPress?: () => void;
};

export function CoachHeader({ unreadCount = 0, onSearchPress }: Props) {
  return (
    <RoleHeader
      role="coach"
      portalLabel="COACH"
      subtitle="TRAINER PORTAL"
      unreadCount={unreadCount}
      onSearchPress={onSearchPress}
    />
  );
}
