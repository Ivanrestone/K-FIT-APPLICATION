import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SidebarProps {
  activeRoute: string;
}

export default function Sidebar({ activeRoute }: SidebarProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', route: '/dashboard', icon: '📊' },
    { name: 'Members', route: '/members', icon: '👥' },
    { name: 'Attendance', route: '/attendance', icon: '📅' },
    { name: 'Trainers', route: '/trainers', icon: '🏋️' },
    { name: 'Memberships', route: '/memberships', icon: '💳' },
    { name: 'Payments', route: '/payments', icon: '💰' },
    { name: 'Memo', route: '/memo', icon: '📝' },
  ];

  const handleLogout = () => {
    setIsMoreOpen(false);
    router.replace('/');
  };

  const isMobile = width < 768;
  const primaryNavItems = navItems.filter((item) =>
    ['/dashboard', '/members', '/attendance', '/trainers', '/payments'].includes(
      item.route
    )
  );
  const secondaryNavItems = navItems.filter(
    (item) => !primaryNavItems.some((primaryItem) => primaryItem.route === item.route)
  );

  if (isMobile) {
    return (
      <>
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {primaryNavItems.map((item) => {
            const isActive = activeRoute === item.route;

            return (
              <Pressable
                key={item.route}
                style={({ pressed }) => [
                  styles.bottomNavItem,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.replace(item.route as any)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={item.name}
              >
                <Text style={[styles.bottomNavIcon, isActive && styles.bottomNavIconActive]}>
                  {item.icon}
                </Text>
                <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            style={({ pressed }) => [
              styles.bottomNavItem,
              pressed && styles.pressed,
            ]}
            onPress={() => setIsMoreOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="More admin navigation"
          >
            <Text style={styles.bottomNavIcon}>•••</Text>
            <Text style={styles.bottomNavLabel}>More</Text>
          </Pressable>
        </View>

        <Modal
          visible={isMoreOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsMoreOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setIsMoreOpen(false)}
          >
            <Pressable
              style={[styles.moreSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
              onPress={(event) => event.stopPropagation()}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Admin tools</Text>
              {secondaryNavItems.map((item) => (
                <Pressable
                  key={item.route}
                  style={({ pressed }) => [
                    styles.moreItem,
                    activeRoute === item.route && styles.moreItemActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    setIsMoreOpen(false);
                    router.replace(item.route as any);
                  }}
                >
                  <Text style={styles.moreItemIcon}>{item.icon}</Text>
                  <Text style={styles.moreItemText}>{item.name}</Text>
                </Pressable>
              ))}
              <Pressable
                style={({ pressed }) => [
                  styles.moreItem,
                  styles.logoutItem,
                  pressed && styles.pressed,
                ]}
                onPress={handleLogout}
              >
                <Text style={styles.moreItemIcon}>↪</Text>
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }

  const sidebarWidth = isCollapsed ? width * 0.08 : width * 0.2;

  return (
    <View style={[styles.sidebar, { width: sidebarWidth }]}>
      <TouchableOpacity
        style={styles.collapseButton}
        onPress={() => setIsCollapsed(!isCollapsed)}
      >
        <Text style={styles.collapseIcon}>{isCollapsed ? '▶' : '◀'}</Text>
      </TouchableOpacity>

      <View style={styles.sidebarNav}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.navItem, activeRoute === item.route && styles.navItemActive]}
            onPress={() => router.replace(item.route as any)}
          >
            <Text style={styles.navIcon}>{item.icon}</Text>
            {!isCollapsed && (
              <Text
                style={[
                  styles.navItemText,
                  activeRoute === item.route && styles.navItemTextActive,
                ]}
              >
                {item.name}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {!isCollapsed && (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      )}
      {isCollapsed && (
        <TouchableOpacity style={styles.logoutButtonCollapsed} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#F9FAFB',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  collapseButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 16,
  },
  collapseIcon: {
    fontSize: 16,
    color: '#6B7280',
  },
  sidebarHeader: {
    marginBottom: 20,
  },
  gymName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  gymSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sidebarDate: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 11,
    color: '#6B7280',
  },
  timeText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  sidebarNav: {
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: '#E5E7EB',
  },
  navIcon: {
    fontSize: 18,
  },
  navItemText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  navItemTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
  },
  logoutButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButtonCollapsed: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 18,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  bottomNavIcon: {
    color: '#9CA3AF',
    fontSize: 19,
    lineHeight: 22,
  },
  bottomNavIconActive: {
    color: '#D99423',
  },
  bottomNavLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomNavLabelActive: {
    color: '#D99423',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.65,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  moreSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    marginBottom: 8,
  },
  sheetTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  moreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  moreItemActive: {
    backgroundColor: '#FEF3C7',
  },
  moreItemIcon: {
    width: 28,
    color: '#6B7280',
    fontSize: 19,
    textAlign: 'center',
  },
  moreItemText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 4,
    paddingTop: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '600',
  },
});
