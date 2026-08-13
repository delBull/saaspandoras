'use client';

import React from 'react';
import { KnowledgeDashboard } from '@/components/hermes-portal/knowledge/KnowledgeDashboard';
import type { KnowledgeOverviewView } from '@/lib/pandoras/core/domains/control-plane/application/queries/get-knowledge-overview';
import { addKnowledgeAction } from './actions';

export function KnowledgePageClient({ 
  overview, 
  organizationSlug 
}: { 
  overview: KnowledgeOverviewView; 
  organizationSlug: string 
}) {
  const handleAddKnowledge = async (type: string) => {
    // In a real app, this would open a form modal. 
    // For Phase 6.4 MVP, we just create a dummy source of that type.
    const title = `New ${type} Knowledge`;
    const content = `This is mock content for a ${type} source to demonstrate the lifecycle.`;
    await addKnowledgeAction(organizationSlug, type, content, title);
  };

  return (
    <KnowledgeDashboard 
      overview={overview} 
      onAddKnowledge={handleAddKnowledge}
    />
  );
}
