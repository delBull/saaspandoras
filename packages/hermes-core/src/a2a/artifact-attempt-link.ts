import { and, eq, ne } from '@saasfly/db-core';
import { hermesGenerationAttempts } from '@saasfly/db-core/schema';

/**
 * Cierra el intento de generación asociado a un artefacto creado por Sofía.
 *
 * Por qué existe: `awaitSofiaResult` sondea `hermes_generation_attempts` para
 * saber si la ejecución terminó. El callback `artifact.created` sólo marcaba el
 * `hermes_media_requests` como COMPLETED, así que el sondeo expiraba (30 s),
 * el job quedaba UNKNOWN y la reserva de crédito se congelaba aunque Sofía
 * hubiera generado la imagen de verdad.
 *
 * Invariantes:
 *  - Sólo se cierran intentos del MISMO tenant y del MISMO request.
 *  - No se toca un intento ya COMPLETED (idempotente: el callback puede repetirse).
 *  - No se "resucita" un intento FAILED: se deja como está.
 *
 * @returns número de intentos actualizados.
 */
export async function closeGenerationAttemptForArtifact(params: {
  tenantId: string;
  requestId: string;
  artifactId: string;
  dbClient: any;
}): Promise<number> {
  const { tenantId, requestId, artifactId, dbClient } = params;

  if (!dbClient || !tenantId || !requestId || !artifactId) return 0;

  const updated = await dbClient
    .update(hermesGenerationAttempts)
    .set({
      status: 'COMPLETED',
      artifactId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(hermesGenerationAttempts.tenantId, tenantId),
        eq(hermesGenerationAttempts.requestId, requestId),
        ne(hermesGenerationAttempts.status, 'COMPLETED'),
        ne(hermesGenerationAttempts.status, 'FAILED')
      )
    )
    .returning({ id: hermesGenerationAttempts.id });

  return Array.isArray(updated) ? updated.length : 0;
}
