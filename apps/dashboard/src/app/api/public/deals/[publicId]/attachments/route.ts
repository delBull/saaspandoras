import { NextResponse } from "next/server";
import { getRoomByPublicId } from "@/lib/nexus-deals/repo";
import { verifyDealToken } from "@/lib/nexus-deals/tokens";
import { db } from "@/db";
import { nexusDealAttachments } from "@/db/schema";
import { sendDealRoomAttachmentAlert } from "@/lib/nexus-deals/discord";
import { eq, desc } from "drizzle-orm";
import { put } from "@vercel/blob";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function verifySignerAccess(request: Request, publicId: string) {
  const room = await getRoomByPublicId(publicId);
  if (!room) return { error: NextResponse.json({ error: "Documento no encontrado" }, { status: 404 }) };

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  
  if (room.openSign && (!token || typeof token !== "string")) {
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

    const attachments = await db.select()
      .from(nexusDealAttachments)
      .where(eq(nexusDealAttachments.roomId, room.id))
      .orderBy(desc(nexusDealAttachments.createdAt));

    return NextResponse.json({ attachments });
  } catch (e: any) {
    console.error("❌ [Deals] attachments GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await params;
    
    // Auth
    const { room, author, error } = await verifySignerAccess(request, publicId);
    if (error) return error;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Save to Vercel Blob
    const ext = path.extname(file.name);
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");
    const filename = `deal-rooms/${room.publicId}_${uniqueSuffix}${ext}`;
    
    const blob = await put(filename, buffer, {
      access: 'public',
      addRandomSuffix: false
    });
    
    const publicUrl = blob.url;

    const [attachment] = await db.insert(nexusDealAttachments).values({
      roomId: room.id,
      filename: file.name,
      url: publicUrl,
      uploadedBy: author,
    }).returning();

    // Alert Discord
    await sendDealRoomAttachmentAlert({
      roomLabel: `${room.publicId} · ${room.counterparty}`,
      filename: file.name,
      uploadedBy: author,
      url: `https://dash.pandoras.finance${publicUrl}`,
    });

    return NextResponse.json({ attachment });
  } catch (e: any) {
    console.error("❌ [Deals] attachments POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
