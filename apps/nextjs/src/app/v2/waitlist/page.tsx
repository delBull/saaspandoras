'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';

type SubmitState = 'idle' | 'success_new' | 'success_existing';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [wallet, setWallet] = useState('');
  const [capital, setCapital] = useState('');
  const [intent, setIntent] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('El email es requerido.'); return; }
    setLoading(true);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          wallet: wallet || null, 
          intent: intent || null,
          metadata: { capital: capital || null }
        }),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; existing?: boolean };
      setSubmitState(data.existing ? 'success_existing' : 'success_new');
    } catch {
      setSubmitState('success_new');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-24 overflow-hidden">
      <div className="pointer-events-none absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-600/6 blur-[120px]" />

      <Link href="/v2" className="absolute top-8 left-8 text-[8px] tracking-[0.5em] text-zinc-700 hover:text-zinc-400 uppercase transition-colors">
        ← Volver
      </Link>

      {submitState === 'idle' ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="w-full max-w-md"
        >
          <p className="text-[9px] tracking-[0.7em] text-zinc-600 uppercase mb-6 text-center">
            Acceso Anticipado
          </p>
          <h1 className="text-4xl font-thin tracking-wide text-center mb-2">
            Tu perfil determina<br />si entras.
          </h1>
          <p className="text-zinc-600 text-xs text-center mb-12 tracking-wider">
            No todos recibirán acceso.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[8px] tracking-[0.4em] text-zinc-600 uppercase">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm px-4 py-3.5 rounded-none focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] tracking-[0.4em] text-zinc-600 uppercase">
                Wallet Address <span className="text-zinc-700">(opcional)</span>
              </label>
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="0x..."
                className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm px-4 py-3.5 rounded-none focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700 font-mono transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] tracking-[0.4em] text-zinc-600 uppercase">
                Capital estimado <span className="text-zinc-700">(opcional)</span>
              </label>
              <select
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm px-4 py-3.5 rounded-none focus:outline-none focus:border-zinc-600 text-zinc-400 transition-colors appearance-none"
              >
                <option value="">Selecciona una opción</option>
                <option value="5k-25k">$5k – $25k</option>
                <option value="25k-100k">$25k – $100k</option>
                <option value="100k+">$100k+</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] tracking-[0.4em] text-zinc-600 uppercase">
                ¿Por qué quieres entrar? <span className="text-zinc-700">(opcional)</span>
              </label>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm px-4 py-3.5 rounded-none focus:outline-none focus:border-zinc-600 text-zinc-400 transition-colors appearance-none"
              >
                <option value="" disabled>Selecciona una opción</option>
                <option value="capital">Quiero asignar capital</option>
                <option value="deals">Quiero acceder a deals privados</option>
                <option value="genesis">Quiero ser Genesis</option>
                <option value="build">Quiero construir dentro del sistema</option>
                <option value="explore">Solo quiero explorar</option>
              </select>
            </div>

            {error && <p className="text-red-500/80 text-[10px] tracking-wider">{error}</p>}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ backgroundColor: '#a3e635', color: '#000' }}
              whileTap={{ scale: 0.97 }}
              className="w-full mt-4 py-4 text-[10px] tracking-[0.5em] uppercase border border-white/20 bg-transparent text-white transition-all duration-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Evaluando acceso...' : 'Solicitar Acceso Anticipado'}
            </motion.button>

            <p className="text-[7px] tracking-[0.3em] text-zinc-700 text-center mt-4 leading-loose">
              Al continuar aceptas nuestros{' '}
              <Link href="/v2/legal/terms" className="underline hover:text-zinc-500 transition-colors">Términos</Link>{' '}
              y{' '}
              <Link href="/v2/legal/privacy" className="underline hover:text-zinc-500 transition-colors">Privacidad</Link>.
            </p>
          </form>
        </motion.div>

      ) : submitState === 'success_existing' ? (
        /* ── Ya en el sistema ─────────────────────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-sm"
        >
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-blue-400 to-transparent mx-auto mb-8" />
          <p className="text-[9px] tracking-[0.7em] text-blue-400 uppercase mb-6">Ya en el sistema</p>
          <h2 className="text-3xl font-thin tracking-wide mb-4">Ya estás dentro del sistema.</h2>
          <p className="text-zinc-500 text-sm leading-loose font-light">
            Tu solicitud sigue activa.<br />
            No todos avanzan a la siguiente fase.<br />
            <br />
            <span className="text-zinc-400">Revisa tu correo.</span>
          </p>
          <div className="mt-10 w-px h-16 bg-gradient-to-b from-transparent via-zinc-800 to-transparent mx-auto" />
          <Link href="/v2" className="text-[8px] tracking-[0.4em] text-zinc-700 hover:text-zinc-400 uppercase transition-colors">
            Volver al inicio
          </Link>
        </motion.div>

      ) : (
        /* ── Nuevo registro ────────────────────────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-sm"
        >
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-lime-500 to-transparent mx-auto mb-8" />
          <p className="text-[9px] tracking-[0.7em] text-lime-500 uppercase mb-6">Acceso en revisión</p>
          <h2 className="text-3xl font-thin tracking-wide mb-4">Tu acceso está en revisión.</h2>
          <p className="text-zinc-500 text-sm leading-loose font-light">
            Esto no es automático.<br />
            No todos van a pasar.<br />
            <br />
            <span className="text-zinc-400">Recibirás instrucciones si avanzas.</span>
          </p>
          <div className="mt-10 w-px h-16 bg-gradient-to-b from-transparent via-zinc-800 to-transparent mx-auto" />
          <Link href="/v2" className="text-[8px] tracking-[0.4em] text-zinc-700 hover:text-zinc-400 uppercase transition-colors">
            Volver al inicio
          </Link>
        </motion.div>
      )}
    </main>
  );
}
