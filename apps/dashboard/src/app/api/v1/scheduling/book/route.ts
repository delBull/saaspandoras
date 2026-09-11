import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { schedulingSlots } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SovereignCalendarEngine } from '@/lib/scheduling/sovereign-calendar-engine';
import { syncBookingToPipeline } from '@/lib/scheduling/syncBookingPipeline';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      holdId,
      idempotencyKey,
      leadName,
      leadEmail,
      leadPhone,
      notificationPreference = 'email',
      notes,
      tenantSlug,
      projectId,
    } = body;

    if (!holdId || !leadName || !leadEmail) {
      return NextResponse.json(
        { ok: false, error: 'holdId, leadName, and leadEmail are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(leadEmail).toLowerCase().trim();

    // 1. Finalize the booking atomically and idempotently
    const bookResult = await SovereignCalendarEngine.executeIdempotentBooking({
      holdId,
      idempotencyKey: idempotencyKey || cleanEmail,
      leadName,
      leadEmail: cleanEmail,
      leadPhone,
      notificationPreference,
      notes,
    });

    if (!bookResult.success || !bookResult.bookingId) {
      return NextResponse.json(
        { ok: false, error: bookResult.error || 'Failed to complete booking' },
        { status: 409 }
      );
    }

    // 2. Fetch the slot details for exact time intervals
    const [slot] = await db
      .select()
      .from(schedulingSlots)
      .where(eq(schedulingSlots.id, holdId))
      .limit(1);

    const slotStartTime = slot ? slot.startTime : new Date();
    const slotEndTime = slot ? slot.endTime : new Date(Date.now() + 30 * 60000);

    // 3. Centralized Pipeline Sync (Marketing Lead + CRM + Multi-channel Branded Notifications)
    await syncBookingToPipeline({
      bookingId: bookResult.bookingId,
      slotStartTime,
      slotEndTime,
      leadData: {
        name: leadName,
        email: cleanEmail,
        phone: leadPhone,
        preference: notificationPreference,
        notes,
        fingerprint: idempotencyKey,
      },
      meetingLink: bookResult.meetingLink,
      projectId: typeof projectId === 'number' ? projectId : undefined,
      tenantSlug,
      hostUserId: slot?.userId,
    });

    return NextResponse.json({
      ok: true,
      bookingId: bookResult.bookingId,
      meetingLink: bookResult.meetingLink,
      isDuplicate: bookResult.isDuplicate || false,
    });
  } catch (error: any) {
    console.error('[POST /api/v1/scheduling/book] Error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
