/**
 * WhatsApp Provider Registry — Layer 2 of the 4-Layer Decoupled Architecture
 *
 * Hermes Runtime calls getWhatsAppProvider(manifest) and receives
 * an IWhatsAppProvider instance without knowing the underlying vendor.
 *
 * Adding a new provider requires:
 * 1. Implementing IWhatsAppProvider
 * 2. Adding a case here
 * 3. Adding to PROVIDER_CATALOG in @pandoras/runtime-sdk
 */

import type { IWhatsAppProvider } from './types.js';
import { MetaWhatsAppProvider } from './meta.js';
import { BaileysWhatsAppProvider } from './baileys.js';

export type SupportedWhatsAppProviderId = 'meta' | 'baileys';

export interface WhatsAppProviderOptions {
  providerId: SupportedWhatsAppProviderId;
  /** Required for Baileys */
  sessionId?: string;
}

/**
 * Factory function — returns the correct IWhatsAppProvider for a given tenant.
 * Called by Hermes Runtime using the TenantRuntimeManifest.
 */
export function getWhatsAppProvider(options: WhatsAppProviderOptions): IWhatsAppProvider {
  switch (options.providerId) {
    case 'meta':
      return new MetaWhatsAppProvider();
    case 'baileys':
      if (!options.sessionId) {
        throw new Error('Baileys provider requires a sessionId');
      }
      return new BaileysWhatsAppProvider(options.sessionId);
    default:
      // Type-safe exhaustive check
      const _exhaustive: never = options.providerId;
      throw new Error(`Unsupported WhatsApp provider: ${String(_exhaustive)}`);
  }
}

export { MetaWhatsAppProvider, BaileysWhatsAppProvider };
export type { IWhatsAppProvider };
