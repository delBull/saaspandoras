'use server';

import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '~/db';
import { operationalIntents, marketingLeads, projects, daoMembers } from '~/db/schema';
import { getAuth, isAdmin } from '~/lib/auth';

export async function simulateHermesProposal(organizationId: string) {
    try {
        const { session } = await getAuth();
        if (!session?.address) {
            throw new Error("Unauthorized: No session");
        }

        const slug = organizationId.startsWith('org_')
            ? organizationId.slice(4)
            : organizationId;

        const [project] = await db.select({ id: projects.id, slug: projects.slug, title: projects.title })
            .from(projects)
            .where(eq(projects.slug, slug))
            .limit(1);

        if (!project) {
            throw new Error(`Organization ${organizationId} not found`);
        }

        const isAdminUser = await isAdmin(session.address);
        if (!isAdminUser) {
            const [membership] = await db.select({ id: daoMembers.id })
                .from(daoMembers)
                .where(and(
                    eq(daoMembers.wallet, session.address),
                    eq(daoMembers.projectId, project.id)
                ))
                .limit(1);

            if (!membership) {
                throw new Error("Unauthorized: You are not a member of this organization");
            }
        }

        const intentId = `oi_${randomUUID().replace(/-/g, '').substring(0, 16)}`;

        const lead = await db.query.marketingLeads.findFirst({
            where: eq(marketingLeads.projectId, project.id)
        });

        await db.insert(operationalIntents).values({
            id: intentId,
            organizationId,
            missionId: 'dev_test_mission_001',
            packId: 'core_marketing_pack',
            packVersion: '1.0.0',
            strategyDecisionId: 'sd_simulated_001',
            intentType: 'SEND_TELEGRAM_MESSAGE',
            objective: 'Re-engage hot lead ' + (lead?.name || 'User'),
            rationale: "El sistema detectó que el lead está activo y tiene una puntuación alta. Se recomienda contactarlo proactivamente.",
            constraints: [
                { type: 'time', value: 'business_hours' },
                { type: 'chatId', value: (lead?.metadata as any)?.telegramChatId || '725515097' }, // Fallback to a real or test chat id
                { type: 'message', value: `¡Hola ${lead?.name || 'Inversor'}! Notamos tu interés en el proyecto. ¿Te gustaría agendar una llamada con nuestro equipo?` }
            ],
            approvalPolicy: { type: 'manual_required', required: true, requireAdmin: true },
            status: 'pending_approval'
        });

        return { success: true, intentId };
    } catch (error: any) {
        console.error("Error simulating Hermes proposal:", error);
        return { success: false, error: error.message };
    }
}
