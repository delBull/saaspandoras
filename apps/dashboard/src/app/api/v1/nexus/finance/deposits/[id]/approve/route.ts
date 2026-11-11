import { NextResponse } from 'next/server';

/**
 * ⛔ RETIRADO — /api/v1/nexus/finance/deposits/[id]/approve
 *
 * Esta ruta (legacy) aprobaba un `purchases.id` **enviado por el cliente** con
 * sólo `finance.manage`, sin verificar pertenencia ni estado, y su propio
 * comentario admitía que la verificación era simulada. No toca créditos de
 * Hermes y no tiene llamadores en el repo.
 *
 * Se deja fail-closed en lugar de borrarla, para que cualquier integración
 * antigua falle de forma explícita y no mute datos.
 *
 * Camino correcto para depósitos de Hermes:
 *   POST /api/v1/hermes/billing/deposit      (verificación on-chain, estado `pending`)
 *   /admin/finance/deposits                  (aprobación humana)
 */
export async function POST(
  _request: Request,
  _context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    {
      error:
        'Endpoint retirado. No muta datos. Usa /api/v1/hermes/billing/deposit y la bandeja /admin/finance/deposits.',
      code: 'ENDPOINT_RETIRED',
    },
    { status: 410 }
  );
}
