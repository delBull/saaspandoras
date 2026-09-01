/**
 * 🌐 API Route: Ecosystem Setup Progress State
 * apps/dashboard/src/app/api/v1/internal/mesh/setup-progress/[organizationSlug]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { setupProgressService } from '@/lib/mesh/setup-progress.service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ organizationSlug: string }> }
) {
  try {
    const { organizationSlug } = await params;
    if (!organizationSlug) {
      return NextResponse.json({ error: 'ORGANIZATION_SLUG_REQUIRED' }, { status: 400 });
    }

    const state = await setupProgressService.getEcosystemSetupState(organizationSlug);
    return NextResponse.json(state);
  } catch (err: any) {
    console.error('[SetupProgressAPI] Error:', err);
    return NextResponse.json({ error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
