'use client';

/**
 * PortalPreview — Vista previa del Hermes Portal real dentro del simulador.
 *
 * Replica la identidad visual del portal (/portal/[slug]/*) para que un
 * prospecto que prueba el simulador no vea un salto de UX al pagar.
 *
 * Interactividad:
 *  1. Conversaciones clicables → detalle con perfil, decisión de Hermes y Escalar a humano.
 *  2. Knowledge explorable → vista previa de cada fuente de conocimiento.
 *  3. Nodos SystemCore clicables → mini-vista de cada módulo del portal.
 *  4. Switcher de rol (Prospecto / Equipo) → el equipo ve bandeja HITL + pipeline.
 *  5. Escenarios extra deterministas (compra / cita / escalado) sin quemar la cuota sandbox.
 *
 * TODO lo que reacciona a la sesión demo (nodos, tramas, KPIs, conversaciones, escalados)
 * deriva del estado REAL de la conversación. Las secciones etiquetadas como "Datos de
 * muestra" son placeholders ilustrativos del portal en producción.
 */

import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  GitBranch,
  MessageSquare,
  Fingerprint,
  Plug,
  Shield,
  Cpu,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  Bot,
  Zap,
  PhoneCall,
  Building2,
  Gauge,
  Clock,
  User,
  Inbox,
} from 'lucide-react';
import {
  SimulatorIndustry,
  SimulatorGoal,
  SIMULATOR_INDUSTRIES,
  HermesTrace,
  buildDemoScenario,
  SimulatedScenario,
} from '@/lib/hermes/simulator-types';
import type { LucideIcon } from 'lucide-react';

type Tab = 'overview' | 'knowledge' | 'journeys' | 'conversations' | 'inbox' | 'pipeline';
type ViewMode = 'prospect' | 'team';

interface PortalPreviewProps {
  companyName: string;
  industry: SimulatorIndustry;
  goal: SimulatorGoal;
  phase: 'start' | 'exploring' | 'interested' | 'converting';
  userTurns: number;
  agentTurns: number;
  sessionIntentCount: number;
  detectedIntent: { type: string; label: string; confidence: string } | null;
  lastTrace: HermesTrace | null;
  messages: { role: 'user' | 'agent'; text: string; timestamp: string }[];
  attributionRep?: string;
  onScenario?: (scenario: SimulatedScenario) => void;
}

interface PreviewMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

const PROSPECT_TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { id: 'journeys', label: 'Journeys', icon: GitBranch },
  { id: 'conversations', label: 'Conversaciones', icon: MessageSquare },
];

const TEAM_TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'inbox', label: 'Bandeja HITL', icon: Inbox },
  { id: 'pipeline', label: 'Pipeline', icon: Gauge },
  { id: 'conversations', label: 'Conversaciones', icon: MessageSquare },
];

const JOURNEY_STAGES: Record<SimulatorGoal, string[]> = {
  CLOSE_SALES: ['Contacto', 'Calificación', 'Intención', 'Cierre autónomo', 'Onboarding'],
  BOOK_APPOINTMENTS: ['Contacto', 'Intención de cita', 'Agenda', 'Confirmación', 'Recordatorio'],
  QUALIFY_LEADS: ['Contacto', 'Calificación', 'Clasificación', 'Escalado a humano', 'Pipeline'],
};

const MODULE_DETAILS: Record<
  string,
  { title: string; icon: LucideIcon; lines: string[] }
