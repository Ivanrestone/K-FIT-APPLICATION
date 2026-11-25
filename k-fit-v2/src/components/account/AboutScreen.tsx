import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountTheme } from "@/components/account/theme";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TEAM_MEMBERS: { name: string; title: string; bio: string }[] = [];

export function AboutScreen() {
  const version = Constants.expoConfig?.version || "Unavailable";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AccountPageHeader
          title="About K-FIT"
          subtitle="Fitness, progress, and community."
        />

        <View style={styles.brandCard}>
          <View style={styles.logoFrame}>
            <Image
              source={require("../../../assets/images/logo.jpg")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="K-FIT logo"
            />
          </View>
          <Text style={styles.brandName}>K-FIT</Text>
          <Text style={styles.brandSubtitle}>YOUR FITNESS JOURNEY</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>VERSION {version}</Text>
          </View>
        </View>

        <InfoCard
          icon="flag-outline"
          title="Our Mission"
          body="The official K-FIT mission statement has not been configured in this app."
        />
        <InfoCard
          icon="eye-outline"
          title="Our Vision"
          body="The official K-FIT vision statement has not been configured in this app."
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THE TEAM</Text>
          {TEAM_MEMBERS.length > 0 ? (
            TEAM_MEMBERS.map((member) => (
              <View key={member.name} style={styles.teamCard}>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamTitle}>{member.title}</Text>
                <Text style={styles.teamBio}>{member.bio}</Text>
              </View>
            ))
          ) : (
            <View style={styles.placeholderCard}>
              <Ionicons
                name="people-outline"
                size={21}
                color={AccountTheme.textMuted}
              />
              <Text style={styles.placeholderText}>
                Team profiles have not been configured in this app.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACT & LEGAL</Text>
          <View style={styles.placeholderCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={AccountTheme.textMuted}
            />
            <Text style={styles.placeholderText}>
              Support contacts, social links, and legal documents are not
              configured in this app yet.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>K-FIT - BUILD STRONGER EVERY DAY</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={19} color={AccountTheme.accent} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AccountTheme.background },
  content: { padding: 18, paddingBottom: 30 },
  brandCard: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: AccountTheme.border,
    backgroundColor: AccountTheme.surface,
    padding: 22,
    marginBottom: 14,
  },
  logoFrame: {
    width: 76,
    height: 76,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  logo: { width: "100%", height: "100%" },
  brandName: {
    color: AccountTheme.text,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 11,
  },
  brandSubtitle: {
    color: AccountTheme.accent,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.7,
    marginTop: 3,
  },
  versionBadge: {
    borderRadius: 10,
    backgroundColor: AccountTheme.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 12,
  },
  versionText: {
    color: AccountTheme.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: AccountTheme.border,
    backgroundColor: AccountTheme.surface,
    padding: 14,
    marginBottom: 10,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(250,204,21,0.12)",
  },
  infoCopy: { flex: 1 },
  infoTitle: { color: AccountTheme.text, fontSize: 13, fontWeight: "800" },
  infoBody: {
    color: AccountTheme.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  section: { marginTop: 11, marginBottom: 6 },
  sectionTitle: {
    color: AccountTheme.textMuted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  placeholderCard: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: AccountTheme.border,
    backgroundColor: AccountTheme.surface,
    padding: 14,
  },
  placeholderText: {
    flex: 1,
    color: AccountTheme.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },
  teamCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: AccountTheme.border,
    backgroundColor: AccountTheme.surface,
    padding: 14,
    marginBottom: 8,
  },
  teamName: { color: AccountTheme.text, fontSize: 13, fontWeight: "800" },
  teamTitle: { color: AccountTheme.accent, fontSize: 10, marginTop: 3 },
  teamBio: {
    color: AccountTheme.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7,
  },
  footer: {
    color: AccountTheme.textDim,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 21,
  },
});
