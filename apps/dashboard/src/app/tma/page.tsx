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
  Server,
  Target,
  Puzzle,
  Power
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

interface JourneyItem {
  id: string;
  name: string;
  description?: string;
  version: number;
  status: string;
  isDefault: boolean;
  stages: Array<{ id: string; name: string; orderIndex: number; objectives: string[] }>;
  transitionsCount: number;
}

interface AddonItem {
  id: string;
  name: string;
  version: string;
  type: string;
  description: string;
  status: 'ACTIVE' | 'AVAILABLE';
  capabilities: Array<{ id: string; category: string; description: string }>;
  channels: string[];
  requiresHumanApproval: boolean;
}

interface OverviewMetrics {
  postgres: {
    online: boolean;
  };
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
  const [outsideTelegram, setOutsideTelegram] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<HermesSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authorizedTenants, setAuthorizedTenants] = useState<AuthorizedTenant[]>([]);
  const [switching, startTransition] = useTransition();
  const [showTenantSelector, setShowTenantSelector] = useState(false);
  
  // Navigation tabs: 'overview' | 'know' | 'journeys' | 'addons'
  const [activeTab, setActiveTab] = useState<'overview' | 'know' | 'journeys' | 'addons'>('overview');

  // Overview metrics state
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Pending facts state
  const [pendingFacts, setPendingFacts] = useState<PendingFact[]>([]);
  const [factsLoading, setFactsLoading] = useState(false);
  const [actingFactId, setActingFactId] = useState<string | null>(null);

  // Journeys state
  const [journeys, setJourneys] = useState<JourneyItem[]>([]);
  const [journeysLoading, setJourneysLoading] = useState(false);
  const [togglingJourneyId, setTogglingJourneyId] = useState<string | null>(null);

  // Addons state
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [togglingAddonId, setTogglingAddonId] = useState<string | null>(null);

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

  // Fetch Journeys
  const fetchJourneys = useCallback(async (authToken: string) => {
    try {
      setJourneysLoading(true);
      const res = await fetch('/api/v1/hermes/tma/journeys', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (Array.isArray(data.journeys)) {
        setJourneys(data.journeys);
      }
    } catch (err) {
      console.error('[TMA] Failed to fetch journeys:', err);
    } finally {
      setJourneysLoading(false);
    }
  }, []);

  // Fetch Addons
  const fetchAddons = useCallback(async (authToken: string) => {
    try {
      setAddonsLoading(true);
      const res = await fetch('/api/v1/hermes/tma/addons', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (Array.isArray(data.addons)) {
        setAddons(data.addons);
      }
    } catch (err) {
      console.error('[TMA] Failed to fetch addons:', err);
    } finally {
      setAddonsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function waitForSdk(maxMs = 1500): Promise<any> {
      const start = Date.now();
      while (Date.now() - start < maxMs) {
        const tg = (window as any).Telegram?.WebApp;
        if (tg) return tg;
        await new Promise(r => setTimeout(r, 50));
      }
      return undefined;
    }

    async function authenticate() {
      const tg = await waitForSdk();
      tg?.ready?.();
      tg?.expand?.();

      const initData: string = tg?.initData || '';
      const searchParams = new URLSearchParams(window.location.search);
      const tenantParam = searchParams.get('tenant') || undefined;

      if (!initData) {
        setOutsideTelegram(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/v1/hermes/tma/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData, targetTenantId: tenantParam }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Autenticación fallida');
        }

        setSession(data.session);
        setToken(data.token);
        setAuthorizedTenants(data.authorizedTenants || []);
        
        // Initial fetches
        fetchOverviewMetrics(data.token);
        fetchPendingFacts(data.token);
        fetchJourneys(data.token);
        fetchAddons(data.token);

        triggerHaptic('success');
      } catch (err: any) {
        console.error('[Hermes TMA Init Error]:', err);
        setError(err.message || 'Error desconocido al conectar con Hermes OS');
        triggerHaptic('error');
      } finally {
        setLoading(false);
      }
    }

    authenticate();
  }, [triggerHaptic, fetchOverviewMetrics, fetchPendingFacts, fetchJourneys, fetchAddons]);

  // Handle Workspace Switch
  const handleSwitchTenant = (targetOrgId: string) => {
    if (!token) return;
    
    startTransition(async () => {
      try {
        triggerHaptic('light');
        const tg = (window as any).Telegram?.WebApp;
        const initData: string = tg?.initData || '';

        const res = await fetch('/api/v1/hermes/tma/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData, targetTenantId: targetOrgId }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Error al conmutar workspace');
        }

        setSession(data.session);
        setToken(data.token);
        setShowTenantSelector(false);
        
        // Refresh data for new tenant
        fetchOverviewMetrics(data.token);
        fetchPendingFacts(data.token);
        fetchJourneys(data.token);
        fetchAddons(data.token);

        triggerHaptic('success');
      } catch (err: any) {
        alert(err.message || 'No fue posible cambiar de workspace');
        triggerHaptic('error');
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

  // Handle Toggle Journey Status
  const handleToggleJourney = async (journeyId: string, currentStatus: string) => {
    if (!token || togglingJourneyId) return;
    const nextAction = currentStatus === 'ACTIVE' ? 'PAUSE' : 'ACTIVATE';

    try {
      setTogglingJourneyId(journeyId);
      triggerHaptic('medium');

      const res = await fetch('/api/v1/hermes/tma/journeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ journeyId, action: nextAction }),
      });

      const data = await res.json();
      if (data.success) {
        setJourneys(prev => prev.map(j => j.id === journeyId ? { ...j, status: data.status } : j));
        triggerHaptic('success');
      }
    } catch (err: any) {
      alert(`Error al cambiar estado de journey: ${err.message}`);
    } finally {
      setTogglingJourneyId(null);
    }
  };

  // Handle Toggle Addon Status
  const handleToggleAddon = async (addonId: string, currentStatus: string) => {
    if (!token || togglingAddonId) return;
    const willEnable = currentStatus !== 'ACTIVE';

    try {
      setTogglingAddonId(addonId);
      triggerHaptic('medium');

      const res = await fetch('/api/v1/hermes/tma/addons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ addonId, enable: willEnable }),
      });

      const data = await res.json();
      if (data.success) {
        setAddons(prev => prev.map(a => a.id === addonId ? { ...a, status: willEnable ? 'ACTIVE' : 'AVAILABLE' } : a));
        triggerHaptic('success');
      }
    } catch (err: any) {
      alert(`Error al configurar addon: ${err.message}`);
    } finally {
      setTogglingAddonId(null);
    }
  };

  if (outsideTelegram) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
          <Cpu className="w-6 h-6 text-indigo-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-100">Abre Hermes OS desde Telegram</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-xs">
          Este Command Center solo está disponible dentro del bot @pandorasHermes_bot (menú WebApp o comando /portal).
        </p>
      </div>
    );
  }

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
          <XCircle className="w-6 h-6 text-rose-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-100">Acceso no autorizado</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 space-y-4 font-sans antialiased select-none pb-12">
      {/* Top Header & Tenant Selector */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Hermes OS Control</div>
              <div className="text-sm font-bold text-slate-100">{session.tenant.organizationName}</div>
            </div>
          </div>

          {authorizedTenants.length > 1 && (
            <button
              onClick={() => { setShowTenantSelector(!showTenantSelector); triggerHaptic('light'); }}
              className="flex items-center space-x-1 py-1.5 px-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white"
            >
              <span>Cambiar</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tenant Selector Dropdown */}
        {showTenantSelector && (
          <div className="p-2 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-[10px] font-mono text-slate-400 px-2 py-1 uppercase">Tus Workspaces Autorizados</div>
            {authorizedTenants.map(t => (
              <button
                key={t.organizationId}
                disabled={switching}
                onClick={() => handleSwitchTenant(t.organizationId)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition ${
                  t.organizationId === session.tenant.organizationId
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{t.organizationName}</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/20">
                  {t.role}
                </span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Navigation Tabs (4 TABS) */}
      <nav className="grid grid-cols-4 p-1 bg-slate-900/90 border border-slate-800 rounded-xl gap-1">
        <button
          onClick={() => { setActiveTab('overview'); triggerHaptic('light'); }}
          className={`py-2 text-[11px] font-semibold rounded-lg flex flex-col items-center justify-center space-y-0.5 transition ${
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
          className={`py-2 text-[11px] font-semibold rounded-lg flex flex-col items-center justify-center space-y-0.5 transition relative ${
            activeTab === 'know'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Layers className="w-3.5 h-3.5" />
            {pendingFacts.length > 0 && (
              <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-rose-500 text-[8px] text-white flex items-center justify-center font-bold">
                {pendingFacts.length}
              </span>
            )}
          </div>
          <span>Bóveda</span>
        </button>

        <button
          onClick={() => { setActiveTab('journeys'); triggerHaptic('light'); }}
          className={`py-2 text-[11px] font-semibold rounded-lg flex flex-col items-center justify-center space-y-0.5 transition ${
            activeTab === 'journeys'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Journeys</span>
        </button>

        <button
          onClick={() => { setActiveTab('addons'); triggerHaptic('light'); }}
          className={`py-2 text-[11px] font-semibold rounded-lg flex flex-col items-center justify-center space-y-0.5 transition ${
            activeTab === 'addons'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Puzzle className="w-3.5 h-3.5" />
          <span>Add-Ons</span>
        </button>
      </nav>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in">
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">Estado de Infraestructura</span>
              </div>
              <button 
                onClick={() => token && fetchOverviewMetrics(token)}
                disabled={metricsLoading}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-mono"
              >
                <RefreshCw className={`w-3 h-3 ${metricsLoading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">PostgreSQL (Neon)</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">IPFS Sovereign</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  DURABLE
                </span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => { setActiveTab('know'); triggerHaptic('light'); }}
              className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-3.5 space-y-1.5 cursor-pointer transition active:scale-95"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold text-slate-300">Bóveda KNOW</span>
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-100">
                {metrics?.facts.pending ?? 0}
              </div>
              <div className="text-[10px] text-slate-400">Hechos por validar</div>
            </div>

            <div 
              onClick={() => { setActiveTab('journeys'); triggerHaptic('light'); }}
              className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-3.5 space-y-1.5 cursor-pointer transition active:scale-95"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold text-slate-300">Journeys</span>
                <Target className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {journeys.length}
              </div>
              <div className="text-[10px] text-slate-400">Embudos activos</div>
            </div>
          </section>

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

      {/* TAB 3: JOURNEYS & FUNNELS */}
      {activeTab === 'journeys' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Embudos Cognitivos ({journeys.length})
            </div>
            <button
              onClick={() => token && fetchJourneys(token)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono"
            >
              Actualizar
            </button>
          </div>

          {journeysLoading ? (
            <div className="text-center py-10">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mx-auto mb-2" />
              <div className="text-xs text-slate-400">Cargando journeys...</div>
            </div>
          ) : journeys.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-8 text-center">
              <Target className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-300">Sin journeys configurados</div>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                No hay embudos activos asignados a este workspace en la base de datos.
              </p>
            </div>
          ) : (
            journeys.map(j => (
              <div
                key={j.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${j.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="text-xs font-bold text-slate-100">{j.name}</span>
                  </div>
                  <button
                    disabled={togglingJourneyId === j.id}
                    onClick={() => handleToggleJourney(j.id, j.status)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition ${
                      j.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-400'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-emerald-500/10 hover:text-emerald-400'
                    }`}
                  >
                    {j.status === 'ACTIVE' ? 'ACTIVO' : 'PAUSADO'}
                  </button>
                </div>

                {j.description && (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {j.description}
                  </p>
                )}

                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Etapas ({j.stages.length})
                  </div>
                  <div className="space-y-1">
                    {j.stages.map((stage, idx) => (
                      <div
                        key={stage.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/40 text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] text-indigo-400">{idx + 1}.</span>
                          <span className="text-slate-300">{stage.name}</span>
                        </div>
                        {stage.objectives.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {stage.objectives.length} obj
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: ADD-ONS */}
      {activeTab === 'addons' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Add-Ons Cognitivos ({addons.length})
            </div>
            <button
              onClick={() => token && fetchAddons(token)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono"
            >
              Actualizar
            </button>
          </div>

          {addonsLoading ? (
            <div className="text-center py-10">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mx-auto mb-2" />
              <div className="text-xs text-slate-400">Cargando add-ons...</div>
            </div>
          ) : (
            addons.map(addon => (
              <div
                key={addon.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Puzzle className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-100">{addon.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">v{addon.version} · {addon.type}</div>
                    </div>
                  </div>
                  <button
                    disabled={togglingAddonId === addon.id}
                    onClick={() => handleToggleAddon(addon.id, addon.status)}
                    className={`flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-xl border transition active:scale-95 ${
                      addon.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-emerald-500/20 hover:text-emerald-300'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{addon.status === 'ACTIVE' ? 'Activo' : 'Activar'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                  {addon.description}
                </p>

                {addon.capabilities.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Capacidades Autorizadas</div>
                    <div className="flex flex-wrap gap-1">
                      {addon.capabilities.map(cap => (
                        <span key={cap.id} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {cap.id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
