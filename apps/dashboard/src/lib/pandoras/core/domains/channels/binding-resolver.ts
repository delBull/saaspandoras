import { OrganizationChannelBinding } from './channel-binding-types';
import { ChannelBindingNotFoundError, ChannelBindingInactiveError } from './channel-errors';
import { db } from '@/db';
import { verifiedIdentities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export type TelegramIdentity =
  | { kind: 'USER'; userId: string; chatId?: string; targetTenant?: string }
  | { kind: 'CHAT'; chatId: string; userId?: string; targetTenant?: string };

export type WhatsAppIdentity = {
  kind: 'PHONE';
  phone: string; // Canonicalized without 'whatsapp:' or spaces
  targetTenant?: string;
};

export type ChannelIdentity = TelegramIdentity | WhatsAppIdentity;

export interface BindingResolver {
  resolveBinding(identity: ChannelIdentity): Promise<OrganizationChannelBinding>;
}

export class DatabaseBindingResolver implements BindingResolver {
  private mockBindings = new Map<string, OrganizationChannelBinding>();

  setMockBinding(externalUserId: string, binding: OrganizationChannelBinding): void {
    this.mockBindings.set(externalUserId, binding);
  }

  async resolveBinding(identity: ChannelIdentity): Promise<OrganizationChannelBinding> {
    let externalUserId = '';
    let channelType = '';

    if (identity.kind === 'USER' || identity.kind === 'CHAT') {
      externalUserId = identity.kind === 'USER' ? (identity.userId || '') : identity.chatId;
      channelType = 'telegram';
    } else if (identity.kind === 'PHONE') {
      externalUserId = identity.phone;
      channelType = 'whatsapp';
    }

    if (!externalUserId) {
      throw new ChannelBindingNotFoundError('Identity has no valid external identifier');
    }

    const targetTenant = identity.targetTenant || 'hermes';

    // 1. Check in-memory test bindings
    if (this.mockBindings.has(externalUserId)) {
      const b = this.mockBindings.get(externalUserId)!;
      if (b.status !== 'ACTIVE') {
        throw new ChannelBindingInactiveError(`Channel binding '${b.id}' is INACTIVE`);
      }
      return b;
    }

    // 2. Query DB verified_identities table (Canonical Identity Linking)
    try {
      const rows = await db
        .select()
        .from(verifiedIdentities)
        .where(
          and(
            eq(verifiedIdentities.provider, channelType),
            eq(verifiedIdentities.externalId, externalUserId),
            eq(verifiedIdentities.status, 'ACTIVE')
          )
        )
        .limit(1);

      const verified = rows[0];
      
      if (verified) {
        return {
          id: verified.id,
          organizationId: targetTenant, // Enforced by the Webhook URL parameter / Channel
          channelType: channelType as 'telegram' | 'whatsapp',
          channelIdentity: verified.userId, // Map directly to Canonical User ID
          credentialsRef: `vault:${channelType}:${targetTenant}`,
          status: 'ACTIVE'
        };
      }
    } catch (err: any) {
      console.warn('[BindingResolver] verified_identities DB lookup failed:', err?.message || err);
    }

    // 3. Fallback: Ephemeral Unlinked Identity
    // We DO NOT auto-provision into the DB. We return an ephemeral identity so Hermes can
    // process the message and respond with the "Please link your account" challenge.
    console.log(`[BindingResolver] Unlinked identity detected (${externalUserId}). Returning ephemeral binding for ${targetTenant}`);
    
    return {
      id: `ephemeral_${externalUserId}`,
      organizationId: targetTenant,
      channelType: channelType as 'telegram' | 'whatsapp',
      channelIdentity: `unlinked_${channelType}_${externalUserId}`,
      credentialsRef: `vault:${channelType}:${targetTenant}`,
      status: 'ACTIVE'
    };
  }
}
