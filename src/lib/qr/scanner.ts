import { triggerDoorUnlock } from "@/utils/door-lock";

export interface ProcessScannedCodeResult {
  success: boolean;
  userId?: string;
  error?: string;
  message?: string;
}

/**
 * Validates unencrypted user QR codes (USER_<userId>) instantly without decryption overhead
 * and dispatches a non-blocking hardware unlock request.
 */
export async function processScannedCode(scannedData: string): Promise<ProcessScannedCodeResult> {
  // 1. Direct string validation (No decryption step required)
  if (!scannedData || !scannedData.startsWith("USER_")) {
    return { success: false, error: "Invalid QR Code format" };
  }

  const userId = scannedData.replace("USER_", "").trim();
  if (!userId) {
    return { success: false, error: "Invalid user ID in QR Code" };
  }

  // 2. Dispatch hardware unlock request asynchronously
  void triggerDoorUnlock();

  return {
    success: true,
    userId,
    message: "Access granted. Disengaging magnetic lock.",
  };
}

