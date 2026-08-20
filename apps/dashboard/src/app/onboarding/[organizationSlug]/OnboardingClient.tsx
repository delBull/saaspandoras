'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HermesIntelligencePanel } from '@/components/hermes-portal/overview/HermesIntelligencePanel';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function OnboardingClient({ organizationSlug, organizationName }: { organizationSlug: string, organizationName: string }) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // 1. Verificar el estado actual del Onboarding Workflow de Hermes
    async function checkState() {
      try {
        const res = await fetch(`/api/v1/internal/portal/messages?organizationSlug=${encodeURIComponent(organizationSlug)}`);
        if (res.ok) {
          const data = await res.json();
          // Si el estado es ACTIVATION, significa que el onboarding de Hermes concluyó.
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
        className="w-full max-w-4xl h-[85vh] max-h-[800px] flex flex-col shadow-2xl shadow-indigo-500/10 rounded-2xl overflow-hidden ring-1 ring-white/10"
      >
        <div className="bg-[#0C0C12] p-6 border-b border-white/5 shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Onboarding de Tenant</h1>
            <p className="text-sm text-zinc-400 mt-1">Hermes OS Concierge</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">En Línea</span>
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
