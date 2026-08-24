'use client';

/**
 * HermesIntelligencePanel — Phase 6.4.2 & 6.5.2.2 Multi-Topic Memory Architecture & WhatsApp-Grade Chat Experience
 * 
 * Persistent conversational context panel with multi-topic thread switching,
 * real-time SSE streaming, stage-driven suggestion chips, rich formatting,
 * seamless auto-scroll, copy, quote/reply pin, and social share dispatchers.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Brain, 
  Sparkles, 
  Trash2, 
  Plus, 
  MessageSquare, 
  Compass, 
  Rocket, 
  Building2, 
  Bot,
  Copy,
  Check,
  Share2,
  Reply,
  X,
  SendHorizontal,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface HermesIntelligencePanelProps {
  organizationSlug: string;
  organizationName: string;
}

interface MessageItem {
  id: string;
  role: 'hermes' | 'user';
  content: string;
  timestamp?: string;
  replyTo?: {
    id: string;
    role: 'hermes' | 'user';
    content: string;
  };
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

  // History collapsed by default — only latest exchange visible on load
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<number>(0);

  // Quoted reply state (WhatsApp style)
  const [replyingTo, setReplyingTo] = useState<MessageItem | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Seamless auto-scroll (WhatsApp style)
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom(isSubmitting ? 'auto' : 'smooth');
  }, [messages, isSubmitting]);

  // Load chat history whenever activeTopic changes
  const loadChatHistory = async (topicId: string) => {
    setLoadingTopic(true);
    setHistoryExpanded(false); // collapse on every topic switch
    try {
      const res = await fetch(
        `/api/v1/internal/portal/messages?organizationSlug=${encodeURIComponent(organizationSlug)}&topicId=${encodeURIComponent(topicId)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          const loaded: MessageItem[] = data.messages.map((m: any) => ({
            ...m,
            timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          }));
          setMessages(loaded);
          setSessionStartedAt(loaded.length); // everything loaded is "history"
        } else {
          setMessages([]);
          setSessionStartedAt(0);
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
    setReplyingTo(null);
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
      setReplyingTo(null);
      await loadChatHistory(activeTopic.id);
    } catch (err: any) {
      toast.error('Error al reiniciar historial');
    }
  };

  const handleCopyMessage = (msg: MessageItem) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedMsgId(msg.id);
    toast.success('Mensaje copiado al portapapeles');
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleShareTelegram = (msg: MessageItem) => {
    const text = encodeURIComponent(`💬 [Hermes OS - ${organizationName}]\n\n${msg.content}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`, '_blank');
  };

  const handleShareWhatsApp = (msg: MessageItem) => {
    const text = encodeURIComponent(`💬 *[Hermes OS - ${organizationName}]*\n\n${msg.content}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleQuoteReply = (msg: MessageItem) => {
    setReplyingTo(msg);
    textareaRef.current?.focus();
  };

  const sendMessage = async (contentToSend: string) => {
    if (!contentToSend.trim() || isSubmitting) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const rawUserMsg = contentToSend.trim();
    const currentReply = replyingTo;
    
    // Prepare effective prompt text if quoting a previous message
    let effectivePrompt = rawUserMsg;
    if (currentReply) {
      const quotedPreview = currentReply.content.substring(0, 160).replace(/\n/g, ' ');
      effectivePrompt = `[En referencia al mensaje anterior: "${quotedPreview}..."]\n\n${rawUserMsg}`;
    }

    setInput('');
    setReplyingTo(null);
    setIsSubmitting(true);

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempUserMsgId = `user_${Date.now()}`;
    setMessages(prev => [...prev, { 
      id: tempUserMsgId, 
      role: 'user', 
      content: rawUserMsg,
      timestamp: timeNow,
      replyTo: currentReply ? {
        id: currentReply.id,
        role: currentReply.role,
        content: currentReply.content.substring(0, 120)
      } : undefined
    }]);

    try {
      const response = await fetch(`/api/v1/internal/portal/messages/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          organizationSlug,
          content: effectivePrompt,
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
      setMessages(prev => [...prev, { 
        id: hermesMsgId, 
        role: 'hermes', 
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

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
                  const blockedCode = dataObj.code || dataObj.reason || 'POLICY';
                  const blockedMsg = blockedCode === 'FINANCIAL_PROMISE'
                    ? 'Esta respuesta fue bloqueada porque contiene afirmaciones financieras no respaldadas por el contrato activo.'
                    : blockedCode === 'UNSUPPORTED_CLAIM_COMPOSITION'
                    ? 'Esta respuesta fue bloqueada porque incluye afirmaciones materiales sin respaldo en la bóveda soberana activa.'
                    : blockedCode === 'RESTRICTED_KNOWLEDGE'
                    ? 'Esta respuesta contiene información clasificada que no puede divulgarse en este canal.'
                    : `Esta respuesta fue bloqueada por gobernanza (${blockedCode}). Reformula la pregunta con más contexto.`;
                  accumulatedContent += `\n\n⚠️ *${blockedMsg}*`;
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
        content: 'Hubo un problema de conexión con mi kernel operativo. Por favor reintenta.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Auto-adjust textarea height on input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const latestHermesMessage = [...messages].reverse().find(m => m.role === 'hermes');
  const activeChips = latestHermesMessage?.chips || [];

  return (
    <div className="flex flex-col w-full h-full bg-[#12121A] border border-indigo-500/20 rounded-2xl overflow-hidden relative shadow-2xl">
      {/* ── TOP HEADER: IDENTITY & STATUS ── */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/[0.06] bg-[#0C0C12] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
            <Brain size={16} className="text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-medium text-sm tracking-wide truncate">Hermes Intelligence</h3>
            <p className="text-indigo-400/70 text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              Patrimonial Growth Officer • {activeTopic.title}
            </p>
          </div>
        </div>

        {/* Clear Memory Button */}
        <button
          type="button"
          onClick={handleClearHistory}
          title="Reiniciar conversación de este tema"
          className="text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors shrink-0"
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

      {/* ── MESSAGES AREA (WhatsApp-Style Internal Smooth Scroll) ── */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5 overscroll-contain">
        {loadingTopic ? (
          <div className="flex justify-center items-center py-12 text-neutral-500 text-xs">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
            Cargando memoria del tema...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-500 space-y-2">
            <Bot size={28} className="text-indigo-400/50 mb-1" />
            <p className="text-xs font-medium text-neutral-400">
              Inicia una conversación sobre {activeTopic.title.toLowerCase()}
            </p>
            <p className="text-[11px] text-neutral-600 max-w-xs leading-relaxed">
              Hermes responderá con la bóveda soberana de S&apos;Narai, tokenomics y estrategia en tiempo real.
            </p>
          </div>
        ) : (() => {
            const historyMsgs = messages.slice(0, sessionStartedAt);
            const sessionMsgs = messages.slice(sessionStartedAt);
            const hiddenCount = historyExpanded ? 0 : Math.max(0, historyMsgs.length - 2);
            const visibleHistory = historyExpanded ? historyMsgs : historyMsgs.slice(-2);

            const renderMsg = (msg: MessageItem) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex flex-col group ${isUser ? 'items-end' : 'items-start'}`}>
                  {msg.replyTo && (
                    <div className={`text-[10px] text-neutral-400 mb-1 px-3 py-1 rounded-t-lg border border-b-0 max-w-[85%] truncate ${
                      isUser ? 'bg-indigo-900/40 border-indigo-500/30' : 'bg-white/[0.03] border-white/[0.06]'
                    }`}>
                      ↩️ En respuesta a: <span className="italic text-neutral-300">&ldquo;{msg.replyTo.content}&rdquo;</span>
                    </div>
                  )}
                  <div className={`relative max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words shadow-md ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none shadow-indigo-600/20 font-medium'
                      : 'bg-[#181824] border border-white/[0.08] text-neutral-200 rounded-bl-none font-normal'
                  }`}>
                    {isUser ? <div className="whitespace-pre-wrap">{msg.content}</div> : <RichMessageBody content={msg.content} />}
                    <div className={`flex items-center justify-end gap-1 mt-2 text-[10px] font-mono ${
                      isUser ? 'text-indigo-200/80' : 'text-neutral-500'
                    }`}>
                      {msg.timestamp && <span>{msg.timestamp}</span>}
                      {isUser && <span className="text-emerald-300 font-bold">✓✓</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                    <button type="button" onClick={() => handleCopyMessage(msg)} title="Copiar texto" className="p-1 rounded-md text-neutral-500 hover:text-white hover:bg-white/[0.06] text-xs transition-colors">
                      {copiedMsgId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                    <button type="button" onClick={() => handleQuoteReply(msg)} title="Citar y responder" className="p-1 rounded-md text-neutral-500 hover:text-indigo-300 hover:bg-white/[0.06] text-xs transition-colors">
                      <Reply size={12} />
                    </button>
                    <button type="button" onClick={() => handleShareWhatsApp(msg)} title="Compartir en WhatsApp" className="p-1 rounded-md text-neutral-500 hover:text-emerald-400 hover:bg-white/[0.06] text-xs transition-colors">
                      <Share2 size={12} />
                    </button>
                    <button type="button" onClick={() => handleShareTelegram(msg)} title="Compartir en Telegram" className="p-1 rounded-md text-neutral-500 hover:text-sky-400 hover:bg-white/[0.06] text-xs transition-colors">
                      <SendHorizontal size={12} />
                    </button>
                  </div>
                </div>
              );
            };

            return (
              <>
                {/* History pill — shows count of hidden messages */}
                {hiddenCount > 0 && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setHistoryExpanded(true)}
                      className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-indigo-500/10 border border-white/[0.08] hover:border-indigo-500/30 text-[11px] text-neutral-400 hover:text-indigo-300 transition-all"
                    >
                      <MessageSquare size={12} className="shrink-0" />
                      <span>{hiddenCount === 1 ? '1 mensaje anterior' : `${hiddenCount} mensajes anteriores`}</span>
                      <span className="text-[10px] opacity-50 group-hover:opacity-100">↑</span>
                    </button>
                  </div>
                )}

                {/* Visible history messages */}
                {visibleHistory.map(renderMsg)}

                {/* Divider between history and current session */}
                {historyExpanded && sessionMsgs.length > 0 && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-white/[0.05]" />
                    <span className="text-[10px] text-neutral-600 font-mono uppercase tracking-wider">Sesión actual</span>
                    <div className="flex-1 h-px bg-white/[0.05]" />
                  </div>
                )}

                {/* Current session messages — always visible */}
                {sessionMsgs.map(renderMsg)}
              </>
            );
          })()
        }



        {/* Typing indicator */}
        {isSubmitting && (
          <div className="flex justify-start">
            <div className="bg-[#181824] border border-white/[0.08] rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
              <span className="text-xs text-indigo-300 font-mono">Hermes está redactando</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── STAGE / TOPIC SUGGESTION CHIPS ── */}
      {activeChips.length > 0 && !isSubmitting && (
        <div className="px-3 py-2 bg-[#0A0A10] border-t border-white/[0.04] shrink-0">
          <div className="w-full text-[10px] font-mono uppercase tracking-wider text-indigo-400/70 flex items-center gap-1 mb-1 px-1">
            <Sparkles size={11} /> Sugerencias Rápidas para {activeTopic.title}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1 px-1">
            {activeChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(chip)}
                className="shrink-0 snap-start text-xs bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 border border-indigo-500/30 text-indigo-200 px-3 py-1.5 rounded-xl transition-all text-left whitespace-nowrap flex items-center shadow-sm"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── QUOTING / REPLYING BANNER (WhatsApp Style) ── */}
      {replyingTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-indigo-950/60 border-t border-indigo-500/30 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Reply size={14} className="text-indigo-400 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-indigo-300">
                Respondiendo a {replyingTo.role === 'hermes' ? 'Hermes' : 'ti'}:
              </span>{' '}
              <span className="text-neutral-400 italic">
                &ldquo;{replyingTo.content.substring(0, 80)}...&rdquo;
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors shrink-0"
            title="Cancelar cita"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── INPUT AREA (Clean WhatsApp-Grade Layout) ── */}
      <div className="p-3 bg-[#0C0C12] border-t border-white/[0.06] shrink-0 flex flex-col gap-1.5">
        <div className="relative flex items-center gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Pregunta a Hermes sobre ${activeTopic.title.toLowerCase()}...`}
            className="flex-1 bg-[#161622] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/70 transition-all resize-none min-h-[44px] max-h-[120px] leading-relaxed shadow-inner"
            disabled={isSubmitting}
          />
          <button 
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isSubmitting}
            className="h-[44px] w-[44px] rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30"
            aria-label="Enviar Mensaje"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px] text-neutral-500 px-1 font-mono">
          <span>Enter ↵ para enviar</span>
          <span>Shift+Enter para salto de línea</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 🎨 RichMessageBody — Markdown Formatter for Hermes Assistant Responses
 * Supports Bold (**), Headings (###, ##, #), Bullet Lists (-/*), Numbered Lists (1.), Dividers (---), and Code.
 */
function RichMessageBody({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Horizontal rule
        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
          return <hr key={idx} className="border-t border-white/[0.1] my-2" />;
        }

        // Headings: ###
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-sm font-bold text-indigo-300 mt-2 mb-1">
              {formatInlineText(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }

        // Headings: ## or #
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3 key={idx} className="text-sm font-bold text-white mt-3 mb-1 border-b border-white/[0.08] pb-1">
              {formatInlineText(trimmed.replace(/^#+\s+/, ''))}
            </h3>
          );
        }

        // Unordered list item: - or *
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.replace(/^[-*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 my-1 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
              <div className="flex-1">{formatInlineText(itemText)}</div>
            </div>
          );
        }

        // Ordered list item: 1. 2. etc
        const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (orderedMatch) {
          const num = orderedMatch[1];
          const itemText = orderedMatch[2] || '';
          return (
            <div key={idx} className="flex items-start gap-2 my-1 pl-1">
              <span className="text-indigo-400 font-mono text-xs font-bold shrink-0 mt-0.5">{num}.</span>
              <div className="flex-1">{formatInlineText(itemText)}</div>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="my-0.5">
            {formatInlineText(line)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parses inline formatting: **bold**, *italic*, `code`
 */
function formatInlineText(text: string): React.ReactNode {
  // Regex splitting on **bold**, *italic*, and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={i} className="italic text-indigo-200">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}
