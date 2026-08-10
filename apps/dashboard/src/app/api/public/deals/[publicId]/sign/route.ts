import { NextResponse } from "next/server";
import { getRoomByPublicId, markViewed, signRoom } from "@/lib/nexus-deals/repo";
import { verifyDealToken } from "@/lib/nexus-deals/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { publicId: string } }) {
  try {
    const { token, name, wallet } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token requerido." }, { status: 401 });
    }

    const payload = verifyDealToken(token);
    if (!payload || payload.sub !== params.publicId) {
      return NextResponse.json({ error: "Enlace inválido o expirado." }, { status: 401 });
    }

    const room = await getRoomByPublicId(params.publicId);
    if (!room) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

    const signer = room.signers.find((s) => s.email.toLowerCase() === payload.email.toLowerCase());
    if (!signer) {
      return NextResponse.json({ error: "Tu correo no está autorizado para este documento." }, { status: 403 });
    }

    const cleanName = String(name ?? "").trim();
    if (!cleanName) {
      return NextResponse.json({ error: "Ingresa tu nombre para firmar." }, { status: 400 });
    }

    await markViewed(room.id, payload.email);
    const updated = await signRoom(room.id, payload.email, cleanName, wallet ? String(wallet).trim() : undefined);

    return NextResponse.json({ ok: true, status: updated?.status });
  } catch (e: any) {
    console.error("❌ [Deals] sign error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
