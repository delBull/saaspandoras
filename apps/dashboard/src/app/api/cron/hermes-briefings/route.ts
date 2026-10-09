import { NextRequest, NextResponse } from 'next/server';
import { HermesBriefingOrchestrator } from '@saasfly/hermes-core/src/engines/HermesBriefingOrchestrator';

export const maxDuration = 60; // 60 seconds max

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    // Authenticate Vercel Cron
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Hermes Briefings Cron] Starting execution...');
    
    const orchestrator = new HermesBriefingOrchestrator();
    await orchestrator.processUpcomingMeetings();
    
    console.log('[Hermes Briefings Cron] Execution completed successfully.');
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[Hermes Briefings Cron] Execution failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
