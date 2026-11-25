import { NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { tenantNotificationChannels } from '@saasfly/db/schema';
import { and, eq } from '@saasfly/db-core';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Canales de aviso del tenant (ADR-020 §2.5).
 *
 * Un tenant conecta aquí su webhook de Discord. La organización **sale de la
 * sesión**, nunca del body: pedir el canal de otro tenant devuelve 403.
 *
 *   PUT    { kind: 'leads' | 'approvals' | 'alerts', url }   → alta/actualización
 *   DELETE ?kind=leads                                        → desactiva (no borra)
 *
 * Si el tenant no configura canal, los avisos quedan sólo in-app. No existe
 * fallback a canales de la plataforma: es lo que evita mezclar tenants.
 */
const DISCORD_WEBHOOK = /^https:\/\/(?:discord|discordapp)\.com\/api\/webhooks\/\d{10,25}\/[\w-]{20,}$/;
const KINDS = new Set(['leads', 'approvals', 'alerts']);

function mask(url: string): string {
  return url.replace(/\/[^/]+$/, '/…');
}

async function authorize(tenantId: string) {
  const ctx = await resolvePortalContext(tenantId);
  if (ctx.tenant.role !== 'owner' && ctx.tenant.role !== 'admin') {
    return { ok: false as const, status: 403, error: 'Sólo el owner de la organización puede configurar canales.' };
  }
  // La organización autorizada es la de la sesión, no la del path.
  return { ok: true as const, orgId: ctx.organization.slug };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;

  try {
    const auth = await authorize(tenantId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const rows = await db
      .select({
        kind: tenantNotificationChannels.kind,
        target: tenantNotificationChannels.target,
        enabled: tenantNotificationChannels.enabled,
        updatedAt: tenantNotificationChannels.updatedAt,
      })
      .from(tenantNotificationChannels)
      .where(eq(tenantNotificationChannels.canonicalOrgId, auth.orgId));

    return NextResponse.json({
      ok: true,
      organization: auth.orgId,
      channels: rows.map((row) => ({
        kind: row.kind,
        target: row.target ? mask(row.target) : null,
        enabled: row.enabled,
        updatedAt: row.updatedAt,
      })),
    });
  } catch (err: any) {
    const code = err?.code;
    if (code === 'NO_SESSION' || code === 'INVALID_SESSION') {
      return NextResponse.json({ error: 'Autenticación requerida' }, { status: 401 });
    }
    return NextResponse.json({ error: 'No se pudieron leer los canales' }, { status: 403 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;

  let body: { kind?: unknown; url?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const kind = typeof body.kind === 'string' ? body.kind.trim() : 'leads';
  const url = typeof body.url === 'string' ? body.url.trim() : '';

  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: `kind debe ser uno de: ${[...KINDS].join(', ')}` }, { status: 400 });
  }
  if (!DISCORD_WEBHOOK.test(url)) {
    return NextResponse.json({ error: 'La URL no es un webhook de Discord válido.' }, { status: 400 });
  }

  try {
    const auth = await authorize(tenantId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const [row] = await db
      .insert(tenantNotificationChannels)
      .values({
        id: `tnc_${auth.orgId}_${kind}_discord_webhook`.slice(0, 64),
        canonicalOrgId: auth.orgId,
        kind,
        channel: 'discord_webhook',
        target: url,
        enabled: true,
        createdBy: `portal:${ctxActor(tenantId)}`,
      })
      .onConflictDoUpdate({
        target: [
          tenantNotificationChannels.canonicalOrgId,
          tenantNotificationChannels.kind,
          tenantNotificationChannels.channel,
        ],
        set: { target: url, enabled: true, updatedAt: new Date() },
      })
      .returning({ kind: tenantNotificationChannels.kind, target: tenantNotificationChannels.target });

    return NextResponse.json({
      ok: true,
      organization: auth.orgId,
      kind: row?.kind,
      channel: 'discord_webhook',
      target: row?.target ? mask(row.target) : null,
    });
  } catch (err: any) {
    const code = err?.code;
    if (code === 'NO_SESSION' || code === 'INVALID_SESSION') {
      return NextResponse.json({ error: 'Autenticación requerida' }, { status: 401 });
    }
    if (code === 'ORGANIZATION_ACCESS_DENIED') {
      return NextResponse.json({ error: 'Sin acceso a esta organización' }, { status: 403 });
    }
    console.error('[NotificationChannels] PUT error:', err);
    return NextResponse.json({ error: 'No se pudo guardar el canal' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  const kind = new URL(request.url).searchParams.get('kind')?.trim() ?? 'leads';

  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: `kind debe ser uno de: ${[...KINDS].join(', ')}` }, { status: 400 });
  }

  try {
    const auth = await authorize(tenantId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const updated = await db
      .update(tenantNotificationChannels)
      .set({ enabled: false, updatedAt: new Date() })
      .where(and(
        eq(tenantNotificationChannels.canonicalOrgId, auth.orgId),
        eq(tenantNotificationChannels.kind, kind),
        eq(tenantNotificationChannels.channel, 'discord_webhook'),
      ))
      .returning({ id: tenantNotificationChannels.id });

    return NextResponse.json({ ok: true, disabled: updated.length });
  } catch (err: any) {
    const code = err?.code;
    if (code === 'NO_SESSION' || code === 'INVALID_SESSION') {
      return NextResponse.json({ error: 'Autenticación requerida' }, { status: 401 });
    }
    return NextResponse.json({ error: 'No se pudo desactivar el canal' }, { status: 403 });
  }
}

/** Marca de quién lo configuró, sin guardar datos personales extra. */
function ctxActor(tenantId: string): string {
  return tenantId.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);
}
