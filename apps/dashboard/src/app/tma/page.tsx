'use client';

import React, { useEffect, useState, useTransition, useCallback } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  ChevronDown,
  Building2,
  Lock,
  Cpu,
  Check,
  X,
  FileText,
  Clock,
  Activity,
  Server
} from 'lucide-react';

interface AuthorizedTenant {
  organizationId: string;
  organizationName: string;
  tenantSlug?: string;
  projectId?: number;
  role: 'OWNER' | 'ADMIN' | 'OPERATOR';
  isOwner: boolean;
}

interface HermesSession {
  subject: {
    telegramUserId: string;
    username?: string;
    internalUserId?: string;
    walletAddress?: string;
  };
  tenant: {
    organizationId: string;
    organizationName: string;
    tenantSlug?: string;
    projectId?: number;
  };
  actorId: string;
  role: 'OWNER' | 'ADMIN' | 'OPERATOR';
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  source: 'TELEGRAM';
}

interface PendingFact {
  id: string;
  dimension: string;
  key: string;
  content: string;
  status: string;
  version: number;
  source: string;
  sourceReference?: string;
  createdAt: string;
}

interface OverviewMetrics {
  facts: {
    verified: number;
    pending: number;
  };
  journeys: {
    active: number;
  };
  security: {
    events24h: number;
  };
  ipfs: {
    status: string;
    provider: string;
  };
}

