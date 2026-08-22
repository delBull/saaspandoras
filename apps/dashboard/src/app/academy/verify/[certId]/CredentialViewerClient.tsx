'use client';

/**
 * 🎖️ Pandora's Academy — Public Credential & Perks Interactive Viewer
 * apps/dashboard/src/app/academy/verify/[certId]/CredentialViewerClient.tsx
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Award,
  Lock,
  Download,
  Copy,
  ExternalLink,
  Sparkles,
  Zap,
  BookOpen,
  Sword,
  TrendingUp,
  Coins,
  Cpu,
  ArrowLeft,
  ChevronRight,
  Share2,
  AlertTriangle,
  Play
} from 'lucide-react';
import { UNLOCKED_BLUEPRINTS, SIMULATOR_SCENARIOS, UnlockedBlueprintDoc, SimulatorCrisisScenario } from '@/lib/pandoras/core/domains/academy/rewards/unlocked-perks';

interface CredentialViewerProps {
  cert: {
    id: string;
    candidateName: string;
    targetRole: string;
    programTitle: string;
    readinessScore: number;
    competencySummary?: any;
    status: string;
    curriculumVersion: number;
    knowledgeSnapshotHash: string;
    certifiedAt: string;
    validUntil?: string;
    issuer: string;
    certificateHash: string;
  };
}

export function CredentialViewerClient({ cert }: CredentialViewerProps) {
  const [activeTab, setActiveTab] = useState<'BADGE' | 'PERKS' | 'SIMULATOR'>('BADGE');
  const [selectedBlueprint, setSelectedBlueprint] = useState<UnlockedBlueprintDoc | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<SimulatorCrisisScenario>(SIMULATOR_SCENARIOS[0]!);
  const [simulatorResponse, setSimulatorResponse] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [simulatorResult, setSimulatorResult] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'SIMULATOR') setActiveTab('SIMULATOR');
      else if (tabParam === 'PERKS') setActiveTab('PERKS');
    }
  }, []);

  const role = cert.targetRole.toUpperCase();
  const relevantBlueprints = UNLOCKED_BLUEPRINTS.filter(
    b => b.roleTarget === role || b.roleTarget === 'ALL'
  );

  const relevantScenarios = SIMULATOR_SCENARIOS.filter(
    s => s.roleTarget === role
  ).length > 0
    ? SIMULATOR_SCENARIOS.filter(s => s.roleTarget === role)
    : SIMULATOR_SCENARIOS;

  const handleCopyVerification = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleRunSimulator = async () => {
    if (!simulatorResponse.trim() || simulating) return;
    setSimulating(true);
    setSimulatorResult(null);

    try {
      const res = await fetch('/api/academy/simulator/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedScenario.id,
          candidateResponse: simulatorResponse
        })
      });
      const data = await res.json();
      if (data.success) {
        setSimulatorResult(data.evaluation);
      }
    } catch (err) {
      console.error('Simulator error:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-100 p-4 md:p-8 font-sans selection:bg-purple-500/30">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 rounded-2xl bg-[#0C0C10] border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.08)]">
          <div className="flex items-center gap-4">
            <Link 
              href="/academy" 
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              title="Volver a la Academia"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> VERIFICADO ON-CHAIN
                </span>
                <span className="text-xs font-mono text-zinc-500 hidden sm:inline">ERC-5192 SOULBOUND</span>
              </div>
              <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                Credencial Institucional: {cert.candidateName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyVerification}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 text-xs font-mono transition-colors"
            >
              {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedLink ? 'ENLACE COPIADO' : 'COMPARTIR'}
            </button>
            <a
              href={`/api/academy/credentials/${cert.id}/badge.svg`}
              download={`${cert.id}_soulbound_badge.svg`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs font-mono transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              DESCARGAR SVG
            </a>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0C0C10] border border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('BADGE')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all shrink-0 ${
              activeTab === 'BADGE'
                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4" />
            1. SOULBOUND BADGE & RADAR
          </button>

          <button
            onClick={() => setActiveTab('PERKS')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all shrink-0 ${
              activeTab === 'PERKS'
                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            2. THE OBSIDIAN LIBRARY ({relevantBlueprints.length} SOPS DESBLOQUEADOS)
          </button>

          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all shrink-0 ${
              activeTab === 'SIMULATOR'
                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sword className="w-4 h-4" />
            3. HERMES WAR ROOM SIMULATOR
          </button>
        </div>

        {/* ─── TAB 1: SOULBOUND BADGE & VERIFICATION DETAILS ─────────────────── */}
        {activeTab === 'BADGE' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Holographic Badge Card Visual (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative group w-full max-w-[420px] rounded-3xl p-3 bg-gradient-to-b from-purple-500/20 via-white/5 to-black/80 border border-white/15 shadow-[0_0_50px_rgba(168,85,247,0.15)] transition-transform duration-500 hover:scale-[1.02]">
                <div className="overflow-hidden rounded-2xl bg-[#08080A]">
                  <img
                    src={`/api/academy/credentials/${cert.id}/badge.svg`}
                    alt="Soulbound Badge"
                    className="w-full h-auto object-contain rounded-2xl"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between px-2 text-[10px] font-mono text-zinc-500">
                  <span className="flex items-center gap-1 text-purple-400">
                    <Sparkles className="w-3 h-3" /> INTANGIBLE ERC-5192
                  </span>
                  <span>SEAL: {cert.certificateHash.substring(0, 12)}...</span>
                </div>
              </div>
            </div>

            {/* Verification Metadata & Cross-Cutting Competencies (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-6 rounded-3xl bg-[#0C0C10] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-purple-400 font-bold">
                    ATTESTATION RECORD DE PANDORA'S ACADEMY
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    VIGENTE · 1 AÑO
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-white">{cert.programTitle}</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-zinc-500 text-[10px] uppercase">Candidato</span>
                    <p className="text-white font-bold truncate">{cert.candidateName}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-zinc-500 text-[10px] uppercase">Puntaje Obtenido</span>
                    <p className="text-purple-300 font-bold text-base">{cert.readinessScore}%</p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-zinc-500 text-[10px] uppercase">Fecha de Emisión</span>
                    <p className="text-zinc-300">{new Date(cert.certifiedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Hash Criptográfico SHA-256:</span>
                    <span className="text-[10px] text-zinc-500 font-mono">INMUTABLE</span>
                  </div>
                  <p className="text-[11px] text-purple-300/90 break-all font-mono select-all bg-black/40 p-2 rounded-lg border border-purple-500/20">
                    {cert.certificateHash}
                  </p>
                </div>
              </div>

              {/* Competency Radar Breakdown */}
              <div className="p-6 rounded-3xl bg-[#0C0C10] border border-white/10 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Desglose de Competencias Evaluadas por Hermes
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Gobernanza Institucional & Separación de Capas', score: 95 },
                    { name: 'Estándar PAS v1.0 & Bóvedas Fiduciarias', score: 92 },
                    { name: 'Protocolos de Safe-Stops & Firmas M-of-N', score: 90 },
                    { name: 'Contención de Crisis & Legal Engineering', score: 94 }
                  ].map((comp, idx) => (
                    <div key={idx} className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between text-zinc-300">
                        <span>{comp.name}</span>
                        <span className="text-purple-400 font-bold">{comp.score}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                          style={{ width: `${comp.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: UNLOCKED BLUEPRINTS (OBSIDIAN LIBRARY) ──────────────────── */}
        {activeTab === 'PERKS' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#0C0C10] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                  PERK NIVEL 1 · ACCESO PERMANENTE
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white">The Obsidian Library (SOPs & Blueprints)</h2>
                <p className="text-xs text-zinc-400">
                  Documentación ejecutiva confidencial desbloqueada tras aprobar tu acreditación como {cert.targetRole}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relevantBlueprints.map((bp) => (
                <div
                  key={bp.id}
                  className="p-5 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-3 hover:border-purple-500/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-purple-300 font-bold">{bp.category}</span>
                      <span>{bp.readTime}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{bp.title}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-2">{bp.summary}</p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedBlueprint(bp)}
                      className="text-xs font-mono text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                    >
                      LEER EN LÍNEA <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([bp.contentMarkdown], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = bp.downloadFilename;
                        a.click();
                      }}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                      title="Descargar Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Locked Perks Visual (Tier 3 & Tier 4) */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3 opacity-60 relative overflow-hidden">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                    PERK NIVEL 3 · PRÓXIMAMENTE
                  </span>
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <h3 className="text-sm font-bold text-zinc-400">Pase Institucional a Deal Rooms Tier 1 (&gt; $500k USD)</h3>
                <p className="text-xs text-zinc-500">
                  Acceso directo sin pre-calificación a salas de asignación de capital institucional y deals privados.
                </p>
                <div className="pt-2 text-[10px] font-mono text-amber-400">
                  EN DESARROLLO DE FASE 3
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3 opacity-60 relative overflow-hidden">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">
                    PERK NIVEL 4 · PRÓXIMAMENTE
                  </span>
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <h3 className="text-sm font-bold text-zinc-400">Multiplicador PBOX Tokenomics Rep (+5,000 Pts)</h3>
                <p className="text-xs text-zinc-500">
                  Aumento del factor de asignación en distribución de dividendos y comisiones por volumen de colocación.
                </p>
                <div className="pt-2 text-[10px] font-mono text-blue-400">
                  EN DEFINICIÓN DE TOKENOMICS
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: HERMES WAR ROOM SIMULATOR ───────────────────────────────── */}
        {activeTab === 'SIMULATOR' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#0C0C10] border border-white/10 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                  PERK NIVEL 2 · SIMULADOR EN VIVO
                </span>
                <span className="text-xs font-mono text-zinc-500">WAR ROOM CRISIS TRAINING</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">Hermes Socratic Executive Simulator</h2>
              <p className="text-xs text-zinc-400 max-w-3xl">
                Practica toma de decisiones ejecutivas en tiempo real. Hermes adoptará el rol de un adversario (regulador, inversionista hostil, demandante) y evaluará tu templanza y rigor normativo.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Scenario Selector (4 cols) */}
              <div className="lg:col-span-4 space-y-3">
                <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider">
                  Escenarios de Crisis Disponibles
                </span>
                <div className="space-y-2">
                  {relevantScenarios.map((sc) => (
                    <div
                      key={sc.id}
                      onClick={() => {
                        setSelectedScenario(sc);
                        setSimulatorResult(null);
                        setSimulatorResponse('');
                      }}
                      className={`p-4 rounded-xl cursor-pointer transition-all border ${
                        selectedScenario.id === sc.id
                          ? 'bg-purple-500/15 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                          : 'bg-[#0C0C10] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-purple-300 font-bold">{sc.roleTarget}</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300">
                          {sc.difficulty}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1">{sc.title}</h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">{sc.context}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Simulation Console (8 cols) */}
              <div className="lg:col-span-8 p-6 rounded-3xl bg-[#0C0C10] border border-white/10 space-y-4">
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-mono font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>DESAFÍO ADVERSARIO · {selectedScenario.adversaryRole.toUpperCase()}</span>
                  </div>
                  <p className="text-sm text-zinc-200 font-medium leading-relaxed">
                    "{selectedScenario.openingAdversaryMessage}"
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400">
                    Tu Decisión y Postura Ejecutiva Directiva:
                  </label>
                  <textarea
                    rows={5}
                    value={simulatorResponse}
                    onChange={(e) => setSimulatorResponse(e.target.value)}
                    placeholder="Escribe tu respuesta estratégica fundamentando en la separación de entidades, estándar PAS v1.0 o gobernanza..."
                    className="w-full bg-black/60 border border-white/15 rounded-2xl p-4 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/60 leading-relaxed resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-mono text-zinc-500">
                    Evaluado por: Hermes Cognitive Kernel
                  </span>
                  <button
                    onClick={handleRunSimulator}
                    disabled={simulating || !simulatorResponse.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-all"
                  >
                    {simulating ? (
                      <span className="flex items-center gap-2">
                        <Play className="w-3.5 h-3.5 animate-spin" /> PROCESANDO DICTAMEN...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Play className="w-3.5 h-3.5 fill-black" /> ENVIAR AL WAR ROOM
                      </span>
                    )}
                  </button>
                </div>

                {/* Simulator Evaluation Result */}
                {simulatorResult && (
                  <div className={`p-5 rounded-2xl border space-y-3 transition-all ${
                    simulatorResult.passed
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider">
                        DICTAMEN DE HERMES KERNEL
                      </span>
                      <span className="text-base font-mono font-extrabold">
                        {simulatorResult.score}/100 PTS
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-zinc-200">
                      {simulatorResult.hermesVerdict}
                    </p>

                    {simulatorResult.strengths?.length > 0 && (
                      <div className="space-y-1 text-[11px] font-mono text-zinc-300">
                        <span className="text-emerald-400 font-bold">Fortalezas Identificadas:</span>
                        <ul className="list-disc list-inside space-y-0.5">
                          {simulatorResult.strengths.map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── BLUEPRINT DETAIL MODAL ────────────────────────────────────────── */}
        {selectedBlueprint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-3xl max-h-[85vh] rounded-3xl bg-[#0C0C10] border border-white/15 p-6 md:p-8 overflow-y-auto space-y-4 shadow-[0_0_80px_rgba(168,85,247,0.2)]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">
                    {selectedBlueprint.category}
                  </span>
                  <h3 className="text-lg font-bold text-white">{selectedBlueprint.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedBlueprint(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="prose prose-invert prose-xs max-w-none text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
                {selectedBlueprint.contentMarkdown}
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setSelectedBlueprint(null)}
                  className="px-4 py-2 rounded-xl bg-purple-500 text-black font-semibold text-xs font-mono"
                >
                  Cerrar Documento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
