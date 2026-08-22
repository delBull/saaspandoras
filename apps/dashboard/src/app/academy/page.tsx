'use client';

/**
 * 🎓 Pandora's Academy — Public Presentation & Enterprise Perks Landing Page
 * apps/dashboard/src/app/academy/page.tsx
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Coins,
  Cpu,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Play,
  FileCode,
  Layers,
  BookOpen,
  Sword,
  Share2,
  ExternalLink,
  ChevronRight,
  Users,
  Building,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

export default function AcademyPublicLanding() {
  const [activeTab, setActiveTab] = useState<'PROGRAMS' | 'PERKS' | 'ENTERPRISE'>('PROGRAMS');

  const tracks = [
    {
      role: 'COO',
      title: 'Chief Operating Officer (COO)',
      code: 'COO_EXECUTIVE_V2',
      badge: 'Tier 1 · Executive Clearance',
      badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
      icon: ShieldCheck,
      desc: 'Blindaje multi-entidad (Holding Wyoming, SPVs, OpCos), gobernanza multi-firma, estándar PAS v1.0 y Legal Engineering en Nexus Deal Rooms.',
      modulesCount: 10,
      passingScore: 80,
      demoToken: 'inv_coo_carlos_demo'
    },
    {
      role: 'CMO',
      title: 'Chief Marketing Officer (CMO)',
      code: 'CMO_EXECUTIVE_V1',
      badge: 'Tier 2 · Growth Clearance',
      badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
      icon: TrendingUp,
      desc: 'Pandoras Media Co, loops de distribución viral, embudos agénticos en WhatsApp, protección de marca IMPI (Clases 36/42) y retención anti-Sybil.',
      modulesCount: 5,
      passingScore: 80,
      demoToken: 'inv_cmo_sofia_demo'
    },
    {
      role: 'CFO',
      title: 'Chief Financial Officer (CFO)',
      code: 'CFO_EXECUTIVE_V1',
      badge: 'Tier 1 · Financial Clearance',
      badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
      icon: Coins,
      desc: 'Bóvedas fiduciarias PAS v1.0 con colateral 1:1, Pandora Buyback Pool & cálculo de NAV, Safe-Stops 3/5 y dispersión pro-rata en USDC.',
      modulesCount: 5,
      passingScore: 80,
      demoToken: 'inv_cfo_alejandro_demo'
    },
    {
      role: 'HERMES_OPERATOR',
      title: 'Hermes AI Kernel Operator',
      code: 'HERMES_OPERATOR_V1',
      badge: 'Tier 3 · Technical Clearance',
      badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
      icon: Cpu,
      desc: 'Event Spine multicanal, aislamiento multi-tenant con ExecutiveScopeValidator, sandboxing de tool calling y compilación de prompts en capas.',
      modulesCount: 5,
      passingScore: 80,
      demoToken: 'inv_hermes_operator_demo'
    }
  ];

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-100 font-sans selection:bg-purple-500/30">
      
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-purple-600/10 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 left-10 w-[500px] h-[400px] bg-emerald-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-[600px] h-[500px] bg-blue-600/5 blur-[130px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-16">
        
        {/* Top Navbar */}
        <header className="flex items-center justify-between p-4 md:p-5 rounded-2xl bg-[#0C0C10]/80 backdrop-blur-md border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.06)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 font-bold">
                PANDORA'S GROWTH OS
              </span>
              <h1 className="text-base md:text-lg font-bold text-white leading-tight">
                Pandora's Academy
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/nexus"
              className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono text-zinc-300 transition-colors"
            >
              NEXUS HUB
            </Link>
            <Link
              href="/admin/academy"
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs font-mono transition-colors"
            >
              CONSOLA ADMIN
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-4xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INSTITUTIONAL CONTROL PLANE & SOULBOUND ACCREDITATION</span>
          </div>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight md:leading-[1.15]">
            Certificación Ejecutiva y Reputación On-Chain para la <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">Economía RWA</span>
          </h2>

          <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Evaluación socrática continua, gobernanza determinista y credenciales Soulbound (ERC-5192) que acreditan a la directiva de la siguiente generación de proyectos descentralizados.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <a
              href="/academy/assessment/inv_coo_carlos_demo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-500 hover:bg-purple-400 text-black font-bold text-xs md:text-sm font-mono uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-black" />
              PROBAR EXAMEN SOCRÁTICO (COO)
            </a>
            <Link
              href="/academy/verify/cert_demo_executive"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/15 hover:bg-white/10 text-white font-semibold text-xs md:text-sm font-mono transition-all"
            >
              <Award className="w-4 h-4 text-purple-400" />
              VER CREDENCIAL SOULBOUND EJEMPLO
            </Link>
          </div>
        </section>

        {/* Feature Pills */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-2">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Evaluador Hermes AI</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Exámenes dinámicos con casos reales y rúbricas deterministas de 100 puntos.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-2">
            <Award className="w-6 h-6 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Soulbound ERC-5192</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Insignias intransferibles atadas permanentemente a la wallet del candidato.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-2">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Obsidian Library</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Desbloqueo inmediato de SOPs, contratos de Wyoming y modelos financieros.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-2">
            <Sword className="w-6 h-6 text-blue-400" />
            <h3 className="text-sm font-bold text-white">War Room Simulator</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Entrenamiento de crisis en vivo con adversarios simulados por IA.
            </p>
          </div>
        </section>

        {/* ─── MAIN SECTION TABS ─────────────────────────────────────────────── */}
        <section className="space-y-8">
          <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-[#0C0C10] border border-white/10 max-w-xl mx-auto">
            <button
              onClick={() => setActiveTab('PROGRAMS')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
                activeTab === 'PROGRAMS'
                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              1. TRACKS EJECUTIVOS
            </button>
            <button
              onClick={() => setActiveTab('PERKS')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
                activeTab === 'PERKS'
                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              2. PERKS & RECOMPENSAS
            </button>
            <button
              onClick={() => setActiveTab('ENTERPRISE')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
                activeTab === 'ENTERPRISE'
                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              3. B2B WHITELABEL & ESCALA
            </button>
          </div>

          {/* TAB 1: TRACKS OVERVIEW */}
          {activeTab === 'PROGRAMS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tracks.map((t) => {
                const Icon = t.icon;
                return (
                  <div
                    key={t.role}
                    className="p-6 md:p-8 rounded-3xl bg-[#0C0C10] border border-white/10 space-y-5 hover:border-purple-500/40 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-bold border ${t.badgeColor}`}>
                          {t.badge}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">{t.code}</span>
                        <h3 className="text-xl font-bold text-white">{t.title}</h3>
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed">{t.desc}</p>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono text-zinc-400">
                        <span>• {t.modulesCount} Módulos Socráticos</span>
                        <span className="text-purple-300">• Aprobación ≥{t.passingScore}%</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                      <a
                        href={`/academy/assessment/${t.demoToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                      >
                        INICIAR TEST DE PRUEBA <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: PERKS & REWARDS TREE */}
          {activeTab === 'PERKS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 md:p-8 rounded-3xl bg-[#0C0C10] border border-purple-500/30 space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.1)]">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded text-[10px] font-mono uppercase bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                    NIVEL 1 · DESBLOQUEO INMEDIATO
                  </span>
                  <BookOpen className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">The Obsidian Library (SOPs & Blueprints)</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Acceso exclusivo a contratos operativos, templates de holding de Wyoming, playbooks de distribución viral de Pandora's Media Co y especificaciones del runtime de Hermes.
                </p>
                <ul className="space-y-1.5 text-xs font-mono text-zinc-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Contratos de Subordinación de IP
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Modelos Financieros del Buyback Pool
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Librería de Prompts de Hermes
                  </li>
                </ul>
              </div>

              <div className="p-6 md:p-8 rounded-3xl bg-[#0C0C10] border border-purple-500/30 space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.1)]">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded text-[10px] font-mono uppercase bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                    NIVEL 2 · SIMULADOR EN VIVO
                  </span>
                  <Sword className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Hermes Socratic War Room Simulator</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Entrena tu comando directivo contra situaciones extremas. Hermes simulará reguladores hostiles, demandas de proveedores o ataques de FUD evaluando tu templanza en tiempo real.
                </p>
                <ul className="space-y-1.5 text-xs font-mono text-zinc-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Simulación de Consejo de Administración
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Gestión de Crisis de FUD & Prensa
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Dictamen socrático instantáneo
                  </li>
                </ul>
              </div>

              <div className="p-6 md:p-8 rounded-3xl bg-black/40 border border-white/5 space-y-3 opacity-60">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded text-[10px] font-mono uppercase bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                    NIVEL 3 · PRÓXIMAMENTE
                  </span>
                  <Lock className="w-5 h-5 text-zinc-500" />
                </div>
                <h3 className="text-lg font-bold text-zinc-400">Pase VIP a Deal Rooms Institucionales (&gt;$500k)</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Acceso directo sin precalificación manual a salas de asignación de capital institucional para proyectos Tier-1.
                </p>
              </div>

              <div className="p-6 md:p-8 rounded-3xl bg-black/40 border border-white/5 space-y-3 opacity-60">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded text-[10px] font-mono uppercase bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold">
                    NIVEL 4 · PRÓXIMAMENTE
                  </span>
                  <Lock className="w-5 h-5 text-zinc-500" />
                </div>
                <h3 className="text-lg font-bold text-zinc-400">Multiplicadores PBOX Rep (+5,000 Puntos)</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Incremento en el factor de distribución pro-rata de rendimientos y comisiones por colocación de activos.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: B2B ENTERPRISE WHITELABEL */}
          {activeTab === 'ENTERPRISE' && (
            <div className="p-6 md:p-10 rounded-3xl bg-[#0C0C10] border border-white/15 space-y-8">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded text-[10px] font-mono uppercase bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                  SOLUCIONES B2B & PARTNERS
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  Whitelabel Academy-as-a-Service para Proyectos RWA
                </h3>
                <p className="text-xs md:text-sm text-zinc-400 max-w-3xl leading-relaxed">
                  ¿Eres un desarrollador inmobiliario, emisor de activos o fondo de inversión? Despliega tu propia academia socrática con IA para capacitar y certificar a tus brokers, embajadores y directivos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                  <Building className="w-6 h-6 text-purple-400" />
                  <h4 className="text-sm font-bold text-white">Academias Personalizadas</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Sube tus propios prospectos de inversión y manuales de producto. Hermes evaluará a tu equipo comercial con tus reglas de negocio.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                  <KeyRound className="w-6 h-6 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">API B2B de Verificación</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Endpoints para validar en tiempo real si un firmante o asesor cuenta con la credencial activa antes de otorgarle permisos.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                  <Users className="w-6 h-6 text-blue-400" />
                  <h4 className="text-sm font-bold text-white">Directorio de Talento Verificado</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Recluta directores de operaciones (COO), finanzas (CFO) y marketing (CMO) certificados bajo el estándar PAS v1.0.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">¿Quieres implementar Academy en tu empresa?</h4>
                  <p className="text-xs text-zinc-400">Contáctanos para configurar tu instancia whitelabel de Hermes Socratic Engine.</p>
                </div>
                <a
                  href="mailto:institutional@pandoras.finance?subject=Solicitud%20Whitelabel%20Academy%20B2B"
                  className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-bold text-xs font-mono uppercase tracking-wider shrink-0 transition-colors"
                >
                  SOLICITAR DEMO B2B
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <p>© 2026 Pandora's Growth OS · Institutional Control Plane</p>
          <div className="flex items-center gap-4">
            <Link href="/nexus" className="hover:text-zinc-300">Nexus Hub</Link>
            <Link href="/admin/academy" className="hover:text-zinc-300">Consola Admin</Link>
            <a href="https://pandoras.finance" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300">Pandoras.finance</a>
          </div>
        </footer>

      </div>
    </div>
  );
}
