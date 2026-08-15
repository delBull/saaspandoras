'use client';

import React, { useState } from 'react';
import { GitBranch, Goal, CheckCircle2, Circle, ChevronRight, PlayCircle, Plus, LayoutGrid, Settings2, Trash2 } from 'lucide-react';

export interface JourneyView {
  id: string;
  name: string;
  status: 'ACTIVE' | 'DRAFT' | 'PAUSED';
  milestones: string[];
}

interface JourneysDashboardProps {
  journeys: JourneyView[];
  organizationSlug: string;
  onToggleJourney?: (id: string, activate: boolean) => Promise<void>;
}

export function JourneysDashboard({ journeys, organizationSlug, onToggleJourney }: JourneysDashboardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(journeys[0]?.id || null);

  const activeJourney = journeys.find(j => j.id === selectedId);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      
      {/* Sidebar: List of Journeys */}
      <div className="lg:w-80 shrink-0 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <GitBranch className="w-7 h-7 text-indigo-400" />
            Agent Journeys
          </h1>
          <p className="text-white/50 mt-2 text-xs leading-relaxed">
            Autonomous workflows. Define the strategic goals Hermes should pursue in conversations.
          </p>
        </div>

        <button className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
          <Plus size={16} />
          Create New Journey
        </button>

        <div className="space-y-2">
          {journeys.length === 0 ? (
            <div className="text-center p-6 bg-white/5 rounded-xl border border-white/5 text-white/40 text-sm">
              No journeys defined.
            </div>
          ) : (
            journeys.map(journey => (
              <button
                key={journey.id}
                onClick={() => setSelectedId(journey.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedId === journey.id 
                    ? 'bg-indigo-600/10 border-indigo-500/30' 
                    : 'bg-[#0C0C12] border-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="font-medium text-white text-sm">{journey.name}</div>
                  <div className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    journey.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                    journey.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {journey.status}
                  </div>
                </div>
                <div className="text-xs text-white/40 mt-2 flex items-center gap-1.5">
                  <Goal size={12} />
                  {journey.milestones.length} Milestones
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main View: Journey Details */}
      <div className="flex-1 min-h-[500px]">
        {activeJourney ? (
          <div className="bg-[#0C0C12] border border-white/[0.06] rounded-2xl p-6 lg:p-10 h-full">
            <div className="flex items-start justify-between border-b border-white/10 pb-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">{activeJourney.name}</h2>
                <div className="flex items-center gap-4 mt-3">
                  <div className={`text-xs font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                    activeJourney.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    'bg-white/5 text-white/50 border-white/10'
                  }`}>
                    {activeJourney.status}
                  </div>
                  <div className="text-sm text-white/40 flex items-center gap-2">
                    <LayoutGrid size={16} />
                    Goal Engine V2
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                  <Settings2 size={18} />
                </button>
                {activeJourney.status !== 'ACTIVE' ? (
                  <button 
                    onClick={() => onToggleJourney && onToggleJourney(activeJourney.id, true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  >
                    <PlayCircle size={16} />
                    Activate
                  </button>
                ) : (
                  <button 
                    onClick={() => onToggleJourney && onToggleJourney(activeJourney.id, false)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  >
                    Pause Journey
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-lg font-medium text-white mb-6">Milestones (Goal Funnel)</h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-white/10 before:to-transparent mt-4">
              {activeJourney.milestones.map((milestone, idx) => (
                <div key={idx} className="relative flex items-start gap-6 group">
                  
                  {/* Icon */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-[#0C0C12] bg-[#12121A] group-hover:bg-indigo-500/20 text-white/30 group-hover:text-indigo-400 transition-colors shrink-0 relative z-10">
                    <CheckCircle2 size={20} className={idx === 0 ? "text-indigo-400" : ""} />
                  </div>
                  
                  {/* Card */}
                  <div className="flex-1 p-5 rounded-2xl bg-[#12121A] border border-white/5 group-hover:border-indigo-500/30 transition-all shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase">
                        Step {idx + 1}
                      </div>
                    </div>
                    <div className="text-[15px] font-medium text-white/90 leading-relaxed">
                      {milestone}
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="bg-[#0C0C12] border border-white/[0.06] rounded-2xl p-6 lg:p-10 h-full flex flex-col items-center justify-center text-center text-white/40">
            <GitBranch className="w-12 h-12 mb-4 opacity-20" />
            <p>Select a journey from the sidebar to view its details.</p>
          </div>
        )}
      </div>

    </div>
  );
}
