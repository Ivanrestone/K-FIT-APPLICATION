/**
 * generator.ts
 *
 * Generates unencrypted plain-text user QR code payloads for K-Fit door entry.
 */

export function generateUserQRCode(userId: string): string {
  // Direct plain-text format without AES/crypto wrapper
  return `USER_${userId}`;
}

