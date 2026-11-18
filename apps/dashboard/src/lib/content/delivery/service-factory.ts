/**
 * Fábrica de servicios de entrega (P0.3).
 *
 * `P0_3_DELIVERY_ENABLED` es un interruptor de SERVIDOR (no de cliente).
 * Por defecto está DESHABILITADO: mientras la migración 0095 no esté aplicada y
 * la entrega no se haya verificado, todas las rutas responden 503 de forma
 * explícita (nunca éxito simulado).
 */

import { DrizzleArtifactRepository } from './drizzle-artifact-repository';

export const DELIVERY_ENABLED_ENV = 'P0_3_DELIVERY_ENABLED';

export function isDeliveryEnabled(): boolean {
  return process.env[DELIVERY_ENABLED_ENV] === 'true';
}

export function getArtifactRepository(): DrizzleArtifactRepository {
  return new DrizzleArtifactRepository();
}

/** Código y mensaje únicos para el 503 de capacidad deshabilitada. */
export const DELIVERY_DISABLED_RESPONSE = {
  code: 'DELIVERY_NOT_ENABLED',
  error:
    'La entrega de contenido (P0.3) no está habilitada en este entorno: falta aplicar la migración 0095 y activar P0_3_DELIVERY_ENABLED.',
} as const;
