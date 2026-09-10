"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Bot,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Send,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  Calendar,
  X,
  LucideIcon,
} from 'lucide-react';
import {
  SimulatorIndustry,
  SimulatorGoal,
  SIMULATOR_INDUSTRIES,
  resolveSafeDemoContext,
  HermesTrace,
  HermesTraceStep,
  HERMES_PORTAL_MODULES,
  SimulatedScenario,
} from '@/lib/hermes/simulator-types';
import { SalesDemoBuilderDrawer } from '@/components/hermes/SalesDemoBuilderDrawer';
import { PortalPreview } from '@/components/hermes-simulator/PortalPreview';

// Print-style icons per engine-trace layer (maps each layer to its real module)
const TRACE_ICONS: Record<HermesTraceStep['id'], LucideIcon> = {
  inbound: Bot,
  authority: ShieldCheck,
  intent: Sparkles,
  knowledge: Layers,
  governance: CheckCircle2,
  action: Zap,
};

// Agenda Soberana: el calendario propio de Pandoras (/schedule/pandoras), NO
// Calendly externo. Las reglas de disponibilidad (días/horarios) son editables
// desde el admin (CalendarManager). Same-origin para funcionar en staging y prod.
const AGENDA_1_1_URL = `${typeof window !== 'undefined' ? window.location.origin : 'https://dash.pandoras.finance'}/schedule/pandoras?type=strategy`;

// Minimal markdown-lite: renders **bold** while preserving the full text verbatim
// (the bot replies with markdown; plain pre-line would show literal asterisks).
function renderRichText(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.length > 4 && part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConversionPhase = 'start' | 'exploring' | 'interested' | 'converting';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
  intentDetected?: {
    type: string;
    label: string;
    confidence: string;
  };
}

// ---------------------------------------------------------------------------
// Progressive CTA copy — changes intensity as the session deepens
// ---------------------------------------------------------------------------

