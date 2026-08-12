'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Circle, HelpCircle, ChevronDown, ChevronUp, EyeOff } from 'lucide-react';

interface QuickStartBannerProps {
  hasIdentity?: boolean;
  hasEvidence?: boolean;
  hasProvider?: boolean;
  hasChannel?: boolean;
  onOpenGuide: () => void;
  onLogout?: () => void;
}

export function PortalQuickStartBanner({
  hasIdentity = true,
  hasEvidence = false,
  hasProvider = true,
  hasChannel = false,
  onOpenGuide,
  onLogout
}: QuickStartBannerProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('pandoras_quickstart_minimized');
    if (savedState === 'true') {
      setIsMinimized(true);
    }
  }, []);

  const toggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    localStorage.setItem('pandoras_quickstart_minimized', String(newState));
  };

  const steps = [
    { label: 'Identidad y Alma', completed: hasIdentity },
    { label: 'Capa de Evidencias', completed: hasEvidence },
    { label: 'Motor IA (LLM)', completed: hasProvider },
    { label: 'Canal (Telegram)', completed: hasChannel },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  if (isMinimized) {
    return (
      <div className="w-full bg-zinc-900/80 border border-purple-500/20 rounded-xl px-4 py-2 mb-4 flex items-center justify-between text-xs transition-all">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-zinc-300 font-medium">Setup Hermes OS:</span>
          <span className="font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30 text-[10px]">
            {progressPercent}% Completo
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenGuide}
            className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Guía
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold cursor-pointer ml-2"
            >
              Cerrar Sesión
            </button>
          )}
          <button
            onClick={toggleMinimize}
            className="text-zinc-400 hover:text-white flex items-center gap-1 font-mono text-[11px] cursor-pointer bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            Expandir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-purple-950/40 via-zinc-900/60 to-purple-950/40 border border-purple-500/20 rounded-2xl p-4 mb-6 shadow-[0_0_25px_rgba(147,51,234,0.15)] flex flex-col md:flex-row items-center justify-between gap-4 relative transition-all">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white">Configuración del Tenant Hermes OS</h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {progressPercent}% Completo
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Sigue estos pasos para gobernar al agente y conectar tus canales en tiempo real.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-xs">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-1.5 font-medium">
              {step.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Circle className="w-4 h-4 text-zinc-600" />
              )}
              <span className={step.completed ? 'text-zinc-200' : 'text-zinc-500'}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)] cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            Guía de Operador
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all cursor-pointer"
            >
              Cerrar Sesión
            </button>
          )}

          <button
            onClick={toggleMinimize}
            title="Minimizar barra de setup"
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
