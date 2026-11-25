import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  AccountMenuSection,
  AccountRole,
  AccountHeaderStat,
} from "@/components/account/types";

type Props = {
  visible: boolean;
  onClose: () => void;
  role: AccountRole;
  name: string;
  email: string;
  avatarUrl: string | null;
  sections: AccountMenuSection[];
  stats?: AccountHeaderStat[];
  footer: string;
};

const ROLE_LABELS: Record<AccountRole, string> = {
  admin: "ADMIN",
  coach: "COACH",
  member: "MEMBER",
};

const THEME = {
  surface: "#111214",
  surfaceAlt: "#202124",
  text: "#FFFFFF",
  textMuted: "#92949B",
  accent: "#FACC15",
  border: "#303034",
  danger: "#F87171",
};

export function AccountDropdown({
  visible,
  onClose,
  role,
  name,
  email,
  avatarUrl,
  sections,
  stats = [],
  footer,
}: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(0.96));
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.96);
      return;
    }
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 9,
        tension: 110,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [opacity, scale, visible]);

  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || ROLE_LABELS[role][0];
  const menuWidth = Math.min(356, width - 32);
  const maxHeight = Math.max(
    260,
    height - insets.top - insets.bottom - 80,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close account menu"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.menu,
            {
              top: insets.top + 66,
              width: menuWidth,
              maxHeight,
              opacity,
              transform: [
                { scale },
                {
                  translateY: opacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-6, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.profile}>
              <View style={styles.avatar}>
                {avatarUrl && failedAvatarUrl !== avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                    onError={() => setFailedAvatarUrl(avatarUrl)}
                  />
                ) : (
                  <Text style={styles.avatarText}>{initials}</Text>
                )}
              </View>
              <View style={styles.profileText}>
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={styles.email} numberOfLines={1}>
                  {email || "Email unavailable"}
                </Text>
              </View>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{ROLE_LABELS[role]}</Text>
              </View>
            </View>

            {stats.length > 0 && (
              <View style={styles.stats}>
                {stats.map((stat) => (
                  <View key={stat.label} style={styles.stat}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {sections.map((section, index) => (
              <View key={section.title}>
                {index > 0 && <View style={styles.divider} />}
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map((item) => (
                  <Pressable
                    key={item.title}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}. ${item.description}`}
                    onPress={() => {
                      onClose();
                      item.onPress();
                    }}
                    style={({ pressed }) => [
                      styles.item,
                      pressed && styles.itemPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.iconBox,
                        item.danger && styles.dangerIconBox,
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={item.danger ? THEME.danger : THEME.textMuted}
                      />
                    </View>
                    <View style={styles.itemText}>
                      <Text
                        style={[
                          styles.itemTitle,
                          item.danger && styles.dangerText,
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.itemDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                    {item.badge !== undefined &&
                      item.badge !== null &&
                      item.badge > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {item.badge > 99 ? "99+" : item.badge}
                          </Text>
                        </View>
                      )}
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={THEME.textMuted}
                    />
                  </Pressable>
                ))}
              </View>
            ))}

            <View style={styles.divider} />
            <Text style={styles.footer}>{footer}</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  menu: {
    position: "absolute",
    right: 16,
    backgroundColor: THEME.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
    elevation: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.36,
    shadowRadius: 18,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(250,204,21,0.15)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.28)",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { color: THEME.accent, fontSize: 15, fontWeight: "900" },
  profileText: { flex: 1, minWidth: 0 },
  name: { color: THEME.text, fontSize: 14, fontWeight: "800" },
  email: { color: THEME.textMuted, fontSize: 11, marginTop: 3 },
  roleBadge: {
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.3)",
    backgroundColor: "rgba(250,204,21,0.1)",
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  roleText: { color: THEME.accent, fontSize: 8, fontWeight: "900" },
  stats: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 14,
    backgroundColor: THEME.surfaceAlt,
    padding: 10,
    marginBottom: 12,
  },
  stat: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { color: THEME.accent, fontSize: 15, fontWeight: "900" },
  statLabel: {
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
  divider: { height: 1, backgroundColor: THEME.border, marginVertical: 10 },
  sectionTitle: {
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 5,
  },
  item: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 2,
  },
  itemPressed: { backgroundColor: THEME.surfaceAlt },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.surfaceAlt,
  },
  dangerIconBox: { backgroundColor: "rgba(248,113,113,0.12)" },
  itemText: { flex: 1, minWidth: 0 },
  itemTitle: { color: THEME.text, fontSize: 13, fontWeight: "700" },
  itemDescription: { color: THEME.textMuted, fontSize: 10, marginTop: 2 },
  dangerText: { color: THEME.danger },
  badge: {
    minWidth: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: "center",
    backgroundColor: THEME.accent,
  },
  badgeText: { color: "#111214", fontSize: 9, fontWeight: "900" },
  footer: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    paddingBottom: 2,
  },
});
