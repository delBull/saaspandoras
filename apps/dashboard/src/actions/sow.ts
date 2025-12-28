"use server";

import { db } from "@/db";
import { sowTemplates } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSOWTemplates(tier?: string) {
    try {
        const query = db.select().from(sowTemplates).orderBy(desc(sowTemplates.createdAt));
        if (tier) {
            const templates = await query.where(eq(sowTemplates.tier, tier));
            // Filter inactive if needed, but for admin we might want to see all
            return { success: true, data: templates };
        }
        const templates = await query;
        return { success: true, data: templates };
    } catch (e) {
        console.error("Error getting templates:", e);
        return { success: false, error: "Failed to fetch templates" };
    }
}

export async function saveSOWTemplate(data: { id?: string; tier: string; name: string; content: string }) {
    try {
        if (data.id) {
            await db.update(sowTemplates).set({
                tier: data.tier,
                name: data.name,
                content: data.content,
                updatedAt: new Date()
            }).where(eq(sowTemplates.id, data.id));
        } else {
            await db.insert(sowTemplates).values({
                tier: data.tier,
                name: data.name,
                content: data.content,
                isActive: true
            });
        }
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (e) {
        console.error("Error saving template:", e);
        return { success: false, error: "Failed to save template" };
    }
}
