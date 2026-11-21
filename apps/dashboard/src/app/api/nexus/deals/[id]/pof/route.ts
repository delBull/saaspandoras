import { NextResponse } from "next/server";
import { validateDealRoomAccess } from "@/lib/admin-auth";
import { canUserAccessDeal, getRoom } from "@saasfly/nexus-deals-sdk";
import { db } from "@saasfly/db";
import { nexusDealPofDocuments } from "@saasfly/db/schema";
import { and, desc, eq } from "@saasfly/db-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/nexus/deals/[id]/pof?email=...`
 * Descarga el último POF subido por ese firmante. Solo el equipo con acceso al deal.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;

  const email = (new URL(request.url).searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Falta email" }, { status: 400 });

  try {
    const room = await getRoom((await params).id);
    if (!room) return NextResponse.json({ error: "Room no encontrada" }, { status: 404 });

    const isSuperAdmin = session?.role === "SUPER_ADMIN";
    const userIdentifier = session?.address || session?.userId || "";
    if (!canUserAccessDeal(room, userIdentifier, session?.email, isSuperAdmin)) {
      return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    }

    const [doc] = await db
      .select()
      .from(nexusDealPofDocuments)
      .where(and(eq(nexusDealPofDocuments.roomId, room.id), eq(nexusDealPofDocuments.signerEmail, email)))
      .orderBy(desc(nexusDealPofDocuments.uploadedAt))
      .limit(1);

    if (!doc) return NextResponse.json({ error: "Sin POF para ese correo" }, { status: 404 });

    return new NextResponse(new Uint8Array(doc.content), {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${doc.filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("[POF] download error:", error);
    return NextResponse.json({ error: "No se pudo descargar el POF" }, { status: 500 });
  }
}
