"use client";

import { useState, useEffect, use } from "react";
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
  Award, 
  ChevronRight, 
  Download, 
  Building2, 
  Scale, 
  Vault, 
  Flame,
  ArrowLeft,
  Lock,
  Cpu,
  Layers,
  KeyRound,
  Mail,
  UserCheck
} from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ token: string }>;
}

export default function CandidateAssessmentPage({ params }: Props) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  
  // Verification Gate State
  const [candidateEmailInput, setCandidateEmailInput] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");

  // Assessment Execution State
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);

  const fetchSession = async (emailToVerify?: string) => {
    setLoading(true);
    setError(null);
    try {
      const activeEmail = emailToVerify || verifiedEmail;
      const url = activeEmail 
        ? `/api/academy/assessment/${token}?email=${encodeURIComponent(activeEmail)}`
        : `/api/academy/assessment/${token}`;

      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "No se pudo cargar la sesión");
      }
      setData(json);
      if (activeEmail && !json.requiresVerification) {
        setVerifiedEmail(activeEmail);
        try {
          sessionStorage.setItem(`academy_verified_${token}`, activeEmail);
        } catch {}
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if previously verified in session
    let savedEmail = "";
    try {
      savedEmail = sessionStorage.getItem(`academy_verified_${token}`) || "";
    } catch {}
    if (savedEmail) {
      setVerifiedEmail(savedEmail);
      fetchSession(savedEmail);
    } else {
      fetchSession();
    }
  }, [token]);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = candidateEmailInput.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setVerificationError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setVerifyingEmail(true);
    setVerificationError(null);
    try {
      const res = await fetch(`/api/academy/assessment/${token}?email=${encodeURIComponent(email)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "El correo ingresado no coincide con el candidato registrado.");
      }
      setData(json);
      setVerifiedEmail(email);
      try {
        sessionStorage.setItem(`academy_verified_${token}`, email);
      } catch {}
    } catch (err: any) {
      setVerificationError(err.message || "Error al verificar identidad.");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || submitting || !data) return;

    setSubmitting(true);
    try {
      const currentModule = data.currentModule;
      const question = currentModule?.assessments[0];

      const res = await fetch(`/api/academy/assessment/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_ANSWER",
          attemptId: data.assessment.id,
          moduleIndex: data.assessment.currentModuleIndex,
          questionId: question?.id || `q_${data.assessment.currentModuleIndex}`,
          questionPrompt: question?.questionPrompt || currentModule?.title,
          candidateAnswer: currentAnswer
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Error al registrar respuesta");
      }

      setCurrentAnswer("");
      await fetchSession(verifiedEmail);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const res = await fetch(`/api/academy/assessment/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FINALIZE",
          attemptId: data.assessment.id
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Error al calificar evaluación");
      }

      setFinalResult(json);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setFinalizing(false);
    }
  };

  const getModuleIcon = (idx: number) => {
    switch (idx) {
      case 0: return <Building2 className="w-5 h-5 text-purple-400" />;
      case 1: return <Scale className="w-5 h-5 text-blue-400" />;
      case 2: return <Vault className="w-5 h-5 text-emerald-400" />;
      case 3: return <Flame className="w-5 h-5 text-rose-400" />;
      default: return <GraduationCap className="w-5 h-5 text-purple-400" />;
    }
  };

  if (loading && !data) {
    return (
      <main className="min-h-screen bg-[#08080A] text-zinc-100 flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-zinc-400">Verificando enlace institucional con Hermes...</p>
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-[#08080A] text-zinc-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0C0C10] border border-rose-500/30 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Acceso No Válido</h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">{error || "El enlace de evaluación no existe o ha expirado."}</p>
          <Link
            href="/academy"
            className="inline-block px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-purple-300 hover:bg-white/10 transition-colors"
          >
            ← Volver al Portal de Academy
          </Link>
        </div>
      </main>
    );
  }

  // ─── CANDIDATE IDENTITY GATE ────────────────────────────────────────────────
  if (data?.requiresVerification) {
    return (
      <main className="min-h-screen bg-[#08080A] text-zinc-100 font-sans flex flex-col selection:bg-purple-500/30">
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <header className="relative z-10 h-16 shrink-0 flex items-center justify-between px-6 bg-[#0C0C10] border-b border-white/10 font-mono">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">PANDORA'S ACADEMY · ACCESS GATE</span>
          </div>
          <span className="px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px] font-mono font-bold">
            CONFIDENCIAL
          </span>
        </header>

        <div className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-lg w-full p-6 md:p-8 rounded-3xl bg-[#0C0C10] border border-white/15 shadow-[0_0_60px_rgba(168,85,247,0.1)] space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Verificación de Identidad del Candidato
              </h1>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Esta sesión de evaluación socrática está restringida exclusivamente al candidato registrado.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Candidato Designado:</span>
                <span className="text-white font-semibold">{data.candidateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Track Ejecutivo:</span>
                <span className="text-purple-300 font-semibold">{data.targetRole} Track</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Pista de Correo:</span>
                <span className="text-zinc-300">{data.maskedEmail}</span>
              </div>
            </div>

            <form onSubmit={handleVerifyEmail} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  Ingresa tu Correo Electrónico Registrado:
                </label>
                <input
                  type="email"
                  required
                  value={candidateEmailInput}
                  onChange={(e) => {
                    setCandidateEmailInput(e.target.value);
                    if (verificationError) setVerificationError(null);
                  }}
                  placeholder="ej. pablosegali@gmail.com"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/60 transition-all font-mono"
                />
              </div>

              {verificationError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] leading-relaxed">
                  {verificationError}
                </div>
              )}

              <button
                type="submit"
                disabled={verifyingEmail || !candidateEmailInput.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-40"
              >
                {verifyingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    VERIFICANDO ACCESO...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    DESBLOQUEAR SESIÓN DE EXAMEN
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-white/5">
              <p className="text-[10px] font-mono text-zinc-600">
                Pandora's Academy Core · Socratic Evaluator v2.0
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // ─── UNLOCKED ACTIVE ASSESSMENT ─────────────────────────────────────────────
  const { assessment, currentModule, isComplete } = data;
  const activeQuestion = currentModule?.assessments[0];

  return (
    <main className="min-h-screen bg-[#08080A] text-zinc-100 font-sans flex flex-col selection:bg-purple-500/30">
      {/* Subtle Grid Background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Header matching Nexus Command Bar */}
      <header className="relative z-10 h-16 shrink-0 flex items-center justify-between px-4 md:px-8 bg-[#0C0C10] border-b border-white/10 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300">
            <GraduationCap className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">PANDORA'S ACADEMY</span>
              <span className="px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[9px] font-bold">
                EXAMEN OFICIAL
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">PROGRAMA EJECUTIVO: {assessment.targetRole} TRACK</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white">{assessment.candidateName}</p>
            <div className="flex items-center justify-end gap-1.5 text-[10px] text-emerald-400 font-mono">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              SESIÓN AUTORIZADA
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">
        
        {finalResult ? (
          /* Final Result / Certificate Card */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 md:p-10 rounded-3xl bg-[#0C0C10] border border-purple-500/30 shadow-[0_0_60px_rgba(168,85,247,0.12)] space-y-6 text-center"
          >
            {finalResult.certification ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <Award className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                    CERTIFICACIÓN APROBADA
                  </span>
                  <h1 className="text-3xl font-bold text-white tracking-tight">¡Felicitaciones, {assessment.candidateName}!</h1>
                  <p className="text-xs md:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                    Has acreditado satisfactoriamente el programa de certificación institucional para el cargo de <strong>{assessment.targetRole}</strong>.
                  </p>
                </div>

                {/* Score & Certificate Details */}
                <div className="p-5 rounded-2xl bg-black/60 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left font-mono text-xs">
                  <div>
                    <span className="text-zinc-500 block uppercase text-[10px]">Readiness Score</span>
                    <span className="text-2xl font-bold text-emerald-400">{finalResult.certification.readinessScore.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block uppercase text-[10px]">ID de Certificado</span>
                    <span className="text-white font-semibold block truncate">{finalResult.certification.id}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block uppercase text-[10px]">Sello Criptográfico SHA-256</span>
                    <span className="text-purple-400 font-semibold block truncate">{finalResult.certification.certificateHash.substring(0, 16)}...</span>
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs font-mono uppercase tracking-wider shadow-lg hover:shadow-purple-500/25 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    DESCARGAR CREDENCIAL OFICIAL
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider">
                    EVALUACIÓN NO APROBADA
                  </span>
                  <h1 className="text-2xl font-bold text-white">Umbral de Calificación No Alcanzado</h1>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                    El resultado determinista no alcanzó el umbral mínimo de 90% o se detectó una falla crítica de gobernanza. Contacta a un administrador para programar una retroalimentación.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        ) : isComplete ? (
          /* All Modules Answered -> Finalize Button */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 md:p-10 rounded-3xl bg-[#0C0C10] border border-white/15 text-center space-y-6 shadow-2xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Has completado los {data?.assessment?.totalModules || 10} módulos</h2>
              <p className="text-xs md:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Todas tus respuestas ejecutivas han sido registradas. Presiona el botón a continuación para que el <strong>Rubric Engine Determinista</strong> procese tu dictamen final.
              </p>
            </div>

            <button
              onClick={handleFinalize}
              disabled={finalizing}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs font-mono uppercase tracking-wider mx-auto shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              {finalizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  CALIFICANDO Y EMITIENDO DICTAMEN...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  CERRAR Y CALIFICAR EVALUACIÓN
                </>
              )}
            </button>
          </motion.div>
        ) : currentModule ? (
          /* Active Module & Socratic Question */
          <div className="space-y-5">
            {/* Progress Stepper with Drawer styling */}
            <div className="p-4 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">
                  MÓDULO {assessment.currentModuleIndex + 1} DE {data.assessment.totalModules}
                </span>
                <span className="text-purple-300 font-semibold">{currentModule.title}</span>
              </div>

              <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${((assessment.currentModuleIndex + 1) / data.assessment.totalModules) * 100}%` }}
                />
              </div>
            </div>

            {/* Scenario Card */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#0C0C10] border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.08)] space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 shrink-0">
                  {getModuleIcon(assessment.currentModuleIndex)}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
                    Caso Ejecutivo / Escenario Real
                  </span>
                  <h2 className="text-base md:text-lg font-bold text-white">{activeQuestion?.title || currentModule.title}</h2>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-zinc-300 leading-relaxed font-sans">
                {activeQuestion?.scenarioContext}
              </div>

              {/* Socratic Prompt */}
              <div className="p-4 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold font-mono">
                  <Sparkles className="w-4 h-4" />
                  <span>Pregunta de Hermes Socratic Evaluator:</span>
                </div>
                <p className="text-sm font-medium text-white leading-relaxed whitespace-pre-wrap font-sans">
                  {activeQuestion?.questionPrompt}
                </p>
              </div>

              {/* Response Input */}
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Tu Respuesta y Plan Operativo Ejecutivo:
                </label>
                <textarea
                  rows={6}
                  placeholder="Redacta tu fundamentación, decisiones operativas, mitigación de riesgos y protocolo de escalación..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-4 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/60 leading-relaxed resize-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-[10px] font-mono text-zinc-500">
                  {currentAnswer.length} caracteres · Evaluado bajo rúbricas institucionales
                </span>

                <button
                  onClick={handleSubmitAnswer}
                  disabled={!currentAnswer.trim() || submitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      REGISTRANDO...
                    </>
                  ) : (
                    <>
                      <span>ENVIAR RESPUESTA</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </main>
  );
}
