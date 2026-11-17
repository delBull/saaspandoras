import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { sql } from '@saasfly/db-core';
import { db } from '@saasfly/db';
import { validateAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Gestión de enlaces de demostración (solo lectura) desde administración.
 *
 *  GET    ?organizationId=…   lista enlaces: estado, caducidad y aperturas
 *  POST   { organizationId, label, ttlDays? }  crea y devuelve el enlace UNA vez
 *  DELETE ?id=…               revoca (efecto inmediato)
 *
 * El token nunca se guarda en claro: solo su SHA-256. Por eso el enlace se
 * devuelve una única vez al crearlo.
 */

const MAX_TTL_DAYS = 30;

async function rows<T = Record<string, unknown>>(query: unknown): Promise<T[]> {
  const result = (await db.execute(query as never)) as { rows?: T[] } | T[];
  return Array.isArray(result) ? result : (result.rows ?? []);
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await validateAdminSession(req.headers);
  if (!session) return errorResponse ?? NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const organizationId = new URL(req.url).searchParams.get('organizationId');
  if (!organizationId) {
    return NextResponse.json({ error: 'Falta organizationId' }, { status: 400 });
  }

  const links = await rows(sql`
    select id, label, expires_at, revoked_at, view_count, last_viewed_at, created_by, created_at,
           (revoked_at is null and expires_at > now()) as active
    from demo_links
    where organization_id = ${organizationId}
    order by created_at desc
  `);

  return NextResponse.json({ success: true, organizationId, links });
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await validateAdminSession(req.headers);
  if (!session) return errorResponse ?? NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  let body: { organizationId?: unknown; label?: unknown; ttlDays?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const organizationId = typeof body.organizationId === 'string' ? body.organizationId.trim() : '';
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  const ttlDays = typeof body.ttlDays === 'number' ? body.ttlDays : 7;

  if (!organizationId) return NextResponse.json({ error: 'Falta organizationId' }, { status: 400 });
  if (label.length < 2) return NextResponse.json({ error: 'Falta una etiqueta' }, { status: 422 });
  if (!Number.isInteger(ttlDays) || ttlDays <= 0 || ttlDays > MAX_TTL_DAYS) {
    return NextResponse.json({ error: `ttlDays debe ser 1–${MAX_TTL_DAYS}` }, { status: 422 });
  }

  const token = randomBytes(32).toString('hex');
  const id = `demo-${randomBytes(8).toString('hex')}`;
  const actor =
    (session as { email?: string; wallet?: string }).email ??
    (session as { wallet?: string }).wallet ??
    'admin';

  await db.execute(sql`
    insert into demo_links (id, organization_id, label, token_hash, expires_at, created_by)
    values (${id}, ${organizationId}, ${label}, ${sha256(token)}, now() + (${ttlDays} || ' days')::interval, ${actor})
  `);

  const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  return NextResponse.json(
    {
      success: true,
      id,
      url: `${base.replace(/\/+$/, '')}/demo/${token}`,
      expiresInDays: ttlDays,
      notes: [
        'El enlace se muestra UNA sola vez: no se puede recuperar, solo emitir uno nuevo.',
        'Es de solo lectura y no requiere login.',
      ],
    },
    { status: 201 },
  );
}

export async function DELETE(req: NextRequest) {
  const { session, errorResponse } = await validateAdminSession(req.headers);
  if (!session) return errorResponse ?? NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  const result = (await db.execute(sql`
    update demo_links set revoked_at = now()
    where id = ${id} and revoked_at is null
    returning id
  `)) as { rows?: Array<{ id: string }> } | Array<{ id: string }>;
  const affected = Array.isArray(result) ? result : (result.rows ?? []);

  if (affected.length === 0) {
    return NextResponse.json({ error: 'Enlace inexistente o ya revocado' }, { status: 404 });
  }

  return NextResponse.json({ success: true, id, revokedAt: new Date().toISOString() });
}
