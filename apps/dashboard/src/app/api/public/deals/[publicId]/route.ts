import { NextResponse } from "next/server";
import { getRoomByPublicId, publicRoomView } from "@/lib/nexus-deals/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { publicId: string } }) {
  try {
    const room = await getRoomByPublicId(params.publicId);
    if (!room) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ room: publicRoomView(room) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
