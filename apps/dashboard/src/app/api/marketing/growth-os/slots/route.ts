import { NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingLeads } from '@/db/schema';
import { sql, count } from 'drizzle-orm';

const TOTAL_SLOTS = 50;
const INITIAL_SEED = 6; // Pre-seed so counter never shows 0 from the start

/**
 * GET /api/marketing/growth-os/slots
 * Returns the number of Genesis slots remaining based on real captured leads.
 * Formula: remaining = max(0, TOTAL_SLOTS - (INITIAL_SEED + captured_leads))
 */
export async function GET() {
    try {
        const [result] = await db
            .select({ total: count() })
            .from(marketingLeads)
            .where(
                sql`${marketingLeads.metadata}::text ILIKE '%growth_os%'
                OR ${marketingLeads.metadata}::text ILIKE '%growth-os%'`
            );

        const capturedLeads = Number(result?.total || 0);
        const usedSlots = INITIAL_SEED + capturedLeads;
        const remaining = Math.max(0, TOTAL_SLOTS - usedSlots);

        return NextResponse.json({
            total: TOTAL_SLOTS,
            captured: capturedLeads,
            usedSlots,
            remaining,
        }, {
            headers: {
                // Cache for 60s — frequent enough to update, avoids hammering DB
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
            }
        });
    } catch (error) {
        console.error('[growth-os/slots] Error:', error);
        // Fallback — show a reasonable default if DB fails
        return NextResponse.json({ total: TOTAL_SLOTS, captured: 0, usedSlots: INITIAL_SEED, remaining: TOTAL_SLOTS - INITIAL_SEED });
    }
}
