'use client';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface PortalActivatedProps {
  tier: 'genesis' | 'standard' | string | null | undefined;
  onEnter: () => void;
}

/**
 * 🌀 Portal Activated Component
 * ============================================================================
 * The "Post-Login Threshold". This is the final stage of activation.
 * It provides psychological confirmation of entry into the ecosystem.
 * ============================================================================
 */
export default function PortalActivated({ tier, onEnter }: PortalActivatedProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 🔊 Bonus: Activation Sound (Protected - Browser Policy Safety)
    const hasInteracted = typeof window !== "undefined" && (window.navigator as any).userActivation?.hasBeenActive;

    if (hasInteracted) {
      try {
        const audio = new Audio('/sounds/activation.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (e) {
        // Silent fail for audio
      }
    }
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden z-[1000]">

      {/* 🔮 Glow Core - Pulse Animation */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full" 
      />

      {/* 📺 CRT Scan Lines Effect */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(transparent_95%,rgba(255,255,255,0.05)_100%)] bg-[size:100%_4px] pointer-events-none" />

      {/* 📄 Content Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
        animate={{ 
          opacity: visible ? 1 : 0, 
          scale: visible ? 1 : 0.95,
          filter: visible ? "blur(0px)" : "blur(10px)"
        }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10 text-center max-w-lg px-6"
      >

        <h1 className="text-[10px] tracking-[0.8em] text-gray-500 mb-8 uppercase animate-pulse">
          Access Protocol // Active
        </h1>

        {/* 🏢 Dynamic Tier-Based Messaging */}
        {tier === "genesis" ? (
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-thin tracking-[0.2em] text-white leading-tight uppercase">
              PORTAL <span className="text-lime-400">ACTIVADO</span>
            </h2>

            <p className="text-gray-400 text-lg font-light tracking-wide leading-relaxed max-w-xs mx-auto">
              Entraste en la <span className="text-white">primera ventana</span>.<br />
              Tu posición fue registrada en el bloque.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-thin tracking-[0.2em] text-white leading-tight uppercase">
              ACCESO <span className="text-blue-400">HABILITADO</span>
            </h2>

            <p className="text-gray-400 text-lg font-light tracking-wide leading-relaxed max-w-xs mx-auto">
              Tu identidad ha sido <span className="text-white">validada</span>.<br />
              El terminal está listo para operar.
            </p>
          </div>
        )}

        {/* 🚀 Final CTA - Enters System */}
        <div className="mt-12 group relative inline-block">
          <button
            onClick={onEnter}
            className="relative z-10 border border-white/20 bg-white/5 px-12 py-5 text-[10px] font-black tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-all duration-700 transform hover:scale-[1.05]"
          >
            ENTRAR AL SISTEMA
          </button>
          {/* Reflection Effect */}
          <div className="absolute inset-0 bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

      </motion.div>

      {/* 🔢 Micro Decoration */}
      <div className="absolute top-12 left-12 flex flex-col space-y-2 opacity-20">
         <div className="text-[8px] font-mono">NODE_SEQ: 0xFD21</div>
         <div className="w-12 h-[1px] bg-white" />
      </div>
    </div>
  );
}
