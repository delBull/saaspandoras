'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Layers,
  ChevronRight,
  FileText,
  RefreshCw,
  Zap,
  Building2,
  Lock,
  Landmark,
  Radio
} from 'lucide-react';
import {
  AcademyProgram,
  AcademyAssessment,
  AcademyModule,
  AssessmentScoreResult,
  AssessmentAttemptResult,
  AcademyCertification
} from '@/lib/pandoras/core/domains/academy/types';
import { COO_EXECUTIVE_PROGRAM } from '@/lib/pandoras/core/domains/academy/curriculum/coo-program';
import { CANONICAL_KNOWLEDGE_DOCS } from '@/lib/pandoras/core/domains/academy/curriculum/knowledge-sources';

export default function AdminAcademyPage() {
  const program: AcademyProgram = COO_EXECUTIVE_PROGRAM;
  const initialModule: AcademyModule = program.modules[0]!;
  const initialAssessment: AcademyAssessment = initialModule.assessments[0]!;

  const [selectedModuleId, setSelectedModuleId] = useState<string>(initialModule.id);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(initialAssessment.id);
  
  // Interactive Simulator State
  const [candidateName, setCandidateName] = useState('Ejecutivo COO');
  const [answers, setAnswers] = useState<Record<string, string>>({
    asm_coo_01_entity_shielding: '',
    asm_coo_02_nda_gating: '',
    asm_coo_03_reconciliation: '',
    asm_coo_04_ai_crisis_handoff: '',
  });

  const [evaluating, setEvaluating] = useState(false);
  const [currentScoreResult, setCurrentScoreResult] = useState<AssessmentScoreResult | null>(null);
  const [fullAttemptResult, setFullAttemptResult] = useState<AssessmentAttemptResult | null>(null);
  const [certification, setCertification] = useState<AcademyCertification | null>(null);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'simulator' | 'scorecard'>('simulator');

  const currentModule: AcademyModule = program.modules.find(m => m.id === selectedModuleId) || initialModule;
  const currentAssessment: AcademyAssessment = currentModule.assessments.find(a => a.id === selectedAssessmentId) || currentModule.assessments[0] || initialAssessment;

  // Evaluate single live question
  const handleEvaluateSingle = async () => {
    const answer = (answers[currentAssessment.id] || '').trim();
    if (!answer) return;

    setEvaluating(true);
    try {
      const res = await fetch('/api/admin/academy/coo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_single',
          assessmentId: currentAssessment.id,
          candidateAnswer: answer
        })
      });

      const data = await res.json();
      if (data.success && data.scoreResult) {
        setCurrentScoreResult(data.scoreResult);
      }
    } catch (err) {
      console.error('Evaluation failed:', err);
    } finally {
      setEvaluating(false);
    }
  };

  // Evaluate full attempt
  const handleEvaluateFullExam = async () => {
    setEvaluating(true);
    try {
      const res = await fetch('/api/admin/academy/coo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_full',
          candidateId: `cand_${candidateName.toLowerCase().replace(/\s+/g, '_')}`,
          candidateName,
          answers
        })
      });

      const data = await res.json();
      if (data.success) {
        setFullAttemptResult(data.attemptResult);
        if (data.certification) {
          setCertification(data.certification);
        }
        setActiveTab('scorecard');
      }
    } catch (err) {
      console.error('Full evaluation failed:', err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-100 font-sans flex flex-col">
      {/* ── TOP HEADER ────────────────────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-[#0C0C10] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                INTERNAL CONTROL PLANE
              </span>
              <span className="text-[10px] font-mono text-zinc-500">v1.0 · ISO Audit Ready</span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Pandora's Academy · Módulo COO
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              activeTab === 'simulator' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Simulador de Evaluación
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              activeTab === 'curriculum' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Curriculum & Rúbricas
          </button>
          <button
            onClick={() => setActiveTab('scorecard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              activeTab === 'scorecard' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Scorecard & Certificación
          </button>
        </div>
      </header>

      {/* ── KNOWLEDGE SNAPSHOT BANNER ────────────────────────────────────────── */}
      <div className="bg-amber-500/[0.03] border-b border-amber-500/20 px-6 py-2 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Knowledge Snapshot Congelado: <strong className="text-zinc-200">IOM v1.0 · PAS v1.0 · SOP v1.0</strong></span>
        </div>
        <span className="text-zinc-500">Hash: e8a94b...27c1 (5 Documentos Canónicos)</span>
      </div>

      {/* ── MAIN CONTENT AREA ────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {activeTab === 'simulator' && (
          <>
            {/* Left Column: Module & Case Navigation */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 rounded-2xl border border-white/10 bg-[#0C0C10]">
                <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Módulos del Programa</h2>
                <div className="space-y-2">
                  {program.modules.map((mod, idx) => {
                    const isSelected = mod.id === selectedModuleId;
                    return (
                      <button
                        key={mod.id}
                        onClick={() => {
                          setSelectedModuleId(mod.id);
                          if (mod.assessments[0]) {
                            setSelectedAssessmentId(mod.assessments[0].id);
                          }
                          setCurrentScoreResult(null);
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40 text-white'
                            : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-amber-400">MÓDULO 0{idx + 1} ({mod.weightPercentage}%)</span>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90 text-amber-300' : 'text-zinc-600'}`} />
                        </div>
                        <p className="text-xs font-semibold text-zinc-200 leading-snug">{mod.title}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Candidate Info */}
              <div className="p-4 rounded-2xl border border-white/10 bg-[#0C0C10]">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                  Nombre del Candidato a COO:
                </label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/40"
                />
                <button
                  onClick={handleEvaluateFullExam}
                  disabled={evaluating}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition-colors disabled:opacity-50 font-mono uppercase tracking-wider"
                >
                  {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                  Evaluar Examen Completo
                </button>
              </div>
            </div>

            {/* Right Column: Case Scenario & Answer Sandbox */}
            <div className="lg:col-span-8 space-y-6">
              <div className="p-6 rounded-2xl border border-white/10 bg-[#0C0C10] space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Caso Práctico de Evaluación</span>
                    <h2 className="text-base font-bold text-white mt-0.5">{currentAssessment.title}</h2>
                  </div>
                  <span className="px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-[10px]">
                    Umbral: {currentAssessment.passingThreshold}%
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-white/5 bg-black/40 text-xs text-zinc-300 leading-relaxed">
                  <strong className="text-amber-300 block mb-1">Escenario Operativo:</strong>
                  {currentAssessment.scenarioContext}
                </div>

                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] text-xs text-zinc-300 leading-relaxed">
                  <strong className="text-amber-300 block mb-1">Preguntas a Resolver:</strong>
                  <pre className="font-sans whitespace-pre-wrap">{currentAssessment.questionPrompt}</pre>
                </div>

                {/* Response Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-mono text-zinc-400">Tu Respuesta Ejecutiva como COO:</label>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {answers[currentAssessment.id]?.length || 0} caracteres
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={answers[currentAssessment.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [currentAssessment.id]: e.target.value })}
                    placeholder="Redacta tus decisiones operativas, fundamentos del IOM, análisis de riesgo y medidas de mitigación..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 leading-relaxed font-sans"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[10px] font-mono text-zinc-500">
                    Evaluador: <strong className="text-zinc-300">Hermes AI</strong> · Calificador: <strong className="text-zinc-300">Rubric Engine Determinista</strong>
                  </div>
                  <button
                    onClick={handleEvaluateSingle}
                    disabled={evaluating || !answers[currentAssessment.id]?.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-mono transition-colors disabled:opacity-50"
                  >
                    {evaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Evaluar esta Pregunta
                  </button>
                </div>
              </div>

              {/* Single Evaluation Result */}
              {currentScoreResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-2xl border ${
                    currentScoreResult.passed 
                      ? 'border-emerald-500/40 bg-emerald-500/[0.04]' 
                      : 'border-rose-500/40 bg-rose-500/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      {currentScoreResult.passed ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {currentScoreResult.passed ? 'Respuesta Aprobada con Rigor' : 'Respuesta No Aprobada'}
                        </h3>
                        <p className="text-[11px] font-mono text-zinc-400">
                          Puntaje Calculado por Rubric Engine: <strong className={currentScoreResult.passed ? 'text-emerald-300' : 'text-rose-300'}>{currentScoreResult.calculatedScore}%</strong>
                        </p>
                      </div>
                    </div>

                    {currentScoreResult.hasCriticalFailure && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[10px]">
                        FALLA CRÍTICA DETECTADA
                      </span>
                    )}
                  </div>

                  {currentScoreResult.criticalFailureReason && (
                    <div className="mb-4 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-200">
                      <strong className="block text-rose-300 mb-0.5 font-mono text-[10px] uppercase tracking-wider">Motivo de Anulación:</strong>
                      {currentScoreResult.criticalFailureReason}
                    </div>
                  )}

                  <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                    <strong className="text-zinc-200 block font-mono text-[10px] uppercase tracking-wider">Retroalimentación de Hermes:</strong>
                    <p className="p-3.5 rounded-xl border border-white/5 bg-black/40 text-zinc-300">
                      {currentScoreResult.rawAiFeedback}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: CURRICULUM VIEW */}
        {activeTab === 'curriculum' && (
          <div className="lg:col-span-12 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {program.modules.map((mod, idx) => (
                <div key={mod.id} className="p-5 rounded-2xl border border-white/10 bg-[#0C0C10] space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 font-mono text-xs font-bold">
                    0{idx + 1}
                  </div>
                  <h3 className="text-sm font-bold text-white">{mod.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{mod.description}</p>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>Ponderación: {mod.weightPercentage}%</span>
                    <span>{mod.assessments.length} Caso(s)</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-[#0C0C10] space-y-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Fuentes Canónicas de Conocimiento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(CANONICAL_KNOWLEDGE_DOCS).map(doc => (
                  <div key={doc.docId} className="p-4 rounded-xl border border-white/5 bg-black/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-300">{doc.title}</span>
                      <span className="text-[10px] font-mono text-zinc-500">v{doc.version}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{doc.summary}</p>
                    <p className="text-[9px] font-mono text-zinc-600 truncate">Hash: {doc.contentHash}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SCORECARD & CERTIFICATION */}
        {activeTab === 'scorecard' && (
          <div className="lg:col-span-12 space-y-6">
            {fullAttemptResult ? (
              <div className="space-y-6">
                {/* Result Hero */}
                <div className={`p-8 rounded-3xl border text-center ${
                  fullAttemptResult.certified
                    ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
                    : 'border-rose-500/40 bg-rose-500/[0.04]'
                }`}>
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-300">
                    <Award className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {fullAttemptResult.certified ? '¡Certificación Ejecutiva COO Aprobada!' : 'Evaluación Ejecutiva No Aprobada'}
                  </h2>
                  <p className="text-xs text-zinc-400 max-w-lg mx-auto mt-2">
                    Candidato: <strong className="text-white">{candidateName}</strong> · Readiness Score General:{' '}
                    <strong className={fullAttemptResult.certified ? 'text-emerald-300 font-mono text-sm' : 'text-rose-300 font-mono text-sm'}>
                      {fullAttemptResult.overallReadinessScore}%
                    </strong>
                  </p>
                </div>

                {/* Cross-Cutting Competency Matrix */}
                <div className="p-6 rounded-2xl border border-white/10 bg-[#0C0C10] space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                    Matriz de Competencias Transversales del COO
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(fullAttemptResult.crossCuttingCompetencies).map(([key, val]) => (
                      <div key={key} className="p-3.5 rounded-xl border border-white/5 bg-black/40">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <p className="text-lg font-bold font-mono text-amber-300">{val}%</p>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full ${val >= 80 ? 'bg-emerald-400' : val >= 70 ? 'bg-amber-400' : 'bg-rose-400'}`}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certificate Card (if certified) */}
                {certification && (
                  <div className="p-6 rounded-2xl border border-amber-500/40 bg-amber-500/[0.03] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-amber-400" />
                        <h4 className="text-sm font-bold text-white">Credencial Institucional Pandora's</h4>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400">ID: {certification.id}</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Se certifica que <strong>{certification.candidateName}</strong> ha demostrado dominio integral del{' '}
                      <strong>Pandoras Institutional Operating Model (IOM v1.0)</strong>, blindaje multi-entidad, tesorería PAS y gestión de contingencias.
                    </p>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>Emisor: {certification.issuer}</span>
                      <span>Sello: {certification.certificateHash.substring(0, 20)}...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl border border-white/10 bg-[#0C0C10]">
                <BookOpen className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-zinc-300">Aún no se ha ejecutado una evaluación completa</h3>
                <p className="text-xs text-zinc-500 mt-1">Completa las respuestas en el simulador y presiona "Evaluar Examen Completo".</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
