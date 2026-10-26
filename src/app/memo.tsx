import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Priority = "High" | "Medium" | "Low";
type PriorityFilter = "All" | Priority;

interface Memo {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: Priority;
  author: string;
}

const INITIAL_MEMOS: Memo[] = [
  {
    id: "1",
    title: "Gym closure - maintenance day",
    content:
      "The gym will be closed on October 25, 2026 for scheduled maintenance. We apologize for any inconvenience and will resume normal operations on October 26.",
    date: "Oct 20, 2026",
    priority: "High",
    author: "Admin",
  },
  {
    id: "2",
    title: "New class schedule",
    content:
      "Starting next week, we are adding new yoga classes on Monday and Wednesday evenings at 6 PM. Sign up through the member app.",
    date: "Oct 18, 2026",
    priority: "Medium",
    author: "Admin",
  },
  {
    id: "3",
    title: "Holiday hours notice",
    content:
      "Please note our modified hours during the upcoming holiday season. We will be open from 8 AM to 6 PM on Thanksgiving Day.",
    date: "Oct 15, 2026",
    priority: "Medium",
    author: "Admin",
  },
  {
    id: "4",
    title: "Equipment update",
    content:
      "New cardio equipment has been installed in the main floor. Please ask staff for a quick tutorial if needed.",
    date: "Oct 10, 2026",
    priority: "Low",
    author: "Admin",
  },
  {
    id: "5",
    title: "Personal training promotion",
    content:
      "Special offer: 20% off personal training packages for the month of October. Contact front desk for details.",
    date: "Oct 05, 2026",
    priority: "Low",
    author: "Admin",
  },
];

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
const FILTERS: PriorityFilter[] = ["All", ...PRIORITIES];

const priorityColor = (p: Priority) =>
  p === "High"
    ? KFitColors.error
    : p === "Medium"
      ? KFitColors.warning
      : KFitColors.accent;

const todayLabel = () =>
  new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

