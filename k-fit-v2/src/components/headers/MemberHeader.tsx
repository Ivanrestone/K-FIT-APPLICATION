import { RoleHeader } from "./RoleHeader";

type Props = {
  unreadCount?: number;
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
};

export function MemberHeader({
  unreadCount = 0,
  onSearchPress,
  onNotificationsPress,
}: Props) {
  return (
    <RoleHeader
      role="member"
      portalLabel="MEMBER"
      subtitle="MEMBER PORTAL"
      unreadCount={unreadCount}
      onSearchPress={onSearchPress}
      onNotificationsPress={onNotificationsPress}
    />
  );
}
