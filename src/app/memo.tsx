import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import { useMemos } from "@/hooks/use-memos";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
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

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
const FILTERS: PriorityFilter[] = ["All", ...PRIORITIES];

const priorityColor = (p: Priority) =>
  p === "High"
    ? KFitColors.error
    : p === "Medium"
      ? KFitColors.warning
      : KFitColors.accent;

const priorityIcon = (p: Priority): keyof typeof Ionicons.glyphMap =>
  p === "High" ? "alert-circle" : p === "Medium" ? "time" : "checkmark-circle";

/* ------------------------------------------------------------------ */
/* Typed pressable — eliminates the style-callback TS error.         */
/* ------------------------------------------------------------------ */
type PressableBtnProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityRole?: "button" | "link" | "none";
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
  hitSlop?: number;
};

function PressableBtn({
  children,
  style,
  pressedStyle,
  onPress,
  disabled,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  hitSlop,
}: PressableBtnProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        style,
        pressed && (pressedStyle ?? styles.pressed),
      ]}
    >
      {children}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                             */
/* ------------------------------------------------------------------ */
export default function MemoScreen() {
  const {
    memos,
    loading,
    refetch,
    createMemo: dbCreateMemo,
    deleteMemo: dbDeleteMemo,
  } = useMemos();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<PriorityFilter>("All");

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("Medium");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const filterActive =
    searchQuery.trim().length > 0 || selectedFilter !== "All";

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedFilter("All");
  };

  const openCreate = () => {
    setNewTitle("");
    setNewContent("");
    setNewPriority("Medium");
    setFormError("");
    setCreateOpen(true);
  };

  const createMemo = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      setFormError("Enter both a title and the memo content.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    const result = await dbCreateMemo({
      title: newTitle.trim(),
      content: newContent.trim(),
      priority: newPriority,
      author: "Admin",
    });

    if (result.success) {
      setNewTitle("");
      setNewContent("");
      setNewPriority("Medium");
      setCreateOpen(false);
    } else {
      setFormError(result.error || "Failed to create memo");
    }

    setIsSubmitting(false);
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
          onPress: async () => {
            const result = await dbDeleteMemo(memo.id);
            if (result.success) {
              setSelectedMemo(null);
            } else {
              Alert.alert("Error", result.error || "Failed to delete memo");
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/memo" />

        <View style={styles.main}>
          <AppHeader />

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero header */}
            <View style={styles.hero}>
              <View style={styles.heroLeft}>
                <Text style={styles.eyebrow}>ANNOUNCEMENTS</Text>
                <Text style={styles.headerTitle}>Gym memos</Text>
                <Text style={styles.headerSubtitle}>
                  Important announcements and notifications for members.
                </Text>
              </View>
              <PressableBtn
                onPress={openCreate}
                accessibilityRole="button"
                accessibilityLabel="Create memo"
                style={styles.createButton}
              >
                <Ionicons name="add" size={18} color={KFitColors.onAccent} />
                <Text style={styles.createButtonText}>Create memo</Text>
              </PressableBtn>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
              <StatCard
                icon="document-text"
                label="Total memos"
                value={String(counts.All)}
                hint="All priorities"
                tone={KFitColors.accent}
              />
              <StatCard
                icon="alert-circle"
                label="High priority"
                value={String(counts.High)}
                hint="Needs attention"
                tone={KFitColors.error}
              />
              <StatCard
                icon="calendar"
                label="Latest"
                value={memos[0]?.date ?? "—"}
                hint="Most recent post"
                tone={KFitColors.text}
                compactValue
              />
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
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <PressableBtn
                    onPress={() => setSearchQuery("")}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={KFitColors.mutedText}
                    />
                  </PressableBtn>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContainer}
              >
                {FILTERS.map((f) => {
                  const active = selectedFilter === f;
                  const tone =
                    f === "All" ? KFitColors.accent : priorityColor(f);
                  return (
                    <PressableBtn
                      key={f}
                      onPress={() => setSelectedFilter(f)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`Filter ${f}, ${counts[f]} memos`}
                      style={[
                        styles.filterTab,
                        active && {
                          backgroundColor: tone,
                          borderColor: tone,
                        },
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
                      <View
                        style={[
                          styles.filterCount,
                          active && styles.filterCountActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterCountText,
                            active && styles.filterCountTextActive,
                          ]}
                        >
                          {counts[f]}
                        </Text>
                      </View>
                    </PressableBtn>
                  );
                })}
              </ScrollView>

              {filterActive && (
                <PressableBtn
                  onPress={resetFilters}
                  style={styles.inlineReset}
                  accessibilityRole="button"
                  accessibilityLabel="Reset filters"
                >
                  <Ionicons
                    name="refresh"
                    size={12}
                    color={KFitColors.mutedText}
                  />
                  <Text style={styles.inlineResetText}>Reset filters</Text>
                </PressableBtn>
              )}
            </View>

            {/* Memo list */}
            <View style={styles.memoList}>
              {filteredMemos.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons
                      name="document-text-outline"
                      size={26}
                      color={KFitColors.accent}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>No memos found</Text>
                  <Text style={styles.emptyText}>
                    Try a different search or create a new memo.
                  </Text>
                  <PressableBtn
                    style={styles.resetButton}
                    onPress={resetFilters}
                    accessibilityRole="button"
                    accessibilityLabel="Reset filters"
                  >
                    <Text style={styles.resetText}>Reset filters</Text>
                  </PressableBtn>
                </View>
              ) : (
                filteredMemos.map((memo) => {
                  const tone = priorityColor(memo.priority);
                  return (
                    <PressableBtn
                      key={memo.id}
                      onPress={() => setSelectedMemo(memo)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open memo ${memo.title}`}
                      style={styles.memoCard}
                    >
                      <View
                        style={[styles.memoAccent, { backgroundColor: tone }]}
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
                    </PressableBtn>
                  );
                })
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
              <View style={styles.inline}>
                <View style={styles.modalHeaderIcon}>
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={KFitColors.accent}
                  />
                </View>
                <Text style={styles.modalTitle}>Create new memo</Text>
              </View>
              <PressableBtn
                onPress={() => setCreateOpen(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={KFitColors.mutedText} />
              </PressableBtn>
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
              accessibilityLabel="Memo title"
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
              accessibilityLabel="Memo content"
            />

            <Text style={styles.fieldLabel}>PRIORITY</Text>
            <View style={styles.priorityOptions}>
              {PRIORITIES.map((p) => {
                const active = newPriority === p;
                const color = priorityColor(p);
                return (
                  <PressableBtn
                    key={p}
                    onPress={() => setNewPriority(p)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Priority ${p}`}
                    style={[
                      styles.priorityOption,
                      active && {
                        borderColor: color,
                        backgroundColor: color + "26",
                      },
                    ]}
                  >
                    <Ionicons
                      name={priorityIcon(p)}
                      size={14}
                      color={active ? color : KFitColors.mutedText}
                    />
                    <Text
                      style={[styles.priorityOptionText, active && { color }]}
                    >
                      {p}
                    </Text>
                  </PressableBtn>
                );
              })}
            </View>

            {formError !== "" && (
              <View style={styles.errorRow}>
                <Ionicons
                  name="alert-circle"
                  size={14}
                  color={KFitColors.error}
                />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <PressableBtn
                style={styles.modalCancel}
                onPress={() => setCreateOpen(false)}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </PressableBtn>
              <PressableBtn
                style={[
                  styles.modalSave,
                  isSubmitting && styles.modalSaveDisabled,
                ]}
                onPress={createMemo}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Create memo"
              >
                <Text style={styles.modalSaveText}>
                  {isSubmitting ? "Creating..." : "Create memo"}
                </Text>
              </PressableBtn>
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
                  <PressableBtn
                    onPress={() => setSelectedMemo(null)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={KFitColors.mutedText}
                    />
                  </PressableBtn>
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
                  <PressableBtn
                    style={styles.modalDelete}
                    onPress={() => deleteMemo(selectedMemo)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete memo"
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={KFitColors.error}
                    />
                    <Text style={styles.modalDeleteText}>Delete</Text>
                  </PressableBtn>
                  <PressableBtn
                    style={styles.modalCancel}
                    onPress={() => setSelectedMemo(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <Text style={styles.modalCancelText}>Close</Text>
                  </PressableBtn>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                       */
/* ------------------------------------------------------------------ */
function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
  compactValue,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  hint: string;
  tone: string;
  compactValue?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <View
          style={[
            styles.statIconWrap,
            { backgroundColor: tone + "14", borderColor: tone + "33" },
          ]}
        >
          <Ionicons name={icon} size={13} color={tone} />
        </View>
        <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      </View>
      <Text
        style={[
          compactValue ? styles.statValueSm : styles.statValue,
          { color: tone },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text style={styles.statHint}>{hint}</Text>
    </View>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const color = priorityColor(priority);
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color + "1F", borderColor: color + "55" },
      ]}
    >
      <Ionicons name={priorityIcon(priority)} size={11} color={color} />
      <Text style={[styles.badgeText, { color }]}>{priority}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                             */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, flexDirection: "row" },
  main: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1, backgroundColor: KFitColors.background },
  contentContainer: { paddingBottom: 96 },
  pressed: { opacity: 0.75 },
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },

  /* Hero */
  hero: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },
  heroLeft: { flexShrink: 1, minWidth: 220, gap: 2 },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontFamily: "monospace",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: KFitColors.text,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: KFitColors.mutedText,
    marginTop: 2,
    maxWidth: 520,
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
    fontWeight: "900",
    color: KFitColors.onAccent,
    letterSpacing: 0.2,
  },

  /* Stats */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 160,
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
    gap: 4,
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  statIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statLabel: {
    color: KFitColors.mutedText,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    fontFamily: "monospace",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  statValueSm: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
    fontFamily: "monospace",
    marginTop: 2,
  },
  statHint: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontFamily: "monospace",
  },

  /* Search + filters */
  section: { paddingHorizontal: 20, marginBottom: 18, gap: 10 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    color: KFitColors.text,
    paddingVertical: 0,
  },
  filterContainer: { gap: 8, paddingRight: 4 },
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
  filterTabText: {
    fontSize: 12,
    color: KFitColors.text,
    fontWeight: "700",
  },
  filterTabTextActive: { color: KFitColors.onAccent, fontWeight: "900" },
  filterCount: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  filterCountActive: {
    backgroundColor: KFitColors.onAccent + "22",
    borderColor: KFitColors.onAccent + "44",
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: "900",
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  filterCountTextActive: { color: KFitColors.onAccent },
  inlineReset: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  inlineResetText: {
    fontSize: 11,
    fontWeight: "800",
    color: KFitColors.mutedText,
  },

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
    fontWeight: "800",
    color: KFitColors.text,
    letterSpacing: -0.1,
  },
  memoContent: {
    fontSize: 12,
    lineHeight: 18,
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
  metaText: {
    fontSize: 11,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },

  /* Empty state */
  emptyState: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: KFitColors.border,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: KFitColors.text },
  emptyText: {
    fontSize: 12,
    color: KFitColors.mutedText,
    marginBottom: 10,
    textAlign: "center",
    lineHeight: 17,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.accent,
  },
  resetText: { fontSize: 13, fontWeight: "800", color: KFitColors.accent },

  /* Footer */
  footerText: {
    fontSize: 11,
    color: KFitColors.mutedText,
    textAlign: "center",
    marginTop: 18,
    marginBottom: 20,
    fontFamily: "monospace",
    opacity: 0.7,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  footerBrand: {
    fontSize: 10,
    letterSpacing: 1.4,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
    opacity: 0.7,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.85)",
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
    gap: 10,
  },
  modalHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.2,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: KFitColors.mutedText,
    marginTop: 10,
    marginBottom: 6,
    fontFamily: "monospace",
  },
  modalInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    paddingHorizontal: 12,
    fontSize: 13,
    color: KFitColors.text,
  },
  textArea: { height: 110, paddingTop: 12 },
  priorityOptions: { flexDirection: "row", gap: 8 },
  priorityOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  priorityOptionText: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.mutedText,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: KFitColors.error,
    flexShrink: 1,
  },
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
  modalCancelText: {
    fontSize: 14,
    fontWeight: "800",
    color: KFitColors.text,
  },
  modalSave: {
    flex: 1.4,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  modalSaveDisabled: { opacity: 0.6 },
  modalSaveText: {
    fontSize: 14,
    fontWeight: "900",
    color: KFitColors.onAccent,
    letterSpacing: 0.2,
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
  modalDeleteText: {
    fontSize: 14,
    fontWeight: "800",
    color: KFitColors.error,
  },

  viewTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: KFitColors.text,
    marginBottom: 12,
    letterSpacing: -0.2,
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
