'use client';

import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ArrowRight,
  Wallet,
  Activity,
  Layers,
  Globe,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import { AmbassadorForm } from '@/components/ambassadors/AmbassadorForm';

export default function AmbassadorsPage() {
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
              Pandora's Growth OS
            </span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            El Primer Brokerage <br /> Descentralizado RWA
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-zinc-400 leading-relaxed max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Vende el futuro inmobiliario. Cobra tus comisiones on-chain el mismo día. Gana ingresos pasivos de por vida al convertirte en socio vitalicio de tus clientes.
          </motion.p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
          {[
            {
              icon: Briefcase,
              title: 'Venta Directa (4%)',
              desc: 'Comisiona el 4% líquido y automatizado por cada portafolio colocado a través de tu código de afiliación único.',
            },
            {
              icon: TrendingUp,
              title: 'Yield Residual (1%)',
              desc: 'Gana un pasivo de por vida equivalente al 1% de todos los rendimientos hoteleros y rentas generados por tu red de clientes.',
            },
            {
              icon: Globe,
              title: 'Inventario Global',
              desc: 'Acceso anticipado a múltiples proyectos inmobiliarios y de infraestructura Web3 auditados por el ecosistema Pandoras.',
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

        {/* Form Section */}
        <div className="mt-32 border border-white/5 bg-zinc-900/20 rounded-[3rem] p-8 md:p-16 overflow-hidden relative max-w-4xl mx-auto">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Únete al Movimiento</h2>
            <p className="text-zinc-400 text-lg mb-8">Completa el formulario para recibir tu código de Gestor Patrimonial.</p>
            
            <AmbassadorForm origin="pandoras" />
          </div>
        </div>

      </div>
    </div>
  );
}
