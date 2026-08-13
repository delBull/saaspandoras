'use client';

/**
 * HermesIntelligencePanel — Phase 6.3
 * 
 * Persistent conversational context panel for onboarding and ongoing operations.
 * "Portal conversation uses the same Hermes Runtime as external channels."
 */

import React, { useState } from 'react';
import { Send, Brain } from 'lucide-react';
import type { HermesOverviewView } from '@/lib/portal/portal-types';

interface HermesIntelligencePanelProps {
  overview: HermesOverviewView;
  organizationSlug: string;
}

export function HermesIntelligencePanel({ overview, organizationSlug }: HermesIntelligencePanelProps) {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<{ id: string; role: 'hermes' | 'user'; content: string }[]>([
    {
      id: 'welcome-1',
      role: 'hermes',
      content: overview.systemStatus === 'NOT_CONFIGURED' 
        ? `Hola. Todavía no conozco los detalles de ${overview.organization.name}. Antes de conectar canales y definir políticas, necesito entender qué hace tu organización y qué tipo de clientes quieres atender. ¿Podrías describirme brevemente tu negocio?`
        : `Hola. Estoy monitoreando las operaciones de ${overview.organization.name}. ¿En qué te puedo ayudar hoy?`,
    }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    const userMessage = input.trim();
    setInput('');
    setIsSubmitting(true);

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);

    try {
      const response = await fetch(`/api/v1/internal/portal/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationSlug,
          content: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // We expect the Event Spine/Execution Engine to process this and return a response or we rely on websockets.
      // For now, we simulate the immediate response from Hermes for the onboarding journey.
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'hermes', 
        content: data.reply || 'He recibido tu mensaje. Estoy procesando tu solicitud a través del Event Gateway.' 
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'hermes', 
        content: 'Hubo un error de conexión con mi kernel operativo. Por favor intenta de nuevo.' 
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#12121A] border border-indigo-500/20 rounded-2xl overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.04] bg-[#0C0C12]">
        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
          <Brain size={16} className="text-indigo-400" />
        </div>
        <div>
          <h3 className="text-white font-medium text-sm tracking-wide">Hermes Intelligence</h3>
          <p className="text-indigo-400/60 text-[10px] font-semibold tracking-wider uppercase">
            {overview.journeyStatus === 'ACTIVE' ? 'Active Journey' : 'Standby'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-500 text-white' 
                : 'bg-white/[0.04] border border-white/[0.08] text-white/80'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isSubmitting && (
          <div className="flex justify-start">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0C0C12] border-t border-white/[0.04]">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your response to Hermes..."
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
