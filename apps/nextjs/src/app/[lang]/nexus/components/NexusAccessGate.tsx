'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, CheckCircle2, Sparkles, Loader2, ArrowRight, Info, Wallet, AtSign } from 'lucide-react';
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "~/lib/thirdweb-client";

interface NexusAccessGateProps {
  children: React.ReactNode;
}

const DEFAULT_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
const API_BASE_URL = 'https://dash.pandoras.finance';

export const NexusRoleContext = React.createContext<any>(null);

export function NexusAccessGate({ children }: NexusAccessGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collaboratorInfo, setCollaboratorInfo] = useState<any>(null);
  
  const account = useActiveAccount();

  useEffect(() => {
    checkInitialAccess();
  }, [account]);

  const getWalletHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const urlParams = new URLSearchParams(window.location.search);
    const urlWallet = urlParams.get('wallet');
    const wallet =
      urlWallet ||
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
      const checkAuthMe = async (tokenParam: string | null) => {
        const headers = getWalletHeaders();
        const url = `${API_BASE_URL}/api/v1/nexus/auth/me${tokenParam ? `?token=${encodeURIComponent(tokenParam)}` : ''}`;
        const res = await fetch(url, { headers, credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.auth?.isAuthenticated) {
            if (tokenParam) {
              localStorage.setItem('pandoras_nexus_token', tokenParam);
            }
            setCollaboratorInfo({
              name: data.auth.name || 'Sovereign Actor',
              email: data.auth.email,
              role: data.auth.role,
              permissions: data.auth.permissions,
            });
            setIsAuthenticated(true);
            return true;
          }
        }
        return false;
      };

      // 1. Check URL token (?token=nx_... or ?collaborator=nx_...)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token') || urlParams.get('collaborator');

      if (urlToken) {
        if (await checkAuthMe(urlToken)) {
          window.history.replaceState({}, '', window.location.pathname);
          setIsChecking(false);
          return;
        }
      }

      // 2. Check stored token in localStorage
      const storedToken = localStorage.getItem('pandoras_nexus_token');
      if (storedToken) {
        if (await checkAuthMe(storedToken)) {
          setIsChecking(false);
          return;
        } else {
          localStorage.removeItem('pandoras_nexus_token');
        }
      }

      // 3. Check wallet privileges (no token)
      if (await checkAuthMe(null)) {
        setIsChecking(false);
        return;
      }
    } catch (err) {
      console.error('[NexusAccessGate] Auth check error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
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
          whatsappPhone: whatsappPhone.trim(),
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
      <NexusRoleContext.Provider value={{ role: collaboratorInfo?.role, permissions: collaboratorInfo?.permissions }}>
        <div className="relative w-full h-full">
          {children}
        </div>
      </NexusRoleContext.Provider>
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
              <p className="text-[11px] text-zinc-500">Dos canales de acceso — cada uno con un propósito distinto</p>
            </div>
          </div>

          {/* Why both methods notice */}
          <div className="rounded-2xl bg-white/[0.03] border border-amber-500/15 p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-400/80">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider">¿Por qué dos métodos?</p>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 shrink-0 mt-0.5">
                  <Wallet className="w-2.5 h-2.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-[11px] text-white/80 font-semibold leading-tight">Wallet Web3 — Identidad On-Chain</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5">
                    Crea tu Smart Wallet institucional. Necesaria para firmar transacciones, acceder a activos tokenizados y participar en gobernanza on-chain dentro del ecosistema Pandoras.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 shrink-0 mt-0.5">
                  <AtSign className="w-2.5 h-2.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[11px] text-white/80 font-semibold leading-tight">Email — Acceso al Ecosistema Interno</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5">
                    Recibe Magic Links de acceso, notificaciones de deals, reportes de Hermes y comunicaciones operativas cifradas del ecosistema Pandoras.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!sent ? (
            <div className="space-y-6">
              {/* Method 1: Web3 Wallet */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 text-[10px] font-bold text-violet-400 shrink-0">1</span>
                  <label className="text-xs font-mono text-zinc-300 font-semibold">
                    Billetera Institucional
                  </label>
                  <span className="text-[10px] font-mono text-violet-400/60 bg-violet-500/10 px-1.5 py-0.5 rounded-md border border-violet-500/20">Smart Wallet</span>
                </div>
                <div className="flex justify-center w-full">
                  <ConnectButton
                    client={client}
                    theme="dark"
                    connectButton={{
                      label: "Conectar Wallet Web3",
                      className: "!w-full !py-3 !rounded-xl !bg-zinc-800 !text-white !font-semibold !border !border-zinc-700 !hover:bg-zinc-700 !text-xs !font-mono",
                    }}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#0d0d12] px-3 text-[10px] text-zinc-500 uppercase tracking-wider font-mono absolute">
                  o mediante magic link
                </span>
              </div>

              <form onSubmit={handleRequestMagicLink} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-400 shrink-0">2</span>
                    <label className="text-xs font-mono text-zinc-300 font-semibold">
                      Correo Electrónico & WhatsApp
                    </label>
                    <span className="text-[10px] font-mono text-amber-400/60 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">Magic Link</span>
                  </div>
                  <div className="space-y-3">
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
                    <div className="relative">
                      <input
                        type="tel"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        placeholder="+5215551234567 (Opcional - Para notificaciones de Hermes)"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 font-mono transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono leading-relaxed px-1">
                      El número de WhatsApp permite que la IA de Hermes te asigne tareas y te envíe notificaciones críticas directamente a tu teléfono mediante el Meta Graph API.
                    </p>
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
            </div>
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
