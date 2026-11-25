import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountTheme } from "@/components/account/theme";
import type { AccountRole } from "@/components/account/types";
import { getCurrentUser } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FAQ = {
  id: string;
  category: string;
  question: string;
  answer: string;
  roles?: AccountRole[];
};

const FAQS: FAQ[] = [
  {
    id: "profile",
    category: "Account",
    question: "How do I update my profile?",
    answer:
      "Open your account menu and choose Settings. Your profile screen lets you review or update the information supported for your account.",
  },
  {
    id: "password",
    category: "Account",
    question: "How can I reset my password?",
    answer:
      "Open Settings, choose Change Password, and request a secure reset email. Check your inbox, including its spam folder, for the reset link.",
  },
  {
    id: "member-qr",
    category: "Membership",
    question: "How do I check in at the gym?",
    answer:
      "Use the central QR access button in the Member navigation. If access is unavailable, check your membership status and ask gym staff to review your account.",
    roles: ["member"],
  },
  {
    id: "member-status",
    category: "Membership",
    question: "Where can I see my membership status?",
    answer:
      "Open Membership from your Member navigation or Settings to view your current membership information and available payment records.",
    roles: ["member"],
  },
  {
    id: "member-attendance",
    category: "Attendance",
    question: "Where can I review my attendance history?",
    answer:
      "Open Attendance from your Member navigation or Settings. The history is loaded from your recorded gym check-ins.",
    roles: ["member"],
  },
  {
    id: "coach-members",
    category: "Coaching",
    question: "Where can I see members assigned to me?",
    answer:
      "Open Clients from the Coach navigation. The list is limited to members assigned to your coach account.",
    roles: ["coach"],
  },
  {
    id: "coach-sessions",
    category: "Coaching",
    question: "Where can I manage training sessions?",
    answer:
      "Use Schedule or Requests in the Coach navigation to review and manage appointment records associated with your account.",
    roles: ["coach"],
  },
  {
    id: "coach-notices",
    category: "Coaching",
    question: "How do I share a gym notice?",
    answer:
      "Open Gym Notices from your account menu or Settings to access the coach announcement screen.",
    roles: ["coach"],
  },
  {
    id: "admin-applications",
    category: "Administration",
    question: "How do I review coach applications?",
    answer:
      "Open Coach Applications from the Admin dashboard or account Settings. The application list is populated from submitted database records.",
    roles: ["admin"],
  },
  {
    id: "admin-attendance",
    category: "Administration",
    question: "How do I review gym attendance?",
    answer:
      "Open Attendance from the Admin dashboard or account Settings to review recorded check-ins and check-outs.",
    roles: ["admin"],
  },
  {
    id: "admin-analytics",
    category: "Analytics",
    question: "How often do dashboard analytics refresh?",
    answer:
      "Dashboard metrics use the latest records available to the app and refresh when their data subscriptions or dashboard refresh cycle update. Some metrics require the related Supabase migrations to be applied.",
    roles: ["admin"],
  },
];

type FAQAccordionProps = {
  faq: FAQ;
  expanded: boolean;
  onPress: () => void;
};

function FAQAccordion({ faq, expanded, onPress }: FAQAccordionProps) {
  const [progress] = useState(() => new Animated.Value(0));
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [expanded, progress]);

  return (
    <View style={styles.faqCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onPress}
        style={({ pressed }) => [styles.question, pressed && styles.pressed]}
      >
        <View style={styles.questionCopy}>
          <Text style={styles.categoryLabel}>{faq.category}</Text>
          <Text style={styles.questionText}>{faq.question}</Text>
        </View>
        <Ionicons
          name={expanded ? "remove-circle-outline" : "add-circle-outline"}
          size={21}
          color={AccountTheme.accent}
        />
      </Pressable>
      <Animated.View
        style={{
          height: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, contentHeight],
          }),
          opacity: progress,
          overflow: "hidden",
        }}
      >
        <View
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            if (nextHeight !== contentHeight) setContentHeight(nextHeight);
          }}
        >
          <Text style={styles.answer}>{faq.answer}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

