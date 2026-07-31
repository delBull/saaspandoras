'use client';

import { motion } from 'framer-motion';

function GridBg() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.018]"
      style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />
  );
}

export default function LibroVIClient({ token }: { token: string }) {
  return (
    <main className="bg-[#060606] text-white selection:bg-white/10">
      <GridBg />
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#060606] px-6">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4 }} className="text-center max-w-4xl">
          <p className="text-[9px] uppercase tracking-[0.7em] text-zinc-700 mb-16">Pandoras Holdings · Confidencial</p>
          <p className="text-xs uppercase tracking-[0.5em] text-purple-400/80 mb-4">Libro VI</p>
          <h1 className="text-5xl md:text-7xl font-thin tracking-tight text-white mb-6">Technology Platform & Capital Engine</h1>
          <p className="text-zinc-500 text-sm font-light max-w-md mx-auto mb-16">
            Growth OS, Capital Engine, Dual Payment Processing (Thirdweb + Blokko) & Data Assets
          </p>

          <div className="border border-white/[0.05] p-6 rounded-xl bg-white/[0.01] text-left space-y-4 max-w-2xl mx-auto">
            <p className="text-zinc-300 text-sm font-light">Capital Engine & Data Assets:</p>
            <p className="text-zinc-500 text-xs">1. **Capital Engine:** Integra Issuance Fees (1.5%), Treasury Contributions, Revenue Share y Distribución USDC pro-rata.</p>
            <p className="text-zinc-500 text-xs">2. **Data Assets:** Base de datos de inversionistas, modelos de scoring, analítica y trazabilidad encriptada AES-256.</p>
          </div>
        </motion.div>
      </section>

      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">Pandoras Holdings · Libro VI · Confidencial · {new Date().getFullYear()}</p>
        <div className="mt-6 flex gap-6 flex-wrap justify-center">
          <a href={`/libros?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">← Galería de Libros</a>
          <a href={`/libros/libro-vii?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">Libro VII: Growth & Expansion →</a>
        </div>
      </section>
    </main>
  );
}
