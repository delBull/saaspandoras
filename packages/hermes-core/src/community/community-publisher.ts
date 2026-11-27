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
 *  - **Lista blanca de canales**: sólo `<prefijo-del-tenant>-*`, fuera de la categoría privada de miembros.
 *  - **Auditoría**: cada resultado (publicado, bloqueado, fallido) queda en `result` y en el
 *    log de seguridad.
 */
import { db } from '@saasfly/db-core';
import { communityProposals, projects, tenantSocialIntegrations } from '@saasfly/db-core/schema';
import { buildInstagramEnvCredentials, type PlatformCredentials } from './platform-credentials';
import { and, eq } from '@saasfly/db-core';
import { SecurityAuditLogger } from '../runtime/security-audit-logger';
import { validateCommunityPost } from './community-gateway';
import { isChannelOfTenant } from './channel-prefixes';
import { DirectChannelPublisher } from '../channels/publishers/direct-channel-publisher';

const isDiscordPost = (post: { platform?: string }) => (post.platform ?? 'discord') === 'discord';

/**
 * Integración CONNECTED del tenant para esa red. El `channel` del post es el
 * handle; si no coincide con ninguno, se usa la primera cuenta conectada.
 */
type IntegrationRef =
  | { kind: 'vault'; id: string }
  | { kind: 'env'; credentials: PlatformCredentials; handle: string };

async function resolveSocialIntegration(
  canonicalOrgId: string,
  platform: string,
  handle: string,
): Promise<IntegrationRef | null> {
  const rows = await db
    .select({ id: tenantSocialIntegrations.id, accountHandle: tenantSocialIntegrations.accountHandle })
    .from(tenantSocialIntegrations)
    .where(and(
      eq(tenantSocialIntegrations.tenantId, canonicalOrgId),
      eq(tenantSocialIntegrations.channel, platform),
      eq(tenantSocialIntegrations.status, 'CONNECTED'),
    ))
    .limit(10);

  const first = rows[0];
  if (first) {
    const wanted = String(handle || '').replace(/^@/, '').toLowerCase();
    const match = rows.find((row) => String(row.accountHandle || '').replace(/^@/, '').toLowerCase() === wanted);
    return { kind: 'vault', id: (match ?? first).id };
  }

  /**
   * Sin fila cifrada: Instagram puede resolverse por entorno, igual que el
   * webhook (`META_IG_*_<SLUG>` + `extraConfig.community`). Así publicar no
   * depende de tener la KEK del vault a mano.
   */
  if (platform !== 'instagram') return null;

  try {
    const [project] = await db
      .select({ slug: projects.slug, extraConfig: projects.extraConfig })
      .from(projects)
      .where(eq(projects.organizationId, canonicalOrgId))
      .limit(1);

    if (!project?.slug) return null;

    const community = ((project.extraConfig as any)?.community ?? null) as
      | { igUserId?: string; igApiBase?: string }
      | null;

    const credentials = buildInstagramEnvCredentials({ slug: project.slug, community });
    if (!credentials) return null;

    return { kind: 'env', credentials, handle: String(handle || '@instagram') };
  } catch (err: any) {
    console.warn('[community-publisher] No se pudo resolver credenciales por entorno:', err?.message || err);
    return null;
  }
}

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
export async function resolveAllowedChannels(canonicalOrgId: string): Promise<Map<string, string>> {
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
    // ADR-020 §2.5: el prefijo sale del tenant, no de una constante.
    if (!isChannelOfTenant(name, canonicalOrgId)) continue;
    allowed.set(name, channel.id);
  }
  return allowed;
}

export function isAllowedChannelName(name: string, canonicalOrgId: string): boolean {
  return isChannelOfTenant(name, canonicalOrgId);
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
  const posts = proposal.posts ?? [];
  const violations: string[] = [];
  for (const post of posts) {
    const result = validateCommunityPost(post);
    violations.push(...result.violations.map((v) => `${post.channel}: ${v}`));
    if (isDiscordPost(post) && !isAllowedChannelName(post.channel, proposal.canonicalOrgId)) {
      violations.push(`${post.channel}: canal fuera de la lista blanca`);
    }
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

  const needsDiscord = posts.some(isDiscordPost);
  const token = needsDiscord ? botToken() : null;
  if (needsDiscord && !token) {
    await db
      .update(communityProposals)
      .set({ status: 'FAILED', result: { decision: 'FAILED', error: 'DISCORD_BOT_TOKEN ausente' } })
      .where(eq(communityProposals.id, proposal.id));
    return { status: 'FAILED', published: [], errors: ['DISCORD_BOT_TOKEN ausente'] };
  }

  let allowed = new Map<string, string>();
  if (needsDiscord) {
    try {
      allowed = await resolveAllowedChannels(proposal.canonicalOrgId);
    } catch (err: any) {
      await db
        .update(communityProposals)
        .set({ status: 'FAILED', result: { decision: 'FAILED', error: err?.message || 'canales inaccesibles' } })
        .where(eq(communityProposals.id, proposal.id));
      return { status: 'FAILED', published: [], errors: [err?.message || 'canales inaccesibles'] };
    }
  }

  const published: Array<{ channel: string; messageId: string }> = [];
  const errors: string[] = [];
  const directPublisher = needsDiscord || posts.length > 0 ? new DirectChannelPublisher() : null;

  for (const post of posts) {
    // ── Redes sociales (Instagram / Facebook) ────────────────────────────────
    if (!isDiscordPost(post)) {
      const platform = String(post.platform);
      try {
        const integration = await resolveSocialIntegration(proposal.canonicalOrgId, platform, post.channel);
        if (!integration) {
          errors.push(`${post.channel}: cuenta de ${platform} no conectada`);
          continue;
        }

        const target = integration.kind === 'vault' ? integration.id : 'env';
        const publicationPayload = {
          text: post.text,
          mediaUrls: post.imageUrl ? [post.imageUrl] : [],
          contentType: (post.imageUrl ? 'image' : 'text') as 'image' | 'text',
          idempotencyKey: `${proposal.id}:${platform}:${target}`,
        };

        const receipt = integration.kind === 'vault'
          ? await directPublisher!.publishToChannel(proposal.canonicalOrgId, integration.id, publicationPayload)
          : await directPublisher!.publishWithCredentials(
              proposal.canonicalOrgId,
              platform as any,
              integration.credentials as unknown as Record<string, unknown>,
              publicationPayload,
              { accountHandle: integration.handle },
            );

        if (!receipt.success) {
          errors.push(`${post.channel}: ${receipt.errorCode}${receipt.errorMessage ? ` — ${receipt.errorMessage}` : ''}`);
          continue;
        }
        published.push({ channel: `${platform}:${post.channel}`, messageId: String(receipt.externalPostId ?? '') });
      } catch (err: any) {
        errors.push(`${post.channel}: ${err?.message || 'error de red'}`);
      }
      continue;
    }

    // ── Discord ─────────────────────────────────────────────────────────────
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
