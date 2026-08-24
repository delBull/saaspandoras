import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { hermesSecurityEvents, hermesKnowledge } from '@/db/schema';
import { SovereignIpfsOrchestrator } from '@/lib/pandoras/core/domains/hermes/knowledge/ipfs/orchestrator';

export interface HermesSystemStatus {
  postgres: { online: boolean };
  ipfs: {
    state: 'DURABLE' | 'ACTIVE' | 'DEGRADED' | 'UNREACHABLE' | 'OFFLINE';
    detail: string;
  };
  securityEvents24h: number | null;
  knowledgeFacts: number | null;
}

const ipfsOrchestrator = new SovereignIpfsOrchestrator();

export async function collectSystemStatus(
  organizationId?: string
): Promise<HermesSystemStatus> {
  let postgres = { online: false };
  try {
    await db.execute(sql`SELECT 1`);
    postgres = { online: true };
  } catch {
    postgres = { online: false };
  }

  let ipfs: HermesSystemStatus['ipfs'] = { state: 'OFFLINE', detail: '' };
  try {
    const health = await ipfsOrchestrator.healthCheck();
    const primaryType = health.primary.providerType;
    if (health.durability.status === 'DURABLE') {
      ipfs = { state: 'DURABLE', detail: `${primaryType} + Dual-Mirror` };
    } else if (health.durability.status === 'DEGRADED') {
      ipfs = { state: 'DEGRADED', detail: 'Fail-over Active' };
    } else if (health.primary.ok) {
      ipfs = { state: 'ACTIVE', detail: `${primaryType} Primary` };
    } else {
      ipfs = { state: 'UNREACHABLE', detail: '' };
    }
  } catch {
    ipfs = { state: 'OFFLINE', detail: '' };
  }

  let securityEvents24h: number | null = null;
  try {
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(hermesSecurityEvents)
      .where(sql`${hermesSecurityEvents.createdAt} >= NOW() - INTERVAL '24 hours'`);
    securityEvents24h = rows[0]?.count ?? 0;
  } catch {
    securityEvents24h = null;
  }

  let knowledgeFacts: number | null = null;
  if (organizationId) {
    try {
      const rows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(hermesKnowledge)
        .where(sql`${hermesKnowledge.organizationId} = ${organizationId}`);
      knowledgeFacts = rows[0]?.count ?? 0;
    } catch {
      knowledgeFacts = null;
    }
  }

  return { postgres, ipfs, securityEvents24h, knowledgeFacts };
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildStatusMessage(
  status: HermesSystemStatus,
  workspaceName: string,
  authorizedCount: number
): string {
  const dbText = status.postgres.online ? '🟢 ONLINE' : '🔴 OFFLINE';

  const ipfsMap: Record<HermesSystemStatus['ipfs']['state'], string> = {
    DURABLE: `🟢 DURABLE (${status.ipfs.detail})`,
    ACTIVE: `🟢 ACTIVE (${status.ipfs.detail})`,
    DEGRADED: `🟡 DEGRADED (${status.ipfs.detail})`,
    UNREACHABLE: `🔴 UNREACHABLE`,
    OFFLINE: `🔴 OFFLINE`,
  };

  const secText =
    status.securityEvents24h === null
      ? `⚪ Sin datos`
      : `<code>${status.securityEvents24h}</code> eventos registrados (24h)`;

  const factsText =
    status.knowledgeFacts === null
      ? `⚪ Sin datos`
      : `<code>${status.knowledgeFacts}</code> hechos`;

  return (
    `📊 <b>Hermes OS — System Health</b>\n\n` +
    `• <b>Postgres Database (Neon):</b> ${dbText}\n` +
    `• <b>Sovereign IPFS Vault:</b> ${ipfsMap[status.ipfs.state]}\n` +
    `• <b>Eventos de Seguridad:</b> ${secText}\n` +
    `• <b>Workspace Activo:</b> <b>${escapeHtml(workspaceName)}</b> (${factsText})\n` +
    `• <b>Workspaces Autorizados:</b> ${authorizedCount}\n\n` +
    `<i>Consulta ejecutada en tiempo real.</i>`
  );
}
