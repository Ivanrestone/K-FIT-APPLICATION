import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const REFRESH_INTERVAL_SECONDS = 15;

function generatePayload() {
  return `test-user-123:${Math.floor(Date.now() / 1000)}`;
}

export default function GeneratorScreen() {
  const router = useRouter();
  const [qrPayload, setQrPayload] = useState(generatePayload);
  const [timeLeft, setTimeLeft] = useState(REFRESH_INTERVAL_SECONDS);
  const [isVisible, setIsVisible] = useState(true);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setQrPayload(generatePayload());
      setTimeLeft(REFRESH_INTERVAL_SECONDS);
    }, REFRESH_INTERVAL_SECONDS * 1000);

    const countdownInterval = setInterval(() => {
      setTimeLeft((currentTime) =>
        currentTime <= 1 ? REFRESH_INTERVAL_SECONDS : currentTime - 1
      );
    }, 1000);

    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState) => {
        const wasInBackground =
          appState.current === 'background' || appState.current === 'inactive';

        if (wasInBackground && nextAppState === 'active') {
          setQrPayload(generatePayload());
          setTimeLeft(REFRESH_INTERVAL_SECONDS);
        }

        setIsVisible(nextAppState === 'active');
        appState.current = nextAppState;
      }
    );

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
      appStateSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>K FIT MEMBER PASS</Text>
            <Text style={styles.title}>Scan to check in</Text>
          </View>
          <Pressable
            onPress={() => router.replace('/')}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>

        <View style={styles.passCard}>
          <Text style={styles.passLabel}>DYNAMIC ACCESS CODE</Text>
          <View style={styles.qrFrame}>
            {isVisible && qrPayload ? (
              <QRCode
                value={qrPayload}
                size={260}
                color="#111827"
                backgroundColor="#FFFFFF"
              />
            ) : (
              <Text style={styles.hiddenCodeText}>QR hidden while app is away</Text>
            )}
          </View>
          <Text style={styles.memberId}>Member ID: test-user-123</Text>
          <Text style={styles.instruction}>
            Show this code to the K Fit door scanner.
          </Text>
        </View>

        <View style={styles.refreshCard}>
          <View style={styles.refreshHeader}>
            <Text style={styles.refreshLabel}>NEW CODE IN</Text>
            <Text style={styles.refreshTime}>{timeLeft}s</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(timeLeft / REFRESH_INTERVAL_SECONDS) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.securityText}>
            This code refreshes automatically for safer entry.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  eyebrow: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
  },
  logoutButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.65,
  },
  passCard: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 28,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  passLabel: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 20,
  },
  qrFrame: {
    width: 292,
    height: 292,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  hiddenCodeText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  memberId: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 20,
  },
  instruction: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  refreshCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  refreshHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  refreshLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  refreshTime: {
    color: '#4F46E5',
    fontSize: 18,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  securityText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 12,
  },
});
