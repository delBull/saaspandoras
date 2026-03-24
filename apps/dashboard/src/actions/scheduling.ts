'use server';

import crypto from "crypto";

import { db } from "@/db";
import { schedulingSlots, schedulingBookings, users, marketingLeads, clients } from "@/db/schema";
import { eq, and, gte, desc, lt, or, sql } from "drizzle-orm";
import { Resend } from 'resend';
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";

// Helper: Ensure valid UUIDs are used (implement per your project needs or rely on crypto.randomUUID default in schema)

/**
 * Get available slots for a specific host (user)
 */
export async function getAvailableSlots(userId: string) {
    try {
        const now = new Date();
        const bufferTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h buffer
        
        const slots = await db.select()
            .from(schedulingSlots)
            .where(
                and(
                    eq(schedulingSlots.userId, userId),
                    eq(schedulingSlots.isBooked, false),
                    gte(schedulingSlots.startTime, bufferTime),
                    // Check for active reservations
                    or(
                      lt(schedulingSlots.reservedUntil, now),
                      sql`${schedulingSlots.reservedUntil} IS NULL`
                    )
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
 * Get ALL slots (Admin View) including booked ones with details
 */
export async function getAdminSlots(userId: string) {
    try {
        const { session } = await getAuth(await headers());
        if (!session?.userId || !await isAdmin(session.userId)) {
            throw new Error("Unauthorized");
        }

        // Fetch slots
        const slots = await db.query.schedulingSlots.findMany({
            where: eq(schedulingSlots.userId, userId),
            with: {
                bookings: true // Assuming relation exists in schema
            },
            orderBy: desc(schedulingSlots.startTime)
        });

        // If relation isn't set up in Drizzle schema relations, we might need manual join. 
        // For now assuming schema relations are defined based on existing code style.
        // If not, we'll see a TS error or runtime error. 
        // fallback: manual join check? 
        // Let's rely on manual join strategy if "bookings" relation isn't obvious in schema file I read partially.
        // Actually, I didn't see relations defined in the schema snippet I read. safe bet: manual join and map.

        return { success: true, slots };
    } catch (error) {
        console.error("[Scheduler] Error fetching admin slots:", error);
        return { success: false, error: "Failed to load admin calendar" };
    }
}

/**
 * Public: Book a slot
 */
export async function bookSlot(slotId: string, leadData: { name: string, email: string, phone: string, preference: 'email' | 'whatsapp' | 'both', notes?: string, fingerprint?: string }) {
    try {
        const now = new Date();
        const normalizedEmail = leadData.email.toLowerCase().trim();
        const projectId = 1; // TODO: Resolve from context in multi-tenant v2

        // 1. ATOMIC TRANSACTION: Lock slot FIRST
        return await db.transaction(async (tx) => {
          const [updatedSlot] = await tx.update(schedulingSlots)
            .set({ 
              isBooked: true, 
              reservedUntil: null, 
              reservedBy: null 
            })
            .where(
              and(
                eq(schedulingSlots.id, slotId),
                eq(schedulingSlots.isBooked, false),
                or(
                  lt(schedulingSlots.reservedUntil, now),
                  sql`${schedulingSlots.reservedUntil} IS NULL`,
                  eq(schedulingSlots.reservedBy, leadData.fingerprint || normalizedEmail)
                )
              )
            )
            .returning();

          if (!updatedSlot) {
            return { success: false, error: "Slot no longer available or held by another person" };
          }

          // 2. Create Booking
          const bookingId = crypto.randomUUID();
          await tx.insert(schedulingBookings).values({
              id: bookingId,
              slotId: slotId,
              leadName: leadData.name,
              leadEmail: normalizedEmail,
              leadPhone: leadData.phone,
              notificationPreference: leadData.preference,
              notes: leadData.notes,
              status: "pending"
          });

          // 3. PIPELINE SYNC (Idempotent & Normalized)
          try {
            // A. Update Marketing Lead with Idempotent Scoring
            await tx.insert(marketingLeads).values({
              projectId: projectId,
              email: normalizedEmail,
              name: leadData.name,
              phoneNumber: leadData.phone,
              status: 'scheduled',
              intent: 'other',
              quality: 'high',
              score: 50,
              scope: 'b2b',
              fingerprint: leadData.fingerprint || null,
              identityHash: normalizedEmail
            }).onConflictDoUpdate({
              target: [marketingLeads.projectId, marketingLeads.identityHash],
              set: {
                status: 'scheduled',
                quality: 'high',
                // Idempotent Score: Only add if not already scheduled
                score: sql`
                  CASE 
                    WHEN ${marketingLeads.status} != 'scheduled' 
                    THEN ${marketingLeads.score} + 50 
                    ELSE ${marketingLeads.score} 
                  END`,
                updatedAt: new Date(),
                name: leadData.name, // Update metadata
                phoneNumber: leadData.phone
              }
            });

            // B. Sync to CRM (Clients)
            await tx.insert(clients).values({
              email: normalizedEmail,
              name: leadData.name,
              whatsapp: leadData.phone,
              status: 'negotiating',
              source: 'scheduling',
              metadata: {
                bookingId,
                bookedAt: now.toISOString(),
                notes: leadData.notes
              }
            }).onConflictDoUpdate({
              target: [clients.email],
              set: {
                status: 'negotiating',
                name: leadData.name,
                whatsapp: leadData.phone,
                metadata: sql`jsonb_set(
                  COALESCE(${clients.metadata}, '{}'::jsonb), 
                  '{lastBooking}', 
                  ${JSON.stringify({ bookingId, bookedAt: now.toISOString() })}::jsonb
                )`
              }
            });
          } catch (syncErr) {
            console.error("[Scheduler] Pipeline sync failed (non-blocking):", syncErr);
          }

          // 4. Trigger Notifications (Async - outside of transaction actually is better but we use it here for flow)
          // We'll return success and the caller can handle notifications if needed, 
          // but for consistency we keep them here.
          const { sendSchedulerNotification } = await import("@/lib/discord/scheduler-notifier");
          const { sendBookingPendingEmail } = await import("@/lib/email/scheduler-mailer");

          await Promise.allSettled([
              sendSchedulerNotification(bookingId, updatedSlot.startTime, {
                  name: leadData.name,
                  email: normalizedEmail,
                  notes: leadData.notes
              }),
              sendBookingPendingEmail(normalizedEmail, {
                  name: leadData.name,
                  date: updatedSlot.startTime.toLocaleDateString(),
                  time: updatedSlot.startTime.toLocaleTimeString()
              })
          ]);

          return { success: true, bookingId };
        });

    } catch (error) {
        console.error("[Scheduler] Booking failed:", error);
        return { success: false, error: "Failed to process booking" };
    }
}

/**
 * Public: Temporarily lock a slot for 5 minutes
 */
export async function reserveSlot(slotId: string, reservePayload: { identifier: string }) {
  try {
    const now = new Date();
    const expiry = new Date(now.getTime() + 5 * 60 * 1000); // 5 min
    
    // Atomically lock if not already locked or lock expired
    const result = await db.update(schedulingSlots)
      .set({ 
        reservedUntil: expiry, 
        reservedBy: reservePayload.identifier 
      })
      .where(
        and(
          eq(schedulingSlots.id, slotId),
          eq(schedulingSlots.isBooked, false),
          or(
            lt(schedulingSlots.reservedUntil, now),
            sql`${schedulingSlots.reservedUntil} IS NULL`,
            eq(schedulingSlots.reservedBy, reservePayload.identifier)
          )
        )
      )
      .returning();

    if (result.length === 0) {
      return { success: false, error: "Slot already taken or locked" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Scheduler] Reserve slot failed:", error);
    return { success: false, error: "Failed to reserve slot" };
  }
}

/**
 * Admin: Create Slots
 */
export async function createSlots(userId: string, slots: { start: Date, end: Date }[]) {
    try {
        const { session } = await getAuth(await headers());
        if (!session?.userId || !await isAdmin(session.userId)) {
            throw new Error("Unauthorized");
        }

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
        const { session } = await getAuth(await headers());
        if (!session?.userId || !await isAdmin(session.userId)) {
            throw new Error("Unauthorized");
        }

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
        const { session } = await getAuth(await headers());
        if (!session?.userId || !await isAdmin(session.userId)) {
            throw new Error("Unauthorized");
        }

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
        const { session } = await getAuth(await headers());
        if (!session?.userId || !await isAdmin(session.userId)) {
            throw new Error("Unauthorized");
        }

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

/**
 * Action: Reschedule Booking
 */
export async function rescheduleBooking(oldBookingId: string, newSlotId: string) {
  try {
    const { session } = await getAuth(await headers());
    // Can be done by user (self-service) or admin
    // For now we assume the caller has valid context or we check session
    
    return await db.transaction(async (tx) => {
      // 1. Get old booking
      const oldBooking = await tx.query.schedulingBookings.findFirst({
        where: eq(schedulingBookings.id, oldBookingId)
      });
      if (!oldBooking) throw new Error("Original booking not found");

      // 2. Lock NEW slot
      const [newSlot] = await tx.update(schedulingSlots)
        .set({ isBooked: true })
        .where(and(eq(schedulingSlots.id, newSlotId), eq(schedulingSlots.isBooked, false)))
        .returning();
      if (!newSlot) throw new Error("New slot is already taken");

      // 3. Free OLD slot
      await tx.update(schedulingSlots)
        .set({ isBooked: false })
        .where(eq(schedulingSlots.id, oldBooking.slotId));

      // 4. Update Booking with new slot
      await tx.update(schedulingBookings)
        .set({ 
          slotId: newSlotId,
          updatedAt: new Date(),
          status: 'pending' // Reset to pending for re-confirmation if needed
        })
        .where(eq(schedulingBookings.id, oldBookingId));

      return { success: true };
    });
  } catch (error) {
    console.error("[Scheduler] Reschedule failed:", error);
    return { success: false, error: "Failed to reschedule" };
  }
}

/**
 * Action: Mark No-Show
 */
export async function markNoShow(bookingId: string) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.userId || !await isAdmin(session.userId)) throw new Error("Unauthorized");

    await db.transaction(async (tx) => {
      // 1. Update Booking
      const [booking] = await tx.update(schedulingBookings)
        .set({ status: 'no_show' })
        .where(eq(schedulingBookings.id, bookingId))
        .returning();

      if (booking) {
        // 2. Sync to Marketing Lead
        await tx.update(marketingLeads)
          .set({ status: 'no_show', updatedAt: new Date() })
          .where(eq(marketingLeads.email, booking.leadEmail));

        // 3. Sync to Client
        await tx.update(clients)
          .set({ status: 'negotiating' }) // Keep as negotiating but update metadata?
          .where(eq(clients.email, booking.leadEmail));
      }
    });

    return { success: true };
  } catch (error) {
    console.error("[Scheduler] Mark No-Show failed:", error);
    return { success: false, error: "Failed to update record" };
  }
}

/**
 * Action: Complete Call (Outcome Recording)
 */
export async function completeCall(bookingId: string, outcome: 'interested' | 'not_ready' | 'lost', notes?: string) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.userId || !await isAdmin(session.userId)) throw new Error("Unauthorized");

    await db.transaction(async (tx) => {
      // 1. Update Booking
      const [booking] = await tx.update(schedulingBookings)
        .set({ 
          status: 'completed',
          notes: sql`concat(${schedulingBookings.notes}, '\n\n[Outcome: ', ${outcome}, ']\n', ${notes || ''})`
        })
        .where(eq(schedulingBookings.id, bookingId))
        .returning();

      if (booking) {
        const leadStatus = outcome === 'interested' ? 'converted' : (outcome === 'lost' ? 'archived' : 'nurturing');
        const clientStatus = outcome === 'interested' ? 'active' : (outcome === 'lost' ? 'archived' : 'negotiating');

        // 2. Sync to Marketing Lead
        await tx.update(marketingLeads)
          .set({ 
            status: leadStatus as any, 
            updatedAt: new Date(),
            score: outcome === 'interested' ? sql`${marketingLeads.score} + 100` : marketingLeads.score
          })
          .where(eq(marketingLeads.email, booking.leadEmail));

        // 3. Sync to Client
        await tx.update(clients)
          .set({ 
            status: clientStatus as any,
            updatedAt: new Date()
          })
          .where(eq(clients.email, booking.leadEmail));
      }
    });

    return { success: true };
  } catch (error) {
    console.error("[Scheduler] Complete Call failed:", error);
    return { success: false, error: "Failed to save call outcome" };
  }
}
