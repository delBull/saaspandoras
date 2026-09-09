import React, { Suspense } from 'react';
import { SimulatorClient } from './SimulatorClient';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function HermesSimulatorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07070B] flex items-center justify-center text-white">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span>Iniciando Hermes Sales Simulator...</span>
          </div>
        </div>
      }
    >
      <SimulatorClient />
    </Suspense>
  );
}
