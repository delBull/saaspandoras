
import { Project } from "@/types/admin";

const DISCORD_ALERTS_WEBHOOK = process.env.DISCORD_ALERTS_WEBHOOK;

export async function sendDelayedDistributionAlert(
    project: Project,
    daysPending: number,
    pendingTaskCount: number,
    totalAmountPending: number
) {
    if (!DISCORD_ALERTS_WEBHOOK) {
        console.warn("⚠️ No DISCORD_ALERTS_WEBHOOK defined.");
        return;
    }

    const embed = {
        title: "🚨 Alerta de Seguridad: Retraso en Distribución",
        description: `El protocolo **${project.title}** tiene pagos pendientes por más de **${daysPending} días** without action from the owner.`,
        color: 0xea580c, // Orange-600
        fields: [
            { name: "Protocolo ID", value: project.id.toString(), inline: true },
            { name: "Owner Wallet", value: project.applicantWalletAddress || "N/A", inline: true },
            { name: "Tareas Pendientes", value: pendingTaskCount.toString(), inline: true },
            { name: "Monto Estimado", value: `${totalAmountPending} TOKENS`, inline: true },
            { name: "Acción Requerida", value: "Revisar Dashboard Admin y ejecutar 'Force Distribution' si es necesario." }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Pandoras Safety Bot" }
    };

    try {
        await fetch(DISCORD_ALERTS_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "Pandoras Safety",
                avatar_url: "https://dash.pandoras.finance/images/safety-shield.png",
                embeds: [embed],
            }),
        });
    } catch (err) {
        console.error("❌ Failed to send Discord alert:", err);
    }
}
