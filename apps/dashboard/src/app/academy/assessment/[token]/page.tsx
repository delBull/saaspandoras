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
  Flame
} from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

export default function CandidateAssessmentPage({ params }: Props) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/academy/assessment/${token}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "No se pudo cargar la sesión");
      }
      setData(json);
      if (json.isComplete && !json.certificationId) {
        // If all modules submitted, allow user to click finalize
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [token]);

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
      await fetchSession();
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#08080A] text-zinc-100 flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-zinc-400">Iniciando sesión segura de evaluación con Hermes...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#08080A] text-zinc-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#0C0C10] border border-red-500/30 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Acceso No Válido</h2>
          <p className="text-xs text-zinc-400">{error || "El enlace de evaluación no existe o ha expirado."}</p>
        </div>
      </main>
    );
  }

  const { assessment, currentModule, isComplete } = data;
  const activeQuestion = currentModule?.assessments[0];

  return (
    <main className="min-h-screen bg-[#08080A] text-zinc-100 font-sans flex flex-col">
      {/* Header */}
      <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-[#0C0C10] border-b border-white/10 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300">
            <GraduationCap className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tracking-tight">PANDORA'S ACADEMY</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                EXAMEN OFICIAL
              </span>
            </div>
            <p className="text-[10px] text-zinc-500">PROGRAMA EJECUTIVO: {assessment.targetRole}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white">{assessment.candidateName}</p>
            <p className="text-[10px] text-emerald-400 font-mono">● SESIÓN ACTIVA</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center">
        
        {finalResult ? (
          /* Final Result / Certificate Card */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-3xl bg-[#0D0D14] border border-purple-500/30 shadow-2xl space-y-6 text-center"
          >
            {finalResult.certification ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                    CERTIFICACIÓN APROBADA
                  </span>
                  <h1 className="text-3xl font-bold text-white mt-3">¡Felicitaciones, {assessment.candidateName}!</h1>
                  <p className="text-sm text-zinc-400 mt-1 max-w-lg mx-auto leading-relaxed">
                    Has acreditado satisfactoriamente el programa de certificación institucional para el cargo de <strong>{assessment.targetRole}</strong>.
                  </p>
                </div>

                {/* Score & Certificate Details */}
                <div className="p-6 rounded-2xl bg-black/50 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left font-mono text-xs">
                  <div>
                    <span className="text-zinc-500 block uppercase text-[10px]">Readiness Score</span>
                    <span className="text-2xl font-bold text-emerald-400">{finalResult.certification.readinessScore.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block uppercase text-[10px]">ID de Certificado</span>
                    <span className="text-white font-semibold block truncate">{finalResult.certification.id}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block uppercase text-[10px]">Sello Criptográfico</span>
                    <span className="text-purple-400 font-semibold block truncate">{finalResult.certification.certificateHash.substring(0, 16)}...</span>
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-emerald-500 text-black font-semibold text-xs font-mono uppercase tracking-wider shadow-lg hover:brightness-110 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    DESCARGAR CREDENCIAL OFICIAL (PDF)
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-white">Evaluación No Aprobada</h1>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  El resultado determinista no alcanzó el umbral mínimo de 80% o se detectó una falla crítica de gobernanza. Contacta a un administrador para programar una retroalimentación y reintento.
                </p>
              </>
            )}
          </motion.div>
        ) : isComplete ? (
          /* All Modules Answered -> Finalize Button */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-[#0D0D14] border border-white/15 text-center space-y-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Has completado los {data?.assessment?.totalModules || 10} módulos</h2>
              <p className="text-xs text-zinc-400 mt-2 max-w-lg mx-auto leading-relaxed">
                Todas tus respuestas ejecutivas han sido registradas. Presiona el botón a continuación para que el <strong>Rubric Engine</strong> y el comité de políticas procesen tu dictamen final.
              </p>
            </div>

            <button
              onClick={handleFinalize}
              disabled={finalizing}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-emerald-500 text-black font-semibold text-xs font-mono uppercase tracking-wider mx-auto shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
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
          <div className="space-y-6">
            {/* Progress Stepper */}
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">
                MÓDULO {assessment.currentModuleIndex + 1} DE {data.assessment.totalModules}
              </span>
              <span className="text-purple-400 font-semibold">{currentModule.title}</span>
            </div>

            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full transition-all duration-300"
                style={{ width: `${((assessment.currentModuleIndex) / data.assessment.totalModules) * 100}%` }}
              />
            </div>

            {/* Scenario Card */}
            <div className="p-6 md:p-8 rounded-2xl bg-[#0D0D14] border border-purple-500/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 shrink-0">
                  {getModuleIcon(assessment.currentModuleIndex)}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">Caso Ejecutivo / Escenario Real</span>
                  <h2 className="text-lg font-bold text-white">{activeQuestion?.title || currentModule.title}</h2>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-300 leading-relaxed font-sans">
                {activeQuestion?.scenarioContext}
              </div>

              {/* Socratic Prompt */}
              <div className="p-4 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Pregunta de Hermes Evaluator:</span>
                </div>
                <p className="text-sm font-medium text-white leading-relaxed whitespace-pre-wrap font-sans">
                  {activeQuestion?.questionPrompt}
                </p>
              </div>

              {/* Response Input */}
              <div className="space-y-3 pt-2">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Tu Respuesta y Plan Operativo Ejecutivo:
                </label>
                <textarea
                  rows={6}
                  placeholder="Redacta tu fundamentación, decisiones operativas, mitigación de riesgos y protocolo de escalación..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-400 leading-relaxed resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-mono text-zinc-500">
                  {currentAnswer.length} caracteres · Respuestas evaluadas bajo rúbrica institucional
                </span>

                <button
                  onClick={handleSubmitAnswer}
                  disabled={!currentAnswer.trim() || submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-40"
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