export function HelpCenterScreen() {
  const [role, setRole] = useState<AccountRole | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getCurrentUser()
      .then((user) => {
        const value = user?.user_metadata?.role;
        if (
          active &&
          (value === "admin" || value === "coach" || value === "member")
        ) {
          setRole(value);
        }
      })
      .catch((error) => {
        console.error("Could not load role for help center:", error);
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleFAQs = useMemo(
    () => FAQS.filter((faq) => !faq.roles || (role && faq.roles.includes(role))),
    [role],
  );
  const categories = useMemo(
    () => ["All", ...new Set(visibleFAQs.map((faq) => faq.category))],
    [visibleFAQs],
  );
  const filteredFAQs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return visibleFAQs.filter((faq) => {
      const inCategory =
        selectedCategory === "All" || faq.category === selectedCategory;
      const matchesSearch =
        !term ||
        `${faq.question} ${faq.answer} ${faq.category}`
          .toLowerCase()
          .includes(term);
      return inCategory && matchesSearch;
    });
  }, [search, selectedCategory, visibleFAQs]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AccountPageHeader
            title="Help & FAQs"
            subtitle="Find clear answers to common questions."
          />

          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={18}
              color={AccountTheme.textMuted}
            />
            <TextInput
              accessibilityLabel="Search frequently asked questions"
              value={search}
              onChangeText={setSearch}
              placeholder="Search questions..."
              placeholderTextColor={AccountTheme.textDim}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setSearch("")}
                hitSlop={8}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={AccountTheme.textMuted}
                />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {categories.map((category) => {
              const selected = category === selectedCategory;
              return (
                <Pressable
                  key={category}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.categoryChip,
                    selected && styles.categoryChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selected && styles.categoryChipTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>POPULAR QUESTIONS</Text>
            <Text style={styles.resultsCount}>{filteredFAQs.length}</Text>
          </View>

          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => (
              <FAQAccordion
                key={faq.id}
                faq={faq}
                expanded={expandedFAQ === faq.id}
                onPress={() =>
                  setExpandedFAQ((current) =>
                    current === faq.id ? null : faq.id,
                  )
                }
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={26}
                color={AccountTheme.textDim}
              />
              <Text style={styles.emptyTitle}>No matching questions</Text>
              <Text style={styles.emptyText}>
                Try another search term or category.
              </Text>
            </View>
          )}

          <View style={styles.supportCard}>
            <View style={styles.supportIcon}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={19}
                color={AccountTheme.accent}
              />
            </View>
            <Text style={styles.supportTitle}>Still need help?</Text>
            <Text style={styles.supportText}>
              Support contact details are not configured in this app yet. Please
              contact your gym administrator directly.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AccountTheme.background },
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 30 },
  searchBox: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AccountTheme.border,
    backgroundColor: AccountTheme.surface,
    paddingHorizontal: 13,
  },
  searchInput: {
    flex: 1,
    color: AccountTheme.text,
    fontSize: 13,
    paddingVertical: 11,
  },
  categories: { gap: 8, paddingVertical: 14 },
  categoryChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AccountTheme.border,
    backgroundColor: AccountTheme.surface,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  categoryChipSelected: {
    backgroundColor: AccountTheme.accent,
    borderColor: AccountTheme.accent,
  },
  categoryChipText: {
    color: AccountTheme.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  categoryChipTextSelected: { color: "#111214" },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  resultsTitle: {
    color: AccountTheme.textMuted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  resultsCount: { color: AccountTheme.textDim, fontSize: 10, fontWeight: "700" },
  faqCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: AccountTheme.border,
    backgroundColor: AccountTheme.surface,
    marginBottom: 8,
    paddingHorizontal: 13,
  },
  question: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  pressed: { opacity: 0.72 },
  questionCopy: { flex: 1 },
  categoryLabel: {
    color: AccountTheme.accent,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  questionText: { color: AccountTheme.text, fontSize: 12, fontWeight: "700" },
  answer: {
    color: AccountTheme.textMuted,
    fontSize: 11,
    lineHeight: 18,
    paddingTop: 1,
    paddingBottom: 14,
  },
  emptyState: {
    alignItems: "center",
    padding: 26,
    borderRadius: 16,
    backgroundColor: AccountTheme.surface,
    gap: 7,
  },
  emptyTitle: { color: AccountTheme.text, fontSize: 13, fontWeight: "800" },
  emptyText: { color: AccountTheme.textMuted, fontSize: 11, textAlign: "center" },
  supportCard: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AccountTheme.border,
    backgroundColor: AccountTheme.surface,
    padding: 18,
    marginTop: 14,
  },
  supportIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(250,204,21,0.12)",
  },
  supportTitle: {
    color: AccountTheme.text,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
  },
  supportText: {
    color: AccountTheme.textMuted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 5,
  },
});
