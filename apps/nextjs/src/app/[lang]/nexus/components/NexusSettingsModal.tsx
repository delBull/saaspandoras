'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  X,
  Mail,
  Plus,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Users,
  Lock,
} from 'lucide-react';

interface NexusSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Collaborator {
  id: number;
  name: string;
  email: string;
  expiresAt: string;
}

export function NexusSettingsModal({ isOpen, onClose }: NexusSettingsModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      loadCollaborators();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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

  const loadCollaborators = async () => {
    try {
      const res = await fetch('https://dash.pandoras.finance/api/nexus/collaborators/list', {
        headers: {
          ...getWalletHeaders(),
        },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.collaborators)) {
          setCollaborators(data.collaborators);
        }
      }
    } catch {
      // Non-fatal if unauthenticated
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('https://dash.pandoras.finance/api/nexus/collaborators/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getWalletHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setMessage({
          type: 'success',
          text: `Magic Link enviado con éxito a ${email}. Válido por 24 horas.`,
        });
        setName('');
        setEmail('');
        loadCollaborators();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Error al enviar invitación. Requiere permisos de administrador.',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Error de conexión con el servidor.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl bg-[#090A10] border border-zinc-800 rounded-3xl shadow-2xl z-10 text-white overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Nexus Settings</h2>
                  <p className="text-xs text-zinc-400">Gestión de Acceso & Colaboradores a Deal Rooms</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Form Card */}
              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-400" />
                    Invitar Nuevo Colaborador
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Magic Link 24h</span>
                </div>

                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        required
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="juan@empresa.com"
                        required
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !name || !email}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{loading ? 'Generando Magic Link...' : 'Enviar Invitación'}</span>
                  </button>
                </form>

                {message && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      message.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                    }`}
                  >
                    {message.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
                    <span>{message.text}</span>
                  </div>
                )}
              </div>

              {/* Active Collaborators list if present */}
              {collaborators.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    Colaboradores Activos ({collaborators.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {collaborators.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">{c.name}</p>
                          <p className="text-[11px] text-zinc-500">{c.email}</p>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          ACTIVO
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 px-6 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
