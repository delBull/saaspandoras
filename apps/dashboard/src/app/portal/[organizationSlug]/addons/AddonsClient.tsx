'use client';

import React, { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { 
  Boxes, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  Building2, 
  Globe, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Lock, 
  Zap,
  Layers
} from 'lucide-react';
import { toggleAddOnAction } from './actions';
import { toast } from 'sonner';

export interface AddOnItem {
  id: string;
  name: string;
  version: string;
  type: string;
  description: string;
  capabilities: Array<{ id: string; category: string; description: string }>;
  status: 'ACTIVE' | 'AVAILABLE' | 'DEACTIVATED';
  requiresHumanApproval: boolean;
  channels: string[];
}

export function AddonsClient({
  organizationSlug,
  organizationName,
  initialAddons,
}: {
  organizationSlug: string;
  organizationName: string;
  initialAddons: AddOnItem[];
}) {
  const [addons, setAddons] = useState<AddOnItem[]>(initialAddons);
  const [filter, setFilter] = useState<'ALL' | 'VIP' | 'STRATEGY' | 'CHANNELS'>('ALL');
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const activeCount = addons.filter((a) => a.status === 'ACTIVE').length;
  const totalCapabilities = addons
    .filter((a) => a.status === 'ACTIVE')
    .reduce((sum, a) => sum + a.capabilities.length, 0);

  const filteredAddons = addons.filter((addon) => {
    if (filter === 'ALL') return true;
    if (filter === 'VIP') return addon.id.includes('family') || addon.id.includes('referral');
    if (filter === 'STRATEGY') return addon.type === 'STRATEGY' || addon.type === 'COMPOSITE';
    if (filter === 'CHANNELS') return addon.type === 'CHANNEL_EXTENSION' || addon.type === 'CAPABILITY';
    return true;
  });

  const handleToggle = (addon: AddOnItem) => {
    const targetState = addon.status !== 'ACTIVE';
    setTogglingId(addon.id);

    startTransition(async () => {
      try {
        await toggleAddOnAction(organizationSlug, addon.id, targetState);
        setAddons((prev) =>
          prev.map((a) => (a.id === addon.id ? { ...a, status: targetState ? 'ACTIVE' : 'DEACTIVATED' } : a))
        );
        toast.success(
          targetState
            ? `Add-On "${addon.name}" activado en producción para ${organizationName}.`
            : `Add-On "${addon.name}" desactivado.`
        );
      } catch (err: any) {
        toast.error(err.message || 'Error al modificar estado del Add-On');
      } finally {
        setTogglingId(null);
      }
    });
  };

  const getAddOnIcon = (id: string) => {
    if (id.includes('family')) return <Users className="w-5 h-5 text-indigo-400" />;
    if (id.includes('office') || id.includes('succession')) return <Building2 className="w-5 h-5 text-emerald-400" />;
    if (id.includes('referral')) return <TrendingUp className="w-5 h-5 text-purple-400" />;
    if (id.includes('portal')) return <Globe className="w-5 h-5 text-blue-400" />;
    return <Zap className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Add-ons & Cognitive Strategies</h1>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-500/30">
              {organizationName}
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Estrategias especializadas, journeys VIP y extensiones modulares para tu instancia de Hermes OS.
          </p>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-4">
          <div className="bg-[#0C0C12] border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-xs text-zinc-400 uppercase font-mono">Activos</div>
              <div className="text-lg font-bold text-white">{activeCount} / {addons.length}</div>
            </div>
          </div>

          <div className="bg-[#0C0C12] border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
            <Layers className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-xs text-zinc-400 uppercase font-mono">Capacidades</div>
              <div className="text-lg font-bold text-purple-300">{totalCapabilities}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(
          [
            { id: 'ALL', label: 'Todos los Módulos' },
            { id: 'VIP', label: 'Familia & Red Cálida (VIP)' },
            { id: 'STRATEGY', label: 'Estrategias Patrimoniales' },
            { id: 'CHANNELS', label: 'Canales & Core' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
              filter === tab.id
                ? 'bg-white/15 text-white border border-white/20 shadow-md shadow-black/40'
                : 'bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add-ons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAddons.map((addon) => {
          const isActive = addon.status === 'ACTIVE';
          const isToggling = togglingId === addon.id;

          return (
            <motion.div
              key={addon.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all relative overflow-hidden bg-[#0C0C12] ${
                isActive
                  ? 'border-emerald-500/20 shadow-lg shadow-emerald-500/5 hover:border-emerald-500/40'
                  : 'border-white/5 opacity-85 hover:border-white/15'
              }`}
            >
              {/* Card Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`p-3 rounded-xl border shrink-0 ${
                      isActive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'
                    }`}>
                      {getAddOnIcon(addon.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white tracking-tight">{addon.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
                          v{addon.version}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold mt-0.5 block">
                        {addon.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider shrink-0 ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                    {isActive ? 'ACTIVO' : 'DISPONIBLE'}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">{addon.description}</p>

                {/* Capabilities Matrix */}
                {addon.capabilities && addon.capabilities.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={12} className="text-purple-400" />
                      <span>Capacidades Integradas ({addon.capabilities.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {addon.capabilities.map((cap) => (
                        <span
                          key={cap.id}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/10 text-zinc-300 flex items-center gap-1"
                          title={cap.description}
                        >
                          <span>{cap.id.replace(/_/g, ' ')}</span>
                          <span className="text-[9px] font-mono uppercase text-indigo-400/80">({cap.category})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer: Metadata & Action Toggle */}
              <div className="pt-5 mt-5 border-t border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                  {addon.requiresHumanApproval ? (
                    <span className="flex items-center gap-1 text-amber-400/90">
                      <ShieldCheck size={12} /> Human Gate
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-400/80">
                      <ShieldCheck size={12} /> Auto-Governed
                    </span>
                  )}
                  <span>·</span>
                  <span className="uppercase">{addon.channels.join(', ')}</span>
                </div>

                <button
                  onClick={() => handleToggle(addon)}
                  disabled={isPending && isToggling}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 ${
                    isActive
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                  }`}
                >
                  {isToggling ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : isActive ? (
                    <XCircle size={13} />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  <span>{isActive ? 'Desactivar' : 'Activar 1-Clic'}</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
