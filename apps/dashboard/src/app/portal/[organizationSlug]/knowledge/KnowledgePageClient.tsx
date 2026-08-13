'use client';

import React from 'react';
import { KnowledgeDashboard } from '@/components/hermes-portal/knowledge/KnowledgeDashboard';
import type { KnowledgeOverviewView } from '@/lib/pandoras/core/domains/control-plane/application/queries/get-knowledge-overview';
import { addKnowledgeAction } from './actions';

export function KnowledgePageClient({ 
  overview, 
  organizationSlug,
  organizationName = 'your organization'
}: { 
  overview: KnowledgeOverviewView; 
  organizationSlug: string;
  organizationName?: string;
}) {
  const handleAddKnowledge = async (payload: { type: string; title: string; content: string }) => {
    await addKnowledgeAction(organizationSlug, payload.type, payload.content, payload.title);
  };

  return (
    <KnowledgeDashboard 
      overview={overview} 
      organizationName={organizationName}
      onAddKnowledge={handleAddKnowledge}
    />
  );
}
