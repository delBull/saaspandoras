'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db';
import { sql } from "@saasfly/db-core";

export async function runAdminOperation(taskName: string) {
  const auth = await getNexusAuthContext();
  if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN' && auth.role !== 'ADMIN_OPERATIONS')) {
    return { success: false, error: 'Sin permisos de operaciones' };
  }

  try {
    if (taskName === 'cache_flush') {
      revalidatePath('/', 'layout');
      revalidateTag('public_projects');
      return { success: true, message: 'Caché global purgado y tags invalidadas.' };
    }
    
    if (taskName === 'pooler_check') {
      const start = Date.now();
      await db.execute(sql`SELECT 1`);
      const latency = Date.now() - start;
      return { success: true, message: `Conexión exitosa a Neon. Latencia: ${latency}ms` };
    }

    if (taskName === 'runpod_ping') {
      // Production Truth: ERROR ANTERIOR simulaba respuesta con setTimeout y afirmaba "100%".
      // Real call to RunPod /health; without config the response is honest FAILOUT.
      const apiKey = process.env.RUNPOD_API_KEY;
      const endpointId = process.env.RUNPOD_ENDPOINT_ID;
      if (!apiKey || !endpointId) {
        return { success: false, error: 'RUNPOD not configured (RUNPOD_API_KEY / POSTENDPOINT_ID missing)' };
      }
      try {
        const start = Date.now();
        const res = await fetch(`https://api.runpod.ai/v2/${endpointId}/health`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(8000),
        });
        const latency = Date.now() - start;
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return { success: false, error: `RunPod HTTP ${res.status} (${latency}ms)` };
        return { success: true, message: `RunPod OK (${latency}ms) — status: ${body?.status || 'online'}` };
      } catch (e: any) {
        return { success: false, error: `RunPod ping falló: ${e?.message}` };
      }
    }

    return { success: false, error: 'Operación desconocida' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
