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

  // Drawer Fetch Data
  useEffect(() => {
    if (activeDrawer === 'hermes') {
      // Fetch real HITL data
      nexusGet<{ items: any[] }>('/api/v1/tma/nexus/hermes/hitl', session.token)
        .then(res => setHitlItems(res.items || []))
        .catch(err => {
          console.error(err);
          // Set to empty if fails, no mocks
          setHitlItems([]);
        });
    }
  }, [activeDrawer, session.token]);

  const totalAttention = metrics.approvals + metrics.hitl + metrics.tasks;

  const handleTakeover = async (itemId: string) => {
    await nexusPost('/api/v1/tma/nexus/hermes/hitl/takeover', { itemId }, session.token);
    // Remove item from list locally
    setHitlItems(prev => prev.filter(i => i.id !== itemId));
    setMetrics(m => ({ ...m, hitl: Math.max(0, m.hitl - 1) }));
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
          {/* Connection indicator */}
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
        {/* Requiere Atención (Triage) */}
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

        {/* Hermes AI Module */}
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

        {/* Growth Module */}
        {hasCapability('growth.manage') && (
          <ModuleCard
            icon="🚀"
            title="Growth OS"
            subtitle="Pipeline 24h"
            badge={metrics.leads}
            badgeVariant="accent"
            onClick={() => setActiveDrawer('growth')}
          />
        )}

        {/* Finance / RWA Module */}
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

        {/* Fallback if no capabilities */}
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
          onClick={(e) => e.stopPropagation()} /* Prevent close when clicking inside drawer */
        >
          <div className="drawer-handle" />
          
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
              <h2 className="font-semibold text-xl mb-4">Growth Pipeline</h2>
              <div className="text-center p-6 text-secondary">
                <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>🔌</span>
                Not connected. This capability is not available yet.
              </div>
            </div>
          )}

          {activeDrawer === 'finance' && (
            <div className="flex-col gap-4">
              <h2 className="font-semibold text-xl mb-4">Treasury Approvals</h2>
              <div className="text-center p-6 text-secondary">
                <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>🔌</span>
                Not connected. This capability is not available yet.
              </div>
            </div>
          )}
          
        </div>
      </div>

    </div>
  );
}
