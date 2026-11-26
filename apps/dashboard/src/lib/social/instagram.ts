/**
 * 📸 Puente Instagram → WhatsApp (ADR-020 §2.4-bis)
 *
 * Un comentario o un DM con la palabra clave (`SNARAI`) recibe **una** respuesta
 * privada con el enlace de WhatsApp del tenant. La conversación no se sostiene en
 * Instagram: ahí no hay alma, ni conocimiento, ni política de claims. El DM sólo
 * entrega el puente y propaga el código de atribución para saber de qué pieza
 * vino la persona.
 *
 * Reglas de Meta que este módulo respeta:
 *  - Respuesta privada a un comentario: **una sola**, con ventana de 7 días.
 *  - DM a DM: ventana de 24 h.
 *  - Un reintento del webhook no puede enviar dos veces: índice único
 *    `(network, external_id)` en `social_dm_log` (migración 0124).
 *
 * Identidad: Hermes (plataforma) y S'Narai son apps de Meta distintas. El app
 * secret y el token se resuelven **por tenant**, nunca con el secreto global
 * como respaldo de un tenant (ver `docs/CHANNEL-IDENTITY-MAP.md`).
 */
import crypto from 'node:crypto';
import { db } from '@saasfly/db-core';
import { and, eq } from '@saasfly/db-core';
import { projects, socialDmLog, tenantSocialIntegrations } from '@saasfly/db-core/schema';
// Import directo (no el barrel de `@saasfly/hermes-core`): esta ruta compila más
// rápido y `dm-keyword` es puro (sin DB ni red).
import { parseDmKeyword } from '@saasfly/hermes-core/src/channels/dm-keyword';

const GRAPH = 'https://graph.instagram.com/v21.0';
const PLATFORM_SLUG = 'pandoras';

export interface InstagramEvent {
  kind: 'comment' | 'message';
  /** `comment_id` o `message_id`: clave de idempotencia. */
  externalId: string;
  /** Autor del comentario o remitente del DM. */
  senderId: string;
  text: string;
  /** Publicación donde se comentó (sólo comentarios). */
  mediaId?: string | null;
}

export interface ParsedWebhook {
  igUserId: string | null;
  events: InstagramEvent[];
}

export interface InstagramIdentity {
  /** Cuenta de Instagram que recibió el evento (`entry[0].id`). */
  igUserId: string;
  /** Slug del tenant dueño de la cuenta. */
  tenantSlug: string;
  /** Organización canónica del tenant (nunca viene del payload). */
  canonicalOrgId: string | null;
  /** Host de la Graph API para esta cuenta (Instagram Login o Facebook Login). */
  apiBase: string;
  /** App secret con el que se debe validar la firma. */
  appSecret: string;
  /** Nombre de la variable usada (nunca el valor). */
  secretSource: string;
  isPlatform: boolean;
}

// ─── Payload ────────────────────────────────────────────────────────────────

/** Extrae los eventos accionables de un payload de webhooks de Instagram. */
export function parseInstagramWebhook(body: any): ParsedWebhook {
  const entry = Array.isArray(body?.entry) ? body.entry[0] : null;
  const igUserId = entry?.id ? String(entry.id) : null;
  const events: InstagramEvent[] = [];

  for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
    const field = String(change?.field || '');
    const value = change?.value || {};

    if (field === 'comments' && value?.id) {
      events.push({
        kind: 'comment',
        externalId: String(value.id),
        senderId: String(value.from?.id || ''),
        text: String(value.text || ''),
        mediaId: value.media?.id ? String(value.media.id) : null,
      });
      continue;
    }

    if (field === 'messages') {
      const message = value?.message;
      if (!message?.mid) continue;
      // Se ignoran los ecos (mensajes que el propio negocio envió).
      if (message.is_echo) continue;
      events.push({
        kind: 'message',
        externalId: String(message.mid),
        senderId: String(value.sender?.id || ''),
        text: String(message.text || ''),
        mediaId: null,
      });
    }
  }

  return { igUserId, events };
}

/** Texto del DM: enlace de WhatsApp con la palabra clave y el código. */
export function buildDmText(input: {
  projectTitle: string;
  whatsappNumber: string;
  keyword: string;
  code?: string | null;
}): string {
  const number = String(input.whatsappNumber || '').replace(/[^\d]/g, '');
  const text = [input.keyword, input.code].filter(Boolean).join(' ');
  const link = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

  return (
    `Gracias por escribirnos. Para darte los detalles de ${input.projectTitle} seguimos por WhatsApp, ` +
    `donde el equipo te responde al momento:\n\n${link}`
  );
}

// ─── Verificación del webhook ───────────────────────────────────────────────

