import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dealEnvelopes } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { SovereignAuthService } from '@/lib/deal-signing/auth';

export const dynamic = 'force-dynamic';

interface SignerAggregated {
  email: string;
  name: string;
  totalEnvelopes: number;
  signedCount: number;
  pendingCount: number;
  walletAddresses: string[];
  lastActive: string;
  envelopes: { id: string; title: string; status: string }[];
}

/**
 * GET /api/v1/deal-signing/admin/users
 * Returns aggregated and paginated signers / users list for admin
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
    const query = searchParams.get('q')?.trim().toLowerCase();

    const allEnvelopes = await db
      .select()
      .from(dealEnvelopes)
      .orderBy(desc(dealEnvelopes.createdAt));

    const userMap = new Map<string, SignerAggregated>();

    for (const env of allEnvelopes) {
      const signers = (env.signers as any[]) || [];
      for (const s of signers) {
        if (!s.email) continue;
        const email = s.email.toLowerCase().trim();

        if (!userMap.has(email)) {
          userMap.set(email, {
            email,
            name: s.name || email.split('@')[0],
            totalEnvelopes: 0,
            signedCount: 0,
            pendingCount: 0,
            walletAddresses: [],
            lastActive: env.createdAt.toISOString(),
            envelopes: [],
          });
        }

        const user = userMap.get(email)!;
        user.totalEnvelopes++;
        user.envelopes.push({ id: env.id, title: env.title, status: env.status });

        if (s.status === 'SIGNED') {
          user.signedCount++;
          if (s.signatureProof?.signerAddress) {
            const addr = s.signatureProof.signerAddress.toLowerCase();
            if (!user.walletAddresses.includes(addr)) {
              user.walletAddresses.push(addr);
            }
          }
        } else {
          user.pendingCount++;
        }

        if (new Date(env.createdAt) > new Date(user.lastActive)) {
          user.lastActive = env.createdAt.toISOString();
        }
      }
    }

    let userList = Array.from(userMap.values());

    if (query) {
      userList = userList.filter(u => 
        u.email.includes(query) || 
        u.name.toLowerCase().includes(query) ||
        u.walletAddresses.some(w => w.includes(query))
      );
    }

    // Sort by most active
    userList.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

    const totalItems = userList.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginatedUsers = userList.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      users: paginatedUsers,
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
    console.error('[DealSigning Admin API] Error getting users:', error);
    return NextResponse.json(
      { success: false, error: 'QUERY_FAILED', message: error?.message || 'Error al consultar usuarios' },
      { status: 500 }
    );
  }
}
