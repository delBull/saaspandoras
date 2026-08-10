import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth, isAdmin } from "@/lib/auth";
import { generateUnlockToken } from "@/lib/nexus-deals/tokens";
import { sendDealRoomUnlockEmbed } from "@/lib/nexus-deals/discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://dash.pandoras.finance";
const ADMIN_EMAIL = (process.env.NEXUS_ADMIN_EMAIL ?? "marco.munoz9@gmail.com").toLowerCase();

export async function POST() {
  const { session, isVerified } = await getAuth(await headers());
  const address = session?.address;

  // Admin autenticado → desbloqueo inmediato (no requiere Discord)
  if (isVerified && address && (await isAdmin(address))) {
    return NextResponse.json({ ok: true, unlocked: true, reason: "admin-session" });
  }

  const email = ADMIN_EMAIL;
  const token = await generateUnlockToken(email);
  const link = `${BASE_URL}/nexus/rooms?unlock=${encodeURIComponent(token)}`;

  const sent = await sendDealRoomUnlockEmbed({
    email,
    link,
    requestedAt: new Date().toISOString(),
  });

  if (!sent) {
    return NextResponse.json(
      { ok: false, error: "Discord webhook no configurado" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, unlocked: false, sent: true });
}