function envSuffix(slug: string): string {
  return slug.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

/**
 * Verifica el `hub.verify_token` del GET de Meta.
 *
 * Una app de Meta = una suscripción de webhook = un verify token. Como pueden
 * coexistir la app de Hermes (plataforma) y la de un tenant, se aceptan:
 *   - `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` (app de Instagram)
 *   - `INSTAGRAM_WEBHOOK_VERIFY_TOKEN_<SLUG>` (app propia del tenant)
 *   - `META_WEBHOOK_VERIFY_TOKEN` (el mismo de la app de Meta, si ya existe)
 *
 * El verify token no autoriza nada: sólo demuestra que el endpoint que responde
 * es el nuestro. La autorización real es la firma HMAC del POST.
 */
export function verifyInstagramChallenge(token: string | null): boolean {
  const candidate = String(token || '').trim();
  if (!candidate) return false;

  const accepted = new Set<string>();
  const global = (process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN || '').trim();
  if (global) accepted.add(global);

  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('INSTAGRAM_WEBHOOK_VERIFY_TOKEN_')) continue;
    if (key === 'INSTAGRAM_WEBHOOK_VERIFY_TOKEN_') continue;
    const secret = String(value || '').trim();
    if (secret) accepted.add(secret);
  }

  return accepted.has(candidate);
}

// ─── Identidad ──────────────────────────────────────────────────────────────

interface ProjectRow {
  slug: string;
  organizationId: string | null;
  title: string;
  extraConfig: any;
  runtimeConfig: any;
}

async function loadProjects(): Promise<ProjectRow[]> {
  try {
    const rows = await db
      .select({
        slug: projects.slug,
        organizationId: projects.organizationId,
        title: projects.title,
        extraConfig: projects.extraConfig,
        runtimeConfig: projects.tenantRuntimeConfig,
      })
      .from(projects)
      .limit(1000);

    return rows.map((row) => ({
      slug: String(row.slug || '').toLowerCase(),
      organizationId: row.organizationId ? String(row.organizationId) : null,
      title: String(row.title || row.slug || ''),
      extraConfig: row.extraConfig || {},
      runtimeConfig: row.runtimeConfig || {},
    }));
  } catch (err: any) {
    console.warn('[InstagramWebhook] No se pudieron leer proyectos:', err?.message || err);
    return [];
  }
}

function projectIgUserId(row: ProjectRow): string {
  const community = (row.extraConfig as any)?.community || {};
  return String(
    process.env[`META_IG_USER_ID_${envSuffix(row.slug)}`] ||
      community.igUserId ||
      (row.runtimeConfig as any)?.secrets?.instagramUserId ||
      '',
  ).trim();
}

/**
 * Resuelve el tenant dueño de una cuenta de Instagram.
 *
 * Orden (el mismo espíritu que `resolveTenantByPhoneNumberId`):
 *   1. `tenant_social_integrations` conectada por el portal (metadato `igUserId`)
 *   2. `extraConfig.community.igUserId` del proyecto
 *   3. `META_IG_USER_ID_<SLUG>`
 *   4. cuenta de plataforma → `pandoras`
 *
 * Devuelve `null` si no hay dueño: la ruta responde 200 sin procesar (fail-closed
 * aguas abajo, para no romper la suscripción de Meta).
 */
