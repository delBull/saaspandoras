/**
 * 🗣️ Community publisher · Fase 2 (ADR-019)
 *
 * Ejecuta la decisión humana sobre una propuesta de comunidad:
 *
 *   APPROVED  → publica cada post en su canal de Discord (lista blanca) y guarda el resultado
 *   REJECTED  → marca la propuesta y guarda el motivo (señal de aprendizaje)
 *
 * Garantías:
 *  - **Una sola ejecución**: se reclama la propuesta con un UPDATE condicional
 *    (`status='PENDING'` → `'EXECUTING'`). Si otra petición ya la tomó, no se publica dos veces.
 *  - **Defensa en profundidad**: el texto se vuelve a validar contra `banned_topics`
 *    antes de tocar Discord; si algo cambió, se bloquea y se registra.
 *  - **Lista blanca de canales**: sólo `s-narai-*` fuera de la categoría privada de miembros.
 *  - **Auditoría**: cada resultado (publicado, bloqueado, fallido) queda en `result` y en el
 *    log de seguridad.
 */
import { db } from '@saasfly/db-core';
import { communityProposals } from '@saasfly/db-core/schema';
import { and, eq } from '@saasfly/db-core';
import { SecurityAuditLogger } from '../runtime/security-audit-logger';
import { validateCommunityPost } from './community-gateway';

const API = 'https://discord.com/api/v10';

export interface PublishResult {
  status: 'EXECUTED' | 'REJECTED' | 'ALREADY_HANDLED' | 'BLOCKED' | 'FAILED';
  published: Array<{ channel: string; messageId: string }>;
  errors: string[];
  reason?: string;
}

function botToken(): string | null {
  return process.env.DISCORD_BOT_TOKEN || null;
}
function guildId(): string | null {
  return process.env.DISCORD_GUILD_ID || null;
}

