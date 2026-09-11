import { NextRequest, NextResponse } from 'next/server';
import { SovereignCalendarEngine } from '@/lib/scheduling/sovereign-calendar-engine';

export const dynamic = 'force-dynamic';

/**
 * 🔒 POST /api/v1/scheduling/hold
 * Atomically acquires a 15-minute hold on a requested slot.
 * Returns 409 Conflict if another user is holding or booked the slot.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      hostUserId,
      tenantSlug,
      startTime,
      endTime,
      heldBy,
      holdMinutes = 15,
      idempotencyKey,
    } = body;

    if (!hostUserId || !startTime || !endTime || !heldBy) {
      return NextResponse.json(
        { ok: false, error: 'Parámetros obligatorios faltantes (hostUserId, startTime, endTime, heldBy).' },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json(
        { ok: false, error: 'Fechas de inicio y fin inválidas.' },
        { status: 400 }
      );
    }

    const holdResult = await SovereignCalendarEngine.acquireAtomicHold({
      hostUserId: String(hostUserId).trim(),
      tenantSlug: tenantSlug ? String(tenantSlug).trim() : undefined,
      startTime: start,
      endTime: end,
      heldBy: String(heldBy).trim(),
      holdMinutes: Number(holdMinutes) || 15,
      idempotencyKey: idempotencyKey ? String(idempotencyKey).trim() : undefined,
    });

    if (!holdResult.success) {
      if (holdResult.error === 'CONFLICT') {
        return NextResponse.json(
          {
            ok: false,
            error: 'CONFLICT',
            message: holdResult.message || 'El horario ya fue apartado por otra persona.',
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          ok: false,
          error: holdResult.error || 'ERROR',
          message: holdResult.message || 'No fue posible bloquear el horario.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      holdId: holdResult.holdId,
      expiresAt: holdResult.expiresAt,
      message: `Horario apartado temporalmente por ${holdMinutes} minutos.`,
    });
  } catch (error: any) {
    console.error('[API /scheduling/hold POST] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al procesar el hold atómico' },
      { status: 500 }
    );
  }
}
