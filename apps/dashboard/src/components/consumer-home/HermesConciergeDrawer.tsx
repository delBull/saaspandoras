'use client';

/**
 * 🤖 Hermes Concierge Drawer — Contextualized Inquiries for Pandora's Sovereign Portal
 * apps/dashboard/src/components/consumer-home/HermesConciergeDrawer.tsx
 */

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  X, 
  Send, 
  ShieldCheck, 
  Bot, 
  CheckCircle2, 
  AlertCircle,
  Building2 
} from "lucide-react";
import type { CatalogItemDto } from "@saasfly/shared";

interface HermesConciergeDrawerProps {
  item: CatalogItemDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HermesConciergeDrawer({
  item,
  isOpen,
  onClose,
}: HermesConciergeDrawerProps) {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'hermes'; text: string; time: string }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);

  // Form for lead handoff
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen && item) {
      setMessages([
        {
          sender: 'hermes',
          text: `Hola, soy Hermes Concierge. Veo que tienes interés en "${item.title}". ¿Deseas información detallada sobre la contratación, el modelo de operación o agendar una consulta con el equipo de ${item.tenantName}?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setLeadCaptured(false);
      setInputMessage("");
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userText = inputMessage.trim();
    const newMsg = {
      sender: 'user' as const,
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
    setIsSending(true);

    try {
      // In consumer portal, route inquiry through Hermes chat / lead intake
      const res = await fetch("/api/v1/hermes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[Inquiry regarding ${item.title} (${item.tenantSlug})]: ${userText}`,
          organizationId: item.tenantSlug,
          surface: "CONSUMER_PORTAL",
          channelType: "AUTHENTICATED_WEB",
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'hermes',
            text: data.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        // Honest fallback response if tenant requires human onboarding handoff
        setMessages((prev) => [
          ...prev,
          {
            sender: 'hermes',
            text: `He registrado tu consulta sobre "${item.title}". Para transferirte con el oficial de cuenta o fundador de ${item.tenantName}, por favor completa tus datos de contacto abajo.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLeadCaptured(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'hermes',
          text: `He registrado tu inquietud. Puedes dejar tus datos a continuación para que el equipo de ${item.tenantName} te contacte directamente.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setLeadCaptured(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.email) return;

    try {
      const res = await fetch("/api/v1/marketing/leads/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone || undefined,
          intent: "explore",
          consent: true,
          metadata: {
            catalogItemId: item.id,
            catalogItemTitle: item.title,
            tenantSlug: item.tenantSlug,
            notes: leadForm.notes || undefined,
            source: "consumer_catalog_concierge",
          },
        }),
      });

      if (!res.ok) throw new Error("Fallo al registrar solicitud");

      setMessages((prev) => [
        ...prev,
        {
          sender: 'hermes',
          text: `¡Excelente, ${leadForm.name}! Tu solicitud ha sido registrada y transferida al equipo de ${item.tenantName}. Te contactaremos a la brevedad.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setLeadCaptured(false);
    } catch {
      alert("No fue posible enviar tus datos en este momento. Inténtalo más tarde.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <span>Hermes Concierge</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-900">
                  AI
                </span>
              </h3>
              <span className="text-xs text-zinc-400 truncate max-w-[200px]">
                {item.title} ({item.tenantName})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? "ml-auto bg-emerald-500 text-zinc-950 font-medium rounded-tr-none shadow-md shadow-emerald-950"
                  : "mr-auto bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none"
              }`}
            >
              <p>{m.text}</p>
              <span className={`text-[10px] mt-1.5 self-end ${m.sender === 'user' ? 'text-zinc-800' : 'text-zinc-500'}`}>
                {m.time}
              </span>
            </div>
          ))}

          {/* Handoff Lead Form */}
          {leadCaptured && (
            <form onSubmit={handleLeadSubmit} className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-3 mt-2">
              <span className="text-xs font-semibold text-zinc-200">
                Transferencia con {item.tenantName}
              </span>
              <input
                type="text"
                placeholder="Tu Nombre Completo"
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                required
                className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <input
                type="email"
                placeholder="Correo Electrónico"
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                required
                className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <input
                type="tel"
                placeholder="Teléfono / WhatsApp (Opcional)"
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="py-2 px-3 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
              >
                Solicitar Contacto Oficial
              </button>
            </form>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center gap-2">
          <input
            type="text"
            placeholder="Escribe tu consulta..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending}
            className="p-2.5 rounded-xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
