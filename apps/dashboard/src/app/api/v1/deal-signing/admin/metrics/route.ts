import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dealEnvelopes } from '@/db/schema';
import { SovereignAuthService } from '@/lib/deal-signing/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/deal-signing/admin/metrics
 * Returns global performance and adoption metrics for Sovereign Sign
 */
export async function GET(req: NextRequest) {
  try {
    const session = await SovereignAuthService.getSession(req);

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Acceso restringido a administradores de Sovereign Sign.' },
        { status: 403 }
      );
    }

    const allEnvelopes = await db.select().from(dealEnvelopes);

    const totalEnvelopes = allEnvelopes.length;
    let completedCount = 0;
    let pendingCount = 0;
    let draftCount = 0;
    let anchoredCount = 0;

    const uniqueSignersSet = new Set<string>();
    const uniqueOrgsSet = new Set<string>();

    for (const env of allEnvelopes) {
      if (env.status === 'COMPLETED') completedCount++;
      else if (env.status === 'PENDING_SIGNATURES') pendingCount++;
      else if (env.status === 'DRAFT') draftCount++;

      if (env.blockchainEvidence && Object.keys(env.blockchainEvidence).length > 0) {
        anchoredCount++;
      }

      if (env.organizationId) uniqueOrgsSet.add(env.organizationId);

      const signers = (env.signers as any[]) || [];
      for (const s of signers) {
        if (s.email) uniqueSignersSet.add(s.email.toLowerCase().trim());
      }
    }

    const anchorRatePercent = totalEnvelopes > 0 
      ? Math.round((anchoredCount / (completedCount || totalEnvelopes)) * 100) 
      : 0;

    return NextResponse.json({
      success: true,
      metrics: {
        totalEnvelopes,
        completedCount,
        pendingCount,
        draftCount,
        anchoredCount,
        anchorRatePercent,
        uniqueSignersCount: uniqueSignersSet.size,
        uniqueOrgsCount: uniqueOrgsSet.size,
      },
    });

  } catch (error: any) {
    console.error('[DealSigning Admin API] Error getting metrics:', error);
    return NextResponse.json(
      { success: false, error: 'METRICS_FAILED', message: error?.message || 'Error al obtener métricas' },
      { status: 500 }
    );
  }
}
