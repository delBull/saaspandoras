import { NextRequest, NextResponse } from 'next/server';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { listTenantNotifications, markTenantNotificationsRead } from '@/lib/notifications/tenant-notifications';
import { validateAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/v1/hermes/notifications?tenantId=<slug>&limit=20&unread=1
 *
 * Notificaciones in-app del tenant (avisos de trial, aprobaciones, sistema).
 * Autoridad: sesión de portal del propio tenant (o admin de plataforma).
 *
 * POST { tenantId, ids: string[] } → marca como leídas.
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requested = searchParams.get('tenantId') ?? '';
  const limit = Number(searchParams.get('limit') ?? 20);
  const unreadOnly = searchParams.get('unread') === '1';

  if (!requested) {
    return NextResponse.json({ ok: false, error: 'tenantId es requerido' }, { status: 400 });
  }

  // Admin: cualquier tenant. Portal: sólo el propio (mismatch = 403).
  const admin = await validateAdminSession(req.headers);
  if (!admin.session) {
    try {
      const ctx = await resolvePortalContext(requested);
      if (ctx.organization.slug.toLowerCase() !== requested.toLowerCase()) {
        return NextResponse.json({ ok: false, error: 'Tenant no autorizado' }, { status: 403 });
      }
    } catch (error: any) {
      if (error?.code === 'NO_SESSION' || error?.code === 'INVALID_SESSION') {
        return NextResponse.json({ ok: false, error: 'Autenticación requerida' }, { status: 401 });
      }
      return NextResponse.json({ ok: false, error: 'Acceso denegado' }, { status: 403 });
    }
  }

  const notifications = await listTenantNotifications(requested, {
    limit: Number.isFinite(limit) ? limit : 20,
    unreadOnly,
  });

  return NextResponse.json({
    ok: true,
    tenantId: requested.toLowerCase(),
    unread: notifications.filter((n) => !n.readAt).length,
    notifications,
  });
}

export async function POST(req: NextRequest) {
  let body: { tenantId?: unknown; ids?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 });
  }

  const tenantId = typeof body.tenantId === 'string' ? body.tenantId.trim().toLowerCase() : '';
  const ids = Array.isArray(body.ids) ? body.ids.filter((i): i is string => typeof i === 'string') : [];
  if (!tenantId || ids.length === 0) {
    return NextResponse.json({ ok: false, error: 'tenantId e ids son requeridos' }, { status: 400 });
  }

  const admin = await validateAdminSession(req.headers);
  if (!admin.session) {
    try {
      const ctx = await resolvePortalContext(tenantId);
      if (ctx.organization.slug.toLowerCase() !== tenantId) {
        return NextResponse.json({ ok: false, error: 'Tenant no autorizado' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ ok: false, error: 'Acceso denegado' }, { status: 403 });
    }
  }

  const updated = await markTenantNotificationsRead(tenantId, ids);
  return NextResponse.json({ ok: true, updated });
}
