import {
    AnnouncementTicker,
    type TickerItem,
} from "@/components/AnnouncementTicker";
import { Theme } from "./theme";

type Props = {
  items: TickerItem[];
  onPress: () => void;
};

export function AdminAnnouncementTicker({ items, onPress }: Props) {
  return (
    <AnnouncementTicker
      items={items}
      accent={Theme.accent}
      backgroundColor="rgba(255, 215, 0, 0.08)"
      borderColor="rgba(255, 215, 0, 0.25)"
      textColor={Theme.accent}
      onPress={onPress}
    />
  );
}
