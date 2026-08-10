import { NextResponse } from "next/server";
import { validateDealRoomAccess } from "@/lib/admin-auth";
import { getRoom, markMagicSent, addSigners } from "@/lib/nexus-deals/repo";
import { generateDealToken } from "@/lib/nexus-deals/tokens";
import { sendDealMagicLink } from "@/lib/nexus-deals/email";
import { KIND_LABEL } from "@/lib/nexus-deals/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://dash.pandoras.finance";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;

  try {
    const room = await getRoom(params.id);
    if (!room) return NextResponse.json({ error: "Room no encontrada" }, { status: 404 });

    const body = await request.json();
    const emails: string[] = Array.isArray(body.emails)
      ? body.emails.map((e: string) => String(e).trim().toLowerCase()).filter((e: string) => e.includes("@"))
      : [];

    if (emails.length === 0) {
      return NextResponse.json({ error: "Proporciona al menos un email" }, { status: 400 });
    }

    const fresh = await addSigners(room.id, emails, session?.address ?? "unlock-token");
    if (!fresh) return NextResponse.json({ error: "Room no encontrada" }, { status: 404 });

    const base = `${BASE_URL}/deal/${room.publicId}`;
    const results: { email: string; ok: boolean; error?: string }[] = [];
    const addedEmails = new Set(
      (fresh?.signers ?? [])
        .filter((s) => s.status === "PENDING" && emails.includes(s.email.toLowerCase()))
        .map((s) => s.email.toLowerCase())
    );

    const existingSignerByEmail = new Map(
      (room.signers ?? []).map((s) => [s.email.toLowerCase(), s.status])
    );

    for (const email of emails) {
      if (existingSignerByEmail.get(email) === "SIGNED") {
        results.push({ email, ok: false, error: "Este firmante ya firmó el documento." });
        continue;
      }
      try {
        const token = generateDealToken(room.id, room.publicId, email);
        const magicUrl = `${base}?token=${encodeURIComponent(token)}`;
        await sendDealMagicLink({
          to: email,
          dealKindLabel: KIND_LABEL[room.kind],
          counterparty: room.counterparty,
          publicUrl: magicUrl,
        });
        await markMagicSent(room.id, email);
        results.push({ email, ok: true });
      } catch (e: any) {
        console.error("❌ [Deals] share email failed:", email, e.message);
        results.push({ email, ok: false, error: e.message });
      }
    }

    return NextResponse.json({ ok: true, publicUrl: base, addedCount: addedEmails.size, results });
  } catch (e: any) {
    console.error("❌ [Deals] share error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
