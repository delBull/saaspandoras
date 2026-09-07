'use client';

import React from 'react';
import { X, User, Activity, CheckCircle2 } from 'lucide-react';
import { CognitiveProfileWidget } from '@/components/hermes/CognitiveProfileWidget';
import { Badge } from '@/components/ui/badge';

interface TenantLeadDrawerProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    walletAddress?: string | null;
    status?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TenantLeadDrawer({ user, isOpen, onClose }: TenantLeadDrawerProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Detalle del Prospecto</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Identity Section */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Identidad</h3>
            <div className="space-y-1">
              <p className="text-xl font-bold text-white">{user.name || 'Usuario Anónimo'}</p>
              {user.email && <p className="text-zinc-300 text-sm">{user.email}</p>}
              {user.walletAddress && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-800 rounded text-xs font-mono text-zinc-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {user.walletAddress.substring(0, 6)}...{user.walletAddress.slice(-4)}
                </div>
              )}
            </div>
            {user.status && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                  {user.status}
                </Badge>
              </div>
            )}
          </div>

          {/* Cognitive Profile Widget (Hermes Intelligence) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Activity className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Inteligencia Artificial</h3>
            </div>
            <CognitiveProfileWidget 
              userId={user.id} 
              walletAddress={user.walletAddress} 
              className="bg-black/20" 
            />
          </div>
          
          <div className="px-1 text-xs text-zinc-500 leading-relaxed">
            <p>
              Este prospecto está siendo analizado y cualificado automáticamente por Hermes. 
              El perfil cognitivo muestra su intención transaccional basada en las interacciones y traza su estilo de comportamiento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
