import { NextResponse } from 'next/server';
import { db } from '@saasfly/db-core';
import { agentActionProposals } from '@saasfly/db-core/schema';
import { desc, eq } from '@saasfly/db-core';
import {
  countRecentProposals,
  proposeAgentAction,
  resolveAgentContext,
  suspendAgentKey,
} from '@/lib/nexus/agent-store';
import { requiresHumanApproval } from '@/lib/nexus/agent-identity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Acciones que el agente puede **proponer** (lista cerrada). */
const ALLOWED_ACTIONS = ['deal.update_status', 'deal.add_note', 'pod.add_contact'] as const;

const RESOURCE_TYPE_MAP: Record<string, 'pods' | 'rooms' | 'projects'> = {
  pod: 'pods',
  room: 'rooms',
  project: 'projects',
};

/**
 * `POST /api/agent/actions` — el agente **propone**, no ejecuta.
 *
 * Reglas (ADR-021):
 *  - capability `dealRoom` para acciones de deal,
 *  - recurso dentro del scope delegado,
 *  - límite de propuestas por hora (fase 5); si se excede → 429 y, si el agente
 *    tiene `autoSuspendOnAnomaly`, se suspende la clave,
 *  - siempre queda PENDING: la ejecución la decide un humano.
 */
export async function POST(req: Request) {
  const context = await resolveAgentContext(req.headers);
  if (!context) {
    return NextResponse.json({ ok: false, error: 'AGENT_UNAUTHORIZED' }, { status: 401 });
  }

  let body: {
    action?: unknown;
    resourceType?: unknown;
    resourceId?: unknown;
    payload?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
  }

  const action = String(body.action ?? '').trim();
  const resourceType = String(body.resourceType ?? '').trim();
  const resourceId = String(body.resourceId ?? '').trim();
  const payload =
    body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)
      ? (body.payload as Record<string, unknown>)
      : {};

  if (!(ALLOWED_ACTIONS as readonly string[]).includes(action)) {
    return NextResponse.json(
      { ok: false, error: 'ACTION_NOT_ALLOWED', allowed: ALLOWED_ACTIONS },
      { status: 400 },
    );
  }
  const scopeBucket = RESOURCE_TYPE_MAP[resourceType];
  if (!scopeBucket || !resourceId) {
    return NextResponse.json({ ok: false, error: 'INVALID_RESOURCE' }, { status: 400 });
  }
  if (!context.capabilities.includes('dealroom')) {
    return NextResponse.json(
      { ok: false, error: 'CAPABILITY_REQUIRED', required: 'dealRoom' },
      { status: 403 },
    );
  }
  if (!(context.scope[scopeBucket] ?? []).map(String).includes(resourceId)) {
    return NextResponse.json(
      { ok: false, error: 'RESOURCE_OUT_OF_SCOPE', resourceType, resourceId },
      { status: 403 },
    );
  }

  // ── Límite por hora (fase 5) ───────────────────────────────────────────────
  const recent = await countRecentProposals(context.agentKeyId);
  if (recent >= context.limits.maxMutationsPerHour) {
    if (context.limits.autoSuspendOnAnomaly) {
      await suspendAgentKey(
        context.agentKeyId,
        `auto-suspensión: ${recent} propuestas en una hora (límite ${context.limits.maxMutationsPerHour})`,
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: 'RATE_LIMITED',
        limit: context.limits.maxMutationsPerHour,
        suspended: context.limits.autoSuspendOnAnomaly,
      },
      { status: 429 },
    );
  }

  const proposal = await proposeAgentAction({
    context,
    action,
    resourceType,
    resourceId,
    payload,
  });

  if (!proposal) {
    return NextResponse.json({ ok: false, error: 'PROPOSAL_NOT_CREATED' }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      proposal,
      requiresHumanApproval: requiresHumanApproval(action, context.limits.requireApprovalFor),
      note: 'Propuesta registrada. No se ha ejecutado nada: requiere aprobación humana.',
    },
    { status: 202 },
  );
}

/** `GET /api/agent/actions` — historial de propuestas de esta clave. */
export async function GET(req: Request) {
  const context = await resolveAgentContext(req.headers);
  if (!context) {
    return NextResponse.json({ ok: false, error: 'AGENT_UNAUTHORIZED' }, { status: 401 });
  }

  const proposals = await db
    .select()
    .from(agentActionProposals)
    .where(eq(agentActionProposals.agentKeyId, context.agentKeyId))
    .orderBy(desc(agentActionProposals.createdAt))
    .limit(50);

  return NextResponse.json({ ok: true, count: proposals.length, proposals });
}
