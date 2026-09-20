"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function DealError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Deal room error:", error);
  }, [error]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#08080A] flex flex-col items-center justify-center text-white p-6">
      <div className="max-w-md w-full bg-[#121217] border border-white/10 rounded-2xl p-8 text-center shadow-xl">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        
        <h2 className="text-xl font-semibold mb-2">Error de Aplicación</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Ha ocurrido un error inesperado al cargar el Deal Room. Si el problema persiste, contacta a soporte.
        </p>
        
        <div className="p-4 bg-black/40 rounded-lg text-left mb-6 border border-white/5 overflow-x-auto">
          <p className="text-xs font-mono text-rose-400 whitespace-pre-wrap break-all">
            {error.message || "Unknown error"}
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="w-full py-3 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl font-mono text-sm tracking-wide transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          INTENTAR DE NUEVO
        </button>
      </div>
    </div>
  );
}
