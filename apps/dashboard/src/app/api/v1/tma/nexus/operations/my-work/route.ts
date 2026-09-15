import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { TreasuryAdapter, GrowthAdapter, HermesAdapter, NexusOperation } from '../adapters';

export async function GET(req: Request) {
  try {
    const authCtx = await getNexusAuthContext();
    
    if (!authCtx.isAuthenticated || !authCtx.collaboratorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adapters = [
      new TreasuryAdapter(),
      new GrowthAdapter(),
      new HermesAdapter(),
    ];

    const results = await Promise.all(
      adapters.map(adapter => adapter.getOperations(authCtx).catch(err => {
        console.warn(`[OperationHub] Adapter failed:`, err);
        return [];
      }))
    );

    // Flatten all operations
    const operations = results.flat();

    // Sort by priority and createdAt
    const priorityWeight: Record<string, number> = {
      'CRITICAL': 4,
      'HIGH': 3,
      'NORMAL': 2,
      'LOW': 1
    };

    operations.sort((a, b) => {
      const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Bucket into NEEDS_ATTENTION, TODAY, RECENT
    const buckets: Record<string, NexusOperation[]> = {
      NEEDS_ATTENTION: [],
      TODAY: [],
      RECENT: []
    };

    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;

    for (const op of operations) {
      if (op.priority === 'CRITICAL' || op.type === 'INTERVENTION') {
        buckets.NEEDS_ATTENTION.push(op);
      } else if (now - new Date(op.createdAt).getTime() < msInDay) {
        buckets.TODAY.push(op);
      } else {
        buckets.RECENT.push(op);
      }
    }

    return NextResponse.json({ operations: buckets });
    
  } catch (error) {
    console.error('[OperationHub] Error fetching my-work:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
