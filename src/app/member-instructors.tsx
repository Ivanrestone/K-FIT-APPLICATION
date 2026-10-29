import MemberBottomNav from "@/components/MemberBottomNav";
import MemberHeader, {
  MemberLocalNotification,
} from "@/components/MemberHeader";
import { MEMBER_ROUTES } from "@/constants/member-routes";
import { KFitColors } from "@/constants/theme";
import { useLogout } from "@/hooks/use-logout";
import { useMemberHeaderData } from "@/hooks/use-member-header-data";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NAV_CLEARANCE = 140;
const MAX_COMMENT = 300;

type Review = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  mine?: boolean;
};

type Instructor = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  sessions: number;
  nextSlot: string;
  reviews: Review[];
};

const INSTRUCTORS: Instructor[] = [
  {
    id: "i1",
    name: "Alex Vance",
    specialty: "CrossFit & Strength",
    rating: 4.9,
    reviewCount: 48,
    sessions: 312,
    nextSlot: "Today · 5:30 PM",
    reviews: [
      {
        id: "r1",
        author: "Sam K.",
        rating: 5,
        comment:
          "Great programming and always pushes good form over heavy weight.",
        date: "Oct 15",
      },
      {
        id: "r2",
        author: "Priya N.",
        rating: 5,
        comment: "Best coach I've had. Sessions fly by.",
        date: "Oct 02",
      },
    ],
  },
  {
    id: "i2",
    name: "Elena Rostova",
    specialty: "Yoga & Mobility",
    rating: 4.8,
    reviewCount: 41,
    sessions: 268,
    nextSlot: "Tomorrow · 7:00 AM",
    reviews: [
      {
        id: "r3",
        author: "Jamie L.",
        rating: 5,
        comment:
          "My hips and back feel so much better after a month of classes.",
        date: "Oct 12",
      },
      {
        id: "r4",
        author: "Chris D.",
        rating: 4,
        comment: "Calm, clear cues. Classes can be a little crowded.",
        date: "Sep 28",
      },
    ],
  },
  {
    id: "i3",
    name: "Marcus Chen",
    specialty: "HIIT & Conditioning",
    rating: 4.7,
    reviewCount: 33,
    sessions: 204,
    nextSlot: "Tomorrow · 6:00 PM",
    reviews: [
      {
        id: "r5",
        author: "Taylor B.",
        rating: 5,
        comment: "Tough but fun. Great energy.",
        date: "Oct 10",
      },
      {
        id: "r6",
        author: "Morgan R.",
        rating: 4,
        comment: "Challenging workouts, easy to scale down when needed.",
        date: "Sep 30",
      },
    ],
  },
  {
    id: "i4",
    name: "Dana Ortiz",
    specialty: "Powerlifting",
    rating: 4.9,
    reviewCount: 27,
    sessions: 190,
    nextSlot: "Thu · 4:00 PM",
    reviews: [
      {
        id: "r7",
        author: "Riley S.",
        rating: 5,
        comment: "Fixed my squat in two sessions. Very detail oriented.",
        date: "Oct 14",
      },
      {
        id: "r8",
        author: "Jordan P.",
        rating: 5,
        comment: "Great for strength progress and meet prep.",
        date: "Oct 01",
      },
    ],
  },
];

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

