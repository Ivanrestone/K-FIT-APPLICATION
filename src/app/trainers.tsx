import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { KFitColors } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

const STATUS_FILTERS: StatusFilter[] = [
  "All",
  "Available",
  "In session",
  "Fully booked",
];

const WIDE_BREAKPOINT = 820;

export default function TrainersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>("All");

  const statusColor = (status: Status) => {
    switch (status) {
      case "Available":
        return KFitColors.accent;
      case "Fully booked":
        return KFitColors.error;
      case "In session":
        return KFitColors.warning;
    }
  };

  const loadColor = (ratio: number) =>
    ratio >= 1
      ? KFitColors.error
      : ratio >= 0.85
        ? KFitColors.warning
        : KFitColors.accent;

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
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.specialization.toLowerCase().includes(q) ||
        t.certification.toLowerCase().includes(q);
      const matchesFilter =
        selectedFilter === "All" || t.status === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, selectedFilter]);

  const openProfile = (id: string) =>
    router.push({ pathname: "/trainers/[id]", params: { id } } as any);

  const stats = [
    { label: "Total trainers", value: "12" },
    { label: "Available today", value: "8" },
    { label: "Assigned clients", value: "186" },
    { label: "Sessions this week", value: "94" },
  ];

  const renderStatus = (status: Status) => {
    const color = statusColor(status);
    return (
      <View style={[styles.statusBadge, { borderColor: color }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusText, { color }]}>{status}</Text>
      </View>
    );
  };

  const renderLoad = (t: Trainer) => {
    const ratio = t.clients / t.capacity;
    return (
      <View style={styles.loadWrap}>
        <Text style={styles.clientsText}>
          {t.clients}
          <Text style={styles.clientsCap}> / {t.capacity} clients</Text>
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
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Sidebar activeRoute="/trainers" />

        {/* Header + scrollable content */}
        <View style={styles.main}>
          <AppHeader />

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Page title */}
            <View style={[styles.header, !isWide && styles.headerStacked]}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>The coaching team</Text>
                <Text style={styles.headerSubtitle}>
                  Expert people. Personal progress. Manage your club's coaching
                  capacity.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add trainer"
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.addButtonText}>+ Add trainer</Text>
              </Pressable>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
              {stats.map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statNumber}>{s.value}</Text>
                </View>
              ))}
            </View>

            {/* Capacity overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Capacity overview</Text>
              <View style={styles.capacityGrid}>
                <View style={styles.capacityCard}>
                  <Text style={styles.capacityLabel}>Team</Text>
                  <Text style={styles.capacityNumber}>12</Text>
                  <Text style={styles.capacitySublabel}>
                    10 full-time · 2 part-time
                  </Text>
                  <Text style={styles.capacityHighlight}>
                    4 currently in session
                  </Text>
                </View>

                <View style={styles.capacityCard}>
                  <Text style={styles.capacityLabel}>Load</Text>
                  <Text style={styles.capacityNumber}>15.5</Text>
                  <Text style={styles.capacitySublabel}>
                    clients per trainer
                  </Text>
                </View>

                <View style={styles.capacityCard}>
                  <Text style={styles.capacityLabel}>Open time</Text>
                  <Text style={styles.capacityNumber}>28</Text>
                  <Text style={styles.capacitySublabel}>
                    coaching hours available
                  </Text>
                </View>
              </View>
            </View>

            {/* Search + filters */}
            <View style={styles.section}>
              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
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
                    hitSlop={8}
                    accessibilityLabel="Clear search"
                  >
                    <Text style={styles.clearIcon}>✕</Text>
                  </Pressable>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContainer}
              >
                {STATUS_FILTERS.map((filter) => {
                  const active = selectedFilter === filter;
                  return (
                    <Pressable
                      key={filter}
                      onPress={() => setSelectedFilter(filter)}
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
                        {filter}
                      </Text>
                      <Text
                        style={[
                          styles.filterCount,
                          active && styles.filterTabTextActive,
                        ]}
                      >
                        {counts[filter]}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* List */}
            <View style={styles.section}>
              <View style={styles.tableCard}>
                {isWide && (
                  <View style={styles.listHeader}>
                    <Text style={[styles.headerText, styles.colTrainer]}>
                      Trainer
                    </Text>
                    <Text style={[styles.headerText, styles.colSpec]}>
                      Specialization
                    </Text>
                    <Text style={[styles.headerText, styles.colClients]}>
                      Clients
                    </Text>
                    <Text style={[styles.headerText, styles.colNext]}>
                      Next available
                    </Text>
                    <Text style={[styles.headerText, styles.colStatus]}>
                      Status
                    </Text>
                  </View>
                )}

                {filteredTrainers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No trainers found</Text>
                    <Text style={styles.emptyText}>
                      Try a different search or clear the filter.
                    </Text>
                    <Pressable
                      onPress={() => {
                        setSearchQuery("");
                        setSelectedFilter("All");
                      }}
                      style={styles.resetButton}
                    >
                      <Text style={styles.resetText}>Reset filters</Text>
                    </Pressable>
                  </View>
                ) : (
                  filteredTrainers.map((t, i) => {
                    const isLast = i === filteredTrainers.length - 1;

                    const identity = (
                      <View style={styles.identity}>
                        <View style={styles.trainerAvatar}>
                          <Text style={styles.avatarText}>
                            {initials(t.name)}
                          </Text>
                        </View>
                        <View style={styles.flex1}>
                          <Text style={styles.trainerName}>{t.name}</Text>
                          <Text style={styles.trainerCertification}>
                            {t.certification}
                          </Text>
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
                              <Text style={styles.specializationText}>
                                {t.specialization}
                              </Text>
                            </View>
                            <View style={styles.colClients}>
                              {renderLoad(t)}
                            </View>
                            <View style={styles.colNext}>
                              <Text style={styles.availableText}>
                                {t.nextAvailable}
                              </Text>
                              <Text style={styles.subText}>{t.hours}</Text>
                            </View>
                            <View style={[styles.colStatus, styles.statusCol]}>
                              {renderStatus(t.status)}
                              <Text style={styles.chevron}>›</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.rowNarrow}>
                            <View style={styles.rowNarrowTop}>
                              {identity}
                              {renderStatus(t.status)}
                            </View>
                            <Text style={styles.specializationText}>
                              {t.specialization}
                            </Text>
                            {renderLoad(t)}
                            <View style={styles.rowNarrowBottom}>
                              <View style={styles.flex1}>
                                <Text style={styles.availableText}>
                                  Next: {t.nextAvailable}
                                </Text>
                                <Text style={styles.subText}>{t.hours}</Text>
                              </View>
                              <Text style={styles.viewProfileText}>
                                View profile ›
                              </Text>
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
                loaded trainers · 12 total
              </Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerBrand}>
                FORM ATHLETICS • ADMINISTRATOR WORKSPACE
              </Text>
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
  contentContainer: { paddingBottom: 96 },
  flex1: { flex: 1 },
  pressed: { opacity: 0.8 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  headerStacked: { flexDirection: "column", alignItems: "flex-start" },
  headerLeft: { flexShrink: 1 },
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
    maxWidth: 520,
  },
  addButton: {
    backgroundColor: KFitColors.accent,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: KFitColors.onAccent,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  statLabel: {
    fontSize: 12,
    color: KFitColors.mutedText,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: KFitColors.accent,
  },

  // Sections
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: KFitColors.text,
    marginBottom: 12,
  },
  capacityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  capacityCard: {
    flexGrow: 1,
    flexBasis: 200,
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  capacityLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: KFitColors.mutedText,
    marginBottom: 6,
  },
  capacityNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: KFitColors.text,
    marginBottom: 2,
  },
  capacitySublabel: { fontSize: 12, color: KFitColors.mutedText },
  capacityHighlight: {
    fontSize: 12,
    fontWeight: "600",
    color: KFitColors.accent,
    marginTop: 8,
  },

  // Search + filters
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: KFitColors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 14, marginRight: 10 },
  searchInput: { flex: 1, height: 46, fontSize: 14, color: KFitColors.text },
  clearIcon: { fontSize: 14, color: KFitColors.mutedText, padding: 4 },
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

  // Table / list
  tableCard: {
    backgroundColor: KFitColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KFitColors.border,
    overflow: "hidden",
  },
  listHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  headerText: {
    fontSize: 11,
    fontWeight: "700",
    color: KFitColors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  colTrainer: { flex: 2.2, paddingRight: 12 },
  colSpec: { flex: 2, paddingRight: 12 },
  colClients: { flex: 1.8, paddingRight: 12 },
  colNext: { flex: 1.8, paddingRight: 12 },
  colStatus: { flex: 1.4 },

  row: { paddingHorizontal: 16, paddingVertical: 14 },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  rowPressed: { opacity: 0.7 },
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
  },

  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  trainerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: KFitColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "800", color: KFitColors.onAccent },
  trainerName: { fontSize: 14, fontWeight: "700", color: KFitColors.text },
  trainerCertification: {
    fontSize: 11,
    color: KFitColors.mutedText,
    marginTop: 2,
  },
  specializationText: {
    fontSize: 13,
    color: KFitColors.text,
    fontWeight: "500",
  },

  loadWrap: { gap: 6 },
  clientsText: { fontSize: 13, fontWeight: "700", color: KFitColors.text },
  clientsCap: { fontWeight: "400", color: KFitColors.mutedText },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: KFitColors.border,
    overflow: "hidden",
    maxWidth: 160,
  },
  progressFill: { height: "100%", borderRadius: 3 },

  availableText: { fontSize: 13, color: KFitColors.text, fontWeight: "600" },
  subText: { fontSize: 11, color: KFitColors.mutedText, marginTop: 2 },

  statusCol: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  chevron: { fontSize: 22, color: KFitColors.mutedText, marginLeft: 8 },
  viewProfileText: {
    fontSize: 12,
    color: KFitColors.accent,
    fontWeight: "600",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: KFitColors.text,
    marginBottom: 4,
  },
  emptyText: { fontSize: 13, color: KFitColors.mutedText, marginBottom: 16 },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.accent,
  },
  resetText: { fontSize: 13, fontWeight: "600", color: KFitColors.accent },

  // Footer
  footerText: {
    fontSize: 12,
    color: KFitColors.mutedText,
    textAlign: "center",
    marginTop: 14,
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
});
