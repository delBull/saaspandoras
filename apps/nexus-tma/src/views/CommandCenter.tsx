import { useState, useEffect, useCallback } from 'react';
import { nexusGet, nexusPost } from '../lib/api-client';
import type { NexusTmaSession } from '../lib/session-store';
import { AgendaView } from './AgendaView';
import { ActionSheet } from '../components/nexus/ActionSheet';
import { AttentionItemCard } from '../components/nexus/AttentionItemCard';
import { 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Video,
  ChevronRight,
  ShieldCheck,
  Brain
} from 'lucide-react';

interface CommandCenterProps {
  session: NexusTmaSession;
  hasCapability: (cap: string) => boolean;
}

export type OperationPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
export type OperationType = 'DECISION' | 'TASK' | 'ALERT' | 'INTERVENTION';
export type OperationDomain = 'TREASURY' | 'GROWTH' | 'HERMES' | 'GOVERNANCE';
export type OperationVisibility = 'ASSIGNED' | 'TEAM' | 'ORG';

export interface NexusOperation {
  id: string;
  type: OperationType;
  priority: OperationPriority;
  domain: OperationDomain;
  title: string;
  description?: string;
  status: string;
  requiredCapability: string;
  assigneeId?: number | null;
  visibility: OperationVisibility;
  createdAt: string;
  expiresAt?: string | null;
  actions: {
    label: string;
    action: string;
    intent: 'primary' | 'secondary' | 'danger';
  }[];
  payload?: any;
}

