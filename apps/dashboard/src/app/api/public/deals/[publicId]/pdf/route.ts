import { NextResponse } from "next/server";
import { getRoomByPublicId } from "@saasfly/nexus-deals-sdk";
import { buildRoomPdf } from "@/lib/nexus/room-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/public/deals/[publicId]/pdf` — PDF de la sala completa.
 *
 * Sirve para contratos y acuerdos: mismo compositor que el NDA (carta, márgenes
 * de 2 cm, paginación), con el texto de las secciones de la sala. No usa el
 * diálogo de impresión, que recortaba el documento en layouts con overflow.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const room = await getRoomByPublicId(publicId);
  if (!room) {
    return NextResponse.json({ error: "Deal no encontrado." }, { status: 404 });
  }

  try {
    // Si el cliente ya firmó, el documento se emite con sus datos de firma
    // (denominación, representante, fecha y hash). Si no, con la contraparte de
    // la sala y la leyenda de que se completa al firmar.
    const signed = room.signers?.find(
      (signer) => signer.status === "SIGNED" && Boolean(signer.signatureName || signer.signature),
    );

    const signature = signed
      ? {
          name: signed.signatureName ?? null,
          company: signed.signatureCompany ?? null,
          role: signed.signatureRole ?? null,
          signedAt: signed.signedAt ? new Date(signed.signedAt).toISOString() : null,
          wallet: signed.wallet ?? null,
          signature: signed.signature ?? null,
        }
      : null;

    const bytes = await buildRoomPdf({
      title: room.title,
      subtitle: `${room.kind} · ${room.company}`,
      dealId: room.publicId,
      counterparty: room.counterparty,
      sections: room.sections.map((section) => ({ title: section.title, content: section.content })),
      signature,
    });

    const filename = `${room.kind}-${room.publicId}`.replace(/[^A-Za-z0-9._-]/g, "-");
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[room/pdf] no se pudo generar el PDF:", error);
    return NextResponse.json({ error: "No se pudo generar el PDF." }, { status: 500 });
  }
}
