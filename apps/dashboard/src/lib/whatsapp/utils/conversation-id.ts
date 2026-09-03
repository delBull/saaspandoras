/**
 * 🆔 CANONICAL WHATSAPP CONVERSATION IDENTITY HELPER
 * apps/dashboard/src/lib/whatsapp/utils/conversation-id.ts
 *
 * Architecture Invariant:
 * Conversation memory MUST be derived from stable canonical tenant identity
 * and normalized E.164 phone digits, NOT from mutable display slugs.
 * Shared deterministically across Inbound (Meta Webhook) and Outbound (Hermes Dispatcher).
 */

export function buildCanonicalWhatsAppConversationId(
  canonicalTenantId: string,
  phoneNumber: string
): string {
  const cleanOrg = canonicalTenantId.toLowerCase().trim().replace(/^org_/, '');
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  return `conv_wa_${cleanOrg}_${cleanPhone}`;
}

/**
 * Redacts phone numbers for production logs to prevent PII exposure.
 * Example: "+52 55 1234 5678" -> "+52 **** 5678"
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return 'N/A';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return '****';
  const prefix = digits.slice(0, 2);
  const suffix = digits.slice(-4);
  return `+${prefix} **** ${suffix}`;
}
