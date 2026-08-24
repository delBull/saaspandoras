'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  Building2,
  Lock,
  Cpu
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

export default function HermesTmaPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<HermesSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authorizedTenants, setAuthorizedTenants] = useState<AuthorizedTenant[]>([]);
  const [switching, startTransition] = useTransition();
  const [showTenantSelector, setShowTenantSelector] = useState(false);

  useEffect(() => {
    // 1. Initialize Telegram WebApp SDK if present
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined;
    if (tg) {
      tg.ready();
      tg.expand?.();
    }

    const initData = tg?.initData || '';
    const searchParams = new URLSearchParams(window.location.search);
    const tenantParam = searchParams.get('tenant') || undefined;

    // Fallback for development/testing when outside Telegram browser
    if (!initData && process.env.NODE_ENV === 'development') {
      console.warn('[TMA] Running outside Telegram webview in dev mode.');
    }

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
      } catch (err: any) {
        setError(err?.message || 'Failed to connect to Hermes OS API');
      } finally {
        setLoading(false);
      }
    }

    authenticate();
  }, []);

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
          // Haptic feedback
          const tg = (window as any).Telegram?.WebApp;
          tg?.HapticFeedback?.notificationOccurred?.('success');
        } else {
          alert(`Error switching workspace: ${data.error}`);
        }
      } catch (err: any) {
        alert(`Failed to switch: ${err.message}`);
      }
    });
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
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-wider text-indigo-400 uppercase font-semibold">
                Hermes OS • Command Center
              </div>
              <h1 className="text-base font-bold text-slate-100 flex items-center space-x-1">
                <span>{session.tenant.organizationName}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              {session.role}
            </span>
            {authorizedTenants.length > 1 && (
              <button
                onClick={() => setShowTenantSelector(!showTenantSelector)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
                title="Cambiar Workspace"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
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

      {/* System Core Health Strip */}
      <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Estado del Sistema</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>100% OPERATIVO</span>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
            <div className="text-slate-400">Postgres</div>
            <div className="text-emerald-400 font-semibold mt-0.5">ONLINE</div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
            <div className="text-slate-400">IPFS Vault</div>
            <div className="text-emerald-400 font-semibold mt-0.5">DURABLE</div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
            <div className="text-slate-400">Security K26</div>
            <div className="text-indigo-400 font-semibold mt-0.5">ENFORCING</div>
          </div>
        </div>
      </section>

      {/* Operator Mission Control Modules */}
      <section className="space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Módulos Operativos
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-3.5 transition group cursor-pointer">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-2 text-indigo-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-semibold text-slate-200">Bóveda KNOW</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Hechos y Claim Contracts</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-3.5 transition group cursor-pointer">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2 text-emerald-400">
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-semibold text-slate-200">Journeys</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Pipeline y prospectos</div>
          </div>
        </div>
      </section>

      {/* Operator Footnote */}
      <footer className="pt-4 text-center">
        <div className="text-[10px] text-slate-400">
          Sesión: <code className="text-indigo-400">{session.actorId}</code>
        </div>
      </footer>
    </div>
  );
}
