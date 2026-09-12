import React, { Suspense } from 'react';
import { ExperienceClient } from './ExperienceClient';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Hermes Experience (72h Real) | Pandoras Growth OS',
  description:
    '72 horas de Hermes Enterprise real — aislado, gobernado y listo para operar bajo tu marca.',
};

export default function HermesExperiencePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07070B] flex items-center justify-center text-white">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span>Cargando Hermes Experience...</span>
          </div>
        </div>
      }
    >
      <ExperienceClient />
    </Suspense>
  );
}