export default function HermesTmaPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<HermesSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authorizedTenants, setAuthorizedTenants] = useState<AuthorizedTenant[]>([]);
  const [switching, startTransition] = useTransition();
  const [showTenantSelector, setShowTenantSelector] = useState(false);
  
  // Navigation tabs: 'overview' | 'know'
  const [activeTab, setActiveTab] = useState<'overview' | 'know'>('overview');

  // Overview metrics state
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Pending facts state
  const [pendingFacts, setPendingFacts] = useState<PendingFact[]>([]);
  const [factsLoading, setFactsLoading] = useState(false);
  const [actingFactId, setActingFactId] = useState<string | null>(null);

  // Trigger Telegram Haptics safely
  const triggerHaptic = useCallback((type: 'success' | 'warning' | 'error' | 'light' | 'medium') => {
    try {
      const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined;
      if (type === 'light' || type === 'medium') {
        tg?.HapticFeedback?.impactOccurred?.(type);
      } else {
        tg?.HapticFeedback?.notificationOccurred?.(type);
      }
    } catch {
      // Ignored outside Telegram webview
    }
  }, []);

  // Fetch overview metrics
  const fetchOverviewMetrics = useCallback(async (authToken: string) => {
    try {
      setMetricsLoading(true);
      const res = await fetch('/api/v1/hermes/tma/overview', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('[TMA] Failed to fetch overview metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Fetch pending facts for active workspace
  const fetchPendingFacts = useCallback(async (authToken: string) => {
    try {
      setFactsLoading(true);
      const res = await fetch('/api/v1/hermes/tma/knowledge/pending', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setPendingFacts(data.items);
      }
    } catch (err) {
      console.error('[TMA] Failed to fetch pending facts:', err);
    } finally {
      setFactsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initialize Telegram WebApp SDK
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined;
    if (tg) {
      tg.ready();
      tg.expand?.();
    }

    const initData = tg?.initData || '';
    const searchParams = new URLSearchParams(window.location.search);
    const tenantParam = searchParams.get('tenant') || undefined;

    // 2. Perform authentication handshake with BFF
    async function authenticate() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/v1/hermes/tma/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initData: initData || 'dev_test_mode=1',
            targetWorkspace: tenantParam,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || 'Authentication failed');
          return;
        }

        setSession(data.session);
        setToken(data.token);
        setAuthorizedTenants(data.authorizedTenants || []);

        if (data.token) {
          fetchOverviewMetrics(data.token);
          fetchPendingFacts(data.token);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to connect to Hermes OS API');
      } finally {
        setLoading(false);
      }
    }

    authenticate();
  }, [fetchOverviewMetrics, fetchPendingFacts]);

  // Handle Workspace Switch
  const handleSwitchTenant = (targetOrgId: string) => {
    if (!token || switching) return;

    startTransition(async () => {
      try {
        const res = await fetch('/api/v1/hermes/tma/switch', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ targetOrganizationId: targetOrgId }),
        });

        const data = await res.json();
        if (data.success && data.session) {
          setSession(data.session);
          setToken(data.token);
          setShowTenantSelector(false);
          triggerHaptic('success');
          
          if (data.token) {
            fetchOverviewMetrics(data.token);
            fetchPendingFacts(data.token);
          }
        } else {
          alert(`Error switching workspace: ${data.error}`);
        }
      } catch (err: any) {
        alert(`Failed to switch: ${err.message}`);
      }
    });
  };

  // Handle 1-Tap Fact Approval
  const handleApproveFact = async (factId: string) => {
    if (!token || actingFactId) return;

    try {
      setActingFactId(factId);
      triggerHaptic('medium');

      const res = await fetch('/api/v1/hermes/tma/knowledge/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ knowledgeId: factId }),
      });

      const data = await res.json();
      if (data.success) {
        // Optimistic removal from pending list
        setPendingFacts(prev => prev.filter(f => f.id !== factId));
        setMetrics(prev => prev ? {
          ...prev,
          facts: {
            verified: prev.facts.verified + 1,
            pending: Math.max(0, prev.facts.pending - 1),
          }
        } : prev);
        triggerHaptic('success');
      } else {
        alert(`Error al aprobar: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error al aprobar: ${err.message}`);
    } finally {
      setActingFactId(null);
    }
  };

  // Handle 1-Tap Fact Rejection
  const handleRejectFact = async (factId: string) => {
    if (!token || actingFactId) return;

    try {
      setActingFactId(factId);
      triggerHaptic('medium');

      const res = await fetch('/api/v1/hermes/tma/knowledge/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ knowledgeId: factId }),
      });

      const data = await res.json();
      if (data.success) {
        setPendingFacts(prev => prev.filter(f => f.id !== factId));
        setMetrics(prev => prev ? {
          ...prev,
          facts: {
            ...prev.facts,
            pending: Math.max(0, prev.facts.pending - 1),
          }
        } : prev);
        triggerHaptic('warning');
      } else {
        alert(`Error al rechazar: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error al rechazar: ${err.message}`);
    } finally {
      setActingFactId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center animate-pulse mb-4">
          <Cpu className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
        <h2 className="text-lg font-semibold text-slate-100">Iniciando Hermes OS...</h2>
        <p className="text-xs text-slate-400 mt-1">Validando identidad criptográfica y membresías</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-rose-400" />
        </div>
        <h2 className="text-lg font-semibold text-rose-400">Acceso No Autorizado</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-xs">{error || 'No se encontraron workspaces autorizados para esta cuenta.'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      {/* Top Header: Platform + Workspace Selector */}
      <header className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-4 shadow-lg relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-wider text-indigo-400 uppercase font-semibold">
                Hermes OS • Command Center
              </div>
              <button
                onClick={() => {
                  if (authorizedTenants.length > 1) {
                    setShowTenantSelector(!showTenantSelector);
                    triggerHaptic('light');
                  }
                }}
                className="flex items-center space-x-1 text-left group"
              >
                <h1 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition">
                  {session.tenant.organizationName}
                </h1>
                {authorizedTenants.length > 1 && (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-300 transition mt-0.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              {session.role}
            </span>
          </div>
        </div>

        {/* Tenant Switcher Dropdown */}
        {showTenantSelector && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5 animate-in fade-in">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Seleccionar Workspace ({authorizedTenants.length})
            </div>
            {authorizedTenants.map(t => (
              <button
                key={t.organizationId}
                disabled={switching || t.organizationId === session.tenant.organizationId}
                onClick={() => handleSwitchTenant(t.organizationId)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition ${
                  t.organizationId === session.tenant.organizationId
                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-200'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{t.organizationName}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{t.role}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Navigation Tabs */}
      <nav className="grid grid-cols-2 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
        <button
          onClick={() => { setActiveTab('overview'); triggerHaptic('light'); }}
          className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => { setActiveTab('know'); triggerHaptic('light'); }}
          className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition relative ${
            activeTab === 'know'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Bóveda KNOW</span>
          {pendingFacts.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-[9px] text-white flex items-center justify-center font-bold">
              {pendingFacts.length}
            </span>
          )}
        </button>
      </nav>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in">
          {/* System Core Health Strip */}
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Estado del Sistema</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>OPERATIVO</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
                <div className="text-slate-400">Postgres</div>
                <div className="text-emerald-400 font-semibold mt-0.5">ONLINE</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
                <div className="text-slate-400">IPFS Vault</div>
                <div className="text-emerald-400 font-semibold mt-0.5">{metrics?.ipfs.status || 'DURABLE'}</div>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
                <div className="text-slate-400">Firewall K26</div>
                <div className="text-indigo-400 font-semibold mt-0.5">ENFORCING</div>
              </div>
            </div>
          </section>

          {/* Pending Actions & Metric Counters */}
          <section className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Métricas Operativas
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div 
                onClick={() => { setActiveTab('know'); triggerHaptic('light'); }}
                className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-3.5 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-lg font-bold text-slate-100 font-mono">
                    {metrics?.facts.pending ?? pendingFacts.length}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-2">Hechos Pendientes</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Esperando aprobación</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-lg font-bold text-slate-100 font-mono">
                    {metrics?.journeys.active ?? 0}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-2">Journeys Activos</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Prospectos en pipeline</div>
              </div>
            </div>
          </section>

          {/* Quick Access Details */}
          <section className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-3.5 space-y-2">
            <div className="text-xs font-semibold text-slate-300">Resumen de Bóveda</div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Hechos Verificados</span>
              <span className="font-mono font-semibold text-emerald-400">{metrics?.facts.verified ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Eventos de Seguridad (24h)</span>
              <span className="font-mono font-semibold text-slate-300">{metrics?.security.events24h ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-400">Proveedor Primario IPFS</span>
              <span className="font-mono font-semibold text-indigo-400">{metrics?.ipfs.provider ?? 'KUBO'}</span>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: KNOW BÓVEDA */}
      {activeTab === 'know' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Hechos por Validar ({pendingFacts.length})
            </div>
            <button
              onClick={() => token && fetchPendingFacts(token)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono"
            >
              Actualizar
            </button>
          </div>

          {factsLoading ? (
            <div className="text-center py-10">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mx-auto mb-2" />
              <div className="text-xs text-slate-400">Cargando hechos de la bóveda...</div>
            </div>
          ) : pendingFacts.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-200">¡Bóveda al día!</div>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                No hay hechos pendientes de verificación para este workspace.
              </p>
            </div>
          ) : (
            pendingFacts.map(fact => (
              <div
                key={fact.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {fact.dimension}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    v{fact.version}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-200">{fact.key}</div>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
                    {fact.content}
                  </p>
                </div>

                {fact.sourceReference && (
                  <div className="text-[10px] text-slate-400 flex items-center space-x-1 truncate">
                    <FileText className="w-3 h-3 flex-shrink-0 text-slate-400" />
                    <span className="truncate">{fact.sourceReference}</span>
                  </div>
                )}

                {/* 1-Tap Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    disabled={actingFactId === fact.id}
                    onClick={() => handleRejectFact(fact.id)}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 rounded-xl text-xs font-medium transition active:scale-95"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Rechazar</span>
                  </button>
                  <button
                    disabled={actingFactId === fact.id}
                    onClick={() => handleApproveFact(fact.id)}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aprobar (1-Tap)</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Operator Footnote */}
      <footer className="pt-4 text-center">
        <div className="text-[10px] text-slate-400">
          Sesión: <code className="text-indigo-400">{session.actorId}</code>
        </div>
      </footer>
    </div>
  );
}
