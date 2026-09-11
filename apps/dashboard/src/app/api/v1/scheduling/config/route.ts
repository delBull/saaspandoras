import { NextRequest, NextResponse } from 'next/server';
import { requireNexusAdmin } from '@/lib/nexus/collaborators-service';
import { getAuth, isAdmin } from '@/lib/auth';
import { SovereignCalendarEngine, SovereignCalendarConfig } from '@/lib/scheduling/sovereign-calendar-engine';

export const dynamic = 'force-dynamic';

/**
 * 📅 GET /api/v1/scheduling/config?tenantSlug=...
 * Retrieves the effective calendar configuration.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = (searchParams.get('tenantSlug') || searchParams.get('slug') || 'pandoras')
      .trim()
      .toLowerCase();

    const hostUserId = searchParams.get('hostUserId')?.trim();

    const resolved = await SovereignCalendarEngine.resolveConfig({
      tenantSlug,
      hostUserId,
    });

    return NextResponse.json({
      ok: true,
      config: resolved.config,
      hostUserId: resolved.hostUserId,
      tenantSlug: resolved.tenantSlug,
    });
  } catch (error: any) {
    console.error('[API /scheduling/config GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al consultar configuración de agenda' },
      { status: 500 }
    );
  }
}

/**
 * 📅 POST /api/v1/scheduling/config
 * Updates the sovereign calendar configuration for a tenant/host.
 * Protected by capability verification (Admin or Nexus Collaborator with calendar authority).
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authorization Gate
    const isNexusAdmin = await requireNexusAdmin(req);
    let isPlatformAdmin = false;

    if (!isNexusAdmin) {
      try {
        const { session } = await getAuth();
        if (session?.address && (await isAdmin(session.address))) {
          isPlatformAdmin = true;
        }
      } catch {}
    }

    if (!isNexusAdmin && !isPlatformAdmin) {
      return NextResponse.json(
        { ok: false, error: 'No autorizado para configurar la Agenda Soberana' },
        { status: 403 }
      );
    }

    // 2. Validate payload
    const body = await req.json().catch(() => ({}));
    const tenantSlug = String(body.tenantSlug || body.slug || 'pandoras').trim().toLowerCase();
    const config: SovereignCalendarConfig = body.config;

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'Objeto de configuración inválido' },
        { status: 400 }
      );
    }

    // 3. Save atomically in project extraConfig / host
    const saveRes = await SovereignCalendarEngine.saveConfig({
      tenantSlug,
      config,
    });

    if (!saveRes.success) {
      return NextResponse.json(
        { ok: false, error: saveRes.error || 'Error al persistir la configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      tenantSlug,
      config,
      message: 'Configuración de Agenda Soberana sincronizada correctamente en todas las verticales.',
    });
  } catch (error: any) {
    console.error('[API /scheduling/config POST] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al actualizar configuración de agenda' },
      { status: 500 }
    );
  }
}
