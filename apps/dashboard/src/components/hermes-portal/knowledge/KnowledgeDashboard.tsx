"use client";

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { KnowledgeOverviewView } from '@/lib/pandoras/core/domains/control-plane/application/queries/get-knowledge-overview';
import type { KnowledgeSourceView } from '@/lib/pandoras/core/domains/control-plane/view-models';

import { KnowledgeHeader } from './KnowledgeHeader';
import { KnowledgeMetrics } from './KnowledgeMetrics';
import { KnowledgeSourcesPanel } from './KnowledgeSourcesPanel';
import { KnowledgeHealthPanel } from './KnowledgeHealthPanel';
import { BusinessContextPanel } from './BusinessContextPanel';
import { VerifiedKnowledgePanel } from './VerifiedKnowledgePanel';
import { TeachHermesDialog } from './TeachHermesDialog';
import { KnowledgeAdvancedPanel } from './KnowledgeAdvancedPanel';

interface KnowledgeDashboardProps {
  overview: KnowledgeOverviewView;
  organizationName?: string;
  onAddKnowledge?: (payload: { type: KnowledgeSourceView['type']; title: string; content: string }) => void;
  onViewSource?: (sourceId: string) => void;
  onApproveFact?: (factId: string) => void;
  onRejectFact?: (factId: string) => void;
}

export function KnowledgeDashboard({ overview, organizationName = 'your organization', onAddKnowledge, onViewSource, onApproveFact, onRejectFact }: KnowledgeDashboardProps) {
  const [showTeachModal, setShowTeachModal] = useState(false);

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <KnowledgeHeader 
        organizationName={organizationName}
        onTeachClick={() => setShowTeachModal(true)} 
      />

      {/* Metrics Row */}
      <KnowledgeMetrics overview={overview} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-w-0 max-w-full">
        {/* Left Column (Sources & Context) */}
        <div className="lg:col-span-2 flex flex-col gap-8 min-w-0 max-w-full">
          <KnowledgeSourcesPanel 
            sources={overview.sources} 
            onViewSource={onViewSource} 
            onTeachClick={() => setShowTeachModal(true)}
          />
          <VerifiedKnowledgePanel 
            facts={overview.facts} 
            onApprove={onApproveFact} 
            onReject={onRejectFact} 
          />
          <BusinessContextPanel />
        </div>

        {/* Right Column (Health & Advanced) */}
        <div className="flex flex-col gap-8 min-w-0 max-w-full">
          <KnowledgeHealthPanel overview={overview} />
          <KnowledgeAdvancedPanel overview={overview} />
        </div>
      </div>

      {/* Teach Hermes Dialog */}
      <AnimatePresence>
        {showTeachModal && (
          <TeachHermesDialog 
            onClose={() => setShowTeachModal(false)} 
            onSelect={(payload) => {
              setShowTeachModal(false);
              onAddKnowledge?.(payload);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
