import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/db';
import { projects, channelIdentityBindings } from '@/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { validatePortalSession } from '@/lib/platform/portal-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TELEGRAM_NUMERIC_ID = /^\d{3,20}$/;

async function resolveTenant(slugOrId: string) {
  const projs = await db
    .select({
      id: projects.id,
      organizationId: projects.organizationId,
      title: projects.title,
      slug: projects.slug,
    })
    .from(projects)
    .where(or(eq(projects.slug, slugOrId), eq(projects.organizationId, slugOrId)))
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
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const tenant = await resolveTenant(slug);
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
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    // Solo IDs numéricos: los @usuario NO son resolubles de forma segura
    // server-side y jamás matchearían el sender id numérico de Telegram.
    const telegramId = String(body.telegramId ?? '').trim().replace(/^@/, '');

    if (!TELEGRAM_NUMERIC_ID.test(telegramId)) {
      return NextResponse.json(
        {
          error:
            'Ingresa el ID numérico de Telegram (obténlo con @userinfobot). Los @usuario no son válidos.',
          code: 'INVALID_TELEGRAM_ID',
        },
        { status: 400 }
      );
    }

    const tenant = await resolveTenant(slug);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const denied = await authorizeTenant(request, tenant.id);
    if (denied) return denied;

    // Upsert scoped a ESTE tenant: si el mismo Telegram ya está vinculado aquí se
    // reactiva; si está en otro tenant NO se mueve, se crea un grant independiente.
    const existing = await db
      .select()
      .from(channelIdentityBindings)
      .where(
        and(
          eq(channelIdentityBindings.channel, 'telegram'),
          eq(channelIdentityBindings.externalUserId, telegramId),
          inArray(channelIdentityBindings.identityId, [tenant.organizationId, tenant.slug])
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(channelIdentityBindings)
        .set({
          status: 'ACTIVE',
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(channelIdentityBindings.id, existing[0]!.id));
    } else {
      await db.insert(channelIdentityBindings).values({
        identityId: tenant.organizationId,
        channel: 'telegram',
        externalUserId: telegramId,
        address: telegramId,
        status: 'ACTIVE',
        verifiedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Operador Telegram vinculado con éxito a ${tenant.title}`,
      operator: {
        externalUserId: telegramId,
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
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get('id');
    const externalUserId = searchParams.get('externalUserId');

    if (!operatorId && !externalUserId) {
      return NextResponse.json({ error: 'ID de operador o Telegram ID es requerido' }, { status: 400 });
    }

    const tenant = await resolveTenant(slug);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const denied = await authorizeTenant(request, tenant.id);
    if (denied) return denied;

    // Ambas ramas scoped al tenant: nunca borrar grants de otros tenants.
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
    } else {
      await db
        .delete(channelIdentityBindings)
        .where(
          and(
            eq(channelIdentityBindings.channel, 'telegram'),
            eq(channelIdentityBindings.externalUserId, externalUserId!),
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
