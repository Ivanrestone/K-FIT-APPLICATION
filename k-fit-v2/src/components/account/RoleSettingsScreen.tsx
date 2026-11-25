import type { AccountRole } from "@/components/account/types";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountTheme } from "@/components/account/theme";
import { requireRole, resetPassword } from "@/lib/auth";
import { router } from "expo-router";
import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BOTTOM_NAV_CLEARANCE } from "@/components/navigation/FloatingTabBar";

type SettingsAction = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
};

const ROLE_LABELS: Record<AccountRole, string> = {
  admin: "Admin",
  coach: "Coach",
  member: "Member",
};

const PROFILE_ROUTES: Record<AccountRole, string> = {
  admin: "/admin/profile",
  coach: "/coach/profile",
  member: "/member/edit-profile",
};

const NOTIFICATION_ROUTES: Record<AccountRole, string> = {
  admin: "/admin/notifications",
  coach: "/coach/announcements",
  member: "/member/notifications",
};

const ADMIN_ACTIONS: SettingsAction[] = [
  {
    title: "Coach Applications",
    description: "Review and process coach applications",
    icon: "person-add-outline",
    route: "/admin/coach-applications",
  },
  {
    title: "Announcements",
    description: "Create and manage gym announcements",
    icon: "megaphone-outline",
    route: "/admin/announcements",
  },
  {
    title: "Member Access Grants",
    description: "Manage approved signup email addresses",
    icon: "key-outline",
    route: "/admin/access-grants",
  },
  {
    title: "Payments",
    description: "Review payment records",
    icon: "card-outline",
    route: "/admin/payments",
  },
];

type Props = {
  role: AccountRole;
};

