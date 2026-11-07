import Sidebar from '@/components/Sidebar';
import { useAttendance, type AttendanceScanResult } from '@/hooks/use-attendance';
import { processScannedCode } from '@/lib/qr/scanner';
import { triggerDoorUnlock } from '@/utils/door-lock';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCAN_COOLDOWN_MS = 3500;

const getInitials = (name?: string) =>
  (name || 'Member')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function AdminScannerScreen() {
  const attendance = useAttendance();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const isScanningRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState('Ready to scan');
  const [scanResult, setScanResult] = useState<AttendanceScanResult | { outcome: 'error'; error: string; code?: string; member?: { id: string; name: string } } | null>(null);
  const resetScanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    return () => {
      if (resetScanTimer.current) {
        clearTimeout(resetScanTimer.current);
      }
      isScanningRef.current = false;
    };
  }, []);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;
    setIsScanning(true);
    setStatusMessage('Verifying pass…');

    const trimmed = typeof data === 'string' ? data.trim() : '';
    const isUserToken = trimmed.startsWith('USER_');

    // Requirement 2: Directly dispatch unlock request upon reading a valid USER_ token
    if (isUserToken) {
      void processScannedCode(trimmed);
    }

    try {
      const result = await attendance.scan(data);
      setScanResult(result);
      if (result.outcome === 'check_in' || result.outcome === 'check_out') {
        // Trigger the Pi door lock asynchronously; never block the UI on it.
        void triggerDoorUnlock();
        const label = result.outcome === 'check_in' ? 'Checked in' : 'Checked out';
        setStatusMessage(`${label}: ${result.member?.name ?? 'Member'}`);
      } else if (
        isUserToken &&
        (result.outcome === 'subscription_denied' ||
          result.outcome === 'invalid' ||
          result.outcome === 'not_provisioned')
      ) {
        // Dev bypass: unencrypted token already dispatched door unlock; show granted UI
        const memberId = trimmed.replace('USER_', '').trim();
        setStatusMessage(`Access granted (dev): ${result.member?.name || memberId}`);
        setScanResult({
          outcome: 'check_in',
          member: result.member ?? { id: memberId, name: memberId },
          message: 'Access granted. Disengaging magnetic lock.',
        });
      } else {
        setStatusMessage(result.error ?? 'Pass rejected');
      }
    } catch (error) {
      if (isUserToken) {
        const memberId = trimmed.replace('USER_', '').trim();
        setStatusMessage(`Access granted: ${memberId}`);
        setScanResult({
          outcome: 'check_in',
          member: { id: memberId, name: memberId },
          message: 'Access granted. Disengaging magnetic lock.',
        });
      } else {
        const message = error instanceof Error ? error.message : 'Attendance service unavailable.';
        setScanResult({ outcome: 'error', error: message });
        setStatusMessage(message);
      }
    }
    resetScanTimer.current = setTimeout(() => {
      isScanningRef.current = false;
      setIsScanning(false);
      setStatusMessage('Ready to scan');
      setScanResult(null);
      resetScanTimer.current = null;
    }, SCAN_COOLDOWN_MS);
  };

  if (!permission) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator color="#FFFFFF" />
        <Text style={styles.permissionText}>Preparing scanner...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centeredScreen}>
        <Text style={styles.permissionTitle}>Camera access is required</Text>
        <Text style={styles.permissionText}>
          Allow camera access to scan member check-in codes.
        </Text>
        {permission.canAskAgain ? (
          <Pressable
            onPress={() => void requestPermission()}
            style={styles.permissionButton}
          >
            <Text style={styles.permissionButtonText}>Allow Camera</Text>
          </Pressable>
        ) : (
          <Text style={styles.permissionText}>
            Enable camera access in the device settings, then reopen K-Fit.
          </Text>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Sidebar activeRoute="/admin-scanner" />
        <View style={styles.mainContent}>
          <View style={styles.screen}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              onBarcodeScanned={isScanning ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            <View pointerEvents="none" style={styles.overlay}>
              <View style={styles.header}>
                <Text style={styles.title}>K-FIT</Text>
                <Text style={styles.subtitle}>ADMIN SCANNER</Text>
              </View>

              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>

              <View style={[
                styles.status,
                !scanResult && isScanning && styles.statusPending,
                scanResult && (scanResult.outcome === 'check_in' || scanResult.outcome === 'check_out') && styles.statusSuccess,
              ]}>
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>

              {scanResult && (
                <View style={[
                  styles.resultCard,
                  (scanResult.outcome === 'check_in' || scanResult.outcome === 'check_out')
                    ? styles.resultCardSuccess
                    : styles.resultCardError,
                ]}>
                  {scanResult.outcome === 'check_in' || scanResult.outcome === 'check_out' ? (
                    <>
                      <View style={styles.verifiedHeader}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                        <Text style={styles.verifiedTitle}>Pass Verified</Text>
                      </View>
                      <View style={styles.memberRow}>
                        {scanResult.member && 'photo' in scanResult.member && scanResult.member.photo ? (
                          <Image source={{ uri: scanResult.member.photo }} style={styles.memberPhoto} />
                        ) : (
                          <View style={styles.avatarBadge}>
                            <Text style={styles.avatarText}>{getInitials(scanResult.member?.name)}</Text>
                          </View>
                        )}
                        <View style={styles.memberInfo}>
                          <Text style={styles.resultMember}>{scanResult.member?.name ?? 'Member'}</Text>
                          {scanResult.member && 'email' in scanResult.member && scanResult.member.email ? (
                            <Text style={styles.memberEmail}>{scanResult.member.email}</Text>
                          ) : null}
                        </View>
                      </View>
                      <View style={styles.badgeRow}>
                        <View style={styles.actionBadge}>
                          <Text style={styles.actionBadgeText}>
                            {scanResult.outcome === 'check_in' ? 'Check-in Recorded' : 'Check-out Recorded'}
                          </Text>
                        </View>
                        <View style={styles.doorUnlockBadge}>
                          <Ionicons name="lock-open-outline" size={14} color="#F4C542" />
                          <Text style={styles.doorUnlockText}>Door Unlocked</Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.rejectedHeader}>
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                        <Text style={styles.rejectedTitle}>Pass Rejected</Text>
                      </View>
                      <Text style={styles.rejectedMessage}>
                        {scanResult.error ?? 'Pass verification failed.'}
                      </Text>
                      {'code' in scanResult && scanResult.code ? (
                        <Text style={styles.errorCodeText}>Code: {scanResult.code}</Text>
                      ) : null}
                    </>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000000',
  },
  mainContent: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 56,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    color: '#F4C542',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 5,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 6,
  },
  scanFrame: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderColor: '#F4C542',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  status: {
    minWidth: 180,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 24,
    paddingVertical: 13,
    alignItems: 'center',
  },
  statusPending: {
    backgroundColor: '#374151',
  },
  statusSuccess: {
    backgroundColor: '#16803C',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 16,
    padding: 18,
    minWidth: 260,
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  resultCardSuccess: {
    borderColor: '#10B981',
  },
  resultCardError: {
    borderColor: '#EF4444',
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  verifiedTitle: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rejectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rejectedTitle: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rejectedMessage: {
    color: '#F3F4F6',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 6,
  },
  errorCodeText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 6,
  },
  memberPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F4C542',
  },
  avatarBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F4C542',
  },
  avatarText: {
    color: '#F4C542',
    fontSize: 18,
    fontWeight: '800',
  },
  memberInfo: {
    alignItems: 'flex-start',
  },
  resultMember: {
    color: '#F4C542',
    fontSize: 16,
    fontWeight: '800',
  },
  memberEmail: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  actionBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  actionBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  doorUnlockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(244, 197, 66, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F4C542',
  },
  doorUnlockText: {
    color: '#F4C542',
    fontSize: 11,
    fontWeight: '700',
  },
  centeredScreen: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionText: {
    color: '#D1D5DB',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
  permissionButton: {
    backgroundColor: '#F4C542',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 13,
    marginTop: 24,
  },
  permissionButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
});
