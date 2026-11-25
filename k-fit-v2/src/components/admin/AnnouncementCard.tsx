import { Announcement } from "@/hooks/useAdminAnnouncements";
import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Theme = {
  surface: "#121212",
  surfaceHigh: "#1A1A1A",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD700",
  border: "#222222",
  error: "#EF4444",
};

type Props = {
  announcement: Announcement;
  onDelete: (a: Announcement) => void;
  deleting: boolean;
};

export function AnnouncementCard({ announcement, onDelete, deleting }: Props) {
  return (
    <View
      style={[
        styles.card,
        announcement.pinned && styles.cardPinned, // Highlight pinned cards
      ]}
    >
      <View style={styles.header}>
        {announcement.pinned && (
          <View style={styles.pinnedBadge}>
            <SymbolView
              name={{ ios: "pin.fill", android: "push_pin", web: "push_pin" }}
              tintColor={Theme.accent}
              size={11}
            />
            <Text style={styles.pinnedBadgeText}>PINNED</Text>
          </View>
        )}
        <View style={styles.audienceBadge}>
          <Text style={styles.audienceBadgeText}>
            {announcement.audience.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{announcement.title}</Text>
      <Text style={styles.body}>{announcement.body}</Text>

      <View style={styles.footer}>
        <Text style={styles.date}>
          {new Date(announcement.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
        <TouchableOpacity
          onPress={() => onDelete(announcement)}
          disabled={deleting}
          style={[styles.deleteBtn, { opacity: deleting ? 0.5 : 1 }]}
        >
          <SymbolView
            name={{ ios: "trash", android: "delete", web: "delete" }}
            tintColor={Theme.error}
            size={16}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },
  cardPinned: {
    borderColor: "rgba(255, 215, 0, 0.2)",
    borderLeftColor: Theme.accent,
    backgroundColor: "rgba(255, 215, 0, 0.03)", // Very subtle gold tint
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pinnedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Theme.accent,
    letterSpacing: 0.5,
  },
  audienceBadge: {
    backgroundColor: Theme.surfaceHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  audienceBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Theme.textMuted,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: Theme.text,
    marginBottom: 6,
  },
  body: {
    fontSize: 13,
    color: Theme.textMuted,
    lineHeight: 20,
    marginBottom: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  date: { fontSize: 12, fontWeight: "500", color: "#6B7280" },
  deleteBtn: {
    padding: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
  },
});