export default function MemoScreen() {
  const [memos, setMemos] = useState<Memo[]>(INITIAL_MEMOS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<PriorityFilter>("All");

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("Medium");
  const [formError, setFormError] = useState("");

  const counts = useMemo(() => {
    const base: Record<PriorityFilter, number> = {
      All: memos.length,
      High: 0,
      Medium: 0,
      Low: 0,
    };
    memos.forEach((m) => (base[m.priority] += 1));
    return base;
  }, [memos]);

  const filteredMemos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return memos.filter((m) => {
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q);
      const matchesFilter =
        selectedFilter === "All" || m.priority === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [memos, searchQuery, selectedFilter]);

  const openCreate = () => {
    setNewTitle("");
    setNewContent("");
    setNewPriority("Medium");
    setFormError("");
    setCreateOpen(true);
  };

  const createMemo = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      setFormError("Enter both a title and the memo content.");
      return;
    }
    setMemos((prev) => [
      {
        id: `${Date.now()}`,
        title: newTitle.trim(),
        content: newContent.trim(),
        date: todayLabel(),
        priority: newPriority,
        author: "Admin",
      },
      ...prev,
    ]);
    setCreateOpen(false);
  };

  const deleteMemo = (memo: Memo) => {
    Alert.alert(
      "Delete memo?",
      `"${memo.title}" will be removed for everyone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setMemos((prev) => prev.filter((m) => m.id !== memo.id));
            setSelectedMemo(null);
          },
        },
      ],
    );
  };

  const PriorityBadge = ({ priority }: { priority: Priority }) => {
    const color = priorityColor(priority);
    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: color + "1F", borderColor: color + "55" },
        ]}
      >
        <View style={[styles.badgeDot, { backgroundColor: color }]} />
        <Text style={[styles.badgeText, { color }]}>{priority}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/memo" />

        {/* Header + scrollable content */}
        <View style={styles.main}>
          <AppHeader />

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Page title */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.eyebrow}>ANNOUNCEMENTS</Text>
                <Text style={styles.headerTitle}>Gym memos</Text>
                <Text style={styles.headerSubtitle}>
                  Important announcements and notifications for members.
                </Text>
              </View>
              <Pressable
                onPress={openCreate}
                accessibilityRole="button"
                accessibilityLabel="Create memo"
                style={({ pressed }) => [
                  styles.createButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="add" size={18} color={KFitColors.onAccent} />
                <Text style={styles.createButtonText}>Create memo</Text>
              </Pressable>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total memos</Text>
                <Text style={styles.statNumber}>{counts.All}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>High priority</Text>
                <Text style={[styles.statNumber, { color: KFitColors.error }]}>
                  {counts.High}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Latest</Text>
                <Text style={styles.statDate} numberOfLines={1}>
                  {memos[0]?.date ?? "—"}
                </Text>
              </View>
            </View>

            {/* Search + filters */}
            <View style={styles.section}>
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={18}
                  color={KFitColors.mutedText}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search memos by title or content"
                  placeholderTextColor={KFitColors.mutedText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  accessibilityLabel="Search memos"
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => setSearchQuery("")}
                    hitSlop={10}
                    accessibilityLabel="Clear search"
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={KFitColors.mutedText}
                    />
                  </Pressable>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContainer}
              >
                {FILTERS.map((f) => {
                  const active = selectedFilter === f;
                  return (
                    <Pressable
                      key={f}
                      onPress={() => setSelectedFilter(f)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[
                        styles.filterTab,
                        active && styles.filterTabActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterTabText,
                          active && styles.filterTabTextActive,
                        ]}
                      >
                        {f === "All" ? "All priorities" : f}
                      </Text>
                      <Text
                        style={[
                          styles.filterCount,
                          active && styles.filterTabTextActive,
                        ]}
                      >
                        {counts[f]}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Memo list */}
            <View style={styles.memoList}>
              {filteredMemos.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="document-text-outline"
                    size={34}
                    color={KFitColors.mutedText}
                  />
                  <Text style={styles.emptyTitle}>No memos found</Text>
                  <Text style={styles.emptyText}>
                    Try a different search or create a new memo.
                  </Text>
                  <Pressable
                    style={styles.resetButton}
                    onPress={() => {
                      setSearchQuery("");
                      setSelectedFilter("All");
                    }}
                  >
                    <Text style={styles.resetText}>Reset filters</Text>
                  </Pressable>
                </View>
              ) : (
                filteredMemos.map((memo) => (
                  <Pressable
                    key={memo.id}
                    onPress={() => setSelectedMemo(memo)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open memo ${memo.title}`}
                    style={({ pressed }) => [
                      styles.memoCard,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.memoAccent,
                        { backgroundColor: priorityColor(memo.priority) },
                      ]}
                    />
                    <View style={styles.memoBody}>
                      <View style={styles.memoHeader}>
                        <Text style={styles.memoTitle} numberOfLines={2}>
                          {memo.title}
                        </Text>
                        <PriorityBadge priority={memo.priority} />
                      </View>
                      <Text style={styles.memoContent} numberOfLines={2}>
                        {memo.content}
                      </Text>
                      <View style={styles.memoFooter}>
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="calendar-outline"
                            size={12}
                            color={KFitColors.mutedText}
                          />
                          <Text style={styles.metaText}>{memo.date}</Text>
                        </View>
                        <Text style={styles.metaText}>By {memo.author}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>

            <Text style={styles.footerText}>
              Showing {filteredMemos.length} of {memos.length} memos
            </Text>

            <View style={styles.footer}>
              <Text style={styles.footerBrand}>
                FORM ATHLETICS • ADMINISTRATOR WORKSPACE
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Create memo modal */}
      <Modal
        visible={createOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create new memo</Text>
              <Pressable
                onPress={() => setCreateOpen(false)}
                hitSlop={10}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={KFitColors.mutedText} />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>TITLE</Text>
            <TextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={(t) => {
                setNewTitle(t);
                setFormError("");
              }}
              placeholder="Enter memo title"
              placeholderTextColor={KFitColors.mutedText}
            />

            <Text style={styles.fieldLabel}>CONTENT</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={newContent}
              onChangeText={(t) => {
                setNewContent(t);
                setFormError("");
              }}
              placeholder="Enter memo content"
              placeholderTextColor={KFitColors.mutedText}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>PRIORITY</Text>
            <View style={styles.priorityOptions}>
              {PRIORITIES.map((p) => {
                const active = newPriority === p;
                const color = priorityColor(p);
                return (
                  <Pressable
                    key={p}
                    onPress={() => setNewPriority(p)}
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.priorityOption,
                      active && {
                        borderColor: color,
                        backgroundColor: color + "26",
                      },
                    ]}
                  >
                    <Text
                      style={[styles.priorityOptionText, active && { color }]}
                    >
                      {p}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {formError !== "" && (
              <Text style={styles.errorText}>{formError}</Text>
            )}

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setCreateOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={createMemo}>
                <Text style={styles.modalSaveText}>Create memo</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* View memo modal */}
      <Modal
        visible={selectedMemo !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMemo(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMemo && (
              <>
                <View style={styles.modalHeader}>
                  <PriorityBadge priority={selectedMemo.priority} />
                  <Pressable
                    onPress={() => setSelectedMemo(null)}
                    hitSlop={10}
                    accessibilityLabel="Close"
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={KFitColors.mutedText}
                    />
                  </Pressable>
                </View>

                <Text style={styles.viewTitle}>{selectedMemo.title}</Text>

                <ScrollView style={styles.viewScroll}>
                  <Text style={styles.viewContent}>{selectedMemo.content}</Text>
                </ScrollView>

                <View style={styles.viewFooter}>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color={KFitColors.mutedText}
                    />
                    <Text style={styles.metaText}>{selectedMemo.date}</Text>
                  </View>
                  <Text style={styles.metaText}>By {selectedMemo.author}</Text>
                </View>

                <View style={styles.modalButtons}>
                  <Pressable
                    style={styles.modalDelete}
                    onPress={() => deleteMemo(selectedMemo)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={KFitColors.error}
                    />
                    <Text style={styles.modalDeleteText}>Delete</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalCancel}
                    onPress={() => setSelectedMemo(null)}
                  >
                    <Text style={styles.modalCancelText}>Close</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, flexDirection: "row" },
  main: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1, backgroundColor: KFitColors.background },
  contentContainer: { paddingBottom: 96 },
  pressed: { opacity: 0.75 },

  /* Page title */
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerLeft: { flexShrink: 1, minWidth: 220 },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: KFitColors.text,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: KFitColors.mutedText,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: KFitColors.onAccent,
  },

  /* Stats */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 120,
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  statLabel: { fontSize: 12, color: KFitColors.mutedText, marginBottom: 8 },
  statNumber: { fontSize: 28, fontWeight: "800", color: KFitColors.accent },
  statDate: {
    fontSize: 18,
    fontWeight: "800",
    color: KFitColors.text,
    marginTop: 6,
  },

  /* Search + filters */
  section: { paddingHorizontal: 20, marginBottom: 20 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: KFitColors.text,
  },
  filterContainer: { gap: 8 },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  filterTabActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  filterTabText: { fontSize: 13, color: KFitColors.text, fontWeight: "600" },
  filterTabTextActive: { color: KFitColors.onAccent },
  filterCount: { fontSize: 12, color: KFitColors.mutedText, fontWeight: "600" },

  /* Memo list */
  memoList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 20,
  },
  memoCard: {
    flexGrow: 1,
    flexBasis: 320,
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  memoAccent: { width: 4 },
  memoBody: { flex: 1, padding: 14, gap: 10 },
  memoHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  memoTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: KFitColors.text,
  },
  memoContent: {
    fontSize: 13,
    lineHeight: 19,
    color: KFitColors.mutedText,
  },
  memoFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 11, color: KFitColors.mutedText },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "800" },

  /* Empty state */
  emptyState: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 40,
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: KFitColors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: KFitColors.text },
  emptyText: { fontSize: 12, color: KFitColors.mutedText, marginBottom: 10 },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.accent,
  },
  resetText: { fontSize: 13, fontWeight: "600", color: KFitColors.accent },

  /* Footer */
  footerText: {
    fontSize: 12,
    color: KFitColors.mutedText,
    textAlign: "center",
    marginTop: 18,
    marginBottom: 24,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  footerBrand: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: KFitColors.mutedText,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalContent: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "90%",
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: KFitColors.text },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: KFitColors.mutedText,
    marginTop: 10,
    marginBottom: 6,
  },
  modalInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    paddingHorizontal: 12,
    fontSize: 14,
    color: KFitColors.text,
  },
  textArea: { height: 110, paddingTop: 12 },
  priorityOptions: { flexDirection: "row", gap: 8 },
  priorityOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  priorityOptionText: {
    fontSize: 13,
    fontWeight: "700",
    color: KFitColors.mutedText,
  },
  errorText: { fontSize: 12, color: KFitColors.error, marginTop: 12 },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalCancel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  modalCancelText: { fontSize: 14, fontWeight: "600", color: KFitColors.text },
  modalSave: {
    flex: 1.4,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: "800",
    color: KFitColors.onAccent,
  },
  modalDelete: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.error + "66",
    backgroundColor: KFitColors.error + "14",
  },
  modalDeleteText: { fontSize: 14, fontWeight: "700", color: KFitColors.error },

  viewTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: KFitColors.text,
    marginBottom: 12,
  },
  viewScroll: { maxHeight: 220 },
  viewContent: { fontSize: 14, lineHeight: 22, color: KFitColors.text },
  viewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
});
