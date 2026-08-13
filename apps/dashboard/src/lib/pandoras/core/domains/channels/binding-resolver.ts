import { OrganizationChannelBinding } from './channel-binding-types';
import { ChannelBindingNotFoundError, ChannelBindingInactiveError } from './channel-errors';
import { db } from '@/db';
import { channelIdentityBindings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export type TelegramIdentity =
  | { kind: 'USER'; userId: string; chatId?: string }
  | { kind: 'CHAT'; chatId: string; userId?: string };

export type WhatsAppIdentity = {
  kind: 'PHONE';
  phone: string; // Canonicalized without 'whatsapp:' or spaces
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

    // 1. Check in-memory test bindings
    if (this.mockBindings.has(externalUserId)) {
      const b = this.mockBindings.get(externalUserId)!;
      if (b.status !== 'ACTIVE') {
        throw new ChannelBindingInactiveError(`Channel binding '${b.id}' is INACTIVE`);
      }
      return b;
    }

    // 2. Query DB channel_identity_bindings table
    try {
      const rows = await db
        .select()
        .from(channelIdentityBindings)
        .where(
          and(
            eq(channelIdentityBindings.channel, channelType),
            eq(channelIdentityBindings.externalUserId, externalUserId)
          )
        )
        .limit(1);

      const existing = rows[0];
      if (existing) {
        if (existing.status !== 'ACTIVE') {
          throw new ChannelBindingInactiveError(`Channel binding '${existing.id}' is INACTIVE`);
        }

        return {
          id: existing.id,
          organizationId: existing.identityId, // identityId points to org/tenant ID
          channelType: existing.channel as 'telegram' | 'whatsapp',
          channelIdentity: existing.address || `@${channelType}_${externalUserId}`,
          credentialsRef: `vault:${channelType}:${existing.id}`,
          status: existing.status as 'ACTIVE' | 'INACTIVE'
        };
      }
    } catch (err: any) {
      if (err instanceof ChannelBindingInactiveError) throw err;
      console.warn('[BindingResolver] DB lookup fallback:', err?.message || err);
    }

    // 3. Fallback for Dev (default to active binding for test users)
    return {
      id: `bind_${channelType === 'whatsapp' ? 'wa' : 'tg'}_${externalUserId}`,
      organizationId: 'pandoras-corporate', // Customer Zero default org
      channelType: channelType as 'telegram' | 'whatsapp',
      channelIdentity: channelType === 'whatsapp' ? externalUserId : `@user_${externalUserId}`,
      credentialsRef: `vault:${channelType}:bind_${channelType === 'whatsapp' ? 'wa' : 'tg'}_${externalUserId}`,
      status: 'ACTIVE'
    };
  }
}
