'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Database, CheckCircle2, AlertCircle, XCircle, FileText, Lock, Eye, 
  History, Network, Zap, Shield, Filter, Plus, FileEdit, Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { 
  GovernedKnowledgeItem, 
  KnowledgeMutationEvent, 
  KnowledgeDimension
} from '@/lib/pandoras/core/domains/hermes/knowledge/types';

import { 
  approveKnowledgeAction,
  rejectKnowledgeAction,
  getKnowledgeByStatusAction,
  getAuditTrailAction,
  getExclusionRegisterAction,
  getMarketplaceAddOnsAction,
  requestAddOnInstallationAction,
  approveAddOnInstallationAction,
  rejectAddOnInstallationAction,
  suspendAddOnAction,
  getEffectiveContextAction
} from '@/app/org/[tenantId]/actions';

// ─── Tabs ────────────────────────────────────────────────────────
type ConsoleTab = 'knowledge' | 'addons' | 'governance' | 'context' | 'audit';

const TABS: { id: ConsoleTab; label: string; icon: React.ReactNode }[] = [
  { id: 'knowledge', label: 'Knowledge Base', icon: <Database className="w-4 h-4" /> },
  { id: 'addons', label: 'Add-On Marketplace', icon: <Zap className="w-4 h-4" /> },
  { id: 'governance', label: 'Governance & Policies', icon: <Shield className="w-4 h-4" /> },
  { id: 'context', label: 'Effective Context', icon: <Network className="w-4 h-4" /> },
  { id: 'audit', label: 'Governance Audit', icon: <History className="w-4 h-4" /> },
];

