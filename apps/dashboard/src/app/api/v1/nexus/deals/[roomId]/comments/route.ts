import { NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { nexusDealComments, nexusDealRooms, nexusDealSigners } from '@saasfly/db/schema';
import { eq } from "@saasfly/db-core";
import { resend } from '@saasfly/shared';
import NexusDealComment from '@/emails/NexusDealComment';
import { validateDealRoomAccess } from '@/lib/admin-auth';
import { canUserAccessDeal } from '@saasfly/nexus-deals-sdk';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;

  try {
    const { roomId } = await params;
    const { author, content, sectionCode = "00" } = await request.json();

    if (!author || !content) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
    }

    // ── GATE B: Cross-Deal Resource Scope Check ────────────────────────────
    // Auth validates identity, but NOT resource scope. We must verify the
    // roomId belongs to the caller before performing any write.
    const targetRoom = await db.query.nexusDealRooms.findFirst({
      where: eq(nexusDealRooms.id, roomId),
      with: { signers: true },
    });
    if (!targetRoom) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    const isSuperAdmin = session?.role === 'SUPER_ADMIN';
    const userIdentifier = session?.address || session?.userId || '';
    const userEmail = session?.email;
    if (!canUserAccessDeal(targetRoom, userIdentifier, userEmail, isSuperAdmin)) {
      // Return 404, not 403, to avoid leaking that the resource exists
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    // ──────────────────────────────────────────────────────────────────────

    // Insert comment
    const [comment] = await db.insert(nexusDealComments).values({
      roomId,
      sectionCode,
      author,
      content,
    }).returning();

    // Room already fetched + verified above — reuse
    const room = targetRoom;

    if (room) {
      // Logic to notify counterparties
      // If author is the user (e.g. from Pandoras), we notify all signers
      // If author is one of the room signers, they are external counterparty.
      // Otherwise, or if domain is @pandoras.finance or internal system alias, they are internal Pandoras team.
      const isSigner = room.signers.some(s => 
        (s.email && s.email.toLowerCase() === author.toLowerCase()) ||
        (s.signatureName && s.signatureName.toLowerCase() === author.toLowerCase())
      );
      const isInternal = !isSigner || author.toLowerCase().includes('@pandoras.finance') || author.toLowerCase().includes('pandoras');
      
      const roomUrl = `https://dash.pandoras.finance/nexus/deals/${room.publicId}`; // Adjust if actual path differs

      if (isInternal) {
        // Notify signers
        for (const signer of room.signers) {
          if (signer.email) {
            await resend.emails.send({
              from: 'Pandoras Nexus <nexus@pandoras.finance>',
              to: [signer.email],
              subject: `Nuevo mensaje en el Deal Room: ${room.company || room.counterparty}`,
              react: NexusDealComment({
                recipientName: signer.signatureName || signer.email,
                authorName: author,
                roomTitle: room.company || room.counterparty,
                commentPreview: content,
                roomUrl,
              }),
            });
          }
        }
      } else {
        // Notify Pandoras internal
        await resend.emails.send({
          from: 'Pandoras Nexus <nexus@pandoras.finance>',
          to: ['marco@pandoras.org'], // Default internal contact
          subject: `Nuevo mensaje en el Deal Room: ${room.company || room.counterparty}`,
          react: NexusDealComment({
            recipientName: 'Marco',
            authorName: author,
            roomTitle: room.company || room.counterparty,
            commentPreview: content,
            roomUrl,
          }),
        });
      }
    }

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Error in Nexus Deal Comment API:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;

  try {
    const { roomId } = await params;

    // ── GATE B: Cross-Deal Resource Scope Check (READ) ────────────────────
    const targetRoom = await db.query.nexusDealRooms.findFirst({
      where: eq(nexusDealRooms.id, roomId),
    });
    if (!targetRoom) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    const isSuperAdmin = session?.role === 'SUPER_ADMIN';
    const userIdentifier = session?.address || session?.userId || '';
    const userEmail = session?.email;
    if (!canUserAccessDeal(targetRoom, userIdentifier, userEmail, isSuperAdmin)) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    // ─────────────────────────────────────────────────────────────────────
    
    const comments = await db.query.nexusDealComments.findMany({
      where: eq(nexusDealComments.roomId, roomId),
      orderBy: (comments, { asc }) => [asc(comments.createdAt)],
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
