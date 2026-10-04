'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ShieldAlert, AlertOctagon, Activity, ServerCrash, RefreshCw, CheckCircle2, Webhook, Link2 } from 'lucide-react';

export interface Incident {
  id: string;
  title: string;
  source: 'WEBHOOK' | 'ONCHAIN' | 'IPFS' | 'SYSTEM';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  timestamp: string;
  details: string;
}

const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'INC-9942',
    title: 'Fallo de Webhook de Stripe en entorno Prod',
    source: 'WEBHOOK',
    severity: 'HIGH',
    status: 'OPEN',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    details: 'El endpoint /api/webhooks/stripe devolvió 500 para el evento invoice.payment_succeeded. Pago de $500 retenido.'
  },
  {
    id: 'INC-9943',
    title: 'Desincronización de Contrato S\'Narai',
    source: 'ONCHAIN',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    details: 'Diferencia de 100 USDC entre balance on-chain de Polygon y base de datos local (NeonDB).'
  },
  {
    id: 'INC-9944',
    title: 'K25 Vault IPFS Pinning Timeout',
    source: 'IPFS',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    details: 'Fallo temporal al pinear credencial KYC a Pinata. Reintentado automáticamente.'
  }
];

export function OperationsIncidentCenter() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = () => {
    setIsRefreshing(true);
    fetch('/api/nexus/incidents')
      .then(res => res.json())
      .then(data => {
        if (data.incidents) {
          const mapped = data.incidents.map((i: any) => ({
            id: i.id,
            title: i.title,
            source: i.source,
            severity: i.severity,
            status: i.status,
            timestamp: i.createdAt,
            details: i.details
          }));
          setIncidents(mapped);
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        setIsRefreshing(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleRefresh = () => {
    fetchIncidents();
  };

  const getSourceIcon = (source: Incident['source']) => {
    switch (source) {
      case 'WEBHOOK': return <Webhook className="w-4 h-4 text-sky-400" />;
      case 'ONCHAIN': return <Link2 className="w-4 h-4 text-purple-400" />;
      case 'IPFS': return <ServerCrash className="w-4 h-4 text-emerald-400" />;
      default: return <Activity className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getSeverityStyles = (severity: Incident['severity']) => {
    switch (severity) {
      case 'CRITICAL': return 'border-rose-500/30 bg-rose-500/10 text-rose-400';
      case 'HIGH': return 'border-orange-500/30 bg-orange-500/10 text-orange-400';
      case 'MEDIUM': return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
      default: return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400';
    }
  };

  const getStatusStyles = (status: Incident['status']) => {
    switch (status) {
      case 'OPEN': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'INVESTIGATING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'RESOLVED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const updateStatus = (id: string, status: Incident['status']) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status } : inc));
  };

  return (
    <div className="flex flex-col h-full bg-[#0C0C10] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 shrink-0">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[11px] font-mono font-bold text-rose-300 tracking-wider truncate">INCIDENT & TRIAJE CENTER</h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate hidden sm:block">Monitoreo de anomalías en Webhooks, On-Chain e IPFS</p>
          </div>
        </div>
        <button 
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
        </button>
      </div>

      {/* Incidents List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {incidents.map((incident) => (
          <motion.div
            key={incident.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${incident.status === 'RESOLVED' ? 'border-white/5 bg-black/20 opacity-60' : 'border-rose-500/10 bg-rose-950/5 hover:border-rose-500/20'} transition-all`}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 bg-black/40 text-zinc-300">
                    {getSourceIcon(incident.source)}
                    {incident.source}
                  </span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold tracking-widest ${getSeverityStyles(incident.severity)}`}>
                    {incident.severity}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(incident.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <h4 className="text-sm font-semibold text-zinc-200">{incident.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{incident.details}</p>
              </div>

              <div className="flex flex-row sm:flex-col gap-2 shrink-0 items-end">
                <span className={`text-[10px] font-mono px-2 py-1 rounded border uppercase ${getStatusStyles(incident.status)}`}>
                  {incident.status}
                </span>
                
                {incident.status !== 'RESOLVED' && (
                  <div className="flex gap-2 mt-2">
                    {incident.status === 'OPEN' && (
                      <button 
                        onClick={() => updateStatus(incident.id, 'INVESTIGATING')}
                        className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono transition-colors"
                      >
                        INVESTIGAR
                      </button>
                    )}
                    <button 
                      onClick={() => updateStatus(incident.id, 'RESOLVED')}
                      className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      CERRAR
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