export default function KnowledgeStudio({ tenantId }: { tenantId: string }) {
  const [activeTab, setActiveTab] = useState<ConsoleTab>('knowledge');
  
  // States
  const [knowledgeItems, setKnowledgeItems] = useState<GovernedKnowledgeItem[]>([]);
  const [auditLog, setAuditLog] = useState<KnowledgeMutationEvent[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const items = await getKnowledgeByStatusAction(tenantId, 'ACTIVE');
      const discovered = await getKnowledgeByStatusAction(tenantId, 'DISCOVERED');
      const pending = await getKnowledgeByStatusAction(tenantId, 'PENDING_REVIEW');
      const rejected = await getKnowledgeByStatusAction(tenantId, 'REJECTED');
      const superseded = await getKnowledgeByStatusAction(tenantId, 'SUPERSEDED');
      
      setKnowledgeItems([...items, ...discovered, ...pending, ...rejected, ...superseded]);
      
      const audits = await getAuditTrailAction(tenantId);
      setAuditLog(audits);
    } catch (error) {
      console.error("Failed to load knowledge studio data:", error);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData().then(() => setIsInitializing(false));
  }, [loadData]);

  // Actions
  const handleApprove = async (id: string, version: number) => {
    try {
      await approveKnowledgeAction(tenantId, id, version);
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Rejection Reason:");
    if (!reason) return;
    try {
      await rejectKnowledgeAction(tenantId, id, reason);
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (isInitializing) return <div className="text-zinc-400 text-sm animate-pulse">Initializing Control Plane...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            Knowledge Governance Console
          </h2>
          <p className="text-sm text-zinc-400 mt-1 font-light">
            Control Plane cognitivo: Autoridad, Gobernanza y Capabilities.
          </p>
        </div>
        <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-xs font-mono">
          Tenant: {tenantId.toUpperCase()}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              activeTab === tab.id
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'knowledge' && (
            <KnowledgeTab 
              items={knowledgeItems} 
              onApprove={handleApprove} 
              onReject={handleReject} 
            />
          )}
          {activeTab === 'addons' && <AddOnsTab tenantId={tenantId} />}
          {activeTab === 'governance' && <GovernanceTab />}
          {activeTab === 'context' && <EffectiveContextTab tenantId={tenantId} />}
          {activeTab === 'audit' && <AuditTab logs={auditLog} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. KNOWLEDGE TAB
// ─────────────────────────────────────────────────────────────────────────────
function KnowledgeTab({ 
  items, 
  onApprove, 
  onReject 
}: { 
  items: GovernedKnowledgeItem[], 
  onApprove: (id: string, v: number) => void,
  onReject: (id: string) => void
}) {
  const discovered = items.filter(i => i.lifecycle.status === 'DISCOVERED' || i.lifecycle.status === 'PENDING_REVIEW');
  const active = items.filter(i => i.lifecycle.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      
      {/* Discovery Queue */}
      {discovered.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Discovery Queue ({discovered.length})
          </h3>
          <div className="grid gap-3">
            {discovered.map(item => (
              <div key={item.id} className="border border-amber-500/30 bg-amber-500/5 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex gap-2 items-center mb-1">
                      <span className="text-xs font-mono uppercase text-zinc-400">{item.scope.dimension}</span>
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">{item.lifecycle.status}</Badge>
                    </div>
                    <p className="text-sm text-white font-medium">"{item.content.content}"</p>
                  </div>
                </div>
                
                <div className="flex gap-4 text-[10px] text-zinc-500 font-mono">
                  <span>Source: {item.governance.source}</span>
                  <span>Actor: {item.audit.discoveredBy}</span>
                  <span>Visibility: {item.governance.visibility}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => onApprove(item.id, item.lifecycle.version)} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex gap-1.5 items-center">
                    <CheckCircle2 className="w-3 h-3" /> Approve
                  </button>
                  <button onClick={() => onReject(item.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex gap-1.5 items-center">
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Knowledge */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-zinc-400" /> Active Knowledge ({active.length})
        </h3>
        <div className="grid gap-3">
          {active.map(item => (
            <div key={item.id} className="border border-zinc-800 bg-zinc-900/30 rounded-2xl p-5 space-y-3 group">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 items-center mb-1">
                    <span className="text-xs font-mono uppercase text-zinc-400">{item.scope.dimension}</span>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">{item.lifecycle.status} v{item.lifecycle.version}</Badge>
                    <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]">{item.governance.authority}</Badge>
                  </div>
                  <p className="text-sm text-white font-medium">"{item.content.content}"</p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white flex gap-1.5 items-center">
                  <FileEdit className="w-3 h-3" /> Edit
                </button>
              </div>
              <div className="flex gap-4 text-[10px] text-zinc-500 font-mono">
                <span>Key: {item.content.key}</span>
                <span>Visibility: {item.governance.visibility}</span>
                <span>Approved By: {item.audit.reviewedBy || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ADD-ONS TAB
// ─────────────────────────────────────────────────────────────────────────────
function AddOnsTab({ tenantId }: { tenantId: string }) {
  const [marketplace, setMarketplace] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMarketplace = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMarketplaceAddOnsAction(tenantId);
      setMarketplace(data);
    } catch (e: any) {
      alert("Error loading marketplace: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  const handleRequestInstall = async (addonId: string) => {
    try {
      await requestAddOnInstallationAction(tenantId, addonId);
      await loadMarketplace();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleApproveInstall = async (installationId: string) => {
    try {
      await approveAddOnInstallationAction(tenantId, installationId);
      await loadMarketplace();
    } catch (e: any) {
      alert(e.message);
    }
  };
  
  const handleRejectInstall = async (installationId: string) => {
    try {
      await rejectAddOnInstallationAction(tenantId, installationId);
      await loadMarketplace();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSuspendInstall = async (installationId: string) => {
    try {
      await suspendAddOnAction(tenantId, installationId);
      await loadMarketplace();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (isLoading) {
    return <div className="text-zinc-400 text-sm animate-pulse">Loading Marketplace...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {marketplace.map(item => {
        const manifest = item.manifest;
        const installation = item.installation;
        const status = installation?.status || 'AVAILABLE';

        return (
          <div key={manifest.id} className={`border rounded-2xl p-5 space-y-4 ${
            status === 'ACTIVE' 
              ? 'border-emerald-500/30 bg-emerald-500/5' 
              : status === 'PENDING_APPROVAL' 
                ? 'border-amber-500/30 bg-amber-500/5'
                : 'border-zinc-800 bg-zinc-900/30'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-white">{manifest.name}</h4>
                <p className="text-xs text-zinc-400 mt-0.5">{manifest.description}</p>
                <div className="text-[10px] text-zinc-500 mt-1 font-mono">v{manifest.version}</div>
              </div>
              <Badge className={
                status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]' :
                status === 'PENDING_APPROVAL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]' :
                status === 'AVAILABLE' ? 'bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]' :
                'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-[10px]'
              }>
                {status}
              </Badge>
            </div>

            <div className="space-y-4">
              {/* Capabilities */}
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Capabilities</p>
                <ul className="text-xs text-zinc-300 space-y-1">
                  {manifest.capabilities?.map((cap: any) => (
                    <li key={cap.id} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {cap.name}
                    </li>
                  ))}
                  {(!manifest.capabilities || manifest.capabilities.length === 0) && (
                    <li className="text-zinc-500 italic">No declared capabilities.</li>
                  )}
                </ul>
              </div>

              {/* Governance */}
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Governance Required</p>
                <ul className="text-xs text-zinc-400 space-y-1">
                  {manifest.governanceRequirements?.requiresHumanApproval && (
                    <li className="flex items-center gap-2"><Lock className="w-3 h-3 text-amber-400" /> Human Approval</li>
                  )}
                  {manifest.governanceRequirements?.dataAccess && manifest.governanceRequirements.dataAccess.map((acc: any) => (
                    <li key={acc.domain} className="flex items-center gap-2"><Database className="w-3 h-3 text-indigo-400" /> Access: {acc.domain} ({acc.level})</li>
                  ))}
                  {manifest.governanceRequirements?.requiredChannels && manifest.governanceRequirements.requiredChannels.map((ch: any) => (
                    <li key={ch} className="flex items-center gap-2"><Network className="w-3 h-3 text-blue-400" /> Channel: {ch}</li>
                  ))}
                </ul>
              </div>

              {/* Meta */}
              {installation && (
                <div className="border-t border-zinc-800/50 pt-3 flex flex-col gap-1 text-[10px] text-zinc-500 font-mono">
                  {installation.installedBy && <div>Installed By: {installation.installedBy}</div>}
                  {installation.approvedBy && <div>Approved By: {installation.approvedBy}</div>}
                  {installation.activatedAt && <div>Activated At: {new Date(installation.activatedAt).toLocaleString()}</div>}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              {status === 'AVAILABLE' && (
                <button 
                  onClick={() => handleRequestInstall(manifest.id)}
                  className="w-full text-xs py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                >
                  Request Installation
                </button>
              )}
              {status === 'PENDING_APPROVAL' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApproveInstall(installation.id)}
                    className="flex-1 text-xs py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleRejectInstall(installation.id)}
                    className="flex-1 text-xs py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
              {status === 'ACTIVE' && (
                <button 
                  onClick={() => handleSuspendInstall(installation.id)}
                  className="w-full text-xs py-2 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-medium transition-colors"
                >
                  Suspend Add-On
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GOVERNANCE TAB
// ─────────────────────────────────────────────────────────────────────────────
function GovernanceTab() {
  return (
    <div className="space-y-6">
      <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-2xl p-5 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-400" /> Tenant Configurable Policies
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white">Authorized Channels</p>
              <p className="text-[11px] text-zinc-500">Canales donde Hermes puede enviar mensajes proactivamente.</p>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Telegram</Badge>
              <Badge className="bg-zinc-800 text-zinc-500 border-zinc-700">WhatsApp</Badge>
            </div>
          </div>
          <div className="border-t border-zinc-800/50 pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white">Quiet Hours</p>
              <p className="text-[11px] text-zinc-500">Pausar mensajes salientes de 10PM a 8AM.</p>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Enabled</Badge>
          </div>
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-5 space-y-4 opacity-80">
        <h4 className="text-sm font-bold text-zinc-400 flex items-center gap-2">
          <Lock className="w-4 h-4" /> Immutable System Rules (ADR-011)
        </h4>
        <ul className="text-xs text-zinc-500 space-y-2 list-disc list-inside">
          <li>Hermes cannot self-approve its own Governance rules.</li>
          <li>ACTIVE knowledge cannot be deleted, only SUPERSEDED.</li>
          <li>Cross-tenant queries are blocked at the Service layer.</li>
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. EFFECTIVE CONTEXT TAB
// ─────────────────────────────────────────────────────────────────────────────
function EffectiveContextTab({ tenantId }: { tenantId: string }) {
  const [excluded, setExcluded] = useState<GovernedKnowledgeItem[]>([]);
  const [effectiveCtx, setEffectiveCtx] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getExclusionRegisterAction(tenantId).then(setExcluded),
      getEffectiveContextAction(tenantId).then(setEffectiveCtx)
    ]).finally(() => setIsLoading(false));
  }, [tenantId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" /> Live Effective Context
        </h4>
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-2xl p-4 font-mono text-[10px] text-zinc-300 space-y-2">
          {isLoading ? (
            <p className="text-zinc-500 animate-pulse">// Loading runtime context...</p>
          ) : effectiveCtx ? (
            <>
              <p className="text-emerald-400">{"// Effective context at runtime"}</p>
              <p><span className="text-zinc-500">mode: </span><span className="text-purple-300">{effectiveCtx.style?.mode}</span></p>
              <p><span className="text-zinc-500">exclusivity: </span><span className="text-purple-300">{effectiveCtx.style?.exclusivity}</span></p>
              <p><span className="text-zinc-500">activeCapabilities: </span></p>
              {effectiveCtx.activeCapabilities?.length > 0 
                ? effectiveCtx.activeCapabilities.map((c: any) => (
                    <p key={c.id} className="pl-4 text-emerald-400">✓ {c.id}</p>
                  ))
                : <p className="pl-4 text-zinc-500">// None</p>
              }
              {effectiveCtx.diagnostics?.excludedAddOns?.length > 0 && (
                <>
                  <p className="text-red-400 pt-1">{"// Excluded Add-Ons"}</p>
                  {effectiveCtx.diagnostics.excludedAddOns.map((a: any) => (
                    <p key={a.id} className="pl-4 text-red-400/70">✕ {a.id} ({a.status})</p>
                  ))}
                </>
              )}
            </>
          ) : (
            <p className="text-zinc-500">// No context available.</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Exclusion Register
        </h4>
        <p className="text-xs text-zinc-400">Knowledge explicitly hidden from the LLM.</p>
        <div className="space-y-2">
          {excluded.map(ex => (
            <div key={ex.id} className="border border-red-500/20 bg-red-500/5 rounded-xl p-3 text-xs flex justify-between items-center">
              <span className="text-zinc-300 truncate pr-4 max-w-[200px]">"{ex.content.content}"</span>
              <Badge className="bg-red-500/10 text-red-400 border-red-500/30 whitespace-nowrap">
                {ex.lifecycle.status}
              </Badge>
            </div>
          ))}
          {excluded.length === 0 && <p className="text-xs text-zinc-500">No excluded items.</p>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. AUDIT TAB
// ─────────────────────────────────────────────────────────────────────────────
function AuditTab({ logs }: { logs: KnowledgeMutationEvent[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 text-sm font-bold text-white">
        <History className="w-4 h-4 text-zinc-400" /> Audit Trail (Append-Only)
      </div>
      
      <div className="space-y-2">
        {logs.slice().map(log => (
          <div key={log.eventId} className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-4 flex gap-4 text-xs font-mono items-center">
            <div className="text-zinc-500 min-w-[120px]">
              {new Date(log.timestamp).toLocaleTimeString()}
            </div>
            <div className="w-24">
              <Badge className={
                log.action === 'APPROVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                log.action === 'REJECT' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }>
                {log.action}
              </Badge>
            </div>
            <div className="text-zinc-300 truncate max-w-sm">
              Actor: <span className="text-indigo-400">{log.actorId}</span> → Item: <span className="text-zinc-500">{log.knowledgeId}</span>
            </div>
            {log.reason && <div className="text-zinc-500 ml-auto italic">"{log.reason}"</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
