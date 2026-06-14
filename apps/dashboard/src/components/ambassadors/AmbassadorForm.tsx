'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useActiveAccount } from 'thirdweb/react';

export function AmbassadorForm({ origin = 'pandoras', projectId, onSuccess }: { origin?: string, projectId?: number | string, onSuccess?: () => void }) {
  const account = useActiveAccount();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    socialUrl: '',
    walletAddress: account?.address || ''
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
        body: JSON.stringify({ ...formData, origin, projectId })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error en el registro');
      }
      
      setReferralCode(data.ambassador?.referralCode || data.referralCode || 'PENDING');
      setIsSuccess(true);
      
      if (onSuccess) {
          onSuccess();
      }
      
      // If used inside dashboard, reload after a delay
      if (origin === 'dashboard') {
        setTimeout(() => window.location.reload(), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isSuccess) {
    return (
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
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
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
  );
}
