import MemberBottomNav from "@/components/MemberBottomNav";
import { KFitColors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NAV_CLEARANCE = 140;

type Instructor = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  sessions: number;
  nextSlot: string;
};

// TODO: replace with data from your backend.
const INSTRUCTORS: Instructor[] = [
  {
    id: "i1",
    name: "Alex Vance",
    specialty: "CrossFit & Strength",
    rating: 4.9,
    sessions: 312,
    nextSlot: "Today · 5:30 PM",
  },
  {
    id: "i2",
    name: "Elena Rostova",
    specialty: "Yoga & Mobility",
    rating: 4.8,
    sessions: 268,
    nextSlot: "Tomorrow · 7:00 AM",
  },
  {
    id: "i3",
    name: "Marcus Chen",
    specialty: "HIIT & Conditioning",
    rating: 4.7,
    sessions: 204,
    nextSlot: "Tomorrow · 6:00 PM",
  },
  {
    id: "i4",
    name: "Dana Ortiz",
    specialty: "Powerlifting",
    rating: 4.9,
    sessions: 190,
    nextSlot: "Thu · 4:00 PM",
  },
];

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

export default function MemberInstructorsScreen() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INSTRUCTORS;
    return INSTRUCTORS.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.specialty.toLowerCase().includes(q),
    );
  }, [query]);

  const selected = INSTRUCTORS.find((i) => i.id === selectedId) ?? null;

  const choose = (id: string) => {
    void Haptics.selectionAsync();
    setSelectedId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.main}>
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
                          <Feather
                            name="star"
                            size={12}
                            color={KFitColors.accent}
                          />
                          <Text style={styles.metaText}>
                            {i.rating.toFixed(1)}
                          </Text>
                          <Text style={styles.metaDot}>·</Text>
                          <Text style={styles.metaText}>
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
                        <Text style={styles.slotText}>Next: {i.nextSlot}</Text>
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
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

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
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  metaText: { fontSize: 12, color: KFitColors.text, fontWeight: "600" },
  metaDot: { color: KFitColors.mutedText },

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
});
