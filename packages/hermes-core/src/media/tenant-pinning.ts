import { db } from '@saasfly/db-core';
import { projects } from '@saasfly/db-core/schema';
import { eq } from '@saasfly/db-core';
import { openPinningSecret } from './pinning-secret';
import type { PinningConfig } from './ipfs-pinning.service';

/**
 * Resuelve la configuración de pinning de un tenant:
 *
 *  1. BYO — `projects.tenantRuntimeConfig.ipfsPinning` (url + token cifrado).
 *  2. Gestionado — `IPFS_PIN_API_URL` / `IPFS_PIN_API_TOKEN` del entorno.
 *
 * `null` ⇒ no hay almacenamiento real: el artefacto queda UNPINNED (sin CID).
 */
export async function resolveTenantPinningConfig(tenantId: string): Promise<PinningConfig | null> {
  const normalized = (tenantId ?? '').toLowerCase().trim();

  // 1) Configuración propia del tenant
  try {
    if (db && normalized) {
      const [row] = await db
        .select({ config: projects.tenantRuntimeConfig })
        .from(projects)
        .where(eq(projects.slug, normalized))
        .limit(1);

      const raw = row?.config;
      if (raw !== null && typeof raw === 'object') {
        const ipfs = (raw as Record<string, unknown>).ipfsPinning;
        if (ipfs !== null && typeof ipfs === 'object') {
          const config = ipfs as Record<string, unknown>;
          const url = typeof config.pinApiUrl === 'string' ? config.pinApiUrl.trim() : '';
          const mode = config.mode === 'byo' ? 'byo' : config.mode === 'managed' ? 'managed' : null;
          if (mode === 'byo' && url.startsWith('https://')) {
            let token: string | undefined;
            const sealed = config.pinApiTokenSealed;
            if (typeof sealed === 'string' && sealed.length > 0) {
              try {
                token = openPinningSecret(sealed);
              } catch (error: unknown) {
                console.error('[TenantPinning] Could not open sealed pin token:', error);
              }
            }
            return { mode: 'byo', pinApiUrl: url, pinApiToken: token };
          }
        }
      }
    }
  } catch (error: unknown) {
    // Un fallo leyendo la config no debe romper la generación: se cae al gestionado.
    console.warn('[TenantPinning] Tenant pinning config lookup failed:', error);
  }

  // 2) Almacenamiento gestionado por la plataforma
  const url = process.env.IPFS_PIN_API_URL?.trim();
  if (!url) return null;
  return {
    mode: 'managed',
    pinApiUrl: url,
    pinApiToken: process.env.IPFS_PIN_API_TOKEN?.trim() || undefined,
  };
}
