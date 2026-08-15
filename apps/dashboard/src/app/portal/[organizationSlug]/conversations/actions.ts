'use server';

import { db } from '@/db';
import { hermesConversations, hermesConversationMessages } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { MessageView } from '@/components/hermes-portal/conversations/ConversationsDashboard';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';

export async function getConversationMessages(organizationSlug: string, conversationId: string): Promise<MessageView[]> {
  try {
    const ctx = await resolvePortalContext(organizationSlug);

    const messages = await db
      .select()
      .from(hermesConversationMessages)
      .where(
        and(
          eq(hermesConversationMessages.organizationId, organizationSlug),
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
          content: 'Hermes evaluated cognitive context.',
          createdAt: msg.createdAt,
        };
      }

      return {
        id: msg.id,
        role: msg.role as 'USER' | 'ASSISTANT' | 'SYSTEM',
        content,
        createdAt: msg.createdAt,
      };
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}
