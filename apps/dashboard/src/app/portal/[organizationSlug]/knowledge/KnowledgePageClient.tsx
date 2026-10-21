'use client';

import React from 'react';
import { KnowledgeDashboard } from '@/components/hermes-portal/knowledge/KnowledgeDashboard';
import type { KnowledgeOverviewView, KnowledgeSourceView } from '@saasfly/shared';
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

  const handleAddKnowledge = async (payload: { type: KnowledgeSourceView['type']; title: string; content: string }) => {
    return await addKnowledgeAction(organizationSlug, payload.type, payload.content, payload.title);
  };

  const handleApprove = async (factId: string) => {
    await approveKnowledgeFact(organizationSlug, factId);
  };

  const handleReject = async (factId: string) => {
    await rejectKnowledgeFact(organizationSlug, factId);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
              Knowledge Base
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl mt-1">
              Gestiona el conocimiento K25 soberano de Hermes AI.
            </p>
        </div>
      </div>

      <KnowledgeDashboard 
        overview={overview} 
        organizationName={organizationName}
        onAddKnowledge={handleAddKnowledge}
        onApproveFact={handleApprove}
        onRejectFact={handleReject}
      />
    </div>
  );
}
