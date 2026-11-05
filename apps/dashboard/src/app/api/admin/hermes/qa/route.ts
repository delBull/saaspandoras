import { validateAdminSession } from '@/lib/admin-auth';
/**
 * 🧪 Hermes OS QA Certification API
 * apps/dashboard/src/app/api/admin/hermes/qa/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { HermesQARunner } from '@saasfly/hermes-core';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 🛡️ Autorización propia (el middleware sólo verifica presencia de cookie).
  const { errorResponse } = await validateAdminSession();
  if (errorResponse) return errorResponse;
  try {
    const report = await HermesQARunner.runSuite({ mode: 'MOCK' });
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // 🛡️ Autorización propia (el middleware sólo verifica presencia de cookie).
  const { errorResponse } = await validateAdminSession(req.headers);
  if (errorResponse) return errorResponse;
  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'MOCK';
    const scenarioIds = body.scenarioIds;

    const report = await HermesQARunner.runSuite({ mode, scenarioIds });
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
