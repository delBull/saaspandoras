/**
 * 📲 CANONICAL WHATSAPP & TELEPHONY CHANNEL ABSTRACTION (F9.12)
 * apps/dashboard/src/lib/channels/whatsapp/whatsapp-provider.ts
 *
 * Architecture Invariants:
 * 1. Hermes Kernel/Runtime is the brain; WhatsApp is purely an I/O Channel Adapter.
 * 2. Pandora's HQ operates EXCLUSIVELY via Meta WhatsApp Business Cloud API.
 *    - NO silent failover to SignalWire: failure of Meta is a visible, audited error.
 * 3. Operational tenants operate via SignalWire SMS / Omnichannel Telephony adapter.
 * 4. Tenant individual number onboarding/BYO is strictly OUT OF SCOPE for F9.12
 *    and reserved for a dedicated Channel Provisioning phase.
 */

import { SignalWireService } from '@/lib/integrations/signalwire-service';
import { maskPhoneNumber } from '@/lib/whatsapp/utils/conversation-id';

export interface OutboundMessagePayload {
  to: string;
  body: string;
  organizationId?: string;
  leadId?: string;
}

export interface OutboundMessageResult {
  success: boolean;
  providerMessageId?: string;
  provider: 'meta' | 'signalwire';
  error?: string;
}

export interface WhatsAppProvider {
  sendMessage(payload: OutboundMessagePayload): Promise<OutboundMessageResult>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Meta WhatsApp Business API Adapter (Pandora's HQ Primary)
// ─────────────────────────────────────────────────────────────────────────────
export class MetaWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(payload: OutboundMessagePayload): Promise<OutboundMessageResult> {
    const phoneNumberId =
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      process.env.HERMES_WHATSAPP_PHONE_NUMBER_ID ||
      process.env.META_PHONE_NUMBER_ID;

    const token = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !token) {
      const errMsg = 'Meta WhatsApp credentials missing in environment variables (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID).';
      console.error(`[MetaWhatsAppProvider] Fail-Closed: ${errMsg}`);
      return {
        success: false,
        provider: 'meta',
        error: errMsg,
      };
    }

    try {
      const normalizedTo = payload.to.replace(/\D/g, '');
      console.info(`[MetaWhatsAppProvider] Sending WhatsApp message to ${maskPhoneNumber(payload.to)} via PhoneID ${phoneNumberId}`);

      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedTo,
          type: 'text',
          text: { preview_url: false, body: payload.body },
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error('[MetaWhatsAppProvider] Meta Graph API Error:', data.error?.message || `HTTP ${response.status}`);
        return {
          success: false,
          provider: 'meta',
          error: data.error?.message || `HTTP ${response.status}`,
        };
      }

      const messageId = data.messages?.[0]?.id || `wamid_${Date.now()}`;
      return {
        success: true,
        providerMessageId: messageId,
        provider: 'meta',
      };
    } catch (err: any) {
      console.error('[MetaWhatsAppProvider] Network exception dispatching to Meta:', err?.message);
      return {
        success: false,
        provider: 'meta',
        error: err.message || 'Unknown network error',
      };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SignalWire Omnichannel Telephony Adapter (SMS / Telephony)
// ─────────────────────────────────────────────────────────────────────────────
export class SignalWireTelephonyProvider implements WhatsAppProvider {
  async sendMessage(payload: OutboundMessagePayload): Promise<OutboundMessageResult> {
    try {
      console.info(`[SignalWireTelephonyProvider] Sending SMS dispatch to ${maskPhoneNumber(payload.to)}`);
      const result = await SignalWireService.sendSMS({
        to: payload.to,
        body: payload.body,
      });

      if (!result.success) {
        return {
          success: false,
          provider: 'signalwire',
          error: result.error || 'SignalWire dispatch failed',
        };
      }

      return {
        success: true,
        providerMessageId: result.sid,
        provider: 'signalwire',
      };
    } catch (err: any) {
      console.error('[SignalWireTelephonyProvider] Exception:', err?.message);
      return {
        success: false,
        provider: 'signalwire',
        error: err.message,
      };
    }
  }
}

// Backward-compatible alias
export const SignalWireWhatsAppProvider = SignalWireTelephonyProvider;

// ─────────────────────────────────────────────────────────────────────────────
// 3. WhatsApp & Channel Provider Resolver
// ─────────────────────────────────────────────────────────────────────────────
export class WhatsAppProviderResolver {
  private static metaProvider = new MetaWhatsAppProvider();
  private static signalWireProvider = new SignalWireTelephonyProvider();

  /**
   * Resolves the appropriate channel adapter based on the organization scope:
   * - Pandora's HQ (org_1 or org_pandoras) ALWAYS routes to Meta WhatsApp integration.
   *   (Fail-Closed: Will NOT silently fallback to SignalWire).
   * - Tenants route to SignalWire SMS / Omnichannel Telephony adapter.
   */
  public static getProviderForTenant(organizationId?: string): WhatsAppProvider {
    const isHQ = !organizationId || organizationId === 'org_1' || organizationId === 'pandoras' || organizationId.includes('pandora');

    if (isHQ) {
      // Pandora's HQ strictly uses Meta WhatsApp Provider (No silent SMS downgrade)
      return this.metaProvider;
    }

    // Operational Tenants use SignalWire Telephony/SMS adapter
    return this.signalWireProvider;
  }
}
