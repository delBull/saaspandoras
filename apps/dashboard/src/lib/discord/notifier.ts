
import { config } from "@/config";

export interface PaymentNotification {
    type: "payment_received" | "payment_failed" | "payment_dispute";
    amount: number;
    currency: string;
    method: "stripe" | "crypto" | "wire";
    status: "pending" | "completed" | "failed" | "refunded";
    linkId?: string;
    clientId?: string;
    metadata?: Record<string, any>;
}

export async function sendPaymentNotification(data: PaymentNotification) {
    if (!process.env.DISCORD_WEBHOOK_URL) {
        console.warn("DISCORD_WEBHOOK_URL not set, skipping notification");
        return;
    }

    const colors = {
        payment_received: 0x57F287, // Green
        payment_failed: 0xED4245,   // Red
        payment_dispute: 0xFEE75C   // Yellow
    };

    const statusMap = {
        pending: "⏳ PENDIENTE (Verificación Requerida)",
        completed: "✅ COMPLETADO",
        failed: "❌ FALLIDO",
        refunded: "↩️ REEMBOLSADO"
    };

    const methodMap = {
        stripe: "💳 Tarjeta (Stripe)",
        crypto: "🪙 Crypto",
        wire: "🏦 Transferencia Bancaria"
    };

    const fields = [
        { name: "Monto", value: `${data.amount.toLocaleString()} ${data.currency}`, inline: true },
        { name: "Método", value: methodMap[data.method], inline: true },
        { name: "Estado", value: statusMap[data.status], inline: true },
    ];

    if (data.linkId) fields.push({ name: "Link ID", value: data.linkId, inline: true });
    if (data.clientId) fields.push({ name: "Cliente ID", value: data.clientId, inline: true });

    if (data.metadata?.message) {
        fields.push({ name: "Mensaje", value: data.metadata.message, inline: false });
    }

    const embed = {
        title: data.type === "payment_received" ? "💰 Nuevo Pago Recibido" : "⚠️ Alerta de Pago",
        description: `Se ha registrado una nueva actividad en la plataforma.`,
        color: colors[data.type] || 0x5865F2,
        fields,
        timestamp: new Date().toISOString(),
        footer: {
            text: "Pandora's Finance • Payment Alerts"
        }
    };

    try {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (error) {
        console.error("Failed to send Discord notification:", error);
    }
}
