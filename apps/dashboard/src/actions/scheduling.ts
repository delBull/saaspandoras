'use server';

import crypto from "crypto";

import { db } from "@/db";
import { schedulingSlots, schedulingBookings, users, marketingLeads, clients, projects } from "@/db/schema";
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
        
        let slots;
        try {
            slots = await db.select({
                id: schedulingSlots.id,
                userId: schedulingSlots.userId,
                startTime: schedulingSlots.startTime,
                endTime: schedulingSlots.endTime,
                isBooked: schedulingSlots.isBooked,
                reservedUntil: schedulingSlots.reservedUntil,
                reservedBy: schedulingSlots.reservedBy,
                type: schedulingSlots.type,
                createdAt: schedulingSlots.createdAt,
                updatedAt: schedulingSlots.updatedAt,
            })
            .from(schedulingSlots)
            .where(
                and(
                    eq(schedulingSlots.userId, userId),
                    eq(schedulingSlots.isBooked, false),
                    gte(schedulingSlots.startTime, bufferTime),
                    or(
                      lt(schedulingSlots.reservedUntil, now),
                      sql`${schedulingSlots.reservedUntil} IS NULL`
                    )
                )
            )
            .orderBy(desc(schedulingSlots.startTime));
        } catch (dbErr: any) {
            if (dbErr?.message?.includes('reserved_until') || dbErr?.message?.includes('reserved_by') || dbErr?.code === '42703') {
                console.error('[Scheduler] 🚨 SCHEMA CAPABILITY ERROR: Neon database is missing reserved_until / reserved_by columns. Migration 0049 required.');
                return { success: false, error: "Scheduling unavailable: schema migration required (missing reserved_until/reserved_by)" };
            }
            throw dbErr;
        }

        if (!slots || slots.length === 0) {
            const { SovereignCalendarEngine } = await import('@/lib/scheduling/sovereign-calendar-engine');
            const dynamicSlots = await SovereignCalendarEngine.calculateDynamicSlots({ hostUserId: userId });
            const mappedSlots = dynamicSlots.map((s) => ({
                id: `dyn_${userId}_${new Date(s.startTime).getTime()}_${new Date(s.endTime).getTime()}`,
                userId: userId,
                startTime: new Date(s.startTime),
                endTime: new Date(s.endTime),
                isBooked: false,
                reservedUntil: null,
                reservedBy: null,
                type: `${s.durationMinutes}_min`,
                createdAt: new Date(),
                updatedAt: new Date(),
            }));
            return { success: true, slots: mappedSlots };
        }

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
        if (!session?.address || !await isAdmin(session.address)) {
            throw new Error("Unauthorized");
        }

        // NOTE: No drizzle relation is defined for scheduling_slots →
        // scheduling_bookings, so `.with({ bookings: true })` would throw at
        // runtime. Fetch slots + bookings manually to keep the same shape.
        const slots = await db.select()
            .from(schedulingSlots)
            .where(eq(schedulingSlots.userId, userId))
            .orderBy(desc(schedulingSlots.startTime));

        const slotsWithBookings = await Promise.all(
            slots.map(async (slot) => {
                const bookings = await db.select()
                    .from(schedulingBookings)
                    .where(eq(schedulingBookings.slotId, slot.id))
                    .limit(1);
                return { ...slot, bookings };
            })
        );

        return { success: true, slots: slotsWithBookings };
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

        // Pre-fetch project discord webhook (non-blocking for notif)
        let projectWebhookUrl: string | null = null;
        try {
            const [proj] = await db.select({ discordWebhookUrl: projects.discordWebhookUrl })
                .from(projects)
                .where(eq(projects.id, projectId));
            if (proj?.discordWebhookUrl) projectWebhookUrl = proj.discordWebhookUrl;
        } catch { /* non-blocking */ }

        // 0. Dynamic Slot & Atomic Hold Execution
        if (slotId.startsWith('dyn_')) {
            const parts = slotId.split('_');
            const hostUserId = parts[1] || 'usr_platform_admin_default';
            const startMs = parts[2] || '0';
            const endMs = parts[3] || '0';
            const slotStartTime = new Date(Number(startMs));
            const slotEndTime = new Date(Number(endMs));

            const { SovereignCalendarEngine } = await import('@/lib/scheduling/sovereign-calendar-engine');
            const holdResult = await SovereignCalendarEngine.acquireAtomicHold({
                hostUserId,
                startTime: slotStartTime,
                endTime: slotEndTime,
                heldBy: normalizedEmail,
                holdMinutes: 15,
                idempotencyKey: leadData.fingerprint || normalizedEmail,
            });

            if (!holdResult.success || !holdResult.holdId) {
                return { success: false, error: holdResult.message || "Slot no longer available or held by another person" };
            }

            const bookResult = await SovereignCalendarEngine.executeIdempotentBooking({
                holdId: holdResult.holdId,
                idempotencyKey: leadData.fingerprint || normalizedEmail,
                leadName: leadData.name,
                leadEmail: normalizedEmail,
                leadPhone: leadData.phone,
                notificationPreference: leadData.preference,
                notes: leadData.notes,
            });

            if (!bookResult.success || !bookResult.bookingId) {
                return { success: false, error: bookResult.error || "Failed to process booking" };
            }

            // Centralized pipeline sync (Idempotent scoring + CRM + Email w/ brand & ICS + Telegram + WhatsApp)
            const { syncBookingToPipeline } = await import('@/lib/scheduling/syncBookingPipeline');
            await syncBookingToPipeline({
                bookingId: bookResult.bookingId,
                slotStartTime,
                slotEndTime,
                leadData,
                meetingLink: bookResult.meetingLink,
                projectId,
                hostUserId,
            });

            return { success: true, bookingId: bookResult.bookingId };
        }

        if (slotId.startsWith('hold_')) {
            const { SovereignCalendarEngine } = await import('@/lib/scheduling/sovereign-calendar-engine');
            const bookResult = await SovereignCalendarEngine.executeIdempotentBooking({
                holdId: slotId,
                idempotencyKey: leadData.fingerprint || normalizedEmail,
                leadName: leadData.name,
                leadEmail: normalizedEmail,
                leadPhone: leadData.phone,
                notificationPreference: leadData.preference,
                notes: leadData.notes,
            });

            if (!bookResult.success || !bookResult.bookingId) {
                return { success: false, error: bookResult.error || "Failed to process booking" };
            }

            // Retrieve slot details to ensure accurate calendar notifications
            const [heldSlot] = await db
                .select()
                .from(schedulingSlots)
                .where(eq(schedulingSlots.id, slotId))
                .limit(1);

            const { syncBookingToPipeline } = await import('@/lib/scheduling/syncBookingPipeline');
            await syncBookingToPipeline({
                bookingId: bookResult.bookingId,
                slotStartTime: heldSlot ? heldSlot.startTime : new Date(),
                slotEndTime: heldSlot ? heldSlot.endTime : new Date(Date.now() + 30 * 60000),
                leadData,
                meetingLink: bookResult.meetingLink,
                projectId,
                hostUserId: heldSlot?.userId,
            });

            return { success: true, bookingId: bookResult.bookingId };
        }

        // 1. ATOMIC TRANSACTION: Lock slot FIRST
        return await db.transaction(async (tx) => {
          let updatedSlot;
          try {
            const [res] = await tx.update(schedulingSlots)
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
            updatedSlot = res;
          } catch (slotErr: any) {
            if (slotErr?.message?.includes('reserved_until') || slotErr?.message?.includes('reserved_by') || slotErr?.code === '42703') {
              console.error('[Scheduler] 🚨 SCHEMA CAPABILITY ERROR in bookSlot: missing reservation columns. Aborting to prevent phantom booking.');
              return { success: false, error: "Scheduling unavailable: schema migration required (missing reserved_until/reserved_by)" };
            }
            throw slotErr;
          }

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
              status: "confirmed",
              confirmedAt: new Date()
          });

          // 3. Centralized Pipeline Sync & Multi-channel notifications
          const { syncBookingToPipeline } = await import('@/lib/scheduling/syncBookingPipeline');
          await syncBookingToPipeline({
              bookingId,
              slotStartTime: updatedSlot.startTime,
              slotEndTime: updatedSlot.endTime,
              leadData,
              projectId,
              hostUserId: updatedSlot.userId
          });

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
    const expiry = new Date(now.getTime() + 15 * 60 * 1000); // 15 min

    // 0. Dynamic Slot Atomic Hold
    if (slotId.startsWith('dyn_')) {
      const parts = slotId.split('_');
      const hostUserId = parts[1] || 'usr_platform_admin_default';
      const startMs = parts[2] || '0';
      const endMs = parts[3] || '0';
      const { SovereignCalendarEngine } = await import('@/lib/scheduling/sovereign-calendar-engine');
      const holdResult = await SovereignCalendarEngine.acquireAtomicHold({
        hostUserId,
        startTime: new Date(Number(startMs)),
        endTime: new Date(Number(endMs)),
        heldBy: reservePayload.identifier,
        holdMinutes: 15,
        idempotencyKey: reservePayload.identifier,
      });

      if (!holdResult.success) {
        return { success: false, error: holdResult.message || "Slot already taken or locked" };
      }

      return { success: true, holdId: holdResult.holdId, expiresAt: holdResult.expiresAt };
    }
    
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
  } catch (error: any) {
    if (error?.message?.includes('reserved_until') || error?.message?.includes('reserved_by') || error?.code === '42703') {
      console.error('[Scheduler] 🚨 SCHEMA CAPABILITY ERROR in holdSlotForBooking: missing reservation columns.');
      return { success: false, error: "Scheduling unavailable: schema migration required (missing reserved_until/reserved_by)" };
    }
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
        if (!session?.address || !await isAdmin(session.address)) {
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
 * Seed: Generate default slots for the next 2 weeks
 */
export async function seedDefaultSlots(userId: string) {
    try {
        const { session } = await getAuth(await headers());
        if (!session?.address || !await isAdmin(session.address)) {
            return { success: false, error: "Unauthorized" };
        }

        if (!userId) return { success: false, error: "User ID required" };

        const now = new Date();
        const slots: { start: Date; end: Date }[] = [];
        const startHour = 9;  // 9:00 AM
        const endHour = 17;   // 5:00 PM
        const slotDuration = 60; // 60 minutes per slot

        // Generate next 14 days
        for (let day = 3; day < 17; day++) {
            const date = new Date(now);
            date.setDate(date.getDate() + day);
            
            // Skip weekends (0 = Sunday, 6 = Saturday)
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            for (let hour = startHour; hour < endHour; hour += slotDuration / 60) {
                const start = new Date(date);
                start.setHours(hour, 0, 0, 0);

                const end = new Date(date);
                end.setHours(hour + slotDuration / 60, 0, 0, 0);

                slots.push({ start, end });
            }
        }

        if (slots.length === 0) return { success: false, error: "No slots generated" };

        await db.insert(schedulingSlots).values(
            slots.map(s => ({
                userId,
                startTime: s.start,
                endTime: s.end,
                isBooked: false,
                type: '30_min'
            }))
        );

        return { success: true, count: slots.length };
    } catch (error) {
        console.error("[Scheduler] Seed slots failed:", error);
        return { success: false, error: "Failed to seed slots" };
    }
}

/**
 * Action: Confirm Booking
 */
export async function confirmBooking(bookingId: string) {
    try {
        const { session } = await getAuth(await headers());
        if (!session?.address || !await isAdmin(session.address)) {
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
        if (!session?.address || !await isAdmin(session.address)) {
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
        if (!session?.address || !await isAdmin(session.address)) {
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
        if (!alias) return { success: false, error: "Empty alias" };
        const cleanAlias = alias.trim();

        // 1. Static Aliases for Landing Pages
        // Added 'pandoras' for generic scheduling link
        const LANDING_ALIASES = ["founders", "protocol", "protocol-story", "start", "utility-protocol", "pandoras"];

        if (LANDING_ALIASES.includes(cleanAlias.toLowerCase())) {
            // Map to the Lead Admin in DB with fallback to first user
            const admin = await db.query.users.findFirst({
                where: or(eq(users.role, 'super_admin'), eq(users.role, 'admin'))
            }) || await db.query.users.findFirst();
            if (admin) return { success: true, userId: admin.id, name: "Equipo Pandora's" };
        }

        // 2. Direct User ID check (UUID / User ID)
        const user = await db.query.users.findFirst({
            where: eq(users.id, cleanAlias)
        });

        if (user) {
            return { success: true, userId: user.id, name: user.name || "Usuario" };
        }

        // 3. Tenant / Project Lookup (by slug, organizationId UUID, or numeric ID)
        const isNumeric = /^\d+$/.test(cleanAlias);
        const isUuidVal = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanAlias);
        const project = await db.query.projects.findFirst({
            where: or(
                eq(projects.slug, cleanAlias),
                eq(projects.slug, cleanAlias.toLowerCase()),
                ...(isUuidVal ? [eq(projects.organizationId, cleanAlias)] : []),
                ...(isNumeric ? [eq(projects.id, parseInt(cleanAlias, 10))] : [])
            )
        });

        if (project) {
            // Find owner user from applicant wallet address
            if (project.applicantWalletAddress) {
                const ownerUser = await db.query.users.findFirst({
                    where: eq(users.walletAddress, project.applicantWalletAddress.toLowerCase())
                });
                if (ownerUser) {
                    return { success: true, userId: ownerUser.id, name: project.title || ownerUser.name || "Equipo" };
                }
            }

            // Fallback to platform admin or any available user
            const adminUser = await db.query.users.findFirst({
                where: or(eq(users.role, 'super_admin'), eq(users.role, 'admin'))
            }) || await db.query.users.findFirst();
            if (adminUser) {
                return { success: true, userId: adminUser.id, name: project.title || "Equipo" };
            }
        }

        // 4. Username lookup
        const userByUsername = await db.query.users.findFirst({
            where: eq(users.username, cleanAlias)
        });
        if (userByUsername) {
            return { success: true, userId: userByUsername.id, name: userByUsername.name || userByUsername.username || "Usuario" };
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
    if (!session?.address || !await isAdmin(session.address)) throw new Error("Unauthorized");

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
    if (!session?.address || !await isAdmin(session.address)) throw new Error("Unauthorized");

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

/**
 * Action: Get Tenant Calendar Config
 */
export async function getTenantCalendarConfig(tenantSlug: string, hostUserId?: string) {
  const { SovereignCalendarEngine } = await import('@/lib/scheduling/sovereign-calendar-engine');
  return await SovereignCalendarEngine.resolveConfig({ tenantSlug, hostUserId });
}

/**
 * Action: Save Tenant Calendar Config
 */
export async function saveTenantCalendarConfig(tenantSlug: string, config: any) {
  const { SovereignCalendarEngine } = await import('@/lib/scheduling/sovereign-calendar-engine');
  return await SovereignCalendarEngine.saveConfig({ tenantSlug, config });
}

