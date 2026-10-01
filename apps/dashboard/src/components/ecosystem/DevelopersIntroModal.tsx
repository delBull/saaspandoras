'use client';

import React, { useEffect, useState } from 'react';
import { Terminal, ShieldAlert, Code2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function DevelopersIntroModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('pandoras_dev_intro_seen');
    if (!hasSeen) {
      // Small delay for dramatic effect
      const t = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('pandoras_dev_intro_seen', 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[#09090E] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10"
            >
              {/* Header Illustration */}
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
              
              <div className="p-8 pb-6 relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 shadow-inner">
                  <Terminal className="w-7 h-7" />
                </div>
                
                <h2 className="text-2xl font-black text-white tracking-tight mb-3">
                  Ecosistema de Desarrolladores
                </h2>
                
                <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
                  <p>
                    Has entrado a la <strong>superficie de infraestructura técnica</strong> de Pandora's. Esta sección está diseñada estrictamente para ingenieros, arquitectos de software y constructores.
                  </p>
                  
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                    <div className="flex gap-3">
                      <Code2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <strong className="text-zinc-200 block mb-1">APIs y Webhooks</strong>
                        Aquí generarás las credenciales maestras (API Keys) que permiten conectar aplicaciones externas, tiendas, bots personalizados o sistemas contables directo a tu Tenant.
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-3 border-t border-white/5">
                      <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <strong className="text-zinc-200 block mb-1">Precaución Operativa</strong>
                        Las credenciales generadas aquí tienen acceso de lectura y escritura sobre tu organización. Trátalas con el mismo cuidado que la contraseña de tu banco.
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500">
                    Si no estás integrando código o configurando automatizaciones avanzadas (como Zapier o Make), probablemente no necesites modificar nada aquí.
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 relative z-10">
                <button
                  onClick={handleDismiss}
                  className="w-full group relative px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-sm transition-all overflow-hidden flex items-center justify-center gap-2"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10 flex items-center gap-2">
                    Entendido, soy responsable
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
