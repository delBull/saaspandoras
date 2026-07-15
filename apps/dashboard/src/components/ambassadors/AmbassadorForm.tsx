'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useActiveAccount } from 'thirdweb/react';

export function AmbassadorForm({ origin = 'pandoras', projectId, onSuccess, onConnectWallet }: { origin?: string, projectId?: number | string, onSuccess?: () => void, onConnectWallet?: () => void }) {
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
    
    if (!account?.address) {
      if (onConnectWallet) onConnectWallet();
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');
    
    // Update wallet address from account in case it changed
    const payload = {
      ...formData,
      walletAddress: account.address,
      origin,
      projectId
    };
    
    try {
      const res = await fetch('/api/ambassadors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error en el registro');
      }
      
      setReferralCode(data.referralCode || 'PENDING');
      setIsSuccess(true);
      
      if (onSuccess) {
          onSuccess();
      }
      
      if (origin === 'dashboard') {
        setTimeout(() => window.location.reload(), 3000);
      }
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setErrorMsg('Error de conexión. Verifica tu internet e intenta de nuevo.');
      } else {
        setErrorMsg(err.message || 'Ocurrió un error inesperado. Intenta de nuevo.');
      }
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
        <p className="text-zinc-300 mb-6">Hemos enviado un código PIN a <strong>{formData.email}</strong>. Revisa tu bandeja de entrada (y spam) para verificarlo.</p>
        
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
            autoComplete="name"
            inputMode="text"
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
            autoComplete="email"
            inputMode="email"
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
            autoComplete="tel"
            inputMode="tel"
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
            autoComplete="url"
            inputMode="url"
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div className="md:col-span-2">
          {account?.address ? (
            <div>
              <label className="block text-sm font-medium text-emerald-400 mb-2">Cuenta Conectada *</label>
              <div className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-400 font-mono text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 shrink-0" />
                <span className="truncate">{account.address}</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-amber-400 mb-2">Cuenta Requerida *</label>
              <div className="w-full bg-black/50 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-400/70 text-sm flex items-center gap-2 cursor-pointer hover:border-amber-500 transition-colors" onClick={onConnectWallet}>
                <Wallet className="w-4 h-4 shrink-0" />
                <span>{onConnectWallet ? 'Conecta tu cuenta para continuar' : 'Conecta tu cuenta antes de registrarte'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      <button 
        type="submit" 
        disabled={isSubmitting || (!account?.address && !onConnectWallet)}
        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Registrando...' : 'Convertirme en Ambassador'}
        {!isSubmitting && <ArrowRight className="w-5 h-5" />}
      </button>
    </form>
  );
}
