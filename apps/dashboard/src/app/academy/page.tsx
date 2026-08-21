"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  GraduationCap, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  BookOpen, 
  Award, 
  Scale, 
  Vault, 
  FileCheck, 
  CheckCircle2, 
  Building2,
  KeyRound,
  FileCode2,
  Cpu
} from "lucide-react";
import Link from "next/link";
import { COO_EXECUTIVE_PROGRAM } from "@/lib/pandoras/core/domains/academy/curriculum/coo-program";

export default function AcademyWelcomePage() {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim();
    if (!cleanToken) {
      setError("Por favor ingresa tu token de invitación.");
      return;
    }

    // Extract token if user pasted a full URL
    let token = cleanToken;
    if (cleanToken.includes("/assessment/")) {
      const parts = cleanToken.split("/assessment/");
      token = parts[1]?.split("?")[0] || cleanToken;
    }

    router.push(`/academy/assessment/${encodeURIComponent(token)}`);
  };

  return (
    <main className="min-h-screen bg-[#08080A] text-zinc-100 font-sans selection:bg-purple-500/30">
      {/* Subtle Grid Background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Header */}
      <header className="relative z-10 h-16 border-b border-white/10 bg-[#0C0C10]/80 backdrop-blur-md px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">PANDORA'S ACADEMY</span>
              <span className="px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[9px] font-mono tracking-widest font-bold">
                CORE v2.0
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">INSTITUTIONAL EXECUTIVE CERTIFICATION</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/nexus/rooms"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-zinc-300 text-xs font-mono hover:bg-white/10 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            DEAL ROOMS
          </Link>
          <Link
            href="/admin/academy"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-200 text-xs font-mono hover:bg-purple-500/20 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            ADMIN CONTROL PLANE
          </Link>
        </div>
      </header>

      {/* Hero & Assessment Token Gate */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-24 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-mono"
          >
            <Sparkles className="w-3.5 h-3.5" />
            PROGRAMA DE EVALUACIÓN DETERMINISTA Y SOCRÁTICA
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight"
          >
            Certificación Ejecutiva de Operaciones & Gobernanza
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto font-light"
          >
            Estación de evaluación institucional para candidatos ejecutivos (COO, Directores de Operaciones). 
            Validación de competencias sobre el <strong>Institutional Operating Model (IOM)</strong>, 
            <strong>Pandoras Asset Standard (PAS)</strong> y doctrina de blindaje multigeneracional.
          </motion.p>
        </div>

        {/* Candidate Token Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-xl mx-auto p-6 md:p-8 rounded-3xl bg-[#0C0C10] border border-white/15 shadow-2xl space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Ingreso de Candidato Autorizado</h2>
              <p className="text-xs text-zinc-400 font-mono">Pega tu token o enlace de invitación personal</p>
            </div>
          </div>

          <form onSubmit={handleAccess} className="space-y-4">
            <div>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ej. inv_coo_carlos_demo o inv_7a8f9c12b..."
                className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 transition-all"
              />
              {error && <p className="text-xs text-rose-400 mt-2 font-mono">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs font-mono uppercase tracking-wider transition-all shadow-lg hover:shadow-purple-500/20"
            >
              ACCEDER A LA EVALUACIÓN SOCRÁTICA
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>Umbral de Aprobación: {COO_EXECUTIVE_PROGRAM.passingScore}%</span>
            <span>{COO_EXECUTIVE_PROGRAM.modules.length} Módulos Ejecutivos</span>
          </div>
        </motion.div>

        {/* Modules Overview */}
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Estructura Curricular del Programa COO (10 Módulos)
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Evaluación adaptativa asistida por Hermes Socratic Evaluator v2.0
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COO_EXECUTIVE_PROGRAM.modules.map((m, idx) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-[#0D0D14] border border-white/10 space-y-2 hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                    Módulo {idx + 1} · {m.weightPercentage}% Ponderación
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">{m.code}</span>
                </div>
                <h3 className="text-sm font-semibold text-white">{m.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{m.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
          <div className="p-6 rounded-2xl bg-[#0D0D14] border border-white/10 space-y-3">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Blindaje Multi-Entidad</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Separación inalienable entre Holding patrimonial (IP y Tesorería), Operating Companies de software y vehículos de propósito específico (SPVs).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0D0D14] border border-white/10 space-y-3">
            <FileCheck className="w-6 h-6 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Sello Criptográfico SHA-256</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Cada dictamen aprobatorio genera un certificado inmutable con hash compuesto vinculado a la versión congelada de los documentos canónicos.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0D0D14] border border-white/10 space-y-3">
            <Cpu className="w-6 h-6 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Aislamiento de Contexto</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              El motor de clearance y cuarentena ExecutiveScopeValidator previene cualquier filtración de rubricas y secretos institucionales hacia tenants.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-12 border-t border-white/10 bg-[#0C0C10] flex items-center justify-between px-6 md:px-12 text-[10px] font-mono text-zinc-600">
        <span>Pandora's Academy Core · Institutional Control Plane</span>
        <span>© {new Date().getFullYear()} Pandora's Group Holdings</span>
      </footer>
    </main>
  );
}
