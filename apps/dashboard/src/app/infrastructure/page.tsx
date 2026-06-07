'use client';

import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  Zap, 
  Database, 
  Layers, 
  ArrowRight,
  Wallet,
  Activity,
  Cpu
} from 'lucide-react';

export default function InfrastructurePage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.05)_0%,_rgba(0,0,0,1)_100%)]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-bold tracking-widest uppercase">
              Pandora&apos;s Growth OS
            </span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Institutional-Grade <br /> Web2.5 Treasury
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-zinc-400 leading-relaxed max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Una de las tesorerías Web2.5 más blindadas operando en el mercado. 
            Diseñada para la emisión de RWA y gestión de capital a escala masiva, 
            combinando la inmutabilidad de Web3 con la velocidad de Fintech.
          </motion.p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
          {[
            {
              icon: ShieldCheck,
              title: 'Gnosis Safe + Allowance',
              desc: 'Segregación total de capital. Cada proyecto mantiene la custodia en un Safe 2/3, delegando únicamente límites operativos diarios al AllowanceController. Cero honeypots.',
            },
            {
              icon: Activity,
              title: 'Dynamic Gas Protection',
              desc: 'Protección algorítmica contra Gas Griefing. El retiro mínimo (MIN_WITHDRAW) se calibra dinámicamente según el Gas Price y el valor ETH/USD para garantizar viabilidad económica.',
            },
            {
              icon: Database,
              title: 'Atomic DB-Chain Sync',
              desc: 'Transacciones de dos fases con bloqueos explícitos de base de datos (FOR UPDATE) y Optimistic Concurrency Control. Reentrancy matemáticamente imposible.',
            }
          ].map((pillar, i) => (
            <motion.div
              key={i}
              className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] hover:bg-zinc-900/60 transition-colors group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
            >
              <div className="h-14 w-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <pillar.icon className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{pillar.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{pillar.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* PULL vs PUSH Architecture */}
        <div className="mt-32 border border-white/5 bg-zinc-900/20 rounded-[3rem] p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Escalabilidad Infinita: PULL Architecture</h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Los sistemas Web3 tradicionales colapsan intentando distribuir dividendos (PUSH) a miles de wallets por los límites de gas. Pandora's Growth OS utiliza un patrón híbrido (PULL): 
              </p>
              
              <div className="space-y-6">
                {[
                  { icon: Layers, text: "Distribución contable instantánea y sin costo de gas vía PostgreSQL." },
                  { icon: Wallet, text: "El usuario solicita el retiro (Claim) on-demand firmando un mensaje (EIP-712)." },
                  { icon: Lock, text: "Validación de firmas criptográficas vs Nonce para prevenir ataques de repetición." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-white/5 rounded-lg border border-white/5">
                      <item.icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-black/50 border border-white/10 rounded-3xl p-8 font-mono text-sm shadow-2xl">
              <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-2 text-zinc-500">Security Middleware</span>
              </div>
              
              <div className="space-y-4">
                <div className="text-emerald-400">{'// 1. Prevent Blind Broadcasts'}</div>
                <div className="text-zinc-300">
                  <span className="text-pink-400">const</span> tx = decodeSignedTx(rawTx);<br/>
                  <span className="text-pink-400">if</span> (tx.to !== controller.address) <span className="text-red-400">throw</span>;<br/>
                  <span className="text-pink-400">if</span> (tx.value !== 0) <span className="text-red-400">throw</span>;
                </div>
                
                <div className="text-emerald-400 mt-6">{'// 2. Validate Daily Allowance'}</div>
                <div className="text-zinc-300">
                  <span className="text-pink-400">const</span> limit = await safe.allowance(admin);<br/>
                  <span className="text-pink-400">if</span> (request &gt; limit) <span className="text-red-400">throw</span>;
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">Construido para el Capital Institucional</h2>
          <a href="/whitepaper#institutional-treasury" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] inline-flex items-center gap-2 mx-auto">
            Explorar Documentación Técnica
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>

      </div>
    </div>
  );
}
