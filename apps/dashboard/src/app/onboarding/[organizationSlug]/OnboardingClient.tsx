'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HermesIntelligencePanel } from '@/components/hermes-portal/overview/HermesIntelligencePanel';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function OnboardingClient({ organizationSlug, organizationName }: { organizationSlug: string, organizationName: string }) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    // 1. Verificar el estado actual del Onboarding Workflow de Hermes
    async function checkState() {
      try {
        const res = await fetch(`/api/v1/internal/portal/messages?organizationSlug=${encodeURIComponent(organizationSlug)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.stage === 'ACTIVATION') {
            router.push(`/portal/${organizationSlug}`);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching Hermes Onboarding state', err);
      } finally {
        setIsVerifying(false);
      }
    }
    
    checkState();

    // 2. Poll state occasionally to perform automatic handoff if state changes
    const interval = setInterval(checkState, 10000);
    return () => clearInterval(interval);
  }, [organizationSlug, router]);

  const handleBulkActivate = async () => {
    setIsActivating(true);
    toast.loading('Activando conocimiento gobernado de Hermes...', { id: 'bulk-act' });
    try {
      const res = await fetch('/api/v1/internal/portal/knowledge/bulk-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al activar conocimiento');
      }

      toast.success(data.message || '¡Conocimiento activado con éxito!', { id: 'bulk-act' });
      router.push(`/portal/${organizationSlug}`);
    } catch (err: any) {
      toast.error(err.message || 'Error en la activación', { id: 'bulk-act' });
    } finally {
      setIsActivating(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-zinc-400 animate-pulse font-medium">Sincronizando contexto...</p>
      </div>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 min-h-screen relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#08080A] to-[#08080A]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-4xl h-[90vh] max-h-[900px] flex flex-col shadow-2xl shadow-indigo-500/10 rounded-2xl overflow-hidden ring-1 ring-white/10"
      >
        <div className="bg-[#0C0C12] p-5 border-b border-white/5 shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Onboarding de Tenant</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">{organizationName}</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">Hermes OS Discovery Concierge</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-widest">En Línea</span>
            </div>
            <button
              onClick={handleBulkActivate}
              disabled={isActivating}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {isActivating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Aprobar y Activar Hermes</span>
            </button>
          </div>
        </div>

        {/* Banner Explicativo de Gobernanza */}
        <div className="bg-indigo-950/40 border-b border-indigo-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>¿Por qué activar?</strong> Al activar el conocimiento descubierto, Hermes adquiere autoridad oficial para responder a tus clientes en WhatsApp, Telegram y Web basándose estrictamente en estos hechos corporativos sin alucinaciones.
            </span>
          </div>
        </div>
        
        {/* Usamos el componente persistente del chat pero en un contenedor inmersivo */}
        <div className="flex-1 bg-[#12121A] flex flex-col min-h-0 relative">
          <HermesIntelligencePanel organizationSlug={organizationSlug} organizationName={organizationName} />
        </div>
      </motion.div>
    </main>
  );
}
