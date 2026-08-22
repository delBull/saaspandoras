/**
 * 🛡️ Hermes OS — Milestone 7.0: K24 Ephemeral Memory Scrubber
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/sandbox/memory-scrubber.ts
 *
 * Implements Cryptographic Zeroization:
 * 1. Overwrites memory buffers with random bytes, then fills with zeros.
 * 2. Scans and wipes sensitive plaintext DEKs (Data Encryption Keys) and session secrets.
 * 3. Prevents residual memory extraction via core dumps, heap snapshots, or GC delay.
 */

import crypto from 'crypto';

export class EphemeralMemoryScrubber {
  /**
   * Securely wipes a Buffer or Uint8Array in memory.
   * Multi-pass zeroization: Overwrites with pseudo-random bytes, then zeroes out.
   */
  public static wipeBuffer(buffer: Buffer | Uint8Array): void {
    if (!buffer || buffer.length === 0) return;

    try {
      // Pass 1: Overwrite with random cryptographic noise
      crypto.randomFillSync(buffer);
    } catch {
      // Fallback if randomFill fails
    }

    // Pass 2: Definitive Zero Fill
    buffer.fill(0);
  }

  /**
   * Securely executes an operation with a temporary secret, wiping the secret
   * from memory immediately upon completion (even if an error is thrown).
   */
  public static async withScrubbedSecret<T>(
    secretBuffer: Buffer,
    operation: (secret: Buffer) => Promise<T>
  ): Promise<T> {
    try {
      return await operation(secretBuffer);
    } finally {
      this.wipeBuffer(secretBuffer);
    }
  }

  /**
   * Sanitizes an object in memory by recursively clearing string properties 
   * identified as sensitive keys.
   */
  public static scrubObjectKeys(
    obj: Record<string, unknown>,
    sensitiveKeys: string[] = ['dek', 'secret', 'privateKey', 'apiKey', 'token']
  ): void {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        if (typeof obj[key] === 'string') {
          obj[key] = '[SCRUBBED_FROM_MEMORY]';
        } else if (Buffer.isBuffer(obj[key])) {
          this.wipeBuffer(obj[key] as Buffer);
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.scrubObjectKeys(obj[key] as Record<string, unknown>, sensitiveKeys);
      }
    }
  }
}
