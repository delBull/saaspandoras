import { NextResponse } from "next/server";
import { getRoomByPublicId, getRoom, markViewed, signRoom, signRoomOnline, hasEmailSignedNda, recordNdaAcceptance } from "@/lib/nexus-deals/repo";
import { verifyDealToken } from "@/lib/nexus-deals/tokens";
import { buildSignMessage } from "@/lib/nexus-deals/signing";
import { buildCombinedSignMessage } from "@/lib/nexus-deals/nda-content";
import { sendSignatureAlert, sendNdaSignedAlert } from "@/lib/nexus-deals/discord";
import { sendNdaConfirmationEmail, sendDealSignedEmail } from "@/lib/nexus-deals/email";
import { verifySignature } from "thirdweb/auth";
import { client } from "@/lib/thirdweb-client";
import { db } from "@/db";
import { nexusDealAuditEvents } from "@/db/schema";
import { KIND_LABEL } from "@/lib/nexus-deals/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const { token, name, company, role, wallet, signature, isCombined, ndaTimestamp } = await request.json();

    const room = await getRoomByPublicId((await params).publicId);
    if (!room) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

    const cleanName = String(name ?? "").trim();
    const cleanCompany = typeof company === "string" ? company.trim() : undefined;
    const cleanRole = typeof role === "string" ? role.trim() : undefined;

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

    // ── NDA GUARD ────────────────────────────────────────────────────────────
    // If this room requires NDA and the user is NOT signing the combined message,
    // check that they've already signed the NDA independently first.
    const effectiveNdaEnabled = room.ndaEnabled && room.kind === "PROPOSAL";
    if (effectiveNdaEnabled && !isCombined) {
      const identifier = cleanWallet;
      const ndaSigned = await hasEmailSignedNda(identifier, room.ndaVersion);
      if (!ndaSigned) {
        return NextResponse.json(
          {
            error: "Debes firmar el Acuerdo de Confidencialidad (NDA) antes de firmar este documento.",
            requiresNda: true,
            ndaVersion: room.ndaVersion,
          },
          { status: 403 }
        );
      }
    }

    // Modo "online": room con openSign permite firmar sin email pre-registrado.
    // La wallet actúa como identificador del firmante (determinista en el mensaje).
    if (room.openSign && (!token || typeof token !== "string")) {
      // Combined mode: NDA + Deal in one signature
      const ts = String(ndaTimestamp ?? new Date().toISOString());
      const message = isCombined && effectiveNdaEnabled
        ? buildCombinedSignMessage({
            email: cleanWallet,
            name: cleanName,
            company: cleanCompany,
            role: cleanRole,
            wallet: cleanWallet,
            publicId: room.publicId,
            dealKind: room.kind,
            dealCounterparty: room.counterparty,
            ndaVersion: room.ndaVersion,
            timestamp: ts,
          })
        : buildSignMessage({
            publicId: room.publicId,
            kind: room.kind,
            counterparty: room.counterparty,
            email: cleanWallet,
            name: cleanName,
            company: cleanCompany,
            role: cleanRole,
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

      // If combined, record NDA acceptance atomically
      if (isCombined && effectiveNdaEnabled) {
        const ip = request.headers.get("x-forwarded-for") ?? undefined;
        const ua = request.headers.get("user-agent") ?? undefined;
        await recordNdaAcceptance({
          email: cleanWallet,
          ndaVersion: room.ndaVersion,
          wallet: cleanWallet,
          signature: cleanSig,
          signatureMessage: message,
          signatureCompany: cleanCompany,
          signatureRole: cleanRole,
          roomId: room.id,
          ip,
          userAgent: ua,
        });
        await db.insert(nexusDealAuditEvents).values({
          roomId: room.id,
          actor: cleanName,
          action: "NDA signed (combined)",
          detail: `NDA ${room.ndaVersion} registrado en firma combinada con deal · wallet ${cleanWallet}`,
          at: new Date(),
        });
        // Fire NDA notifications in parallel (non-blocking)
        // Only send email confirmation when we have a valid email (token-based mode).
        // In openSign mode, cleanWallet is an Ethereum address — skip email.
        const ndaNotifications: Promise<any>[] = [
          sendNdaSignedAlert({
            roomLabel: `${room.publicId} · ${room.counterparty}`,
            signerName: cleanName,
            email: cleanWallet,
            wallet: cleanWallet,
            ndaVersion: room.ndaVersion,
            bypassed: false,
          }),
        ];
        if (cleanWallet.includes("@")) {
          ndaNotifications.push(
            sendNdaConfirmationEmail({
              to: cleanWallet,
              firstName: cleanName.split(" ")[0],
              ndaVersion: room.ndaVersion,
              roomLabel: `${room.publicId} · ${room.counterparty}`,
              wallet: cleanWallet,
              acceptedAt: ts,
            })
          );
        }
        Promise.allSettled(ndaNotifications);
      }

      await markViewed(room.id, cleanWallet);
      const updated = await signRoomOnline(room.id, cleanName, {
        wallet: cleanWallet,
        signature: cleanSig,
        signatureMessage: message,
        company: cleanCompany,
        role: cleanRole,
      });

      await sendSignatureAlert({
        roomLabel: `${room.publicId} · ${room.counterparty}`,
        signerName: cleanName,
        email: cleanWallet,
        kind: room.kind,
        online: true,
        enteredIntoForce: updated?.status === "SIGNED",
      });

      // Send follow-up email to signer (skip if wallet-only, no email)
      if (cleanWallet.includes("@")) {
        const nextRoom = room.nextRoomId ? await getRoom(room.nextRoomId) : null;
        Promise.allSettled([
          sendDealSignedEmail({
            to: cleanWallet,
            firstName: cleanName.split(" ")[0],
            dealKindLabel: KIND_LABEL[room.kind],
            counterparty: room.counterparty,
            publicId: room.publicId,
            enteredIntoForce: updated?.status === "SIGNED",
            nextRoom: nextRoom ? {
              publicId: nextRoom.publicId,
              kind: nextRoom.kind,
              kindLabel: KIND_LABEL[nextRoom.kind as keyof typeof KIND_LABEL] ?? nextRoom.kind,
              counterparty: nextRoom.counterparty,
              company: nextRoom.company,
            } : undefined,
          }),
        ]);
      }

      return NextResponse.json({ ok: true, status: updated?.status, ndaRecorded: isCombined && effectiveNdaEnabled });
    }

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Enlace de acceso requerido." }, { status: 401 });
    }

    const payload = verifyDealToken(token);
    if (!payload || payload.sub !== (await params).publicId) {
      return NextResponse.json({ error: "Enlace inválido o expirado." }, { status: 401 });
    }

    const signer = room.signers.find((s) => s.email.toLowerCase() === payload.email.toLowerCase());
    if (!signer) {
      return NextResponse.json({ error: "Tu correo no está autorizado para este documento." }, { status: 403 });
    }

    const ts = String(ndaTimestamp ?? new Date().toISOString());
    const message = isCombined && effectiveNdaEnabled
      ? buildCombinedSignMessage({
          email: payload.email,
          name: cleanName,
          company: cleanCompany,
          role: cleanRole,
          wallet: cleanWallet,
          publicId: room.publicId,
          dealKind: room.kind,
          dealCounterparty: room.counterparty,
          ndaVersion: room.ndaVersion,
          timestamp: ts,
        })
      : buildSignMessage({
          publicId: room.publicId,
          kind: room.kind,
          counterparty: room.counterparty,
          email: payload.email,
          name: cleanName,
          company: cleanCompany,
          role: cleanRole,
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

    // If combined, record NDA acceptance atomically
    if (isCombined && effectiveNdaEnabled) {
      const ip = request.headers.get("x-forwarded-for") ?? undefined;
      const ua = request.headers.get("user-agent") ?? undefined;
      await recordNdaAcceptance({
        email: payload.email,
        ndaVersion: room.ndaVersion,
        wallet: cleanWallet,
        signature: cleanSig,
        signatureMessage: message,
        signatureCompany: cleanCompany,
        signatureRole: cleanRole,
        roomId: room.id,
        ip,
        userAgent: ua,
      });
      await db.insert(nexusDealAuditEvents).values({
        roomId: room.id,
        actor: cleanName,
        action: "NDA signed (combined)",
        detail: `NDA ${room.ndaVersion} registrado en firma combinada con deal · wallet ${cleanWallet}`,
        at: new Date(),
      });
      // Fire NDA notifications in parallel
      const ndaNotifications: Promise<any>[] = [
        sendNdaSignedAlert({
          roomLabel: `${room.publicId} · ${room.counterparty}`,
          signerName: cleanName,
          email: payload.email,
          wallet: cleanWallet,
          ndaVersion: room.ndaVersion,
          bypassed: false,
        }),
      ];
      if (payload.email && payload.email.includes("@")) {
        ndaNotifications.push(
          sendNdaConfirmationEmail({
            to: payload.email,
            firstName: cleanName.split(" ")[0],
            ndaVersion: room.ndaVersion,
            roomLabel: `${room.publicId} · ${room.counterparty}`,
            wallet: cleanWallet,
            acceptedAt: ts,
          })
        );
      }
      Promise.allSettled(ndaNotifications);
    }

    await markViewed(room.id, payload.email);
    const updated = await signRoom(room.id, payload.email, cleanName, {
      wallet: cleanWallet,
      signature: cleanSig,
      signatureMessage: message,
      company: cleanCompany,
      role: cleanRole,
    });

    await sendSignatureAlert({
      roomLabel: `${room.publicId} · ${room.counterparty}`,
      signerName: cleanName,
      email: payload.email,
      kind: room.kind,
      enteredIntoForce: updated?.status === "SIGNED",
    });

    // Send follow-up email to signer
    if (payload.email && payload.email.includes("@")) {
      const nextRoom = room.nextRoomId ? await getRoom(room.nextRoomId) : null;
      Promise.allSettled([
        sendDealSignedEmail({
          to: payload.email,
          firstName: cleanName.split(" ")[0],
          dealKindLabel: KIND_LABEL[room.kind],
          counterparty: room.counterparty,
          publicId: room.publicId,
          enteredIntoForce: updated?.status === "SIGNED",
          nextRoom: nextRoom ? {
            publicId: nextRoom.publicId,
            kind: nextRoom.kind,
            kindLabel: KIND_LABEL[nextRoom.kind as keyof typeof KIND_LABEL] ?? nextRoom.kind,
            counterparty: nextRoom.counterparty,
            company: nextRoom.company,
          } : undefined,
        }),
      ]);
    }

    return NextResponse.json({ ok: true, status: updated?.status });
  } catch (e: any) {
    console.error("❌ [Deals] sign error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
