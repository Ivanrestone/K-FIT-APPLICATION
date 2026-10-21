import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Sidebar from '@/components/Sidebar';

const SCAN_COOLDOWN_MS = 3000;

export default function AdminScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready to scan');
  const [scanResult, setScanResult] = useState<any>(null);
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
    };
  }, []);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (isScanning) {
      return;
    }

    setIsScanning(true);
    
    // Parse QR data: "memberId|timestamp|hash"
    const parts = data.split('|');
    if (parts.length === 3) {
      const memberId = parts[0];
      const timestamp = parts[1];
      const hash = parts[2];

      // Validate TOTP (simplified - in production, verify hash properly)
      const now = Date.now();
      const qrTime = parseInt(timestamp);
      const timeDiff = Math.abs(now - qrTime);

      if (timeDiff < 30000) {
        // Valid QR code (within 30 seconds)
        setScanResult({
          memberId,
          status: 'success',
          message: 'Check-in successful',
        });
        setStatusMessage(`Check-in: ${memberId}`);
      } else {
        // Expired QR code
        setScanResult({
          memberId,
          status: 'expired',
          message: 'QR code expired',
        });
        setStatusMessage('QR code expired');
      }
    } else {
      // Invalid QR format
      setScanResult({
        status: 'invalid',
        message: 'Invalid QR code',
      });
      setStatusMessage('Invalid QR code');
    }

    resetScanTimer.current = setTimeout(() => {
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

              <View style={[styles.status, isScanning && styles.statusSuccess]}>
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>

              {scanResult && (
                <View style={styles.resultCard}>
                  <Text style={styles.resultTitle}>Scan Result</Text>
                  {scanResult.memberId && (
                    <Text style={styles.resultMember}>Member: {scanResult.memberId}</Text>
                  )}
                  <Text style={[
                    styles.resultStatus,
                    scanResult.status === 'success' && styles.statusSuccessText,
                    scanResult.status === 'expired' && styles.statusExpiredText,
                    scanResult.status === 'invalid' && styles.statusInvalidText,
                  ]}>
                    {scanResult.message}
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
