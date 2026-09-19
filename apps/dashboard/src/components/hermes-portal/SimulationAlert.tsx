"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Rocket, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  projectId: string;
  isSimulationMode?: boolean | null;
}

export function SimulationAlert({ projectId, isSimulationMode }: Props) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const router = useRouter();

  if (!isSimulationMode) return null;

  const handleActivate = async () => {
    if (!confirm("¿Estás seguro de activar el Tenant? Esto borrará la data simulada visualmente y conectará el portal a producción real de forma irreversible.")) {
      return;
    }
    
    setIsActivating(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/activate`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Tenant activado exitosamente.");
        router.refresh(); // Refresh context and hide the alert
      } else {
        alert("Error al activar: " + (data.error || "Desconocido"));
        setIsActivating(false);
      }
    } catch (e) {
      alert("Error de red al activar el tenant.");
      setIsActivating(false);
    }
  };

  return (
    <AnimatePresence>
      {!isMinimized ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-4"
        >
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-amber-100 font-semibold mb-1">Modo Simulación Activo</h3>
            <p className="text-amber-200/80 text-sm mb-4 leading-relaxed">
              Tu portal está mostrando datos de prueba sintéticos para que visualices el diseño. 
              Ningún inversor real verá estos datos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleActivate}
                disabled={isActivating}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-amber-950 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
              >
                <Rocket className="w-4 h-4" />
                {isActivating ? "Activando..." : "Activar Tenant (Go Live)"}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="px-4 py-2 rounded-lg text-amber-300 hover:bg-amber-500/10 text-sm font-medium transition-colors"
              >
                Minimizar
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all group"
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium pr-1">Simulación</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
