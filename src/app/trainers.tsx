import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;
type Status = "Available" | "Fully booked" | "In session";
type StatusFilter = "All" | Status;

interface Trainer {
  id: string;
  name: string;
  specialization: string;
  certification: string;
  clients: number;
  capacity: number;
  hours: string;
  nextAvailable: string;
  status: Status;
}

const mockTrainers: Trainer[] = [
  {
    id: "1",
    name: "Marcus Reed",
    specialization: "Strength & conditioning",
    certification: "NASM-CPT",
    clients: 18,
    capacity: 22,
    hours: "Mon–Fri · 6 AM–8 PM",
    nextAvailable: "Today",
    status: "Available",
  },
  {
    id: "2",
    name: "Sofia Chen",
    specialization: "Mobility & functional fitness",
    certification: "ACE",
    clients: 16,
    capacity: 20,
    hours: "Tue–Sat · 7 AM–6 PM",
    nextAvailable: "Today",
    status: "Available",
  },
  {
    id: "3",
    name: "Daniel Brooks",
    specialization: "Endurance & athletic performance",
    certification: "CSCS",
    clients: 20,
    capacity: 24,
    hours: "Mon–Fri · 8 AM–9 PM",
    nextAvailable: "Today",
    status: "Available",
  },
  {
    id: "4",
    name: "Olivia James",
    specialization: "Pilates & recovery",
    certification: "ACE",
    clients: 14,
    capacity: 18,
    hours: "Wed–Sun · 9 AM–5 PM",
    nextAvailable: "Wed, Oct 21 · 9 AM",
    status: "In session",
  },
  {
    id: "5",
    name: "James Carter",
    specialization: "Strength & hypertrophy",
    certification: "NASM",
    clients: 24,
    capacity: 24,
    hours: "Mon–Fri · 10 AM–8 PM",
    nextAvailable: "Thu, Oct 22 · 2 PM",
    status: "Fully booked",
  },
];

const STATUS_FILTERS: {
  key: StatusFilter;
  icon: IconName;
}[] = [
  { key: "All", icon: "apps" },
  { key: "Available", icon: "checkmark-circle" },
  { key: "In session", icon: "play-circle" },
  { key: "Fully booked", icon: "close-circle" },
];

const WIDE_BREAKPOINT = 820;

const statusColor = (status: Status) =>
  status === "Available"
    ? KFitColors.accent
    : status === "Fully booked"
      ? KFitColors.error
      : KFitColors.warning;

