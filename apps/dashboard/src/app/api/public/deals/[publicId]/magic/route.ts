import { NextResponse } from "next/server";
import { getRoomByPublicId, markMagicSent } from "@/lib/nexus-deals/repo";
import { generateDealToken } from "@/lib/nexus-deals/tokens";
import { sendDealMagicLink } from "@/lib/nexus-deals/email";
import { KIND_LABEL } from "@/lib/nexus-deals/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://dash.pandoras.finance";

// Simple rate-limit en memoria (edge-friendly)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 30000;

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown-ip";
    const now = Date.now();
    const last = rateLimitMap.get(ip);
    if (last && now - last < RATE_LIMIT_COOLDOWN_MS) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Espera unos segundos." },
        { status: 429 }
      );
    }
    rateLimitMap.set(ip, now);

    const { email } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Proporciona un correo válido." }, { status: 400 });
    }

    const room = await getRoomByPublicId((await params).publicId);
    if (!room) {
      // No revelar existencia
      return NextResponse.json({ ok: true });
    }

    const cleanEmail = email.trim().toLowerCase();
    const signer = room.signers.find((s) => s.email.toLowerCase() === cleanEmail);

    // 🔒 CANDADO: solo los emails registrados como signers pueden desbloquear el documento.
    if (!signer) {
      // No revelar que existe el email (evita enumeración)
      return NextResponse.json({ ok: true });
    }

    const token = generateDealToken(room.id, room.publicId, cleanEmail);
    const magicUrl = `${BASE_URL}/deal/${room.publicId}?token=${encodeURIComponent(token)}`;

    try {
      await sendDealMagicLink({
        to: cleanEmail,
        firstName: cleanEmail.split("@")[0],
        dealKindLabel: KIND_LABEL[room.kind],
        counterparty: room.counterparty,
        publicUrl: magicUrl,
      });
      await markMagicSent(room.id, cleanEmail);
    } catch (e: any) {
      console.error("❌ [Deals] magic email failed:", e.message);
      return NextResponse.json({ ok: false, error: "No se pudo enviar el correo." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
