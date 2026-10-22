import MemberBottomNav from '@/components/MemberBottomNav';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Only import QRCode on native platforms
let QRCode: any = null;
if (Platform.OS !== 'web') {
  try {
    QRCode = require('react-native-qrcode-svg').default;
  } catch (e) {
    console.log('QRCode library not available');
  }
}

export default function MemberQRScreen() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(30);
  const [qrData, setQrData] = useState('');
  const [isBlurred, setIsBlurred] = useState(false);
  const appState = useRef(AppState.currentState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate TOTP QR data
  const generateQRData = () => {
    const memberId = 'PM-1042';
    const timestamp = Date.now();
    const hash = Math.random().toString(36).substring(7);
    return `${memberId}|${timestamp}|${hash}`;
  };

  // Handle app state changes for security
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        setIsBlurred(false);
      } else if (nextAppState.match(/inactive|background/)) {
        setIsBlurred(true);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // TOTP timer
  useEffect(() => {
    setQrData(generateQRData());
    setTimeLeft(30);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setQrData(generateQRData());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <View style={styles.content}>
          {/* Page Title */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Your Pass</Text>
            <Text style={styles.pageSubtitle}>Scan at the kiosk to check in</Text>
          </View>

          {/* QR Card */}
          <View style={styles.qrCard}>
            {isBlurred ? (
              <View style={styles.blurredOverlay}>
                <Text style={styles.blurredText}>Tap to reveal</Text>
              </View>
            ) : (
              <>
                <View style={styles.qrPlaceholder}>
                  {qrData ? (
                    QRCode ? (
                      <QRCode
                        value={qrData}
                        size={200}
                        color="#000000"
                        backgroundColor="#FFFFFF"
                      />
                    ) : (
                      <View style={styles.qrGrid}>
                        {[...Array(25)].map((_, i) => (
                          <View key={i} style={styles.qrRow}>
                            {[...Array(25)].map((_, j) => {
                              // Generate a pseudo-random pattern based on qrData
                              const charCode = qrData.charCodeAt((i * 25 + j) % qrData.length);
                              const isFilled = (charCode % 3) === 0;
                              return (
                                <View
                                  key={`${i}-${j}`}
                                  style={[
                                    styles.qrCell,
                                    isFilled && styles.qrCellFilled,
                                  ]}
                                />
                              );
                            })}
                          </View>
                        ))}
                      </View>
                    )
                  ) : (
                    <Text style={styles.loadingText}>Loading QR...</Text>
                  )}
                </View>

                <View style={styles.qrInfo}>
                  <Text style={styles.qrLabel}>Member ID</Text>
                  <Text style={styles.qrValue}>PM-1042</Text>
                </View>
                <View style={styles.qrDivider} />
                <View style={styles.qrInfo}>
                  <Text style={styles.qrLabel}>Refreshes in</Text>
                  <Text style={[styles.qrValue, timeLeft <= 10 && styles.qrValueUrgent]}>
                    {timeLeft}s
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              This QR code refreshes every 30 seconds for security
            </Text>
          </View>

          {/* Usage Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>How to use</Text>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>1</Text>
              <Text style={styles.instructionText}>
                Go to the gym kiosk at the entrance
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>2</Text>
              <Text style={styles.instructionText}>
                Hold your phone with this QR code visible
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>3</Text>
              <Text style={styles.instructionText}>
                Wait for the kiosk to scan and confirm check-in
              </Text>
            </View>
          </View>

          {/* Check-in Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Ready to check in</Text>
            </View>
            <Text style={styles.statusTime}>Last check-in: Oct 19, 06:00 PM</Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerName}>Jordan Lee</Text>
            <Text style={styles.footerLabel}>FORM ATHLETICS MEMBER WORKSPACE</Text>
          </View>
        </View>
        <MemberBottomNav activeRoute="/member-qr" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  brand: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  logout: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  brandClub: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  memberInfo: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  memberLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  memberName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  pageHeader: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  qrCard: {
    marginHorizontal: 20,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    minHeight: 320,
    justifyContent: 'center',
  },
  blurredOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
  },
  blurredText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  qrPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 240,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  webQrPlaceholder: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  webQrText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  webQrSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  qrGrid: {
    gap: 2,
  },
  qrRow: {
    flexDirection: 'row',
    gap: 2,
  },
  qrCell: {
    width: 8,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 1,
  },
  qrCellFilled: {
    backgroundColor: '#111827',
  },
  qrInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  qrLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  qrValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  qrValueUrgent: {
    color: '#EF4444',
  },
  qrDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginBottom: 12,
  },
  securityNotice: {
    marginHorizontal: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  securityIcon: {
    fontSize: 24,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
  },
  instructionsCard: {
    marginHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  statusCard: {
    marginHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  footerLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
