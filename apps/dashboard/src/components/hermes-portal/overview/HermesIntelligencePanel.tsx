'use client';

/**
 * HermesIntelligencePanel — Phase 6.4.2 & 6.5.2.2 Multi-Topic Memory Architecture
 * 
 * Persistent conversational context panel with multi-topic thread switching,
 * real-time SSE streaming, stage-driven suggestion chips, and rich formatting.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, Sparkles, Trash2, Plus, MessageSquare, Compass, Rocket, Building2, Bot } from 'lucide-react';
import { toast } from 'sonner';

interface HermesIntelligencePanelProps {
  organizationSlug: string;
  organizationName: string;
}

interface MessageItem {
  id: string;
  role: 'hermes' | 'user';
  content: string;
  chips?: string[];
}

export interface TopicItem {
  id: string;
  title: string;
  icon: any;
  badge?: string;
}

const DEFAULT_TOPICS: TopicItem[] = [
  { id: 'general', title: 'General', icon: Compass },
  { id: 'marketing', title: 'Marketing & Lanzamiento', icon: Rocket, badge: 'HOT' },
  { id: 'tokenomics', title: 'Tokenomics & RWA', icon: Building2 },
  { id: 'journeys', title: 'Journeys & Embudo', icon: Bot },
];

export function HermesIntelligencePanel({ organizationSlug, organizationName }: HermesIntelligencePanelProps) {
  const [topics, setTopics] = useState<TopicItem[]>(DEFAULT_TOPICS);
  const [activeTopic, setActiveTopic] = useState<TopicItem>(DEFAULT_TOPICS[0]!);
  const [showNewTopicInput, setShowNewTopicInput] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [activeStage, setActiveStage] = useState<string>('ACTIVATION');

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  // Load chat history whenever activeTopic changes
  const loadChatHistory = async (topicId: string) => {
    setLoadingTopic(true);
    try {
      const res = await fetch(
        `/api/v1/internal/portal/messages?organizationSlug=${encodeURIComponent(organizationSlug)}&topicId=${encodeURIComponent(topicId)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
        if (data.stage) {
          setActiveStage(data.stage);
        }
      }
    } catch (err) {
      console.warn('[HermesIntelligencePanel] Failed to load chat history:', err);
    } finally {
      setLoadingTopic(false);
    }
  };

  useEffect(() => {
    loadChatHistory(activeTopic.id);
  }, [organizationSlug, activeTopic.id]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSelectTopic = (topic: TopicItem) => {
    if (topic.id === activeTopic.id) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setActiveTopic(topic);
  };

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTopicName.trim();
    if (!clean) return;
    const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 24);
    const newTopic: TopicItem = {
      id: slug,
      title: clean,
      icon: MessageSquare,
      badge: 'NUEVO'
    };
    setTopics(prev => [...prev, newTopic]);
    setActiveTopic(newTopic);
    setNewTopicName('');
    setShowNewTopicInput(false);
    toast.success(`Tema "${clean}" creado exitosamente`);
  };

  const handleClearHistory = async () => {
    if (!confirm(`¿Deseas reiniciar la memoria del tema "${activeTopic.title}"?`)) return;
    try {
      await fetch(
        `/api/v1/internal/portal/messages?organizationSlug=${encodeURIComponent(organizationSlug)}&topicId=${encodeURIComponent(activeTopic.id)}`,
        { method: 'DELETE' }
      );
      toast.success(`Historial de "${activeTopic.title}" reiniciado`);
      await loadChatHistory(activeTopic.id);
    } catch (err: any) {
      toast.error('Error al reiniciar historial');
    }
  };

  const sendMessage = async (contentToSend: string) => {
    if (!contentToSend.trim() || isSubmitting) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMsgText = contentToSend.trim();
    setInput('');
    setIsSubmitting(true);

    const tempUserMsgId = `user_${Date.now()}`;
    setMessages(prev => [...prev, { id: tempUserMsgId, role: 'user', content: userMsgText }]);

    try {
      const response = await fetch(`/api/v1/internal/portal/messages/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          organizationSlug,
          content: userMsgText,
          topicId: activeTopic.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start stream');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';

      const hermesMsgId = `hermes_${Date.now()}`;
      setMessages(prev => [...prev, { id: hermesMsgId, role: 'hermes', content: '' }]);

      let accumulatedContent = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const eventStr of events) {
            const lines = eventStr.split('\n');
            let eventType = '';
            let dataStr = '';
            
            for (const line of lines) {
              if (line.startsWith('event: ')) eventType = line.substring(7).trim();
              else if (line.startsWith('data: ')) dataStr = line.substring(6).trim();
            }

            if (eventType && dataStr) {
              try {
                const dataObj = JSON.parse(dataStr);
                if (eventType === 'response.delta') {
                  accumulatedContent += dataObj.delta;
                  setMessages(prev => prev.map(m => m.id === hermesMsgId ? { ...m, content: accumulatedContent } : m));
                } else if (eventType === 'response.blocked') {
                  accumulatedContent += `\n\n[Bloqueado por política: ${dataObj.reason}]`;
                  setMessages(prev => prev.map(m => m.id === hermesMsgId ? { ...m, content: accumulatedContent } : m));
                } else if (eventType === 'stream.error') {
                  accumulatedContent += `\n\n[Error de conexión: ${dataObj.error}]`;
                  setMessages(prev => prev.map(m => m.id === hermesMsgId ? { ...m, content: accumulatedContent } : m));
                }
              } catch (e) {
                console.error('[HermesIntelligencePanel] Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[HermesIntelligencePanel] Send error:', error);
      setMessages(prev => [...prev, { 
        id: `err_${Date.now()}`, 
        role: 'hermes', 
        content: 'Hubo un problema de conexión con mi kernel operativo. Por favor reintenta.' 
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const latestHermesMessage = [...messages].reverse().find(m => m.role === 'hermes');
  const activeChips = latestHermesMessage?.chips || [];

  return (
    <div className="flex flex-col flex-1 h-full min-h-[500px] bg-[#12121A] border border-indigo-500/20 rounded-2xl overflow-hidden relative shadow-2xl">
      {/* ── TOP HEADER: IDENTITY & STATUS ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.06] bg-[#0C0C12] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
            <Brain size={16} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-medium text-sm tracking-wide">Hermes Intelligence</h3>
            <p className="text-indigo-400/70 text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Patrimonial Growth Officer • {activeTopic.title}
            </p>
          </div>
        </div>

        {/* Clear Memory Button */}
        <button
          type="button"
          onClick={handleClearHistory}
          title="Reiniciar conversación de este tema"
          className="text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* ── TOPICS SELECTOR BAR ── */}
      <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#09090E] border-b border-white/[0.04] overflow-x-auto scrollbar-none shrink-0">
        {topics.map(topic => {
          const Icon = topic.icon;
          const isSelected = activeTopic.id === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => handleSelectTopic(topic)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                  : 'bg-white/[0.03] text-neutral-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.04]'
              }`}
            >
              <Icon size={13} className={isSelected ? 'text-indigo-400' : 'text-neutral-500'} />
              <span>{topic.title}</span>
              {topic.badge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                  topic.badge === 'HOT' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
                }`}>
                  {topic.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Create new custom topic */}
        {showNewTopicInput ? (
          <form onSubmit={handleCreateTopic} className="flex items-center gap-1.5 shrink-0">
            <input
              type="text"
              placeholder="Nombre del tema..."
              value={newTopicName}
              onChange={e => setNewTopicName(e.target.value)}
              className="bg-[#161622] border border-indigo-500/40 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-neutral-600 focus:outline-none w-36"
              autoFocus
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-2 py-1 rounded-lg"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setShowNewTopicInput(false)}
              className="text-neutral-500 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowNewTopicInput(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-indigo-300 hover:bg-indigo-500/10 border border-dashed border-white/[0.08] transition-all whitespace-nowrap"
          >
            <Plus size={13} />
            <span>Nuevo Tema</span>
          </button>
        )}
      </div>

      {/* ── MESSAGES AREA ── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {loadingTopic ? (
          <div className="flex justify-center items-center py-12 text-neutral-500 text-xs">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
            Cargando memoria del tema...
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-3.5 text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-medium' 
                  : 'bg-white/[0.05] border border-white/[0.08] text-white/90 font-normal'
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isSubmitting && (
          <div className="flex justify-start">
            <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── STAGE / TOPIC SUGGESTION CHIPS ── */}
      {activeChips.length > 0 && !isSubmitting && (
        <div className="px-3 py-2 bg-[#0A0A10] border-t border-white/[0.04] shrink-0">
          <div className="w-full text-[10px] font-mono uppercase tracking-wider text-indigo-400/70 flex items-center gap-1 mb-2 px-1">
            <Sparkles size={11} /> Sugerencias Rápidas para {activeTopic.title}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1 px-1">
            {activeChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(chip)}
                className="shrink-0 snap-start text-xs bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 border border-indigo-500/30 text-indigo-200 px-3.5 py-2 rounded-xl transition-all text-left whitespace-nowrap min-h-[40px] flex items-center shadow-sm"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── INPUT AREA ── */}
      <div className="p-3 sm:p-4 bg-[#0C0C12] border-t border-white/[0.06] shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Escribe a Hermes sobre ${activeTopic.title.toLowerCase()}...`}
            className="w-full bg-[#12121A] border border-white/[0.12] rounded-xl pl-4 pr-12 py-3 text-sm sm:text-base text-white placeholder-white/35 focus:outline-none focus:border-indigo-500/60 transition-colors min-h-[48px]"
            disabled={isSubmitting}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isSubmitting}
            className="absolute right-2 p-2.5 rounded-lg text-white/70 hover:text-indigo-300 bg-indigo-600/30 hover:bg-indigo-600/50 disabled:opacity-30 disabled:bg-transparent disabled:hover:text-white/50 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Enviar Mensaje"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