const CTA_COPY: Record<ConversionPhase, string> = {
  start: 'Prueba cómo funciona',
  exploring: 'Haz que Hermes conozca tu negocio',
  interested: 'Configura Hermes para tu negocio',
  converting: 'Quiero activar Hermes',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SimulatorClient() {
  const searchParams = useSearchParams();

  // 1. Resolve safe pre-tenant context from URL
  const demoContext = resolveSafeDemoContext({
    company: searchParams.get('company'),
    industry: searchParams.get('industry'),
    goal: searchParams.get('goal'),
    rep: searchParams.get('rep'),
    source: searchParams.get('source'),
  });

  const [companyName, setCompanyName] = useState(demoContext.company);
  const [industry, setIndustry] = useState<SimulatorIndustry>(demoContext.industry);
  const [goal, setGoal] = useState<SimulatorGoal>(demoContext.goal);
  const [attributionRep] = useState(demoContext.attributionRep);

  const activeConfig = SIMULATOR_INDUSTRIES[industry] || SIMULATOR_INDUSTRIES.general;

  // 2. Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
  const [isDemoBuilderOpen, setIsDemoBuilderOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [lastTrace, setLastTrace] = useState<HermesTrace | null>(null);

  // 3. Server-side RBAC gate for the Demo Builder drawer
  //    Defaults to false — only true after API confirms SUPER_ADMIN/ADMIN/OPERATOR
  const [isInternalStaff, setIsInternalStaff] = useState(false);

  useEffect(() => {
    fetch('/api/v1/hermes/simulator/staff-check', { method: 'GET', credentials: 'include' })
      .then((r) => r.json())
      .then((data: { isInternalStaff?: boolean }) => {
        setIsInternalStaff(data.isInternalStaff === true);
      })
      .catch(() => {
        setIsInternalStaff(false); // Fail-closed on any network error
      });
  }, []);

  // 4. Intent & conversion telemetry — real session data only, never fabricated
  const [detectedIntent, setDetectedIntent] = useState<{
    type: string;
    label: string;
    confidence: string;
  } | null>(null);
  const [sessionIntentCount, setSessionIntentCount] = useState(0);
  const [conversionPhase, setConversionPhase] = useState<ConversionPhase>('start');

  // Recap card: shown after 3+ user messages OR on first intent detection
  const [showRecap, setShowRecap] = useState(false);

  // Guided Demo Mode: sellers suppress auto-lead-modal during live calls
  const [guidedDemoMode, setGuidedDemoMode] = useState(false);

  // 5. Lead form state
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Personalized greeting — reset on industry/company change
  useEffect(() => {
    const cleanCompany = companyName !== 'Tu Negocio' ? companyName : 'tu empresa';
    const initialGreeting: ChatMessage = {
      id: 'initial-greeting',
      role: 'agent',
      text: `Hola, ${cleanCompany}. 👋\n\nSoy **${activeConfig.agentName}**, configurado para atender, calificar y convertir prospectos en **${activeConfig.label}**.\n\nPuedes hacerme preguntas como si fueras uno de tus clientes para ver cómo respondo en vivo.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([initialGreeting]);
    setShowRecap(false);
    setConversionPhase('start');
    setDetectedIntent(null);
    setSessionIntentCount(0);
    setLastTrace(null);
  }, [industry, companyName]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Scroll confinado AL CONTENEDOR del chat (overflow-y-auto). Nunca usamos
    // scrollIntoView aquí: ese API puede arrastrar también a los ancestros y
    // brinca la página a las secciones de abajo (Portal Preview). Con el ref
    // en el propio contenedor, escribir o interactuar no mueve el page scroll.
    const el = chatScrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading, lastTrace]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSendMessage = async (textToSend?: string) => {
    const msg = (textToSend || input).trim();
    if (!msg || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Count user turns before this send (for recap threshold)
    const userTurnsBefore = messages.filter((m) => m.role === 'user').length;

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    // Advance funnel phase on first real user interaction
    setConversionPhase((prev) => (prev === 'start' ? 'exploring' : prev));

    try {
      const res = await fetch('/api/v1/hermes/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          industry,
          goal,
          rep: attributionRep,
          userMessage: msg,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.intentDetected) {
          setDetectedIntent(data.intentDetected);
          setSessionIntentCount((n) => n + 1);
          setConversionPhase('interested');
          setShowRecap(true); // Immediately show recap on any intent detection
        }

        if (data.trace) {
          setLastTrace(data.trace);
        }

        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          intentDetected: data.intentDetected,
        };
        setMessages((prev) => [...prev, agentMsg]);

        // Fallback: show recap after 4+ user turns even if no intent yet
        if (userTurnsBefore + 1 >= 4 && !showRecap) {
          setShowRecap(true);
        }

        if (typeof data.remaining === 'number') {
          setRemainingMessages(data.remaining);
        }
      } else if (res.status === 429) {
        // In Guided Demo Mode the seller suppresses the modal to keep chat clean
        if (!guidedDemoMode) setIsLeadModalOpen(true);
      }
    } catch (err) {
      console.error('[Simulator error]:', err);
    } finally {
      setLoading(false);
    }
  };

  // Demo scenario injection from the Portal preview — deterministic, local-only.
  // Replays the money moments (close / appointment / escalate) through the SAME
  // intent paths the real sandbox API uses, WITHOUT burning the global LLM quota
  // or the per-IP trial budget (that stays reserved for real prospects).
  const handleSimulatedScenario = (scenario: SimulatedScenario) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userChat: ChatMessage = {
      id: `user-sim-${Date.now()}`,
      role: 'user',
      text: scenario.prompt,
      timestamp: now,
    };
    const agentChat: ChatMessage = {
      id: `agent-sim-${Date.now()}`,
      role: 'agent',
      text: scenario.reply,
      timestamp: now,
      intentDetected: scenario.intent ?? undefined,
    };

    setMessages((prev) => [...prev, userChat, agentChat]);
    setLastTrace(scenario.trace);

    if (scenario.intent) {
      setDetectedIntent(scenario.intent);
      setSessionIntentCount((n) => n + 1);
      setConversionPhase('interested');
      setShowRecap(true);
    } else {
      setConversionPhase((prev) => (prev === 'start' ? 'exploring' : prev));
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail) return;
    setLeadSubmitting(true);
    setLeadError(null);

    try {
      const res = await fetch('/api/v1/marketing/leads/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: leadEmail,
          name: leadName,
          company: companyName !== 'Tu Negocio' ? companyName : undefined,
          intent: 'explore',
          consent: true,
          metadata: {
            phone: leadPhone,
            source: 'hermes_simulator',
            industry,
            goal,
            attributionRep,
          },
        }),
      });

      if (res.ok) {
        setLeadSubmitted(true);
        setConversionPhase('converting');
      } else {
        const data = await res.json().catch(() => null);
        setLeadError(data?.message || data?.error || 'No se pudo registrar tu solicitud. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error('[Lead submit error]:', err);
      setLeadError('Error de conexión al registrar tu solicitud. Inténtalo de nuevo.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived UI values
  // ---------------------------------------------------------------------------

  const ctaCopy = CTA_COPY[conversionPhase];
  const cleanCompanyDisplay = companyName !== 'Tu Negocio' ? companyName : 'tu empresa';

  // Session-derived telemetry feeding the Portal preview (real data only)
  const userTurns = messages.filter((m) => m.role === 'user').length;
  const agentTurns = messages.length - userTurns;
  const previewMessages = messages.map((m) => ({
    role: m.role,
    text: m.text,
    timestamp: m.timestamp,
  }));

  // Off-hours closing scenario — illustrative narrative (not telemetry): always
  // frames a late-night prospect so the "24/7" value lands regardless of when
  // the demo happens. Uses real current minute so it feels alive.
  const lateNightTime = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const targetHour = hour >= 8 && hour < 20 ? 23 : hour;
    return new Date(now.setHours(targetHour, now.getMinutes(), 0, 0)).toLocaleTimeString(
      [],
      { hour: '2-digit', minute: '2-digit', hour12: true }
    );
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#07070B] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-purple-500/10 via-indigo-500/5 to-transparent blur-[140px] pointer-events-none" />

      {/* ── Top Header ────────────────────────────────────────────────── */}
      <header className="border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl h-16 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link href="/growth-os/hermes" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>HERMES SALES SIMULATOR</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  LIVE DEMO
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">Experiencia interactiva pre-tenant</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Demo Builder — RBAC-gated: SUPER_ADMIN / ADMIN / OPERATOR only */}
          {isInternalStaff && (
            <button
              onClick={() => setIsDemoBuilderOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Personalizar para Cliente</span>
            </button>
          )}

          {/* Progressive CTA — copy evolves with session depth */}
          <button
            onClick={() => setIsLeadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/20"
          >
            <span>{ctaCopy}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Rep Attribution Banner (only when link was shared by a seller) ── */}
      {attributionRep && (
        <div className="bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border-b border-purple-500/10 px-6 py-1.5 flex items-center gap-2 text-[10px] font-mono text-zinc-400 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span>Tu demo fue preparada para ti por</span>
          <span className="text-purple-300 font-bold">{attributionRep}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-500">Pandora&apos;s</span>
        </div>
      )}

      {/* ── Main Simulator Workspace ───────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 z-10">

        {/* Left Side: Context + Comparison */}
        <div className="lg:col-span-4 space-y-4">
          {/* Business Context Card */}
          <div className="bg-zinc-950/60 border border-white/10 rounded-2xl p-5 space-y-5 backdrop-blur-xl">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                Contexto de Demostración
              </span>
              <h2 className="text-base font-bold text-white mt-1">
                Personaliza la Simulación
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                Hermes adaptará su saludo y lógica de calificación para coincidir con tu vertical.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Nombre de tu Empresa
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej: Grupo Altius, BMW Polanco..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Vertical / Industria
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.values(SIMULATOR_INDUSTRIES).map((ind) => (
                    <button
                      key={ind.id}
                      onClick={() => setIndustry(ind.id)}
                      className={`px-3 py-2.5 rounded-xl border text-xs text-left font-medium flex items-center justify-between transition-all ${
                        industry === ind.id
                          ? 'bg-purple-500/10 border-purple-500/40 text-white shadow-sm'
                          : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/15'
                      }`}
                    >
                      <span>{ind.label}</span>
                      {industry === ind.id && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Simulator vs Real Comparison — shown after first intent detected */}
          {detectedIntent && (
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 text-xs space-y-3 backdrop-blur-xl">
              <div className="flex items-center gap-2 font-bold text-[11px] text-white">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Simulador vs Tu Instancia Real</span>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-3 gap-1 text-[9px] font-mono uppercase tracking-wider text-zinc-500 pb-1 border-b border-white/5">
                <span></span>
                <span className="text-center">Demo</span>
                <span className="text-center text-emerald-400">Real</span>
              </div>

              {[
                ['Conversaciones', 'Simuladas', 'Prospectos reales'],
                ['Catálogo', 'Ejemplo', 'Tu inventario'],
                ['Canales', 'Solo chat', 'WhatsApp · Web · TG'],
                ['Calificación', 'Visual', 'Pipeline + CRM'],
                ['Operación', 'En vivo', '24 / 7 auto'],
              ].map(([aspect, sim, real]) => (
                <div key={aspect} className="grid grid-cols-3 gap-1 text-[10px] py-0.5">
                  <span className="text-zinc-500 font-mono">{aspect}</span>
                  <span className="text-zinc-400 text-center">{sim}</span>
                  <span className="text-emerald-400 text-center font-medium">{real}</span>
                </div>
              ))}

              <p className="text-[10px] text-zinc-400 leading-relaxed border-t border-white/5 pt-2">
                Lo que probaste es la experiencia. La instancia real opera sobre{' '}
                <span className="text-white font-semibold">{cleanCompanyDisplay}</span>.
              </p>

              <button
                onClick={() => setIsLeadModalOpen(true)}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-mono font-bold flex items-center justify-center gap-2 transition-all"
              >
                <span>{ctaCopy}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Engine Trace — live proof of the real 5-layer Hermes OS pipeline */}
          {lastTrace && (
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 text-xs space-y-3 backdrop-blur-xl">
              <div className="flex items-center gap-2 font-bold text-[11px] text-white">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Esto es lo que Hermes acaba de hacer</span>
              </div>

              <div className="space-y-2">
                {lastTrace.steps.map((step) => {
                  const Icon = TRACE_ICONS[step.id] || Zap;
                  return (
                    <div key={step.id} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3 h-3" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-white">{step.module}</span>
                          <span className="text-[9px] text-zinc-500">·</span>
                          <span className="text-[9px] text-zinc-300">{step.step}</span>
                        </div>
                        <p className="text-[9px] text-zinc-500 leading-snug">{step.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Execution action — the ACTUAL selling point */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border border-purple-500/25">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-200 leading-snug">{lastTrace.actionLabel}</p>
                </div>
              </div>

              {/* Portal modules the demo proves */}
              <div className="border-t border-white/5 pt-2.5">
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Módulos del portal que se activarían para {cleanCompanyDisplay}
                </span>
                <div className="flex flex-wrap gap-1">
                  {HERMES_PORTAL_MODULES.map((mod) => (
                    <span
                      key={mod}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/10 text-zinc-400"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Safety callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/20 to-indigo-950/20 border border-purple-500/20 text-xs space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Simulación Segura y Sin Compromiso</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Esta prueba te permite evaluar el tono y la capacidad resolutiva de Hermes antes de integrar tus canales de WhatsApp o cargar tus manuales de venta.
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Chat Terminal */}
        <div className="lg:col-span-8 flex flex-col bg-[#0A0A10] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-md"
                style={{ background: `${activeConfig.accent}20`, border: `1px solid ${activeConfig.accent}40`, color: activeConfig.accent }}
              >
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{activeConfig.agentName}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-zinc-400">En línea · Asistente Comercial IA</p>
              </div>
            </div>

            {remainingMessages !== null && (
              <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                {remainingMessages} mensajes de prueba restantes
              </span>
            )}
          </div>

          {/* Messages Area */}
          <div ref={chatScrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 min-h-[380px] max-h-[480px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-purple-600/10'
                      : 'bg-white/[0.04] border border-white/10 text-zinc-200 rounded-bl-none'
                  }`}
                >
                  {renderRichText(msg.text)}
                </div>
                <span className="text-[9px] font-mono text-zinc-600 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs p-3">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="font-mono text-[11px]">Hermes está redactando respuesta...</span>
              </div>
            )}
          </div>

          {/* ── Intent Detection Badge + Inline CTA ───────────────────── */}
          {detectedIntent && (
            <div className="mx-4 mb-2 rounded-xl border border-purple-500/30 overflow-hidden">
              {/* Top row: intent signal */}
              <div className="p-3 bg-purple-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 block">
                      ✦ Intención Comercial Reconocida: {detectedIntent.label}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Hermes califica al prospecto en tiempo real y prioriza el seguimiento.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30 shrink-0 ml-2">
                  {detectedIntent.confidence}
                </span>
              </div>

              {/* Bottom row: inline conversion CTA */}
              <div className="px-3 py-2.5 bg-gradient-to-r from-purple-950/50 to-indigo-950/50 border-t border-purple-500/15 flex items-center gap-3">
                <p className="text-[10px] text-zinc-300 leading-tight flex-1">
                  ¿Quieres ver cómo funcionaría con tu catálogo y WhatsApp real?
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsLeadModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold font-mono flex items-center gap-1 transition-all whitespace-nowrap"
                  >
                    Configurar →
                  </button>
                  <a
                    href={AGENDA_1_1_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-[10px] font-mono flex items-center gap-1 transition-all whitespace-nowrap"
                  >
                    <Calendar className="w-3 h-3" />
                    Agenda 1:1
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ── Session Recap Card ─────────────────────────────────────── */}
          {showRecap && (
            <div className="mx-4 mb-2 p-3 rounded-xl bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-500/20 space-y-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                  Lo que Hermes hizo en esta demo
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  Conversó con tu prospecto
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  Respondió al instante
                </div>
                {sessionIntentCount > 0 ? (
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <span className="text-emerald-400 font-bold">✓</span>
                    Detectó {sessionIntentCount} intención{sessionIntentCount > 1 ? 'es' : ''} comercial{sessionIntentCount > 1 ? 'es' : ''}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span className="text-zinc-600 font-bold">○</span>
                    Listo para detectar intención comercial
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  Clasificó la oportunidad
                </div>
              </div>

              {/* Personalized closing narrative — "Imagina esto funcionando en X" */}
              <div className="p-3 rounded-xl bg-black/40 border border-purple-500/20 space-y-2.5">
                <h4 className="text-[11px] font-bold text-white">
                  Imagina esto funcionando en {cleanCompanyDisplay}.
                </h4>
                <p className="text-[10px] text-zinc-300 leading-relaxed">
                  Un prospecto escribe a las {lateNightTime}. Hermes responde al instante,
                  conoce tus servicios, identifica que está listo para comprar, lo califica
                  y lo envía a tu equipo comercial.{" "}
                  <span className="text-white font-semibold">Sin que nadie tenga que estar conectado.</span>
                </p>
                <p className="text-[10px] text-zinc-400 leading-relaxed border-t border-white/5 pt-2">
                  En una instancia real, esto continúa automáticamente: Hermes atiende → califica → registra → envía al pipeline → escala a humano cuando corresponde.
                </p>
                {lastTrace && (
                  <p className="text-[10px] text-purple-200 leading-relaxed border-t border-white/5 pt-2">
                    ⚡ Última acción del motor: <span className="font-semibold text-white">{lastTrace.actionLabel}</span>
                  </p>
                )}
                <button
                  onClick={() => setIsLeadModalOpen(true)}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-mono font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <span>Quiero esto para mi negocio</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* ── Quick Suggestion Pills ─────────────────────────────────── */}
          <div className="px-4 py-2 bg-white/[0.01] border-t border-white/5 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mr-1">
              Prueba preguntar:
            </span>
            {activeConfig.starterSuggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(suggestion)}
                disabled={loading}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-zinc-300 transition-colors cursor-pointer text-left"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* ── Message Input ──────────────────────────────────────────── */}
          <div className="p-3 bg-zinc-950 border-t border-white/5 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Escribe un mensaje para ${activeConfig.agentName}...`}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-purple-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* ── Hermes Portal Preview — replica del portal real (continuidad demo → pago) ── */}
      <PortalPreview
        key={`${companyName}|${industry}|${goal}`}
        companyName={companyName}
        industry={industry}
        goal={goal}
        phase={conversionPhase}
        userTurns={userTurns}
        agentTurns={agentTurns}
        sessionIntentCount={sessionIntentCount}
        detectedIntent={detectedIntent}
        lastTrace={lastTrace}
        messages={previewMessages}
        attributionRep={attributionRep}
        onScenario={handleSimulatedScenario}
      />

      {/* ── Internal Sales Demo Builder Drawer ────────────────────────── */}
      <SalesDemoBuilderDrawer
        currentCompany={companyName}
        currentIndustry={industry}
        currentGoal={goal}
        attributionRep={attributionRep}
        isOpen={isDemoBuilderOpen}
        onClose={() => setIsDemoBuilderOpen(false)}
        guidedDemoMode={guidedDemoMode}
        onGuidedModeChange={setGuidedDemoMode}
      />

      {/* ── Lead Capture Modal ─────────────────────────────────────────── */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0F0F16] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsLeadModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {leadSubmitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">¡Solicitud Recibida con Éxito!</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Un especialista comercial te contactará para cargar el catálogo y las respuestas oficiales de {cleanCompanyDisplay}.
                  </p>
                </div>
                <a
                  href={AGENDA_1_1_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agendar Sesión Técnica Directa</span>
                </a>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                    Instancia Dedicada
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    Activa Hermes para {cleanCompanyDisplay}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                    Conecta WhatsApp, carga tus documentos institucionales y pon a Hermes a cerrar ventas 24/7.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                      Tu Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Ej: Carlos Gómez"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      required
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="carlos@tuempresa.com"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                      WhatsApp / Teléfono
                    </label>
                    <input
                      type="tel"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="+52 55 1234 5678"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                {leadError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2 text-[10px] font-mono text-red-300 leading-relaxed">
                    {leadError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={leadSubmitting || !leadEmail}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {leadSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <span>Solicitar Acceso a Hermes OS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
