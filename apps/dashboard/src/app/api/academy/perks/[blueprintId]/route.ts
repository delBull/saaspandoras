/**
 * 🔒 Secure Blueprint & Perk Delivery API
 * apps/dashboard/src/app/api/academy/perks/[blueprintId]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { AcademyStore } from '@/lib/pandoras/core/domains/academy/candidates/candidate-store';
import { UNLOCKED_BLUEPRINTS } from '@/lib/pandoras/core/domains/academy/rewards/unlocked-perks';
import { getServerBlueprintContent } from '@/lib/pandoras/core/domains/academy/rewards/server-blueprints';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ blueprintId: string }> }
) {
  const { blueprintId } = await context.params;
  const certId = req.nextUrl.searchParams.get('certId');

  if (!certId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: CertId required to unlock confidential SOP.' },
      { status: 401 }
    );
  }

  // 🛡️ SECURITY GUARD: Verify certificate exists and is active
  const cert = await AcademyStore.getCertificationAsync(certId);
  if (!cert || cert.status !== 'CERTIFIED') {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Valid certified executive credential required.' },
      { status: 403 }
    );
  }

  const blueprintMeta = UNLOCKED_BLUEPRINTS.find(b => b.id === blueprintId);
  if (!blueprintMeta) {
    return NextResponse.json(
      { success: false, error: 'Blueprint not found' },
      { status: 404 }
    );
  }

  const contentMarkdown = getServerBlueprintContent(blueprintId);
  if (!contentMarkdown) {
    return NextResponse.json(
      { success: false, error: 'Content unavailable' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    blueprint: {
      ...blueprintMeta,
      contentMarkdown
    }
  });
}
