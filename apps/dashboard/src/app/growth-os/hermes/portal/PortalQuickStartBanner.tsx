'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, HelpCircle, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

// Ordered Onboarding stages — aligned with HermesOnboardingWorkflow
const MISSION_STAGES = [
  { id: 'BUSINESS_DISCOVERY',    label: 'Negocio' },
  { id: 'IDENTITY_CONFIGURATION', label: 'Identidad' },
  { id: 'KNOWLEDGE_GATHERING',    label: 'Knowledge' },
  { id: 'POLICY_DEFINITION',      label: 'Policies' },
  { id: 'CHANNEL_SETUP',          label: 'Channels' },
  { id: 'ACTIVATION',             label: 'Activation' },
] as const;




interface QuickStartBannerProps {
  onOpenGuide: () => void;
  isDraft?: boolean;
  onboardingStage?: string | null;
  intelligenceScores?: any[];
}

export function PortalQuickStartBanner({
  onOpenGuide,
  isDraft = false,
  onboardingStage = null,
  intelligenceScores = []
}: QuickStartBannerProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('pandoras_quickstart_minimized');
    if (savedState === 'true') setIsMinimized(true);
  }, []);

  const toggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    localStorage.setItem('pandoras_quickstart_minimized', String(newState));
  };

  // Derive progress from the current onboarding stage
  const currentStageIndex = Math.max(0, MISSION_STAGES.findIndex(s => s.id === onboardingStage));
  const isActivated = onboardingStage === 'ACTIVATION';
  
  // Calculate aggregate intelligence coverage
  const totalExpected = intelligenceScores.reduce((acc, score) => acc + (score.activeClaims > 0 || score.pendingClaims > 0 ? 1 : score.completenessPercent === 100 ? 1 : 0), 0); // Simplified calculation
  const totalPossible = Math.max(1, intelligenceScores.length);
  const intelligenceCoverage = intelligenceScores.length > 0 ? Math.round(
    (intelligenceScores.reduce((acc, score) => acc + score.completenessPercent, 0) / (intelligenceScores.length * 100)) * 100
  ) : 0;

  // Filter main dimensions for display
  const displayScores = intelligenceScores.filter(s => ['identity', 'project', 'market', 'founder', 'product'].includes(s.dimension));

  if (isDraft) {
    return (
      <div className="w-full bg-[#0C0C10] border border-white/10 rounded-xl p-6 mb-6 shadow-xl transition-all">
        <div className="flex items-start justify-between mb-6">
          <div className="flex gap-4">
            <div className="p-3 bg-black/30 border border-white/5 rounded-lg h-fit">
              <Terminal className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-1">Construyamos tu proyecto</h3>
              <p className="text-zinc-500 max-w-2xl text-[11px] font-mono tracking-wider">
                Hermes está empezando a conocerte.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-white/5 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-mono text-white uppercase tracking-widest">PROJECT INTELLIGENCE</h4>
            <span className="text-[11px] font-mono text-purple-400">{intelligenceCoverage}% Coverage</span>
          </div>
          
          <div className="w-full bg-black/50 rounded-full h-1.5 mb-6 border border-white/5">
            <div 
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${intelligenceCoverage}%` }}
            />
          </div>

          <div className="space-y-3 mb-6">
            {displayScores.map(score => (
              <div key={score.dimension} className="flex items-center justify-between text-[11px] font-mono">
                <span className="w-24 text-zinc-400 capitalize">{score.title}</span>
                <div className="flex-1 mx-4 flex items-center h-2 bg-black/30 border border-white/5 rounded-sm overflow-hidden">
                   <div 
                      className="bg-zinc-300 h-full transition-all" 
                      style={{ width: `${score.completenessPercent}%` }} 
                   />
                </div>
                <span className="w-10 text-right text-zinc-500">{score.completenessPercent}%</span>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col gap-2 mt-6 pt-4 border-t border-white/5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            {displayScores.map(score => {
              if (score.completenessPercent === 100 && score.pendingClaims === 0) {
                return <div key={score.dimension} className="flex items-center gap-2 text-zinc-400"><CheckCircle2 className="w-3 h-3 text-purple-400" /> {score.title} recognized</div>;
              } else if (score.pendingClaims > 0) {
                return <div key={score.dimension} className="flex items-center gap-2 text-yellow-500/70"><Circle className="w-3 h-3 text-yellow-500/50" /> {score.title} requires governance review</div>;
              } else if (score.completenessPercent > 0) {
                return <div key={score.dimension} className="flex items-center gap-2 text-zinc-400"><CheckCircle2 className="w-3 h-3 text-purple-400/50" /> {score.title} partially identified</div>;
              } else {
                return <div key={score.dimension} className="flex items-center gap-2 text-zinc-600"><Circle className="w-3 h-3" /> {score.title} not yet discovered</div>;
              }
            })}
          </div>

        </div>
        
        <div className="mt-8 flex justify-center pt-4">
           <button className="text-[11px] text-purple-400 font-mono tracking-widest uppercase hover:text-purple-300 transition-colors">
            [ Continue → ]
          </button>
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="w-full bg-[#0C0C10] border border-white/10 rounded-xl px-4 py-2 mb-4 flex items-center justify-between text-xs transition-all">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          <span className="text-zinc-400 font-mono text-[11px] uppercase tracking-wider">Hermes OS Setup:</span>
          <span className="font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 text-[10px]">
            {intelligenceCoverage}%
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenGuide}
            className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider cursor-pointer"
          >
            <HelpCircle className="w-3 h-3" />
            Guide
          </button>
          <button
            onClick={toggleMinimize}
            className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider cursor-pointer bg-black/30 border border-white/5 hover:bg-white/5 px-2 py-1 rounded"
          >
            <ChevronDown className="w-3 h-3" />
            Expand
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0C0C10] border border-white/10 rounded-xl p-4 mb-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 relative transition-all">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-black/30 text-purple-400 rounded-lg border border-white/5">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">Tenant Configuration</h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {intelligenceCoverage}%
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5 uppercase tracking-wider">
            {'>'} Initialize agent governance and channel connectivity
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider">
          {MISSION_STAGES.map((stage, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {idx < currentStageIndex || isActivated ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-zinc-700" />
              )}
              <span className={(idx < currentStageIndex || isActivated) ? 'text-zinc-400' : 'text-zinc-600'}>
                {stage.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Manual
          </button>

          <button
            onClick={toggleMinimize}
            title="Minimize console"
            className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded border border-white/5 bg-black/30 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
