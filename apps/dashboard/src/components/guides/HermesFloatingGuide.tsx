'use client';

/**
 * 🧭 HERMES FLOATING GUIDE (ECOSYSTEM RECONNAISSANCE TOUR)
 * apps/dashboard/src/components/guides/HermesFloatingGuide.tsx
 *
 * Interactive, non-intrusive floating guide powered by Hermes AI.
 * Uses cinematic backdrop dimming (bg-black/60 backdrop-blur-sm) to focus attention
 * without breaking DOM layouts or using fragile spotlights.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Handshake,
  Briefcase,
  ShieldCheck,
  Globe,
  Cpu,
  GraduationCap,
  Bot,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  X,
  Send,
  HelpCircle,
  CheckCircle2,
  Compass,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';
import {
  EcosystemStation,
  EcosystemTourRole,
  getStationsForRole,
  getHermesAnswerForStation,
} from '@/lib/guides/ecosystem-guides.data';

interface HermesFloatingGuideProps {
  role?: EcosystemTourRole;
  customStations?: EcosystemStation[];
  titleOverride?: string;
  isOpen: boolean;
  onClose: () => void;
  onFinish?: () => void;
  initialStationIndex?: number;
}

export function HermesFloatingGuide({
  role = 'SUPER_ADMIN',
  customStations,
  titleOverride,
  isOpen,
  onClose,
  onFinish,
  initialStationIndex = 0,
}: HermesFloatingGuideProps) {
  const stations = customStations && customStations.length > 0 ? customStations : getStationsForRole(role);
  const [currentIndex, setCurrentIndex] = useState(initialStationIndex);
  const [userQuery, setUserQuery] = useState('');
  const [hermesReply, setHermesReply] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  if (!isOpen || stations.length === 0) return null;

  const currentStation = stations[Math.min(currentIndex, stations.length - 1)];
  if (!currentStation) return null;

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === stations.length - 1;
  const progressPercent = Math.round(((currentIndex + 1) / stations.length) * 100);

  const getStationIcon = (iconName: string) => {
    switch (iconName) {
      case 'Handshake':
        return <Handshake className="w-5 h-5 text-amber-400" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-emerald-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-violet-400" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-blue-400" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-purple-400" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-rose-400" />;
      default:
        return <Compass className="w-5 h-5 text-amber-400" />;
    }
  };

  const handleNext = () => {
    setHermesReply(null);
    setUserQuery('');
    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (onFinish) onFinish();
      onClose();
    }
  };

  const handlePrev = () => {
    setHermesReply(null);
    setUserQuery('');
    if (!isFirst) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleAskHermes = (queryText?: string) => {
    const textToAsk = queryText || userQuery;
    if (!textToAsk.trim()) return;

    setIsAsking(true);
    // Instant smart response from station knowledge engine
    const answer = getHermesAnswerForStation(currentStation, textToAsk);
    setTimeout(() => {
      setHermesReply(answer);
      setIsAsking(false);
    }, 200);
  };

  const handleResetDialog = () => {
    setHermesReply(null);
    setUserQuery('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        {/* ── CINEMATIC BACKDROP DIMMING (NO DOM-INTRUSIVE SPOTLIGHTS) ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
        />

        {/* ── HERMES FLOATING COMMAND CARD ── */}
        <motion.div
          key={currentStation.id}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative z-10 w-full max-w-2xl bg-[#0F0F16] border border-white/15 rounded-3xl shadow-2xl shadow-purple-950/40 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Progress Bar */}
          <div className="w-full bg-white/5 h-1.5 relative overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 via-purple-500 to-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Header Bar */}
          <div className="p-5 sm:px-6 sm:py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-600/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-inner">
                  <Bot className="w-5 h-5 animate-pulse" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0F0F16]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                    Hermes Guide
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 font-mono">
                    {titleOverride || `Rol: ${role}`}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Estación {currentIndex + 1} de {stations.length} · {progressPercent}% Completado
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              title="Cerrar Guía"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content (Scrollable if needed) */}
          <div className="p-6 overflow-y-auto space-y-5 text-sm">
            {/* Station Title & Badge */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  {getStationIcon(currentStation.iconName)}
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-amber-400/90 uppercase font-semibold">
                    {currentStation.category}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {currentStation.title}
                  </h3>
                </div>
              </div>
              <p className="text-xs text-zinc-400 pl-11">{currentStation.subtitle}</p>
            </div>

            {/* Hermes Dialogue Bubble */}
            <div className="relative rounded-2xl bg-gradient-to-br from-amber-500/[0.04] to-purple-600/[0.04] border border-amber-500/20 p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>{currentStation.hermesGreeting}</span>
              </div>

              <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed font-sans">
                {hermesReply ? hermesReply : currentStation.hermesNarrative}
              </p>

              {hermesReply && (
                <button
                  onClick={handleResetDialog}
                  className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 pt-1 font-mono"
                >
                  <RotateCcw className="w-3 h-3" />
                  Volver a la explicación general
                </button>
              )}
            </div>

            {/* Key Highlights */}
            {!hermesReply && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
                  Capacidades Clave de esta Estación
                </span>
                <div className="space-y-2">
                  {currentStation.keyHighlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-zinc-300 bg-white/[0.02] border border-white/5 rounded-xl p-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Q&A with Hermes */}
            <div className="space-y-2.5 pt-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                Preguntas Rápidas a Hermes
              </span>

              {/* Quick FAQ Chips */}
              <div className="flex flex-wrap gap-1.5">
                {currentStation.faqs.map((faq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskHermes(faq.question)}
                    className="text-[11px] bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/30 border border-white/10 text-zinc-300 hover:text-amber-200 rounded-lg px-2.5 py-1.5 transition-all text-left truncate max-w-full"
                  >
                    💬 {faq.question}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskHermes()}
                    placeholder="Haz una pregunta específica sobre esta sección..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <button
                  onClick={() => handleAskHermes()}
                  disabled={isAsking || !userQuery.trim()}
                  className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Consultar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Navigation Bar */}
          <div className="p-4 sm:px-6 bg-[#0B0B10] border-t border-white/10 flex items-center justify-between gap-3">
            {/* Direct Link to Station */}
            <a
              href={currentStation.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-all shadow-sm"
              title="Abre la estación en una pestaña secundaria sin perder el recorrido"
            >
              <span>Explorar esta estación</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>

            {/* Stepper Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={isFirst}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20"
              >
                <span>{isLast ? 'Finalizar Recorrido' : 'Siguiente Estación'}</span>
                {isLast ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
