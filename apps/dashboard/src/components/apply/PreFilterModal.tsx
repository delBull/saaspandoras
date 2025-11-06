'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Settings, AlertTriangle, DollarSign, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  formType: 'multi-step' | 'conversational' | null;
}

export function PreFilterModal({ isOpen, onClose, onProceed }: PreFilterModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4 border-b border-zinc-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    📝
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      El Manifiesto del Creador: ¿Estás Listo para la Utilidad?
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Antes de invertir 15 minutos en configurar tu protocolo, confirma que estás comprometido con construir utilidad real para tu comunidad.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                {/* Sección 1: Tiempo Estimado */}
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-lime-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white mb-2">Tiempo Estimado</h3>
                      <p className="text-sm text-gray-300">
                        Tiempo estimado: <span className="font-semibold text-lime-400">10-15 minutos</span>.
                        El formulario es conversacional, pero requiere concentración para definir tu estrategia.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sección 2: Pasos de Configuración */}
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Settings className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white mb-3">Pasos de Configuración</h3>
                      <p className="text-sm text-gray-300 mb-3">
                        Tu compromiso se divide en <span className="font-semibold text-blue-400">3 Fases de Diseño</span>:
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 font-semibold">1.</span>
                          <span className="text-gray-300"><strong>Identidad:</strong> Quién eres y cómo te encuentran.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 font-semibold">2.</span>
                          <span className="text-gray-300"><strong>Estrategia:</strong> La Utilidad, la Labor y la Sostenibilidad.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 font-semibold">3.</span>
                          <span className="text-gray-300"><strong>Implementación:</strong> La economía y las reglas de Adopción.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección 3: Reconocimiento Clave */}
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white mb-2">Reconocimiento Clave</h3>
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold text-yellow-400">Punto de Filtro:</span> Para proceder, debes tener clara la mecánica de utilidad, no solo la recaudación.
                        Estamos aquí para construir <span className="font-semibold text-yellow-400">Comunidad</span>, no solo capital.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sección 4: Costos de Plataforma */}
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white mb-2">Costos de Plataforma (Pandora&apos;s)</h3>
                      <p className="text-sm text-gray-300">
                        Entiendo que la activación de mi Protocolo puede incurrir en <span className="font-semibold text-green-400">tarifas de configuración (setup fees)</span> o <span className="font-semibold text-green-400">cargos recurrentes de la plataforma (SaaS)</span> por el uso de la infraestructura &apos;no-code&apos;.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sección 5: Costos de Red */}
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white mb-2">Costos de Red (Blockchain)</h3>
                      <p className="text-sm text-gray-300">
                        Soy responsable de cubrir <span className="font-semibold text-blue-400">todos los costos de gas (fees de red)</span> para la creación de smart contracts y cualquier emisión/transacción posterior de Artefactos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sección 6: Costos Operativos */}
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white mb-2">Costos Operativos (Crecimiento)</h3>
                      <p className="text-sm text-gray-300">
                        Soy responsable de cubrir <span className="font-semibold text-purple-400">todos los gastos para la ejecución de la Utilidad</span>, incluyendo marketing Web3 especializado, campañas de adopción, diseño de landing pages de minteo (si es independiente) y desarrollo de contenido.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-8 pt-4 border-t border-zinc-700">
                <div className="flex flex-col sm:flex-row gap-3 justify-end mt-4">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-zinc-600 text-gray-300 hover:bg-zinc-800"
                  >
                    Volver Atrás
                  </Button>
                  <Button
                    onClick={onProceed}
                    className="bg-gradient-to-r from-lime-500 to-emerald-500 text-black font-bold hover:from-lime-400 hover:to-emerald-400 transition-all duration-300 flex items-center gap-2"
                  >
                    Comenzar la Configuración del Protocolo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Al continuar, reconoces tu compromiso con construir utilidad real para tu comunidad.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
