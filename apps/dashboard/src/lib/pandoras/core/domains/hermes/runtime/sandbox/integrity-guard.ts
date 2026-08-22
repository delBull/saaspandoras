/**
 * 🛡️ Hermes OS — Milestone 7.0: K24 Runtime Integrity Guard
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/sandbox/integrity-guard.ts
 *
 * Protects runtime memory against:
 * 1. Prototype Pollution attacks (`__proto__`, `constructor.prototype`).
 * 2. Monkey-patching and tampering of core security modules and configuration singletons.
 * 3. Deep object freezing and immutability enforcement.
 */

export class RuntimeIntegrityGuard {
  private static DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

  /**
   * Detects if an untrusted payload contains Prototype Pollution attempts.
   */
  public static hasPrototypePollution(payload: unknown): boolean {
    if (!payload || typeof payload !== 'object') return false;

    if (Array.isArray(payload)) {
      return payload.some(item => this.hasPrototypePollution(item));
    }

    for (const key of Object.keys(payload)) {
      if (this.DANGEROUS_KEYS.has(key)) {
        return true;
      }
      if (typeof (payload as Record<string, unknown>)[key] === 'object') {
        if (this.hasPrototypePollution((payload as Record<string, unknown>)[key])) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Sanitizes an object by stripping any prototype pollution keys recursively.
   */
  public static sanitizeObject<T>(input: T): T {
    if (!input || typeof input !== 'object') return input;

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeObject(item)) as unknown as T;
    }

    const clean: Record<string, unknown> = Object.create(null);
    for (const [key, val] of Object.entries(input)) {
      if (this.DANGEROUS_KEYS.has(key)) {
        continue; // Drop dangerous prototype keys
      }
      clean[key] = typeof val === 'object' && val !== null ? this.sanitizeObject(val) : val;
    }

    return clean as T;
  }

  /**
   * Deeply freezes an object to make it completely immutable and tamper-proof.
   */
  public static deepFreeze<T extends object>(obj: T): Readonly<T> {
    const propNames = Object.getOwnPropertyNames(obj);

    for (const name of propNames) {
      const value = (obj as any)[name];
      if (value && typeof value === 'object' && !Object.isFrozen(value)) {
        this.deepFreeze(value);
      }
    }

    return Object.freeze(obj);
  }
}
