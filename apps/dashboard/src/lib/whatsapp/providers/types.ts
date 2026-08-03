/**
 * WhatsApp Provider Interface — Layer 2 of the 4-Layer Decoupled Architecture
 *
 * Hermes Runtime only knows "WhatsApp Provider".
 * It does NOT know whether it's Meta, Baileys, Twilio, or any future vendor.
 */

export interface WhatsAppOutboundMessage {
  to: string;           // E.164 phone number e.g. "+521234567890"
  body: string;
  replyToMessageId?: string;
}

export interface WhatsAppProviderResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface WhatsAppInboundMessage {
  from: string;
  messageId: string;
  body: string;
  type: 'text' | 'image' | 'audio' | 'document' | 'sticker' | 'location';
  contactName?: string;
  timestamp?: number;
}

/** The unified interface every WhatsApp Provider must implement */
export interface IWhatsAppProvider {
  readonly providerId: string;
  readonly displayName: string;
  readonly tier: 'enterprise' | 'quick_connect';

  /** Send an outbound message */
  sendMessage(message: WhatsAppOutboundMessage): Promise<WhatsAppProviderResponse>;

  /** Verify webhook signature (returns true if valid) */
  verifyWebhook(payload: unknown, signature: string): boolean;

  /** Parse inbound webhook payload into normalized message */
  parseInbound(payload: unknown): WhatsAppInboundMessage | null;
}
