import MemberBottomNav from "@/components/MemberBottomNav";
import MemberPaymentOptions from "@/components/MemberPaymentOptions";
import { KFitColors } from "@/constants/theme";
import { useLogout } from "@/hooks/use-logout";
import { useMemberProfile } from "@/hooks/use-member-profile";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Clears the floating nav (dock + raised QR button + safe area).
const NAV_CLEARANCE = 140;

type FeatherName = keyof typeof Feather.glyphMap;

// Replace with real data from your membership API when available.
const MEMBERSHIP = {
  plan: "Performance",
  renewalDate: "November 01, 2026",
  sessionsUsed: 18,
  sessionsTotal: 20,
};

/* ---------------------------- Small building blocks ---------------------------- */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: FeatherName;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon ? (
          <Feather name={icon} size={16} color={KFitColors.accent} />
        ) : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function LinkRow({
  label,
  icon,
  last,
  onPress,
}: {
  label: string;
  icon: FeatherName;
  last?: boolean;
  onPress?: () => void;
}) {
  return (
    <>
      <TouchableOpacity
        style={styles.linkRow}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.linkLeft}>
          <View style={styles.linkIconBox}>
            <Feather name={icon} size={16} color={KFitColors.accent} />
          </View>
          <Text style={styles.linkLabel}>{label}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={KFitColors.mutedText} />
      </TouchableOpacity>
      {!last ? <View style={styles.dividerInset} /> : null}
    </>
  );
}

function GoldButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.goldButton}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      <ImageBackground
        source={require("../../assets/images/gold-texture.jpg")}
        resizeMode="cover"
        style={styles.goldButtonBg}
        imageStyle={styles.goldButtonImage}
      >
        <Text style={styles.goldButtonText}>{label}</Text>
      </ImageBackground>
    </TouchableOpacity>
  );
}

/* ---------------------------------- Screen ---------------------------------- */

