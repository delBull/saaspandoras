import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/db';
import { projects, channelIdentityBindings } from '@/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { validatePortalSession } from '@/lib/platform/portal-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TELEGRAM_NUMERIC_ID = /^\d{3,20}$/;

async function resolveTenant(slugOrId: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);
  const projs = await db
    .select({
      id: projects.id,
      organizationId: projects.organizationId,
      title: projects.title,
      slug: projects.slug,
    })
    .from(projects)
    .where(or(
      eq(projects.slug, slugOrId),
      ...(isUuid ? [eq(projects.organizationId, slugOrId)] : [])
    ))
    .limit(1);

  return projs[0] || null;
}

/**
 * Auth: Hermes Portal session (cookie `pandoras_portal_session`, set by magic-link
 * flow) with Bearer ps_ fallback. The session must belong to THIS tenant.
 * Returns null when authorized, else a 401/403 response.
 */
async function authorizeTenant(request: NextRequest, tenantId: number): Promise<NextResponse | null> {
  const bearer = request.headers.get('authorization');
  let token =
    bearer?.startsWith('Bearer ps_') && bearer.slice(7).startsWith('ps_')
      ? bearer.slice(7)
      : null;
  if (!token) {
    token = request.cookies.get('pandoras_portal_session')?.value || null;
  }
  if (!token || !token.startsWith('ps_')) {
    return NextResponse.json(
      { error: 'Portal session requerida', code: 'NO_PORTAL_SESSION' },
      { status: 401 }
    );
  }

  const session = await validatePortalSession(token);
  if (!session) {
    return NextResponse.json(
      { error: 'Sesión de portal inválida o expirada', code: 'INVALID_PORTAL_SESSION' },
      { status: 401 }
    );
  }
  if (session.projectId !== tenantId) {
    return NextResponse.json(
      { error: 'Acceso denegado a este tenant', code: 'TENANT_ACCESS_DENIED' },
      { status: 403 }
    );
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const tenant = await resolveTenant(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const denied = await authorizeTenant(request, tenant.id);
    if (denied) return denied;

    const operators = await db
      .select({
        id: channelIdentityBindings.id,
        externalUserId: channelIdentityBindings.externalUserId,
        address: channelIdentityBindings.address,
        status: channelIdentityBindings.status,
        createdAt: channelIdentityBindings.createdAt,
      })
      .from(channelIdentityBindings)
      .where(
        and(
          eq(channelIdentityBindings.channel, 'telegram'),
          inArray(channelIdentityBindings.identityId, [tenant.organizationId, tenant.slug]),
          eq(channelIdentityBindings.status, 'ACTIVE')
        )
      )
      .limit(50);

    return NextResponse.json({
      success: true,
      tenant: {
        organizationId: tenant.organizationId,
        slug: tenant.slug,
        title: tenant.title,
      },
      operators,
    });
  } catch (error: any) {
    console.error('[API:HermesOperators:GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const tenant = await resolveTenant(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const denied = await authorizeTenant(request, tenant.id);
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const rawTelegramId = String(body.telegramId || '').trim();
    const rawUsername = body.username ? String(body.username).trim().replace(/^@/, '') : undefined;

    if (!rawTelegramId) {
      return NextResponse.json(
        { error: 'Telegram User ID numérico es requerido para despacho confiable' },
        { status: 400 }
      );
    }

    const numericId = rawTelegramId.replace(/^@/, '');
    if (!TELEGRAM_NUMERIC_ID.test(numericId)) {
      return NextResponse.json(
        {
          error:
            'Telegram ID debe ser numérico (ej. 123456789). La API de Telegram Bot requiere IDs numéricos para enviar mensajes y configurar el botón azul de la Mini App.',
          code: 'INVALID_TELEGRAM_USER_ID',
        },
        { status: 400 }
      );
    }

    const address = rawUsername
      ? `@${rawUsername}`
      : rawTelegramId.startsWith('@')
      ? rawTelegramId
      : `@user_${numericId}`;

    const existing = await db
      .select()
      .from(channelIdentityBindings)
      .where(
        and(
          eq(channelIdentityBindings.channel, 'telegram'),
          eq(channelIdentityBindings.externalUserId, numericId),
          inArray(channelIdentityBindings.identityId, [tenant.organizationId, tenant.slug])
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(channelIdentityBindings)
        .set({
          identityId: tenant.organizationId,
          address,
          status: 'ACTIVE',
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(channelIdentityBindings.id, existing[0]!.id));
    } else {
      await db.insert(channelIdentityBindings).values({
        identityId: tenant.organizationId,
        channel: 'telegram',
        externalUserId: numericId,
        address,
        status: 'ACTIVE',
        verifiedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Operador Telegram vinculado con éxito a ${tenant.title}`,
      operator: {
        externalUserId: numericId,
        address,
        organizationId: tenant.organizationId,
      },
    });
  } catch (error: any) {
    console.error('[API:HermesOperators:POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const tenant = await resolveTenant(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const denied = await authorizeTenant(request, tenant.id);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get('id');
    const externalUserId = searchParams.get('externalUserId');

    if (!operatorId && !externalUserId) {
      return NextResponse.json(
        { error: 'ID de operador o Telegram ID es requerido' },
        { status: 400 }
      );
    }

    if (operatorId) {
      await db
        .delete(channelIdentityBindings)
        .where(
          and(
            eq(channelIdentityBindings.id, operatorId),
            eq(channelIdentityBindings.channel, 'telegram'),
            inArray(channelIdentityBindings.identityId, [tenant.organizationId, tenant.slug])
          )
        );
    } else if (externalUserId) {
      await db
        .delete(channelIdentityBindings)
        .where(
          and(
            eq(channelIdentityBindings.externalUserId, externalUserId),
            eq(channelIdentityBindings.channel, 'telegram'),
            inArray(channelIdentityBindings.identityId, [tenant.organizationId, tenant.slug])
          )
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Operador desvinculado correctamente',
    });
  } catch (error: any) {
    console.error('[API:HermesOperators:DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
