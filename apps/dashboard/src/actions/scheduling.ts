
'use server';

import { db } from "@/db";
import { schedulingSlots, schedulingBookings, users } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { Resend } from 'resend';

// Helper: Ensure valid UUIDs are used (implement per your project needs or rely on crypto.randomUUID default in schema)

/**
 * Get available slots for a specific host (user)
 */
export async function getAvailableSlots(userId: string) {
    try {
        const now = new Date();
        const slots = await db.select()
            .from(schedulingSlots)
            .where(
                and(
                    eq(schedulingSlots.userId, userId),
                    eq(schedulingSlots.isBooked, false),
                    gte(schedulingSlots.startTime, now)
                )
            )
            .orderBy(desc(schedulingSlots.startTime));

        return { success: true, slots };
    } catch (error) {
        console.error("[Scheduler] Error fetching slots:", error);
        return { success: false, error: "Failed to load availability" };
    }
}

/**
 * Public: Book a slot
 */
export async function bookSlot(slotId: string, leadData: { name: string, email: string, phone: string, preference: 'email' | 'whatsapp' | 'both', notes?: string }) {
    try {
        // 1. Double check availability
        const slot = await db.query.schedulingSlots.findFirst({
            where: eq(schedulingSlots.id, slotId)
        });

        if (!slot || slot.isBooked) {
            return { success: false, error: "Slot no longer available" };
        }

        // 2. Create Booking
        const bookingId = crypto.randomUUID();
        await db.insert(schedulingBookings).values({
            id: bookingId,
            slotId: slotId,
            leadName: leadData.name,
            leadEmail: leadData.email,
            leadPhone: leadData.phone,
            notificationPreference: leadData.preference,
            notes: leadData.notes,
            status: "pending"
        });

        // 3. Mark Slot as Booked
        await db.update(schedulingSlots)
            .set({ isBooked: true })
            .where(eq(schedulingSlots.id, slotId));

        // 4. Trigger Notifications (Async)
        // Import dynamically or at top. Using dynamic for now to circular deps safety if any across actions (unlikely here but clean)
        const { sendSchedulerNotification } = await import("@/lib/discord/scheduler-notifier");
        const { sendBookingPendingEmail } = await import("@/lib/email/scheduler-mailer");

        await Promise.allSettled([
            sendSchedulerNotification(bookingId, slot.startTime, {
                name: leadData.name,
                email: leadData.email,
                notes: leadData.notes
            }),
            sendBookingPendingEmail(leadData.email, {
                name: leadData.name,
                date: slot.startTime.toLocaleDateString(),
                time: slot.startTime.toLocaleTimeString()
            })
        ]);

        return { success: true, bookingId };

    } catch (error) {
        console.error("[Scheduler] Booking failed:", error);
        return { success: false, error: "Failed to process booking" };
    }
}

/**
 * Admin: Create Slots
 */
export async function createSlots(userId: string, slots: { start: Date, end: Date }[]) {
    try {
        if (!userId) return { success: false, error: "User ID required" };

        await db.insert(schedulingSlots).values(
            slots.map(s => ({
                userId,
                startTime: s.start,
                endTime: s.end,
                isBooked: false,
                type: '30_min' // Default for V1
            }))
        );
        return { success: true };
    } catch (error) {
        console.error("[Scheduler] Create slots failed:", error);
        return { success: false, error: "Failed to create slots" };
    }
}

/**
 * Action: Confirm Booking
 */
export async function confirmBooking(bookingId: string) {
    try {
        await db.update(schedulingBookings)
            .set({
                status: 'confirmed',
                confirmedAt: new Date()
            })
            .where(eq(schedulingBookings.id, bookingId));

        // TODO: Send Email Confirmed Notification to Lead

        return { success: true };
    } catch (error) {
        console.error("[Scheduler] Confirm failed:", error);
        return { success: false, error: "Failed to confirm" };
    }
}

/**
 * Action: Reject Booking
 */
export async function rejectBooking(bookingId: string) {
    try {
        // Get booking to free up slot? Or keep slot booked but status rejected?
        // Usually if rejected, the slot opens up again.

        const booking = await db.query.schedulingBookings.findFirst({
            where: eq(schedulingBookings.id, bookingId)
        });

        if (booking) {
            await db.transaction(async (tx) => {
                // 1. Update Booking
                await tx.update(schedulingBookings)
                    .set({
                        status: 'rejected',
                        cancelledAt: new Date()
                    })
                    .where(eq(schedulingBookings.id, bookingId));

                // 2. Free up the slot
                await tx.update(schedulingSlots)
                    .set({ isBooked: false })
                    .where(eq(schedulingSlots.id, booking.slotId));
            });
        }

        return { success: true };
    } catch (error) {
        console.error("[Scheduler] Reject failed:", error);
        return { success: false, error: "Failed to reject" };
    }
}

/**
 * Action: Resolve User by Alias (for public routes like /schedule/founders)
 */
export async function resolveUserByAlias(alias: string) {
    try {
        // 1. Static Aliases for Landing Pages
        const LANDING_ALIASES = ["founders", "protocol", "protocol-story", "start", "utility-protocol"];

        if (LANDING_ALIASES.includes(alias)) {
            // For V1, map all these to the FIRST user in the DB (Lead Admin)
            // TODO: In production, fetch specific user by role 'admin' or env var
            const admin = await db.query.users.findFirst();
            if (admin) return { success: true, userId: admin.id, name: "Equipo Pandora's" };
        }

        // 2. Direct User ID check (UUID)
        // Simple regex for UUID or just try fetch
        const user = await db.query.users.findFirst({
            where: eq(users.id, alias)
        });

        if (user) {
            return { success: true, userId: user.id, name: user.name || "Usuario" };
        }

        return { success: false, error: "User not found" };

    } catch (error) {
        console.error("Error resolving user:", error);
        return { success: false, error: "Resolver failed" };
    }
}
