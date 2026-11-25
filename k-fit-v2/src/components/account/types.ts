import { Ionicons } from "@expo/vector-icons";

export type AccountRole = "admin" | "coach" | "member";
export type AccountMenuIcon = keyof typeof Ionicons.glyphMap;

export type AccountMenuItem = {
  title: string;
  description: string;
  icon: AccountMenuIcon;
  onPress: () => void;
  badge?: number | null;
  danger?: boolean;
};

export type AccountMenuSection = {
  title: string;
  items: AccountMenuItem[];
};

export type AccountHeaderStat = {
  label: string;
  value: string;
};
