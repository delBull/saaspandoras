'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  ShieldCheck, 
  Zap, 
  Users, 
  FolderGit2, 
  MessageSquare, 
  Lock, 
  ChevronRight, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  ArrowUpRight,
  Database,
  Layers,
  Cpu,
  BarChart3,
  Globe,
  Building2,
  PhoneCall,
  Sliders,
  Workflow,
  KeyRound,
  LayoutDashboard
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GrowthOSLeadModal } from "@/components/marketing/GrowthOSLeadModal";

// ─────────────────── HERMES DEMO PLAYGROUND ───────────────────

const INDUSTRIES = [
  {
    id: 'real_estate',
    label: '🏠 Real Estate',
    color: 'amber',
    agentName: 'Hermes Patrimonial',
    pack: 'real-estate-premium',
    channels: ['Telegram', 'WhatsApp', 'Web'],
    capabilities: ['AI Agents', 'CRM', 'Commerce', 'Analytics', 'Voice'],
    conversation: [
      { role: 'user', text: 'Hola, me interesa invertir en el proyecto. ¿Cuánto cuesta un certificado?' },
      { role: 'agent', text: 'Bienvenido. Los Certificados de Participación tienen un precio base de $8,500 USD en la Fase 1, con plusvalía proyectada del 12–15% anual. ¿Le gustaría recibir el dossier completo por este canal?' },
      { role: 'user', text: 'Sí, me interesa. ¿Puedo pagar en pesos?' },
      { role: 'agent', text: 'Por supuesto. Contamos con **SPEI Fast Lane** para reservas en Pesos Mexicanos (MXN). Su lugar queda bloqueado por 7 días mientras se procesa la transferencia. ¿Le genero el link de reserva?' },
    ]
  },
  {
    id: 'auto',
    label: '🚗 Automotriz',
    color: 'blue',
    agentName: 'Hermes AutoAdvisor',
    pack: 'automotive-sales',
    channels: ['WhatsApp', 'Web Widget', 'Telegram'],
    capabilities: ['AI Agents', 'CRM', 'Analytics', 'Scheduling'],
    conversation: [
      { role: 'user', text: 'Quiero información sobre el BMW Serie 3 2025' },
      { role: 'agent', text: 'Hola, bienvenido a BMW México. El Serie 3 2025 está disponible desde $895,900 MXN. Tenemos en stock el color Carbon Black y Alpine White. ¿Le gustaría agendar una prueba de manejo?' },
      { role: 'user', text: 'Sí, este sábado si es posible' },
      { role: 'agent', text: 'Perfecto. Tengo disponibilidad el sábado a las 10:00, 12:00 y 16:00 hrs en la Agencia Lomas. ¿Cuál horario le conviene? Confirmo su cita y le envío el link de confirmación.' },
    ]
  },
  {
    id: 'legal',
    label: '⚖️ Legal / Firma',
    color: 'purple',
    agentName: 'Hermes Legal Concierge',
    pack: 'legal-advisory',
    channels: ['Web Widget', 'Email', 'WhatsApp'],
    capabilities: ['AI Agents', 'CRM', 'Knowledge Engine', 'Analytics'],
    conversation: [
      { role: 'user', text: 'Necesito asesoría para constituir una empresa' },
      { role: 'agent', text: 'Con gusto le oriento. Para la constitución de una empresa en México, las figuras más comunes son SAPI de CV, SA de CV y SAS. ¿Ya tiene definido el número de socios y el tipo de actividad comercial?' },
      { role: 'user', text: 'Somos 3 socios y es para tecnología' },
      { role: 'agent', text: 'Excelente. Para una startup tecnológica con 3 socios, recomendamos la figura **SAS (Sociedad por Acciones Simplificada)**. Bajo costo, constitución rápida y sin capital mínimo. ¿Le agendo una consulta de 30 min con el área corporativa?' },
    ]
  },
  {
    id: 'web3_education',
    label: '🌐 Web3 & Soberanía Digital',
    color: 'emerald',
    agentName: 'Hermes Sovereign (Educador Web3 & Soberanía)',
    pack: 'web3-sovereign-education',
    channels: ['Telegram', 'Web Widget', 'WhatsApp'],
    capabilities: ['AI Agents', 'CRM', 'Knowledge Engine', 'Scheduling'],
    conversation: [
      { role: 'user', text: 'Hola, me interesa aprender sobre soberanía digital y auto-custodia Web3' },
      { role: 'agent', text: '¡Bienvenido! La soberanía digital comienza por entender la auto-custodia de tus activos y la identidad descentralizada. ¿Buscas educación inicial en Web3 o arquitectura de nodos y privacidad avanzada?' },
      { role: 'user', text: 'Busco educación inicial y cómo proteger mi patrimonio' },
      { role: 'agent', text: 'Excelente decisión. Contamos con el **Web3 Sovereign Academy Playbook**. Te puedo agendar un workshop de introducción o enviarte la guía de auto-custodia. ¿Cuál prefieres?' },
    ]
  }
];

