import { AnnouncementCard } from "@/components/admin/AnnouncementCard";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { useAdminAnnouncements } from "@/hooks/useAdminAnnouncements";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const Theme = {
  background: "#080808", // Dashboard Background
  surface: "#121212",
  surfaceHigh: "#1A1A1A",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD700",
  border: "#222222",
};

export default function AdminAnnouncementsScreen() {
  const {
    user,
    loading,
    announcements,
    posting,
    deleting,
    title,
    setTitle,
    body,
    setBody,
    audience,
    setAudience,
    pinned,
    setPinned,
    handlePost,
    handleDelete,
  } = useAdminAnnouncements();

  if (loading || !user) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Syncing Announcements...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <SymbolView
              name={{
                ios: "megaphone.fill",
                android: "campaign",
                web: "campaign",
              }}
              tintColor={Theme.accent}
              size={24}
            />
          </View>
          <Text style={styles.title}>Announcements</Text>
          <Text style={styles.subtitle}>Broadcast updates to your gym</Text>
        </View>

        {/* Form */}
        <AnnouncementForm
          title={title}
          setTitle={setTitle}
          body={body}
          setBody={setBody}
          audience={audience}
          setAudience={setAudience}
          pinned={pinned}
          setPinned={setPinned}
          posting={posting}
          onPost={handlePost}
        />

        {/* List */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Recent Posts</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{announcements.length}</Text>
          </View>
        </View>

        {announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <SymbolView
                name={{
                  ios: "megaphone",
                  android: "campaign",
                  web: "campaign",
                }}
                tintColor={Theme.textMuted}
                size={32}
              />
            </View>
            <Text style={styles.emptyText}>No announcements yet</Text>
            <Text style={styles.emptySub}>Post your first update above!</Text>
          </View>
        ) : (
          announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onDelete={handleDelete}
              deleting={deleting === announcement.id}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  center: { justifyContent: "center", alignItems: "center" },
  scrollContent: { flexGrow: 1 },
  content: { padding: 20, paddingTop: 40, paddingBottom: 120 },

  // Header
  header: { alignItems: "center", marginBottom: 28 },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: Theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: Theme.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Theme.textMuted,
    marginTop: 4,
  },

  // Loading
  loadingText: {
    fontSize: 14,
    color: Theme.accent,
    fontWeight: "600",
    marginTop: 12,
  },

  // List Header
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Theme.text,
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: Theme.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  countText: { fontSize: 12, fontWeight: "700", color: Theme.textMuted },

  // Empty State
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.text,
    marginBottom: 4,
  },
  emptySub: { fontSize: 13, color: Theme.textMuted },
});
