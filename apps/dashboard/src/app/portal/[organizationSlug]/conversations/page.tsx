import React from 'react';
import { db } from '@/db';
import { hermesConversations, hermesConversationMessages } from '@/db/schema';
import { eq, desc, or } from 'drizzle-orm';
import { ConversationsDashboard } from '@/components/hermes-portal/conversations/ConversationsDashboard';
import { getConversationMessages } from './actions';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';

interface ConversationsPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function ConversationsPage({ params }: ConversationsPageProps) {
  const { organizationSlug } = await params;
  const portalCtx = await resolvePortalContext(organizationSlug).catch(() => null);

  let conversations: any[] = [];
  try {
    const orgId = portalCtx?.tenant.organizationId;
    const orgSlug = portalCtx?.tenant.organizationSlug || organizationSlug;

    conversations = await db
      .select()
      .from(hermesConversations)
      .where(
        or(
          eq(hermesConversations.organizationId, orgSlug),
          eq(hermesConversations.organizationId, organizationSlug),
          orgId ? eq(hermesConversations.organizationId, orgId) : undefined
        )
      )
      .orderBy(desc(hermesConversations.updatedAt));
  } catch (error) {
    console.warn("Failed to fetch conversations (table might be missing)", error);
  }

  const mappedConversations = conversations.map(c => ({
    id: c.id,
    conversationId: c.conversationId,
    status: c.status || 'ACTIVE',
    escalationReason: c.escalationReason,
    escalatedAt: c.escalatedAt,
    updatedAt: c.updatedAt,
    messageCount: c.version,
    preview: c.status === 'PAUSED_HUMAN' ? `⚠️ Requiere atención: ${c.escalationReason || 'Escalado'}` : 'Toca para ver el historial...',
  }));

  const handleSelect = async (id: string) => {
    'use server';
    return getConversationMessages(organizationSlug, id);
  };

  return (
    <ConversationsDashboard 
      conversations={mappedConversations}
      organizationSlug={organizationSlug}
      onSelectConversation={handleSelect}
    />
  );
}
