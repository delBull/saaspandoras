import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { gamificationRules } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateExternalKey } from '@/lib/api-auth/validate-external-key';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/external/growth-os/gamification/rules
 * 
 * Returns active gamification mechanics for external partners.
 * Allows visibility into XP/Credit rewards for specific triggers.
 */
export async function GET(req: NextRequest) {
    const { client, error } = await validateExternalKey(req, "read:growth_os");
    if (error || !client) {
        return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
    }

    try {
        const rules = await db.query.gamificationRules.findMany({
            where: eq(gamificationRules.isActive, true),
            columns: {
                ruleId: true,
                trigger: true,
                xpReward: true,
                creditsReward: true,
                isRepeatable: true,
                cooldownHours: true,
                copyTitle: true,
                copyBody: true,
            },
            orderBy: (rules, { asc }) => [asc(rules.ruleId)]
        });

        return NextResponse.json({
            success: true,
            count: rules.length,
            rules: rules.map(r => ({
                id: r.ruleId,
                event: r.trigger,
                rewards: {
                    xp: r.xpReward,
                    credits: r.creditsReward
                },
                policy: {
                    repeatable: r.isRepeatable,
                    cooldown_hours: r.cooldownHours
                },
                display: {
                    title: r.copyTitle,
                    description: r.copyBody
                }
            }))
        });

    } catch (e: any) {
        console.error("[external:gamification:rules] Error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
