'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  TrendingUp,
  Layers,
  CheckCircle2,
  Circle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { EcosystemSetupSummary, ModuleSetupState } from '@/lib/mesh/setup-progress.service';

interface SetupDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  setupSummary: EcosystemSetupSummary | null;
  onActivateModule?: (productKey: 'HERMES' | 'GROWTH_OS' | 'PANDORAS_RWA') => void;
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  HERMES: <Sparkles className="w-5 h-5 text-emerald-400" />,
  GROWTH_OS: <TrendingUp className="w-5 h-5 text-violet-400" />,
  PANDORAS_RWA: <Layers className="w-5 h-5 text-sky-400" />,
};

const MODULE_COLORS: Record<string, { badge: string; bar: string }> = {
  HERMES: {
    badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
  },
  GROWTH_OS: {
    badge: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    bar: 'bg-gradient-to-r from-violet-500 to-purple-400',
  },
  PANDORAS_RWA: {
    badge: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    bar: 'bg-gradient-to-r from-sky-500 to-indigo-400',
  },
};

export function SetupDrawer({ isOpen, onClose, setupSummary, onActivateModule }: SetupDrawerProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!setupSummary) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Slide-over Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-lg bg-[#0A0C14] border-l border-zinc-800/80 shadow-2xl flex flex-col h-full z-10 text-white overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                    Sovereign Mesh Setup Engine
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">Configuración del Ecosistema</h2>
                <p className="text-xs text-zinc-400">Guía de puesta en marcha para tus módulos soberanos.</p>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                aria-label="Cerrar asistente"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Global Progress Bar Card */}
            <div className="p-6 border-b border-zinc-800/60 bg-gradient-to-b from-indigo-950/20 to-transparent">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Progreso Global</span>
                <span className="text-sm font-mono font-bold text-emerald-400">{setupSummary.overallPercentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${setupSummary.overallPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">
                {setupSummary.completedModules} de {setupSummary.totalActiveModules} módulos completamente operativos.
              </p>
            </div>

            {/* Modules Setup Checklist */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
              {setupSummary.modules.map((mod) => {
                const colorConfig = MODULE_COLORS[mod.productKey] || {
                  badge: 'text-zinc-400 bg-zinc-800',
                  bar: 'bg-indigo-500',
                };
                const isAvailable = mod.status === 'AVAILABLE';

                return (
                  <div
                    key={mod.productKey}
                    className={`rounded-2xl border p-5 transition-all ${
                      isAvailable
                        ? 'bg-zinc-950/40 border-zinc-800/60 opacity-80'
                        : 'bg-zinc-900/60 border-zinc-800/80 shadow-lg'
                    }`}
                  >
                    {/* Module Title & Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
                          {MODULE_ICONS[mod.productKey]}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{mod.title}</h3>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${colorConfig.badge}`}>
                            {mod.status}
                          </span>
                        </div>
                      </div>

                      {!isAvailable && (
                        <span className="text-xs font-mono font-bold text-zinc-300">
                          {mod.completedSteps}/{mod.totalSteps}
                        </span>
                      )}
                    </div>

                    {/* Progress bar per module */}
                    {!isAvailable && (
                      <div className="mb-4">
                        <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/60">
                          <div
                            className={`h-full ${colorConfig.bar}`}
                            style={{ width: `${mod.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Checklist Steps */}
                    {!isAvailable ? (
                      <div className="space-y-2.5">
                        {mod.checklist.map((step) => (
                          <div
                            key={step.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                              step.isCompleted
                                ? 'bg-emerald-950/10 border-emerald-500/20'
                                : 'bg-black/30 border-zinc-800/80 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              {step.isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                              )}
                              <div className="min-w-0">
                                <p className={`text-xs font-semibold truncate ${step.isCompleted ? 'text-zinc-200 line-through opacity-70' : 'text-zinc-200'}`}>
                                  {step.title}
                                </p>
                                <p className="text-[11px] text-zinc-500 truncate">{step.description}</p>
                              </div>
                            </div>

                            <a
                              href={step.actionUrl}
                              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                                step.isCompleted
                                  ? 'bg-zinc-800 text-zinc-400 hover:text-white'
                                  : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30'
                              }`}
                            >
                              <span>{step.actionLabel}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="pt-2 flex items-center justify-between">
                        <p className="text-xs text-zinc-500">Módulo no instalado en este tenant.</p>
                        <button
                          onClick={() => onActivateModule?.(mod.productKey)}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Activar Módulo</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-zinc-800/80 bg-zinc-900/40 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Cerrar Asistente
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