export function CommandCenter({ session, hasCapability: _hasCapability }: CommandCenterProps) {
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'HERMES'>('ALL');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [resolvingDeepLink, setResolvingDeepLink] = useState(false);
  const [deepLinkOp, setDeepLinkOp] = useState<NexusOperation | null>(null);

  const [showAgenda, setShowAgenda] = useState(false);
  const [agendaMeetings, setAgendaMeetings] = useState<any[]>([]);

  const triggerHaptic = (type: 'light' | 'medium' = 'light') => {
    try {
      // @ts-ignore
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type);
    } catch {
      // ignore
    }
  };

  const fetchOperations = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      
      // 1. Deep link check
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      const startParam = (tg?.initDataUnsafe as any)?.start_param;
      
      if (startParam && !deepLinkOp && !resolvingDeepLink) {
        setResolvingDeepLink(true);
        try {
          const res = await nexusPost('/api/v1/tma/nexus/deep-links/resolve', { reference: startParam });
          if (res.operation) {
            setDeepLinkOp(res.operation);
          }
        } catch (err: any) {
          setError(err.message || 'El enlace ha expirado o ya fue consumido.');
        } finally {
          setResolvingDeepLink(false);
        }
      }

      // 2. Load standard hub via Inbox endpoint
      const data = await nexusGet<{ items: any[] }>('/api/v1/nexus/inbox');
      setInboxItems(data.items || []);

      // 3. Load agenda preview
      try {
        const agendaData = await nexusGet<{ agenda: any[] }>('/api/v1/tma/nexus/agenda');
        if (agendaData.agenda) {
          setAgendaMeetings(agendaData.agenda.slice(0, 2));
        }
      } catch {
        // non-fatal
      }
    } catch (err: any) {
      setError(err.message || 'No se pudieron sincronizar las operaciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deepLinkOp, resolvingDeepLink]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  if (showAgenda) {
    return <AgendaView onBack={() => setShowAgenda(false)} />;
  }

  // Filter items
  const filteredItems = inboxItems.filter(item => {
    if (activeFilter === 'CRITICAL') return item.severity === 'CRITICAL' || item.severity === 'HIGH';
    if (activeFilter === 'HERMES') return item.type === 'CAMPAIGN' || item.type === 'ESCALATION';
    return true;
  });

  const criticalCount = inboxItems.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;

  return (
    <div className="screen fade-in pb-24">
      {/* Top Command Bar */}
      <header className="nexus-top-bar">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 14,
              color: '#ffffff'
            }}>
              {session.name ? session.name.charAt(0).toUpperCase() : '⚡'}
            </div>
            <span className="live-pulse" style={{ position: 'absolute', bottom: -1, right: -1 }} />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight">
                {session.name || 'Operador Nexus'}
              </span>
              <span className="badge badge-accent" style={{ fontSize: '9px', padding: '1px 6px' }}>
                {session.role || 'CORE'}
              </span>
            </div>
            <div className="text-[11px] text-muted font-mono flex items-center gap-1">
              <span>{session.activeWorkspace}</span>
              <span>•</span>
              <span className="text-emerald-400">Hermes Live</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            triggerHaptic('light');
            fetchOperations(true);
          }}
          disabled={refreshing || loading}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-secondary active:scale-90 transition-transform"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-accent' : ''}`} />
        </button>
      </header>

      <div className="page-content flex flex-col gap-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchOperations(true)} className="text-[10px] font-bold underline">Reintentar</button>
          </div>
        )}
        {/* Daily Command Metrics Banner */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(15, 15, 24, 0.9) 100%)',
          borderColor: 'rgba(139, 92, 246, 0.3)'
        }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Command Overview
              </span>
            </div>
            <span className="badge badge-success">
              <ShieldCheck className="w-3 h-3" /> Sincronizado
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-[11px] text-secondary font-medium">Atención Pendiente</div>
              <div className="text-2xl font-bold text-white mt-0.5 tracking-tight">
                {inboxItems.length}
                {criticalCount > 0 && (
                  <span className="text-xs font-normal text-rose-400 ml-1.5">
                    ({criticalCount} críticos)
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer" onClick={() => setShowAgenda(true)}>
              <div className="text-[11px] text-secondary font-medium flex items-center justify-between">
                <span>Agenda Hoy</span>
                <ChevronRight className="w-3 h-3 text-muted" />
              </div>
              <div className="text-2xl font-bold text-white mt-0.5 tracking-tight">
                {agendaMeetings.length}
                <span className="text-xs font-normal text-secondary ml-1.5">citas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Agenda Strip Preview */}
        {agendaMeetings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                Próximas Sesiones
              </span>
              <button 
                onClick={() => setShowAgenda(true)}
                className="text-xs text-accent font-semibold flex items-center gap-0.5"
              >
                Ver agenda <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {agendaMeetings.map(m => (
                <div 
                  key={m.id}
                  onClick={() => setShowAgenda(true)}
                  className="card flex items-center justify-between p-3 border-white/10 active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{m.title}</div>
                      <div className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(m.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>• Con {m.hostName}</span>
                      </div>
                    </div>
                  </div>
                  {m.actions?.canJoin && m.joinUrl && (
                    <span className="badge badge-success text-[10px]">
                      <Video className="w-3 h-3" /> ENTRAR
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attention Items Feed */}
        <div className="mt-1">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Atención Inmediata
            </span>
            <span className="text-xs font-mono text-muted">
              {filteredItems.length} requeridos
            </span>
          </div>

          {/* Pill filter strip */}
          <div className="pill-filter-strip">
            <button 
              onClick={() => { triggerHaptic('light'); setActiveFilter('ALL'); }}
              className={`pill-item ${activeFilter === 'ALL' ? 'active' : ''}`}
            >
              Todos ({inboxItems.length})
            </button>
            <button 
              onClick={() => { triggerHaptic('light'); setActiveFilter('CRITICAL'); }}
              className={`pill-item ${activeFilter === 'CRITICAL' ? 'active' : ''}`}
            >
              Críticos ({criticalCount})
            </button>
            <button 
              onClick={() => { triggerHaptic('light'); setActiveFilter('HERMES'); }}
              className={`pill-item ${activeFilter === 'HERMES' ? 'active' : ''}`}
            >
              Hermes & Growth
            </button>
          </div>

          {/* Items List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="spinner" />
              <span className="text-xs text-secondary">Consultando Sovereign Command Mesh...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="card text-center py-12 px-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Bandeja Despejada</h3>
              <p className="text-xs text-secondary mt-1 max-w-xs leading-relaxed">
                No hay decisiones u operaciones críticas pendientes de tu intervención en este momento.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredItems.map(item => (
                <AttentionItemCard
                  key={item.id}
                  item={item}
                  onClick={(i) => {
                    triggerHaptic('medium');
                    setSelectedItem(i);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Sheet Modal */}
      <ActionSheet
        isOpen={Boolean(selectedItem)}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSuccess={() => {
          fetchOperations(true);
        }}
      />
    </div>
  );
}
