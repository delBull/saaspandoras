'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

/**
 * 🛰️ Coming Soon Landing - Sci-Fi Minimalist
 * ============================================================================
 * High-conversion psychological barrier with blue-glow aesthetic.
 * Focuses on selectivity, scarcity, and intent-based filtering.
 * ============================================================================
 */
export function ComingSoon() {
  const [view, setView] = useState<'hero' | 'form'>('hero');
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    capital: '',
    horizon: '',
    interest: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trackEvent = async (event: string, metadata: any = {}) => {
    try {
      await fetch('/api/v1/marketing/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          projectId: 1, 
          fingerprint: 'main-coming-soon-user',
          metadata: {
            ...metadata,
            source: 'coming_soon_main'
          }
        }),
      });
    } catch (e) {
      console.error('Tracking failed', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 1. Capture Lead via Marketing API
    await trackEvent('WAITLIST_JOIN', {
      ...formData,
      intent: 'whitelist'
    });

    // 2. Redirect to Success Page (Controlled Psychology)
    router.push('/waitlist-success');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-blue-500/30 font-sans relative overflow-hidden">
      
      {/* 🎨 ADN VISUAL: BLUE GLOW & SCI-FI DEPTH */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl z-10"
      >
        <AnimatePresence mode="wait">
          {view === 'hero' && (
            <motion.div 
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-12 text-center"
            >
              <div className="space-y-6">
                <h1 className="text-[10px] tracking-[0.8em] text-gray-500 uppercase animate-pulse">
                  ACCESS PROTOCOL // v1.0
                </h1>
                
                <h2 className="text-4xl md:text-6xl font-thin tracking-[0.2em] text-white leading-tight uppercase">
                  NO ES <br/> PARA TODOS
                </h2>
                
                <p className="text-gray-400 text-base md:text-lg font-light tracking-wide max-w-sm mx-auto leading-relaxed">
                  El acceso no está abierto.<br />
                  Está siendo habilitado selectivamente.
                </p>
              </div>

              <div className="flex flex-col items-center gap-8 pt-4">
                <button 
                  onClick={() => setView('form')}
                  className="group relative px-12 py-5 border border-white/20 bg-white/5 hover:bg-white hover:text-black transition-all duration-700 overflow-hidden"
                >
                  <span className="relative z-10 text-[10px] font-black tracking-[0.5em] uppercase">Solicitar Acceso</span>
                  <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
                
                <p className="text-[9px] uppercase tracking-[0.4em] text-gray-600 font-bold">
                  No todos los accesos son aprobados.
                </p>
              </div>
            </motion.div>
          )}

          {view === 'form' && (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              <div className="text-center space-y-4">
                <h2 className="text-xs font-black tracking-[0.5em] text-white uppercase">Identificación de Perfil</h2>
                <div className="h-[1px] w-8 bg-gray-800 mx-auto" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-left max-w-md mx-auto">
                <div className="space-y-1">
                  <Input 
                    required
                    placeholder="NOMBRE"
                    className="bg-zinc-950/50 border-white/10 rounded-none h-14 !text-[10px] tracking-[0.2em] focus:border-blue-500/50 transition-all placeholder:text-gray-700 text-white"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-1">
                  <Input 
                    required
                    type="email"
                    placeholder="EMAIL CORPORATIVO / WEB3"
                    className="bg-zinc-950/50 border-white/10 rounded-none h-14 !text-[10px] tracking-[0.2em] focus:border-blue-500/50 transition-all placeholder:text-gray-700 text-white"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                   <select 
                     required
                     className="bg-zinc-950/50 border border-white/10 h-14 text-[10px] tracking-[0.2em] text-white px-4 outline-none focus:border-blue-500/50 appearance-none rounded-none"
                     value={formData.capital}
                     onChange={e => setFormData({...formData, capital: e.target.value})}
                   >
                     <option value="" className="bg-black">CAPITAL ESTIMADO</option>
                     <option value="10000" className="bg-black">$5k - $25k</option>
                     <option value="50000" className="bg-black">$25k - $100k</option>
                     <option value="100000" className="bg-black">$100k+</option>
                   </select>

                   <select 
                     required
                     className="bg-zinc-950/50 border border-white/10 h-14 text-[10px] tracking-[0.2em] text-white px-4 outline-none focus:border-blue-500/50 appearance-none rounded-none"
                     value={formData.horizon}
                     onChange={e => setFormData({...formData, horizon: e.target.value})}
                   >
                     <option value="" className="bg-black">HORIZONTE</option>
                     <option value="Corto" className="bg-black">CORTO</option>
                     <option value="Medio" className="bg-black">MEDIO</option>
                     <option value="Largo" className="bg-black">LARGO</option>
                   </select>
                </div>

                <select 
                  required
                  className="w-full bg-zinc-950/50 border border-white/10 h-14 text-[10px] tracking-[0.2em] text-white px-4 outline-none focus:border-blue-500/50 appearance-none rounded-none"
                  value={formData.interest}
                  onChange={e => setFormData({...formData, interest: e.target.value})}
                >
                  <option value="" className="bg-black">INTERÉS PRINCIPAL</option>
                  <option value="Early Access" className="bg-black">EARLY ACCESS</option>
                  <option value="Yield" className="bg-black">YIELD / PROTOCOLO</option>
                  <option value="Equity" className="bg-black">EQUITY / PROYECTO</option>
                </select>

                <button 
                  disabled={isSubmitting}
                  className="w-full bg-white text-black hover:bg-blue-500 hover:text-white py-5 mt-6 text-[10px] font-black tracking-[0.4em] uppercase transition-all duration-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'PROCESANDO...' : 'SOLICITAR ACCESO'}
                </button>

                <p className="text-[8px] tracking-[0.3em] text-gray-600 text-center pt-4 uppercase">
                  Sujeto a aprobación por el Protocolo Pandora
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer Disclaimer */}
      <footer className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-xs text-center space-y-4 opacity-30">
        <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.4em] text-gray-500 px-2 font-mono">
           <span>Ventana Activa</span>
           <span className="text-white">17 / 50</span>
        </div>
        <div className="w-full h-[1px] bg-white/10 relative">
           <div className="absolute top-0 left-0 w-[34%] h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
        </div>
        <p className="text-[7px] text-zinc-500 font-bold uppercase tracking-[0.4em] pt-4">
          © 2026 Pandora&apos;s Finance // No es Crowdfunding.
        </p>
      </footer>
    </div>
  );
}
