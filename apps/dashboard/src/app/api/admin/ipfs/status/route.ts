import { NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesClaimContracts, hermesKnowledgeRegistry, purchases, hermesSecurityEvents } from '@/db/schema';
import { sql, isNotNull, or, eq, desc } from 'drizzle-orm';
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

    // Fast DB aggregate queries with durability breakdown & security incidents
    const [
      claimTotalRows, 
      claimDurableRows,
      knowledgeTotalRows, 
      knowledgeDurableRows,
      legalTotalRows,
      legalDurableRows,
      mismatchCountRows,
      fetchFailureCountRows,
      recentSecurityEvents,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(hermesClaimContracts),
      db.select({ count: sql<number>`count(*)::int` }).from(hermesClaimContracts).where(isNotNull(hermesClaimContracts.backupIpfsCid)),
      db.select({ count: sql<number>`count(*)::int` }).from(hermesKnowledgeRegistry),
      db.select({ count: sql<number>`count(*)::int` }).from(hermesKnowledgeRegistry).where(isNotNull(hermesKnowledgeRegistry.backupIpfsCid)),
      db.select({ count: sql<number>`count(*)::int` }).from(purchases).where(isNotNull(purchases.agreementHash)),
      db.select({ count: sql<number>`count(*)::int` }).from(purchases).where(sql`metadata->>'replicationStatus' = 'DURABLE'`),
      db.select({ count: sql<number>`count(*)::int` }).from(hermesSecurityEvents).where(sql`metadata->>'reason' = 'KNOWLEDGE_INTEGRITY_MISMATCH'`),
      db.select({ count: sql<number>`count(*)::int` }).from(hermesSecurityEvents).where(sql`metadata->>'reason' = 'IPFS_FETCH_FAILED'`),
      db.select({
        id: hermesSecurityEvents.id,
        organizationId: hermesSecurityEvents.organizationId,
        artifactId: hermesSecurityEvents.artifactId,
        severity: hermesSecurityEvents.severity,
        reason: sql<string>`metadata->>'reason'`,
        error: sql<string>`metadata->>'error'`,
        expectedHash: sql<string>`metadata->>'expectedHash'`,
        receivedHash: sql<string>`metadata->>'receivedHash'`,
        createdAt: hermesSecurityEvents.createdAt,
      })
      .from(hermesSecurityEvents)
      .where(or(
        eq(hermesSecurityEvents.eventType, 'RESOURCE_MISMATCH_BLOCKED'),
        sql`metadata->>'reason' IN ('IPFS_FETCH_FAILED', 'KNOWLEDGE_INTEGRITY_MISMATCH')`
      ))
      .orderBy(desc(hermesSecurityEvents.createdAt))
      .limit(5),
    ]);

    const claimCount = claimTotalRows[0]?.count || 0;
    const claimDurable = claimDurableRows[0]?.count || 0;
    const knowledgeCount = knowledgeTotalRows[0]?.count || 0;
    const knowledgeDurable = knowledgeDurableRows[0]?.count || 0;
    const legalCount = legalTotalRows[0]?.count || 0;
    const legalDurable = legalDurableRows[0]?.count || 0;

    const totalArtifacts = claimCount + knowledgeCount + legalCount;
    const durableArtifacts = claimDurable + knowledgeDurable + legalDurable;
    const replicatingOrDegraded = totalArtifacts - durableArtifacts;

    const integrityMismatches = mismatchCountRows[0]?.count || 0;
    const fetchFailures = fetchFailureCountRows[0]?.count || 0;

    return NextResponse.json({
      success: true,
      health: {
        primary: {
          provider: health.primary.providerType,
          ok: health.primary.ok,
          latencyMs: health.primary.latencyMs,
          endpoint: process.env.PANDORAS_KUBO_RPC_URL ? 'rpc.ipfs.pandoras.finance' : 'mock/local',
          version: health.primary.version || 'unknown',
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
        totalSovereignArtifacts: totalArtifacts,
        durability: {
          durable: durableArtifacts,
          degradedOrSingle: replicatingOrDegraded,
        },
      },
      security: {
        integrityMismatches,
        fetchFailures,
        totalSecurityEvents: integrityMismatches + fetchFailures,
        recentIncidents: recentSecurityEvents,
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
