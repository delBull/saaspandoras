import { NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '@/lib/security/internal-auth';
import { ArtifactLifecycleService } from '@/lib/content/delivery/artifact-lifecycle';
import { getArtifactRepository } from '@/lib/content/delivery/service-factory';
import { resolveStorageAdapter } from '@/lib/content/storage';
import { StorageNotConfiguredError } from '@/lib/content/storage/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/v1/internal/cron/reconcile
 *
 * Reconciliación programada de almacenamiento (P0.3):
 *  - detecta objetos HUÉRFANOS (blob sin fila)
 *  - detecta `missing_blob` (fila `stored` sin objeto) y marca `missing`
 *  - detecta inconsistencias negocio↔físico
 *
 * Requiere autenticación interna. NO borra nada: solo informa para que la
 * limpieza sea una decisión explícita.
 */
export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req);
  if (authError) return authError;

  try {
    const adapter = resolveStorageAdapter(null);
    const service = new ArtifactLifecycleService({
      repo: getArtifactRepository(),
      storage: adapter,
    });

    // Tope de trabajo por ejecución: la tarea es diaria y debe ser barata en CPU.
    const rawLimit = Number(new URL(req.url).searchParams.get('limit') ?? '100');
    const limit = Number.isInteger(rawLimit) ? Math.min(Math.max(rawLimit, 1), 500) : 100;

    const report = await service.reconcile({ limit });

    const healthy =
      report.missingBlobs.length === 0 &&
      report.inconsistentBusinessState.length === 0 &&
      report.orphanBlobs.length === 0;

    return NextResponse.json({
      success: true,
      healthy,
      ...report,
      notes: [
        'La reconciliación no elimina objetos: solo detecta y marca estados.',
        'orphanDetection=unsupported significa que el proveedor no permite listar; no es "sin huérfanos".',
        'truncated=true significa que quedan objetos por revisar: la siguiente ejecución continúa.',
      ],
    });
  } catch (error: unknown) {
    if (error instanceof StorageNotConfiguredError) {
      return NextResponse.json(
        {
          success: false,
          code: 'STORAGE_NOT_CONFIGURED',
          error: 'El almacenamiento no está configurado: no se puede reconciliar.',
        },
        { status: 503 },
      );
    }
    console.error('[Cron] reconcile failed:', error);
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}