type ColorConfig = { border: string; badge: string; text: string; btn: string; bg: string; bubble: string };
const colorMap: Record<string, ColorConfig> = {
  amber: { border: 'border-amber-500/30', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', text: 'text-amber-400', btn: 'bg-amber-500 hover:bg-amber-400 text-black', bg: 'bg-amber-500/5', bubble: 'bg-amber-500/10 border-amber-500/20 text-amber-100' },
  blue: { border: 'border-blue-500/30', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30', text: 'text-blue-400', btn: 'bg-blue-500 hover:bg-blue-400 text-white', bg: 'bg-blue-500/5', bubble: 'bg-blue-500/10 border-blue-500/20 text-blue-100' },
  purple: { border: 'border-purple-500/30', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30', text: 'text-purple-400', btn: 'bg-purple-500 hover:bg-purple-400 text-white', bg: 'bg-purple-500/5', bubble: 'bg-purple-500/10 border-purple-500/20 text-purple-100' },
  emerald: { border: 'border-emerald-500/30', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', text: 'text-emerald-400', btn: 'bg-emerald-500 hover:bg-emerald-400 text-white', bg: 'bg-emerald-500/5', bubble: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100' },
};

function HermesPlayground({ onCTA }: { onCTA: () => void }) {
  const [selectedId, setSelectedId] = useState('real_estate');
  const [customCompany, setCustomCompany] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingMsg, setRemainingMsg] = useState<number | null>(10);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const industry = INDUSTRIES.find(i => i.id === selectedId) ?? INDUSTRIES[0]!;
  const c: ColorConfig = colorMap[industry.color] ?? colorMap['amber']!;

  // Reset conversation when industry changes
  useEffect(() => {
    setMessages(industry.conversation.map(m => ({ role: m.role as 'user' | 'agent', text: m.text })));
    setRateLimitError(null);
  }, [selectedId]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim() || isLoading) return;

    const userText = inputMsg.trim();
    setInputMsg('');
    setRateLimitError(null);

    // Add user message to history
    const updatedHistory = [...messages, { role: 'user' as const, text: userText }];
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      const companyName = customCompany.trim() || (selectedId === 'real_estate' ? "S'Narai Real Estate" : selectedId === 'auto' ? "BMW México" : selectedId === 'legal' ? "Legal Concierge" : "Centro Médico");
      
      const res = await fetch('/api/v1/hermes/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          industry: industry.label,
          userMessage: userText,
          history: updatedHistory.slice(-6).map(m => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.text }))
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setRateLimitError(data.message || 'Has alcanzado el límite diario de prueba en Sandbox (10 mensajes).');
          setRemainingMsg(0);
        } else {
          setMessages(prev => [...prev, { role: 'agent', text: `⚠️ Error de conexión en Sandbox: ${data.details || data.error || 'Error de servidor'}` }]);
        }
      } else {
        if (data.remaining !== undefined) setRemainingMsg(data.remaining);
        setMessages(prev => [...prev, { role: 'agent', text: data.response }]);
      }
    } catch (err) {
      console.error('[Sandbox Client Error]', err);
      setMessages(prev => [...prev, { role: 'agent', text: '⚠️ Error de red al comunicarse con Hermes Sandbox.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="sandbox" className="max-w-6xl mx-auto scroll-mt-24">
      <div className="text-center mb-12">
        <span className={`inline-flex items-center gap-2 text-xs font-mono px-4 py-1.5 rounded-full border mb-4 ${c.badge}`}>
          <Sparkles className="w-3.5 h-3.5" />
          Interactive Sandbox — Prueba a Hermes en Vivo
        </span>
        <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
          Interactúa con Hermes en <span className={`font-normal ${c.text}`}>tu empresa e industria</span>
        </h2>
        <p className="text-sm text-zinc-400 max-w-2xl mx-auto font-light">
          Escribe un mensaje real en la ventana de chat y comprueba cómo Hermes razona, califica y responde en tiempo real con Inteligencia Autónoma.
        </p>
      </div>

      {/* Industry & Custom Company Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        {INDUSTRIES.map(ind => {
          const ic: ColorConfig = colorMap[ind.color] ?? colorMap['amber']!;
          const active = ind.id === selectedId;
          return (
            <button
              key={ind.id}
              onClick={() => setSelectedId(ind.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-medium transition-all border ${active ? `${ic.btn} border-transparent shadow-lg` : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'}`}
            >
              {ind.label}
            </button>
          );
        })}
      </div>

      {/* Company Name Customizer Bar */}
      <div className="max-w-xl mx-auto mb-8 flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 p-2 rounded-2xl">
        <Building2 className="w-4 h-4 text-zinc-400 ml-2 flex-shrink-0" />
        <input
          type="text"
          placeholder="Personalizar Nombre de Tu Empresa (ej. Inmobiliaria Aztecas)"
          value={customCompany}
          onChange={(e) => setCustomCompany(e.target.value)}
          className="bg-transparent text-xs text-white placeholder-zinc-500 border-none outline-none flex-grow"
        />
        <span className="text-[10px] text-zinc-500 font-mono px-2 py-1 bg-zinc-800 rounded">
          Sandbox Mode
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className={`border rounded-3xl overflow-hidden ${c.border} ${c.bg}`}
        >
          {/* Agent Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border} bg-black/40`}>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${industry.color === 'amber' ? 'bg-amber-400' : industry.color === 'blue' ? 'bg-blue-400' : industry.color === 'purple' ? 'bg-purple-400' : 'bg-emerald-400'}`} />
              <span className="text-sm font-medium text-white">{customCompany.trim() ? `Hermes (${customCompany.trim()})` : industry.agentName}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${c.badge}`}>pack:{industry.pack}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                Límite Sandbox: {remainingMsg !== null ? `${remainingMsg}/10` : '10/10'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* Interactive Live Chat */}
            <div className="lg:col-span-2 p-6 flex flex-col justify-between h-[420px]">
              <div ref={chatRef} className="space-y-4 overflow-y-auto pr-2 flex-grow scrollbar-hide">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-zinc-800 text-zinc-200 rounded-br-sm'
                        : `border ${c.bubble} rounded-bl-sm`
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className={`px-4 py-3 rounded-2xl border ${c.bubble} rounded-bl-sm`}>
                      <span className="flex gap-1 items-center h-4">
                        <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${c.text}`} style={{ animationDelay: '0ms' }} />
                        <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${c.text}`} style={{ animationDelay: '150ms' }} />
                        <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${c.text}`} style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </motion.div>
                )}
                {rateLimitError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono">
                    ⚠️ {rateLimitError}
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe un mensaje de prueba para Hermes..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  disabled={isLoading || (remainingMsg !== null && remainingMsg <= 0)}
                  className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMsg.trim() || (remainingMsg !== null && remainingMsg <= 0)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${c.btn} disabled:opacity-50 flex items-center gap-1`}
                >
                  Enviar
                </button>
              </form>
            </div>

            {/* Capabilities Panel */}
            <div className={`border-t lg:border-t-0 lg:border-l ${c.border} p-6 bg-black/20 flex flex-col justify-between`}>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-4">Capabilities Activas en Sandbox</p>
                <div className="space-y-2 mb-6">
                  {['AI Autonomous Agents', 'CRM & Memory Engine', 'RAG Knowledge Pack', 'Omnichannel Dispatcher', 'SPEI / Web3 Commerce', 'Rate Limiter Guard'].map(cap => (
                    <div key={cap} className="flex items-center gap-2 text-xs text-white">
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] flex-shrink-0 ${c.badge}`}>
                        ✔
                      </span>
                      <span className="text-zinc-300 font-light">{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onCTA}
                className={`w-full py-3 rounded-2xl text-xs font-medium transition-all ${c.btn} shadow-lg mt-4`}
              >
                Instalar Hermes en Mi Empresa
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────── HERMES CORE FEATURES & VALUE MATRIX ───────────────────

export default function HermesEnterpriseLandingPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState('hermes_enterprise_landing');

  const handleOpenCTA = (source: string) => {
    setModalSource(source);
    setIsLeadModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-amber-500 selection:text-black font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-amber-500/10 via-indigo-500/5 to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-amber-500/5 blur-[180px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-light tracking-tight text-white">HERMES</span>
              <span className="text-xs text-amber-400 font-mono ml-2">AI Agent Infrastructure</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs text-zinc-400 font-light">
            <a href="#demo" className="hover:text-white transition-colors text-amber-400">Demo Live</a>
            <a href="#ecosystem" className="hover:text-white transition-colors">Ecosistema</a>
            <a href="#packs" className="hover:text-white transition-colors">Domain Packs</a>
            <a href="#whitelabel" className="hover:text-white transition-colors">White-Label Platform</a>
            <Link href="/media" className="hover:text-white transition-colors">Media Co</Link>
          </div>

          <Button 
            onClick={() => handleOpenCTA('hermes_nav_cta')}
            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/10"
          >
            Solicitar Enterprise Assessment
          </Button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto text-center">
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-4 py-1.5 rounded-full mb-8 font-mono inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pandoras Growth OS v7 — Enterprise AI Operating System</span>
        </Badge>

        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white max-w-5xl mx-auto leading-tight mb-8">
          El Sistema Operativo de IA donde <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent font-normal">cada interacción persigue metas de negocio</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-300 font-light max-w-3xl mx-auto mb-6 leading-relaxed">
          Instala Journeys, Playbooks ejecutables y agentes autónomos bajo tu marca sin tocar el Kernel.
        </p>

        <p className="text-sm md:text-base text-zinc-400 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
          Pandoras permite a desarrollos patrimoniales, protocolos y empresas de servicios operar con <strong>Referral Trust Journeys sin FOMO</strong>, calificar prospectos en tiempo real y ejecutar cierres SPEI y Web3 24/7.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 font-mono mb-12">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Intent Engine & Goal Recognizer</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Human-in-the-Loop Governance Queue</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Capability Registry & Outbox Execution OS</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            onClick={() => handleOpenCTA('hermes_hero_cta')}
            size="lg"
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Solicitar Enterprise Assessment (30 min)</span>
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Link
            href="/growth-os/hermes/portal"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-light transition-all flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Ingresar a Mi Portal de Gestor →</span>
          </Link>
        </div>

        {/* ENTERPRISE DASHBOARD & MULTI-AGENT VISUALIZATION */}
        <div className="relative border border-zinc-800/80 rounded-3xl bg-zinc-950/80 p-8 backdrop-blur-2xl shadow-2xl overflow-hidden max-w-5xl mx-auto text-left">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-zinc-400 ml-2">Pandoras Enterprise AI OS v7 — Multi-Tenant Control Plane</span>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">Kernel v6 Congelado · Journeys v7 Active</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Connected Agent 1 */}
            <div className="border border-zinc-800/60 rounded-2xl bg-zinc-900/40 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-xs font-medium text-white">Hermes Real Estate Concierge</h4>
                  <p className="text-[11px] text-amber-400 font-mono">Journey: patrimonial_investor_journey</p>
                </div>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px]">ONLINE</Badge>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3">Trust Journey de preservación patrimonial y agendamiento con fundadores.</p>
              <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-800/60 pt-2 flex justify-between">
                <span>Playbook: investor_v1</span>
                <span className="text-emerald-400">Objective: Meeting</span>
              </div>
            </div>

            {/* Connected Agent 2 */}
            <div className="border border-zinc-800/60 rounded-2xl bg-zinc-900/40 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-xs font-medium text-white">Hermes Sovereign (Educador Web3)</h4>
                  <p className="text-[11px] text-blue-400 font-mono">Journey: web3_sovereign_education</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px]">ONLINE</Badge>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3">Educación en soberanía digital, auto-custodia y agendamiento de workshops.</p>
              <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-800/60 pt-2 flex justify-between">
                <span>Playbook: sovereign_v1</span>
                <span className="text-emerald-400">Objective: Workshop</span>
              </div>
            </div>

            {/* Connected Agent 3 */}
            <div className="border border-zinc-800/60 rounded-2xl bg-zinc-900/40 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-xs font-medium text-white">Hermes Media Co (Atracción de Audiencia)</h4>
                  <p className="text-[11px] text-purple-400 font-mono">Journey: editorial_authority_journey</p>
                </div>
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[9px]">ONLINE</Badge>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3">Captación editorial, distribución de contenidos y atribución de conversión.</p>
              <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-800/60 pt-2 flex justify-between">
                <span>Playbook: media_co_v1</span>
                <span className="text-emerald-400">Objective: Subscribe</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── INTERACTIVE DEMO PLAYGROUND ─────────────────── */}
      <section id="demo" className="py-24 px-6 border-t border-zinc-800/80 bg-zinc-950/60">
        <HermesPlayground onCTA={() => handleOpenCTA('hermes_demo_cta')} />
      </section>

      {/* PARADIGM SHIFT SECTION */}
      <section className="py-20 px-6 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-light text-white mb-6">
            El futuro de las empresas no tendrá empleados digitales aislados. <br />
            <span className="text-amber-400 font-normal">Tendrá ecosistemas de agentes coordinados.</span>
          </h2>
          <p className="text-sm md:text-base text-zinc-400 max-w-3xl mx-auto mb-16 font-light">
            Las empresas están acumulando herramientas, canales y datos fragmentados. Hermes conecta todo en una sola capa inteligente:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
            {[
              { icon: MessageSquare, label: "Conversaciones", desc: "Omnicanalidad nativa" },
              { icon: Users, label: "CRM", desc: "Memory Engine relacional" },
              { icon: BarChart3, label: "Marketing & Ventas", desc: "Prospección autónoma" },
              { icon: FileText, label: "Documentos", desc: "Resource Engine & Nexus" },
              { icon: Zap, label: "Pagos & Reservas", desc: "Transaction Engine Web3/SPEI" },
              { icon: Workflow, label: "Operaciones", desc: "Workflows y misiones" },
            ].map((item, idx) => (
              <div key={idx} className="border border-zinc-800/60 rounded-2xl bg-zinc-900/30 p-5 flex items-start gap-4">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{item.label}</h4>
                  <p className="text-xs text-zinc-400 font-light">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT IS HERMES */}
      <section id="ecosystem" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-3 py-1 font-mono mb-4">Pandora's Growth OS — Hermes Runtime v7</Badge>
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">¿Qué es Hermes Runtime?</h2>
          <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto font-light">
            Hermes es el <strong>Runtime de Ejecución de Inteligencia Autónoma</strong> de Pandoras Growth OS. Un motor empresarial multi-tenant diseñado para crear, aprovisionar y operar agentes mediante un <strong>Command Center en 7 Studios</strong>, con un <strong>Execution OS basado en Outbox</strong>, <strong>Capability Registry</strong>, <strong>Intent Engine</strong> y <strong>Human-in-the-Loop Governance Queue</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-mono mb-4">01. Su propia marca</Badge>
            <h3 className="text-base font-medium text-white mb-2">Brand Engine</h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              El agente opera bajo la identidad visual, logo, tono y firma de comunicación de cada organización.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-mono mb-4">02. Sus propios procesos</Badge>
            <h3 className="text-base font-medium text-white mb-2">Workflows & Policies</h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Cada agente sigue workflows, reglas de cumplimiento y estrategias comerciales específicas.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-mono mb-4">03. Sus propios conocimientos</Badge>
            <h3 className="text-base font-medium text-white mb-2">Domain Packs</h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Cada empresa instala sus propios paquetes de dominio, documentos, productos y FAQs.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950/60 p-6">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-mono mb-4">04. Sus propios canales</Badge>
            <h3 className="text-base font-medium text-white mb-2">Omnicanalidad</h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Telegram, WhatsApp, Web Widget, Email, SMS, Voice AI y futuros adaptadores.
            </p>
          </div>
        </div>
      </section>

      {/* DOMAIN PACKS SECTION */}
      <section id="packs" className="py-24 px-6 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-3 py-1 font-mono mb-4">Capability Registry — Domain Packs</Badge>
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">Domain Packs & Capabilities</h2>
            <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto font-light">
              Cada industria instala su propio ecosistema de capacidades desde el Capability Registry. Activa canales, playbooks y lógica de cierre en un clic:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6">
              <Building2 className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="text-base font-medium text-white mb-2">Real Estate Pack</h3>
              <p className="text-xs text-zinc-400 font-light">
                Agentes para desarrollos inmobiliarios, ventas patrimoniales, tokenización y reservas SPEI.
              </p>
            </div>

            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6">
              <Zap className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-base font-medium text-white mb-2">Financial Pack</h3>
              <p className="text-xs text-zinc-400 font-light">
                Agentes para productos financieros, educación de inversiones y transacciones seguras.
              </p>
            </div>

            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6">
              <Cpu className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-base font-medium text-white mb-2">Enterprise Pack</h3>
              <p className="text-xs text-zinc-400 font-light">
                Agentes internos para compañías con procesos de operaciones, CRM y seguimiento personalizado.
              </p>
            </div>

            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6">
              <Sliders className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-base font-medium text-white mb-2">Custom Pack</h3>
              <p className="text-xs text-zinc-400 font-light">
                Crea un agente completamente adaptado a las reglas, documentos y herramientas de tu negocio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHITE-LABEL PLATFORM & TENANT ISOLATION */}
      <section id="whitelabel" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-3 py-1 font-mono mb-6">White Label Agent Platform</Badge>
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              Tu empresa no utiliza un software genérico. <br />
              <span className="text-amber-400 font-normal">Construye su propia infraestructura inteligente bajo su marca.</span>
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 h-fit">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Brand Layer</h4>
                  <p className="text-xs text-zinc-400 font-light">Nombre propio, logo, identidad visual, tono de comunicación y personalidad del agente.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 h-fit">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Tenant Isolation</h4>
                  <p className="text-xs text-zinc-400 font-light">Datos separados por organización (RLS), permisos independientes y seguridad multi-tenant.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 h-fit">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Agent Management</h4>
                  <p className="text-xs text-zinc-400 font-light">Crea múltiples agentes, asigna funciones, instala capacidades y administra todos tus canales de comunicación.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-zinc-800 rounded-3xl bg-zinc-950 p-8 relative">
            <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
              <span className="text-xs font-mono text-zinc-400">Agent Installer Workflow</span>
              <Badge className="bg-amber-500/10 text-amber-400 text-[10px] font-mono">AgentBlueprint</Badge>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-zinc-300">
                <span>1. Seleccionar Blueprint</span>
                <span className="text-emerald-400 font-bold">✓ Complete</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-zinc-300">
                <span>2. Inyectar Brand Configuration</span>
                <span className="text-emerald-400 font-bold">✓ Complete</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-zinc-300">
                <span>3. Cargar Domain Pack</span>
                <span className="text-emerald-400 font-bold">✓ Complete</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-zinc-300">
                <span>4. Asignar Tenant Policies</span>
                <span className="text-emerald-400 font-bold">✓ Complete</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-400">
                <span>5. Activar Omnichannel Runtime</span>
                <span className="animate-pulse">● Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-24 px-6 border-t border-zinc-800/80 bg-gradient-to-b from-zinc-950 to-[#070709] text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-4 py-1.5 rounded-full mb-8 font-mono">
            Pandoras Growth OS — Hermes Runtime v7
          </Badge>

          <h2 className="text-3xl md:text-5xl font-light text-white mb-8">
            Instala inteligencia operativa autónoma bajo tu marca.
          </h2>

          <p className="text-base md:text-lg text-zinc-400 font-light mb-12 max-w-2xl mx-auto">
            La próxima generación de compañías no tendrá herramientas desconectadas. Tendrá un sistema nervioso autónomo: agentes coordinados, Command Center operativo y Execution OS siempre activo. Hermes es esa infraestructura. Bajo tu marca. Con tus procesos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => handleOpenCTA('hermes_final_cta')}
              size="lg"
              className="bg-amber-500 hover:bg-amber-400 text-black font-medium text-base px-10 py-5 rounded-2xl shadow-xl shadow-amber-500/20 transition-all"
            >
              Solicitar Acceso a Hermes Runtime
            </Button>
            <Link
              href="/growth-os/hermes/sandbox"
              className="px-10 py-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-base font-light transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Probar Demo Sandbox
            </Link>
          </div>
        </div>
      </section>

      {/* Lead Capture Modal */}
      <GrowthOSLeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        tierName="Hermes Enterprise AI Infrastructure"
        source={modalSource}
      />
    </div>
  );
}
