"use server";

import { db } from "@/db";
import { clients, marketingLeads } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { notifyNewLead } from "@/lib/discord";

/**
 * Sync a lead/prospect into the `clients` table.
 * Safe to call from any lead capture point (WhatsApp bot, landing pages, email forms).
 * Uses upsert logic based on email OR whatsapp number to avoid duplicates.
 */
export async function syncLeadAsClient(data: {
    name?: string;
    email?: string;
    whatsapp?: string; // WhatsApp phone number (e.g. "5213221374392")
    phone?: string;
    source: string;
    notes?: string;
    package?: string;
    metadata?: Record<string, unknown>;
    projectId?: number;
}) {
    try {
        const { name, email, whatsapp, phone, source, notes, package: pkg, metadata, projectId } = data;

        if (!email && !whatsapp) {
            console.warn("[syncLeadAsClient] No email or whatsapp provided, skipping.");
            return { success: false, error: "Missing contact info" };
        }

    // --- 1. Look up existing client ---
    let existing: typeof clients.$inferSelect | undefined;

    if (email) {
        existing = await db.query.clients.findFirst({
            where: eq(clients.email, email),
        });
    }

    // If no hit by email, check by whatsapp number
    if (!existing && whatsapp) {
        existing = await db.query.clients.findFirst({
            where: eq(clients.whatsapp, whatsapp),
        });
    }

    // --- 2. Upsert client record ---
    let clientRecord: typeof clients.$inferSelect;
    if (existing) {
        // Update existing lead with new info
        const rows = await db.update(clients)
            .set({
                name: name || existing.name,
                email: email || existing.email,
                whatsapp: whatsapp || existing.whatsapp,
                phone: phone || existing.phone,
                // Don't override a meaningful source
                source: existing.source === 'manual' ? source : existing.source,
                notes: notes ? `${existing.notes ?? ''}\n${notes}`.trim() : existing.notes,
                metadata: metadata
                    ? { ...(existing.metadata as Record<string, unknown> ?? {}), ...metadata }
                    : existing.metadata,
                updatedAt: new Date(),
            })
            .where(eq(clients.id, existing.id))
            .returning();

        clientRecord = rows[0] ?? existing;
    } else {
        // Create new lead record
        const rows = await db.insert(clients).values({
            id: crypto.randomUUID(),
            name: name || 'Sin Nombre',
            email: email || whatsapp!, // Fallback to whatsapp as identifier if no email
            whatsapp: whatsapp ?? null,
            phone: phone ?? null,
            source,
            status: 'lead',
            notes: notes ?? null,
            package: pkg ?? null,
            metadata: metadata ?? {},
        }).returning();

        if (!rows[0]) throw new Error('Insert returned no rows');
        clientRecord = rows[0];
    }

    // --- 3. SYNC TO MARKETING LEADS (Growth OS Visibility) ---
    if (projectId) {
        try {
            // Check if marketing lead exists
            // Using a more robust where clause to avoid TS inference issues
            const existingLead = await db.query.marketingLeads.findFirst({
                where: and(
                    eq(marketingLeads.projectId, projectId),
                    or(
                        email ? eq(marketingLeads.email, email) : undefined,
                        whatsapp ? eq(marketingLeads.phoneNumber, whatsapp) : undefined
                    )
                )
            });

            if (existingLead) {
                await db.update(marketingLeads).set({
                    name: name || existingLead.name,
                    email: email || existingLead.email,
                    phoneNumber: whatsapp || existingLead.phoneNumber,
                    updatedAt: new Date(),
                }).where(eq(marketingLeads.id, existingLead.id));
            } else {
                await db.insert(marketingLeads).values({
                    projectId: projectId,
                    name: name || 'WhatsApp Lead',
                    email: email || null,
                    phoneNumber: whatsapp || null,
                    origin: source || 'whatsapp',
                    status: 'active',
                    scope: 'b2c',
                    intent: 'explore',
                    metadata: { ...(metadata || {}), syncedFrom: 'syncLeadAsClient' }
                });
            }
        } catch (marketingError) {
            console.error("[syncLeadAsClient] Failed to sync to marketing_leads:", marketingError);
        }
    }

        // --- 4. Notify Discord about new lead (only on creation) ---
        if (!existing) {
            try {
                await notifyNewLead(
                    name || 'Nuevo Lead',
                    email || whatsapp || 'N/A',
                    5,
                    source,
                    `New lead from ${source}. WhatsApp: ${whatsapp || 'N/A'}`
                );
            } catch (discordError) {
                console.warn("[syncLeadAsClient] Discord notification failed (non-blocking):", discordError);
            }
        }

        return { success: true, data: clientRecord, isNew: !existing };
    } catch (e) {
        console.error("[syncLeadAsClient] Error:", e);
        return { success: false, error: "Failed to sync lead" };
    }
}
