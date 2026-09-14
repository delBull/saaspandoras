/**
 * 📱 Nexus TMA — Command Center View (F4 Shell)
 * src/views/CommandCenter.tsx
 *
 * The main authenticated view. Implements the "5–10 second triage" design:
 *  - Header: operator name + role badge + workspace name
 *  - "Requires Attention" section: pending approvals count
 *  - Capability-gated modules
 */

import { useState, useEffect } from 'react';
import { nexusGet } from '../lib/api-client';
import type { NexusTmaSession } from '../lib/session-store';

interface CommandCenterProps {
  session: NexusTmaSession;
  hasCapability: (cap: string) => boolean;
}

// ─── Role display mapping ─────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:       'Super Admin',
  ADMIN:             'Admin',
  ADMIN_OPERATIONS:  'Operaciones',
  ADMIN_MARKETING:   'Marketing',
  ADMIN_COMPLIANCE:  'Compliance',
  OPERATOR:          'Operador',
  MARKETING:         'Marketing',
  VIEWER:            'Viewer',
};

// ─── Capability Module Card ───────────────────────────────────────────────────
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

// ─── Main View ────────────────────────────────────────────────────────────────
export function CommandCenter({ session, hasCapability }: CommandCenterProps) {
  const roleLabel = ROLE_LABELS[session.role] ?? session.role;
  
  const [metrics, setMetrics] = useState({
    approvals: 0,
    hitl: 0,
    tasks: 0,
    leads: 0,
    deposits: 0,
  });

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

  const totalAttention = metrics.approvals + metrics.hitl + metrics.tasks;

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
              <span className="text-secondary text-sm">{session.name}</span>
              <span className="badge badge-accent">{roleLabel}</span>
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
        {totalAttention > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(124, 92, 252, 0.15) 0%, rgba(124, 92, 252, 0.05) 100%)',
            border: '1px solid rgba(124, 92, 252, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
          }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
              <span className="font-semibold text-base flex items-center gap-2">
                ⚡ REQUIERE ATENCIÓN
                <span className="badge badge-warning" style={{ color: 'white' }}>{totalAttention}</span>
              </span>
            </div>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }} className="text-secondary">
              {metrics.approvals > 0 && <li>• {metrics.approvals} aprobación pendiente</li>}
              {metrics.hitl > 0 && <li>• {metrics.hitl} intervención Hermes (HITL)</li>}
              {metrics.tasks > 0 && <li>• {metrics.tasks} tarea urgente</li>}
            </ul>
          </div>
        )}

        <p className="text-muted text-xs font-medium" style={{
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4
        }}>
          Módulos activos
        </p>

        {/* Hermes AI Module */}
        {hasCapability('nexus.manage') && (
          <ModuleCard
            icon="🧠"
            title="Hermes AI"
            subtitle="Triage de hechos · Inbox HITL"
            badge={metrics.hitl}
            badgeVariant="warning"
            onClick={() => console.log('Navigate to Hermes Inbox')}
          />
        )}

        {/* Growth Module */}
        {hasCapability('growth.manage') && (
          <ModuleCard
            icon="🚀"
            title="Growth OS"
            subtitle="Hot leads · Pipeline 24h"
            badge={metrics.leads}
            badgeVariant="accent"
            onClick={() => console.log('Navigate to Growth Pipeline')}
          />
        )}

        {/* Finance / RWA Module */}
        {hasCapability('finance.manage') && (
          <ModuleCard
            icon="🏦"
            title="RWA · Depósitos"
            subtitle="Aprobación SPEI · Compras"
            badge={metrics.deposits}
            badgeVariant="success"
            onClick={() => console.log('Navigate to Deposits')}
          />
        )}

        {/* Users Module */}
        {hasCapability('users.manage') && (
          <ModuleCard
            icon="👥"
            title="Equipo"
            subtitle="Colaboradores · Invitaciones"
            onClick={() => console.log('Navigate to Team')}
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

        {/* Capability summary (dev helper) */}
        {import.meta.env.DEV && (
          <div className="card" style={{ marginTop: 'var(--space-4)', opacity: 0.6 }}>
            <p className="text-muted text-xs font-mono" style={{ marginBottom: 4 }}>
              DEV · capabilities:
            </p>
            <p className="text-xs font-mono" style={{ wordBreak: 'break-all', color: 'var(--color-accent)' }}>
              {session.capabilities.join(', ') || '(ninguna)'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
