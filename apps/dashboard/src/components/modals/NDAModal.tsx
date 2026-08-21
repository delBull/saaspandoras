import { X, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { NDA_VERSION, NDA_TITLE, NDA_FULL_TEXT, NDA_SUMMARY_BULLETS } from "@/lib/nexus-deals/nda-content";

interface NDAModalProps {
  isOpen: boolean;
  onClose: () => void;
  version?: string;
}

export function NDAModal({ isOpen, onClose, version = NDA_VERSION }: NDAModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[9999] w-screen h-screen md:w-full md:h-[85vh] md:max-w-4xl md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-[#0C0C10] border-0 md:border md:border-zinc-800/60 rounded-none md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-zinc-900/40 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  {NDA_TITLE}
                </h2>
                <p className="text-sm text-zinc-500 font-mono mt-0.5">
                  Versión: {version}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <div className="space-y-6">
                {/* Summary Box */}
                <div className="p-4 bg-amber-500/[0.04] rounded-xl border border-amber-500/20 text-xs">
                  <p className="font-semibold text-amber-300 uppercase tracking-wider mb-2 font-mono">
                    Compromisos Clave de Confidencialidad
                  </p>
                  <ul className="space-y-1.5 text-zinc-300">
                    {NDA_SUMMARY_BULLETS.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Full NDA Text Single Source of Truth */}
                <div className="p-6 bg-black/40 rounded-xl border border-white/10 font-mono text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap selection:bg-amber-500/30">
                  {NDA_FULL_TEXT}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/40 flex items-center justify-between">
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="gap-2 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs font-mono"
              >
                <Printer className="w-3.5 h-3.5" />
                Descargar / Imprimir NDA (PDF)
              </Button>
              <Button onClick={onClose} variant="secondary">
                Cerrar documento
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
