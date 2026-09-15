import { useState, useEffect, useCallback } from 'react';
import { nexusGet, nexusPost } from '../lib/api-client';
import type { NexusTmaSession } from '../lib/session-store';

interface CommandCenterProps {
  session: NexusTmaSession;
  hasCapability: (cap: string) => boolean;
}

// ─── Shared Types ───────────────────────────────────────────────────
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

// ─── Action Button ───────────────────────────────────────────────────
type ActionState = 'AVAILABLE' | 'CONFIRMING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

function ActionButton({ onClick, label, variant = 'accent' }: { onClick: () => Promise<void>, label: string, variant?: string }) {
  const [state, setState] = useState<ActionState>('AVAILABLE');

  const handleClick = async () => {
    if (state === 'AVAILABLE') {
      setState('CONFIRMING');
      return;
    }
    if (state === 'CONFIRMING') {
      setState('PROCESSING');
      try {
        await onClick();
        setState('COMPLETED');
      } catch (err) {
        setState('FAILED');
        setTimeout(() => setState('AVAILABLE'), 3000);
      }
    }
  };

  const getLabel = () => {
    switch (state) {
      case 'AVAILABLE': return label;
      case 'CONFIRMING': return '¿Confirmar?';
      case 'PROCESSING': return 'Procesando...';
      case 'COMPLETED': return '✓ Listo';
      case 'FAILED': return '❌ Error';
    }
  };

  return (
    <button
      className={`btn btn-${state === 'CONFIRMING' ? 'danger' : state === 'COMPLETED' ? 'success' : variant} w-full`}
      onClick={handleClick}
      disabled={state === 'PROCESSING' || state === 'COMPLETED'}
      style={{ transition: 'all 0.2s', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.875rem' }}
    >
      {getLabel()}
    </button>
  );
}

// ─── Operation Card ───────────────────────────────────────────────────
function OperationCard({ op, onAction }: { op: NexusOperation, onAction: (op: NexusOperation, action: string) => Promise<void> }) {
  const getDomainIcon = () => {
    switch(op.domain) {
      case 'TREASURY': return '🏦';
      case 'GROWTH': return '🚀';
      case 'HERMES': return '🧠';
      case 'GOVERNANCE': return '⚖️';
      default: return '⚡';
    }
  };

  const getPriorityColor = () => {
    switch(op.priority) {
      case 'CRITICAL': return 'var(--color-danger)';
      case 'HIGH': return 'var(--color-warning)';
      case 'NORMAL': return 'var(--color-accent)';
      case 'LOW': return 'var(--color-text-muted)';
      default: return 'var(--color-accent)';
    }
  };

  return (
    <div className="card flex-col gap-3" style={{ 
      marginBottom: 'var(--space-3)', 
      borderLeft: `4px solid ${getPriorityColor()}`
    }}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '1.25rem' }}>{getDomainIcon()}</span>
          <div>
            <h4 className="font-semibold" style={{ fontSize: '1rem', lineHeight: 1.2 }}>{op.title}</h4>
            <span className="text-secondary text-xs">{op.domain} • {op.type}</span>
          </div>
        </div>
        {op.priority === 'CRITICAL' && (
           <span className="badge badge-danger text-xs text-white">Critical</span>
        )}
      </div>

      {op.description && (
        <p className="text-sm text-secondary line-clamp-2">{op.description}</p>
      )}

      {op.actions && op.actions.length > 0 && (
        <div className="flex gap-2 mt-2">
          {op.actions.map((act, i) => (
            <div key={i} className="flex-1">
              <ActionButton 
                label={act.label}
                variant={act.intent}
                onClick={() => onAction(op, act.action)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── Main View ────────────────────────────────────────────────────────────────
export function CommandCenter({ session, hasCapability }: CommandCenterProps) {
  
  const [buckets, setBuckets] = useState<{
    NEEDS_ATTENTION: NexusOperation[],
    TODAY: NexusOperation[],
    RECENT: NexusOperation[]
  }>({ NEEDS_ATTENTION: [], TODAY: [], RECENT: [] });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [resolvingDeepLink, setResolvingDeepLink] = useState(false);
  const [deepLinkOp, setDeepLinkOp] = useState<NexusOperation | null>(null);

  const fetchOperations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Check for deep link
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      const startParam = (tg?.initDataUnsafe as any)?.start_param;
      
      if (startParam && !deepLinkOp && !resolvingDeepLink) {
        setResolvingDeepLink(true);
        try {
          const res = await nexusPost('/api/v1/tma/nexus/deep-links/resolve', { reference: startParam }, session.token);
          if (res.operation) {
            setDeepLinkOp(res.operation);
          }
        } catch (err: any) {
          setError(err.message || 'El enlace ha expirado o ya fue consumido.');
        } finally {
          setResolvingDeepLink(false);
        }
      }

      // 2. Load standard hub
      const data = await nexusGet<{ operations: any }>('/api/v1/tma/nexus/operations/my-work', session.token);
      setBuckets(data.operations || { NEEDS_ATTENTION: [], TODAY: [], RECENT: [] });
    } catch (err: any) {
      setError(err.message || 'Failed to load operations');
    } finally {
      setLoading(false);
    }
  }, [session.token, deepLinkOp, resolvingDeepLink]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const handleAction = async (op: NexusOperation, action: string) => {
    try {
      if (op.domain === 'HERMES' && action === 'TAKEOVER') {
        await nexusPost('/api/v1/tma/nexus/hermes/hitl/takeover', { itemId: op.id }, session.token);
      } else if (op.domain === 'TREASURY' && action === 'APPROVE') {
        const reqId = op.payload?.actionRequestId || op.id; 
        await nexusPost('/api/v1/tma/nexus/finance/deposits/approve', { actionRequestId: reqId, actionToken: op.id }, session.token);
      } else {
        console.log('Action unhandled in TMA:', op.domain, action);
        // Fallback for unhandled actions
      }
      
      // If we were focusing on a deep link, clear it
      if (deepLinkOp && deepLinkOp.id === op.id) {
        setDeepLinkOp(null);
      }
      
      // Refresh list to pull updated state from server
      await fetchOperations();
    } catch (err: any) {
      throw err; 
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const totalOps = buckets.NEEDS_ATTENTION.length + buckets.TODAY.length + buckets.RECENT.length;

  return (
    <div className="screen fade-in">
      <header className="nexus-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span className="font-semibold text-lg">Nexus Command</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-secondary text-sm">{getGreeting()}, {session.name.split(' ')[0]}.</span>
            </div>
          </div>
          <button 
            onClick={() => fetchOperations()} 
            className="flex items-center justify-center"
            style={{
              width: 36, height: 36,
              background: 'var(--color-bg-elevated)',
              borderRadius: '50%',
            }}
          >
            🔄
          </button>
        </div>
      </header>

      <div className="page-content flex-col gap-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {!hasCapability('nexus.manage') &&
         !hasCapability('growth.manage') &&
         !hasCapability('finance.manage') &&
         !hasCapability('users.manage') ? (
          <div className="card text-center" style={{ padding: 'var(--space-6)' }}>
            <div style={{ fontSize: 32, marginBottom: 'var(--space-3)' }}>👁️</div>
            <p className="font-medium" style={{ marginBottom: 'var(--space-2)' }}>
              Modo observador
            </p>
            <p className="text-secondary text-sm">
              Tu rol actual no tiene módulos de acción asignados.<br/>
              Contacta al administrador del espacio de trabajo.
            </p>
          </div>
        ) : deepLinkOp ? (
          <div>
             <div className="flex justify-between items-center mb-3">
               <h3 className="font-bold text-sm text-accent flex items-center gap-2">
                 <span>🎯</span> SOLICITUD DIRECTA
               </h3>
               <button onClick={() => setDeepLinkOp(null)} className="text-xs text-secondary underline">Volver al Hub</button>
             </div>
             <OperationCard op={deepLinkOp} onAction={handleAction} />
          </div>
        ) : (
          <>
            {loading && totalOps === 0 && (
              <div className="text-center p-8 text-secondary">Loading operations...</div>
            )}
            
            {!loading && totalOps === 0 && (
              <div className="text-center p-8">
                 <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>✅</span>
                 <p className="font-medium">All caught up!</p>
                 <p className="text-sm text-secondary">No operations require your attention right now.</p>
              </div>
            )}

            {buckets.NEEDS_ATTENTION.length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-danger mb-3 flex items-center gap-2">
                  <span>🚨</span> NEEDS ATTENTION
                </h3>
                {buckets.NEEDS_ATTENTION.map(op => (
                  <OperationCard key={op.id} op={op} onAction={handleAction} />
                ))}
              </div>
            )}

            {buckets.TODAY.length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-secondary mb-3 flex items-center gap-2">
                  <span>📅</span> TODAY
                </h3>
                {buckets.TODAY.map(op => (
                  <OperationCard key={op.id} op={op} onAction={handleAction} />
                ))}
              </div>
            )}

            {buckets.RECENT.length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-secondary mb-3 flex items-center gap-2">
                  <span>🕒</span> RECENT
                </h3>
                {buckets.RECENT.map(op => (
                  <OperationCard key={op.id} op={op} onAction={handleAction} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
