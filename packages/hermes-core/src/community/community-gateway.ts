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
  marketingLeads,
  nexusApprovals,
  nexusOutreachEvents,
  nexusOutreachLinks,
} from '@saasfly/db-core/schema';
import { and, desc, eq, gte, isNotNull, sql } from '@saasfly/db-core';
import { COMMUNITY_CAPABILITIES } from './community-capabilities';

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

export interface CommunityPostInput {
  channel: string;
  text: string;
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
  if (!post.channel || !/^[a-z0-9-]{2,64}$/i.test(post.channel)) {
    violations.push(`Canal inválido: "${post.channel}"`);
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

  const approvalId = `APP-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`.slice(0, 64);
  const actionToken = crypto.randomBytes(16).toString('hex');
  const idempotencyKey = (input.proposalKey || approvalId).slice(0, 120);
  const what = `${COMMUNITY_CAPABILITIES.PROPOSE_PUBLISH}:${idempotencyKey}`;

  // Idempotencia: misma clave + misma organización + aún pendiente → devolver la
  // existente. Un reintento no crea una segunda aprobación.
  const [existing] = await db
    .select({ id: nexusApprovals.id })
    .from(nexusApprovals)
    .where(and(
      eq(nexusApprovals.canonicalOrgId, input.canonicalOrgId),
      eq(nexusApprovals.what, what),
      eq(nexusApprovals.status, 'PENDING'),
    ))
    .limit(1);

  if (existing) {
    return { status: 'PENDING_APPROVAL', approvalId: existing.id, warnings, posts: input.posts.length, idempotent: true };
  }

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
    riskLevel: warnings.length > 0 ? 'HIGH' : 'MEDIUM',
    status: 'PENDING',
    nextAction: 'PUBLISH_COMMUNITY_POST',
  });

  return {
    status: 'PENDING_APPROVAL',
    approvalId,
    warnings,
    posts: input.posts.length,
  };
}
