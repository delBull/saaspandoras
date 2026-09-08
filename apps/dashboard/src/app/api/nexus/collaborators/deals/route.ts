/**
 * GET /api/nexus/collaborators/deals?email=xxx
 * Returns all Deal Rooms linked to a collaborator by email (as signer or counterparty)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNexusAdmin } from '@/lib/nexus/collaborators-service';
import { db } from '@/db';
import { nexusDealRooms, nexusDealSigners } from '@/db/schema';
import { eq, or, ilike, inArray } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await requireNexusAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 403 });
    }

    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find rooms where this email appears as a signer
    const signerRows = await db
      .select({ roomId: nexusDealSigners.roomId, signerStatus: nexusDealSigners.status })
      .from(nexusDealSigners)
      .where(eq(nexusDealSigners.email, normalizedEmail));

    const signerRoomIds = signerRows.map((s) => s.roomId);

    // Also find rooms where email appears as counterparty
    const counterpartyRooms = await db.query.nexusDealRooms.findMany({
      where: ilike(nexusDealRooms.counterparty, `%${normalizedEmail}%`),
      with: { signers: true },
      columns: { id: true, publicId: true, title: true, kind: true, status: true, counterparty: true, createdAt: true, updatedAt: true },
    });

    // Fetch signer rooms
    let signerRooms: typeof counterpartyRooms = [];
    if (signerRoomIds.length > 0) {
      signerRooms = await db.query.nexusDealRooms.findMany({
        where: inArray(nexusDealRooms.id, signerRoomIds),
        with: { signers: true },
        columns: { id: true, publicId: true, title: true, kind: true, status: true, counterparty: true, createdAt: true, updatedAt: true },
      });
    }

    // Merge and deduplicate
    const allRooms = [...counterpartyRooms, ...signerRooms];
    const seen = new Set<string>();
    const deduped = allRooms.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    // Enrich with this collaborator's signer status
    const enriched = deduped.map((room) => {
      const signerRow = signerRows.find((s) => s.roomId === room.id);
      const mySignerRecord = (room.signers as { email: string; status: string }[])?.find(
        (s) => s.email === normalizedEmail
      );
      return {
        ...room,
        myRole: signerRow || mySignerRecord ? 'SIGNER' : 'COUNTERPARTY',
        mySignStatus: mySignerRecord?.status ?? null,
      };
    });

    return NextResponse.json({ ok: true, rooms: enriched });
  } catch (error: any) {
    console.error('[Collaborator Deals] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
