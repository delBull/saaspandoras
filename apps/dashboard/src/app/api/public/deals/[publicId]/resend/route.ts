import { NextResponse } from 'next/server';
import { getRoomByPublicId, verifyDealToken } from '@saasfly/nexus-deals-sdk';
import { afterSignature } from '@/lib/nexus/after-signature';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `POST /api/public/deals/[publicId]/resend` { token }
 *
 * Reenvía al firmante su copia firmada (mismo correo y mismo PDF que se envía al
 * firmar). Existe porque el envío puede fallar por un corte del proveedor y hoy
 * no había forma de recuperarlo: dos firmantes de salas antiguas se quedaron sin
 * su PDF.
 *
 * Seguridad:
 *  - exige el token del firmante (el mismo del magic link) y que sea de esa sala,
 *  - exige que la firma exista (no se manda nada a quien no firmó),
 *  - deja el envío registrado en `document_sent_at`.
 */
export async function POST(req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;

  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
  }

  const token = typeof body.token === 'string' ? body.token : '';
  const payload = token ? verifyDealToken(token) : null;
  if (!payload || payload.sub !== publicId) {
    return NextResponse.json({ ok: false, error: 'INVALID_TOKEN' }, { status: 401 });
  }

  const room = await getRoomByPublicId(publicId);
  if (!room) {
    return NextResponse.json({ ok: false, error: 'ROOM_NOT_FOUND' }, { status: 404 });
  }

  const email = String(payload.email || '').toLowerCase().trim();
  const signer = (room.signers ?? []).find(
    (s: { email: string }) => String(s.email || '').toLowerCase() === email,
  );

  if (!signer || !signer.signedAt) {
    return NextResponse.json(
      { ok: false, error: 'NOT_SIGNED', message: 'Todavía no hay una firma registrada con ese correo.' },
      { status: 409 },
    );
  }

  const result = await afterSignature({
    room,
    signerEmail: email,
    name: signer.signatureName || email,
    phone: signer.signaturePhone ?? null,
    company: signer.signatureCompany ?? null,
    role: signer.signatureRole ?? null,
    wallet: signer.wallet ?? null,
    signature: signer.signature ?? null,
    signedAt: signer.signedAt ? new Date(signer.signedAt) : null,
  });

  if (!result.emailed) {
    return NextResponse.json(
      { ok: false, error: 'EMAIL_FAILED', message: 'No se pudo enviar el correo. Intenta de nuevo en unos minutos.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, emailed: true, attached: result.attached });
}
