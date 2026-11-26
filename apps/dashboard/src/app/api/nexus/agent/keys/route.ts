import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';
import { issueAgentKey, listAgentKeys, findCollaborator, delegableCapabilities } from '@/lib/nexus/agent-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Claves de agente del colaborador autenticado (ADR-021).
 *
 *   GET  → mis claves (prefijo, estado, expiración) + mis delegaciones
 *   POST → emite una clave nueva. El valor en claro se devuelve UNA vez.
 *
 * Requiere el permiso `developer` (o rol ADMIN/SUPER_ADMIN): sin él, esta API
 * ni siquiera existe para la persona.
 */
async function requireDeveloper(req: Request) {
  const auth = await getNexusAuthContext(req.headers);
  if (!auth.isAuthenticated || !auth.email || !auth.collaboratorId) return null;

  const collaborator = await findCollaborator(auth.collaboratorId);
  if (!collaborator || collaborator.status !== 'ACTIVE') return null;

  const role = String(collaborator.role ?? '').toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const perms = (collaborator.permissions ?? {}) as Record<string, boolean>;
  if (!isAdmin && perms.developer !== true) return null;

  return { auth, collaborator, delegable: delegableCapabilities(collaborator) };
}

export async function GET(req: Request) {
  const ctx = await requireDeveloper(req);
  if (!ctx) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });

  const { keys, delegations } = await listAgentKeys(ctx.collaborator.id);
  return NextResponse.json({ ok: true, keys, delegations, delegable: ctx.delegable });
}

export async function POST(req: Request) {
  const ctx = await requireDeveloper(req);
  if (!ctx) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });

  let body: { label?: unknown; days?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
  }

  const label = String(body.label ?? '').trim() || 'Mi agente';
  const days = Number(body.days ?? 90);

  const issued = await issueAgentKey({
    collaboratorId: ctx.collaborator.id,
    canonicalOrgId: ctx.auth.canonicalOrgId || 'pandoras',
    label,
    createdBy: ctx.auth.email!,
    days,
  });

  if (!issued?.key) {
    return NextResponse.json({ ok: false, error: 'KEY_NOT_CREATED' }, { status: 500 });
  }
  const { key, raw, expiresAt } = issued;

  return NextResponse.json(
    {
      ok: true,
      key: {
        id: key.id,
        label: key.label,
        prefix: key.keyPrefix,
        expiresAt,
      },
      // Única vez que se muestra el secreto.
      secret: raw,
      warning: 'Guarda esta clave ahora: no se vuelve a mostrar.',
    },
    { status: 201 },
  );
}
