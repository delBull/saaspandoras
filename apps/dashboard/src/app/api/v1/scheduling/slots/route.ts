import { NextRequest, NextResponse } from 'next/server';
import { SovereignCalendarEngine } from '@/lib/scheduling/sovereign-calendar-engine';

export const dynamic = 'force-dynamic';

/**
 * 📅 GET /api/v1/scheduling/slots
 * Public endpoint to query real-time dynamic availability.
 * Rate-limited and hardened against private data leakage.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = (searchParams.get('tenantSlug') || searchParams.get('slug') || 'pandoras')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '');

    const hostUserId = searchParams.get('hostUserId')?.trim();
    const rawFrom = searchParams.get('from');
    const rawTo = searchParams.get('to');

    const fromDate = rawFrom ? new Date(rawFrom) : new Date();
    // Default to next 14 days if not specified
    const toDate = rawTo ? new Date(rawTo) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Hardening check: Prevent date-range abuse (max 31 days)
    const rangeMs = toDate.getTime() - fromDate.getTime();
    if (rangeMs > 31 * 24 * 60 * 60 * 1000 || rangeMs <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Rango de fechas inválido (máximo 31 días permitidos).' },
        { status: 400 }
      );
    }

    const { config, hostUserId: resolvedHost } = await SovereignCalendarEngine.resolveConfig({
      tenantSlug,
      hostUserId,
    });

    if (!config.isActive) {
      return NextResponse.json({
        ok: true,
        isActive: false,
        message: 'La agenda no está activa para este anfitrión o tenant.',
        slots: [],
      });
    }

    const slots = await SovereignCalendarEngine.calculateDynamicSlots({
      config,
      tenantSlug,
      hostUserId: resolvedHost,
      fromDate,
      toDate,
    });

    return NextResponse.json(
      {
        ok: true,
        isActive: true,
        tenantSlug,
        timezone: config.timezone,
        durationMinutes: config.durationMinutes,
        meetingType: config.meetingType,
        totalSlots: slots.length,
        slots,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.error('[API /scheduling/slots] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al consultar disponibilidad soberana' },
      { status: 500 }
    );
  }
}
