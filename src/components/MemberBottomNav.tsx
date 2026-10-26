import { KFitColors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MemberBottomNavProps {
  activeRoute: string;
}

export default function MemberBottomNav({ activeRoute }: MemberBottomNavProps) {
  const router = useRouter();

  const navItems = [
    { name: 'Progress', route: '/member-dashboard', icon: '📊' },
    { name: 'Workouts', route: '/member-workout', icon: '💪' },
    { name: 'Check-in', route: '/member-checkin', icon: '📍' },
    { name: 'QR Code', route: '/member-qr', icon: '📱' },
    { name: 'Membership', route: '/member-membership', icon: '💳' },
    { name: 'Profile', route: '/member-profile', icon: '👤' },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = activeRoute === item.route;
        return (
          <TouchableOpacity
            key={item.route}
            style={styles.navItem}
            onPress={() => router.replace(item.route as any)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <View style={styles.iconBox}>
              {isActive ? (
                <ImageBackground
                  source={require('../../assets/images/gold-texture.jpg')}
                  resizeMode="cover"
                  style={styles.iconBoxActive}
                  imageStyle={styles.iconBoxActiveImage}
                >
                  <Text style={styles.navIcon}>{item.icon}</Text>
                </ImageBackground>
              ) : (
                <Text style={styles.navIcon}>{item.icon}</Text>
              )}
            </View>
            <Text
              style={[
                styles.navText,
                isActive && styles.navTextActive,
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 20, 20, 0.96)',
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconBox: {
    width: 44,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    width: 44,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: KFitColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  iconBoxActiveImage: {
    borderRadius: 14,
  },
  navIcon: {
    fontSize: 17,
  },
  navText: {
    fontSize: 10,
    color: KFitColors.mutedText,
    fontWeight: '600',
    marginTop: 2,
  },
  navTextActive: {
    color: KFitColors.accentLight,
    fontWeight: '800',
  },
});

