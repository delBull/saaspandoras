'use server';

import { db } from '@/db';
import { hermesConversations, hermesConversationMessages, hermesEscalations } from '@/db/schema';
import { eq, desc, and, or } from 'drizzle-orm';
import type { MessageView } from '@/components/hermes-portal/conversations/ConversationsDashboard';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { EscalationService } from '@/lib/hermes/escalation/escalation-service';

export async function getConversationMessages(organizationSlug: string, conversationId: string): Promise<MessageView[]> {
  try {
    const ctx = await resolvePortalContext(organizationSlug);
    const orgId = ctx.tenant.organizationId;
    const orgSlug = ctx.tenant.organizationSlug || organizationSlug;

    const messages = await db
      .select()
      .from(hermesConversationMessages)
      .where(
        and(
          or(
            eq(hermesConversationMessages.organizationId, orgSlug),
            eq(hermesConversationMessages.organizationId, orgId),
            eq(hermesConversationMessages.organizationId, organizationSlug)
          ),
          eq(hermesConversationMessages.conversationId, conversationId)
        )
      )
      .orderBy(hermesConversationMessages.sequence);

    return messages.map(msg => {
      let content = msg.content;
      // Sanitize RUNTIME ACTIVITY to prevent leaking internal logic
      if (msg.role === 'ACTIVITY' || msg.role === 'SYSTEM') {
        return {
          id: msg.id,
          role: 'ACTIVITY',
          content: msg.content || 'Hermes evaluated cognitive context.',
          createdAt: msg.createdAt,
        };
      }

      return {
        id: msg.id,
        role: msg.role as 'USER' | 'ASSISTANT' | 'SYSTEM' | 'OPERATOR',
        content,
        createdAt: msg.createdAt,
      };
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

export async function triggerManualTakeover(organizationSlug: string, conversationId: string, operatorId: string = 'operator') {
  try {
    const ctx = await resolvePortalContext(organizationSlug);
    const orgSlug = ctx.tenant.organizationSlug || organizationSlug;

    const escalation = await EscalationService.triggerEscalation({
      organizationId: orgSlug,
      conversationId,
      actorId: operatorId,
      channel: 'WEB',
      reason: 'MANUAL',
      notes: `Manual takeover initiated by operator ${operatorId}`,
    });

    return { success: true, escalation };
  } catch (error: any) {
    console.error("Error initiating takeover:", error);
    return { success: false, error: error.message };
  }
}

export async function sendHumanReply(organizationSlug: string, escalationId: string, content: string, operatorId: string = 'operator') {
  try {
    const ctx = await resolvePortalContext(organizationSlug);
    const orgSlug = ctx.tenant.organizationSlug || organizationSlug;

    const message = await EscalationService.replyAsHuman({
      organizationId: orgSlug,
      escalationId,
      content,
      operatorId,
    });

    return { success: true, message };
  } catch (error: any) {
    console.error("Error sending human reply:", error);
    return { success: false, error: error.message };
  }
}

export async function resumeHermesControl(organizationSlug: string, escalationId: string, operatorId: string = 'operator', notes?: string) {
  try {
    const ctx = await resolvePortalContext(organizationSlug);
    const orgSlug = ctx.tenant.organizationSlug || organizationSlug;

    const escalation = await EscalationService.resumeHermes({
      organizationId: orgSlug,
      escalationId,
      operatorId,
      notes,
    });

    return { success: true, escalation };
  } catch (error: any) {
    console.error("Error resuming Hermes control:", error);
    return { success: false, error: error.message };
  }
}