export function RoleSettingsScreen({ role }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void requireRole(role)
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error) => {
        console.error(`Unable to authorize ${role} settings:`, error);
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadAttempt, role]);

  const startPasswordReset = () => {
    const email = user?.email;
    if (typeof email !== "string" || !email) {
      Alert.alert("Email unavailable", "Your account email could not be loaded.");
      return;
    }

    Alert.alert(
      "Reset password",
      `Send a password reset email to ${email}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send email",
          onPress: () => {
            setResettingPassword(true);
            void resetPassword(email)
              .then((result) => {
                if (!result.success) {
                  Alert.alert(
                    "Unable to send email",
                    result.error || "Please try again.",
                  );
                  return;
                }
                Alert.alert(
                  "Email sent",
                  "Use the password reset link in your inbox to choose a new password.",
                );
              })
              .catch((error) => {
                console.error("Password reset request failed:", error);
                Alert.alert(
                  "Unable to send email",
                  "Please try again later.",
                );
              })
              .finally(() => setResettingPassword(false));
          },
        },
      ],
    );
  };

  const profileAction: SettingsAction = {
    title: role === "member" ? "Edit My Profile" : "My Profile",
    description:
      role === "member"
        ? "Update personal information"
        : "View your account and profile information",
    icon: "person-outline",
    route: PROFILE_ROUTES[role],
  };
  const memberActions: SettingsAction[] = [
    {
      title: "Membership & Billing",
      description: "View your plan and payment history",
      icon: "card-outline",
      route: "/member/membership",
    },
    {
      title: "Attendance & Gate Logs",
      description: "Review your check-in history",
      icon: "time-outline",
      route: "/member/attendance",
    },
  ];
  const updatesAction: SettingsAction = {
    title: role === "coach" ? "Gym Notices" : "Notification Center",
    description:
      role === "coach"
        ? "Review permitted gym announcements"
        : "View in-app updates and announcements",
    icon: "notifications-outline",
    route: NOTIFICATION_ROUTES[role],
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AccountTheme.accent} />
        <Text style={styles.loadingText}>Loading account settings...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>
          {loadError
            ? "Unable to load settings. Check your connection and try again."
            : "Returning to sign in..."}
        </Text>
        {loadError && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setLoading(true);
              setLoadError(false);
              setUser(null);
              setLoadAttempt((attempt) => attempt + 1);
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AccountPageHeader
        eyebrow={`${ROLE_LABELS[role]} account`}
        title="Settings"
        subtitle="Manage your account and supported preferences."
      />

      <View style={styles.emailCard}>
        <View style={styles.emailIcon}>
          <Ionicons name="mail-outline" size={18} color={AccountTheme.accent} />
        </View>
        <View style={styles.emailCopy}>
          <Text style={styles.label}>REGISTERED EMAIL</Text>
          <Text style={styles.email} numberOfLines={2}>
            {user.email || "Email unavailable"}
          </Text>
        </View>
      </View>

      <SettingsSection title="ACCOUNT">
        <SettingsRow
          action={profileAction}
          onPress={() => router.push(profileAction.route as never)}
        />
        <SettingsRow
          action={{
            title: resettingPassword ? "Sending reset email..." : "Change Password",
            description: "Send a secure password reset link to your email",
            icon: "lock-closed-outline",
          }}
          onPress={startPasswordReset}
          disabled={resettingPassword}
        />
      </SettingsSection>

      {role === "member" && (
        <SettingsSection title="MEMBERSHIP & ACCESS">
          {memberActions.map((action) => (
            <SettingsRow
              key={action.title}
              action={action}
              onPress={() => router.push(action.route as never)}
            />
          ))}
          <View style={styles.infoNote}>
            <Ionicons
              name="information-circle-outline"
              size={17}
              color={AccountTheme.textMuted}
            />
            <Text style={styles.noteText}>
              Use the central QR access button in the bottom navigation for gym entry.
            </Text>
          </View>
        </SettingsSection>
      )}

      <SettingsSection title="NOTIFICATIONS">
        <SettingsRow
          action={updatesAction}
          onPress={() => router.push(updatesAction.route as never)}
        />
        <View style={styles.infoNote}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color={AccountTheme.textMuted}
          />
          <Text style={styles.noteText}>
            Per-category notification preferences are not configured yet.
          </Text>
        </View>
      </SettingsSection>

      {role === "admin" && (
        <SettingsSection title="SYSTEM MANAGEMENT">
          {ADMIN_ACTIONS.map((action) => (
            <SettingsRow
              key={action.title}
              action={action}
              onPress={() => router.push(action.route as never)}
            />
          ))}
          <View style={styles.infoNote}>
            <Ionicons
              name="information-circle-outline"
              size={17}
              color={AccountTheme.textMuted}
            />
            <Text style={styles.noteText}>
              Gym hours, capacity, payment configuration, and staff role editing do not have persistent settings controls in this app yet.
            </Text>
          </View>
        </SettingsSection>
      )}

      {role === "coach" && (
        <SettingsSection title="COACHING PREFERENCES">
          <View style={styles.infoNote}>
            <Ionicons
              name="information-circle-outline"
              size={17}
              color={AccountTheme.textMuted}
            />
            <Text style={styles.noteText}>
              Your biography, specialties, certifications, contact phone, and preferred session types are managed from My Profile. Recurring availability and per-category notification controls are not configured yet.
            </Text>
          </View>
        </SettingsSection>
      )}

      <SettingsSection title="APP PREFERENCES">
        <View style={styles.preferenceRow}>
          <View style={styles.rowIcon}>
            <Ionicons
              name="moon-outline"
              size={18}
              color={AccountTheme.textMuted}
            />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Appearance</Text>
            <Text style={styles.rowDescription}>
              K-FIT currently uses its dark appearance
            </Text>
          </View>
          <Text style={styles.readOnly}>CURRENT</Text>
        </View>
        <View style={styles.infoNote}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color={AccountTheme.textMuted}
          />
          <Text style={styles.noteText}>
            Theme, language, and per-category notification preferences are not persisted yet.
          </Text>
        </View>
      </SettingsSection>
    </ScrollView>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingsRow({
  action,
  onPress,
  disabled = false,
}: {
  action: SettingsAction;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${action.title}. ${action.description}`}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={action.icon} size={18} color={AccountTheme.textMuted} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{action.title}</Text>
        <Text style={styles.rowDescription}>{action.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={AccountTheme.textDim} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AccountTheme.background },
  content: {
    padding: 18,
    paddingTop: 16,
    paddingBottom: BOTTOM_NAV_CLEARANCE + 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: AccountTheme.background,
  },
  loadingText: { color: AccountTheme.textMuted, fontSize: 13 },
  retryButton: {
    borderRadius: 12,
    backgroundColor: AccountTheme.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: { color: "#111214", fontSize: 12, fontWeight: "800" },
  emailCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: AccountTheme.surface,
    borderWidth: 1,
    borderColor: AccountTheme.border,
    marginBottom: 20,
  },
  emailIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: AccountTheme.surfaceAlt,
  },
  emailCopy: { flex: 1 },
  label: {
    color: AccountTheme.textDim,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  email: { color: AccountTheme.text, fontSize: 13, fontWeight: "700", marginTop: 4 },
  section: { marginBottom: 18 },
  sectionTitle: {
    color: AccountTheme.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  sectionCard: {
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: AccountTheme.surface,
    borderWidth: 1,
    borderColor: AccountTheme.border,
  },
  row: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 9,
  },
  rowPressed: { opacity: 0.65 },
  rowDisabled: { opacity: 0.6 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AccountTheme.surfaceAlt,
  },
  rowCopy: { flex: 1 },
  rowTitle: { color: AccountTheme.text, fontSize: 13, fontWeight: "700" },
  rowDescription: {
    color: AccountTheme.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 12,
  },
  readOnly: {
    color: AccountTheme.textDim,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: AccountTheme.border,
    paddingVertical: 12,
  },
  noteText: {
    flex: 1,
    color: AccountTheme.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },
});
