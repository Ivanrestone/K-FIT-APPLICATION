import MemberBottomNav from "@/components/MemberBottomNav";
import { KFitColors } from "@/constants/theme";
import { useMemberProfile } from "@/hooks/use-member-profile";
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
  rating: number; // 1-5
  comment: string;
  date: string;
  mine?: boolean;
};

type Instructor = {
  id: string;
  name: string;
  specialty: string;
  rating: number; // average
  reviewCount: number; // total ratings behind the average
  sessions: number;
  nextSlot: string;
  reviews: Review[]; // most recent first
};

// TODO: replace with data from your backend.
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
    .map((p) => p.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

/* ---------------------------- Small building blocks ---------------------------- */

/** Read-only stars, supports half stars (e.g. 4.5). */
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

/** Tappable stars for the review form. */
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
            size={32}
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
        <View style={{ flex: 1 }}>
          <View style={styles.reviewNameRow}>
            <Text style={styles.reviewAuthor}>{review.author}</Text>
            {review.mine ? (
              <View style={styles.youChip}>
                <Text style={styles.youChipText}>You</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.reviewMeta}>
            <StarRow rating={review.rating} size={12} />
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

/* ---------------------------------- Screen ---------------------------------- */

export default function MemberInstructorsScreen() {
  const { profile } = useMemberProfile();

  const [instructors, setInstructors] = useState<Instructor[]>(INSTRUCTORS);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [draftRating, setDraftRating] = useState(0);
  const [draftComment, setDraftComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

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
          sum = sum - existing.rating + draftRating; // edit: count unchanged
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

    // TODO: send { instructorId, rating, comment } to your backend here.
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeForm();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.main}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: NAV_CLEARANCE }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.title}>Choose your instructor</Text>
              <Text style={styles.subtitle}>
                Pick the coach you want to train with.
              </Text>
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color={KFitColors.mutedText} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name or specialty"
                placeholderTextColor={KFitColors.mutedText}
                autoCorrect={false}
                accessibilityLabel="Search instructors"
              />
              {query ? (
                <TouchableOpacity
                  onPress={() => setQuery("")}
                  accessibilityLabel="Clear search"
                >
                  <Feather name="x" size={16} color={KFitColors.mutedText} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Current selection */}
            {selected ? (
              <View style={styles.selectedBanner}>
                <Feather
                  name="check-circle"
                  size={16}
                  color={KFitColors.accent}
                />
                <Text style={styles.selectedText}>
                  Your instructor:{" "}
                  <Text style={styles.selectedName}>{selected.name}</Text>
                </Text>
              </View>
            ) : null}

            {/* List */}
            <View style={styles.list}>
              {results.length === 0 ? (
                <Text style={styles.empty}>
                  No instructors match your search.
                </Text>
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
                        <View style={styles.cardInfo}>
                          <Text style={styles.name}>{i.name}</Text>
                          <Text style={styles.specialty}>{i.specialty}</Text>
                          <View style={styles.metaRow}>
                            <StarRow rating={i.rating} />
                            <Text style={styles.metaText}>
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
                            size={13}
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

                      {/* Reviews toggle */}
                      <TouchableOpacity
                        style={styles.reviewsToggle}
                        onPress={() => toggleReviews(i.id)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: isExpanded }}
                      >
                        <View style={styles.reviewsToggleLeft}>
                          <Feather
                            name="message-square"
                            size={14}
                            color={KFitColors.accent}
                          />
                          <Text style={styles.reviewsToggleText}>
                            Ratings & reviews ({i.reviewCount})
                          </Text>
                        </View>
                        <Feather
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={18}
                          color={KFitColors.mutedText}
                        />
                      </TouchableOpacity>

                      {isExpanded ? (
                        <View style={styles.reviewsPanel}>
                          {/* Summary */}
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryScore}>
                              {i.rating.toFixed(1)}
                            </Text>
                            <View>
                              <StarRow rating={i.rating} size={16} />
                              <Text style={styles.summaryCount}>
                                Based on {i.reviewCount} ratings
                              </Text>
                            </View>
                          </View>

                          {/* Write / edit */}
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
                                  style={styles.chooseButton}
                                  onPress={() => submitReview(i.id)}
                                  activeOpacity={0.85}
                                  accessibilityRole="button"
                                >
                                  <Text style={styles.chooseText}>
                                    {mine ? "Update review" : "Submit review"}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.cancelButton}
                                  onPress={closeForm}
                                  accessibilityRole="button"
                                >
                                  <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.writeButton}
                              onPress={() => openForm(i)}
                              activeOpacity={0.8}
                              accessibilityRole="button"
                            >
                              <Feather
                                name="edit-3"
                                size={14}
                                color={KFitColors.accent}
                              />
                              <Text style={styles.writeButtonText}>
                                {mine ? "Edit your review" : "Write a review"}
                              </Text>
                            </TouchableOpacity>
                          )}

                          {/* Reviews */}
                          {i.reviews.map((r) => (
                            <ReviewItem key={r.id} review={r} />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <MemberBottomNav activeRoute="/member-instructors" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  main: { flex: 1, backgroundColor: KFitColors.background },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "900", color: KFitColors.text },
  subtitle: { fontSize: 13, color: KFitColors.mutedText, marginTop: 4 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  searchInput: { flex: 1, color: KFitColors.text, fontSize: 14 },

  selectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  selectedText: { fontSize: 13, color: KFitColors.text },
  selectedName: { fontWeight: "800", color: KFitColors.accent },

  list: { paddingHorizontal: 20, marginTop: 16, gap: 12 },
  empty: {
    textAlign: "center",
    color: KFitColors.mutedText,
    fontSize: 14,
    paddingVertical: 32,
  },

  card: {
    backgroundColor: KFitColors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    gap: 12,
  },
  cardSelected: { borderColor: KFitColors.accent },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  avatarText: { fontSize: 18, fontWeight: "900", color: KFitColors.accent },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: "800", color: KFitColors.text },
  specialty: { fontSize: 12, color: KFitColors.mutedText, marginTop: 2 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  metaText: { fontSize: 12, color: KFitColors.text, fontWeight: "700" },
  metaMuted: { fontSize: 12, color: KFitColors.mutedText },
  metaDot: { color: KFitColors.mutedText },

  starRow: { flexDirection: "row", alignItems: "center", gap: 1 },

  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  slotText: { fontSize: 12, color: KFitColors.mutedText },
  chooseButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
  },
  chooseButtonActive: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: KFitColors.accent,
  },
  chooseText: { fontSize: 13, fontWeight: "800", color: KFitColors.onAccent },
  chooseTextActive: { color: KFitColors.accent },

  /* Reviews */
  reviewsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
    minHeight: 32,
  },
  reviewsToggleLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewsToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: KFitColors.text,
  },
  reviewsPanel: { gap: 14 },

  summaryRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  summaryScore: { fontSize: 36, fontWeight: "900", color: KFitColors.accent },
  summaryCount: { fontSize: 12, color: KFitColors.mutedText, marginTop: 4 },

  writeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.accent,
  },
  writeButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: KFitColors.accent,
  },

  form: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    gap: 10,
  },
  formTitle: { fontSize: 14, fontWeight: "800", color: KFitColors.text },
  pickerRow: { flexDirection: "row", gap: 8 },
  commentInput: {
    minHeight: 90,
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    lineHeight: 20,
    color: KFitColors.text,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  counter: { fontSize: 11, color: KFitColors.mutedText, textAlign: "right" },
  errorText: { fontSize: 13, color: KFitColors.error },
  formActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  cancelButton: { paddingHorizontal: 12, paddingVertical: 9 },
  cancelText: { fontSize: 13, fontWeight: "600", color: KFitColors.mutedText },

  reviewItem: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
    gap: 8,
  },
  reviewTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1F",
  },
  reviewAvatarText: {
    fontSize: 12,
    fontWeight: "900",
    color: KFitColors.accent,
  },
  reviewNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewAuthor: { fontSize: 13, fontWeight: "700", color: KFitColors.text },
  youChip: {
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  youChipText: { fontSize: 10, fontWeight: "800", color: KFitColors.accent },
  reviewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  reviewDate: { fontSize: 11, color: KFitColors.mutedText },
  reviewComment: { fontSize: 13, lineHeight: 19, color: KFitColors.mutedText },
});
