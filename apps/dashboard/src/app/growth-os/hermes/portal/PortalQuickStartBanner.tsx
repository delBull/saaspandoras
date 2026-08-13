'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Circle, HelpCircle, ChevronDown, ChevronUp, EyeOff, Terminal } from 'lucide-react';

interface QuickStartBannerProps {
  hasIdentity?: boolean;
  hasEvidence?: boolean;
  hasProvider?: boolean;
  hasChannel?: boolean;
  onOpenGuide: () => void;
  isDraft?: boolean;
  onboardingStage?: string | null;
}

export function PortalQuickStartBanner({
  hasIdentity = true,
  hasEvidence = false,
  hasProvider = true,
  hasChannel = false,
  onOpenGuide,
  isDraft = false,
  onboardingStage = null
}: QuickStartBannerProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('pandoras_quickstart_minimized');
    if (savedState === 'true') {
      setIsMinimized(true);
    }
  }, []);

  const toggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    localStorage.setItem('pandoras_quickstart_minimized', String(newState));
  };

  const steps = [
    { label: 'Identidad y Alma', completed: hasIdentity },
    { label: 'Capa de Evidencias', completed: hasEvidence },
    { label: 'Motor IA (LLM)', completed: hasProvider },
    { label: 'Canal (Telegram)', completed: hasChannel },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  // Onboarding Mission Stages mapped to their UI labels
  const MISSION_STAGES = [
    { id: 'BUSINESS_DISCOVERY', label: 'Negocio' },
    { id: 'IDENTITY_CONFIGURATION', label: 'Organización' },
    { id: 'OBJECTIVES_ALIGNMENT', label: 'Objetivos' },
    { id: 'PROJECTS_MAPPING', label: 'Proyectos' },
    { id: 'AGENT_PERSONA', label: 'Agent' },
    { id: 'KNOWLEDGE_INGESTION', label: 'Knowledge' },
    { id: 'CHANNELS_SETUP', label: 'Channels' },
    { id: 'GOVERNANCE_RULES', label: 'Governance' }
  ];

  // If this is an onboarding workspace, enforce a mandatory UI layout here
  if (isDraft) {
    const currentStageIndex = MISSION_STAGES.findIndex(s => s.id === onboardingStage) !== -1 
      ? MISSION_STAGES.findIndex(s => s.id === onboardingStage) 
      : 0;

    return (
      <div className="w-full bg-[#0C0C10] border border-white/10 rounded-xl p-6 mb-6 shadow-xl transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-4">
            <div className="p-3 bg-black/30 border border-white/5 rounded-lg h-fit">
              <Terminal className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-1">[ MISSION CONTROL: TENANT INITIALIZATION ]</h3>
              <p className="text-zinc-500 max-w-2xl text-[11px] font-mono uppercase tracking-wider">
                {'>'} Workspace provisioned. Hermes must complete this mission to construct the Tenant profile.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {MISSION_STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            
            return (
              <div 
                key={stage.id} 
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-[11px] font-mono tracking-wider transition-all ${
                  isCompleted ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                  isCurrent ? 'bg-white/5 border-white/20 text-white animate-pulse' :
                  'bg-black/30 border-white/5 text-zinc-600'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                ) : isCurrent ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-zinc-700" />
                )}
                {stage.id}
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 flex justify-center border-t border-white/5 pt-4">
          <span className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">
            ↓ Awaiting operator input in console ↓
          </span>
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
            {progressPercent}%
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
              {progressPercent}%
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5 uppercase tracking-wider">
            {'>'} Initialize agent governance and channel connectivity
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {step.completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-zinc-700" />
              )}
              <span className={step.completed ? 'text-zinc-400' : 'text-zinc-600'}>
                {step.label}
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