export default function MemberMembershipScreen() {
  const router = useRouter();
  const { isSigningOut, logout } = useLogout();
  const { profile } = useMemberProfile();

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );

  const nameParts = [profile?.firstName, profile?.lastName].filter(
    (n): n is string => Boolean(n?.trim()),
  );
  const fullName = nameParts.join(" ") || "Member";
  const initials =
    nameParts
      .map((n) => n.trim().charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "KF";

  const usage = Math.min(MEMBERSHIP.sessionsUsed / MEMBERSHIP.sessionsTotal, 1);
  const sessionsLeft = MEMBERSHIP.sessionsTotal - MEMBERSHIP.sessionsUsed;

  const go = (route: string) => router.replace(route as any);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: NAV_CLEARANCE }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>FORM ATHLETICS</Text>
              <Text style={styles.brandSubtitle}>
                FORM / Brooklyn · Performance club
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              disabled={isSigningOut}
              onPress={logout}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Feather name="log-out" size={14} color={KFitColors.error} />
              <Text style={styles.logoutText}>
                {isSigningOut ? "Signing out…" : "Logout"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.date}>{today}</Text>

          {/* Greeting */}
          <View style={styles.greetingSection}>
            <View style={styles.memberRow}>
              <ImageBackground
                source={require("../../assets/images/gold-texture.jpg")}
                resizeMode="cover"
                style={styles.avatar}
                imageStyle={styles.avatarImage}
              >
                <Text style={styles.avatarInitials}>{initials}</Text>
              </ImageBackground>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberLabel}>MEMBER</Text>
                <Text style={styles.memberName} numberOfLines={1}>
                  {fullName}
                </Text>
              </View>
            </View>
            <Text style={styles.greeting}>Your club, your membership.</Text>
            <Text style={styles.greetingSubtitle}>
              Everything you need to manage your plan and payments.
            </Text>
          </View>

          {/* Plan summary */}
          <View style={styles.planCard}>
            <View style={styles.planTop}>
              <View>
                <Text style={styles.planLabel}>Current plan</Text>
                <Text style={styles.planName}>{MEMBERSHIP.plan}</Text>
              </View>
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>Active</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${usage * 100}%` }]}
              />
            </View>
            <View style={styles.planMeta}>
              <Text style={styles.planMetaText}>
                {MEMBERSHIP.sessionsUsed} / {MEMBERSHIP.sessionsTotal} sessions
                used
              </Text>
              <Text style={styles.planMetaText}>{sessionsLeft} left</Text>
            </View>

            <View style={styles.divider} />
            <View style={styles.renewRow}>
              <Feather name="calendar" size={14} color={KFitColors.mutedText} />
              <Text style={styles.renewText}>
                Renews {MEMBERSHIP.renewalDate}
              </Text>
            </View>
          </View>

          {/* Manage */}
          <Section title="Membership & Payments" icon="credit-card">
            <View style={styles.cardFlush}>
              <LinkRow label="Plan options" icon="layers" />
              <LinkRow label="Billing details" icon="file-text" />
              <LinkRow
                label="My workouts"
                icon="zap"
                onPress={() => go("/member-workout")}
              />
              <LinkRow
                label="Progress & profile"
                icon="user"
                onPress={() => go("/member-profile")}
                last
              />
            </View>
          </Section>

          {/* Payment options */}
          <Section title="Payment Options" icon="dollar-sign">
            <MemberPaymentOptions />
          </Section>

          {/* Help */}
          <Section title="Need a hand?" icon="help-circle">
            <View style={styles.card}>
              <Text style={styles.bodyText}>
                Questions about billing, freezing, or changing your plan? Our
                team can help.
              </Text>
              <GoldButton label="Get help" onPress={() => {}} />
            </View>
          </Section>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>FORM ATHLETICS</Text>
            <Text style={styles.footerVersion}>Member workspace</Text>
          </View>
        </ScrollView>

        <MemberBottomNav activeRoute="/member-membership" />
      </View>
    </SafeAreaView>
  );
}

/* ---------------------------------- Styles ---------------------------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KFitColors.background },
  mainContainer: { flex: 1, backgroundColor: KFitColors.background },
  content: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  brand: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: KFitColors.text,
  },
  brandSubtitle: {
    fontSize: 12,
    color: KFitColors.mutedText,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  logoutText: { fontSize: 12, fontWeight: "700", color: KFitColors.error },
  date: {
    paddingHorizontal: 20,
    marginTop: 10,
    fontSize: 12,
    color: KFitColors.mutedText,
  },

  /* Greeting */
  greetingSection: { paddingHorizontal: 20, marginTop: 20, marginBottom: 20 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: KFitColors.accentDark,
  },
  avatarImage: { borderRadius: 24 },
  avatarInitials: { color: "#121212", fontSize: 16, fontWeight: "900" },
  memberLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: KFitColors.mutedText,
  },
  memberName: {
    fontSize: 20,
    fontWeight: "800",
    color: KFitColors.text,
    marginTop: 2,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: KFitColors.text,
    marginBottom: 6,
  },
  greetingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: KFitColors.mutedText,
  },

  /* Plan card */
  planCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  planTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  planLabel: { fontSize: 12, color: KFitColors.mutedText },
  planName: {
    fontSize: 22,
    fontWeight: "900",
    color: KFitColors.text,
    marginTop: 2,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: KFitColors.accent + "1F",
    borderWidth: 1,
    borderColor: KFitColors.accent + "40",
  },
  statusChipText: { fontSize: 12, fontWeight: "800", color: KFitColors.accent },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: KFitColors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: KFitColors.accent,
  },
  planMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 14,
  },
  planMetaText: { fontSize: 12, color: KFitColors.mutedText },
  renewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 14,
  },
  renewText: { fontSize: 13, fontWeight: "600", color: KFitColors.text },

  /* Sections & cards */
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: KFitColors.text },
  card: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  cardFlush: {
    backgroundColor: KFitColors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  bodyText: {
    fontSize: 14,
    color: KFitColors.text,
    lineHeight: 21,
    marginBottom: 14,
  },

  /* Rows */
  divider: { height: 1, backgroundColor: KFitColors.border },
  dividerInset: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginLeft: 64,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 16,
  },
  linkLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  linkIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "1F",
  },
  linkLabel: { fontSize: 14, color: KFitColors.text, fontWeight: "500" },

  /* Gold button */
  goldButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  goldButtonBg: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  goldButtonImage: { borderRadius: 12 },
  goldButtonText: { color: "#121212", fontSize: 14, fontWeight: "800" },

  /* Footer */
  footer: { paddingVertical: 24, alignItems: "center" },
  footerBrand: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: KFitColors.text,
  },
  footerVersion: { fontSize: 12, color: KFitColors.mutedText, marginTop: 4 },
});