> = {
  identity: {
    title: 'Identity · Tono Institucional',
    icon: Fingerprint,
    lines: [
      'Tono: profesional, resolutivo, comercial sin ser agresivo.',
      'Persona: nombres y atributos institucionales de tu marca.',
      'Cero promesas fuera del catálogo cargado.',
    ],
  },
  knowledge: {
    title: 'Knowledge · Bóveda Soberana',
    icon: BookOpen,
    lines: [
      'Manual de venta y promesas autorizadas.',
      'Catálogo / inventario con precios verificados.',
      'Hechos firmados (evidence-backed claims).',
    ],
  },
  channels: {
    title: 'Channels · Canales Conectados',
    icon: Plug,
    lines: [
      'Web Widget — activo en esta demostración.',
      'WhatsApp — se conecta al activar tu instancia.',
      'Telegram / SMS — disponibles como extras.',
    ],
  },
  journeys: {
    title: 'Journeys · Embudos de Prospección',
    icon: GitBranch,
    lines: [
      'Un embudo activo por objetivo comercial.',
      'Avance automático según la intención del prospecto.',
      'Escalado a humano sin perder el contexto.',
    ],
  },
  governance: {
    title: 'Governance · Firewall Post-LLM',
    icon: Shield,
    lines: [
      'Prohibido inventar precios, disponibilidad o rendimiento.',
      'Respuestas auditadas antes de enviarse al prospecto.',
      'Normalización del vocabulario institucional.',
    ],
  },
  execution: {
    title: 'Execution · Kernel Cognitivo v1.0.4',
    icon: Cpu,
    lines: [
      'Pipeline de 5 capas: omnicanal → tenant → intent → knowledge → gobernanza.',
      'Acción final ejecutada según la intención detectada.',
      'Cierre autónomo, agendado o escalado a humano.',
    ],
  },
};

const NODE_CHIP_ACTIONS: Record<string, string> = {
  identity: 'Ver tono',
  knowledge: 'Ver fuentes',
  channels: 'Ver canales',
  journeys: 'Ver embudo',
  governance: 'Ver políticas',
  execution: 'Ver pipeline',
};

function journeyIndex(
  phase: PortalPreviewProps['phase'],
  lastTrace: HermesTrace | null
): number {
  if (lastTrace?.action === 'AUTONOMOUS_CLOSE') return 4;
  if (lastTrace?.action === 'ESCALATE_TO_HUMAN') return 3;
  if (lastTrace?.action === 'BOOK_APPOINTMENT') return 2;
  if (phase === 'converting') return 3;
  if (phase === 'interested') return 2;
  if (phase === 'exploring') return 1;
  return 0;
}