const loadColor = (ratio: number) =>
  ratio >= 1
    ? KFitColors.error
    : ratio >= 0.85
      ? KFitColors.warning
      : KFitColors.accent;

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function TrainersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>("All");

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      All: mockTrainers.length,
      Available: 0,
      "In session": 0,
      "Fully booked": 0,
    };
    mockTrainers.forEach((t) => (base[t.status] += 1));
    return base;
  }, []);

  const filteredTrainers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mockTrainers.filter((t) => {
      const matchesSearch =
        q.length === 0 ||
        t.name.toLowerCase().includes(q) ||
        t.specialization.toLowerCase().includes(q) ||
        t.certification.toLowerCase().includes(q);
      const matchesFilter =
        selectedFilter === "All" || t.status === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, selectedFilter]);

  const summary = useMemo(() => {
    const clients = mockTrainers.reduce((s, t) => s + t.clients, 0);
    const capacity = mockTrainers.reduce((s, t) => s + t.capacity, 0);
    return {
      total: mockTrainers.length,
      available: mockTrainers.filter((t) => t.status === "Available").length,
      inSession: mockTrainers.filter((t) => t.status === "In session").length,
      clients,
      openSpots: capacity - clients,
      avgLoad: (clients / mockTrainers.length).toFixed(1),
    };
  }, []);

  const openProfile = (id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/trainers/[id]", params: { id } } as any);
  };

  const stats: {
    label: string;
    value: string;
    icon: IconName;
    tone: string;
  }[] = [
    {
      label: "Total trainers",
      value: `${summary.total}`,
      icon: "people",
      tone: KFitColors.accent,
    },
    {
      label: "Available now",
      value: `${summary.available}`,
      icon: "checkmark-circle",
      tone: "#22C55E",
    },
    {
      label: "Assigned clients",
      value: `${summary.clients}`,
      icon: "person",
      tone: "#3B82F6",
    },
    {
      label: "Open client spots",
      value: `${summary.openSpots}`,
      icon: "add-circle",
      tone: "#F59E0B",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/trainers" />

        <View style={styles.main}>
          <AppHeader />

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Page header */}
            <View style={[styles.pageHeader, isWide && styles.pageHeaderWide]}>
              <View style={styles.headerLeft}>
                <Text style={styles.eyebrow}>COACHING TEAM</Text>
                <Text style={styles.headerTitle}>The coaching team</Text>
                <Text style={styles.headerSubtitle}>
                  Expert people. Personal progress. Manage your club&apos;s
                  coaching capacity.
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert(
                    "Not available yet",
                    "Adding trainers isn't connected to the database yet.",
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel="Add trainer"
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="add" size={16} color={KFitColors.onAccent} />
                <Text style={styles.addButtonText}>Add trainer</Text>
              </Pressable>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
              {stats.map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <View style={styles.statTop}>
                    <Text style={styles.statLabel} numberOfLines={1}>
                      {s.label}
                    </Text>
                    <View
                      style={[
                        styles.statIconBox,
                        {
                          backgroundColor: s.tone + "14",
                          borderColor: s.tone + "44",
                        },
                      ]}
                    >
                      <Ionicons name={s.icon} size={13} color={s.tone} />
                    </View>
                  </View>
                  <Text style={styles.statNumber}>{s.value}</Text>
                </View>
              ))}
            </View>

            {/* Capacity overview */}
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionEyebrow}>CAPACITY</Text>
                <Text style={styles.sectionCaption}>OVERVIEW</Text>
              </View>
              <View style={styles.capacityGrid}>
                <View style={styles.capacityCard}>
                  <View style={styles.capacityHead}>
                    <Text style={styles.capacityLabel}>Team</Text>
                    <View style={styles.capacityIcon}>
                      <Ionicons
                        name="people"
                        size={12}
                        color={KFitColors.accent}
                      />
                    </View>
                  </View>
                  <Text style={styles.capacityNumber}>{summary.total}</Text>
                  <Text style={styles.capacitySublabel}>
                    {summary.inSession} in session now
                  </Text>
                  <View style={styles.capacityBadge}>
                    <View style={styles.capacityDot} />
                    <Text style={styles.capacityBadgeText}>
                      {summary.available} available
                    </Text>
                  </View>
                </View>

                <View style={styles.capacityCard}>
                  <View style={styles.capacityHead}>
                    <Text style={styles.capacityLabel}>Load</Text>
                    <View style={styles.capacityIcon}>
                      <Ionicons
                        name="trending-up"
                        size={12}
                        color={KFitColors.accent}
                      />
                    </View>
                  </View>
                  <Text style={styles.capacityNumber}>{summary.avgLoad}</Text>
                  <Text style={styles.capacitySublabel}>
                    clients per trainer
                  </Text>
                </View>

                <View style={styles.capacityCard}>
                  <View style={styles.capacityHead}>
                    <Text style={styles.capacityLabel}>Open spots</Text>
                    <View style={styles.capacityIcon}>
                      <Ionicons
                        name="time"
                        size={12}
                        color={KFitColors.accent}
                      />
                    </View>
                  </View>
                  <Text style={styles.capacityNumber}>{summary.openSpots}</Text>
                  <Text style={styles.capacitySublabel}>open client spots</Text>
                </View>
              </View>
            </View>

            {/* Search + filters */}
            <View style={styles.section}>
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={16}
                  color={KFitColors.mutedText}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name, specialization or certification"
                  placeholderTextColor={KFitColors.mutedText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  accessibilityLabel="Search trainers"
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => setSearchQuery("")}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
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
                {STATUS_FILTERS.map((f) => {
                  const active = selectedFilter === f.key;
                  const count = counts[f.key];
                  return (
                    <Pressable
                      key={f.key}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setSelectedFilter(f.key);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${f.key}, ${count} trainers`}
                      style={({ pressed }) => [
                        styles.filterTab,
                        active && styles.filterTabActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name={f.icon}
                        size={12}
                        color={
                          active ? KFitColors.onAccent : KFitColors.mutedText
                        }
                      />
                      <Text
                        style={[
                          styles.filterTabText,
                          active && styles.filterTabTextActive,
                        ]}
                      >
                        {f.key}
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
                          {count}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* List */}
            <View style={styles.section}>
              <View style={styles.tableCard}>
                {isWide && filteredTrainers.length > 0 && (
                  <View style={styles.listHeader}>
                    <Text style={[styles.headerText, styles.colTrainer]}>
                      TRAINER
                    </Text>
                    <Text style={[styles.headerText, styles.colSpec]}>
                      SPECIALIZATION
                    </Text>
                    <Text style={[styles.headerText, styles.colClients]}>
                      LOAD
                    </Text>
                    <Text style={[styles.headerText, styles.colNext]}>
                      NEXT AVAILABLE
                    </Text>
                    <Text style={[styles.headerText, styles.colStatus]}>
                      STATUS
                    </Text>
                  </View>
                )}

                {filteredTrainers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconWrap}>
                      <Ionicons
                        name="search"
                        size={22}
                        color={KFitColors.accent}
                      />
                    </View>
                    <Text style={styles.emptyTitle}>No trainers found</Text>
                    <Text style={styles.emptyText}>
                      Try a different search or reset the filter.
                    </Text>
                    <Pressable
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setSearchQuery("");
                        setSelectedFilter("All");
                      }}
                      style={({ pressed }) => [
                        styles.resetButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="refresh"
                        size={13}
                        color={KFitColors.accent}
                      />
                      <Text style={styles.resetText}>Reset filters</Text>
                    </Pressable>
                  </View>
                ) : (
                  filteredTrainers.map((t, i) => {
                    const isLast = i === filteredTrainers.length - 1;
                    const tone = statusColor(t.status);
                    const ratio = t.clients / t.capacity;

                    const identity = (
                      <View style={styles.identity}>
                        <View style={styles.trainerAvatar}>
                          <Text style={styles.avatarText}>
                            {initials(t.name)}
                          </Text>
                        </View>
                        <View style={styles.flex1}>
                          <Text style={styles.trainerName} numberOfLines={1}>
                            {t.name}
                          </Text>
                          <Text style={styles.trainerCertification}>
                            {t.certification}
                          </Text>
                        </View>
                      </View>
                    );

                    const statusBadge = (
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: tone + "1A",
                            borderColor: tone + "44",
                          },
                        ]}
                      >
                        <View
                          style={[styles.statusDot, { backgroundColor: tone }]}
                        />
                        <Text style={[styles.statusText, { color: tone }]}>
                          {t.status.toUpperCase()}
                        </Text>
                      </View>
                    );

                    const load = (
                      <View style={styles.loadWrap}>
                        <Text style={styles.clientsText}>
                          {t.clients}
                          <Text style={styles.clientsCap}> / {t.capacity}</Text>
                        </Text>
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.min(ratio, 1) * 100}%`,
                                backgroundColor: loadColor(ratio),
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );

                    return (
                      <Pressable
                        key={t.id}
                        onPress={() => openProfile(t.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`View ${t.name}'s profile`}
                        style={({ pressed }) => [
                          styles.row,
                          !isLast && styles.rowDivider,
                          pressed && styles.rowPressed,
                        ]}
                      >
                        {isWide ? (
                          <View style={styles.rowWide}>
                            <View style={styles.colTrainer}>{identity}</View>
                            <View style={styles.colSpec}>
                              <Text
                                style={styles.specializationText}
                                numberOfLines={2}
                              >
                                {t.specialization}
                              </Text>
                            </View>
                            <View style={styles.colClients}>{load}</View>
                            <View style={styles.colNext}>
                              <Text style={styles.availableText}>
                                {t.nextAvailable}
                              </Text>
                              <Text style={styles.subText} numberOfLines={1}>
                                {t.hours}
                              </Text>
                            </View>
                            <View style={styles.colStatus}>{statusBadge}</View>
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color={KFitColors.mutedText}
                            />
                          </View>
                        ) : (
                          <View style={styles.rowNarrow}>
                            <View style={styles.rowNarrowTop}>
                              {identity}
                              {statusBadge}
                            </View>
                            <Text
                              style={styles.specializationText}
                              numberOfLines={2}
                            >
                              {t.specialization}
                            </Text>
                            {load}
                            <View style={styles.rowNarrowBottom}>
                              <View style={styles.flex1}>
                                <Text style={styles.availableText}>
                                  Next: {t.nextAvailable}
                                </Text>
                                <Text style={styles.subText} numberOfLines={1}>
                                  {t.hours}
                                </Text>
                              </View>
                              <View style={styles.viewProfile}>
                                <Text style={styles.viewProfileText}>
                                  View profile
                                </Text>
                                <Ionicons
                                  name="chevron-forward"
                                  size={12}
                                  color={KFitColors.accent}
                                />
                              </View>
                            </View>
                          </View>
                        )}
                      </Pressable>
                    );
                  })
                )}
              </View>

              <Text style={styles.footerText}>
                Showing {filteredTrainers.length} of {mockTrainers.length}{" "}
                trainers
              </Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerBrand}>KFIT · ADMIN WORKSPACE</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, flexDirection: "row" },
  main: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1, backgroundColor: KFitColors.background },
  contentContainer: { paddingBottom: 128 },
  flex1: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },

  /* Page header */
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
  },
  pageHeaderWide: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerLeft: { flexShrink: 1, gap: 2 },
  eyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: KFitColors.text,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: KFitColors.mutedText,
    marginTop: 2,
    maxWidth: 520,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: KFitColors.accent,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: KFitColors.onAccent,
    letterSpacing: 0.2,
  },

  /* Stats */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 8,
  },
  statLabel: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: "900",
    color: KFitColors.mutedText,
    letterSpacing: 0.6,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  statIconBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: KFitColors.text,
    letterSpacing: -0.5,
    fontFamily: "monospace",
  },

  /* Sections */
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionEyebrow: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: "monospace",
  },
  sectionCaption: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: "monospace",
  },

  /* Capacity */
  capacityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  capacityCard: {
    flexGrow: 1,
    flexBasis: 200,
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    gap: 4,
  },
  capacityHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  capacityLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  capacityIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
  },
  capacityNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: KFitColors.text,
    fontFamily: "monospace",
    letterSpacing: -0.4,
  },
  capacitySublabel: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  capacityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    alignSelf: "flex-start",
    marginTop: 6,
  },
  capacityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: KFitColors.accent,
  },
  capacityBadgeText: {
    color: KFitColors.accent,
    fontSize: 9,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },

  /* Search */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 12,
    color: KFitColors.text,
    paddingVertical: 0,
  },

  /* Filters */
  filterContainer: { gap: 6 },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingLeft: 10,
    paddingRight: 5,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  filterTabActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  filterTabText: {
    fontSize: 11,
    color: KFitColors.mutedText,
    fontWeight: "700",
  },
  filterTabTextActive: { color: KFitColors.onAccent, fontWeight: "900" },
  filterCount: {
    minWidth: 20,
    paddingHorizontal: 5,
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
    fontSize: 9,
    fontWeight: "900",
    color: KFitColors.mutedText,
    fontFamily: "monospace",
  },
  filterCountTextActive: { color: KFitColors.onAccent },

  /* Table */
  tableCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    overflow: "hidden",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  headerText: {
    fontSize: 9,
    fontWeight: "900",
    color: KFitColors.mutedText,
    letterSpacing: 1.2,
    fontFamily: "monospace",
  },
  colTrainer: { flex: 2.2, paddingRight: 12 },
  colSpec: { flex: 2, paddingRight: 12 },
  colClients: { flex: 1.8, paddingRight: 12 },
  colNext: { flex: 1.8, paddingRight: 12 },
  colStatus: { flex: 1.6, paddingRight: 8 },

  row: { paddingHorizontal: 14, paddingVertical: 12 },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  rowPressed: { opacity: 0.75 },
  rowWide: { flexDirection: "row", alignItems: "center" },
  rowNarrow: { gap: 10 },
  rowNarrowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  rowNarrowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  trainerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "900",
    color: KFitColors.accent,
    fontFamily: "monospace",
    letterSpacing: 0.3,
  },
  trainerName: {
    fontSize: 13,
    fontWeight: "800",
    color: KFitColors.text,
    letterSpacing: -0.2,
  },
  trainerCertification: {
    fontSize: 10,
    color: KFitColors.mutedText,
    marginTop: 2,
    fontFamily: "monospace",
  },
  specializationText: {
    fontSize: 12,
    color: KFitColors.text,
    fontWeight: "600",
  },

  loadWrap: { gap: 5 },
  clientsText: {
    fontSize: 12,
    fontWeight: "900",
    color: KFitColors.text,
    fontFamily: "monospace",
  },
  clientsCap: {
    fontWeight: "400",
    color: KFitColors.mutedText,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    overflow: "hidden",
    maxWidth: 140,
  },
  progressFill: { height: "100%", borderRadius: 2 },

  availableText: {
    fontSize: 12,
    color: KFitColors.text,
    fontWeight: "800",
  },
  subText: {
    fontSize: 10,
    color: KFitColors.mutedText,
    marginTop: 2,
    fontFamily: "monospace",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: {
    fontSize: 8,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },
  viewProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viewProfileText: {
    fontSize: 11,
    color: KFitColors.accent,
    fontWeight: "900",
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
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
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: KFitColors.text,
  },
  emptyText: {
    fontSize: 11,
    color: KFitColors.mutedText,
    textAlign: "center",
    lineHeight: 16,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.accent + "10",
    marginTop: 6,
  },
  resetText: {
    fontSize: 12,
    fontWeight: "900",
    color: KFitColors.accent,
  },

  /* Footer */
  footerText: {
    fontSize: 10,
    color: KFitColors.mutedText,
    textAlign: "center",
    marginTop: 12,
    fontFamily: "monospace",
    opacity: 0.7,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  footerBrand: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    color: KFitColors.mutedText,
    opacity: 0.7,
  },
});
