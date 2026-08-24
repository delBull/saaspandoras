import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/admin-auth';
import { SovereignStorageRepairEngine } from '@/lib/pandoras/core/domains/hermes/knowledge/ipfs/storage-repair';

export const runtime = 'nodejs';

/**
 * POST /api/admin/ipfs/repair
 * 
 * Reconciles and repairs any purchase legal agreements in PENDING/DEGRADED state.
 * Transitions legal evidence into verified DURABLE sovereign storage.
 */
export async function POST(request: Request) {
  const { session, errorResponse } = await validateAdminSession(request.headers);
  if (errorResponse) return errorResponse;

  try {
    const repairEngine = new SovereignStorageRepairEngine();
    const result = await repairEngine.repairPendingLegalAgreements(50);

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Repair execution failed',
    }, { status: 500 });
  }
}
