/**
 * 🧪 Hermes OS QA Certification API
 * apps/dashboard/src/app/api/admin/hermes/qa/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { HermesQARunner } from '@/lib/pandoras/core/domains/hermes/qa/runner/qa-runner';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const report = await HermesQARunner.runSuite({ mode: 'MOCK' });
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
