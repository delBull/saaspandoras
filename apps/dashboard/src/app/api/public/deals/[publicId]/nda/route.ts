import { NextResponse } from "next/server";
import { getRoomByPublicId } from "@/lib/nexus-deals/repo";
import { hasEmailSignedNda, recordNdaAcceptance } from "@/lib/nexus-deals/repo";
import { NDA_VERSION, NDA_FULL_TEXT, NDA_SUMMARY_BULLETS, buildNdaSignMessage, getNdaConfig } from "@/lib/nexus-deals/nda-content";
import { sendNdaSignedAlert } from "@/lib/nexus-deals/discord";
import { sendNdaConfirmationEmail } from "@/lib/nexus-deals/email";
import { verifySignature } from "thirdweb/auth";
import { client } from "@/lib/thirdweb-client";
import { db } from "@/db";
import { nexusDealAuditEvents } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/public/deals/[publicId]/nda
 * Returns NDA config for this deal + whether the current email/wallet already signed.
 * Query params: ?email=...  OR  ?wallet=...
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;
    const url = new URL(request.url);
    const email = url.searchParams.get("email")?.toLowerCase() ?? "";
    const wallet = url.searchParams.get("wallet")?.toLowerCase() ?? "";

    const room = await getRoomByPublicId(publicId);
    if (!room) {
      return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 });
    }

    // If NDA is not enabled for this room, or it is not a PROPOSAL, return quickly
    const effectiveNdaEnabled = Boolean(room.ndaEnabled);
    if (!effectiveNdaEnabled) {
      return NextResponse.json({
        ndaEnabled: false,
        ndaVersion: room.ndaVersion,
        ndaPhase: room.ndaPhase,
        alreadySigned: false,
        bypassApplied: false,
      });
    }

    const identifier = email || wallet;
    const cfg = getNdaConfig(room.ndaVersion);
    const existing = identifier ? await hasEmailSignedNda(identifier, cfg.version) : null;

    return NextResponse.json({
      ndaEnabled: true,
      ndaVersion: cfg.version,
      ndaPhase: room.ndaPhase,
      ndaTitle: cfg.title,
      ndaSummaryBullets: cfg.summaryBullets,
      ndaFullText: cfg.fullText,
      requiredSigners: cfg.requiredSigners,
      isBilateral: cfg.isBilateral,
      alreadySigned: !!existing,
      bypassApplied: !!existing,
      previousAcceptance: existing
        ? {
            acceptedAt: existing.acceptedAt.toISOString(),
            wallet: existing.wallet,
          }
        : null,
    });
  } catch (e: any) {
    console.error("❌ [NDA GET]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/public/deals/[publicId]/nda
 * Sign the NDA on-chain. Body: { email, name, wallet, signature, timestamp }
 * - If already signed (bypass): records audit + fires Discord (bypassed=true), skips re-signing.
 * - If first time: verifies signature, records in nexus_nda_acceptances, fires email + Discord.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    const wallet = String(body.wallet ?? "").trim().toLowerCase();
    const signature = String(body.signature ?? "").trim();
    const timestamp = String(body.timestamp ?? new Date().toISOString());

    if (!name) {
      return NextResponse.json({ error: "Ingresa tu nombre para firmar." }, { status: 400 });
    }
    if (!email && !wallet) {
      return NextResponse.json({ error: "Se requiere email o wallet para identificarte." }, { status: 400 });
    }

    const room = await getRoomByPublicId(publicId);
    if (!room) {
      return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 });
    }
    const effectiveNdaEnabled = Boolean(room.ndaEnabled);
    if (!effectiveNdaEnabled) {
      return NextResponse.json({ error: "Este deal no requiere NDA." }, { status: 400 });
    }

    const identifier = email || wallet;
    const ndaVersion = room.ndaVersion;
    const roomLabel = `${room.publicId} · ${room.counterparty}`;

    // ── BYPASS CHECK ─────────────────────────────────────────────────────────
    const existing = await hasEmailSignedNda(identifier, ndaVersion);
    if (existing) {
      // Already signed in another deal — audit log + Discord bypass alert
      await db.insert(nexusDealAuditEvents).values({
        roomId: room.id,
        actor: name,
        action: "NDA bypass applied",
        detail: `${identifier} ya tenía NDA ${ndaVersion} firmado desde ${existing.acceptedAt.toISOString()} · wallet: ${existing.wallet ?? "n/a"}`,
        at: new Date(),
      });

      await sendNdaSignedAlert({
        roomLabel,
        signerName: name,
        email: identifier,
        wallet: existing.wallet ?? undefined,
        ndaVersion,
        bypassed: true,
      }).catch(() => {});

      return NextResponse.json({
        ok: true,
        bypassed: true,
        acceptedAt: existing.acceptedAt.toISOString(),
        message: "NDA ya firmado anteriormente — bypass aplicado automáticamente.",
      });
    }

    // ── FRESH SIGNATURE ───────────────────────────────────────────────────────
    if (!wallet || !signature) {
      return NextResponse.json(
        { error: "Firma on-chain requerida. Conecta tu wallet y firma el NDA." },
        { status: 400 }
      );
    }

    const message = buildNdaSignMessage({ email: identifier, wallet, ndaVersion, timestamp });

    const signatureValid = await verifySignature({
      client,
      message,
      signature,
      address: wallet,
    });

    if (!signatureValid) {
      return NextResponse.json(
        { error: "Firma inválida. Verifica tu cuenta e intenta de nuevo." },
        { status: 401 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined;
    const userAgent = request.headers.get("user-agent") ?? undefined;

    // Record in global bypass table
    await recordNdaAcceptance({
      email: identifier,
      ndaVersion,
      wallet,
      signature,
      signatureMessage: message,
      roomId: room.id,
      ip,
      userAgent,
    });

    // Audit trail on the room
    await db.insert(nexusDealAuditEvents).values({
      roomId: room.id,
      actor: name,
      action: "NDA signed",
      detail: `NDA ${ndaVersion} firmado · ${identifier} · wallet ${wallet} · sig ${signature.slice(0, 12)}…`,
      at: new Date(),
    });

    // Fire email + Discord in parallel (non-blocking failures)
    // Only send email confirmation when we have a valid email (not a wallet address).
    const nowIso = new Date().toISOString();
    const firstName = name.split(" ")[0];

    const ndaNotifications: Promise<any>[] = [
      sendNdaSignedAlert({
        roomLabel,
        signerName: name,
        email: identifier,
        wallet,
        ndaVersion,
        bypassed: false,
      }),
    ];
    if (email && email.includes("@")) {
      ndaNotifications.push(
        sendNdaConfirmationEmail({
          to: email,
          firstName,
          ndaVersion,
          roomLabel,
          wallet,
          acceptedAt: nowIso,
        })
      );
    }
    await Promise.allSettled(ndaNotifications);

    return NextResponse.json({
      ok: true,
      bypassed: false,
      acceptedAt: nowIso,
      message: "NDA firmado y registrado exitosamente.",
    });
  } catch (e: any) {
    console.error("❌ [NDA POST]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
