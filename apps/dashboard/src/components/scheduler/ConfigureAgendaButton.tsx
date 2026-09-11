'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Sliders, Sparkles } from 'lucide-react';
import { SovereignAgendaDrawer } from './SovereignAgendaDrawer';

interface ConfigureAgendaButtonProps {
  tenantSlug?: string;
  vertical?: 'HERMES' | 'GROWTH_OS' | 'PANDORAS_RWA';
  userRole?: string;
  className?: string;
  variant?: 'primary' | 'outline' | 'compact';
}

export function ConfigureAgendaButton({
  tenantSlug = 'pandoras',
  vertical = 'HERMES',
  userRole = 'ADMIN',
  className = '',
  variant = 'primary',
}: ConfigureAgendaButtonProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const res = await fetch(`/api/v1/scheduling/config?tenantSlug=${tenantSlug}`);
        const data = await res.json();
        if (isMounted && data.ok && data.config) {
          setIsConfigured(Boolean(data.config.isActive));
        }
      } catch {
        if (isMounted) setIsConfigured(false);
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        className={`group relative inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm ${
          variant === 'outline'
            ? 'bg-zinc-900/80 hover:bg-zinc-800 border border-[#D4A853]/30 text-zinc-200 hover:text-white'
            : variant === 'compact'
            ? 'bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1.5'
            : 'bg-gradient-to-r from-zinc-900 to-zinc-950 hover:from-zinc-850 hover:to-zinc-900 border border-[#D4A853]/40 text-[#D4A853] hover:border-[#D4A853]/70 hover:shadow-[0_0_15px_rgba(212,168,83,0.15)]'
        } ${className}`}
      >
        <div className="relative">
          <Calendar className="w-4 h-4 text-[#D4A853] group-hover:scale-110 transition-transform" />
          {isConfigured && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-zinc-950 animate-pulse" />
          )}
        </div>

        <span className="tracking-wide">
          {isConfigured ? 'Agenda Soberana (Configurada)' : 'Configurar Agenda Soberana'}
        </span>

        {isConfigured && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            ✓ Activa
          </span>
        )}
      </button>

      <SovereignAgendaDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        tenantSlug={tenantSlug}
        userRole={userRole}
        onConfigSaved={() => setIsConfigured(true)}
      />
    </>
  );
}
