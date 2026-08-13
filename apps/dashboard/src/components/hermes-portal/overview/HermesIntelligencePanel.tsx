'use client';

/**
 * HermesIntelligencePanel — Phase 6.4.2
 * 
 * Persistent conversational context panel with stage-driven quick-action chips.
 * "Portal conversation uses the same Hermes Runtime as external channels."
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, Sparkles } from 'lucide-react';
import type { HermesOverviewView } from '@/lib/portal/portal-types';

interface HermesIntelligencePanelProps {
  overview: HermesOverviewView;
  organizationSlug: string;
}

interface MessageItem {
  id: string;
  role: 'hermes' | 'user';
  content: string;
  chips?: string[];
}

export function HermesIntelligencePanel({ overview, organizationSlug }: HermesIntelligencePanelProps) {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStage, setActiveStage] = useState<string>('BUSINESS_DISCOVERY');
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome-1',
      role: 'hermes',
      content: `Hola. Todavía no conozco los detalles de ${overview.organization.name}. Antes de conectar canales y definir políticas, necesito entender qué hace tu organización y qué tipo de clientes quieres atender. ¿Podrías describirme brevemente tu negocio?`,
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

  const sendMessage = async (contentToSend: string) => {
    if (!contentToSend.trim() || isSubmitting) return;

    const userMsgText = contentToSend.trim();
    setInput('');
    setIsSubmitting(true);

    const tempUserMsgId = `user_${Date.now()}`;
    setMessages(prev => [...prev, { id: tempUserMsgId, role: 'user', content: userMsgText }]);

    try {
      const response = await fetch(`/api/v1/internal/portal/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationSlug,
          content: userMsgText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      if (data.stage) {
        setActiveStage(data.stage);
      }
      
      setMessages(prev => [...prev, { 
        id: `hermes_${Date.now()}`, 
        role: 'hermes', 
        content: data.reply || 'He registrado tu respuesta.',
        chips: data.chips
      }]);
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
    <div className="flex flex-col h-full bg-[#12121A] border border-indigo-500/20 rounded-2xl overflow-hidden relative shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] bg-[#0C0C12]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Brain size={16} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-medium text-sm tracking-wide">Hermes Intelligence</h3>
            <p className="text-indigo-400/60 text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {activeStage.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'bg-white/[0.04] border border-white/[0.08] text-white/90'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isSubmitting && (
          <div className="flex justify-start">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Stage-driven Quick Action Chips */}
      {activeChips.length > 0 && !isSubmitting && (
        <div className="px-4 py-2 bg-[#0A0A10] border-t border-white/[0.04] flex flex-wrap gap-2">
          <div className="w-full text-[10px] font-mono uppercase tracking-wider text-indigo-400/60 flex items-center gap-1 mb-1">
            <Sparkles size={11} /> Sugerencias de Respuesta
          </div>
          {activeChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(chip)}
              className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-200 px-3 py-1.5 rounded-lg transition-all text-left"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-[#0C0C12] border-t border-white/[0.04]">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Responde a Hermes o selecciona una opción..."
            className="w-full bg-[#12121A] border border-white/[0.1] rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
            disabled={isSubmitting}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isSubmitting}
            className="absolute right-2 p-2 rounded-lg text-white/50 hover:text-indigo-400 hover:bg-white/[0.05] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white/50 transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
