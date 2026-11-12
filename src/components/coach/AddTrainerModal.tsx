import { KFitColors } from "@/constants/theme";
import { useCoachTeam } from "@/hooks/use-coach-team";
import { initials } from "@/lib/coach";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SearchResult = {
  id: string;
  name: string;
  email: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onPromoted: () => void;
};

export default function AddTrainerModal({
  visible,
  onClose,
  onPromoted,
}: Props) {
  const insets = useSafeAreaInsets();
  const { searchMembers, addTrainer } = useCoachTeam();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SearchResult | null>(null);

  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [rate, setRate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    const handle = setTimeout(() => {
      setIsSearching(true);
      setSearchError(null);
      searchMembers(query)
        .then((rows) => setResults(rows))
        .catch((error: unknown) =>
          setSearchError(
            error instanceof Error ? error.message : "Search failed.",
          ),
        )
        .finally(() => setIsSearching(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, searchMembers, visible]);

  const reset = () => {
    setQuery("");
    setResults([]);
    setSelected(null);
    setSpecialty("");
    setBio("");
    setRate("");
    setSubmitError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!selected) {
      setSubmitError("Search for and select a member first.");
      return;
    }
    if (specialty.trim().length === 0) {
      setSubmitError("Add a specialty so members know what they coach.");
      return;
    }
    const hourlyRate = Number(rate.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
      setSubmitError("Hourly rate must be a number.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await addTrainer({
        userId: selected.id,
        specialty: specialty.trim(),
        bio: bio.trim(),
        hourlyRate,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onPromoted();
      close();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not add this trainer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={styles.eyebrow}>ADMIN ONBOARDING</Text>
              <Text style={styles.title}>Add trainer</Text>
            </View>
            <Pressable
              onPress={close}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close add trainer"
              style={styles.closeButton}
            >
              <Ionicons name="close" size={18} color={KFitColors.mutedText} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            <Text style={styles.label}>FIND A MEMBER</Text>
            <View style={styles.search}>
              <Ionicons
                name="search"
                size={15}
                color={KFitColors.mutedText}
              />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Name, email, or member ID"
                placeholderTextColor={KFitColors.mutedText}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Search members by name, email, or member ID"
              />
              {isSearching ? (
                <ActivityIndicator size="small" color={KFitColors.accent} />
              ) : null}
            </View>

            {searchError ? (
              <Text style={styles.errorText}>{searchError}</Text>
            ) : null}

            {selected ? (
              <View style={styles.selectedCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(selected.name)}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.selectedName}>{selected.name}</Text>
                  <Text style={styles.selectedEmail} numberOfLines={1}>
                    {selected.email || selected.id}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelected(null)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear selected member"
                >
                  <Ionicons
                    name="refresh"
                    size={15}
                    color={KFitColors.accent}
                  />
                </Pressable>
              </View>
            ) : results.length === 0 && !isSearching ? (
              <Text style={styles.helper}>
                No members match that search yet.
              </Text>
            ) : (
              results.map((member) => (
                <Pressable
                  key={member.id}
                  style={({ pressed }) => [
                    styles.resultRow,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelected(member);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${member.name}`}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {initials(member.name)}
                    </Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {member.name}
                    </Text>
                    <Text style={styles.resultEmail} numberOfLines={1}>
                      {member.email || member.id}
                    </Text>
                  </View>
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color={KFitColors.accent}
                  />
                </Pressable>
              ))
            )}

            <Text style={[styles.label, styles.labelSpaced]}>
              COACH DETAILS
            </Text>
            <TextInput
              style={styles.input}
              value={specialty}
              onChangeText={setSpecialty}
              placeholder="Specialty (e.g. Strength & conditioning)"
              placeholderTextColor={KFitColors.mutedText}
              accessibilityLabel="Coach specialty"
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              value={bio}
              onChangeText={setBio}
              placeholder="Short bio shown in the directory"
              placeholderTextColor={KFitColors.mutedText}
              multiline
              numberOfLines={3}
              accessibilityLabel="Coach bio"
            />
            <TextInput
              style={styles.input}
              value={rate}
              onChangeText={setRate}
              placeholder="Hourly rate (PHP)"
              placeholderTextColor={KFitColors.mutedText}
              keyboardType="decimal-pad"
              accessibilityLabel="Hourly rate in pesos"
            />

            <View style={styles.statusNote}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={KFitColors.accent}
              />
              <Text style={styles.statusNoteText}>
                Status is set to ON FLOOR when the coach is added.
              </Text>
            </View>

            {submitError ? (
              <Text style={styles.errorText}>{submitError}</Text>
            ) : null}

            <Pressable
              onPress={submit}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Add trainer"
              style={({ pressed }) => [
                styles.submit,
                (pressed || isSubmitting) && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={KFitColors.onAccent} />
              ) : (
                <Ionicons name="add" size={16} color={KFitColors.onAccent} />
              )}
              <Text style={styles.submitText}>
                {isSubmitting ? "Adding coach…" : "Add trainer"}
              </Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: KFitColors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: KFitColors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: KFitColors.border,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  title: {
    color: KFitColors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  body: { gap: 8, paddingBottom: 12 },
  label: {
    color: KFitColors.mutedText,
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: "monospace",
    marginTop: 6,
  },
  labelSpaced: { marginTop: 14 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  searchInput: {
    flex: 1,
    color: KFitColors.text,
    fontSize: 13,
    paddingVertical: 0,
  },
  helper: {
    color: KFitColors.mutedText,
    fontSize: 12,
    paddingVertical: 10,
    textAlign: "center",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  avatarText: {
    color: KFitColors.accent,
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  resultName: { color: KFitColors.text, fontSize: 13, fontWeight: "800" },
  resultEmail: { color: KFitColors.mutedText, fontSize: 11, marginTop: 1 },
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.accent + "12",
  },
  selectedName: { color: KFitColors.text, fontSize: 13, fontWeight: "900" },
  selectedEmail: { color: KFitColors.mutedText, fontSize: 11, marginTop: 1 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
    color: KFitColors.text,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
  },
  multiline: { minHeight: 74, textAlignVertical: "top" },
  statusNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  statusNoteText: { color: KFitColors.mutedText, fontSize: 11 },
  errorText: { color: KFitColors.error, fontSize: 12 },
  submit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: KFitColors.accent,
    marginTop: 8,
  },
  submitText: {
    color: KFitColors.onAccent,
    fontSize: 14,
    fontWeight: "900",
  },
});
