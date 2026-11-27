/**
 * 🗣️ Community gateway · propuestas del agente de comunidad
 *
 * El agente de comunidad (Orca Bot) NO publica: propone. Este servicio hace tres
 * cosas y sólo tres:
 *
 *   1. `buildCommunityDigest` — lee el embudo, fuentes, clics y aprobaciones.
 *   2. `validateCommunityPost` — aplica la política del tenant (banned_topics).
 *   3. `createCommunityProposal` — si pasa la política, crea una aprobación.
 *
 * La publicación la ejecuta el bot de Discord **después** de la aprobación
 * humana, en la fase 2 del ADR-019. Aquí no hay escritura en Discord.
 */
import crypto from 'crypto';
import { db } from '@saasfly/db-core';
import {
  communityProposals,
  marketingLeads,
  nexusApprovals,
  nexusOutreachEvents,
  nexusOutreachLinks,
} from '@saasfly/db-core/schema';
import { and, desc, eq, gte, inArray, isNotNull, or, sql } from '@saasfly/db-core';
import { COMMUNITY_CAPABILITIES } from './community-capabilities';
import { notifyApprovalPending } from '../notifications/approval-notifier';

/** Términos prohibidos por `banned_topics` v2 (política vigente del tenant). */
const FORBIDDEN_TERMS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /fideicomiso/i, reason: 'No se menciona fideicomiso' },
  { pattern: /NOM-?\s?151/i, reason: 'No se invoca norma de certificación documental' },
  { pattern: /condo-?\s?hotel/i, reason: 'No se describe como condo-hotel' },
  { pattern: /renta\s+hotelera/i, reason: 'No se habla de renta hotelera' },
  { pattern: /\bhotel(es|era|er[ií]a)?\b/i, reason: 'No se describe como hotel ni operación hotelera' },
  { pattern: /\bnoches?\b/i, reason: 'El derecho de uso se expresa en estancias anuales' },
  { pattern: /\bCPs?\b/, reason: 'El producto es Título de Propiedad, no "CP"' },
  { pattern: /estrategia\s+de\s+familia/i, reason: 'No existe ese producto' },
  { pattern: /rendimiento\s+(fijo|garantizado)/i, reason: 'No se garantizan rendimientos' },
  { pattern: /retorno\s+garantizado/i, reason: 'No se garantizan retornos' },
];

