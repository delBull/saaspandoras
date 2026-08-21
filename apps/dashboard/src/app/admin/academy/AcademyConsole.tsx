"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, 
  ShieldCheck, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  FileText, 
  Building2, 
  Scale, 
  Vault, 
  Flame, 
  Award,
  ArrowLeft,
  Users,
  Copy,
  Plus,
  RefreshCw,
  ExternalLink,
  Mail,
  Phone,
  Check,
  Radar
} from "lucide-react";
import Link from "next/link";
import { COO_EXECUTIVE_PROGRAM } from "@/lib/pandoras/core/domains/academy/curriculum/coo-program";
import { AcademyCandidate } from "@/lib/pandoras/core/domains/academy/candidates/types";
import { AcademyModule } from "@/lib/pandoras/core/domains/academy/types";

export default function AcademyConsole() {
  const [activeTab, setActiveTab] = useState<"CANDIDATES" | "METRICS" | "SIMULATOR">("CANDIDATES");

  // Candidate state
  const [candidates, setCandidates] = useState<AcademyCandidate[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateEmail, setNewCandidateEmail] = useState("");
  const [newCandidatePhone, setNewCandidatePhone] = useState("");
  const [newCandidateNotes, setNewCandidateNotes] = useState("");
  const [creatingCandidate, setCreatingCandidate] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  // Simulator state
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [candidateResponse, setCandidateResponse] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  const selectedModule = COO_EXECUTIVE_PROGRAM.modules[selectedModuleIndex];

  const fetchCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const res = await fetch("/api/admin/academy/candidates");
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates);
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error("Error fetching candidates:", e);
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateName || !newCandidateEmail) return;

    setCreatingCandidate(true);
    try {
      const res = await fetch("/api/admin/academy/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCandidateName,
          email: newCandidateEmail,
          phone: newCandidatePhone,
          notes: newCandidateNotes,
          targetRole: "COO"
        })
      });

      const data = await res.json();
      if (data.success && data.invitation) {
        const link = `${window.location.origin}/academy/assessment/${data.invitation.token}`;
        setGeneratedInviteLink(link);
        fetchCandidates();
      } else {
        alert(data.error || "Error al invitar candidato");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreatingCandidate(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/academy/assessment/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleSimulateEvaluation = async () => {
    if (!candidateResponse.trim() || isEvaluating || !selectedModule) return;

    setIsEvaluating(true);
    try {
      const activeQuestion = selectedModule.assessments[0];
      const res = await fetch("/api/admin/academy/coo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate_single",
          assessmentId: activeQuestion?.id || "asm_coo_01_entity_shielding",
          candidateAnswer: candidateResponse
        })
      });

      const data = await res.json();
      if (data.success && data.scoreResult) {
        setEvaluationResult(data.scoreResult);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CERTIFIED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">CERTIFICADO</span>;
      case "IN_PROGRESS":
      case "ATTENDED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">EN CURSO</span>;
      case "FAILED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">NO APROBADO</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">INVITADO</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/dashboard" 
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                  Institutional Control Plane
                </span>
                <span className="text-xs font-mono text-zinc-500">v1.0 (COO Track)</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
                Pandora's Academy · Certificaciones & Candidatos
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setGeneratedInviteLink(null);
                setShowInviteModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-colors"
            >
              <Plus className="w-4 h-4" />
              INVITAR CANDIDATO
            </button>
            <button
              onClick={fetchCandidates}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingCandidates ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Metrics Ribbon */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Total Invitados</span>
              <p className="text-2xl font-bold text-white font-mono">{metrics.total}</p>
              <span className="text-[10px] text-zinc-400 font-mono">Candidatos Registrados</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Tasa de Asistencia</span>
              <p className="text-2xl font-bold text-purple-400 font-mono">{metrics.attendanceRate.toFixed(1)}%</p>
              <span className="text-[10px] text-emerald-400 font-mono">{metrics.attended} en sesión</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Certificaciones Emitidas</span>
              <p className="text-2xl font-bold text-emerald-400 font-mono">{metrics.certified}</p>
              <span className="text-[10px] text-zinc-400 font-mono">Sello Criptográfico</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Promedio Readiness</span>
              <p className="text-2xl font-bold text-white font-mono">{metrics.avgScore.toFixed(1)}%</p>
              <span className="text-[10px] text-zinc-400 font-mono">Score Determinista</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab("CANDIDATES")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              activeTab === "CANDIDATES" ? "bg-purple-500 text-black font-bold" : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users className="w-4 h-4" />
            CANDIDATOS & ASISTENCIA ({candidates.length})
          </button>

          <button
            onClick={() => setActiveTab("SIMULATOR")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              activeTab === "SIMULATOR" ? "bg-purple-500 text-black font-bold" : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            SIMULADOR & RÚBRICAS
          </button>
        </div>

        {/* TAB 1: CANDIDATES & ATTENDANCE */}
        {activeTab === "CANDIDATES" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#0C0C10] border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-black/50 border-b border-white/10 font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Candidato / Attendee</th>
                      <th className="py-3 px-4">Rol Objetivo</th>
                      <th className="py-3 px-4">Estado Asistencia</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Invitación & Token</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {candidates.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="text-sm font-semibold text-white">{c.name}</p>
                            <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
                              <Mail className="w-3 h-3 text-zinc-500" /> {c.email}
                              {c.phone && <span className="ml-2 text-zinc-500">· {c.phone}</span>}
                            </p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-zinc-300">
                          {c.targetRole}
                        </td>

                        <td className="py-3.5 px-4">
                          {getStatusBadge(c.attendanceStatus)}
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          {c.latestScore !== undefined ? (
                            <span className="text-emerald-400 font-bold text-sm">{c.latestScore.toFixed(1)}%</span>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-zinc-400">
                          <span className="text-[10px] text-zinc-500 block truncate max-w-[140px]">
                            {c.id}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleCopyLink(`inv_${c.id.replace('cand_', '')}`)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 text-[10px] font-mono transition-colors"
                              title="Copiar link de examen"
                            >
                              {copiedToken === `inv_${c.id.replace('cand_', '')}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">COPIADO</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-purple-400" />
                                  <span>COPIAR LINK</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SIMULATOR & RUBRICS */}
        {activeTab === "SIMULATOR" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Modules Selector */}
            <div className="space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Módulos del Programa</h2>
              {COO_EXECUTIVE_PROGRAM.modules.map((m: AcademyModule, idx: number) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedModuleIndex(idx);
                    setEvaluationResult(null);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1 ${
                    selectedModuleIndex === idx
                      ? "bg-purple-500/10 border-purple-500/40 text-white"
                      : "bg-[#0C0C10] border-white/10 text-zinc-400 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-purple-400">MÓDULO 0{idx + 1}</span>
                    <span>PESO: {m.weightPercentage}%</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{m.title}</h3>
                </div>
              ))}
            </div>

            {/* Middle Column: Socratic Prompt & Test Input */}
            <div className="lg:col-span-2 space-y-6">
              {selectedModule && (
                <div className="p-6 rounded-2xl bg-[#0C0C10] border border-purple-500/20 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">Escenario Socrático</span>
                    <h3 className="text-lg font-bold text-white mt-1">{selectedModule.assessments[0]?.title}</h3>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed bg-black/40 p-3.5 rounded-xl border border-white/5">
                      {selectedModule.assessments[0]?.scenarioContext}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 text-xs">
                    <p className="font-semibold text-purple-300 mb-1">Pregunta de Hermes Evaluator:</p>
                    <p className="text-white whitespace-pre-wrap font-sans">{selectedModule.assessments[0]?.questionPrompt}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      Respuesta del Candidato (Simulador):
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Escribe aquí la respuesta ejecutiva..."
                      value={candidateResponse}
                      onChange={(e) => setCandidateResponse(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-400 resize-none font-sans leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={handleSimulateEvaluation}
                    disabled={!candidateResponse.trim() || isEvaluating}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-40"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        EVALUANDO CON HERMES...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        PROCESAR EVALUACIÓN DE PRUEBA
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Evaluation Output */}
              {evaluationResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-[#0D0D14] border border-purple-500/30 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-mono font-bold text-purple-300">Dictamen de Hermes Evaluator</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">Score Propuesto: {evaluationResult.proposedScore}%</span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">{evaluationResult.feedback}</p>
                </motion.div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full p-6 rounded-2xl bg-[#0C0C10] border border-purple-500/30 shadow-2xl space-y-4 font-sans"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Invitar Candidato a Evaluación</h3>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-zinc-500 hover:text-white text-sm">✕</button>
            </div>

            {generatedInviteLink ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-sm font-semibold text-white">¡Invitación Creada Exitosamente!</p>
                  <p className="text-xs text-zinc-400">Comparte el siguiente enlace seguro con el candidato para iniciar su examen:</p>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-2 font-mono text-xs">
                  <span className="text-purple-300 truncate">{generatedInviteLink}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteLink);
                      alert("¡Enlace copiado al portapapeles!");
                    }}
                    className="p-1.5 rounded-lg bg-purple-500 text-black font-bold text-[10px] shrink-0"
                  >
                    COPIAR
                  </button>
                </div>

                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono uppercase"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateCandidate} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Carlos Mendoza"
                    value={newCandidateName}
                    onChange={(e) => setNewCandidateName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="candidato@empresa.com"
                    value={newCandidateEmail}
                    onChange={(e) => setNewCandidateEmail(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+52 322 000 0000"
                    value={newCandidatePhone}
                    onChange={(e) => setNewCandidatePhone(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">Rol Objetivo</label>
                  <input
                    type="text"
                    disabled
                    value="Chief Operating Officer (COO)"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-zinc-400"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={creatingCandidate}
                    className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold font-mono uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {creatingCandidate ? <Loader2 className="w-4 h-4 animate-spin" /> : "GENERAR INVITACIÓN Y LINK"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
