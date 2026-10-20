import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface SidebarProps {
  activeRoute: string;
}

export default function Sidebar({ activeRoute }: SidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => router.replace('/'),
        },
      ]
    );
  };

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
});
