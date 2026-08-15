'use client';

import React from 'react';
import { KnowledgeDashboard } from '@/components/hermes-portal/knowledge/KnowledgeDashboard';
import type { KnowledgeOverviewView } from '@/lib/pandoras/core/domains/control-plane/application/queries/get-knowledge-overview';
import { addKnowledgeAction, approveKnowledgeFact, rejectKnowledgeFact } from './actions';

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

  const handleApprove = async (factId: string) => {
    await approveKnowledgeFact(organizationSlug, factId);
  };

  const handleReject = async (factId: string) => {
    await rejectKnowledgeFact(organizationSlug, factId);
  };

  return (
    <KnowledgeDashboard 
      overview={overview} 
      organizationName={organizationName}
      onAddKnowledge={handleAddKnowledge}
      onApproveFact={handleApprove}
      onRejectFact={handleReject}
    />
  );
}
