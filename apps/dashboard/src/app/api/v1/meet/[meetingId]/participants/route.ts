import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db';
import { clients, meetingParticipants, meetings, nexusDealRooms } from '@saasfly/db/schema';
import { eq } from '@saasfly/db-core';
import { sendEmail } from '@/lib/email/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/v1/meet/[meetingId]/participants
 *
 * El host añade participantes por email desde la reunión:
 *  1. Guarda el participante con su email.
 *  2. Si la reunión tiene deal room asociado, hace **upsert del cliente en el CRM**
 *     (status `negotiating`) enlazado a ese Deal Room.
 *  3. Envía por email el enlace al Deal Room (documento de aceptación incluido).
 *
 * Sin email no se inventa nada: el participante anónimo se guarda sin correo.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  const headers = await import('next/headers').then((m) => m.headers());
  const auth = await getNexusAuthContext(headers);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ ok: false, error: 'Sesión de Nexus requerida' }, { status: 401 });
  }

  let body: { email?: unknown; name?: unknown; role?: unknown; dealRoomPublicId?: unknown; presentationId?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'email válido requerido' }, { status: 422 });
  }

  const [meeting] = await db
    .select({
      id: meetings.id,
      dealRoomId: meetings.dealRoomId,
      presentationId: meetings.presentationId,
    })
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  if (!meeting) return NextResponse.json({ ok: false, error: 'Reunión no encontrada' }, { status: 404 });

  // Deck asociado (p. ej. "celeste") para el botón "Presentar en vivo".
  if (typeof body.presentationId === 'string' && body.presentationId.trim()) {
    await db.update(meetings).set({ presentationId: body.presentationId.trim() }).where(eq(meetings.id, meetingId));
  }

  // Si el host indica el Deal Room por su publicId, se asocia a la reunión.
  let dealRoomId = meeting.dealRoomId;
  if (!dealRoomId && typeof body.dealRoomPublicId === 'string' && body.dealRoomPublicId.trim()) {
    const [room] = await db
      .select({ id: nexusDealRooms.id })
      .from(nexusDealRooms)
      .where(eq(nexusDealRooms.publicId, body.dealRoomPublicId.trim().toUpperCase()))
      .limit(1);
    if (room?.id) {
      dealRoomId = room.id;
      await db.update(meetings).set({ dealRoomId }).where(eq(meetings.id, meetingId));
    }
  }

  // 1) Participante
  const [participant] = await db
    .insert(meetingParticipants)
    .values({
      id: crypto.randomUUID(),
      meetingId,
      email,
      role: typeof body.role === 'string' ? (body.role as any) : 'guest',
      participantType: 'anonymous_guest',
      followUpStatus: 'pending',
    })
    .returning({ id: meetingParticipants.id });

  // 2) Deal room + CRM
  let publicId: string | null = null;
  let company: string | null = null;

  if (dealRoomId) {
    const [room] = await db
      .select({ publicId: nexusDealRooms.publicId, company: nexusDealRooms.company })
      .from(nexusDealRooms)
      .where(eq(nexusDealRooms.id, dealRoomId))
      .limit(1);

    publicId = room?.publicId ?? null;
    company = room?.company ?? null;

    if (publicId) {
      // Upsert del cliente por email (no se duplica si ya existe).
      const [existing] = await db.select({ id: clients.id }).from(clients).where(eq(clients.email, email)).limit(1);
      if (!existing) {
        await db.insert(clients).values({
          id: crypto.randomUUID(),
          email,
          name: name || company || email,
          status: 'negotiating',
          package: 'growth-managed-90d',
          source: 'nexus_meet',
          notes: `Deal Room ${publicId}${company ? ` · ${company}` : ''}`,
        });
      }
    }
  }

  // 3) Email con el Deal Room (contiene el documento de aceptación)
  let emailed = false;
  if (publicId) {
    try {
      await sendEmail({
        to: email,
        from: "Pandora's Group <hello@pandoras.finance>",
        subject: `Propuesta y documento de aceptación — ${company ?? 'Celeste'}`,
        html: `
          <div style="font-family:Helvetica,Arial,sans-serif;background:#0b0b12;color:#e5e7eb;padding:28px;border-radius:14px">
            <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#a78bfa;margin:0 0 10px">Pandora's · Propuesta</p>
            <h1 style="font-size:20px;margin:0 0 10px;color:#fff">Gracias por la reunión${name ? `, ${name}` : ''}</h1>
            <p style="font-size:14px;line-height:1.6;margin:0 0 14px">
              Aquí tienes la propuesta completa y el documento de aceptación de la colaboración.
            </p>
            <a href="https://dash.pandoras.finance/deal/${publicId}"
               style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:700">
              Abrir Deal Room ${publicId}
            </a>
            <p style="font-size:11px;color:#6b7280;margin-top:18px">Si tienes dudas, responde a este correo.</p>
          </div>`,
      });
      emailed = true;
    } catch (error: unknown) {
      console.error('[MeetParticipants] Email failed:', error);
    }
  }

  return NextResponse.json({
    ok: true,
    participantId: participant?.id ?? null,
    dealRoomPublicId: publicId,
    clientCreated: Boolean(publicId),
    emailed,
    warning: publicId ? null : 'La reunión no tiene Deal Room asociado: no se envió documento de aceptación.',
  });
}
