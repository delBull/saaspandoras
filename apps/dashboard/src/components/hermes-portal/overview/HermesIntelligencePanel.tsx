'use client';

/**
 * HermesIntelligencePanel — Phase 6.4.2 & 6.5.2.2 Mobile Polish
 * 
 * Persistent conversational context panel with stage-driven quick-action chips.
 * Mobile-first responsive touch interface with horizontal snap suggestion chips.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, Sparkles } from 'lucide-react';
import type { HermesOverviewView } from '@/lib/portal/portal-types';

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

export function HermesIntelligencePanel({ organizationSlug, organizationName }: HermesIntelligencePanelProps) {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStage, setActiveStage] = useState<string>('BUSINESS_DISCOVERY');
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome-1',
      role: 'hermes',
      content: `Hola. Todavía no conozco los detalles de ${organizationName}. Antes de conectar canales y definir políticas, necesito entender qué hace tu organización y qué tipo de clientes quieres atender. ¿Podrías describirme brevemente tu negocio?`,
      chips: [
        '🏠 Inmobiliaria & Desarrollo',
        '💼 Servicios B2B & Consultoría',
        '💰 Fondo de Inversión',
        '🛍 Comercio & E-Commerce'
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  // Load chat history from persistent store on mount
  useEffect(() => {
    async function loadChatHistory() {
      try {
        const res = await fetch(`/api/v1/internal/portal/messages?organizationSlug=${encodeURIComponent(organizationSlug)}`);
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
      }
    }
    loadChatHistory();
  }, [organizationSlug]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = async (contentToSend: string) => {
    if (!contentToSend.trim() || isSubmitting) return;

    // Abort previous stream if active
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
    <div className="flex flex-col flex-1 h-full min-h-[400px] bg-[#12121A] border border-indigo-500/20 rounded-2xl overflow-hidden relative shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/[0.06] bg-[#0C0C12] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
            <Brain size={16} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-medium text-sm tracking-wide">Hermes Intelligence</h3>
            <p className="text-indigo-400/70 text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {activeStage.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm sm:text-base leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-medium' 
                : 'bg-white/[0.05] border border-white/[0.08] text-white/90 font-normal'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

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

      {/* Stage-driven Quick Action Chips — Mobile Horizontally Scrollable Snap Row */}
      {activeChips.length > 0 && !isSubmitting && (
        <div className="px-3 py-2 bg-[#0A0A10] border-t border-white/[0.04] shrink-0">
          <div className="w-full text-[10px] font-mono uppercase tracking-wider text-indigo-400/70 flex items-center gap-1 mb-2 px-1">
            <Sparkles size={11} /> Sugerencias Rápidas
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1 px-1">
            {activeChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(chip)}
                className="shrink-0 snap-start text-xs bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 border border-indigo-500/30 text-indigo-200 px-3.5 py-2 rounded-xl transition-all text-left whitespace-nowrap min-h-[44px] flex items-center shadow-sm"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area — Sticky Bottom Bar with 16px Font (no iOS Safari auto-zoom) */}
      <div className="p-3 sm:p-4 bg-[#0C0C12] border-t border-white/[0.06] shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Responde a Hermes o selecciona una opción..."
            className="w-full bg-[#12121A] border border-white/[0.12] rounded-xl pl-4 pr-12 py-3 text-base text-white placeholder-white/35 focus:outline-none focus:border-indigo-500/60 transition-colors min-h-[48px]"
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
