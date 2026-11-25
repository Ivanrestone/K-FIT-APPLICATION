import { SymbolView } from "expo-symbols";
import {
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Aligned with the K-FIT Dashboard Theme
const Theme = {
  surface: "#121212",
  surfaceHigh: "#1A1A1A",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  accent: "#FFD700", // Dashboard Gold
  accentText: "#000000",
  border: "#222222",
  borderActive: "rgba(255, 215, 0, 0.3)",
};

const AUDIENCES = [
  { key: "all", label: "Everyone" },
  { key: "members", label: "Members" },
  { key: "coaches", label: "Coaches" },
] as const;

type Props = {
  title: string;
  setTitle: (t: string) => void;
  body: string;
  setBody: (b: string) => void;
  audience: any;
  setAudience: (a: any) => void;
  pinned: boolean;
  setPinned: (p: boolean) => void;
  posting: boolean;
  onPost: () => void;
};

export function AnnouncementForm({
  title,
  setTitle,
  body,
  setBody,
  audience,
  setAudience,
  pinned,
  setPinned,
  posting,
  onPost,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>New Announcement</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Gym closed this Sunday"
        placeholderTextColor="#6B7280"
        value={title}
        onChangeText={setTitle}
        selectionColor={Theme.accent}
      />

      <Text style={styles.label}>Message</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Write your announcement..."
        placeholderTextColor="#6B7280"
        value={body}
        onChangeText={setBody}
        multiline
        numberOfLines={4}
        selectionColor={Theme.accent}
      />

      <Text style={styles.label}>Show to</Text>
      <View style={styles.audienceRow}>
        {AUDIENCES.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={[
              styles.audienceChip,
              audience === a.key && styles.audienceChipActive,
            ]}
            onPress={() => setAudience(a.key)}
          >
            <Text
              style={[
                styles.audienceChipText,
                audience === a.key && styles.audienceChipTextActive,
              ]}
            >
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.pinnedRow}>
        <Text style={styles.pinnedLabel}>Pin to top</Text>
        <Switch
          value={pinned}
          onValueChange={setPinned}
          trackColor={{
            false: Theme.surfaceHigh,
            true: "rgba(255, 215, 0, 0.4)",
          }}
          thumbColor={pinned ? Theme.accent : "#888888"}
        />
      </View>

      <TouchableOpacity
        style={[styles.postButton, posting && styles.postButtonDisabled]}
        onPress={onPost}
        disabled={posting}
        activeOpacity={0.85}
      >
        <SymbolView
          name={{ ios: "paperplane.fill", android: "send", web: "send" }}
          tintColor={Theme.accentText}
          size={16}
        />
        <Text style={styles.postButtonText}>
          {posting ? "Posting..." : "Post Announcement"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.15)", // Subtle gold border matching dashboard
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Theme.text,
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: Theme.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: Theme.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: Theme.text,
  },
  textArea: { height: 110, textAlignVertical: "top" },
  audienceRow: { flexDirection: "row", gap: 8 },
  audienceChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Theme.surfaceHigh,
    borderWidth: 1,
    borderColor: Theme.border,
    alignItems: "center",
  },
  audienceChipActive: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderColor: Theme.accent,
  },
  audienceChipText: { fontSize: 13, fontWeight: "600", color: Theme.textMuted },
  audienceChipTextActive: { color: Theme.accent, fontWeight: "700" },
  pinnedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 4,
  },
  pinnedLabel: { fontSize: 14, fontWeight: "600", color: Theme.text },
  postButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Theme.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 20,
    shadowColor: Theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  postButtonDisabled: { opacity: 0.5 },
  postButtonText: {
    color: Theme.accentText,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
