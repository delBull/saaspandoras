import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dealEnvelopes } from '@/db/schema';
import { desc, eq, and, sql, ilike, or } from 'drizzle-orm';
import { SovereignAuthService } from '@/lib/deal-signing/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/deal-signing/admin/envelopes
 * Returns paginated envelopes list for admin
 */
export async function GET(req: NextRequest) {
  try {
    const session = await SovereignAuthService.getSession(req);

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Acceso restringido a administradores.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;

    const statusFilter = searchParams.get('status');
    const query = searchParams.get('q')?.trim();

    // Fetch all for in-memory filtering / search or query Drizzle
    const allEnvelopes = await db
      .select()
      .from(dealEnvelopes)
      .orderBy(desc(dealEnvelopes.createdAt));

    let filtered = allEnvelopes;

    if (statusFilter && statusFilter !== 'ALL') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (query) {
      const qLower = query.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(qLower) ||
        e.id.toLowerCase().includes(qLower) ||
        e.organizationId.toLowerCase().includes(qLower) ||
        e.documentHash.toLowerCase().includes(qLower)
      );
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginatedItems = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      envelopes: paginatedItems,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });

  } catch (error: any) {
    console.error('[DealSigning Admin API] Error getting envelopes:', error);
    return NextResponse.json(
      { success: false, error: 'QUERY_FAILED', message: error?.message || 'Error al consultar envelopes' },
      { status: 500 }
    );
  }
}
