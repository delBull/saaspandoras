import { useState, useEffect, useCallback } from 'react';
import { nexusGet, nexusPost } from '../lib/api-client';
import type { NexusTmaSession } from '../lib/session-store';
import { AgendaView } from './AgendaView';

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

import { ActionSheet } from '../components/nexus/ActionSheet';
import { AttentionItemCard } from '../components/nexus/AttentionItemCard';


// ─── Main View ────────────────────────────────────────────────────────────────
export function CommandCenter({ session, hasCapability }: CommandCenterProps) {
  
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [resolvingDeepLink, setResolvingDeepLink] = useState(false);
  const [deepLinkOp, setDeepLinkOp] = useState<NexusOperation | null>(null);

  const [showAgenda, setShowAgenda] = useState(false);
  const [agendaMeetings, setAgendaMeetings] = useState<any[]>([]);

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

      // 2. Load standard hub via new Inbox endpoint
      const data = await nexusGet<{ items: any[] }>('/api/v1/nexus/inbox', session.token);
      setInboxItems(data.items || []);

      // 3. Load next 2 agenda items
      try {
        const agendaData = await nexusGet<{ agenda: any[] }>('/api/v1/tma/nexus/agenda', session.token);
        if (agendaData.agenda) {
          setAgendaMeetings(agendaData.agenda.slice(0, 2));
        }
      } catch (err) {
        // non-fatal
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load operations');
    } finally {
      setLoading(false);
    }
  }, [session.token, deepLinkOp, resolvingDeepLink]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
  };

  const handleActionSuccess = async () => {
    setSelectedItem(null);
    if (deepLinkOp) setDeepLinkOp(null);
    await fetchOperations();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const totalOps = inboxItems.length;

  if (showAgenda) {
    return <AgendaView session={session} onBack={() => setShowAgenda(false)} />;
  }

  return (
    <div className="screen fade-in">
      <header className="nexus-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span className="font-semibold text-lg">Nexus Command</span>
              {session.badges?.total > 0 && (
                <span style={{
                  background: 'var(--color-danger)',
                  color: '#fff',
                  borderRadius: '999px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  minWidth: 18,
                  textAlign: 'center',
                }}>
                  {session.badges.total}
                </span>
              )}
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

        {/* Workspace Switcher — only shown when collaborator has multiple orgs */}
        {session.workspaces && session.workspaces.length > 1 && (
          <div className="flex gap-2 mt-3" style={{ overflowX: 'auto', paddingBottom: 2 }}>
            {session.workspaces.map((ws) => (
              <button
                key={ws.id}
                className={`text-xs font-semibold px-3 py-1`}
                style={{
                  borderRadius: 'var(--radius-sm)',
                  whiteSpace: 'nowrap',
                  background: session.activeWorkspace === ws.id
                    ? 'var(--color-accent)'
                    : 'var(--color-bg-elevated)',
                  color: session.activeWorkspace === ws.id
                    ? '#fff'
                    : 'var(--color-text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  // Switch active workspace — reload operations for the new org
                  // (Full reload; the session is re-hydrated via retry)
                  window.location.reload();
                }}
              >
                {ws.name}
              </button>
            ))}
          </div>
        )}

        {/* Vertical badges — show only enabled verticals with counts */}
        {session.enabledVerticals && session.enabledVerticals.length > 0 && (
          <div className="flex gap-2 mt-3">
            {session.enabledVerticals.includes('HERMES') && (
              <div className="flex items-center gap-1" style={{
                background: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                padding: '3px 8px',
                fontSize: '0.7rem',
              }}>
                <span>🧠</span>
                <span className="text-secondary">HITL</span>
                {session.badges?.hitlUrgentChats > 0 && (
                  <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>
                    {session.badges.hitlUrgentChats}
                  </span>
                )}
              </div>
            )}
            {session.enabledVerticals.includes('GROWTH') && (
              <div className="flex items-center gap-1" style={{
                background: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                padding: '3px 8px',
                fontSize: '0.7rem',
              }}>
                <span>🚀</span>
                <span className="text-secondary">Leads</span>
                {session.badges?.growthHotLeadsToday > 0 && (
                  <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                    {session.badges.growthHotLeadsToday}
                  </span>
                )}
              </div>
            )}
            {session.enabledVerticals.includes('RWA') && (
              <div className="flex items-center gap-1" style={{
                background: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                padding: '3px 8px',
                fontSize: '0.7rem',
              }}>
                <span>🏦</span>
                <span className="text-secondary">Depósitos</span>
                {session.badges?.rwaPendingDeposits > 0 && (
                  <span style={{ color: 'var(--color-warning)', fontWeight: 700 }}>
                    {session.badges.rwaPendingDeposits}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
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
             <ActionSheet 
               isOpen={true} 
               onClose={() => setDeepLinkOp(null)} 
               item={deepLinkOp} 
               sessionToken={session.token} 
               onSuccess={handleActionSuccess} 
             />
          </div>
        ) : (
          <>
            <div className="card flex-col gap-3" style={{ marginBottom: 'var(--space-4)', borderLeft: '4px solid var(--color-accent)' }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '1.25rem' }}>📅</span>
                  <h4 className="font-semibold text-sm">Próximas Reuniones</h4>
                </div>
                <button onClick={() => setShowAgenda(true)} className="text-xs font-bold text-accent underline">
                  Ver agenda
                </button>
              </div>
              {agendaMeetings.length === 0 ? (
                <p className="text-xs text-secondary">No tienes reuniones programadas pronto.</p>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  {agendaMeetings.map(m => (
                    <div key={m.id} className="flex items-center justify-between bg-[var(--color-bg-elevated)] p-2 rounded">
                      <div>
                        <p className="text-xs font-bold">{m.title}</p>
                        <p className="text-[10px] text-secondary">
                           {new Date(m.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {m.actions?.canJoin && (
                        <button onClick={() => window.open(m.joinUrl, '_blank')} className="btn btn-accent text-[10px] px-2 py-1 h-auto min-h-0">
                          Unirse
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

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

            {inboxItems.length > 0 && (
              <div className="flex flex-col gap-3 mt-4">
                <h3 className="font-bold text-sm text-gray-800 mb-2 flex items-center gap-2">
                  <span>📥</span> REQUIRES ATTENTION
                </h3>
                {inboxItems.map(item => (
                  <AttentionItemCard key={item.id} item={item} onClick={handleItemClick} />
                ))}
              </div>
            )}

            {/* Action Sheet for selected item */}
            <ActionSheet 
              isOpen={selectedItem !== null} 
              onClose={() => setSelectedItem(null)} 
              item={selectedItem} 
              sessionToken={session.token} 
              onSuccess={handleActionSuccess} 
            />
          </>
        )}
      </div>
    </div>
  );
}
