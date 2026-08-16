import { NextResponse } from 'next/server';
import { db } from '@/db';
import { nexusDealComments, nexusDealRooms, nexusDealSigners } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { resend } from '@/lib/email/client'; // Assuming resend is exported from here
import NexusDealComment from '@/emails/NexusDealComment';

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    const { author, content } = await request.json();

    if (!author || !content) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
    }

    // Insert comment
    const [comment] = await db.insert(nexusDealComments).values({
      roomId,
      author,
      content,
    }).returning();

    // Fetch room to get title and signers
    const room = await db.query.nexusDealRooms.findFirst({
      where: eq(nexusDealRooms.id, roomId),
      with: {
        signers: true,
      }
    });

    if (room) {
      // Logic to notify counterparties
      // If author is the user (e.g. from Pandoras), we notify all signers
      // If author is a signer, we notify the internal Pandoras team (or the counterparty field)
      
      const isInternal = author.toLowerCase().includes('pandoras') || author.toLowerCase().includes('marco');
      
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
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    
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
