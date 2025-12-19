
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
 * Admin: Create Manual Booking (Bypasses availability)
 * Useful for "Agendar Ahora" or manual calendar management
 */
export async function createAdminBooking(userId: string, data: {
    title: string,
    leadName: string,
    leadEmail: string,
    description?: string,
    startTime: Date,
    durationMinutes: number,
    meetingType: 'video' | 'phone' | 'person'
}) {
    try {
        const endTime = new Date(data.startTime.getTime() + data.durationMinutes * 60000);

        // 1. Create a "Booked" Slot directly
        // We use a transaction to ensure atomicity
        const bookingId = crypto.randomUUID();
        const slotId = crypto.randomUUID(); // Assuming UUID PK for slots, or let DB handle if Serial (schema check needed)
        // Checking existing code: createSlots uses db.insert(schedulingSlots) without ID, implying Serial or Default UUID.
        // Let's check schema import... schema file showed `id: serial("id")` for others, but schedulingSlots might be different.
        // `bookSlot` uses `slotId` string. Let's assume it's UUID or we let it auto-gen.
        // BUT `bookSlot` receives `slotId`.
        // Inspecting `createSlots`: `await db.insert(schedulingSlots).values(...)`. It doesn't pass ID. So it's auto-generated.
        // We need the ID returned.

        const [newSlot] = await db.insert(schedulingSlots).values({
            userId,
            startTime: data.startTime,
            endTime: endTime,
            isBooked: true, // Directly booked
            type: `${data.durationMinutes}_min_admin`
        }).returning({ id: schedulingSlots.id });

        if (!newSlot) throw new Error("Failed to create slot");

        // 2. Create Confirmed Booking
        await db.insert(schedulingBookings).values({
            id: bookingId,
            slotId: newSlot.id,
            leadName: data.leadName,
            leadEmail: data.leadEmail,
            leadPhone: "", // Optional for admin manual
            notificationPreference: 'email',
            notes: `${data.title}\n${data.description || ''} \n[Type: ${data.meetingType}]`,
            status: "confirmed",
            confirmedAt: new Date()
        });

        // 3. Trigger Notifications
        // We use the same notification handlers
        const { sendSchedulerNotification } = await import("@/lib/discord/scheduler-notifier");
        const { sendBookingPendingEmail } = await import("@/lib/email/scheduler-mailer");
        // TODO: Create specific "Invite" email for admin bookings, for now using Pending/Confirmed template

        await Promise.allSettled([
            sendSchedulerNotification(bookingId, data.startTime, {
                name: data.leadName,
                email: data.leadEmail,
                notes: `(Admin Manual) ${data.title}`
            }),
            // Use existing emailer (might need adjustment to send "Confirmed" directly)
            sendBookingPendingEmail(data.leadEmail, {
                name: data.leadName,
                date: data.startTime.toLocaleDateString(),
                time: data.startTime.toLocaleTimeString()
            })
        ]);

        return { success: true, bookingId };

    } catch (error) {
        console.error("[Scheduler] Admin booking failed:", error);
        return { success: false, error: "Failed to create booking" };
    }
}

/**
 * Action: Resolve User by Alias (for public routes like /schedule/founders)
 */
export async function resolveUserByAlias(alias: string) {
    try {
        // 1. Static Aliases for Landing Pages
        // Added 'pandoras' for generic scheduling link
        const LANDING_ALIASES = ["founders", "protocol", "protocol-story", "start", "utility-protocol", "pandoras"];

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
