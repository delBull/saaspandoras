'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import type { TourStep } from './TourEngine';

interface MobileTourOverlayProps {
  isOpen: boolean;
  steps: TourStep[];
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
}

export function MobileTourOverlay({ 
  isOpen, 
  steps, 
  currentStepIndex, 
  onNext, 
  onPrev, 
  onFinish 
}: MobileTourOverlayProps) {
  
  if (!isOpen || steps.length === 0) return null;

  const step = steps[currentStepIndex];
  if (!step) return null;

  const isLast = currentStepIndex === steps.length - 1;
  const isAction = step.type === 'ACTION' && step.isMandatory;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end bg-black/80 backdrop-blur-sm sm:hidden font-sans">
      
      {/* Optional: Skip button if it's not a mandatory action */}
      {!isAction && (
        <button 
          onClick={onFinish}
          className="absolute top-6 right-6 p-2 bg-white/10 text-white/70 hover:text-white rounded-full backdrop-blur-md transition-colors"
        >
          <X size={20} />
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-[#0C0C12] border-t border-white/10 p-6 pb-10 w-full rounded-t-[2rem] shadow-[0_-10px_40px_rgba(124,58,237,0.1)] relative"
        >
          {/* Progress Indicators */}
          <div className="flex gap-1.5 mb-6">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                  idx === currentStepIndex ? 'bg-violet-500' : 
                  idx < currentStepIndex ? 'bg-violet-500/50' : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          <h2 className="text-xl font-bold text-white mb-3">
            {step.title}
          </h2>
          
          <div 
            className="text-sm text-white/70 leading-relaxed mb-8"
            dangerouslySetInnerHTML={{ __html: step.content }}
          />

          {step.id === 'omnichannel_connection' && (
            <div className="flex flex-col gap-3 mb-8">
              <a 
                href={`https://t.me/${process.env.NEXT_PUBLIC_HERMES_TELEGRAM_BOT_USERNAME || "HermesOSBot"}?start=portal_auth`}
                target="_blank" 
                rel="noreferrer"
                className="w-full flex items-center justify-center py-3.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl font-semibold active:scale-[0.98] transition-all"
              >
                Conectar vía Telegram
              </a>
              <a 
                href={`https://wa.me/${process.env.NEXT_PUBLIC_HERMES_WHATSAPP_PHONE_NUMBER || "1234567890"}?text=Hola+Hermes`}
                target="_blank" 
                rel="noreferrer"
                className="w-full flex items-center justify-center py-3.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl font-semibold active:scale-[0.98] transition-all"
              >
                Conectar vía WhatsApp
              </a>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            {!isAction && (
              <button
                onClick={onPrev}
                disabled={currentStepIndex === 0}
                className={`p-3 rounded-xl border border-white/10 flex items-center justify-center transition-all ${
                  currentStepIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 active:bg-white/10 text-white'
                }`}
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {!isAction ? (
              <button
                onClick={isLast ? onFinish : onNext}
                className="flex-1 bg-white text-black py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-[0.98] transition-all"
              >
                {isLast ? 'Finalizar' : 'Siguiente'}
                {!isLast && <ChevronRight size={18} />}
              </button>
            ) : (
              <div className="w-full p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs text-center font-medium animate-pulse">
                Completa la acción en pantalla para continuar...
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
