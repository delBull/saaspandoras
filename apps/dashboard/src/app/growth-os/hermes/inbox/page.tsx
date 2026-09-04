'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  MessageSquare, 
  CheckCircle,
  AlertTriangle,
  Send,
  X,
  BookOpen,
  Settings
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Escalation {
  id: string;
  conversationId: string;
  status: string;
  reason: string;
  notes: string | null;
  createdAt: string;
}

interface Message {
  id: string;
  role: 'USER' | 'HERMES' | 'SYSTEM' | 'OPERATOR';
  content: string;
  sequence: number;
}

export default function HITLInboxPageWrapper() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="text-white animate-pulse">Cargando Inbox...</div></div>}>
      <HITLInboxPage />
    </React.Suspense>
  );
}

function HITLInboxPage() {
  const searchParams = useSearchParams();
  const tenantSlug = searchParams?.get('tenant') || 'snarai';

  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Escalation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);

  useEffect(() => {
    fetchEscalations();
  }, [tenantSlug]);

  const fetchEscalations = async () => {
    try {
      const res = await fetch(`/api/v1/hermes/escalations?tenantSlug=${tenantSlug}`);
      const data = await res.json();
      if (data.success) {
        setEscalations(data.data.filter((e: any) => e.status !== 'RESOLVED'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectCase = async (esc: Escalation) => {
    setSelectedCase(esc);
    setMessages([]); // clear previous
    try {
      const res = await fetch(`/api/v1/hermes/escalations/${esc.id}?tenantSlug=${tenantSlug}`);
      const data = await res.json();
      if (data.success && data.data.messages) {
        setMessages(data.data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async () => {
    if (!selectedCase) return;
    try {
      await fetch('/api/v1/hermes/escalations/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          escalationId: selectedCase.id,
          resolutionSummary: 'Resuelto por operador manual.'
        })
      });
      setSelectedCase(null);
      fetchEscalations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async () => {
    if (!replyMessage || !selectedCase) return;
    try {
      await fetch('/api/v1/hermes/escalations/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          escalationId: selectedCase.id,
          message: replyMessage,
        })
      });
      setReplyMessage('');
      // Refresh messages
      selectCase(selectedCase);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 p-8 pt-24 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10 flex flex-col h-[calc(100vh-120px)]">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-white mb-2 flex items-center gap-3">
              <Bot className="w-8 h-8 text-red-500/80" />
              HITL Inbox: <span className="font-semibold">{tenantSlug}</span>
              <button 
                onClick={() => setShowSettings(true)}
                className="ml-2 p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Configurar Webhook del Tenant"
              >
                <Settings className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
              </button>
            </h1>
            <p className="text-slate-400">Atención requerida para usuarios escalados desde Hermes OS.</p>
          </div>
          <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2">
            {escalations.length} Casos Abiertos
          </Badge>
        </div>

        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex shadow-2xl backdrop-blur-xl">
          
          {/* List (Left Pane) */}
          <div className="w-1/3 border-r border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10 bg-white/[0.02]">
              <h3 className="font-medium text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Cola de Prioridad
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="text-center text-slate-500 py-10 animate-pulse">Cargando...</div>
              ) : escalations.length === 0 ? (
                <div className="text-center text-slate-500 py-10">No hay escalaciones activas.</div>
              ) : (
                escalations.map((esc) => (
                  <div 
                    key={esc.id} 
                    onClick={() => selectCase(esc)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border ${
                      selectedCase?.id === esc.id 
                      ? 'bg-blue-500/10 border-blue-500/30' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs bg-black/40">
                        {esc.reason || 'MANUAL'}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(esc.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="font-medium text-sm text-slate-200 truncate">
                      Chat ID: {esc.conversationId}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 truncate">
                        Estado: {esc.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Details (Right Pane) */}
          <div className="flex-1 flex flex-col bg-black/20">
            {selectedCase ? (
              <>
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div>
                    <h2 className="text-lg font-medium text-white">Detalle de Escalación</h2>
                    <p className="text-sm text-slate-400">Conversación {selectedCase.conversationId}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                    onClick={handleResolve}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolver y Devolver a Hermes
                  </Button>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl shrink-0">
                    <h4 className="text-red-400 font-medium mb-1 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Razón de Escalamiento
                    </h4>
                    <p className="text-slate-300 text-sm">{selectedCase.reason}</p>
                    {selectedCase.notes && (
                        <p className="text-slate-400 text-xs mt-2 italic">Notas: {selectedCase.notes}</p>
                    )}
                  </div>
                  
                  {/* Real Transcript */}
                  <div className="flex-1 flex flex-col space-y-4 pt-4 border-t border-white/5">
                    {messages.length === 0 ? (
                        <div className="text-center text-slate-500 py-4 animate-pulse">Cargando historial...</div>
                    ) : (
                        messages.map(msg => (
                            <div key={msg.id} className={`p-4 rounded-xl text-sm border ${
                                msg.role === 'USER' ? 'bg-white/5 text-slate-300 border-white/10 self-start w-3/4' :
                                msg.role === 'HERMES' ? 'bg-blue-500/5 text-slate-300 border-blue-500/10 self-end w-3/4' :
                                msg.role === 'OPERATOR' ? 'bg-green-500/5 text-green-300 border-green-500/10 self-end w-3/4' :
                                'bg-yellow-500/5 text-yellow-500/70 border-yellow-500/10 self-center w-full text-center text-xs'
                            }`}>
                                <p className="font-medium mb-1 opacity-70">
                                    {msg.role === 'USER' ? 'Usuario' : msg.role === 'OPERATOR' ? 'Soporte Humano' : msg.role}
                                </p>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Reply Box */}
                <div className="p-4 border-t border-white/10 bg-black/40">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Escribe directamente al usuario (Se enviará vía Edge Outbound)..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                    />
                    <Button onClick={handleReply} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Send className="w-4 h-4 mr-2" /> Enviar
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p>Selecciona un caso de la cola para revisarlo</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
      
      {/* Drawer: Nexus SOP Injection */}
      <AnimatePresence>
        {selectedCase && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-[400px] h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <Badge className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/20">Nexus Base de Conocimiento</Badge>
              </h2>
              <button onClick={() => setSelectedCase(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-slate-300 space-y-6">
              <div>
                <h3 className="text-white font-medium text-base mb-2">Procedimiento sugerido</h3>
                <p className="text-slate-400">Contexto de la escalación: {selectedCase.reason}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-2">Consultando Nexus en tiempo real para el tópico actual...</p>
                  <p className="text-sm italic">
                      [El Soporte SOP dinámico no está configurado para este tenant. Por favor contacta al administrador de Nexus para indexar guías relacionadas a {selectedCase.reason}.]
                  </p>
              </div>
              <Button variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-slate-300" onClick={() => window.open('https://nexus.pandoras.finance', '_blank')}>
                <BookOpen className="w-4 h-4 mr-2" /> Buscar en Nexus
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f0f0f] border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Configuración del Tenant</h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Discord Webhook URL (HITL Alertas)
                  </label>
                  <input 
                    type="text" 
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Si se deja en blanco, se usará el webhook default de la plataforma.
                  </p>
                </div>
                <Button 
                  onClick={async () => {
                    setSavingWebhook(true);
                    try {
                      await fetch(`/api/v1/projects/${tenantSlug}/integrations`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ discordWebhookUrl: webhookUrl })
                      });
                      setShowSettings(false);
                    } catch (e) {
                      console.error(e);
                    }
                    setSavingWebhook(false);
                  }} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={savingWebhook}
                >
                  {savingWebhook ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
