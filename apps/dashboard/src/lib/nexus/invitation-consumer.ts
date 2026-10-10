import { db } from '@saasfly/db';
import { goldenLinks, marketingLeads, channelIdentityBindings } from '@saasfly/db/schema';
import { eq, and } from '@saasfly/db-core';
import crypto from 'crypto';

export class InvitationConsumerService {
  /**
   * Attempts to consume an invitation token and bind the channel identity to the lead.
   * Returns the lead name if a token was consumed, null otherwise.
   */
  static async attemptConsumption(
    messageText: string,
    channel: string,
    externalUserId: string,
    organizationId: string
  ): Promise<string | null> {
    let token = '';

    // Extract token for Telegram
    if (channel === 'telegram' && messageText.startsWith('/start ')) {
      token = messageText.split(' ')[1]?.trim() || '';
    } else {
      // For WhatsApp or others, it might just be the exact token
      if (/^[A-Za-z0-9_-]{32,}$/.test(messageText.trim())) {
         token = messageText.trim();
      }
    }

    if (!token) return null;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 1. Find active golden link
    const link = await db.query.goldenLinks.findFirst({
      where: and(
        eq(goldenLinks.slug, tokenHash),
        eq(goldenLinks.isActive, true)
      )
    });

    if (!link || !link.metadata || !(link.metadata as any).leadId) {
      return null;
    }

    const leadId = (link.metadata as any).leadId;

    // 2. Consume it atomically
    const [consumed] = await db.update(goldenLinks)
      .set({ isActive: false })
      .where(and(eq(goldenLinks.id, link.id), eq(goldenLinks.isActive, true)))
      .returning({ id: goldenLinks.id });

    if (!consumed) return null; // Concurrency conflict

    // 3. Bind identity to the lead
    const existingBinding = await db.query.channelIdentityBindings.findFirst({
      where: and(
        eq(channelIdentityBindings.channel, channel),
        eq(channelIdentityBindings.externalUserId, externalUserId)
      )
    });

    if (existingBinding) {
      await db.update(channelIdentityBindings)
        .set({ identityId: leadId, status: 'ACTIVE', verifiedAt: new Date() })
        .where(eq(channelIdentityBindings.id, existingBinding.id));
    } else {
      await db.insert(channelIdentityBindings).values({
        identityId: leadId,
        channel: channel,
        externalUserId: externalUserId,
        address: externalUserId,
        status: 'ACTIVE',
        verifiedAt: new Date()
      });
    }

    // 4. Update CRM Stage to QUALIFIED and fetch lead name
    const [updatedLead] = await db.update(marketingLeads)
      .set({ crmStage: 'QUALIFIED', lastAction: 'invitation_consumed', lastEngagementAt: new Date() })
      .where(eq(marketingLeads.id, leadId))
      .returning({ name: marketingLeads.name });

    console.log(`[InvitationConsumer] Consumed token ${tokenHash} for lead ${leadId} via ${channel}`);
    return updatedLead?.name || 'Cliente';
  }
}
