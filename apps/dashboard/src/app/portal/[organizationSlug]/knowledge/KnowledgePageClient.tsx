'use client';

import React, { useState } from 'react';
import { KnowledgeDashboard } from '@/components/hermes-portal/knowledge/KnowledgeDashboard';
import type { KnowledgeOverviewView } from '@/lib/dash-contracts/knowledge';
import { addKnowledgeAction, approveKnowledgeFact, rejectKnowledgeFact } from './actions';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Database } from 'lucide-react';
import DealRoomConsole from '@/app/nexus/rooms/DealRoomConsole';

export function KnowledgePageClient({ 
  overview, 
  organizationSlug,
  organizationName = 'your organization'
}: { 
  overview: KnowledgeOverviewView; 
  organizationSlug: string;
  organizationName?: string;
}) {
  const [activeTab, setActiveTab] = useState('k25');

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
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
              Knowledge Base
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl mt-1">
              Gestiona el conocimiento K25 y los documentos legales (Deal Room).
            </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-900 border border-white/10 p-1 mb-6 inline-flex">
            <TabsTrigger value="k25" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400">
                <Database className="w-4 h-4 mr-2" />
                Base K25
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
                <FileText className="w-4 h-4 mr-2" />
                Deal Room & Docs
            </TabsTrigger>
        </TabsList>

        <TabsContent value="k25" className="mt-0 outline-none">
            <KnowledgeDashboard 
              overview={overview} 
              organizationName={organizationName}
              onAddKnowledge={handleAddKnowledge}
              onApproveFact={handleApprove}
              onRejectFact={handleReject}
            />
        </TabsContent>

        <TabsContent value="documents" className="mt-0 outline-none">
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <DealRoomConsole />
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
