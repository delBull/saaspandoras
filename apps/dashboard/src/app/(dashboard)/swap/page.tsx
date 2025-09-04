'use client';

import React from "react";
import { CustomSwap } from "@/components/CustomSwap"; // Importamos el nuevo componente

// --- Página Principal (Ahora mucho más limpia) ---
export default function SwapPage() {
  return (
    <section className="flex flex-col items-center justify-start min-h-[70vh] py-32 px-10 md:px-0">
      <div className="relative w-full max-w-xl bg-gradient-to-br from-[#18181b] to-[#23272d] rounded-3xl md:rounded-[2.5rem] px-2 md:px-8 py-8 shadow-2xl border-2 border-lime-300/10 mx-auto">
        <h1 className="text-2xl md:text-4xl font-bold text-white text-center mb-3">
          Swap & Bridge de Tokens
        </h1>
        <p className="text-sm text-center text-gray-400 mb-6">
          Intercambia y puentea tokens entre redes EVM con la mejor tasa disponible.
        </p>
        
        <CustomSwap />
        
        <div className="mt-4 mb-1 text-xs text-center text-gray-400">
          <span>
            Se cobra una comisión de 0.5% por swap, destinada a financiar el desarrollo y liquidez del protocolo.
          </span>
        </div>
      </div>
    </section>
  );
}