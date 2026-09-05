'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  MessageSquare, Search, Filter, ShieldAlert, Zap, Clock, User, 
  ArrowRight, Send, AlertTriangle, CheckCircle2, RefreshCw, UserCheck, Shield, BarChart2
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  triggerManualTakeover, 
  sendHumanReply, 
  resumeHermesControl 
} from '@/app/portal/[organizationSlug]/audience/conversations/actions';

export interface ConversationView {
  id: string;
  conversationId: string;
  updatedAt: Date;
  messageCount: number;
  preview: string;
  status?: 'ACTIVE' | 'PAUSED_HUMAN' | 'RESOLVED';
  escalationReason?: string | null;
  escalatedAt?: Date | null;
  escalationId?: string | null;
}

export interface MessageView {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'ACTIVITY' | 'SYSTEM' | 'OPERATOR';
  content: string;
  createdAt: Date;
}

interface ConversationsDashboardProps {
  conversations: ConversationView[];
  organizationSlug: string;
  onSelectConversation?: (id: string) => Promise<MessageView[]>;
}

export function ConversationsDashboard({ conversations: initialConversations, organizationSlug, onSelectConversation }: ConversationsDashboardProps) {
  const [conversations, setConversations] = useState<ConversationView[]>(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'ESCALATED' | 'AUTONOMOUS'>('ALL');
  const [replyText, setReplyText] = useState('');
  const [isPending, startTransition] = useTransition();

  // Sprint 3: Operational observability metrics
  const [metrics, setMetrics] = useState<{
    health: 'GREEN' | 'YELLOW' | 'RED';
    openQueue: number;
    last24h: number;
    avgResolutionMs: number | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/v1/hermes/tenants/${organizationSlug}/observability`,
          { cache: 'no-store' },
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setMetrics({
          health: data.health,
          openQueue: data.escalations?.openQueue ?? 0,
          last24h: data.escalations?.volume?.last24h ?? 0,
          avgResolutionMs: data.escalations?.avgResolutionMs ?? null,
        });
      } catch {
        // non-critical — silently skip
      }
    };
    load();
    const interval = setInterval(load, 60_000); // refresh every minute
    return () => { cancelled = true; clearInterval(interval); };
  }, [organizationSlug]);

  const activeConv = conversations.find(c => c.conversationId === activeConvId);

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.conversationId.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterTab === 'ESCALATED') {
      return c.status === 'PAUSED_HUMAN';
    }
    if (filterTab === 'AUTONOMOUS') {
      return c.status === 'ACTIVE' || !c.status;
    }
    return true;
  });

  const handleSelect = async (id: string) => {
    setActiveConvId(id);
    if (onSelectConversation) {
      setIsLoading(true);
      try {
        const msgs = await onSelectConversation(id);
        setMessages(msgs);
      } catch (e) {
        console.error("Failed to load messages", e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTakeover = () => {
    if (!activeConvId) return;
    startTransition(async () => {
      const res = await triggerManualTakeover(organizationSlug, activeConvId, 'operator');
      if (res.success && res.escalation) {
        setConversations(prev => prev.map(c => 
          c.conversationId === activeConvId 
            ? { ...c, status: 'PAUSED_HUMAN' as const, escalationReason: 'MANUAL', escalationId: res.escalation?.id ?? null } 
            : c
        ));
        // Refresh messages
        if (onSelectConversation) {
          const msgs = await onSelectConversation(activeConvId);
          setMessages(msgs);
        }
      }
    });
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !activeConvId) return;
    const currentEscalationId = activeConv?.escalationId || 'temp_esc';

    startTransition(async () => {
      const textToSend = replyText;
      setReplyText('');

      const res = await sendHumanReply(organizationSlug, currentEscalationId, textToSend, 'operator');
      if (res.success) {
        // Refresh messages
        if (onSelectConversation) {
          const msgs = await onSelectConversation(activeConvId);
          setMessages(msgs);
        }
      }
    });
  };

  const handleResumeHermes = () => {
    if (!activeConvId) return;
    const currentEscalationId = activeConv?.escalationId || 'temp_esc';

    startTransition(async () => {
      const res = await resumeHermesControl(organizationSlug, currentEscalationId, 'operator');
      if (res.success) {
        setConversations(prev => prev.map(c => 
          c.conversationId === activeConvId 
            ? { ...c, status: 'ACTIVE', escalationReason: null } 
            : c
        ));
        // Refresh messages
        if (onSelectConversation) {
          const msgs = await onSelectConversation(activeConvId);
          setMessages(msgs);
        }
      }
    });
  };

  const escalatedCount = conversations.filter(c => c.status === 'PAUSED_HUMAN').length;

  return (
    <div className="flex h-[calc(100vh-3rem)] w-full overflow-hidden bg-[#0A0A10]">
      
      {/* Sidebar: Conversation List */}
      <div className="w-[320px] md:w-[380px] shrink-0 border-r border-white/[0.06] flex flex-col bg-[#0C0C12]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-medium flex items-center gap-2">
              <MessageSquare size={18} className="text-indigo-400" />
              Operator Inbox & Memory
            </h2>
            {escalatedCount > 0 && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                <AlertTriangle size={10} />
                {escalatedCount} Needs Human
              </span>
            )}
          </div>

          {/* Sprint 3: Observability stats bar */}
          {metrics && (
            <div className="flex items-center gap-2 flex-wrap mt-1 mb-0.5">
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                metrics.health === 'GREEN'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : metrics.health === 'YELLOW'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-red-500/15 text-red-300 border-red-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  metrics.health === 'GREEN' ? 'bg-emerald-400' :
                  metrics.health === 'YELLOW' ? 'bg-amber-400' : 'bg-red-400'
                }`} />
                {metrics.health}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white/40">
                <BarChart2 size={10} />
                {metrics.openQueue} en cola
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white/40">
                <Clock size={10} />
                {metrics.last24h} / 24h
              </span>
              {metrics.avgResolutionMs != null && (
                <span className="text-[10px] text-white/30">
                  ~{Math.round(metrics.avgResolutionMs / 60000)}min avg
                </span>
              )}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#12121A] rounded-xl border border-white/5 text-xs">
            <button 
              onClick={() => setFilterTab('ALL')}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                filterTab === 'ALL' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'
              }`}
            >
              All ({conversations.length})
            </button>
            <button 
              onClick={() => setFilterTab('ESCALATED')}
              className={`py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
                filterTab === 'ESCALATED' ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Escalated ({escalatedCount})
            </button>
            <button 
              onClick={() => setFilterTab('AUTONOMOUS')}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                filterTab === 'AUTONOMOUS' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30' : 'text-white/40 hover:text-white/70'
              }`}
            >
              AI Active
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text"
              placeholder="Search by Wallet or Session ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#12121A] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center p-6 text-white/30 text-sm mt-10">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No conversations found in this filter</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isEscalated = conv.status === 'PAUSED_HUMAN';
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelect(conv.conversationId)}
                  className={`w-full text-left p-4 rounded-xl transition-all border relative ${
                    activeConvId === conv.conversationId 
                      ? isEscalated 
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-indigo-500/10 border-indigo-500/30' 
                      : isEscalated
                        ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                        : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono text-white/50 truncate flex-1">
                      {conv.conversationId.split('-')[0]}...
                    </span>
                    <span className="text-[10px] text-white/30 shrink-0 ml-2">
                      {format(new Date(conv.updatedAt), 'MMM d, HH:mm')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="text-sm text-white/90 font-medium truncate">
                      Session {conv.conversationId.slice(0, 8)}
                    </div>
                    {isEscalated ? (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        HUMAN
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        HERMES
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                    {isEscalated && conv.escalationReason ? (
                      <span className="text-amber-300/80 font-medium">⚠️ Escalated: {conv.escalationReason}</span>
                    ) : (
                      conv.preview || 'Tap to inspect conversation...'
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Area: Chat Viewer & Operator Action Plane */}
      <div className="flex-1 flex flex-col bg-[#0A0A10] relative">
        {activeConvId ? (
          <>
            {/* Header */}
            <div className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between bg-[#0C0C12] shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                  activeConv?.status === 'PAUSED_HUMAN' 
                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' 
                    : 'bg-white/5 border-white/10 text-white/60'
                }`}>
                  {activeConv?.status === 'PAUSED_HUMAN' ? <UserCheck size={14} /> : <User size={14} />}
                </div>
                <div>
                  <div className="text-sm font-medium text-white/90">Session: {activeConvId}</div>
                  <div className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                    {activeConv?.status === 'PAUSED_HUMAN' ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Human Operator Active (Hermes Paused)
                      </span>
                    ) : (
                      <span className="text-emerald-400/80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Autonomous AI Managing Session
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Takeover / Resume Actions */}
              <div className="flex gap-2">
                {activeConv?.status === 'PAUSED_HUMAN' ? (
                  <button 
                    onClick={handleResumeHermes}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} />
                    Devolver Control a Hermes (Reanudar)
                  </button>
                ) : (
                  <button 
                    onClick={handleTakeover}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <ShieldAlert size={14} />
                    Intervenir (Takeover Humano)
                  </button>
                )}
              </div>
            </div>

            {/* Amber Banner if Paused */}
            {activeConv?.status === 'PAUSED_HUMAN' && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                  <span>Esta conversación está en modo humano ({activeConv.escalationReason || 'Intervención manual'}). Hermes no responderá hasta que se devuelva el control.</span>
                </div>
              </div>
            )}

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading ? (
                <div className="flex justify-center mt-20">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center p-6 text-white/30 text-sm mt-20">
                  No messages in this session yet.
                </div>
              ) : (
                messages.map(msg => {
                  const isUser = msg.role === 'USER';
                  const isOperator = msg.role === 'OPERATOR';
                  const isActivity = msg.role === 'ACTIVITY' || msg.role === 'SYSTEM';

                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                        isUser 
                          ? 'bg-indigo-600 text-white shadow-indigo-600/10' 
                          : isOperator
                            ? 'bg-purple-600/20 border border-purple-500/30 text-purple-200 shadow-purple-600/10'
                            : isActivity
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'
                              : 'bg-[#16161D] border border-white/5 text-white/90'
                      }`}>
                        {isOperator && (
                          <div className="text-[10px] font-black tracking-widest text-purple-400 uppercase mb-1.5 flex items-center gap-1.5">
                            <UserCheck size={12} />
                            OPERADOR HUMANO
                          </div>
                        )}
                        {isActivity ? (
                          <>
                            <div className="text-[10px] font-bold tracking-widest text-emerald-400/80 uppercase mb-2">RUNTIME SYSTEM LOG</div>
                            <div className="text-sm font-mono opacity-80">{msg.content}</div>
                          </>
                        ) : (
                          msg.content
                        )}
                        <div className="text-[9px] opacity-40 text-right mt-1 font-mono">
                          {format(new Date(msg.createdAt), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Action Footer: Chat input if Paused / Info banner if Active */}
            {activeConv?.status === 'PAUSED_HUMAN' ? (
              <div className="p-4 bg-[#0C0C12] border-t border-white/[0.06] flex items-center gap-3">
                <input 
                  type="text"
                  placeholder="Escribe una respuesta como operador humano..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  className="flex-1 bg-[#12121A] border border-purple-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button 
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || isPending}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
                >
                  <Send size={14} />
                  Enviar
                </button>
              </div>
            ) : (
              <div className="p-4 bg-[#0C0C12] border-t border-white/[0.06] text-center text-xs text-white/40 font-mono flex items-center justify-between px-6">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-indigo-400" />
                  Hermes gestiona autónomamente esta sesión bajo sus políticas y contratos.
                </div>
                <button 
                  onClick={handleTakeover}
                  className="text-amber-400 hover:text-amber-300 text-xs font-bold underline cursor-pointer"
                >
                  Intervenir
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20 p-8">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <h3 className="text-xl font-medium text-white/40 mb-2">Selecciona una Conversación</h3>
            <p className="text-sm text-center max-w-sm leading-relaxed">
              Elige una sesión de la barra lateral para inspeccionar el historial en vivo o intervenir como operador humano.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