export async function resolveInstagramIdentity(igUserId: string): Promise<InstagramIdentity | null> {
  const id = String(igUserId || '').trim();
  if (!id) return null;

  const rows = await loadProjects();
  const byOrg = new Map<string, ProjectRow>();
  for (const row of rows) {
    if (row.organizationId) byOrg.set(row.organizationId, row);
  }

  let tenant: ProjectRow | null = null;

  // 1) Integración conectada desde el portal.
  try {
    const integrations = await db
      .select({
        tenantId: tenantSocialIntegrations.tenantId,
        metadata: tenantSocialIntegrations.metadata,
      })
      .from(tenantSocialIntegrations)
      .where(and(
        eq(tenantSocialIntegrations.channel, 'instagram'),
        eq(tenantSocialIntegrations.status, 'CONNECTED'),
      ))
      .limit(100);

    for (const integration of integrations) {
      const meta = (integration.metadata as Record<string, unknown> | null) ?? {};
      const candidate = String(meta.igUserId || meta.instagramBusinessId || '').trim();
      if (candidate !== id) continue;
      tenant = byOrg.get(String(integration.tenantId)) ?? null;
      if (tenant) break;
    }
  } catch (err: any) {
    console.warn('[InstagramWebhook] Integraciones no disponibles:', err?.message || err);
  }

  // 2-3) Configuración del proyecto o variable de entorno por slug.
  if (!tenant) {
    tenant = rows.find((row) => projectIgUserId(row) === id) ?? null;
  }

  // 4) Cuenta de la plataforma.
  const platformIgId = (
    process.env.META_IG_USER_ID ||
    process.env.INSTAGRAM_USER_ID ||
    ''
  ).trim();

  const isPlatform = !tenant && platformIgId === id;
  if (!tenant && !isPlatform) return null;

  const tenantSlug = tenant?.slug || PLATFORM_SLUG;

  /**
   * El host no se adivina: un token de Facebook Login no funciona contra
   * `graph.instagram.com` (y al revés). Se resuelve por entorno o por el dato
   * del tenant, y el default es el camino de Instagram Login.
   */
  const community = (tenant?.extraConfig as any)?.community || {};
  const apiBase = String(
    (isPlatform
      ? process.env.META_IG_API_BASE
      : process.env[`META_IG_API_BASE_${envSuffix(tenantSlug)}`]) ||
      community.igApiBase ||
      GRAPH,
  ).replace(/\/$/, '');
  /**
   * Instagram Login firma los webhooks con el **Instagram app secret**, que en
   * Meta es distinto del app secret de Facebook (el que usa WhatsApp). Si se
   * reutilizara `META_APP_SECRET_<SLUG>` para ambos, conectar Instagram
   * rompería la validación de WhatsApp: por eso se busca primero el secreto
   * propio de Instagram y sólo después el compartido.
   */
  const secretCandidates = isPlatform
    ? ['META_APP_SECRET', 'WHATSAPP_APP_SECRET']
    : [`META_IG_APP_SECRET_${envSuffix(tenantSlug)}`, `META_APP_SECRET_${envSuffix(tenantSlug)}`];

  let secretEnvName = secretCandidates[0];
  let appSecret = '';
  for (const name of secretCandidates) {
    const value = (process.env[name] || '').trim();
    if (value) {
      appSecret = value;
      secretEnvName = name;
      break;
    }
  }

  return {
    igUserId: id,
    tenantSlug,
    canonicalOrgId: tenant?.organizationId ?? null,
    apiBase,
    appSecret,
    secretSource: secretEnvName,
    isPlatform,
  };
}

/** Número de WhatsApp al que se manda a la persona (dato del tenant). */
export async function resolveCommunityWhatsAppNumber(tenantSlug: string): Promise<string | null> {
  const slug = String(tenantSlug || '').toLowerCase();
  const envNumber =
    process.env[`COMMUNITY_WHATSAPP_NUMBER_${envSuffix(slug)}`] ||
    process.env.COMMUNITY_WHATSAPP_NUMBER ||
    '';

  const rows = await loadProjects();
  const row = rows.find((item) => item.slug === slug);
  const community = (row?.extraConfig as any)?.community || {};
  const configured = String(community.whatsappNumber || '').trim();

  const number = String(configured || envNumber).replace(/[^\d]/g, '');
  return number || null;
}

/** Credenciales de envío del tenant: integración cifrada o entorno. */
export async function resolveInstagramCredentials(
  identity: Pick<InstagramIdentity, 'tenantSlug' | 'canonicalOrgId' | 'igUserId' | 'isPlatform' | 'apiBase'>,
): Promise<{ igUserId: string; accessToken: string; apiBase: string } | null> {
  const { tenantSlug, canonicalOrgId, igUserId, isPlatform } = identity;

  if (canonicalOrgId) {
    try {
      const [row] = await db
        .select({
          id: tenantSocialIntegrations.id,
          encryptedPayload: tenantSocialIntegrations.encryptedPayload,
        })
        .from(tenantSocialIntegrations)
        .where(and(
          eq(tenantSocialIntegrations.tenantId, canonicalOrgId),
          eq(tenantSocialIntegrations.channel, 'instagram'),
          eq(tenantSocialIntegrations.status, 'CONNECTED'),
        ))
        .limit(1);

      if (row?.encryptedPayload) {
        // Import puntual del vault: evita arrastrar el barrel completo al
        // compilar la ruta cuando no hay credenciales cifradas.
        const { channelVaultAdapter } = await import('@saasfly/hermes-core/src/channels/channel-vault.service');
        const decrypted = await channelVaultAdapter.decryptCredentials(
          canonicalOrgId,
          row.id,
          'instagram',
          row.encryptedPayload as any,
        );
        const creds = (decrypted?.credentials ?? {}) as Record<string, unknown>;
        const token = String(creds.accessToken || creds.pageAccessToken || '').trim();
        if (token) {
          return {
            igUserId: String(creds.igUserId || igUserId),
            accessToken: token,
            apiBase: String(creds.apiBase || identity.apiBase || GRAPH).replace(/\/$/, ''),
          };
        }
      }
    } catch (err: any) {
      console.warn('[InstagramWebhook] Credenciales cifradas no disponibles:', err?.message || err);
    }
  }

  const token = String(
    isPlatform
      ? process.env.META_IG_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN || ''
      : process.env[`META_IG_ACCESS_TOKEN_${envSuffix(tenantSlug)}`] || '',
  ).trim();

  if (!token) return null;

  return { igUserId, accessToken: token, apiBase: identity.apiBase };
}

