'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode2,
  Hash,
  Clock,
  User,
  Zap,
  Sparkles,
  ExternalLink,
  Layers,
  ChevronRight,
  X,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

export interface SecurityEventItem {
  id: string;
  eventType: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  policyDecision: 'ALLOW' | 'DENY' | 'AUDIT';
  sequenceNumber: number | null;
  contentHash: string | null;
  eventHash: string | null;
  previousEventHash: string | null;
  actorId: string | null;
  toolId: string | null;
  classification: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AddonAuditEventItem {
  id: string;
  addonId: string;
  eventType: string;
  actorId: string | null;
  actorType: string | null;
  oldStatus: string | null;
  newStatus: string | null;
  version: string | null;
  reason: string | null;
  createdAt: string;
}

export function ActivityClient({
  organizationSlug,
  organizationName,
  securityEvents,
  addonAudits,
}: {
  organizationSlug: string;
  organizationName: string;
  securityEvents: SecurityEventItem[];
  addonAudits: AddonAuditEventItem[];
}) {
  const [activeTab, setActiveTab] = useState<'SECURITY_SPINE' | 'ADDON_AUDIT'>('SECURITY_SPINE');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'CRITICAL'>('ALL');
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | 'ALLOW' | 'DENY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEventItem | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    toast.success(`${label} copiado`);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredSecurityEvents = securityEvents.filter((evt) => {
    if (severityFilter !== 'ALL' && evt.severity !== severityFilter) return false;
    if (decisionFilter !== 'ALL' && evt.policyDecision !== decisionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchType = evt.eventType?.toLowerCase().includes(q);
      const matchHash = evt.eventHash?.toLowerCase().includes(q);
      const matchActor = evt.actorId?.toLowerCase().includes(q);
      const matchTool = evt.toolId?.toLowerCase().includes(q);
      if (!matchType && !matchHash && !matchActor && !matchTool) return false;
    }
    return true;
  });

  const filteredAddonAudits = addonAudits.filter((audit) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        audit.addonId.toLowerCase().includes(q) ||
        audit.eventType.toLowerCase().includes(q) ||
        (audit.reason && audit.reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalEvents = securityEvents.length;
  const passedCount = securityEvents.filter((e) => e.policyDecision === 'ALLOW').length;
  const blockedCount = securityEvents.filter((e) => e.policyDecision === 'DENY').length;
  const latestSequence = securityEvents[0]?.sequenceNumber ?? 0;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Event Spine & Activity Ledger</h1>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-500/30">
              {organizationName}
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Libro mayor inmutable con encadenamiento criptográfico de hash de decisiones, políticas y auditoría de Add-Ons.
          </p>
        </div>

        {/* Global KPIs */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-[#0C0C12] border border-white/10 rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-mono">Permitidos</div>
              <div className="text-sm font-bold text-emerald-400">{passedCount}</div>
            </div>
          </div>

          <div className="bg-[#0C0C12] border border-white/10 rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-lg">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-mono">Bloqueados</div>
              <div className="text-sm font-bold text-red-400">{blockedCount}</div>
            </div>
          </div>

          <div className="bg-[#0C0C12] border border-white/10 rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-lg">
            <Hash className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-mono">Secuencia</div>
              <div className="text-sm font-bold text-purple-300 font-mono">#{latestSequence}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-[#0C0C12] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('SECURITY_SPINE')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'SECURITY_SPINE'
                ? 'bg-white/15 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Event Spine ({securityEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ADDON_AUDIT')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'ADDON_AUDIT'
                ? 'bg-white/15 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Add-On Audit ({addonAudits.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por tipo de evento, hash o actor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0C0C12] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* Security Spine Sub-Filters */}
      {activeTab === 'SECURITY_SPINE' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mr-2 font-mono">
            <Filter size={13} />
            <span>Filtros:</span>
          </div>

          {(['ALL', 'CRITICAL', 'WARN', 'INFO'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                severityFilter === sev
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              Severidad: {sev}
            </button>
          ))}

          <div className="h-4 w-px bg-white/10 mx-1" />

          {(['ALL', 'ALLOW', 'DENY'] as const).map((dec) => (
            <button
              key={dec}
              onClick={() => setDecisionFilter(dec)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                decisionFilter === dec
                  ? dec === 'DENY'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              Decisión: {dec}
            </button>
          ))}
        </div>
      )}

      {/* Content Feed */}
      {activeTab === 'SECURITY_SPINE' ? (
        <div className="space-y-3">
          {filteredSecurityEvents.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#0C0C12] p-12 text-center text-zinc-500">
              <Activity className="w-8 h-8 mx-auto mb-3 text-zinc-600" />
              <p className="text-sm">No se encontraron eventos con los filtros seleccionados.</p>
            </div>
          ) : (
            filteredSecurityEvents.map((evt) => {
              const isAllow = evt.policyDecision === 'ALLOW';
              const isDeny = evt.policyDecision === 'DENY';
              const isCritical = evt.severity === 'CRITICAL';

              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedEvent(evt)}
                  className={`rounded-xl border p-4 transition-all bg-[#0C0C12] hover:bg-[#101018] cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDeny
                      ? 'border-red-500/20 hover:border-red-500/40'
                      : isCritical
                      ? 'border-amber-500/20 hover:border-amber-500/40'
                      : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start md:items-center gap-3.5 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isDeny
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {isDeny ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white tracking-tight">
                          {evt.eventType.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          evt.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : evt.severity === 'WARN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {evt.severity}
                        </span>

                        {evt.sequenceNumber !== null && (
                          <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded">
                            #{evt.sequenceNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap font-mono">
                        {evt.actorId && <span>Actor: {evt.actorId}</span>}
                        {evt.toolId && <span>Tool: {evt.toolId}</span>}
                        {evt.eventHash && (
                          <span className="text-zinc-500">Hash: {evt.eventHash.substring(0, 10)}...</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <span className="text-xs text-zinc-500 font-mono">
                      {new Date(evt.createdAt).toLocaleTimeString()} · {new Date(evt.createdAt).toLocaleDateString()}
                    </span>
                    <ChevronRight size={14} className="text-zinc-500" />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        /* Addon Audit Feed */
        <div className="space-y-3">
          {filteredAddonAudits.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#0C0C12] p-12 text-center text-zinc-500">
              <Layers className="w-8 h-8 mx-auto mb-3 text-zinc-600" />
              <p className="text-sm">No hay registros de auditoría de Add-Ons.</p>
            </div>
          ) : (
            filteredAddonAudits.map((audit) => (
              <div
                key={audit.id}
                className="rounded-xl border border-white/5 p-4 bg-[#0C0C12] flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">{audit.addonId}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-indigo-300 border border-white/10">
                        {audit.eventType}
                      </span>
                      {audit.version && (
                        <span className="text-[10px] font-mono text-zinc-500">v{audit.version}</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{audit.reason || 'Sin descripción'}</p>
                  </div>
                </div>

                <div className="text-xs text-zinc-500 font-mono self-end md:self-center">
                  {new Date(audit.createdAt).toLocaleTimeString()} · {new Date(audit.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C0C12] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-white/5 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {selectedEvent.eventType.replace(/_/g, ' ')}
                    </h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      selectedEvent.policyDecision === 'DENY'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {selectedEvent.policyDecision}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mt-1">ID: {selectedEvent.id}</p>
                </div>

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Cryptographic Hash Chain Info */}
              <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 font-mono">
                  <Lock size={13} className="text-purple-400" />
                  <span>Cadena Criptográfica Inmutable (SHA-256)</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">EVENT HASH:</span>
                    <div className="flex items-center justify-between bg-white/[0.03] p-2 rounded border border-white/5 text-zinc-300 break-all">
                      <span>{selectedEvent.eventHash || 'N/A'}</span>
                      {selectedEvent.eventHash && (
                        <button
                          onClick={() => copyToClipboard(selectedEvent.eventHash!, 'Event Hash')}
                          className="p-1 hover:text-white text-zinc-400 ml-2"
                        >
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-500 block text-[10px]">PREVIOUS EVENT HASH (CHAIN LINK):</span>
                    <div className="flex items-center justify-between bg-white/[0.03] p-2 rounded border border-white/5 text-zinc-400 break-all">
                      <span>{selectedEvent.previousEventHash || 'GENESIS_ROOT'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata Payload */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-300 font-mono flex items-center gap-1.5">
                  <FileCode2 size={13} className="text-indigo-400" />
                  <span>Payload Metadata & Decision Context</span>
                </div>
                <pre className="bg-black/60 p-4 rounded-xl border border-white/5 text-xs font-mono text-emerald-400/90 overflow-x-auto max-h-60">
                  {JSON.stringify(selectedEvent.metadata || {}, null, 2)}
                </pre>
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-all"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
