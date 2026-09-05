'use server';

import type { MessageView } from '@/components/hermes-portal/conversations/ConversationsDashboard';
import { DashApi } from '@/lib/dash-api';
import { EscalationService } from '@/lib/hermes/escalation/escalation-service';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';

export async function getConversationMessages(organizationSlug: string, conversationId: string): Promise<MessageView[]> {
  try {
    const rawMessages = await DashApi.conversations.getMessages(organizationSlug, conversationId);
    return rawMessages.map(msg => ({
      id: msg.id,
      role: msg.role as any,
      content: msg.content,
      createdAt: new Date(msg.createdAt),
    }));
  } catch (error) {
    console.error("Error fetching messages via DashApi:", error);
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
