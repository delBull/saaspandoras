'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, ShieldCheck, Zap, Server, ChevronLeft, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { provisionTenantAction } from './actions';

export function ProvisioningConsoleClient({ project }: { project: any }) {
  const router = useRouter();
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    agentName: project.title ? `Hermes (${project.title})` : 'Hermes AI',
    persona: `Asistente Oficial de Inteligencia Soberana de ${project.title || 'la Organización'}`,
    voice: 'Institucional, riguroso, empático y transparente.',
  });

  const handleProvision = async () => {
    setIsProvisioning(true);
    setError(null);
    setResult(null);

    const payload = {
      tenantId: project.slug,
      organizationName: project.title || project.slug,
      agentName: formData.agentName,
      persona: formData.persona,
      voice: formData.voice,
      projectMetadata: {
        tokenPriceUsd: project.tokenPriceUsd ? parseFloat(project.tokenPriceUsd) : undefined,
        totalSupply: project.totalTokens ? parseFloat(project.totalTokens) : undefined,
        legalEntity: project.legalStatus || undefined,
      },
      forbiddenTerms: ['rendimiento garantizado', 'ganancia asegurada', 'sin riesgo'],
    };

    const res = await provisionTenantAction(payload as any);

    if (res.success) {
      setResult(res.data);
    } else {
      setError(res.error || 'Ocurrió un error desconocido.');
    }

    setIsProvisioning(false);
  };

  return (
    <div className="min-h-screen bg-[#0F0F16] text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed top-0 inset-x-0 h-[500px] bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
      <div className="fixed -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/admin"
            className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] font-mono text-purple-300 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              HQ Sovereign Command
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Aprovisionamiento Hermes Mesh
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Desplegando infraestructura de inteligencia, Claims en IPFS y Root Manifest para <strong className="text-white">{project.title || project.slug}</strong>.
            </p>
          </div>
        </div>

        {/* Content */}
        {!result ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Configuration Form */}
            <div className="p-6 rounded-2xl bg-[#14141E] border border-white/[0.06] space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                Configuración del Soul (Agente)
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nombre del Agente</label>
                  <input 
                    type="text"
                    value={formData.agentName}
                    onChange={(e) => setFormData({...formData, agentName: e.target.value})}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Persona S'Narai / Identidad</label>
                  <textarea 
                    value={formData.persona}
                    onChange={(e) => setFormData({...formData, persona: e.target.value})}
                    rows={3}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tono y Voz</label>
                  <textarea 
                    value={formData.voice}
                    onChange={(e) => setFormData({...formData, voice: e.target.value})}
                    rows={2}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={handleProvision}
                disabled={isProvisioning}
                className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProvisioning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Compilando Claims & Anclando a IPFS...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Ejecutar Aprovisionamiento Soberano
                  </>
                )}
              </button>
            </div>

            {/* Explainer */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/20 to-transparent border border-indigo-500/20 space-y-6">
              <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">¿Qué sucederá en el sistema?</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-indigo-400">1</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Extracción Determinística</h4>
                    <p className="text-xs text-zinc-400 mt-1">Se extraerá el precio del token, supply, e información legal del proyecto para crear FACT claims inmutables.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-indigo-400">2</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Contrato de IPFS</h4>
                    <p className="text-xs text-zinc-400 mt-1">El Tenant Claim Contract se anclará a la red IPFS (Pinata) y se firmará con la Wallet nativa del Agente.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-indigo-400">3</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Tenant Response Policy Gate</h4>
                    <p className="text-xs text-zinc-400 mt-1">Las barreras semánticas de protección se activarán. Hermes denegará promesas de "riesgo cero" o "ganancias fijas" para este tenant.</p>
                  </div>
                </li>
              </ul>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-2xl bg-[#14141E] border border-emerald-500/30 text-center space-y-6 shadow-2xl shadow-emerald-900/10"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">¡Aprovisionamiento Exitoso!</h2>
              <p className="text-zinc-400 mt-2 max-w-lg mx-auto">
                El ecosistema de inteligencia soberana para <strong>{project.title || project.slug}</strong> ha sido desplegado y asegurado criptográficamente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mt-8">
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.05]">
                <p className="text-xs text-zinc-500 font-mono mb-1">CLAIM CONTRACT CID (IPFS)</p>
                <p className="text-sm font-mono text-emerald-400 truncate" title={result.claimContractCid}>{result.claimContractCid}</p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.05]">
                <p className="text-xs text-zinc-500 font-mono mb-1">MERKLE ROOT</p>
                <p className="text-sm font-mono text-purple-400 truncate" title={result.merkleRoot}>{result.merkleRoot}</p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.05]">
                <p className="text-xs text-zinc-500 font-mono mb-1">AGENT SIGNER ADDRESS</p>
                <p className="text-sm font-mono text-zinc-300 truncate">{result.signerAddress}</p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.05]">
                <p className="text-xs text-zinc-500 font-mono mb-1">FACT CLAIMS COMPILADOS</p>
                <p className="text-sm font-mono text-zinc-300 truncate">{result.claimsCount} reglas determinísticas</p>
              </div>
            </div>

            <div className="pt-6">
              <Link 
                href="/admin"
                className="inline-flex py-3 px-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-medium text-sm transition-all border border-white/[0.1]"
              >
                Regresar al HQ
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
