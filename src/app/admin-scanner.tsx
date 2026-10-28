import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sidebar from '@/components/Sidebar';
import { useAttendance, type AttendanceScanResult } from '@/hooks/use-attendance';

const SCAN_COOLDOWN_MS = 3000;

export default function AdminScannerScreen() {
  const attendance = useAttendance();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const isScanningRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState('Ready to scan');
  const [scanResult, setScanResult] = useState<AttendanceScanResult | { outcome: 'error'; error: string; member?: { id: string; name: string } } | null>(null);
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
    try {
      const result = await attendance.scan(data);
      setScanResult(result);
      if (result.outcome === 'check_in' || result.outcome === 'check_out') {
        const label = result.outcome === 'check_in' ? 'Checked in' : 'Checked out';
        setStatusMessage(`${label}: ${result.member?.name ?? 'Member'}`);
      } else {
        setStatusMessage(result.error ?? 'Pass rejected');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Attendance service unavailable.';
      setScanResult({ outcome: 'error', error: message });
      setStatusMessage(message);
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
                <View style={styles.resultCard}>
                  <Text style={styles.resultTitle}>Scan Result</Text>
                  {scanResult.member && <Text style={styles.resultMember}>{scanResult.member.name}</Text>}
                  <Text style={[
                    styles.resultStatus,
                    (scanResult.outcome === 'check_in' || scanResult.outcome === 'check_out') && styles.statusSuccessText,
                    scanResult.outcome === 'expired' && styles.statusExpiredText,
                    !['check_in', 'check_out', 'expired'].includes(scanResult.outcome) && styles.statusInvalidText,
                  ]}>
                    {scanResult.error ?? (scanResult.outcome === 'check_in' ? 'Check-in recorded' : scanResult.outcome === 'check_out' ? 'Check-out recorded' : 'Pass rejected')}
                  </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultMember: {
    color: '#F4C542',
    fontSize: 14,
    marginBottom: 4,
  },
  resultStatus: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  statusSuccessText: {
    color: '#10B981',
  },
  statusExpiredText: {
    color: '#EF4444',
  },
  statusInvalidText: {
    color: '#F59E0B',
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
