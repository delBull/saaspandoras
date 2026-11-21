import { NextResponse } from "next/server";
import { validateDealRoomAccess } from "@/lib/admin-auth";
import { canUserEditDeal, getRoom, hasEmailSignedNda } from "@saasfly/nexus-deals-sdk";
import { db } from "@saasfly/db";
import { nexusDealSigners } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { sendEmail } from "@saasfly/shared";
import { omUrl } from "@/lib/nexus/om-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `POST /api/nexus/deals/[id]/om` { email }
 *
 * Cierra el gate del OM: exige NDA firmado, marca el POF como verificado
 * (la verificación humana ocurrió fuera del sistema) y envía el enlace de
 * descarga por correo. El archivo NO se adjunta: va por URL firmada de 7 días.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }

  try {
    const room = await getRoom((await params).id);
    if (!room) return NextResponse.json({ error: "Room no encontrada" }, { status: 404 });

    const isSuperAdmin = session?.role === "SUPER_ADMIN";
    const userIdentifier = session?.address || session?.userId || "";
    const canEdit = canUserEditDeal(room, userIdentifier, session?.email, isSuperAdmin);
    if (!canEdit) {
      return NextResponse.json({ error: "No tienes permiso para entregar el OM." }, { status: 403 });
    }

    const [signer] = await db
      .select()
      .from(nexusDealSigners)
      .where(and(eq(nexusDealSigners.roomId, room.id), eq(nexusDealSigners.email, email)))
      .limit(1);

    if (!signer) {
      return NextResponse.json({ error: "Ese correo no está registrado como firmante." }, { status: 404 });
    }

    const ndaSigned = await hasEmailSignedNda(email, room.ndaVersion || "v1.0");
    if (!ndaSigned) {
      return NextResponse.json(
        { error: "El NDA aún no está firmado por ese correo.", code: "NDA_REQUIRED" },
        { status: 409 }
      );
    }

    const url = omUrl(room.publicId, email);
    if (!url) {
      return NextResponse.json(
        { error: "Falta NEXUS_DEAL_TOKEN_SECRET para firmar el enlace.", code: "NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    const from = process.env.RESEND_FROM_EMAIL ?? "Pandora's Group <hello@pandoras.finance>";
    const emailResult = await sendEmail({
      to: email,
      from,
      subject: "OM — Proyecto Village",
      html: `<!DOCTYPE html><html lang="es"><body style="margin:0;background:#08080C;font-family:Helvetica,Arial,sans-serif;color:#fff;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#34d399;margin:0 0 12px;">AZTECAZ · Proyecto Village</p>
    <h1 style="font-size:22px;margin:0 0 12px;">Memorándum de inversión</h1>
    <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.75);margin:0 0 18px;">
      Confirmamos tu acuerdo de confidencialidad y la verificación de fondos. El memorándum está disponible
      en el siguiente enlace personal. No lo reenvíes: el acceso está ligado a tu correo.
    </p>
    <p style="margin:0 0 24px;">
      <a href="${url}" style="display:inline-block;background:#10b981;color:#04110b;text-decoration:none;font-weight:700;font-size:14px;padding:13px 24px;border-radius:10px;">
        Abrir el OM
      </a>
    </p>
    <p style="font-size:11px;line-height:1.6;color:rgba(255,255,255,0.45);margin:0;">
      El enlace expira en 7 días. Si lo pierdes, responde a este correo y lo reemitimos.
      Toda comunicación ocurre por conducto de AZTECAZ.
    </p>
  </div>
</body></html>`,
    });

    if (!emailResult?.success) {
      return NextResponse.json({ error: "No se pudo enviar el correo." }, { status: 502 });
    }

    await db
      .update(nexusDealSigners)
      .set({ pofStatus: "verified", pofVerifiedAt: new Date(), omSentAt: new Date() })
      .where(eq(nexusDealSigners.id, signer.id));

    return NextResponse.json({ ok: true, email, sent: true });
  } catch (error) {
    console.error("[DealOM] send error:", error);
    return NextResponse.json({ error: "No se pudo entregar el OM." }, { status: 500 });
  }
}
