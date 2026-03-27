import { NextRequest, NextResponse } from 'next/server';
import { AttributionService } from '@/lib/marketing/attribution-service';
import { getAuth, isAdmin } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/marketing/leads/suggestions?projectId=123
 */
export async function GET(req: NextRequest) {
  try {
    const { session } = await getAuth(await headers());
    const userIsAdmin = await isAdmin(session?.address);

    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const suggestions = await AttributionService.getSuggestions(Number(projectId));

    if (suggestions === null) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('❌ Lead Suggestions API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
