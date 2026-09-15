import { useState, useEffect } from 'react';
import { nexusGet, nexusPost } from '../lib/api-client';
import type { NexusTmaSession } from '../lib/session-store';

interface CommandCenterProps {
  session: NexusTmaSession;
  hasCapability: (cap: string) => boolean;
}

// ─── Module Card ───────────────────────────────────────────────────
interface ModuleCardProps {
  icon: string;
  title: string;
  subtitle: string;
  badge?: number;
  badgeVariant?: 'accent' | 'warning' | 'danger' | 'success';
  onClick?: () => void;
}

function ModuleCard({ icon, title, subtitle, badge, badgeVariant = 'accent', onClick }: ModuleCardProps) {
  return (
    <div className="card flex items-center gap-3" onClick={onClick}
      style={{
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
      }}>
      <div style={{
        width: 44, height: 44, flexShrink: 0,
        background: 'var(--color-bg-elevated)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2">
          <span className="font-medium text-base" style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {title}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className={`badge badge-${badgeVariant}`}>{badge}</span>
          )}
        </div>
        <p className="text-secondary text-sm" style={{
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {subtitle}
        </p>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
        style={{ flexShrink: 0, color: 'var(--color-text-muted)' }}>
        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ─── Action Button with Lifecycle ───────────────────────────────────────────────────
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
      case 'COMPLETED': return '✓ Completado';
      case 'FAILED': return '❌ Error';
    }
  };

  return (
    <button
      className={`btn btn-${state === 'CONFIRMING' ? 'danger' : state === 'COMPLETED' ? 'success' : variant} w-full`}
      onClick={handleClick}
      disabled={state === 'PROCESSING' || state === 'COMPLETED'}
      style={{ transition: 'all 0.2s', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}
    >
      {getLabel()}
    </button>
  );
}


// ─── Main View ────────────────────────────────────────────────────────────────
export function CommandCenter({ session, hasCapability }: CommandCenterProps) {
  const [activeDrawer, setActiveDrawer] = useState<'hermes' | 'growth' | 'finance' | 'users' | null>(null);
  
  const [metrics, setMetrics] = useState({
    approvals: 0,
    hitl: 0,
    tasks: 0,
    leads: 0,
    deposits: 0,
  });

  const [hitlItems, setHitlItems] = useState<any[]>([]);
  const [growthItems, setGrowthItems] = useState<any[]>([]);
  const [financeItems, setFinanceItems] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const data = await nexusGet<{
          requiresAttention: { kyc: number; deposits: number; hermesInbox: number; governance: number };
        }>('/api/v1/tma/nexus/overview', session.token);
        
        setMetrics(m => ({
          ...m,
          approvals: data.requiresAttention.kyc,
          deposits: data.requiresAttention.deposits,
          hitl: data.requiresAttention.hermesInbox,
        }));
      } catch (err) {
        console.error('Failed to fetch overview metrics', err);
      }
    }
    fetchOverview();
  }, [session.token]);

  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Drawer Fetch Data
  useEffect(() => {
    setDrawerError(null);
    if (activeDrawer === 'hermes') {
      nexusGet<{ items: any[] }>('/api/v1/tma/nexus/hermes/hitl', session.token)
        .then(res => setHitlItems(res.items || []))
        .catch(err => {
          setHitlItems([]);
          setDrawerError(err.message || 'Unauthorized or failed to load HITL data');
        });
    }
    if (activeDrawer === 'growth') {
      nexusGet<{ items: any[] }>('/api/v1/tma/nexus/growth/leads', session.token)
        .then(res => setGrowthItems(res.items || []))
        .catch(err => {
          setGrowthItems([]);
          setDrawerError(err.message || 'Unauthorized or failed to load Growth leads');
        });
    }
    if (activeDrawer === 'finance') {
      nexusGet<{ items: any[] }>('/api/v1/tma/nexus/finance/deposits', session.token)
        .then(res => setFinanceItems(res.items || []))
        .catch(err => {
          setFinanceItems([]);
          setDrawerError(err.message || 'Unauthorized or failed to load Finance deposits');
        });
    }
  }, [activeDrawer, session.token]);

  const totalAttention = metrics.approvals + metrics.hitl + metrics.tasks;

  const handleTakeover = async (itemId: string) => {
    await nexusPost('/api/v1/tma/nexus/hermes/hitl/takeover', { itemId }, session.token);
    setHitlItems(prev => prev.filter(i => i.id !== itemId));
    setMetrics(m => ({ ...m, hitl: Math.max(0, m.hitl - 1) }));
  };

  const handleApproveDeposit = async (actionRequestId: number, actionToken: string) => {
    await nexusPost('/api/v1/tma/nexus/finance/deposits/approve', { actionRequestId, actionToken }, session.token);
    setFinanceItems(prev => prev.filter(i => i.actionRequestId !== actionRequestId));
    setMetrics(m => ({ ...m, deposits: Math.max(0, m.deposits - 1), approvals: Math.max(0, m.approvals - 1) }));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="screen fade-in">
      {/* Header */}
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
          <div style={{
            width: 8, height: 8,
            background: 'var(--color-success)',
            borderRadius: '50%',
            boxShadow: '0 0 8px var(--color-success)',
          }} />
        </div>
      </header>

      {/* Content */}
      <div className="page-content flex-col gap-3">
        {totalAttention > 0 ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(124, 92, 252, 0.15) 0%, rgba(124, 92, 252, 0.05) 100%)',
            border: '1px solid rgba(124, 92, 252, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
          }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
              <span className="font-semibold text-base flex items-center gap-2">
                ⚡ REQUIRES ATTENTION
              </span>
            </div>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }} className="text-secondary">
              {metrics.approvals > 0 && (
                <li style={{ cursor: 'pointer', padding: '4px 0' }} onClick={() => setActiveDrawer('finance')}>
                  • {metrics.approvals} approval pending
                </li>
              )}
              {metrics.hitl > 0 && (
                <li style={{ cursor: 'pointer', padding: '4px 0' }} onClick={() => setActiveDrawer('hermes')}>
                  • {metrics.hitl} HITL intervention required
                </li>
              )}
              {metrics.tasks > 0 && (
                <li style={{ cursor: 'pointer', padding: '4px 0' }} onClick={() => setActiveDrawer('users')}>
                  • {metrics.tasks} urgent tasks
                </li>
              )}
            </ul>
          </div>
        ) : (
          <div style={{ padding: 'var(--space-2) 0 var(--space-4)', color: 'var(--color-success)', fontSize: '0.875rem' }}>
            ✓ No items requiring attention right now.
          </div>
        )}

        {hasCapability('nexus.manage') && (
          <ModuleCard
            icon="🧠"
            title="Hermes AI"
            subtitle={metrics.hitl > 0 ? `${metrics.hitl} interventions waiting` : "Cognitive core active"}
            badge={metrics.hitl}
            badgeVariant="warning"
            onClick={() => setActiveDrawer('hermes')}
          />
        )}

        {hasCapability('growth.manage') && (
          <ModuleCard
            icon="🚀"
            title="Growth OS"
            subtitle="Recent Leads"
            badge={metrics.leads}
            badgeVariant="accent"
            onClick={() => setActiveDrawer('growth')}
          />
        )}

        {hasCapability('finance.manage') && (
          <ModuleCard
            icon="🏦"
            title="RWA · Depósitos"
            subtitle={metrics.deposits > 0 ? `${metrics.deposits} approvals pending` : "Treasury Operations"}
            badge={metrics.deposits}
            badgeVariant="success"
            onClick={() => setActiveDrawer('finance')}
          />
        )}

        {!hasCapability('nexus.manage') &&
         !hasCapability('growth.manage') &&
         !hasCapability('finance.manage') &&
         !hasCapability('users.manage') && (
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
        )}
      </div>

      {/* ─── BOTTOM DRAWER ──────────────────────────────────────────────────────────── */}
      <div 
        className={`drawer-overlay ${activeDrawer ? 'open' : ''}`}
        onClick={() => setActiveDrawer(null)}
      >
        <div 
          className="drawer-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="drawer-handle" />
          
          {drawerError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl mb-4 w-full">
              {drawerError}
            </div>
          )}

          {activeDrawer === 'hermes' && (
            <div className="flex-col gap-4">
              <h2 className="font-semibold text-xl mb-4">Hermes Interventions (HITL)</h2>
              
              {hitlItems.length === 0 ? (
                <div className="text-center p-6 text-secondary">
                  <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>✅</span>
                  No interventions requiring attention.
                </div>
              ) : (
                hitlItems.map(item => (
                  <div key={item.id} className="action-card flex-col gap-3" style={{ marginBottom: 'var(--space-3)' }}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.userName || 'Customer'}</span>
                      <span className="badge badge-warning text-xs" style={{ color: 'white' }}>Urgent</span>
                    </div>
                    <p className="text-sm text-secondary line-clamp-2">"{item.lastMessage}"</p>
                    <ActionButton 
                      label="Take Control"
                      onClick={() => handleTakeover(item.id)}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {activeDrawer === 'growth' && (
            <div className="flex-col gap-4">
              <h2 className="font-semibold text-xl mb-4">Recent Leads (24h)</h2>
              
              {growthItems.length === 0 ? (
                <div className="text-center p-6 text-secondary">
                  <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>🍃</span>
                  No new leads in the last 24 hours.
                </div>
              ) : (
                growthItems.map(item => (
                  <div key={item.id} className="action-card flex-col gap-3" style={{ marginBottom: 'var(--space-3)' }}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.name}</span>
                      <span className="badge badge-accent text-xs" style={{ color: 'white' }}>{item.intent}</span>
                    </div>
                    <p className="text-sm text-secondary line-clamp-1">Status: {item.status}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeDrawer === 'finance' && (
            <div className="flex-col gap-4">
              <h2 className="font-semibold text-xl mb-4">Treasury Approvals</h2>
              
              {financeItems.length === 0 ? (
                <div className="text-center p-6 text-secondary">
                  <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>✅</span>
                  No pending deposit approvals.
                </div>
              ) : (
                financeItems.map(item => (
                  <div key={item.actionRequestId} className="action-card flex-col gap-3" style={{ marginBottom: 'var(--space-3)' }}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.userName}</span>
                      <span className="badge badge-success text-xs" style={{ color: 'white' }}>SPEI</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Amount</span>
                      <span className="font-semibold">${item.amount} {item.currency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Ref</span>
                      <span className="font-mono text-xs">{item.reference}</span>
                    </div>
                    <ActionButton 
                      label="Approve Deposit"
                      onClick={() => handleApproveDeposit(item.actionRequestId, item.actionToken)}
                    />
                  </div>
                ))
              )}
            </div>
          )}
          
        </div>
      </div>

    </div>
  );
}
