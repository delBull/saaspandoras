'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Users, 
  Award, 
  Building, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  KeyRound, 
  Lock,
  Cpu,
  Mail
} from 'lucide-react';

interface SandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'admin' | 'nexus' | 'assessment';
}

export function AcademySandboxModal({ isOpen, onClose, initialTab = 'admin' }: SandboxModalProps) {
  const [activeTab, setActiveTab] = useState<'admin' | 'nexus' | 'assessment'>(initialTab);
  
  // Interactive Assessment Sandbox State
  const [assessmentStep, setAssessmentStep] = useState<number>(1);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateAssessment = () => {
    if (!selectedAnswer) return;
    setIsEvaluating(true);
    setTimeout(() => {
      setIsEvaluating(false);
      if (selectedAnswer === 'A') {
        setEvaluationFeedback(
          '✅ EXCELENTE RIGOR OPERATIVO (Score: 95/100): Distinguiste correctamente entre divulgación pública y debida diligencia institucional bajo NDA. Hermes validó que preservaste el principio de información privilegiada.'
        );
      } else {
        setEvaluationFeedback(
          '⚠️ RIESGO DE FUGA DE INFORMACIÓN (Score: 40/100): Compartir datos financieros internos o estructura corporativa sin NDA previo viola el protocolo de gobernanza institucional.'
        );
      }
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0E0E14] border border-purple-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_80px_rgba(168,85,247,0.2)] text-white space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded">
                  SANDBOX INTERACTIVO PANDORAS
                </span>
                <span className="text-[10px] font-mono text-zinc-500">MOCKUP SEGURO PARA TERCEROS</span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white">
                Demostración de Capacidades Institucionales
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-black/50 border border-white/10">
          <button
            onClick={() => { setActiveTab('admin'); setEvaluationFeedback(null); }}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'admin' 
                ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/20' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Consola Admin (Preview)
          </button>
          <button
            onClick={() => { setActiveTab('nexus'); setEvaluationFeedback(null); }}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'nexus' 
                ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/20' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            Nexus Deal Rooms (Preview)
          </button>
          <button
            onClick={() => { setActiveTab('assessment'); setEvaluationFeedback(null); }}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'assessment' 
                ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/20' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Simulador de Evaluación
          </button>
        </div>

        {/* Content Tab 1: Consola Admin Sandbox */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-start gap-3">
              <Lock className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-300 leading-relaxed">
                Esta es una vista previa de la <strong>Consola de Acreditación Institucional</strong> de Pandora's Academy. En la versión Enterprise, los administradores emiten tokens de un solo uso, configuran rúbricas y acuñan credenciales Soulbound (ERC-5192) on-chain para su directiva.
              </p>
            </div>

            {/* Dashboard Mockup Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Candidatos Evaluados</span>
                <p className="text-2xl font-bold text-white">128</p>
                <span className="text-[10px] font-mono text-emerald-400">92% Índice de Acreditación</span>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Soulbounds Acuñados</span>
                <p className="text-2xl font-bold text-purple-400">47</p>
                <span className="text-[10px] font-mono text-zinc-400">Red: Sepolia / Arbitrum</span>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Tiempo Promedio Evaluación</span>
                <p className="text-2xl font-bold text-blue-400">18 min</p>
                <span className="text-[10px] font-mono text-zinc-400">Socrático con IA Hermes</span>
              </div>
            </div>

            {/* Mock Candidate Table */}
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/30">
              <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Cohorte de Evaluación Activa (Demo)</span>
                <span className="text-[10px] text-purple-300">ESTADO EN TIEMPO REAL</span>
              </div>
              <div className="divide-y divide-white/5 text-xs font-mono">
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">Carlos M. — COO Candidate</p>
                    <p className="text-zinc-500 text-[10px]">Programa: Executive Operations v2.1</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                    CERTIFIED · 94%
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">Elena R. — Hermes Operator</p>
                    <p className="text-zinc-500 text-[10px]">Programa: Autonomous Agent Security</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-bold">
                    EVALUANDO · EN PROCESO
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">¿Deseas desplegar una consola de evaluación para tu equipo?</h4>
                <p className="text-xs text-zinc-400">Te configuramos una instancia privada con tus manuales de gobernanza.</p>
              </div>
              <a
                href="mailto:institutional@pandoras.finance?subject=Solicitud%20Demo%20Consola%20Admin%20Academy"
                className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-bold text-xs font-mono uppercase tracking-wider shrink-0 transition-colors flex items-center gap-2"
              >
                <Mail className="w-3.5 h-3.5" />
                SOLICITAR ACCESO B2B
              </a>
            </div>
          </div>
        )}

        {/* Content Tab 2: Nexus Deal Rooms Sandbox */}
        {activeTab === 'nexus' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-3">
              <Building className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong>Nexus Hub</strong> es la infraestructura de Deal Rooms institucionales para sindicación de capital y estructuración de deuda y equity tokenizado para proyectos RWA certificados por Pandora's Academy.
              </p>
            </div>

            {/* Nexus Mockup Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    DEAL ROOM PRIVADO
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">ACCESO POR FIRMA MULTISIG</span>
                </div>
                <h4 className="text-sm font-bold text-white">Desarrollo Hotelero S'Narai Phase 1</h4>
                <p className="text-xs text-zinc-400">Emisión tokenizada de rendimiento hotelero respaldada por fideicomiso y contratos inteligentes auditados.</p>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>Capacidad: $1,200,000 USD</span>
                  <span className="text-emerald-400">● Abierto</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    DEAL ROOM PRIVADO
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">ACCESO INSTITUCIONAL</span>
                </div>
                <h4 className="text-sm font-bold text-white">Zunu Eco-Resort & Wellness Pool</h4>
                <p className="text-xs text-zinc-400">Tokenización fraccionada de activos ecoturísticos con distribución pro-rata automática en USDC.</p>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>Capacidad: $3,400,000 USD</span>
                  <span className="text-emerald-400">● Abierto</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">¿Buscas estructurar o financiar un Deal Room institucional?</h4>
                <p className="text-xs text-zinc-400">Conectamos emisores RWA con fondos y LPs acreditados bajo estrictos estándares PAS.</p>
              </div>
              <a
                href="mailto:nexus@pandoras.finance?subject=Solicitud%20Acceso%20Nexus%20Deal%20Rooms"
                className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-black font-bold text-xs font-mono uppercase tracking-wider shrink-0 transition-colors flex items-center gap-2"
              >
                <Mail className="w-3.5 h-3.5" />
                CONECTAR CON NEXUS
              </a>
            </div>
          </div>
        )}

        {/* Content Tab 3: Interactive Assessment Simulator */}
        {activeTab === 'assessment' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-300 leading-relaxed">
                Prueba cómo el <strong>Evaluador Socrático Hermes</strong> analiza tus respuestas en tiempo real, evaluando gobernanza determinista, manejo de información confidencial y resolución de incidentes.
              </p>
            </div>

            {/* Question Card */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/15 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded">
                  CASO OPERATIVO DE PRUEBA · GOBERNANZA DE INFORMACIÓN
                </span>
                <span className="text-[10px] font-mono text-zinc-500">MOCK SIMULATOR</span>
              </div>

              <h3 className="text-sm md:text-base font-bold text-white leading-relaxed">
                "Un inversionista institucional solicita la estructura accionaria privada y proyecciones no públicas para completar su due diligence en 24 horas. Como COO interino, ¿cómo procedes?"
              </h3>

              <div className="space-y-2.5">
                <button
                  onClick={() => { setSelectedAnswer('A'); setEvaluationFeedback(null); }}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-mono transition-all ${
                    selectedAnswer === 'A' 
                      ? 'bg-purple-500/20 border-purple-500 text-white' 
                      : 'bg-black/20 border-white/10 text-zinc-300 hover:border-white/20'
                  }`}
                >
                  <strong className="text-purple-400">Opción A:</strong> Validar acreditación de inversionista, exigir firma mutua de NDA institucional y habilitar acceso cifrado restringido en Nexus Deal Room.
                </button>

                <button
                  onClick={() => { setSelectedAnswer('B'); setEvaluationFeedback(null); }}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-mono transition-all ${
                    selectedAnswer === 'B' 
                      ? 'bg-purple-500/20 border-purple-500 text-white' 
                      : 'bg-black/20 border-white/10 text-zinc-300 hover:border-white/20'
                  }`}
                >
                  <strong className="text-purple-400">Opción B:</strong> Enviar inmediatamente los archivos PDF por correo para no retrasar el cierre de la ronda de $500K.
                </button>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={handleSimulateAssessment}
                  disabled={!selectedAnswer || isEvaluating}
                  className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-black font-bold text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  {isEvaluating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Hermes Evaluando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Evaluar con Hermes AI
                    </>
                  )}
                </button>
                {selectedAnswer && <span className="text-[10px] font-mono text-zinc-400">Opción {selectedAnswer} seleccionada</span>}
              </div>

              {/* Evaluation Feedback */}
              {evaluationFeedback && (
                <div className="p-4 rounded-xl bg-black/60 border border-purple-500/40 text-xs font-mono space-y-2 animate-in fade-in duration-200">
                  <p className="text-purple-200">{evaluationFeedback}</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