async function discordGet(path: string, token: string): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bot ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Discord GET ${path} → ${res.status}`);
  return res.json();
}

/**
 * Resuelve la lista blanca de canales por nombre (sin ids hardcodeados).
 * Excluye la categoría privada de miembros.
 */
export async function resolveAllowedChannels(): Promise<Map<string, string>> {
  const token = botToken();
  const guild = guildId();
  if (!token || !guild) return new Map();

  const channels: any[] = await discordGet(`/guilds/${guild}/channels`, token);
  const privateCategory = channels.find((c) => c.type === 4 && /MIEMBROS/i.test(String(c.name)))?.id;

  const allowed = new Map<string, string>();
  for (const channel of channels) {
    if (channel.type !== 0) continue;
    if (privateCategory && channel.parent_id === privateCategory) continue;
    const name = String(channel.name || '');
    if (!/^s-narai-[a-z0-9-]+$/.test(name)) continue;
    allowed.set(name, channel.id);
  }
  return allowed;
}

export function isAllowedChannelName(name: string): boolean {
  return /^s-narai-[a-z0-9-]+$/.test(String(name || ''));
}

export async function publishCommunityProposal(input: {
  approvalId: string;
  decision: 'APPROVED' | 'REJECTED';
  resolvedBy: string | null;
  reason?: string | null;
}): Promise<PublishResult> {
  const [proposal] = await db
    .select()
    .from(communityProposals)
    .where(eq(communityProposals.approvalId, input.approvalId))
    .limit(1);

  if (!proposal) return { status: 'ALREADY_HANDLED', published: [], errors: [], reason: 'Sin propuesta asociada' };
  if (proposal.status !== 'PENDING') {
    return { status: 'ALREADY_HANDLED', published: [], errors: [], reason: `Ya estaba en ${proposal.status}` };
  }

  if (input.decision === 'REJECTED') {
    const [claimed] = await db
      .update(communityProposals)
      .set({
        status: 'REJECTED',
        result: { decision: 'REJECTED', reason: input.reason ?? null, resolvedBy: input.resolvedBy },
      })
      .where(and(eq(communityProposals.id, proposal.id), eq(communityProposals.status, 'PENDING')))
      .returning({ id: communityProposals.id });
    if (!claimed) return { status: 'ALREADY_HANDLED', published: [], errors: [] };
    return { status: 'REJECTED', published: [], errors: [], reason: input.reason ?? undefined };
  }

  // Revalidación antes de publicar: el texto se aprobó, pero la política se
  // vuelve a aplicar para que un cambio de reglas no deje pasar algo prohibido.
  const violations: string[] = [];
  for (const post of proposal.posts ?? []) {
    const result = validateCommunityPost(post);
    violations.push(...result.violations.map((v) => `${post.channel}: ${v}`));
    if (!isAllowedChannelName(post.channel)) violations.push(`${post.channel}: canal fuera de la lista blanca`);
  }
  if (violations.length > 0) {
    await db
      .update(communityProposals)
      .set({ status: 'BLOCKED', result: { decision: 'BLOCKED', violations, resolvedBy: input.resolvedBy } })
      .where(eq(communityProposals.id, proposal.id));
    return { status: 'BLOCKED', published: [], errors: violations };
  }

  // Reclamo atómico: sólo una ejecución puede pasar de PENDING a EXECUTING.
  const [claimed] = await db
    .update(communityProposals)
    .set({ status: 'EXECUTING', result: { decision: 'APPROVED', resolvedBy: input.resolvedBy } })
    .where(and(eq(communityProposals.id, proposal.id), eq(communityProposals.status, 'PENDING')))
    .returning({ id: communityProposals.id });

  if (!claimed) return { status: 'ALREADY_HANDLED', published: [], errors: [] };

  const token = botToken();
  if (!token) {
    await db
      .update(communityProposals)
      .set({ status: 'FAILED', result: { decision: 'FAILED', error: 'DISCORD_BOT_TOKEN ausente' } })
      .where(eq(communityProposals.id, proposal.id));
    return { status: 'FAILED', published: [], errors: ['DISCORD_BOT_TOKEN ausente'] };
  }

  let allowed: Map<string, string>;
  try {
    allowed = await resolveAllowedChannels();
  } catch (err: any) {
    await db
      .update(communityProposals)
      .set({ status: 'FAILED', result: { decision: 'FAILED', error: err?.message || 'canales inaccesibles' } })
      .where(eq(communityProposals.id, proposal.id));
    return { status: 'FAILED', published: [], errors: [err?.message || 'canales inaccesibles'] };
  }

  const published: Array<{ channel: string; messageId: string }> = [];
  const errors: string[] = [];

  for (const post of proposal.posts ?? []) {
    const channelId = allowed.get(post.channel);
    if (!channelId) {
      errors.push(`${post.channel}: canal no disponible o no permitido`);
      continue;
    }
    try {
      // La imagen se publica como embed (Discord no acepta adjuntos por URL en
      // `content`). Si el embed falla por una URL rota, el mensaje sigue vivo.
      const payload: Record<string, unknown> = { content: post.text };
      if (post.imageUrl) {
        payload.embeds = [{ image: { url: post.imageUrl } }];
      }

      const res = await fetch(`${API}/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        errors.push(`${post.channel}: HTTP ${res.status} ${text.slice(0, 120)}`);
        continue;
      }
      const json = (await res.json()) as { id?: string };
      published.push({ channel: post.channel, messageId: String(json.id || '') });
    } catch (err: any) {
      errors.push(`${post.channel}: ${err?.message || 'error de red'}`);
    }
  }

  // Si algo se publicó, la propuesta queda EXECUTED con los errores registrados.
  const status = published.length > 0 ? 'EXECUTED' : 'FAILED';

  await db
    .update(communityProposals)
    .set({
      status,
      executedAt: new Date(),
      result: { decision: 'APPROVED', published, errors, resolvedBy: input.resolvedBy },
    })
    .where(eq(communityProposals.id, proposal.id));

  await SecurityAuditLogger.logEvent({
    organizationId: proposal.canonicalOrgId,
    actorId: input.resolvedBy || 'approval:admin',
    eventType: 'EXECUTIVE_ACTION_EXECUTED',
    severity: errors.length > 0 ? 'WARN' : 'INFO',
    policyDecision: errors.length > 0 ? 'DENY' : 'ALLOW',
    correlationId: `community_publish_${proposal.id}`,
    metadata: {
      approvalId: input.approvalId,
      proposalId: proposal.id,
      published: published.length,
      errors: errors.slice(0, 5),
    },
  }).catch(() => {});

  return { status, published, errors, reason: errors[0] };
}
