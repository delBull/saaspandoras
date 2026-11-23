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
    const bytes = await buildRoomPdf({
      title: room.title,
      subtitle: `${room.kind} · ${room.company}`,
      dealId: room.publicId,
      counterparty: room.counterparty,
      sections: room.sections.map((section) => ({ title: section.title, content: section.content })),
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
