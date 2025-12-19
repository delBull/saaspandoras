'use server';

import { db } from "@/db";
import { marketingExecutions, marketingCampaigns, users, whatsappPreapplyLeads } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function getMarketingDashboardStats() {
    try {
        // 1. Fetch Summary Stats
        const executions = await db.select().from(marketingExecutions);

        const total = executions.length;
        const active = executions.filter(e => e.status === 'active').length;
        const paused = executions.filter(e => e.status === 'paused').length;
        const completed = executions.filter(e => e.status === 'completed').length;

        // 2. Fetch Recent Executions with Details
        // We'll limit to 10 for dashboard view
        // Note: Drizzle Query Builder is more efficient for relations if setup, 
        // but raw joins or separate fetches work for basic needs.
        // Assuming no strict relations defined in drizzle schema object for valid 'with', we do manual lookups or joins.
        // For V1 complexity, fetching raw is fine.

        const recentExecs = await db.select({
            id: marketingExecutions.id,
            status: marketingExecutions.status,
            currentStep: marketingExecutions.currentStageIndex,
            nextRunAt: marketingExecutions.nextRunAt,
            // Campaign Info
            campaignName: marketingCampaigns.name,
            // Target Info
            userId: marketingExecutions.userId,
            leadId: marketingExecutions.leadId,
        })
            .from(marketingExecutions)
            .leftJoin(marketingCampaigns, eq(marketingExecutions.campaignId, marketingCampaigns.id))
            .orderBy(desc(marketingExecutions.id)) // Assuming UUID, but creation order is better. If no createdAt, use ID.
            // marketingExecutions doesn't have createdAt in schema shown earlier?
            // Let's re-verify schema. `nextRunAt` exists.
            .limit(20);

        // 3. Resolve Target Names (Users or Leads)
        // This avoids complex polymorphic SQL joins
        const detailedExecs = await Promise.all(recentExecs.map(async (exec) => {
            let targetName = 'Unknown';
            let targetType = 'unknown';

            if (exec.userId) {
                const u = await db.query.users.findFirst({
                    where: eq(users.id, exec.userId),
                    columns: { name: true, email: true }
                });
                if (u) {
                    targetName = u.name || u.email || 'User';
                    targetType = 'user';
                }
            } else if (exec.leadId) {
                // Assuming leadId points to whatsappPreapplyLeads table via ID (integer) or UUID string
                // Schema said `leadId: varchar` and `whatsappPreapplyLeads.id: serial`.
                // Need to cast if matching.
                // If leadId is stored as string '123'
                try {
                    const l = await db.query.whatsappPreapplyLeads.findFirst({
                        where: eq(whatsappPreapplyLeads.id, Number(exec.leadId)),
                        columns: { applicantName: true, userPhone: true }
                    });
                    if (l) {
                        targetName = l.applicantName || l.userPhone || 'Lead';
                        targetType = 'lead';
                    }
                } catch (e) { }
            }

            return {
                ...exec,
                targetName,
                targetType,
                lastRunAt: null // Not tracking lastRunAt in schema currently?
            };
        }));

        return {
            success: true,
            stats: { total, active, paused, completed },
            executions: detailedExecs
        };

    } catch (error) {
        console.error("Error fetching marketing stats:", error);
        return {
            success: false,
            stats: { total: 0, active: 0, paused: 0, completed: 0 },
            executions: []
        };
    }
}
