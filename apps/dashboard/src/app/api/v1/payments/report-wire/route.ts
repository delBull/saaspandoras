import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { privatePaymentLinks } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { sendWhatsAppMessage } from "@saasfly/shared";
import { checkRateLimit, clientIpFromHeaders } from "@saasfly/hermes-core";

export const runtime = "nodejs";

/**
 * ⚡ /api/v1/payments/report-wire
 * Recibe la notificación de que el tenant ha realizado una transferencia manual (Wire/SPEI).
 * Cambia el estatus a "PENDING" y notifica al Boss vía WhatsApp para la Ejecución Ejecutiva.
 * Rate-limited and idempotent: repeated reports for a PENDING link do NOT re-alert the Boss.
 */
export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(`payments-report-wire:${clientIpFromHeaders(req.headers)}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    const body = await req.json();
    const { linkId, amount, currency } = body;

    if (!linkId) {
      return NextResponse.json({ error: "Missing linkId" }, { status: 400 });
    }

    // 1. Fetch Intent
    const [link] = await db
      .select()
      .from(privatePaymentLinks)
      .where(eq(privatePaymentLinks.id, linkId))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (link.status === "completed") {
      return NextResponse.json({ message: "Already completed" });
    }

    // 1.5 Idempotency: if the Boss was already alerted (PENDING), do NOT re-alert
    const alreadyPending = link.status === "pending";

    // 2. Mark as PENDING
    if (!alreadyPending) {
      await db
        .update(privatePaymentLinks)
        .set({ status: "pending" })
        .where(eq(privatePaymentLinks.id, linkId));
    }

    // 3. Notificar al Boss vía WhatsApp (solo el PRIMER reporte)
    if (!alreadyPending) {
      // Para entornos reales, obtendríamos el número del Boss desde su perfil.
      const bossPhone = process.env.BOSS_WHATSAPP_PHONE || process.env.MARCO_PHONE || "+521234567890";
      const resolvedTenantId = (link.metadata as any)?.tenantId || 'Desconocido';

      const notifMessage = `🛎️ *Alerta de Pago (Wire/SPEI)*\n\nEl tenant *${resolvedTenantId}* ha reportado un pago vía transferencia bancaria por *${amount || link.amount} ${currency || link.currency}*.\n\n_Concepto:_ ${link.title}\n\nPara liquidarlo y activar su producto automáticamente, responde a Hermes:\n*"Aprueba el pago ${link.id}"*`;

      try {
        if (bossPhone && bossPhone !== "+521234567890") {
          await sendWhatsAppMessage(bossPhone.replace('+', ''), notifMessage);
        } else {
          console.warn("[Payments API] BOSS_WHATSAPP_PHONE not set. Logged notification:", notifMessage);
        }
      } catch (waErr) {
        console.error("[Payments API] Error notifying boss via WhatsApp:", waErr);
      }
    }

    return NextResponse.json({ success: true, status: "pending" });

  } catch (err: any) {
    console.error("[Payments API] Error reporting wire payment:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
