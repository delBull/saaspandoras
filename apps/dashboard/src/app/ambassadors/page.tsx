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
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';

export default function AmbassadorsPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    socialUrl: '',
    walletAddress: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    
    try {
      const res = await fetch('/api/ambassadors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, origin: 'pandoras' })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error en el registro');
      }
      
      setReferralCode(data.ambassador.referralCode);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
            
            {isSuccess ? (
              <motion.div 
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">¡Registro Exitoso!</h3>
                <p className="text-zinc-300 mb-6">Hemos enviado un correo a <strong>{formData.email}</strong> con las instrucciones de inicio.</p>
                
                <div className="bg-black/50 p-4 rounded-xl inline-block">
                  <p className="text-sm text-zinc-500 mb-1 uppercase tracking-widest font-bold">Tu Código Oficial</p>
                  <p className="text-3xl font-mono text-emerald-400 font-bold">{referralCode}</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Nombre Completo *</label>
                    <input 
                      required
                      type="text" 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="Ej. Carlos Slim"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Correo Electrónico *</label>
                    <input 
                      required
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="carlos@broker.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Teléfono / WhatsApp *</label>
                    <input 
                      required
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="+52 123 456 7890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">LinkedIn / Instagram</label>
                    <input 
                      type="url" 
                      name="socialUrl"
                      value={formData.socialUrl}
                      onChange={handleChange}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Wallet de Pagos (Opcional por ahora)</label>
                    <input 
                      type="text" 
                      name="walletAddress"
                      value={formData.walletAddress}
                      onChange={handleChange}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
                      placeholder="0x..."
                    />
                  </div>
                </div>
                
                {errorMsg && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                    {errorMsg}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Registrando...' : 'Convertirme en Ambassador'}
                  {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
