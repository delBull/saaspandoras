'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, CheckCircle2, ShieldCheck, ArrowRight, Loader2, Sparkles, LogOut } from 'lucide-react';

interface NexusAccessGateProps {
  children: React.ReactNode;
}

const DEFAULT_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'marco.munoz9@gmail.com';
const API_BASE_URL = 'https://dash.pandoras.finance';

export function NexusAccessGate({ children }: NexusAccessGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collaboratorInfo, setCollaboratorInfo] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    checkInitialAccess();
  }, []);

  const getWalletHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const wallet =
      localStorage.getItem('snarai_wallet') ||
      localStorage.getItem('user_wallet') ||
      localStorage.getItem('walletAddress') ||
      localStorage.getItem('thirdweb:active-account') ||
      (window as any).ethereum?.selectedAddress ||
      '';
    if (!wallet) return {};
    return {
      'x-wallet-address': wallet,
      'x-thirdweb-address': wallet,
    };
  };

  const checkInitialAccess = async () => {
    setIsChecking(true);
    try {
      // 1. Check URL token (?token=nx_... or ?collaborator=nx_...)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token') || urlParams.get('collaborator');

      if (urlToken) {
        const verifyRes = await fetch(`${API_BASE_URL}/api/nexus/collaborators/verify?token=${encodeURIComponent(urlToken)}`, {
          credentials: 'include',
        });
        if (verifyRes.ok) {
          const data = await verifyRes.json();
          if (data.ok && data.collaborator) {
            localStorage.setItem('pandoras_nexus_token', urlToken);
            localStorage.setItem('pandoras_nexus_user', JSON.stringify(data.collaborator));
            setCollaboratorInfo(data.collaborator);
            setIsAuthenticated(true);
            // Clean URL query without reloading
            window.history.replaceState({}, '', window.location.pathname);
            setIsChecking(false);
            return;
          }
        }
      }

      // 2. Check stored token in localStorage
      const storedToken = localStorage.getItem('pandoras_nexus_token');
      if (storedToken) {
        const verifyRes = await fetch(`${API_BASE_URL}/api/nexus/collaborators/verify?token=${encodeURIComponent(storedToken)}`, {
          credentials: 'include',
        });
        if (verifyRes.ok) {
          const data = await verifyRes.json();
          if (data.ok && data.collaborator) {
            setCollaboratorInfo(data.collaborator);
            setIsAuthenticated(true);
            setIsChecking(false);
            return;
          }
        } else {
          localStorage.removeItem('pandoras_nexus_token');
          localStorage.removeItem('pandoras_nexus_user');
        }
      }

      // 3. Check wallet admin privileges
      const walletHeaders = getWalletHeaders();
      if (walletHeaders['x-wallet-address']) {
        const listRes = await fetch(`${API_BASE_URL}/api/nexus/collaborators/list`, {
          headers: walletHeaders,
          credentials: 'include',
        });
        if (listRes.ok) {
          setIsAuthenticated(true);
          setCollaboratorInfo({ name: 'Admin Sovereign', email: 'Founder Wallet' });
          setIsChecking(false);
          return;
        }
      }
    } catch (err) {
      console.error('[NexusAccessGate] Auth check error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/nexus/collaborators/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getWalletHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: email.split('@')[0],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al solicitar el magic link');
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pandoras_nexus_token');
    localStorage.removeItem('pandoras_nexus_user');
    setIsAuthenticated(false);
    setSent(false);
  };

  if (isChecking) {
    return (
      <div className="fixed inset-0 z-50 bg-[#060608] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
            Verificando Credenciales Nexus...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="relative w-full h-full">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Ambient Glow */}
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Top Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Pandoras Nexus · Sovereign Plane
          </div>

          <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
            Acceso Restringido
          </h1>
          <p className="text-xs text-zinc-400 mt-2">
            Consola Operativa de Colaboradores & Transaction Rooms
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0d0d12]/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Autenticación Soberana</p>
              <p className="text-[11px] text-zinc-500">Ingresa tu correo o conecta tu wallet autorizada</p>
            </div>
          </div>

          {!sent ? (
            <form onSubmit={handleRequestMagicLink} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-2">
                  Correo Electrónico Autorizado
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu-correo@pandoras.finance"
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 font-mono transition-all"
                  />
                  <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-40 flex items-center justify-center gap-2 font-mono"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando Magic Link...
                  </>
                ) : (
                  <>
                    Solicitar Magic Link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 text-center py-2"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Magic Link Enviado</p>
                <p className="text-xs text-zinc-400">
                  Hemos enviado un enlace de acceso seguro a <span className="text-amber-400 font-mono font-bold">{email}</span>.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-500 font-mono">
                Revisa tu bandeja de entrada o spam. El enlace expira en 24 horas.
              </div>
              <button
                onClick={() => setSent(false)}
                className="text-xs text-zinc-400 hover:text-white underline font-mono pt-2"
              >
                Ingresar otro correo
              </button>
            </motion.div>
          )}

          <div className="pt-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
              Pandoras Group · Confidential Infrastructure
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
