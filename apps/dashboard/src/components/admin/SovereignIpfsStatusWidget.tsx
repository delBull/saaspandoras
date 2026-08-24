'use client';

import React, { useState, useEffect } from 'react';
import { HardDrive, ShieldCheck, RefreshCw, Activity, AlertTriangle, CheckCircle2, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface IpfsStatusResponse {
  success: boolean;
  health: {
    primary: {
      provider: string;
      ok: boolean;
      latencyMs: number;
      endpoint: string;
      version: string;
    };
    backup?: {
      provider: string;
      ok: boolean;
      latencyMs: number;
      configured: boolean;
    };
    overallOk?: boolean;
  };
  stats: {
    claimContracts: number;
    knowledgePacks: number;
    legalAgreements: number;
    totalSovereignArtifacts: number;
    durability?: {
      durable: number;
      degradedOrSingle: number;
    };
  };
  timestamp: string;
}

export function SovereignIpfsStatusWidget() {
  const [data, setData] = useState<IpfsStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [repairing, setRepairing] = useState(false);

  const fetchStatus = async (isManual = false) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ipfs/status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (isManual) toast.success('Estado de IPFS Soberano actualizado');
      } else {
        if (isManual) toast.error('Error consultando estado de IPFS');
      }
    } catch {
      if (isManual) toast.error('Fallo de conexión con API de IPFS');
    } finally {
      setLoading(false);
    }
  };

  const handleRepair = async () => {
    setRepairing(true);
    try {
      toast.loading('Reconciliando evidencias legales PENDING/DEGRADED...');
      const res = await fetch('/api/admin/ipfs/repair', { method: 'POST' });
      const json = await res.json();
      toast.dismiss();
      if (json.success) {
        toast.success(`Reconciliación completada: ${json.result.repairedCount} evidencias reparadas.`);
        fetchStatus(false);
      } else {
        toast.error(`Error de reconciliación: ${json.error}`);
      }
    } catch {
      toast.dismiss();
      toast.error('Fallo al ejecutar motor de reparación');
    } finally {
      setRepairing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const isPrimaryOnline = data?.health?.primary?.ok;
  const isBackupOnline = data?.health?.backup?.ok;

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-100 tracking-tight">Sovereign IPFS Infrastructure</h3>
              <Badge variant="outline" className="bg-lime-500/10 border-lime-500/30 text-lime-400 text-[10px] font-mono">
                Phase A Baseline
              </Badge>
            </div>
            <p className="text-xs text-zinc-400">Kubo Dedicated Primary Node + External Pinata DR Mirror</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRepair}
            disabled={repairing || loading}
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs h-8 gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${repairing ? 'animate-spin' : ''}`} />
            Reconciliar Evidencias
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStatus(true)}
            disabled={loading}
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs h-8 gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Health Check
          </Button>
        </div>
      </div>

      {/* Node Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kubo Primary Node */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Kubo Primary Node</span>
            </div>
            {isPrimaryOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> ONLINE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-3 h-3" /> OFFLINE
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-zinc-950/60 rounded-lg p-2 border border-zinc-800/40">
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Latency</span>
              <span className="font-semibold text-zinc-200">{data?.health?.primary?.latencyMs ?? '--'} ms</span>
            </div>
            <div className="bg-zinc-950/60 rounded-lg p-2 border border-zinc-800/40">
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Engine Version</span>
              <span className="font-semibold text-zinc-200 font-mono text-[11px]">{data?.health?.primary?.version ?? 'v0.32.0'}</span>
            </div>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono truncate">
            RPC: <span className="text-zinc-400">{data?.health?.primary?.endpoint || 'rpc.ipfs.pandoras.finance'}</span>
          </div>
        </div>

        {/* Pinata External DR */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Pinata DR Mirror</span>
            </div>
            {isBackupOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> HEALTHY
              </span>
            ) : data?.health?.backup?.configured ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-3 h-3" /> DEGRADED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-700/20">
                STANDALONE
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-zinc-950/60 rounded-lg p-2 border border-zinc-800/40">
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">DR Latency</span>
              <span className="font-semibold text-zinc-200">{data?.health?.backup?.latencyMs ?? '--'} ms</span>
            </div>
            <div className="bg-zinc-950/60 rounded-lg p-2 border border-zinc-800/40">
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Role</span>
              <span className="font-semibold text-zinc-300">Disaster Recovery</span>
            </div>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono truncate">
            Gateway: <span className="text-zinc-400">gateway.pinata.cloud</span>
          </div>
        </div>
      </div>

      {/* Artifacts Storage Count Summary */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-zinc-300">Artifacts in Sovereign Storage:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span className="text-zinc-400">
            Claims: <strong className="text-purple-400">{data?.stats?.claimContracts ?? 0}</strong>
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">
            Vault Packs: <strong className="text-cyan-400">{data?.stats?.knowledgePacks ?? 0}</strong>
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">
            Legal Agreements: <strong className="text-emerald-400">{data?.stats?.legalAgreements ?? 0}</strong>
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">
            Verified Durable: <strong className="text-lime-400">{data?.stats?.durability?.durable ?? 0}</strong>
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">
            Total: <strong className="text-zinc-100">{data?.stats?.totalSovereignArtifacts ?? 0}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
