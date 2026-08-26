import { NextResponse } from 'next/server';
import { AutonomousWorkflowEngine } from '@/lib/hermes/workflow-engine';
import { OrganizationLifecycleManager } from '@/lib/platform/lifecycle-manager';
import { Scheduler } from '@/lib/hermes/kernel/scheduler/scheduler';

export const dynamic = 'force-dynamic';

/**
 * ⏰ Cron API Route for Proactive Tasks & Lifecycle Audits
 * GET /api/v1/hermes/cron/workflows
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Protect CRON execution via query secret if configured
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized CRON request' }, { status: 401 });
    }

    // 1. Run Proactive Follow-ups
    const followupResult = await AutonomousWorkflowEngine.runProactiveFollowups();

    // 2. Audit Trial Expirations in Lifecycle Manager
    const lifecycleResult = await OrganizationLifecycleManager.checkTrialExpirations();

    // 3. Process Dead-Letter Queue & Expired Callback Jobs (Sprint 4 Hardening)
    const deadLetterResult = await Scheduler.processDeadLetterQueue();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      followups: followupResult,
      lifecycle: lifecycleResult,
      deadLetter: deadLetterResult,
    });
  } catch (error: any) {
    console.error('[Hermes Workflows Cron Error]:', error);
    return NextResponse.json({ error: error?.message || 'Cron execution failed' }, { status: 500 });
  }
}
