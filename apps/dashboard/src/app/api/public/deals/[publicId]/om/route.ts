import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@saasfly/db";
import { nexusDealSigners, nexusDealRooms, nexusDealPods } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { getRoomByPublicId, hasEmailSignedNda } from "@saasfly/nexus-deals-sdk";
import { verifyOmToken } from "@/lib/nexus/om-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/public/deals/[publicId]/om?t=<token>`
 *
 * Entrega el OM (PDF) solo si se cumplen las tres condiciones:
 *   1. Token válido y ligado a este deal + correo (7 días).
 *   2. El correo firmó el NDA de la sala.
 *   3. El POF del firmante está marcado como `verified`.
 *
 * El archivo vive en `private/deals/<code>/om.pdf` y nunca se sirve por `public/`.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await params;
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const payload = verifyOmToken(token);

  if (!payload || payload.publicId !== publicId) {
    return new NextResponse("Acceso no válido o expirado.", { status: 403 });
  }

  const room = await getRoomByPublicId(publicId);
  if (!room) return new NextResponse("Documento no encontrado.", { status: 404 });

  const signedNda = await hasEmailSignedNda(payload.email, room.ndaVersion || "v1.0");
  if (!signedNda) {
    return new NextResponse("Primero debes firmar el acuerdo de confidencialidad.", { status: 403 });
  }

  // El POF es por deal: si la sala no lo activó, el OM se libera con el NDA.
  if (room.pofEnabled) {
    const [signer] = await db
      .select({ pofStatus: nexusDealSigners.pofStatus })
      .from(nexusDealSigners)
      .where(and(eq(nexusDealSigners.roomId, room.id), eq(nexusDealSigners.email, payload.email)))
      .limit(1);

    if (!signer || signer.pofStatus !== "verified") {
      return new NextResponse("Falta la verificación de fondos (POF).", { status: 403 });
    }
  }

  if (!room.podId) {
    return new NextResponse("Este documento no está vinculado a un Deal Pod.", { status: 404 });
  }

  const [pod] = await db
    .select({ code: nexusDealPods.code })
    .from(nexusDealPods)
    .where(eq(nexusDealPods.id, room.podId))
    .limit(1);

  if (!pod) return new NextResponse("Deal Pod no encontrado.", { status: 404 });

  const filePath = path.join(process.cwd(), "private", "deals", pod.code, "om.pdf");

  try {
    const file = await readFile(filePath);
    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="OM-${pod.code}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch {
    console.error("[DealOM] Archivo no encontrado:", filePath);
    return new NextResponse("El documento no está disponible.", { status: 404 });
  }
}

// Evita que el import sin usar dé error de lint en algunos entornos.
void nexusDealRooms;
