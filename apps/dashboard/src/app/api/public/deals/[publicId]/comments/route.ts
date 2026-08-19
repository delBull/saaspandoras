import { NextResponse } from "next/server";
import { getRoomByPublicId } from "@/lib/nexus-deals/repo";
import { verifyDealToken } from "@/lib/nexus-deals/tokens";
import { db } from "@/db";
import { nexusDealComments } from "@/db/schema";
import { sendDealRoomCommentAlert } from "@/lib/nexus-deals/discord";
import { eq, desc, and } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function verifySignerAccess(request: Request, publicId: string) {
  const room = await getRoomByPublicId(publicId);
  if (!room) return { error: NextResponse.json({ error: "Documento no encontrado" }, { status: 404 }) };

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  
  if (room.openSign && (!token || typeof token !== "string")) {
    // In openSign without token, we'll just allow it if they provide a wallet header
    const wallet = request.headers.get("x-signer-wallet");
    if (!wallet) return { error: NextResponse.json({ error: "Falta wallet para autorización openSign" }, { status: 401 }) };
    return { room, author: wallet.toLowerCase() };
  }

  if (!token) return { error: NextResponse.json({ error: "Token requerido" }, { status: 401 }) };

  const payload = verifyDealToken(token);
  if (!payload || payload.sub !== publicId) {
    return { error: NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 }) };
  }

  const signer = room.signers.find((s) => s.email.toLowerCase() === payload.email.toLowerCase());
  if (!signer) {
    return { error: NextResponse.json({ error: "No autorizado para este documento" }, { status: 403 }) };
  }

  return { room, author: payload.email.toLowerCase() };
}

export async function GET(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await params;
    const { room, error } = await verifySignerAccess(request, publicId);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const sectionCode = searchParams.get("sectionCode");

    let query = db.select().from(nexusDealComments).where(eq(nexusDealComments.roomId, room.id));
    if (sectionCode) {
      query = db.select().from(nexusDealComments).where(
        and(eq(nexusDealComments.roomId, room.id), eq(nexusDealComments.sectionCode, sectionCode))
      );
    }

    const comments = await query.orderBy(desc(nexusDealComments.createdAt));

    return NextResponse.json({ comments });
  } catch (e: any) {
    console.error("❌ [Deals] comments GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await params;
    const { room, author, error } = await verifySignerAccess(request, publicId);
    if (error) return error;

    const { sectionCode, content } = await request.json();

    if (!sectionCode || !content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const [comment] = await db.insert(nexusDealComments).values({
      roomId: room.id,
      sectionCode,
      author: author,
      content: content.trim(),
    }).returning();

    if (!comment) throw new Error("Failed to create comment");

    // Alert Discord
    await sendDealRoomCommentAlert({
      roomLabel: `${room.publicId} · ${room.counterparty}`,
      sectionCode,
      author,
      content: comment.content,
    });

    return NextResponse.json({ comment });
  } catch (e: any) {
    console.error("❌ [Deals] comments POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
