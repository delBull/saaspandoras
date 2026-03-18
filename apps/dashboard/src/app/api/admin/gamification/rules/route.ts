import { NextResponse } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { gamificationRules } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/admin/gamification/rules - List all rules
export async function GET() {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rules = await db.select().from(gamificationRules).orderBy(gamificationRules.ruleId);
        return NextResponse.json(rules);
    } catch (err: any) {
        console.error('[Admin Gamification Rules GET]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/admin/gamification/rules - Basic management (create/upsert)
// For massive seeding, we use the specific seed endpoint
export async function POST(req: Request) {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { ruleId, trigger, xpReward, creditsReward, isActive } = body;

        if (!ruleId || !trigger) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Upsert logic
        await db.insert(gamificationRules)
            .values({
                id: crypto.randomUUID(),
                ruleId,
                trigger,
                xpReward: xpReward ?? 0,
                creditsReward: creditsReward ?? 0,
                isActive: isActive ?? true,
                condition: {},
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: gamificationRules.ruleId,
                set: {
                    trigger,
                    xpReward: xpReward ?? 0,
                    creditsReward: creditsReward ?? 0,
                    isActive: isActive ?? true,
                    updatedAt: new Date(),
                }
            });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Admin Gamification Rules POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
