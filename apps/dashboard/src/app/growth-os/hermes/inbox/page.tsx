'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Send,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Escalation {
  id: string;
  conversationId: string;
  status: string;
  escalationReason: string;
  escalatedAt: string;
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
  const tenantSlug = searchParams?.get('tenant') || 'snarai'; // Fallback for dev

  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Escalation | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchEscalations();
  }, [tenantSlug]);

  const fetchEscalations = async () => {
    try {
      const res = await fetch(`/api/v1/hermes/escalations?tenantSlug=${tenantSlug}`);
      const data = await res.json();
      if (data.success) {
        setEscalations(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (conversationId: string) => {
    try {
      await fetch('/api/v1/hermes/escalations/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          conversationId,
          resolutionSummary: 'Resuelto por humano.'
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
          conversationId: selectedCase.conversationId,
          message: replyMessage,
          channel: 'telegram' // Assume telegram for now
        })
      });
      setReplyMessage('');
      alert('Mensaje enviado al usuario.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 p-8 pt-24 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10 flex flex-col h-[calc(100vh-120px)]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-white mb-2 flex items-center gap-3">
              <Bot className="w-8 h-8 text-red-500/80" />
              HITL Inbox: <span className="font-semibold">{tenantSlug}</span>
            </h1>
            <p className="text-slate-400">Atención requerida para usuarios escalados desde Hermes OS.</p>
          </div>
          <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2">
            {escalations.length} Casos Abiertos
          </Badge>
        </div>

        {/* Kanban Board */}
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
                    onClick={() => setSelectedCase(esc)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border ${
                      selectedCase?.id === esc.id 
                      ? 'bg-blue-500/10 border-blue-500/30' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs bg-black/40">
                        {esc.escalationReason || 'Desconocido'}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(esc.escalatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="font-medium text-sm text-slate-200 truncate">
                      Chat ID: {esc.conversationId}
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
                    onClick={() => handleResolve(selectedCase.conversationId)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolver y Devolver a Hermes
                  </Button>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
                    <h4 className="text-red-400 font-medium mb-1">Razón de Escalamiento</h4>
                    <p className="text-slate-300 text-sm">El usuario generó un flag automático por: {selectedCase.escalationReason || 'Frustración repetitiva'}. Hermes se ha puesto en pausa.</p>
                  </div>
                  
                  {/* Mock Transcript */}
                  <div className="space-y-4 mb-6">
                    <h4 className="text-slate-400 font-medium text-sm">Últimos Mensajes</h4>
                    <div className="bg-white/5 p-4 rounded-xl text-sm text-slate-300 border border-white/10">
                       <p className="text-blue-400 font-medium mb-1">Usuario:</p>
                       <p>No entiendo como funciona el vesting. Quiero hablar con un humano.</p>
                    </div>
                    <div className="bg-blue-500/5 p-4 rounded-xl text-sm text-slate-300 border border-blue-500/10">
                       <p className="text-blue-400 font-medium mb-1">Hermes:</p>
                       <p>Entendido. He pausado mi asistencia automática. Un especialista revisará tu caso en breve.</p>
                    </div>
                  </div>
                </div>

                {/* Reply Box */}
                <div className="p-4 border-t border-white/10 bg-black/40">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Escribe directamente al usuario (Se enviará vía Telegram/Web)..."
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
                <Badge className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/20">Nexus SOP</Badge>
              </h2>
              <button onClick={() => setSelectedCase(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-slate-300 space-y-6">
              <div>
                <h3 className="text-white font-medium text-base mb-2">Procedimiento Operativo: Vesting</h3>
                <p className="text-slate-400">Este usuario tiene dudas sobre el contrato de adquisición (vesting). Sigue estos pasos para la resolución corporativa.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <ol className="list-decimal list-inside space-y-3">
                  <li>Verificar la wallet en el explorador interno.</li>
                  <li>Confirmar el Cliff Date.</li>
                  <li>Si el usuario pide cancelación manual, solicitar ticket en <code>support@pandoras.finance</code>.</li>
                  <li><strong>Nota:</strong> Nunca compartas la Tx Hash privada.</li>
                </ol>
              </div>
              <Button variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-slate-300">
                Ver Guía Completa en Nexus
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