/* ─────────── Building blocks ─────────── */
function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View
      style={styles.starRow}
      accessibilityLabel={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const name =
          rating >= n - 0.25
            ? "star"
            : rating >= n - 0.75
              ? "star-half"
              : "star-outline";
        return (
          <Ionicons
            key={n}
            name={name}
            size={size}
            color={
              name === "star-outline" ? KFitColors.mutedText : KFitColors.accent
            }
          />
        );
      })}
    </View>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.pickerRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${n} star${n > 1 ? "s" : ""}`}
          accessibilityState={{ selected: value === n }}
        >
          <Ionicons
            name={n <= value ? "star" : "star-outline"}
            size={30}
            color={n <= value ? KFitColors.accent : KFitColors.mutedText}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ReviewItem({ review }: { review: Review }) {
  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewTop}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>
            {initialsOf(review.author)}
          </Text>
        </View>
        <View style={styles.flex}>
          <View style={styles.reviewNameRow}>
            <Text style={styles.reviewAuthor}>{review.author}</Text>
            {review.mine ? (
              <View style={styles.youChip}>
                <Text style={styles.youChipText}>YOU</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.reviewMeta}>
            <StarRow rating={review.rating} size={11} />
            <Text style={styles.reviewDate}>{review.date}</Text>
          </View>
        </View>
      </View>
      {review.comment ? (
        <Text style={styles.reviewComment}>{review.comment}</Text>
      ) : null}
    </View>
  );
}

/* ─────────── Screen ─────────── */
export default function MemberInstructorsScreen() {
  const { header, profile } = useMemberHeaderData();
  const { isSigningOut, logout } = useLogout();

  const [instructors, setInstructors] = useState<Instructor[]>(INSTRUCTORS);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [draftRating, setDraftRating] = useState(0);
  const [draftComment, setDraftComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<MemberLocalNotification[]>(
    [],
  );

  const authorName = useMemo(() => {
    const first = profile?.firstName?.trim();
    const last = profile?.lastName?.trim();
    if (!first) return "You";
    return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
  }, [profile]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return instructors;
    return instructors.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.specialty.toLowerCase().includes(q),
    );
  }, [query, instructors]);

  const selected = instructors.find((i) => i.id === selectedId) ?? null;

  const choose = (id: string) => {
    void Haptics.selectionAsync();
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const toggleReviews = (id: string) => {
    void Haptics.selectionAsync();
    if (expandedId === id) {
      setExpandedId(null);
      setFormId(null);
    } else {
      setExpandedId(id);
      setFormId(null);
    }
  };

  const openForm = (inst: Instructor) => {
    const mine = inst.reviews.find((r) => r.mine);
    setDraftRating(mine?.rating ?? 0);
    setDraftComment(mine?.comment ?? "");
    setFormError(null);
    setFormId(inst.id);
  };

  const closeForm = () => {
    setFormId(null);
    setFormError(null);
  };

  const submitReview = (id: string) => {
    if (draftRating < 1) {
      setFormError("Tap a star to choose your rating.");
      return;
    }
    const comment = draftComment.trim();
    const date = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    setInstructors((prev) =>
      prev.map((inst) => {
        if (inst.id !== id) return inst;

        const existing = inst.reviews.find((r) => r.mine);
        let sum = inst.rating * inst.reviewCount;
        let count = inst.reviewCount;

        if (existing) {
          sum = sum - existing.rating + draftRating;
        } else {
          sum += draftRating;
          count += 1;
        }

        const mine: Review = {
          id: existing?.id ?? `mine-${id}`,
          author: authorName,
          rating: draftRating,
          comment,
          date,
          mine: true,
        };

        return {
          ...inst,
          rating: sum / count,
          reviewCount: count,
          reviews: [mine, ...inst.reviews.filter((r) => !r.mine)],
        };
      }),
    );

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeForm();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.main}>
        <MemberHeader
          {...header}
          checkedIn={false}
          isSigningOut={isSigningOut}
          onLogout={logout}
          notifications={notifications}
          setNotifications={setNotifications}
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.contentInner}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Header ────────────────────────── */}
            <View style={styles.header}>
              <Text style={styles.eyebrow}>COACHING</Text>
              <Text style={styles.title}>Choose your instructor</Text>
              <Text style={styles.subtitle}>
                Pick the coach you want to train with.
              </Text>
            </View>

            {/* ── Search ────────────────────────── */}
            <View style={styles.searchBox}>
              <Feather name="search" size={14} color={KFitColors.mutedText} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name or specialty"
                placeholderTextColor={KFitColors.mutedText}
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Search instructors"
              />
              {query ? (
                <TouchableOpacity
                  onPress={() => setQuery("")}
                  hitSlop={8}
                  accessibilityLabel="Clear search"
                >
                  <Feather name="x" size={14} color={KFitColors.mutedText} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* ── Selected banner ───────────────── */}
            {selected ? (
              <View style={styles.selectedBanner}>
                <View style={styles.selectedDot} />
                <Text style={styles.selectedText}>
                  Your instructor:{" "}
                  <Text style={styles.selectedName}>{selected.name}</Text>
                </Text>
                <Feather
                  name="check-circle"
                  size={14}
                  color={KFitColors.accent}
                />
              </View>
            ) : null}

            {/* ── List ──────────────────────────── */}
            <View style={styles.list}>
              {results.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconWrap}>
                    <Feather
                      name="user-x"
                      size={20}
                      color={KFitColors.accent}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>No matches</Text>
                  <Text style={styles.emptyText}>
                    No instructors match “{query}”. Try a different search.
                  </Text>
                </View>
              ) : (
                results.map((i) => {
                  const isSelected = i.id === selectedId;
                  const isExpanded = i.id === expandedId;
                  const isFormOpen = i.id === formId;
                  const mine = i.reviews.find((r) => r.mine);

                  return (
                    <View
                      key={i.id}
                      style={[styles.card, isSelected && styles.cardSelected]}
                    >
                      <View style={styles.cardTop}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {initialsOf(i.name)}
                          </Text>
                        </View>
                        <View style={styles.flex}>
                          <Text style={styles.name}>{i.name}</Text>
                          <Text style={styles.specialty}>{i.specialty}</Text>
                          <View style={styles.metaRow}>
                            <StarRow rating={i.rating} size={12} />
                            <Text style={styles.metaScore}>
                              {i.rating.toFixed(1)}
                            </Text>
                            <Text style={styles.metaDot}>·</Text>
                            <Text style={styles.metaMuted}>
                              {i.sessions} sessions
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cardBottom}>
                        <View style={styles.slotRow}>
                          <Feather
                            name="clock"
                            size={11}
                            color={KFitColors.mutedText}
                          />
                          <Text style={styles.slotText}>
                            Next: {i.nextSlot}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.chooseButton,
                            isSelected && styles.chooseButtonActive,
                          ]}
                          onPress={() => choose(i.id)}
                          activeOpacity={0.85}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                        >
                          {isSelected && (
                            <Feather
                              name="check"
                              size={11}
                              color={KFitColors.accent}
                            />
                          )}
                          <Text
                            style={[
                              styles.chooseText,
                              isSelected && styles.chooseTextActive,
                            ]}
                          >
                            {isSelected ? "Selected" : "Choose"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.reviewsToggle}
                        onPress={() => toggleReviews(i.id)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: isExpanded }}
                      >
                        <View style={styles.reviewsToggleLeft}>
                          <View style={styles.reviewsIconWrap}>
                            <Feather
                              name="message-square"
                              size={11}
                              color={KFitColors.accent}
                            />
                          </View>
                          <Text style={styles.reviewsToggleText}>
                            Ratings & reviews
                          </Text>
                          <Text style={styles.reviewsCount}>
                            {i.reviewCount}
                          </Text>
                        </View>
                        <Feather
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={16}
                          color={KFitColors.mutedText}
                        />
                      </TouchableOpacity>

                      {isExpanded ? (
                        <View style={styles.reviewsPanel}>
                          <View style={styles.summaryCard}>
                            <Text style={styles.summaryScore}>
                              {i.rating.toFixed(1)}
                            </Text>
                            <View style={styles.summaryInfo}>
                              <StarRow rating={i.rating} size={14} />
                              <Text style={styles.summaryCount}>
                                Based on {i.reviewCount} ratings
                              </Text>
                            </View>
                          </View>

                          {isFormOpen ? (
                            <View style={styles.form}>
                              <Text style={styles.formTitle}>
                                {mine
                                  ? "Edit your review"
                                  : "Rate your experience"}
                              </Text>
                              <StarPicker
                                value={draftRating}
                                onChange={(v) => {
                                  void Haptics.selectionAsync();
                                  setDraftRating(v);
                                  setFormError(null);
                                }}
                              />
                              <TextInput
                                style={styles.commentInput}
                                value={draftComment}
                                onChangeText={setDraftComment}
                                multiline
                                maxLength={MAX_COMMENT}
                                textAlignVertical="top"
                                placeholder="Share what it's like to train with this coach (optional)"
                                placeholderTextColor={KFitColors.mutedText}
                                accessibilityLabel="Review comment"
                              />
                              <Text style={styles.counter}>
                                {draftComment.length}/{MAX_COMMENT}
                              </Text>
                              {formError ? (
                                <Text
                                  style={styles.errorText}
                                  accessibilityRole="alert"
                                >
                                  {formError}
                                </Text>
                              ) : null}
                              <View style={styles.formActions}>
                                <TouchableOpacity
                                  style={styles.cancelButton}
                                  onPress={closeForm}
                                  accessibilityRole="button"
                                  activeOpacity={0.85}
                                >
                                  <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.submitButton}
                                  onPress={() => submitReview(i.id)}
                                  activeOpacity={0.85}
                                  accessibilityRole="button"
                                >
                                  <Feather
                                    name="check"
                                    size={13}
                                    color={KFitColors.onAccent}
                                  />
                                  <Text style={styles.submitText}>
                                    {mine ? "Update" : "Submit"}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.writeButton}
                              onPress={() => openForm(i)}
                              activeOpacity={0.85}
                              accessibilityRole="button"
                            >
                              <Feather
                                name="edit-3"
                                size={13}
                                color={KFitColors.accent}
                              />
                              <Text style={styles.writeButtonText}>
                                {mine ? "Edit your review" : "Write a review"}
                              </Text>
                            </TouchableOpacity>
                          )}

                          <View style={styles.reviewsList}>
                            {i.reviews.map((r) => (
                              <ReviewItem key={r.id} review={r} />
                            ))}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <MemberBottomNav activeRoute={MEMBER_ROUTES.instructors} />
      </View>
    </SafeAreaView>
  );
}

/* ─────────── Styles ─────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  main: { flex: 1, backgroundColor: KFitColors.background },
  flex: { flex: 1, minWidth: 0 },
  contentInner: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: NAV_CLEARANCE,
    gap: 14,
  },

  /* Header */
  header: { gap: 2, marginTop: 4 },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: KFitColors.mutedText,
    marginTop: 2,
  },

  /* Search */
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  searchInput: {
    flex: 1,
    color: KFitColors.text,
    fontSize: 12,
    paddingVertical: 0,
    minHeight: 20,
  },

  /* Selected banner */
  selectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KFitColors.accent,
  },
  selectedText: { fontSize: 12, color: KFitColors.text, flex: 1 },
  selectedName: {
    fontWeight: "800",
    color: KFitColors.accent,
    fontFamily: "monospace",
  },

  /* List */
  list: { gap: 10 },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    marginBottom: 4,
  },
  emptyTitle: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },

  /* Card */
  card: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    gap: 12,
  },
  cardSelected: {
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.accent + "10",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
  },
  name: {
    fontSize: 15,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.2,
  },
  specialty: {
    fontSize: 11,
    color: KFitColors.mutedText,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 4,
  },
  metaScore: {
    fontSize: 11,
    color: KFitColors.text,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  metaMuted: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  metaDot: {
    color: KFitColors.mutedText,
    fontSize: 10,
  },
  starRow: { flexDirection: "row", alignItems: "center", gap: 1 },

  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  slotText: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  chooseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  chooseButtonActive: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: KFitColors.accent,
  },
  chooseText: {
    fontSize: 11,
    fontWeight: "900",
    color: KFitColors.onAccent,
    fontFamily: "monospace",
  },
  chooseTextActive: { color: KFitColors.accent },

  /* Reviews toggle */
  reviewsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  reviewsToggleLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewsIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  reviewsToggleText: {
    fontSize: 12,
    fontWeight: "800",
    color: KFitColors.text,
  },
  reviewsCount: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    overflow: "hidden",
  },
  reviewsPanel: { gap: 12 },

  /* Summary */
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  summaryScore: {
    fontSize: 34,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
    letterSpacing: -0.8,
  },
  summaryInfo: { gap: 4 },
  summaryCount: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },

  /* Write button */
  writeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.accent + "10",
  },
  writeButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: KFitColors.accent,
  },

  /* Form */
  form: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    gap: 10,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: KFitColors.text,
  },
  pickerRow: { flexDirection: "row", gap: 8 },
  commentInput: {
    minHeight: 80,
    padding: 10,
    borderRadius: 10,
    fontSize: 12,
    lineHeight: 18,
    color: KFitColors.text,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  counter: {
    fontSize: 10,
    color: KFitColors.mutedText,
    textAlign: "right",
    fontFamily: "monospace",
  },
  errorText: {
    fontSize: 11,
    color: KFitColors.error,
    fontWeight: "700",
  },
  formActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: "800",
    color: KFitColors.mutedText,
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  submitText: {
    fontSize: 12,
    fontWeight: "900",
    color: KFitColors.onAccent,
  },

  /* Reviews list */
  reviewsList: { gap: 10 },
  reviewItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    gap: 8,
  },
  reviewTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  reviewAvatarText: {
    fontSize: 11,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
  },
  reviewNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewAuthor: {
    fontSize: 12,
    fontWeight: "800",
    color: KFitColors.text,
  },
  youChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  youChipText: {
    fontSize: 8,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
    letterSpacing: 0.6,
  },
  reviewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  reviewComment: {
    fontSize: 12,
    lineHeight: 18,
    color: KFitColors.mutedText,
  },
});
