import { NextResponse } from "next/server";
import { getNdaConfig, getRoomByPublicId } from "@saasfly/nexus-deals-sdk";
import { buildNdaPdf } from "@/lib/nexus/nda-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/public/deals/[publicId]/nda/pdf` — descarga real del acuerdo.
 *
 * El PDF se compone en el servidor con carta y márgenes de 2 cm, así que no
 * depende del diálogo de impresión (papel, escala, zoom): es el mismo archivo
 * para todos y se descarga con su nombre.
 *
 * Público a propósito: el texto ya se muestra antes de firmar y no contiene PII
 * (la contraparte es el nombre del deal, no la persona).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const room = await getRoomByPublicId(publicId);
  if (!room) {
    return NextResponse.json({ error: "Deal no encontrado." }, { status: 404 });
  }

  const cfg = getNdaConfig(room.ndaVersion);

  try {
    const bytes = await buildNdaPdf({
      title: cfg.title,
      subtitle: cfg.subtitle,
      version: cfg.version,
      dealId: room.publicId,
      counterparty: room.counterparty,
      fullText: cfg.fullText,
    });

    const filename = `NDA-${room.publicId}-${cfg.version}`.replace(/[^A-Za-z0-9._-]/g, "-");
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
    console.error("[nda/pdf] no se pudo generar el PDF:", error);
    return NextResponse.json({ error: "No se pudo generar el PDF." }, { status: 500 });
  }
}
