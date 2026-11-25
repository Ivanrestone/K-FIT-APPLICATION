import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Theme = {
  background: '#090A0D',
  surface: '#111318',
  surfaceHigh: '#1A1D24',
  text: '#FFFFFF',
  textMuted: '#8E95A5',
  accent: '#F59E0B',
  onAccent: '#090A0D',
  border: 'rgba(255, 255, 255, 0.08)',
};

type PendingVerificationProps = {
  onRefresh: () => void;
  refreshing?: boolean;
};

export default function PendingVerification({ onRefresh, refreshing = false }: PendingVerificationProps) {
  const handleLogout = async () => {
    const { logout } = await import('@/lib/auth');
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>⏳</Text>
        <Text style={styles.title}>Account Pending Verification</Text>
        <Text style={styles.message}>
          Your account has been created successfully, but it is pending
          verification by K-FIT management before you can access the app.
        </Text>
        <Text style={styles.hint}>
          Please contact K-FIT management to verify your account. Once approved,
          log in again to continue.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color={Theme.onAccent} />
          ) : (
            <Text style={styles.primaryButtonText}>I have been verified — Refresh</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
          <Text style={styles.secondaryButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    fontWeight: '800',
    color: Theme.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: Theme.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  hint: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: Theme.accent,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: Theme.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: Theme.onAccent,
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  secondaryButton: {
    backgroundColor: Theme.surfaceHigh,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  secondaryButtonText: {
    color: Theme.text,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    fontWeight: '700',
  },
});
