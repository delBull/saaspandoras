import React from 'react';
import { ConversationsDashboard } from '@/components/hermes-portal/conversations/ConversationsDashboard';
import { getConversationMessages } from './actions';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { DashApi } from '@/lib/dash-api';

interface ConversationsPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function ConversationsPage({ params }: ConversationsPageProps) {
  const { organizationSlug } = await params;
  const portalCtx = await tryResolvePortalContext(organizationSlug);
  if (!portalCtx) {
    notFound();
  }

  // Fetch conversations strictly via Dash API Service Boundary (Decoupled from DB/SQL)
  let mappedConversations: any[] = [];
  try {
    const rawConversations = await DashApi.conversations.listSummaries(organizationSlug);
    mappedConversations = rawConversations.map(c => ({
      id: c.id,
      conversationId: c.conversationId,
      status: c.status || 'ACTIVE',
      escalationReason: c.escalationReason,
      escalatedAt: c.escalatedAt ? new Date(c.escalatedAt) : undefined,
      updatedAt: new Date(c.updatedAt),
      messageCount: c.messageCount || 1,
      preview: c.preview || 'Toca para ver el historial...',
    }));
  } catch (error) {
    console.warn("Failed to fetch conversations via DashApi:", error);
  }

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
