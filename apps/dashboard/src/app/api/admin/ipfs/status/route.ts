import { NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesClaimContracts, hermesKnowledgeRegistry, purchases } from '@/db/schema';
import { sql, isNotNull } from 'drizzle-orm';
import { validateAdminSession } from '@/lib/admin-auth';
import { SovereignIpfsOrchestrator } from '@/lib/pandoras/core/domains/hermes/knowledge/ipfs/orchestrator';

export const runtime = 'nodejs';

/**
 * GET /api/admin/ipfs/status
 * 
 * Read-only Sovereign IPFS Infrastructure Health & Storage Metrics.
 * Fast, decoupled from Hermes Governance Kernel.
 */
export async function GET(request: Request) {
  const { session, errorResponse } = await validateAdminSession(request.headers);
  if (errorResponse) return errorResponse;

  try {
    const orchestrator = new SovereignIpfsOrchestrator();
    const health = await orchestrator.healthCheck();

    // Fast DB aggregate queries
    const [claimRows, knowledgeRows, purchaseRows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(hermesClaimContracts),
      db.select({ count: sql<number>`count(*)::int` }).from(hermesKnowledgeRegistry),
      db.select({ count: sql<number>`count(*)::int` }).from(purchases).where(isNotNull(purchases.agreementHash)),
    ]);

    const claimCount = claimRows[0]?.count || 0;
    const knowledgeCount = knowledgeRows[0]?.count || 0;
    const legalCount = purchaseRows[0]?.count || 0;

    return NextResponse.json({
      success: true,
      health: {
        primary: {
          provider: health.primary.providerType,
          ok: health.primary.ok,
          latencyMs: health.primary.latencyMs,
          endpoint: process.env.PANDORAS_KUBO_RPC_URL ? 'rpc.ipfs.pandoras.finance' : 'mock/local',
          version: health.primary.version || 'v0.32.0',
        },
        backup: health.backup ? {
          provider: health.backup.providerType,
          ok: health.backup.ok,
          latencyMs: health.backup.latencyMs,
          configured: true,
        } : {
          configured: false,
        },
        overallOk: health.overallOk,
      },
      stats: {
        claimContracts: claimCount,
        knowledgePacks: knowledgeCount,
        legalAgreements: legalCount,
        totalSovereignArtifacts: claimCount + knowledgeCount + legalCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to retrieve IPFS status',
    }, { status: 500 });
  }
}
