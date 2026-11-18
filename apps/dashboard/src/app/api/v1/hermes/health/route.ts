import { NextResponse } from 'next/server';
import { db, sql } from '@saasfly/db';
import { hermesCreditDeposits, projects } from '@saasfly/db/schema';
import { eq, sql as drizzleSql } from '@saasfly/db-core';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/v1/hermes/health
 *
 * Estado operativo real (sin secretos ni hostnames). Sirve para:
 *  - saber si el cerebro (DB) responde,
 *  - verificar que treasury/Discord/RunPod/pinning están configurados,
 *  - detectar si Sofía está alcanzable (pre-ACK del pipeline de media),
 *  - ver depósitos pendientes de aprobación.
 *
 * No inventa estados: si no puede medir, responde UNKNOWN/DOWN explícito.
 */

interface ComponentStatus {
  status: 'UP' | 'DOWN' | 'UNKNOWN' | 'CONFIGURED' | 'NOT_CONFIGURED';
  latencyMs?: number;
  httpStatus?: number;
  detail?: string;
}

const CACHE_TTL_MS = 15_000;
let cached: { at: number; payload: any } | null = null;

async function checkDatabase(): Promise<ComponentStatus> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { status: 'UP', latencyMs: Date.now() - start };
  } catch (error: unknown) {
    return {
      status: 'DOWN',
      latencyMs: Date.now() - start,
      detail: process.env.NODE_ENV === 'production' ? 'query_failed' : String(error),
    };
  }
}

async function checkSofia(): Promise<ComponentStatus> {
  const endpoint = process.env.SOFIA_BRIDGE_WEBHOOK_URL?.trim();
  if (!endpoint) return { status: 'NOT_CONFIGURED' };

  const start = Date.now();
  try {
    // Cualquier respuesta HTTP (incluido 401) significa que el bridge está vivo.
    const res = await fetch(endpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(4000),
      headers: { accept: 'application/json' },
    });
    return { status: 'UP', httpStatus: res.status, latencyMs: Date.now() - start };
  } catch {
    return {
      status: 'DOWN',
      latencyMs: Date.now() - start,
      detail: 'unreachable_or_timeout',
    };
  }
}

async function countByoTenants(): Promise<ComponentStatus & { byoTenants?: number }> {
  try {
    const [row] = await db
      .select({ total: drizzleSql<number>`count(*)` })
      .from(projects)
      .where(drizzleSql`${projects.tenantRuntimeConfig}->'ipfsPinning'->>'mode' = 'byo'`);
    return { status: 'UP', byoTenants: Number(row?.total ?? 0) };
  } catch {
    return { status: 'UNKNOWN', detail: 'query_failed' };
  }
}

async function countPendingDeposits(): Promise<ComponentStatus & { pending?: number }> {
  try {
    const [row] = await db
      .select({ total: drizzleSql<number>`count(*)` })
      .from(hermesCreditDeposits)
      .where(eq(hermesCreditDeposits.status, 'pending'));
    return { status: 'UP', pending: Number(row?.total ?? 0) };
  } catch {
    return { status: 'UNKNOWN', detail: 'query_failed' };
  }
}

export async function GET() {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ ...cached.payload, cached: true });
  }

  const [database, sofia, byo, pending] = await Promise.all([
    checkDatabase(),
    checkSofia(),
    countByoTenants(),
    countPendingDeposits(),
  ]);

  const treasuryWallet =
    process.env.PANDORAS_TREASURY_WALLET ||
    process.env.NEXT_PUBLIC_PANDORAS_TREASURY_WALLET ||
    process.env.PANDORAS_ADMIN_WALLET ||
    '';

  const payload = {
    ok: database.status === 'UP',
    checkedAt: new Date().toISOString(),
    components: {
      database,
      treasury: {
        status: treasuryWallet.trim() ? 'CONFIGURED' : 'NOT_CONFIGURED',
      },
      discordAlerts: {
        status: process.env.DISCORD_WEBHOOK_PANDORAS_ALERTS?.trim()
          ? 'CONFIGURED'
          : 'NOT_CONFIGURED',
      },
      sofia,
      pinning: {
        managed: process.env.IPFS_PIN_API_URL?.trim() ? 'CONFIGURED' : 'NOT_CONFIGURED',
        byoTenants: byo.byoTenants ?? null,
      },
      computeRunpod: {
        status: process.env.RUNPOD_API_KEY?.trim() ? 'CONFIGURED' : 'NOT_CONFIGURED',
      },
      deposits: {
        pending: pending.pending ?? null,
        approvalRequired: true,
      },
    },
  };

  cached = { at: Date.now(), payload };

  return NextResponse.json(payload, { status: database.status === 'UP' ? 200 : 503 });
}
