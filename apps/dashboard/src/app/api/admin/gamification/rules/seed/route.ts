import { NextResponse } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { gamificationRules } from '@/db/schema';

export const dynamic = 'force-dynamic';

// POST /api/admin/gamification/rules/seed
// Trigger the master seeding of rules
export async function POST() {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const defaultRules = [
            {
                ruleId: 'TG_001',
                trigger: 'daily_login',
                xpReward: 10,
                creditsReward: 0,
                isRepeatable: true,
                cooldownHours: 24,
                copyTitle: 'Bono Diario',
                copyBody: 'Has recibido 10 XP por tu lealtad diaria.',
            },
            {
                ruleId: 'TG_002',
                trigger: 'wallet_link',
                xpReward: 100,
                creditsReward: 50,
                isRepeatable: false,
                copyTitle: 'Identidad Vinculada',
                copyBody: 'Has desbloqueado el potencial máximo vinculando tu wallet.',
            },
            {
                ruleId: 'TG_003',
                trigger: 'referral_completed',
                xpReward: 50,
                creditsReward: 20,
                isRepeatable: true,
                copyTitle: 'Crecimiento de Red',
                copyBody: 'Tu referido ha completado su registro. ¡Gracias por expandir Pandoras!',
            },
            {
                ruleId: 'TG_004',
                trigger: 'purchase_certified',
                xpReward: 200,
                creditsReward: 100,
                isRepeatable: true,
                copyTitle: 'Inversor Certificado',
                copyBody: 'Tu inversión ha sido procesada con éxito. Has ganado créditos de cosecha.',
            }
        ];

        for (const rule of defaultRules) {
            await db.insert(gamificationRules)
                .values({
                    id: crypto.randomUUID(),
                    ...rule,
                    condition: {},
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: gamificationRules.ruleId,
                    set: {
                        ...rule,
                        updatedAt: new Date(),
                    }
                });
        }

        return NextResponse.json({ success: true, seededCount: defaultRules.length });
    } catch (err: any) {
        console.error('[Admin Gamification Seed POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
