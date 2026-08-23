'use client';

import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Terminal, Shield, Brain, Activity, RefreshCw } from 'lucide-react';

type TerminalTab = 'events' | 'logs' | 'thoughts';

export function HermesTerminalBar({ sidebarCollapsed = true }: { sidebarCollapsed?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TerminalTab>('events');
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    setTimestamp(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTabClick = (tab: TerminalTab) => {
    setActiveTab(tab);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  return (
    <div className={`border-t border-white/10 bg-[#08080A] flex flex-col fixed bottom-0 right-0 z-40 text-[11px] font-mono text-zinc-500 transition-all duration-300 ${sidebarCollapsed ? 'left-0 md:left-16' : 'left-0 md:left-64'} ${isExpanded ? 'h-72' : 'h-10'}`}>
        <div className="flex items-center justify-between px-4 shrink-0 h-10 w-full bg-[#08080A] select-none">
            <div className="flex items-center gap-2 sm:gap-4 h-full">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center hover:text-zinc-300 transition-colors h-full px-2 border-b-2 border-transparent hover:border-zinc-500"
                  title={isExpanded ? "Minimizar terminal" : "Expandir terminal"}>
                    {isExpanded ? <ChevronDown className="w-4 h-4 mr-1 text-purple-400" /> : <ChevronUp className="w-4 h-4 mr-1 text-zinc-400" />}
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">{isExpanded ? 'COLLAPSE' : 'CONSOLE'}</span>
                </button>

                <div className="h-4 w-[1px] bg-white/10 mx-1" />

                {/* EVENTS TAB */}
                <button 
                  onClick={() => handleTabClick('events')}
                  className={`flex items-center gap-1.5 h-full px-3 transition-all border-b-2 font-medium ${activeTab === 'events' && isExpanded ? 'text-purple-400 border-purple-500 bg-purple-500/5' : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:border-zinc-600'}`}>
                    <Shield className="w-3.5 h-3.5" />
                    <span>EVENTS (26)</span>
                </button>

                {/* SYSTEM LOGS TAB */}
                <button 
                  onClick={() => handleTabClick('logs')}
                  className={`flex items-center gap-1.5 h-full px-3 transition-all border-b-2 font-medium ${activeTab === 'logs' && isExpanded ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5' : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:border-zinc-600'}`}>
                    <Terminal className="w-3.5 h-3.5" />
                    <span>SYSTEM LOGS</span>
                </button>

                {/* AI THOUGHTS TAB */}
                <button 
                  onClick={() => handleTabClick('thoughts')}
                  className={`flex items-center gap-1.5 h-full px-3 transition-all border-b-2 font-medium ${activeTab === 'thoughts' && isExpanded ? 'text-cyan-400 border-cyan-500 bg-cyan-500/5' : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:border-zinc-600'}`}>
                    <Brain className="w-3.5 h-3.5" />
                    <span>AI THOUGHTS</span>
                </button>
            </div>

            <div className="flex items-center gap-4 text-zinc-600 text-[10px]">
                <span className="hidden sm:inline-block font-mono text-zinc-500">KERNEL V9.0.0</span>
                <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE FEED
                </span>
            </div>
        </div>

        {isExpanded && (
            <div className="flex-1 w-full bg-[#040406] p-4 overflow-y-auto border-t border-white/5 font-mono text-xs text-zinc-400 space-y-2 select-text">
                {/* 1. EVENTS VIEW */}
                {activeTab === 'events' && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 pb-2 border-b border-white/5">
                            <span>SECURITY EVENT LOG (K13-K25 PROTOCOL HASH CHAIN)</span>
                            <span className="text-purple-400 font-bold">100% AUDITABLE MERKLE TREE</span>
                        </div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-purple-400 font-semibold">[MERKLE_ROOT]</span> 0c4f3642ec77f607... <span className="text-zinc-400">Exported to IPFS CID:</span> <span className="text-purple-300">bafkreihyzhg2ccv...</span></div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-purple-400 font-semibold">[EIP712_SIGN]</span> Agent 0x8515Fb0F706DfE8Bf271ad453c01976ed568a4aD sealed knowledge manifest.</div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-emerald-400 font-semibold">[VAULT_ACCESS]</span> AES-256-GCM Envelope authenticated with AAD tenant isolation.</div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-cyan-400 font-semibold">[LATTICE_ALLOW]</span> Channel clearance ceiling verified (AUTHENTICATED_WEB &le; PUBLIC).</div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-amber-400 font-semibold">[CIRCUIT_BREAKER]</span> Rate limits OK (0/30 calls per minute). Circuit CLOSED.</div>
                    </div>
                )}

                {/* 2. SYSTEM LOGS VIEW */}
                {activeTab === 'logs' && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 pb-2 border-b border-white/5">
                            <span>HERMES OS PLATFORM KERNEL LOGS</span>
                            <span className="text-emerald-400 font-bold">STATUS: NOMINAL</span>
                        </div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-emerald-400 font-semibold">[POSTGRES_RLS]</span> Worker role 'hermes_runtime_worker' bounded to tenant session.</div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-blue-400 font-semibold">[MEMORY_SCRUB]</span> Ephemeral zeroization executed: DEKs wiped from RAM buffer.</div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-emerald-400 font-semibold">[OLLAMA_CORE]</span> Inactive pool warmed. Latency avg: 214ms.</div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-indigo-400 font-semibold">[SANDBOX_VM]</span> Prototype pollution guard active. Global scope isolated.</div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-zinc-400 font-semibold">[GATEWAY]</span> Omnichannel bridge connected: Web Portal, Telegram, WhatsApp.</div>
                    </div>
                )}

                {/* 3. AI THOUGHTS VIEW */}
                {activeTab === 'thoughts' && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 pb-2 border-b border-white/5">
                            <span>REASONING CONTEXT & PRE-LLM HYGIENE TRACE</span>
                            <span className="text-cyan-400 font-bold">KNOW / USE BOUNDARY ACTIVE</span>
                        </div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-cyan-400 font-semibold">[PROMPT_HYGIENE]</span> Parsed 4 system knowledge chunks into [SECTION_START: SYSTEM_KNOWLEDGE_READ_ONLY].</div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-cyan-400 font-semibold">[ACTION_SLOTS]</span> Enforcing authorized tools in [SECTION_START: AUTHORIZED_ACTION_SLOTS].</div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-purple-400 font-semibold">[JOURNEY_STATE]</span> Actor journey evaluated &rarr; Stage 1: Discovery (State active).</div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-emerald-400 font-semibold">[MEMORY_BUDGET]</span> History compactation: 840 / 3000 tokens used. Zero leakage detected.</div>
                        <div className="text-zinc-500">[{timestamp || '12:00:00'}] <span className="text-indigo-400 font-semibold">[SYNTHESIS]</span> Output passed DisclosureBoundaryValidator (0 policy violations).</div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
}

