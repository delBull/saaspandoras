import React from 'react';
import { db } from '@/db';
import { hermesConversations, hermesConversationMessages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ConversationsDashboard } from '@/components/hermes-portal/conversations/ConversationsDashboard';
import { getConversationMessages } from './actions';

interface ConversationsPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function ConversationsPage({ params }: ConversationsPageProps) {
  const { organizationSlug } = await params;

  let conversations: any[] = [];
  try {
    conversations = await db
      .select()
      .from(hermesConversations)
      .where(eq(hermesConversations.organizationId, organizationSlug))
      .orderBy(desc(hermesConversations.updatedAt));
  } catch (error) {
    console.warn("Failed to fetch conversations (table might be missing)", error);
  }

  const mappedConversations = conversations.map(c => ({
    id: c.id,
    conversationId: c.conversationId,
    updatedAt: c.updatedAt,
    messageCount: c.version, // assuming version corresponds to message count roughly
    preview: 'Tap to view conversation thread...',
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
