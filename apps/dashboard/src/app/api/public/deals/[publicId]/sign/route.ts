import { NextResponse } from "next/server";
import { getRoomByPublicId, markViewed, signRoom, signRoomOnline } from "@/lib/nexus-deals/repo";
import { verifyDealToken } from "@/lib/nexus-deals/tokens";
import { buildSignMessage } from "@/lib/nexus-deals/signing";
import { sendSignatureAlert } from "@/lib/nexus-deals/discord";
import { verifySignature } from "thirdweb/auth";
import { client } from "@/lib/thirdweb-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { publicId: string } }) {
  try {
    const { token, name, wallet, signature } = await request.json();

    const room = await getRoomByPublicId(params.publicId);
    if (!room) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

    const cleanName = String(name ?? "").trim();
    if (!cleanName) {
      return NextResponse.json({ error: "Ingresa tu nombre para firmar." }, { status: 400 });
    }

    const cleanWallet = String(wallet ?? "").trim().toLowerCase();
    const cleanSig = String(signature ?? "").trim();
    if (!cleanWallet || !cleanSig) {
      return NextResponse.json(
        { error: "Firma on-chain requerida. Conecta tu cuenta y firma el mensaje para aceptar." },
        { status: 400 }
      );
    }

    // Modo "online": room con openSign permite firmar sin email pre-registrado.
    // La wallet actúa como identificador del firmante (determinista en el mensaje).
    if (room.openSign && (!token || typeof token !== "string")) {
      const message = buildSignMessage({
        publicId: room.publicId,
        kind: room.kind,
        counterparty: room.counterparty,
        email: cleanWallet,
        name: cleanName,
      });

      const signatureValid = await verifySignature({
        client,
        message,
        signature: cleanSig,
        address: cleanWallet,
      });

      if (!signatureValid) {
        return NextResponse.json({ error: "Firma inválida. Verifica tu cuenta e intenta de nuevo." }, { status: 401 });
      }

      await markViewed(room.id, cleanWallet);
      const updated = await signRoomOnline(room.id, cleanName, {
        wallet: cleanWallet,
        signature: cleanSig,
        signatureMessage: message,
      });

      await sendSignatureAlert({
        roomLabel: `${room.publicId} · ${room.counterparty}`,
        signerName: cleanName,
        email: cleanWallet,
        kind: room.kind,
        online: true,
        enteredIntoForce: updated?.status === "SIGNED",
      });

      return NextResponse.json({ ok: true, status: updated?.status });
    }

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Enlace de acceso requerido." }, { status: 401 });
    }

    const payload = verifyDealToken(token);
    if (!payload || payload.sub !== params.publicId) {
      return NextResponse.json({ error: "Enlace inválido o expirado." }, { status: 401 });
    }

    const signer = room.signers.find((s) => s.email.toLowerCase() === payload.email.toLowerCase());
    if (!signer) {
      return NextResponse.json({ error: "Tu correo no está autorizado para este documento." }, { status: 403 });
    }

    const message = buildSignMessage({
      publicId: room.publicId,
      kind: room.kind,
      counterparty: room.counterparty,
      email: payload.email,
      name: cleanName,
    });

    const signatureValid = await verifySignature({
      client,
      message,
      signature: cleanSig,
      address: cleanWallet,
    });

    if (!signatureValid) {
      return NextResponse.json({ error: "Firma inválida. Verifica tu cuenta e intenta de nuevo." }, { status: 401 });
    }

    await markViewed(room.id, payload.email);
    const updated = await signRoom(room.id, payload.email, cleanName, {
      wallet: cleanWallet,
      signature: cleanSig,
      signatureMessage: message,
    });

    await sendSignatureAlert({
      roomLabel: `${room.publicId} · ${room.counterparty}`,
      signerName: cleanName,
      email: payload.email,
      kind: room.kind,
      enteredIntoForce: updated?.status === "SIGNED",
    });

    return NextResponse.json({ ok: true, status: updated?.status });
  } catch (e: any) {
    console.error("❌ [Deals] sign error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
