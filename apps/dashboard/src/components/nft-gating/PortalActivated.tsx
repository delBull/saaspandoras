'use client';

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PortalActivatedProps {
  tier: 'genesis' | 'standard' | string | null | undefined;
  hasAccess: boolean;
  onEnter: () => void;
  onShowHowItWorks?: () => void;
}

/**
 * 🌀 Portal Activated — Post-Mint Ritual (Optimized)
 * ============================================================================
 * Orden emocional: Confirmación → Revelación → Capital
 * Aplicando feedback psicológico: Contundencia, Exclusividad, Encuadre Financiero.
 * ============================================================================
 */
export default function PortalActivated({ tier, hasAccess, onEnter, onShowHowItWorks }: PortalActivatedProps) {
  const [phase, setPhase] = useState<'confirm' | 'reveal' | 'capital'>('confirm');
  const [visible, setVisible] = useState(false);
  const isGenesis = tier === 'genesis';

  useEffect(() => {
    // Activation sound
    const hasInteracted = typeof window !== 'undefined' && (window.navigator as any).userActivation?.hasBeenActive;
    if (hasInteracted) {
      try {
        const audio = new Audio('/sounds/activation.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => { });
      } catch { /* silent */ }
    }
    setTimeout(() => setVisible(true), 300);
  }, []);

  const handleNextPhase = (next: 'reveal' | 'capital') => {
    // Strategic delay for emotional weight
    setTimeout(() => setPhase(next), 800);
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden z-[1000]">
      {/* Glow */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] blur-[80px] md:blur-[140px] rounded-full ${isGenesis ? 'bg-lime-400/8' : 'bg-lime-500/8'}`}
      />
      {/* Scanlines */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.3) 1px, rgba(255,255,255,0.3) 2px)', backgroundSize: '100% 4px' }} />

      <AnimatePresence mode="wait">

        {/* ── FASE 1: CONFIRMACIÓN (Contundente) ─────────────────────────── */}
        {phase === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.92, filter: 'blur(12px)' }}
            animate={{ opacity: visible ? 1 : 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="relative z-10 text-center max-w-md px-6 space-y-6 md:space-y-10"
          >
            <div className="space-y-2">
              <p className="text-[9px] tracking-[1em] text-zinc-600 uppercase animate-pulse">
                Access Protocol // Active
              </p>
              <p className="text-[8px] font-mono text-zinc-700 tracking-[0.2em] opacity-40">
                ACCESS ID: #A7F3-9{isGenesis ? '1' : '0'}
              </p>
            </div>

            {isGenesis ? (
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-lime-500/30 bg-lime-500/5 rounded-full mx-auto">
                  <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                  <span className="text-[9px] font-bold tracking-[0.3em] text-lime-400 uppercase">Genesis Access</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-thin tracking-[0.1em] md:tracking-[0.15em] text-white leading-tight uppercase">
                  Acceso confirmado.
                </h2>
                <p className="text-xl font-light text-lime-400 tracking-wide">
                  Estás dentro antes que el resto.
                </p>
                <p className="text-zinc-500 text-sm font-light leading-loose border-t border-white/5 pt-6">
                  Tu posición ya fue registrada.<br />
                  <span className="text-zinc-400">No compartas esto.</span>
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-lime-500/30 bg-lime-500/5 rounded-full mx-auto">
                  <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                  <span className="text-[9px] font-bold tracking-[0.3em] text-lime-400 uppercase">Early Access</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-thin tracking-[0.1em] md:tracking-[0.15em] text-white leading-tight uppercase">
                  Acceso confirmado.
                </h2>
                <p className="text-xl font-light text-lime-400 tracking-wide">
                  Tu posición ha sido registrada.
                </p>
                <p className="text-zinc-500 text-sm font-light leading-loose border-t border-white/5 pt-6">
                  No todos avanzan a la siguiente fase.<br />
                  <span className="text-zinc-400">Tu nivel define lo que puedes operar.</span>
                </p>
              </div>
            )}

            <motion.button
              onClick={() => handleNextPhase('reveal')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center gap-3 border border-white/20 bg-white/5 px-10 py-4 text-[10px] font-black tracking-[0.4em] uppercase text-white transition-all duration-500 hover:bg-white hover:text-black"
            >
              Explorar tu acceso
              <span className="opacity-40 group-hover:opacity-100 transition-opacity">→</span>
            </motion.button>
          </motion.div>
        )}

        {/* ── FASE 2: REVELACIÓN (Exclusividad) ──────────────────────────── */}
        {phase === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.9 }}
            className="relative z-10 text-center max-w-md px-6 space-y-6 md:space-y-10"
          >
            <p className="text-[9px] tracking-[0.8em] text-zinc-600 uppercase">Lo que hay adentro</p>

            <div className="space-y-4">
              <p className="text-2xl sm:text-3xl font-thin text-white tracking-wide leading-snug">
                No todo es visible<br />desde el inicio.
              </p>
              <p className="text-zinc-500 text-xs tracking-widest uppercase font-light">
                Esto no aparece para todos los usuarios.
              </p>
            </div>

            <div className="border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 text-left space-y-4 text-sm text-zinc-400 font-light">
              {[
                'Pools internos con ventajas acumulativas',
                'Protocolos en fase temprana',
                'Distribuciones no públicas',
              ].map((item, i) => (
                <motion.p
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-zinc-700 font-mono">—</span>
                  {item}
                </motion.p>
              ))}
            </div>

            <motion.button
              onClick={() => handleNextPhase('capital')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-3 border border-white/20 bg-white/5 px-10 py-4 text-[10px] font-black tracking-[0.4em] uppercase text-white transition-all duration-500 hover:bg-white hover:text-black"
            >
              Continuar
              <span className="opacity-40 group-hover:opacity-100 transition-opacity">→</span>
            </motion.button>
          </motion.div>
        )}

        {/* ── FASE 3: CAPITAL (Financiero) ────────────────────────────────── */}
        {phase === 'capital' && (
          <motion.div
            key="capital"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="relative z-10 text-center max-w-md px-6 space-y-6 md:space-y-10"
          >
            <div className="space-y-3">
              <p className="text-[9px] tracking-[0.8em] text-zinc-600 uppercase">Decide</p>
              <p className="text-2xl sm:text-3xl font-thin text-white tracking-wide">
                Los primeros no solo<br />entran antes.
              </p>
              <p className="text-xl sm:text-2xl font-thin text-zinc-400">
                Definen dónde se mueve el capital.
              </p>
            </div>

            <div className="space-y-4">
              {/* Opción A */}
              <div className="space-y-2">
                <motion.button
                  onClick={hasAccess ? onEnter : undefined}
                  disabled={!hasAccess}
                  whileHover={{ backgroundColor: hasAccess ? '#a3e635' : '#18181b', color: hasAccess ? '#000' : '#3f3f46', scale: hasAccess ? 1.02 : 1 }}
                  whileTap={{ scale: hasAccess ? 0.97 : 1 }}
                  className={`w-full py-5 text-[10px] tracking-[0.4em] uppercase border transition-all duration-300 font-bold ${hasAccess ? "border-white/20 bg-transparent text-white cursor-pointer" : "border-zinc-900 bg-zinc-950 text-zinc-700 cursor-not-allowed opacity-50"
                    }`}
                >
                  {hasAccess ? "Entrar al sistema" : "En cola de acceso"}
                </motion.button>
                <p className={`text-[9px] tracking-wide uppercase px-4 ${hasAccess ? 'text-zinc-500' : 'text-lime-500/60'}`}>
                  {hasAccess ? "Acceso preferente. Condiciones no públicas." : "Tu rastro ha sido verificado. Espera la señal de apertura."}
                </p>
              </div>

              {/* Separador */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-zinc-900" />
                <span className="text-[8px] text-zinc-800 tracking-widest uppercase">o</span>
                <div className="flex-1 h-px bg-zinc-900" />
              </div>

              {/* Opción B */}
              <div className="space-y-2">
                <button
                  onClick={onShowHowItWorks || onEnter}
                  className="w-full py-4 text-[10px] tracking-[0.3em] uppercase border border-zinc-900 text-zinc-600 hover:text-zinc-300 hover:border-zinc-700 transition-all font-bold"
                >
                  Entender cómo funciona
                </button>
                <p className="text-[9px] text-zinc-700 tracking-wide uppercase px-4">
                  Documentación del protocolo. Sin intermediarios.
                </p>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Decoración técnica - Hide on mobile */}
      <div className="absolute top-10 left-10 opacity-15 hidden sm:block">
        <div className="text-[7px] font-mono text-zinc-600">NODE_SEQ: 0xFD21</div>
        <div className="w-10 h-[1px] bg-zinc-700 mt-1" />
      </div>
    </div>
  );
}