export function PortalPreview({
  companyName,
  industry,
  goal,
  phase,
  userTurns,
  agentTurns,
  sessionIntentCount,
  detectedIntent,
  lastTrace,
  messages,
  attributionRep,
  onScenario,
}: PortalPreviewProps) {
  const [tab, setTab] = React.useState<Tab>('overview');
  const [viewMode, setViewMode] = React.useState<ViewMode>('prospect');
  const [expanded, setExpanded] = React.useState<{ conv?: string; doc?: string; node?: string }>({});
  const [escalatedIds, setEscalatedIds] = React.useState<Set<string>>(new Set());
  const [teamTaken, setTeamTaken] = React.useState(false);
  const [scenarioNote, setScenarioNote] = React.useState<string | null>(null);

  const config = SIMULATOR_INDUSTRIES[industry] || SIMULATOR_INDUSTRIES.general;
  const hasActivity = userTurns + agentTurns > 0;
  const reached = journeyIndex(phase, lastTrace);
  const stages = JOURNEY_STAGES[goal] || JOURNEY_STAGES.QUALIFY_LEADS;

  const previewMessages: PreviewMessage[] = messages.map((m, i) => ({
    id: `msg-${i}`,
    role: m.role,
    text: m.text,
    timestamp: m.timestamp,
  }));
  const lastUserMsg = [...previewMessages].reverse().find((m) => m.role === 'user');
  const lastAgentMsg = [...previewMessages].reverse().find((m) => m.role === 'agent');
  const hasEscalation =
    lastTrace?.action === 'ESCALATE_TO_HUMAN' || previewMessages.some((m) => escalatedIds.has(m.id));

  const kpis = [
    { id: 'conversations', label: 'Conversaciones', value: userTurns + agentTurns, icon: MessageSquare },
    { id: 'intents', label: 'Intenciones', value: sessionIntentCount, icon: Zap },
    { id: 'journeys', label: 'Embudos activos', value: 1, icon: GitBranch },
    { id: 'channels', label: 'Canales', value: 3, icon: Plug },
  ];

  const nodes = [
    { id: 'identity', label: 'Identity', icon: Fingerprint, state: 'READY' },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen, state: hasActivity ? 'READY' : 'PENDING' },
    { id: 'channels', label: 'Channels', icon: Plug, state: 'READY' },
    { id: 'journeys', label: 'Journeys', icon: GitBranch, state: 'READY' },
    { id: 'governance', label: 'Governance', icon: Shield, state: 'READY' },
    { id: 'execution', label: 'Execution', icon: Cpu, state: 'READY' },
  ];

  const activityFeed = [
    ...(userTurns > 0
      ? [{ t: 'Nuevo mensaje de prospecto (web)', icon: MessageSquare as React.ComponentType<{ className?: string }> }]
      : []),
    ...(detectedIntent
      ? [{ t: `Intención detectada: ${detectedIntent.label} (${detectedIntent.confidence})`, icon: Zap }]
      : []),
    ...(lastTrace
      ? [{ t: `Acción ejecutada: ${lastTrace.actionLabel}`, icon: Bot }]
      : []),
  ].slice(0, 5);

  const activeTabs = viewMode === 'team' ? TEAM_TABS : PROSPECT_TABS;
  const activeTab: Tab = activeTabs.some((t) => t.id === tab) ? tab : activeTabs[0]!.id;

  const runScenario = (kind: SimulatedScenario['kind']) => {
    const scenario = buildDemoScenario({ kind, company: companyName, industry, goal });
    onScenario?.(scenario);
    setScenarioNote(
      kind === 'purchase'
        ? '🎬 Escenario inyectado: cierre autónomo — mira la traza y el embudo.'
        : kind === 'appointment'
          ? '🎬 Escenario inyectado: agendado automático.'
          : '🎬 Escenario inyectado: escalado a tu equipo (HITL).'
    );
    window.setTimeout(() => setScenarioNote(null), 4500);
  };

  const escaleConversation = (id: string) => {
    setEscalatedIds((prev) => new Set(prev).add(id));
  };

  const teamTakeControl = () => {
    setTeamTaken(true);
  };

  const setConvExpanded = (id: string) =>
    setExpanded((prev) => ({ ...prev, conv: prev.conv === id ? undefined : id }));
  const setDocExpanded = (id: string) =>
    setExpanded((prev) => ({ ...prev, doc: prev.doc === id ? undefined : id }));
  const setNodeExpanded = (id: string) =>
    setExpanded((prev) => ({ ...prev, node: prev.node === id ? undefined : id }));

  const cleanCompany = companyName !== 'Tu Negocio' ? companyName : 'tu empresa';
  const repLabel = attributionRep ? ` · atribuido a ${attributionRep}` : '';

  const renderKpiStrip = () => (
    <div className="flex flex-wrap items-center gap-4 py-3 px-5 rounded-2xl bg-[#09090C] border border-white/[0.04]">
      {kpis.map((k, i) => (
        <React.Fragment key={k.id}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/30">
              <k.icon size={14} />
            </div>
            <div>
              <div className="text-white font-medium leading-none">{k.value}</div>
              <div className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mt-1">{k.label}</div>
            </div>
          </div>
          {i < kpis.length - 1 && <div className="hidden sm:block w-px h-8 bg-white/[0.06] mx-4" />}
        </React.Fragment>
      ))}
    </div>
  );

  const renderNodes = () => {
    const expandedModule = expanded.node ? MODULE_DETAILS[expanded.node] : undefined;
    return (
    <div className="flex flex-col items-center justify-center py-8 px-6 rounded-2xl bg-gradient-to-b from-[#101018] via-[#0C0C12] to-[#09090E] border border-white/[0.06] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[200px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center text-center w-full">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles size={14} className="text-indigo-400" />
          <h2 className="text-white font-bold tracking-[0.25em] text-xs uppercase">HERMES COGNITIVE OS</h2>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border mb-6 bg-emerald-500/10 border-emerald-500/30">
          <span className="w-2 h-2 rounded-full animate-pulse bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-400">OPERATIONAL</span>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 w-full">
          {nodes.map((node) => {
            const ready = node.state === 'READY';
            const pending = node.state === 'PENDING';
            const Icon = node.icon;
            return (
              <button
                key={node.id}
                onClick={() => setNodeExpanded(node.id)}
                className={`flex flex-col items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                  ready
                    ? 'text-emerald-300 bg-emerald-500/[0.08] border-emerald-500/30 hover:border-emerald-400/60 hover:shadow-emerald-500/20 shadow-sm shadow-emerald-500/10'
                    : 'text-amber-300 bg-amber-500/[0.08] border-amber-500/30 hover:border-amber-400/60 hover:shadow-amber-500/20 shadow-sm shadow-amber-500/10'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-black/30 border border-white/5 flex items-center justify-center">
                  <Icon size={18} />
                </div>
                <div className="flex flex-col items-center text-center min-w-0">
                  <span className="text-white font-semibold text-xs truncate">{node.label}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${ready ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                    <span className={`text-[10px] font-mono font-medium uppercase ${ready ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {node.state}
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-white/40 mt-1">{NODE_CHIP_ACTIONS[node.id]}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Nodo expandido (module drill-down) ── */}
        {expandedModule && (() => {
          const ModIcon = expandedModule.icon;
          return (
            <div className="mt-5 w-full max-w-2xl rounded-xl bg-black/40 border border-white/[0.08] p-4 text-left">
              <div className="flex items-center gap-2 mb-2.5">
                <ModIcon size={14} className="text-purple-400" />
                <span className="text-xs font-bold text-white">{expandedModule.title}</span>
              </div>
              <ul className="space-y-1.5">
                {expandedModule.lines.map((line, i) => (
                  <li key={i} className="text-[11px] text-zinc-300 flex items-start gap-2">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="text-[9px] font-mono text-zinc-600 mt-2.5 border-t border-white/5 pt-2">
                Así se ve este módulo en tu portal cuando la instancia está activa.
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
  };

  const renderConversations = (teamView = false) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Conversaciones del prospecto</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {teamView
              ? 'Lo que tu equipo vería en el portal con takeover completo.'
              : 'Historias reales que Hermes está atendiendo ahora mismo.'}
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
          {hasEscalation ? '1 CON ESCALAMIENTO' : 'AUTONOMÍA TOTAL'}
        </span>
      </div>

      {previewMessages.length === 0 ? (
        <div className="rounded-xl bg-[#09090C] border border-white/[0.06] px-5 py-8 text-center text-xs text-zinc-600">
          {cleanCompany} no tiene prospectos aún. Prueba el chat o un escenario extra arriba. 👇
        </div>
      ) : (
        <div className="space-y-2">
          {previewMessages.slice(-6).map((m, i, arr) => {
            const latest = i === arr.length - 1;
            const escalated = escalatedIds.has(m.id);
            const isOpen = expanded.conv === m.id;
            return (
              <div key={m.id} className="overflow-hidden rounded-xl bg-[#09090C] border border-white/[0.06]">
                <button
                  onClick={() => setConvExpanded(m.id)}
                  className="w-full px-4 py-2.5 flex items-start gap-3 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      m.role === 'user' ? 'bg-white/[0.04] text-zinc-400' : 'bg-purple-500/10 text-purple-400'
                    }`}
                  >
                    <Bot size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                        {m.role === 'user' ? 'Prospecto · Web' : 'Hermes'}
                      </span>
                      {latest && <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">ACTIVA</span>}
                      {escalated && (
                        <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">ESCALADA A HUMANO</span>
                      )}
                      {m.role === 'agent' && detectedIntent && !escalated && (
                        <span className="text-[9px] font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">
                          {detectedIntent.label}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs text-zinc-300 ${isOpen ? '' : 'line-clamp-1'}`}>{m.text}</p>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600 shrink-0">{m.timestamp}</span>
                </button>

                {/* Detalle de la conversación (perfil, decisión de Hermes, escalar) */}
                {isOpen && m.role === 'agent' && (
                  <div className="px-5 pb-4 -mt-1 space-y-3 border-t border-white/5 pt-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded-xl bg-black/30 border border-white/[0.06] p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <User size={12} className="text-purple-400" />
                          <span className="text-[10px] font-mono font-bold text-white">Perfil del prospecto</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Llegó por <span className="text-white/80">Web Widget</span> · {lastAgentMsg?.timestamp || 'hoy'} ·{' '}
                          <span className="text-emerald-400">{detectedIntent ? 'intención comercial' : 'calificando'}</span>
                          {repLabel}
                        </p>
                      </div>
                      <div className="rounded-xl bg-black/30 border border-white/[0.06] p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Zap size={12} className="text-amber-400" />
                          <span className="text-[10px] font-mono font-bold text-white">Decisión de Hermes</span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          {lastTrace?.actionLabel || 'Sigue calificando al prospecto con preguntas de contexto.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {!escalated ? (
                        <button
                          onClick={() => escaleConversation(m.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold transition-all cursor-pointer"
                        >
                          <PhoneCall size={12} />
                          Escalar a humano
                        </button>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono">
                          <CheckCircle2 size={12} />
                          Escalada — el historial completo viajó con la conversación
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500">
                        En producción, este botón entrega el lead a tu vendedor con contexto completo (HITL).
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Banners de acción del motor (traza real) */}
      {lastTrace?.action === 'ESCALATE_TO_HUMAN' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 flex items-start gap-3">
          <Shield size={15} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-300">Escalada a tu equipo detectada en vivo</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Hermes la priorizó con SLA y contexto. Mira la Bandeja HITL con el switcher <span className="text-white/70">Equipo</span>.
            </p>
          </div>
        </div>
      )}

      {lastTrace?.action === 'AUTONOMOUS_CLOSE' && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3 flex items-start gap-3">
          <Zap size={15} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-emerald-300">Cierre autónomo en curso</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Señal de compra validada → link de pago SPEI/Web3 → registro automático en pipeline. Sin intervención humana.
            </p>
          </div>
        </div>
      )}

      {!teamView && (
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600">
          <ArrowUpRight size={12} className="text-purple-400" />
          Así se ve tu bandeja real al conectar WhatsApp, Telegram y Web.
        </div>
      )}
    </div>
  );

  const renderInbox = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Bandeja de escalamientos (HITL)</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Lo que Hermes te entrega cuando un prospecto pide persona.{repLabel}
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          SLA · 5 MIN
        </span>
      </div>

      {hasEscalation ? (
        <div className="space-y-2">
          {previewMessages.length > 0 && (
            <div className="rounded-xl bg-[#09090C] border border-amber-500/20 overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <PhoneCall size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">Prospecto · {cleanCompany}</span>
                    <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">PRIORIDAD ALTA</span>
                    <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                      <Clock size={10} /> expira en 4:12
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                    {lastUserMsg?.text || 'Quiero hablar con una persona.'}
                  </p>
                </div>
              </div>
              <div className="px-4 py-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={teamTakeControl}
                  disabled={teamTaken}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white text-[10px] font-mono font-bold transition-all disabled:opacity-50 cursor-pointer disabled:cursor-default"
                >
                  <Building2 size={12} />
                  {teamTaken ? 'Conversación tomada ✓' : 'Tomar control'}
                </button>
                <span className="text-[10px] text-zinc-500">Recibes el historial, intención y datos de contacto completos.</span>
              </div>
            </div>
          )}
          <p className="text-[10px] text-zinc-600 leading-relaxed px-1">
            Cuando un vendedor está tomando la conversación, Hermes pausa su autonomía en ese hilo y te cede el
            micrófono sin fricción.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-[#09090C] border border-white/[0.06] px-5 py-8 text-center text-xs text-zinc-600">
          <Inbox size={20} className="mx-auto mb-3 text-zinc-700" />
          <p className="font-semibold text-zinc-400">0 escalamientos pendientes</p>
          <p className="mt-1 leading-relaxed">
            Hermes está atendiendo todo en autonomía. Cuando un prospecto pida persona (o tu política lo disponga),
            la conversación aterriza aquí con contexto completo.
          </p>
        </div>
      )}
    </div>
  );

  const renderPipeline = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-white">Pipeline comercial en vivo</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Progreso de la demostración dentro del embudo objetivo · {goal}{repLabel}
        </p>
      </div>

      {renderKpiStrip()}

      <div className="space-y-2">
        {stages.map((stage, i) => {
          const done = i < reached;
          const current = i === reached;
          const pct = Math.round(((i + 1) / stages.length) * 100);
          return (
            <div
              key={stage}
              className={`rounded-xl border px-4 py-3 transition-all ${
                current
                  ? 'bg-purple-500/[0.08] border-purple-500/40 shadow-sm shadow-purple-500/10'
                  : done
                    ? 'bg-emerald-500/[0.05] border-emerald-500/20'
                    : 'bg-[#09090C] border-white/[0.06] opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                    done ? 'bg-emerald-500/20 text-emerald-400' : current ? 'bg-purple-600 text-white' : 'bg-white/5 text-zinc-600'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white">{stage}</div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${done ? 'bg-emerald-500/70' : current ? 'bg-purple-500 animate-pulse' : ''}`}
                      style={{ width: `${done || current ? pct : 0}%` }}
                    />
                  </div>
                </div>
                {current && <span className="text-[9px] font-mono text-purple-400 shrink-0">AHORA</span>}
                {done && <span className="text-[9px] font-mono text-emerald-500 shrink-0">SUPERADO</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {['Escalado a humano', 'Recordatorios', 'Atribución por vendedor', 'Cierre autónomo', 'Registro en CRM'].map((chip) => (
          <span key={chip} className="text-[10px] font-mono px-2 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-zinc-400">
            {chip}
          </span>
        ))}
      </div>
    </div>
  );

  const knowledgeDocs = [
    { id: 'manual', title: 'Manual de venta', desc: 'Pitch autorizado y respuestas oficiales', state: hasActivity ? 'READY' : 'PENDING' },
    { id: 'catalog', title: `Catálogo ${config.label}`, desc: 'Inventario / servicios y oferta', state: 'PENDING' },
    { id: 'pricing', title: 'Precios y condiciones', desc: 'Tabla de precios verificada', state: 'PENDING' },
    { id: 'facts', title: 'Hechos verificados firmados', desc: 'Evidence-backed claims (EIP-712)', state: 'READY' },
  ];

  const renderKnowledge = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Bóveda soberana de conocimiento</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Lo que Hermes usa para responder con precisión. Clic en cada fuente para ver su vista previa de demo.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {knowledgeDocs.map((card) => {
          const isDocOpen = expanded.doc === card.id;
          const ready = card.state === 'READY';
          return (
            <div key={card.id} className="overflow-hidden rounded-xl bg-[#09090C] border border-white/[0.06]">
              <button
                onClick={() => setDocExpanded(card.id)}
                className="w-full p-4 flex items-start gap-3 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    ready
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                  }`}
                >
                  {ready ? <CheckCircle2 size={15} /> : <span className="text-[10px] font-mono">…</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    {card.title}
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        ready ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {card.state}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{card.desc}</p>
                </div>
              </button>

              {isDocOpen && (
                <div className="px-4 pb-4 space-y-2.5 border-t border-white/5 pt-3">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                    Vista previa del documento
                  </p>
                  <ul className="space-y-1.5">
                    {card.id === 'manual' &&
                      ['Pitch autorizado: valor y diferenciación de ' + cleanCompany + '.', 'Objeción de precio (guion y tono).', 'Compromisos permitidos y no permitidos.'].map((line) => (
                        <PreviewLine key={line} line={line} />
                      ))}
                    {card.id === 'catalog' &&
                      ['Unidades / servicios de la vertical ' + config.label + '.', 'Disponibilidad en tiempo real (en producción).', 'Categorías y ofertas vigentes.'].map((line) => (
                        <PreviewLine key={line} line={line} />
                      ))}
                    {card.id === 'pricing' &&
                      ['Lista de precios verificada por ' + cleanCompany + '.', 'Condiciones de pago SPEI / Web3.', 'Promos y descuentos solo si están cargados.'].map((line) => (
                        <PreviewLine key={line} line={line} />
                      ))}
                    {card.id === 'facts' &&
                      ['Cada afirmación firmada (EIP-712).', 'El firewall bloquea respuestas no respaldadas.', 'Traza de auditoría accesible por tu equipo.'].map((line) => (
                        <PreviewLine key={line} line={line} />
                      ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-zinc-600 leading-relaxed">
        💡 Al activar tu instancia, el firewall de gobernanza bloquea respuestas no respaldadas por estos documentos:
        cero alucinaciones comerciales.
      </p>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      {/* Banner de contexto + rol switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span>
            Vista previa del Portal Hermes —{' '}
            <span className="text-indigo-300 font-bold">{cleanCompany}</span> ({config.label}) · goal{' '}
            <span className="text-zinc-300">{goal}</span>
          </span>
        </div>

        {/* Role switcher: prospect / team */}
        <div className="sm:ml-auto flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/10">
          <button
            onClick={() => setViewMode('prospect')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
              viewMode === 'prospect'
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            <Bot size={12} />
            Ver como Prospecto
          </button>
          <button
            onClick={() => setViewMode('team')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
              viewMode === 'team'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            <Building2 size={12} />
            Ver como Equipo
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-[#0C0C12] border border-white/[0.08] overflow-hidden">
        {/* Header del portal preview */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08] bg-[#09090C]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-md">
            <span className="text-white text-xs font-bold">H</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-white truncate">
              {cleanCompany.charAt(0).toUpperCase() + cleanCompany.slice(1)} ·{' '}
              {viewMode === 'team' ? 'Consola del equipo' : 'Portal Preview'}
            </p>
            <p className="text-[10px] text-zinc-400 font-mono">Hermes AI OS · Portal Preview</p>
          </div>

          <div className="ml-auto flex items-center gap-1 overflow-x-auto">
            {activeTabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'text-purple-300 bg-purple-500/10 border border-purple-500/30'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toast de escenario inyectado */}
        {scenarioNote && (
          <div className="px-5 pt-4">
            <div className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/[0.08] px-4 py-2.5 text-[11px] text-indigo-200">
              <Zap size={13} className="text-indigo-400 shrink-0" />
              {scenarioNote}
              <span className="ml-auto text-[9px] font-mono text-indigo-400/60">DEMO · NO QUEMA CUOTA</span>
            </div>
          </div>
        )}

        <div className="p-5">
          {/* ── PROSPECT: Overview ─────────────────────────────────────── */}
          {viewMode === 'prospect' && activeTab === 'overview' && (
            <div className="space-y-6">
              {renderNodes()}
              {renderKpiStrip()}
              <div className="rounded-2xl bg-[#09090C] border border-white/[0.06] divide-y divide-white/[0.04]">
                <div className="px-5 py-3 flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/60">Actividad en vivo</span>
                  <span className="text-[9px] font-mono text-zinc-600">(de esta demostración)</span>
                </div>
                {activityFeed.length === 0 ? (
                  <div className="px-5 py-6 text-center text-xs text-zinc-600">
                    Interactúa con el chat o dispara un escenario extra para ver el motor trabajar en tiempo real.
                  </div>
                ) : (
                  activityFeed.map((e, i) => (
                    <div key={i} className="px-5 py-2.5 flex items-center gap-3 text-xs">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
                        <e.icon size={13} />
                      </div>
                      <span className="text-zinc-300">{e.t}</span>
                      <span className="ml-auto text-[10px] font-mono text-purple-400/60">AHORA</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── PROSPECT: Knowledge ────────────────────────────────────── */}
          {viewMode === 'prospect' && activeTab === 'knowledge' && renderKnowledge()}

          {/* ── PROSPECT: Journeys ─────────────────────────────────────── */}
          {viewMode === 'prospect' && activeTab === 'journeys' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Embudo comercial activo</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">El viaje que Hermes está ejecutando ahora mismo en tu demo.</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  ● ACTIVO
                </span>
              </div>
              <div className="space-y-2">
                {stages.map((stage, i) => {
                  const done = i < reached;
                  const current = i === reached;
                  return (
                    <div
                      key={stage}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                        current
                          ? 'bg-purple-500/[0.08] border-purple-500/40 shadow-sm shadow-purple-500/10'
                          : done
                            ? 'bg-emerald-500/[0.05] border-emerald-500/20'
                            : 'bg-[#09090C] border-white/[0.06] opacity-60'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                          done ? 'bg-emerald-500/20 text-emerald-400' : current ? 'bg-purple-600 text-white' : 'bg-white/5 text-zinc-600'
                        }`}
                      >
                        {done ? '✓' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white">{stage}</div>
                        <div className="text-[10px] text-zinc-500">
                          {i === 3 && goal === 'CLOSE_SALES'
                            ? 'En producción: link de pago SPEI o Web3 generado en el chat'
                            : i === 3 && goal === 'QUALIFY_LEADS'
                              ? 'Hermes escala a tu equipo con contexto completo (HITL)'
                              : i === 2 && goal === 'BOOK_APPOINTMENTS'
                                ? 'Slot propuesto y confirmado automáticamente'
                                : 'Hermes avanza al prospecto sin intervención humana'}
                        </div>
                      </div>
                      {current && <span className="text-[9px] font-mono text-purple-400 shrink-0">AHORA</span>}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {['Escalado a humano', 'Recordatorios', 'Atribución por vendedor', 'Cierre autónomo'].map((chip) => (
                  <span key={chip} className="text-[10px] font-mono px-2 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-zinc-400">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Conversations (both modes) ─────────────────────────────── */}
          {activeTab === 'conversations' && renderConversations(viewMode === 'team')}

          {/* ── TEAM: Inbox ────────────────────────────────────────────── */}
          {viewMode === 'team' && activeTab === 'inbox' && renderInbox()}

          {/* ── TEAM: Pipeline ─────────────────────────────────────────── */}
          {viewMode === 'team' && activeTab === 'pipeline' && renderPipeline()}
        </div>

        {/* ── Scenario runner (extra demos, deterministic) ─────────────── */}
        {viewMode === 'prospect' && (
          <div className="px-5 pb-5">
            <div className="rounded-2xl bg-[#09090C] border border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2 mb-2.5">
                <Zap size={13} className="text-amber-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                  Simula un escenario extra
                </span>
                <span className="text-[9px] font-mono text-zinc-600">
                  — los tres momentos que te venden solos
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => runScenario('purchase')}
                  disabled={!onScenario}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold transition-all cursor-pointer disabled:opacity-40"
                >
                  💳 Compra instantánea
                </button>
                <button
                  onClick={() => runScenario('appointment')}
                  disabled={!onScenario}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono font-bold transition-all cursor-pointer disabled:opacity-40"
                >
                  📅 Agenda automática
                </button>
                <button
                  onClick={() => runScenario('escalate')}
                  disabled={!onScenario}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold transition-all cursor-pointer disabled:opacity-40"
                >
                  🙋 Escalar a humano
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewLine({ line }: { line: string }) {
  return (
    <li className="text-[11px] text-zinc-300 flex items-start gap-2">
      <span className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 shrink-0" />
      {line}
    </li>
  );
}