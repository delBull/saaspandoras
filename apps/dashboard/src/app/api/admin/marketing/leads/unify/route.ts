import { NextRequest, NextResponse } from 'next/server';
import { AttributionService } from '@/lib/marketing/attribution-service';
import { getAuth, isAdmin } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/marketing/leads/unify
 * 
 * Body: { 
 *   projectId: number,
 *   leadIds: string[],
 *   attributionMethod?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { session } = await getAuth(await headers());
    const userIsAdmin = await isAdmin(session?.address ?? session?.userId);

    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, leadIds, attributionMethod = 'domain_match' } = body;

    if (!projectId || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'projectId and leadIds are required' }, { status: 400 });
    }

    const results = [];
    for (const leadId of leadIds) {
      // For each lead, we'd ideally re-calculate or verify the score
      // For simplicity, let's assume domain_match if not specified
      const result = await AttributionService.attributeLead(
        leadId, 
        Number(projectId), 
        attributionMethod as any, 
        0.5 // Default score if domain match
      );
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      attributedCount: results.length,
      data: results
    });

  } catch (error) {
    console.error('❌ Lead Unify API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
