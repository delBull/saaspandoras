import { NextResponse } from 'next/server';
import { verifyAndRepinVault } from '@saasfly/hermes-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * `GET /api/cron/ipfs-repin`
 *
 * Seguro del vault: verifica que cada artefacto ACTIVE esté pinneado en el nodo
 * y, si falta (reinicio sin volumen, GC, desastre), lo vuelve a fijar desde el
 * sobre cifrado guardado en Postgres. Mismos bytes ⇒ mismo CID, así que el
 * registro no cambia.
 *
 * Protegido con `Authorization: Bearer CRON_SECRET`.
 * Parámetros: `?tenant=<slug>&limit=<n>&dryRun=1`
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const tenantId = url.searchParams.get('tenant') || undefined;
  const limit = Number.parseInt(url.searchParams.get('limit') ?? '40', 10) || 40;
  const dryRun = url.searchParams.get('dryRun') === '1';

  try {
    const result = await verifyAndRepinVault({ tenantId, limit, dryRun });
    return NextResponse.json({ success: result.failed === 0, dryRun, ...result });
  } catch (err: any) {
    console.error('[cron/ipfs-repin] failed:', err?.message || err);
    return NextResponse.json({ success: false, error: err?.message || 'REPIN_FAILED' }, { status: 500 });
  }
}
