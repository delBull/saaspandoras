
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingLeads } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuth, isAdmin } from '@/lib/auth';
import { headers } from 'next/headers';
import { resolveGrowthAction } from '@/lib/marketing/growth-engine/engine';
import { executeGrowthActions } from '@/lib/marketing/growth-engine/actions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/marketing/cron/process-nurture
 * 
 * Secure cron endpoint to process delayed growth actions.
 * Recommended Frequency: Every 1-6 hours.
 * 
 * Authorization: 
 * 1. Admin Session (Browser)
 * 2. CRON_SECRET header (System)
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authorization
    const cronSecret = req.headers.get('x-cron-secret');
    const isSystemCron = cronSecret && cronSecret === process.env.CRON_SECRET;
    
    if (!isSystemCron) {
        const { session } = await getAuth(await headers());
        const address = session?.address;
        if (!address || !await isAdmin(address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    console.log(`[Growth OS] 🕒 Starting Nurture Cron Processing...`);

    // 2. Fetch Active Leads
    // We filter for active leads only to save resources
    const activeLeads = await db.query.marketingLeads.findMany({
      where: eq(marketingLeads.status, 'active'),
      with: {
        project: true
      },
      limit: 100 // Process in batches to avoid timeouts
    });

    let processedCount = 0;
    let actionCount = 0;

    // 3. Process each lead through the engine
    for (const lead of activeLeads) {
      if (!lead.project) continue;

      // The HEARTBEAT event triggers the adaptive timing resolver in engine.ts
      const engineResult = resolveGrowthAction('HEARTBEAT' as any, lead as any, lead.project as any);

      if (engineResult && engineResult.actions.length > 0) {
        console.log(`[Growth OS] 🚀 Cron Triggered ${engineResult.actions.length} actions for ${lead.email}`);
        
        await executeGrowthActions(
          engineResult.actions, 
          { lead: lead as any, project: lead.project as any },
          { 
            ruleId: engineResult.ruleId || 'CRON_NURTURE', 
            ruleCondition: engineResult.ruleCondition 
          }
        );
        actionCount += engineResult.actions.length;
      }
      processedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} leads. Triggered ${actionCount} actions.`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Nurture Cron Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
