import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MemberBottomNavProps {
  activeRoute: string;
}

export default function MemberBottomNav({ activeRoute }: MemberBottomNavProps) {
  const router = useRouter();

  const navItems = [
    { name: 'Progress', route: '/member-dashboard', icon: '📊' },
    { name: 'Workouts', route: '/member-workout', icon: '💪' },
    { name: 'Check-in', route: '/member-checkin', icon: '�' },
    { name: 'Membership', route: '/member-membership', icon: '💳' },
    { name: 'Profile', route: '/member-profile', icon: '👤' },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.route}
          style={styles.navItem}
          onPress={() => router.replace(item.route as any)}
        >
          <Text style={styles.navIcon}>{item.icon}</Text>
          <Text
            style={[
              styles.navText,
              activeRoute === item.route && styles.navTextActive,
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  navTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
});
