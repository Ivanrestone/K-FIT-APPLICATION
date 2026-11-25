import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSoundEffects } from './shared/SoundEffectsProvider';

const Theme = {
  background: '#131313',
  surface: '#1C1B1B',
  text: '#E5E2E1',
  textMuted: '#A98A7D',
  accent: '#FF6B00',
  onAccent: '#FFFFFF',
  border: '#353534',
};

interface MemberBottomNavProps {
  activePath?: string;
}

export default function MemberBottomNav({ activePath = 'home' }: MemberBottomNavProps) {
  const playSound = useSoundEffects();

  const navigate = (
    path:
      | '/member/dashboard'
      | '/member/select-coach'
      | '/member/qr'
      | '/member/appointments'
      | '/member/profile',
  ) => {
    playSound('tap');
    router.replace(path);
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigate('/member/dashboard')}
      >
        <Text style={[styles.navIcon, activePath === 'home' && styles.navIconActive]}>home</Text>
        <Text style={[styles.navLabel, activePath === 'home' && styles.navLabelActive]}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigate('/member/select-coach')}
      >
        <Text style={[styles.navIcon, activePath === 'coach' && styles.navIconActive]}>sports_martial_arts</Text>
        <Text style={[styles.navLabel, activePath === 'coach' && styles.navLabelActive]}>Coach</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.centerNavButton}
        onPress={() => navigate('/member/qr')}
      >
        <View style={styles.centerButtonInner}>
          <Text style={styles.centerIcon}>qr_code_scanner</Text>
        </View>
        <Text style={styles.centerLabel}>Pass</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigate('/member/appointments')}
      >
        <Text style={[styles.navIcon, activePath === 'schedule' && styles.navIconActive]}>calendar_month</Text>
        <Text style={[styles.navLabel, activePath === 'schedule' && styles.navLabelActive]}>Schedule</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigate('/member/profile')}
      >
        <Text style={[styles.navIcon, activePath === 'profile' && styles.navIconActive]}>person</Text>
        <Text style={[styles.navLabel, activePath === 'profile' && styles.navLabelActive]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: Theme.surface,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 22,
    color: Theme.textMuted,
    marginBottom: 2,
  },
  navIconActive: {
    color: Theme.accent,
  },
  navLabel: {
    fontSize: 12,
    color: Theme.textMuted,
  },
  navLabelActive: {
    color: Theme.accent,
  },
  centerNavButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -25,
  },
  centerButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  centerIcon: {
    fontSize: 26,
    color: Theme.onAccent,
  },
  centerLabel: {
    fontSize: 12,
    color: Theme.textMuted,
    marginTop: 4,
  },
});