/** Frases que no bloquean, pero exigen que el aprobador las vea. */
const REVIEW_FLAGS: Array<{ pattern: RegExp; warning: string }> = [
  { pattern: /\$\s?\d/, warning: 'Menciona una cifra en pesos/dólares: confirma que sea pública' },
  { pattern: /USD\s?\d|\d\s?USD/i, warning: 'Menciona un monto en USD: confirma que sea público' },
  { pattern: /plusval[ií]a|apreciaci[oó]n/i, warning: 'Habla de plusvalía/apreciación: sin promesa de retorno' },
  { pattern: /garantizad|asegurad[oa]/i, warning: 'Usa lenguaje de garantía: revisar' },
  { pattern: /https?:\/\//i, warning: 'Incluye enlaces: verifica que sean oficiales' },
];

export type CommunityPlatform = 'discord' | 'instagram' | 'facebook';

export interface CommunityPostInput {
  channel: string;
  text: string;
  /**
   * Red de destino (ADR-020). Por defecto `discord`, que es el canal histórico.
   * Cada red tiene sus reglas: Instagram exige imagen; Facebook admite texto.
   */
  platform?: CommunityPlatform;
  /** Imagen opcional (https). Se publica como embed. */
  imageUrl?: string;
  /** Carrusel: 2–10 URLs https. */
  imageUrls?: string[];
  /** Pieza de video (reel). */
  video?: boolean;
  /**
   * Código de atribución (`/l/<code>`) asignado por el servidor al proponer.
   * No lo envía el cliente: sirve para cruzar publicación → clics → leads.
   */
  code?: string;
}

export interface CommunityPostValidation {
  ok: boolean;
  violations: string[];
  warnings: string[];
}

export function validateCommunityPost(post: CommunityPostInput): CommunityPostValidation {
  const text = String(post.text || '').trim();
  const violations: string[] = [];
  const warnings: string[] = [];

  if (!text) violations.push('Texto vacío');
  if (text.length > 1800) violations.push(`Excede 1800 caracteres (${text.length})`);
  const platform: CommunityPlatform = post.platform ?? 'discord';
  if (!['discord', 'instagram', 'facebook'].includes(platform)) {
    violations.push(`Red no soportada: "${platform}"`);
  }

  if (platform === 'discord') {
    if (!post.channel || !/^[a-z0-9-]{2,64}$/i.test(post.channel)) {
      violations.push(`Canal inválido: "${post.channel}"`);
    }
  } else {
    // En redes, `channel` es el handle de la cuenta conectada.
    if (!post.channel || !/^[a-z0-9._@-]{2,64}$/i.test(post.channel)) {
      violations.push(`Cuenta inválida: "${post.channel}"`);
    }
  }

  if (post.imageUrl && !/^https:\/\//i.test(post.imageUrl)) {
    violations.push('La imagen debe ser una URL https');
  }
  // Instagram no permite publicaciones de sólo texto.
  if (platform === 'instagram' && !post.imageUrl) {
    violations.push('Instagram requiere una imagen');
  }

  for (const term of FORBIDDEN_TERMS) {
    if (term.pattern.test(text)) violations.push(term.reason);
  }
  for (const flag of REVIEW_FLAGS) {
    if (flag.pattern.test(text)) warnings.push(flag.warning);
  }

  return { ok: violations.length === 0, violations, warnings };
}

export interface CommunityDigest {
  tenantId: string;
  generatedAt: string;
  windowDays: number;
  funnel: Array<{ stage: string; count: number }>;
  sources: Array<{ source: string; count: number }>;
  links: Array<{ code: string; label: string | null; opens: number; destination: string | null }>;
  pendingApprovals: Array<{ id: string; what: string; why: string; createdAt: string }>;
  /**
   * Atribución por publicación (punto 3 del roadmap).
   *
   * Cruza cada publicación ejecutada con su enlace `/l/<code>`: aperturas,
   * visitantes únicos y leads que llegaron con ese código. `leads: null` significa
   * **no atribuible** (la landing externa no reenvió el código), no "cero".
   */
  attribution: Array<{
    proposalId: string;
    intent: string | null;
    channel: string;
    code: string | null;
    status: string;
    publishedAt: string | null;
    opens: number;
    uniqueVisitors: number;
    leads: number | null;
  }>;
  /**
   * Fase 3 (ADR-019): decisiones recientes con su motivo. El agente las lee en
   * cada corrida para no volver a proponer lo que ya se rechazó.
   */
  recentDecisions: Array<{ status: string; intent: string | null; reason: string | null; at: string | null }>;
}

/** Lee el estado del embudo. Solo lectura, con límites duros. */
export async function buildCommunityDigest(input: {
  projectId: number;
  canonicalOrgId: string;
  windowDays?: number;
}): Promise<CommunityDigest> {
  const windowDays = Math.min(Math.max(input.windowDays ?? 30, 1), 90);
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const funnelRows = await db
    .select({ stage: marketingLeads.crmStage, count: sql<number>`count(*)::int` })
    .from(marketingLeads)
    .where(eq(marketingLeads.projectId, input.projectId))
    .groupBy(marketingLeads.crmStage)
    .limit(20);

  const sourceRows = await db
    .select({ source: sql<string>`coalesce(${marketingLeads.source}, 'sin_origen')`, count: sql<number>`count(*)::int` })
    .from(marketingLeads)
    .where(and(eq(marketingLeads.projectId, input.projectId), gte(marketingLeads.createdAt, since)))
    .groupBy(sql`coalesce(${marketingLeads.source}, 'sin_origen')`)
    .limit(20);

  // Enlaces con destino propio (campañas de un tenant, no de un Deal Pod).
  const linkRows = await db
    .select({
      code: nexusOutreachLinks.code,
      label: nexusOutreachLinks.targetLabel,
      destination: nexusOutreachLinks.destinationUrl,
      opens: sql<number>`count(${nexusOutreachEvents.id})::int`,
    })
    .from(nexusOutreachLinks)
    .leftJoin(nexusOutreachEvents, eq(nexusOutreachEvents.linkId, nexusOutreachLinks.id))
    .where(and(isNotNull(nexusOutreachLinks.destinationUrl), eq(nexusOutreachEvents.event, 'OPEN')))
    .groupBy(nexusOutreachLinks.id)
    .orderBy(desc(sql`count(${nexusOutreachEvents.id})`))
    .limit(20);

  const approvalRows = await db
    .select({
      id: nexusApprovals.id,
      what: nexusApprovals.what,
      why: nexusApprovals.why,
      createdAt: nexusApprovals.createdAt,
    })
    .from(nexusApprovals)
    .where(and(
      eq(nexusApprovals.canonicalOrgId, input.canonicalOrgId),
      eq(nexusApprovals.status, 'PENDING'),
    ))
    .orderBy(desc(nexusApprovals.createdAt))
    .limit(20);

  const decisionRows = await db
    .select({
      status: communityProposals.status,
      intent: communityProposals.intent,
      result: communityProposals.result,
      createdAt: communityProposals.createdAt,
      executedAt: communityProposals.executedAt,
    })
    .from(communityProposals)
    .where(and(
      eq(communityProposals.canonicalOrgId, input.canonicalOrgId),
      inArray(communityProposals.status, ['EXECUTED', 'REJECTED', 'BLOCKED', 'FAILED']),
    ))
    .orderBy(desc(communityProposals.createdAt))
    .limit(15);

  // Atribución por publicación: la propuesta guarda el código de cada post.
  const executedRows = await db
    .select({
      id: communityProposals.id,
      intent: communityProposals.intent,
      status: communityProposals.status,
      posts: communityProposals.posts,
      executedAt: communityProposals.executedAt,
    })
    .from(communityProposals)
    .where(and(
      eq(communityProposals.canonicalOrgId, input.canonicalOrgId),
      eq(communityProposals.status, 'EXECUTED'),
    ))
    .orderBy(desc(communityProposals.executedAt))
    .limit(20);

  const codes = Array.from(new Set(
    executedRows.flatMap((row) => (row.posts ?? []).map((post) => post.code).filter(Boolean) as string[]),
  ));

  const linkStats = new Map<string, { opens: number; uniqueVisitors: number }>();
  const leadsByCode = new Map<string, number>();

  if (codes.length > 0) {
    const statsRows = await db
      .select({
        code: nexusOutreachLinks.code,
        opens: sql<number>`count(${nexusOutreachEvents.id})::int`,
        uniqueVisitors: sql<number>`count(distinct ${nexusOutreachEvents.ipHash})::int`,
      })
      .from(nexusOutreachLinks)
      .leftJoin(nexusOutreachEvents, and(
        eq(nexusOutreachEvents.linkId, nexusOutreachLinks.id),
        eq(nexusOutreachEvents.event, 'OPEN'),
      ))
      .where(inArray(nexusOutreachLinks.code, codes))
      .groupBy(nexusOutreachLinks.code);

    for (const row of statsRows) {
      linkStats.set(row.code, { opens: Number(row.opens), uniqueVisitors: Number(row.uniqueVisitors) });
    }

    // Los leads sólo son atribuibles si la landing reenvía el código (`src`).
    // Si no lo hace, se reporta null en lugar de un cero que parecería "no convirtió".
    const leadRows = await db
      .select({
        source: marketingLeads.source,
        metadataSrc: sql<string | null>`coalesce(${marketingLeads.metadata}->>'src', ${marketingLeads.metadata}->'attribution'->'context'->>'source')`,
      })
      .from(marketingLeads)
      .where(and(
        eq(marketingLeads.projectId, input.projectId),
        or(
          inArray(marketingLeads.source, codes),
          inArray(sql`${marketingLeads.metadata}->>'src'`, codes),
          // Leads capturados antes de guardar `source`: el código quedó en la
          // atribución del metadata.
          inArray(sql`${marketingLeads.metadata}->'attribution'->'context'->>'source'`, codes),
        ),
      ))
      .limit(2000);

    for (const row of leadRows) {
      const code = row.source && codes.includes(row.source) ? row.source : row.metadataSrc;
      if (code && codes.includes(code)) leadsByCode.set(code, (leadsByCode.get(code) ?? 0) + 1);
    }
  }

  const attribution = executedRows.flatMap((row) =>
    (row.posts ?? []).map((post) => {
      const stats = post.code ? linkStats.get(post.code) : undefined;
      return {
        proposalId: row.id,
        intent: row.intent ?? null,
        channel: post.channel,
        code: post.code ?? null,
        status: row.status,
        publishedAt: row.executedAt?.toISOString() ?? null,
        opens: stats?.opens ?? 0,
        uniqueVisitors: stats?.uniqueVisitors ?? 0,
        leads: post.code ? leadsByCode.get(post.code) ?? null : null,
      };
    }),
  );

  return {
    tenantId: input.canonicalOrgId,
    generatedAt: new Date().toISOString(),
    windowDays,
    funnel: funnelRows.map((r) => ({ stage: String(r.stage), count: Number(r.count) })),
    sources: sourceRows.map((r) => ({ source: String(r.source), count: Number(r.count) })),
    links: linkRows.map((r) => ({
      code: r.code,
      label: r.label ?? null,
      opens: Number(r.opens),
      destination: r.destination ?? null,
    })),
    pendingApprovals: approvalRows.map((r) => ({
      id: r.id,
      what: r.what,
      why: r.why,
      createdAt: r.createdAt.toISOString(),
    })),
    recentDecisions: decisionRows.map((r) => ({
      status: r.status,
      intent: r.intent ?? null,
      reason: (r.result as any)?.reason ?? (Array.isArray((r.result as any)?.errors) ? (r.result as any).errors[0] : null),
      at: (r.executedAt ?? r.createdAt)?.toISOString?.() ?? null,
    })),
    attribution,
  };
}

export type CommunityProposalResult =
  | { status: 'REJECTED_BY_POLICY'; violations: string[]; warnings: string[] }
  | { status: 'PENDING_APPROVAL'; approvalId: string; warnings: string[]; posts: number; idempotent?: boolean };

/**
 * Crea la aprobación. No publica: la ejecución ocurre tras la decisión humana.
 */
export async function createCommunityProposal(input: {
  canonicalOrgId: string;
  projectId: number;
  posts: CommunityPostInput[];
  requestedBy: string;
  intent?: string;
  /**
   * Clave de idempotencia del cliente. Si llega la misma, se devuelve la
   * aprobación pendiente existente en lugar de crear un duplicado (los reintentos
   * del bot no deben llenar la bandeja).
   */
  proposalKey?: string;
}): Promise<CommunityProposalResult> {
  if (!Array.isArray(input.posts) || input.posts.length === 0) {
    return { status: 'REJECTED_BY_POLICY', violations: ['Sin publicaciones'], warnings: [] };
  }
  if (input.posts.length > 10) {
    return { status: 'REJECTED_BY_POLICY', violations: ['Máximo 10 publicaciones por propuesta'], warnings: [] };
  }

  const violations: string[] = [];
  const warnings: string[] = [];
  input.posts.forEach((post, index) => {
    const result = validateCommunityPost(post);
    violations.push(...result.violations.map((v) => `[${index + 1}] ${v}`));
    warnings.push(...result.warnings.map((w) => `[${index + 1}] ${w}`));
  });

  if (violations.length > 0) {
    return { status: 'REJECTED_BY_POLICY', violations, warnings };
  }

  const proposalId = `CMP-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`.slice(0, 64);
  const approvalId = `APP-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`.slice(0, 64);
  const actionToken = crypto.randomBytes(16).toString('hex');
  const idempotencyKey = (input.proposalKey || proposalId).slice(0, 120);
  const what = `${COMMUNITY_CAPABILITIES.PROPOSE_PUBLISH}:${idempotencyKey}`;

  // Idempotencia por clave de propuesta: si ya existe, se devuelve la misma.
  const [existingProposal] = await db
    .select({ id: communityProposals.id, approvalId: communityProposals.approvalId, status: communityProposals.status })
    .from(communityProposals)
    .where(and(
      eq(communityProposals.canonicalOrgId, input.canonicalOrgId),
      eq(communityProposals.proposalKey, idempotencyKey),
    ))
    .limit(1);

  if (existingProposal?.approvalId) {
    return {
      status: 'PENDING_APPROVAL',
      approvalId: existingProposal.approvalId,
      warnings,
      posts: input.posts.length,
      idempotent: true,
    };
  }

  // Atribución: cada publicación recibe su propio enlace /l/<code>. Se añade al
  // texto ANTES de guardarlo, para que el aprobador vea exactamente lo que se
  // publicará y luego podamos medir qué post trae gente.
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance').replace(/\/$/, '');
  const postsWithTracking: CommunityPostInput[] = [];
  for (const post of input.posts) {
    let attributed: CommunityPostInput = post;
    // Reintento corto por colisión del código (el índice es único): si no se
    // consigue, la publicación sigue sin código en lugar de perderse.
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = crypto.randomBytes(6).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toLowerCase();
      const destination = `${baseUrl}/l/${code}`;
      try {
        await db.insert(nexusOutreachLinks).values({
          code,
          door: 'community',
          targetLabel: `${proposalId} · ${post.channel}`.slice(0, 255),
          destinationUrl: 'https://snarai.aztecaz.xyz/?utm_source=discord&utm_medium=social',
        });
        attributed = { ...post, text: `${post.text}\n\n${destination}`, code };
        break;
      } catch {
        // código repetido: se intenta otro
      }
    }
    postsWithTracking.push(attributed);
  }

  // El texto se guarda ANTES de la aprobación: aprobar sin contenido no tendría
  // qué ejecutar, y la evidencia se perdería.
  await db.insert(communityProposals).values({
    id: proposalId,
    canonicalOrgId: input.canonicalOrgId,
    projectId: input.projectId,
    proposalKey: idempotencyKey,
    intent: input.intent ?? null,
    posts: postsWithTracking,
    approvalId,
    status: 'PENDING',
    requestedBy: input.requestedBy,
  }).onConflictDoNothing();

  await db.insert(nexusApprovals).values({
    id: approvalId,
    canonicalOrgId: input.canonicalOrgId,
    actionToken,
    proposerId: null,
    proposerName: input.requestedBy,
    what,
    why: (input.intent || `Propuesta de ${input.posts.length} publicación(es) de comunidad`).slice(0, 500),
    resourceScope: `project:${input.projectId}|posts:${input.posts.length}`.slice(0, 256),
    capabilityRequired: COMMUNITY_CAPABILITIES.PROPOSE_PUBLISH,
    // Media/redes del tenant: se aprueba en el Growth OS del tenant, no en Nexus.
    scope: 'tenant',
    riskLevel: warnings.length > 0 ? 'HIGH' : 'MEDIUM',
    status: 'PENDING',
    nextAction: 'PUBLISH_COMMUNITY_POST',
  });

  // Aviso: in-app siempre; Discord sólo si el tenant tiene canal configurado.
  // La aprobación no se resuelve desde el aviso (el enlace lleva al portal).
  await notifyApprovalPending({
    canonicalOrgId: input.canonicalOrgId,
    approvalId,
    intent: input.intent ?? null,
    channels: postsWithTracking.map((post) => post.channel),
    posts: postsWithTracking.length,
  });

  return {
    status: 'PENDING_APPROVAL',
    approvalId,
    warnings,
    posts: input.posts.length,
  };
}
