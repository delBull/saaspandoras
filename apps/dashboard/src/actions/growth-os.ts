"use server";

import { db } from "@/db";
import { marketingLeads, projects, growthActionsLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { resolveGrowthAction } from "@/lib/marketing/growth-engine/engine";
import { executeGrowthActions } from "@/lib/marketing/growth-engine/actions";

export async function recordCallOutcome(data: {
    leadId: string;
    outcome: 'hot' | 'warm' | 'cold' | 'no_show';
    notes?: string;
    dealValue?: number;
    probability?: number; // 0-100
    expectedCloseDate?: string; // ISO date string
    nextStep?: string;
}) {
    try {
        const { session } = await getAuth(await headers());
        if (!session?.address || !await isAdmin(session.address)) {
            throw new Error("Unauthorized");
        }

        const { leadId, outcome, notes, dealValue, probability, expectedCloseDate, nextStep } = data;

        // 1. Fetch Lead
        const lead = await db.query.marketingLeads.findFirst({
            where: eq(marketingLeads.id, leadId),
            with: { project: true }
        });

        if (!lead) return { success: false, error: "Lead not found" };

        // 2. Update Lead Metadata & Event History
        const currentMetadata = (lead.metadata as any) || {};
        const callHistory = currentMetadata.callHistory || [];
        
        const newCallRecord = {
            outcome,
            notes,
            dealValue,
            probability,
            expectedCloseDate,
            nextStep,
            recordedAt: new Date().toISOString(),
            recordedBy: session.address
        };

        const updatedMetadata = {
            ...currentMetadata,
            callHistory: [...callHistory, newCallRecord],
            lastCallOutcome: outcome,
            dealValue: dealValue || currentMetadata.dealValue,
            call: { outcome }
        };

        // 3. Hybrid Forecast (Elite: Auto-adjust probability if not manually specified)
        let finalProbability = probability;
        const currentScore = (lead.score || 0);
        if (!probability || probability === 50) {
            if (currentScore >= 80) finalProbability = 70;
            else if (currentScore >= 60) finalProbability = 40;
            else if (currentScore < 20) finalProbability = 10;
        }

        await db.update(marketingLeads)
            .set({
                metadata: updatedMetadata,
                conversionValue: dealValue ? String(dealValue) : null,
                probability: finalProbability || null,
                expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
                updatedAt: new Date()
            })
            .where(eq(marketingLeads.id, leadId));

        // 4. Trigger Growth Engine
        const engineResult = resolveGrowthAction('CALL_COMPLETED' as any, {
            ...lead,
            metadata: updatedMetadata
        });

        if (engineResult && engineResult.actions.length > 0) {
            await executeGrowthActions(
                engineResult.actions, 
                { lead: lead as any, project: lead.project as any },
                { 
                    ruleId: engineResult.ruleId || 'CALL_OUTCOME_UI', 
                    ruleCondition: engineResult.ruleCondition,
                    bypassCooldown: outcome === 'hot' // Elite Escape Logic
                },
                engineResult.scoreChange
            );
        } else {
             // Passive log for no-actions outcome
             await db.insert(growthActionsLog).values({
                leadId: lead.id,
                ruleId: 'CALL_COMPLETED_PASSIVE',
                actionType: 'NONE',
                status: 'completed',
                ruleCondition: `Call marked as ${outcome}`,
                inputSnapshot: { score: lead.score, status: lead.status },
                metadata: { outcome }
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error recording call outcome:", error);
        return { success: false, error: String(error) };
    }
}

export async function getLeadInsights(leadId: string) {
    try {
        const { session } = await getAuth(await headers());
        if (!session?.address || !await isAdmin(session.address)) {
            throw new Error("Unauthorized");
        }

        const lead = await db.query.marketingLeads.findFirst({
            where: eq(marketingLeads.id, leadId),
            with: {
                events: {
                    limit: 10,
                    orderBy: (events, { desc }) => [desc(events.createdAt)]
                },
                growthActions: {
                    limit: 10,
                    orderBy: (logs, { desc }) => [desc(logs.executedAt)]
                }
            }
        });

        return { success: true, data: lead };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
