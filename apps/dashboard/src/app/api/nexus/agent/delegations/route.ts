import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db-core';
import { agentKeys } from '@saasfly/db-core/schema';
import { and, eq } from '@saasfly/db-core';
import { intersectCapabilities } from '@/lib/nexus/agent-identity';
import {
  delegableCapabilities,
  findCollaborator,
  requestDelegation,
} from '@/lib/nexus/agent-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `POST /api/nexus/agent/delegations`
 *
 * El colaborador pide permiso para que su agente actúe, sobre qué recursos y
 * por cuánto tiempo. La solicitud queda **PENDING**: nada se activa hasta que
 * el owner la apruebe (bandeja de aprobaciones).
 *
 * La lista de capabilities se recorta a lo que la persona realmente tiene:
 * pedir de más no concede de más.
 */
export async function POST(req: Request) {
  const auth = await getNexusAuthContext(req.headers);
  if (!auth.isAuthenticated || !auth.email || !auth.collaboratorId) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const collaborator = await findCollaborator(auth.collaboratorId);
  if (!collaborator || collaborator.status !== 'ACTIVE') {
    return NextResponse.json({ ok: false, error: 'COLLABORATOR_INACTIVE' }, { status: 403 });
  }

  let body: {
    agentKeyId?: unknown;
    capabilities?: unknown;
    scope?: unknown;
    days?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
  }

  const agentKeyId = String(body.agentKeyId ?? '').trim();
  if (!agentKeyId) {
    return NextResponse.json({ ok: false, error: 'MISSING_AGENT_KEY' }, { status: 400 });
  }

  // La clave debe ser suya y estar activa.
  const [key] = await db
    .select({ id: agentKeys.id, status: agentKeys.status })
    .from(agentKeys)
    .where(and(eq(agentKeys.id, agentKeyId), eq(agentKeys.collaboratorId, collaborator.id)))
    .limit(1);

  if (!key || key.status !== 'ACTIVE') {
    return NextResponse.json({ ok: false, error: 'AGENT_KEY_INVALID' }, { status: 404 });
  }

  const capabilities = intersectCapabilities(body.capabilities, delegableCapabilities(collaborator));
  if (capabilities.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'NO_DELEGABLE_CAPABILITIES' },
      { status: 400 },
    );
  }

  const rawScope = (body.scope ?? {}) as Record<string, unknown>;
  const scope: Record<string, string[]> = {};
  for (const bucket of ['pods', 'rooms', 'projects']) {
    const value = rawScope[bucket];
    if (Array.isArray(value)) {
      scope[bucket] = value.map(String).slice(0, 100);
    }
  }

  const delegation = await requestDelegation({
    agentKeyId,
    collaboratorId: collaborator.id,
    capabilities,
    scope,
    requestedBy: auth.email,
    days: Number(body.days ?? 30),
  });

  return NextResponse.json(
    {
      ok: true,
      delegation,
      note: 'La delegación queda pendiente de aprobación del owner antes de poder usarse.',
    },
    { status: 201 },
  );
}
