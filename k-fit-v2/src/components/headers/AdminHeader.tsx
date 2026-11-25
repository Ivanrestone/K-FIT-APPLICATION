import { RoleHeader } from "./RoleHeader";

type Props = {
  unreadCount?: number;
  onSearchPress?: () => void;
};

export function AdminHeader({ unreadCount = 0, onSearchPress }: Props) {
  return (
    <RoleHeader
      role="admin"
      portalLabel="ADMIN"
      subtitle="CONTROL PANEL"
      unreadCount={unreadCount}
      onSearchPress={onSearchPress}
    />
  );
}
