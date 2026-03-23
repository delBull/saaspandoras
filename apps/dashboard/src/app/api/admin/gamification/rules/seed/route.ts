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
            },
            {
                ruleId: 'TG_005',
                trigger: 'project_application_submitted',
                xpReward: 250,
                creditsReward: 0,
                isRepeatable: true,
                copyTitle: 'Fundador en Potencia',
                copyBody: 'Has iniciado el camino para lanzar tu propio protocolo.',
            },
            {
                ruleId: 'TG_006',
                trigger: 'protocol_deployed',
                xpReward: 500,
                creditsReward: 200,
                isRepeatable: true,
                copyTitle: 'Protocolo Live',
                copyBody: '¡Enhorabuena! Tu protocolo está desplegado en la blockchain.',
            },
            {
                ruleId: 'TG_007',
                trigger: 'dao_activated',
                xpReward: 300,
                creditsReward: 100,
                isRepeatable: false,
                copyTitle: 'Democracia Activada',
                copyBody: 'Has activado la gobernanza descentralizada para tu comunidad.',
            },
            {
                ruleId: 'TG_008',
                trigger: 'onboarding_tour_completed',
                xpReward: 50,
                creditsReward: 10,
                isRepeatable: false,
                copyTitle: 'Explorador Pandoras',
                copyBody: 'Has completado el tour inicial. ¡Ya eres un experto!',
            },
            {
                ruleId: 'TG_009',
                trigger: 'profile_completed',
                xpReward: 40,
                creditsReward: 0,
                isRepeatable: false,
                copyTitle: 'Perfil Maestro',
                copyBody: 'Tu identidad es sólida. Esto genera confianza en la red.',
            },
            {
                ruleId: 'TG_010',
                trigger: 'course_completed',
                xpReward: 150,
                creditsReward: 40,
                isRepeatable: true,
                copyTitle: 'Diploma Desbloqueado',
                copyBody: 'El conocimiento es poder. Has completado un curso educativo.',
            },
            {
                ruleId: 'TG_011',
                trigger: 'proposal_vote',
                xpReward: 30,
                creditsReward: 10,
                isRepeatable: true,
                copyTitle: 'Voz Activa',
                copyBody: 'Tu voto ha sido registrado. Estás moldeando el futuro del DAO.',
            },
            {
                ruleId: 'TG_012',
                trigger: 'artifact_purchased',
                xpReward: 100,
                creditsReward: 50,
                isRepeatable: true,
                copyTitle: 'Coleccionista de Valor',
                copyBody: 'Has adquirido un artefacto. Tu poder en el ecosistema crece.',
            },
            {
                ruleId: 'TG_013',
                trigger: 'staking_deposit',
                xpReward: 80,
                creditsReward: 20,
                isRepeatable: true,
                copyTitle: 'Capital en Movimiento',
                copyBody: 'Has puesto tus activos a trabajar en el sistema de staking.',
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