// ─── Idempotencia ───────────────────────────────────────────────────────────

async function claimEvent(input: {
  canonicalOrgId: string;
  externalId: string;
  kind: 'comment' | 'message';
}): Promise<boolean> {
  try {
    const inserted = await db.insert(socialDmLog).values({
      id: `dm_${crypto.randomUUID()}`,
      canonicalOrgId: input.canonicalOrgId,
      network: 'instagram',
      externalId: input.externalId,
      kind: input.kind,
      status: 'PENDING',
    }).onConflictDoNothing().returning({ id: socialDmLog.id });

    return Array.isArray(inserted) && inserted.length > 0;
  } catch (err: any) {
    console.warn('[InstagramWebhook] No se pudo reclamar el evento:', err?.message || err);
    return false;
  }
}

async function finishEvent(externalId: string, status: string, detail?: string): Promise<void> {
  try {
    await db.update(socialDmLog)
      .set({ status: status.slice(0, 24), detail: detail ? detail.slice(0, 500) : null })
      .where(and(eq(socialDmLog.network, 'instagram'), eq(socialDmLog.externalId, externalId)));
  } catch {
    // El registro queda en PENDING: no se rompe la respuesta a Meta.
  }
}

// ─── Envío ──────────────────────────────────────────────────────────────────

/** Envía la respuesta privada (comentario) o el DM (mensaje). */
export async function sendInstagramReply(input: {
  apiBase: string;
  accessToken: string;
  igUserId: string;
  event: InstagramEvent;
  text: string;
  timeoutMs?: number;
}): Promise<void> {
  const recipient =
    input.event.kind === 'comment'
      ? { comment_id: input.event.externalId }
      : { id: input.event.senderId };

  if (input.event.kind === 'message' && !input.event.senderId) {
    throw new Error('DM sin remitente (sender.id ausente)');
  }

  const res = await fetch(`${input.apiBase}/${input.igUserId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipient, message: { text: input.text } }),
    cache: 'no-store',
    signal: AbortSignal.timeout(input.timeoutMs ?? 8000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Instagram ${res.status}: ${body.slice(0, 180)}`);
  }
}

/**
 * Procesa un evento: keyword → respuesta privada con el enlace de WhatsApp.
 *
 * No responde nada si el texto no trae la palabra clave: responder a todos los
 * comentarios convertiría la cuenta en spam y Meta lo penaliza.
 */
export async function handleInstagramEvent(input: {
  identity: InstagramIdentity;
  event: InstagramEvent;
}): Promise<'SENT' | 'SKIPPED_NO_KEYWORD' | 'SKIPPED_NO_CREDENTIALS' | 'DUPLICATE' | 'FAILED'> {
  const { identity, event } = input;

  const match = parseDmKeyword(event.text);
  if (!match.matched) return 'SKIPPED_NO_KEYWORD';

  const ownerKey = identity.canonicalOrgId || identity.tenantSlug;
  const claimed = await claimEvent({
    canonicalOrgId: ownerKey,
    externalId: event.externalId,
    kind: event.kind,
  });
  if (!claimed) return 'DUPLICATE';

  const credentials = await resolveInstagramCredentials(identity);
  if (!credentials) {
    await finishEvent(
      event.externalId,
      'SKIPPED_NO_CREDENTIALS',
      `sin token de Instagram para ${identity.tenantSlug} (${identity.isPlatform ? 'META_IG_ACCESS_TOKEN' : `META_IG_ACCESS_TOKEN_${envSuffix(identity.tenantSlug)}`})`,
    );
    return 'SKIPPED_NO_CREDENTIALS';
  }

  const whatsappNumber = await resolveCommunityWhatsAppNumber(identity.tenantSlug);
  if (!whatsappNumber) {
    await finishEvent(
      event.externalId,
      'SKIPPED_NO_CREDENTIALS',
      `sin número de WhatsApp para ${identity.tenantSlug}`,
    );
    return 'SKIPPED_NO_CREDENTIALS';
  }

  const rows = await loadProjects();
  const project = rows.find((row) => row.slug === identity.tenantSlug);

  const text = buildDmText({
    projectTitle: project?.title || identity.tenantSlug,
    whatsappNumber,
    keyword: match.keyword,
    code: match.code,
  });

  try {
    await sendInstagramReply({ ...credentials, event, text });
    await finishEvent(event.externalId, 'SENT', `${event.kind} → ${event.externalId}`);
    return 'SENT';
  } catch (err: any) {
    await finishEvent(event.externalId, 'FAILED', err?.message);
    return 'FAILED';
  }
}
