
import { SchedulerWebhookPayload } from "@/types/discord"; // We'll define simple types inline if simple

const DISCORD_WEBHOOK_URL = process.env.DISCORD_SCHEDULING_WEBHOOK;

export async function sendSchedulerNotification(
    bookingId: string,
    slotDate: Date,
    lead: { name: string, email: string, notes?: string },
    actionNeeded = true
) {
    if (!DISCORD_WEBHOOK_URL) {
        console.warn("⚠️ No DISCORD_SCHEDULING_WEBHOOK defined.");
        return;
    }

    const dateStr = new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'America/Mexico_City'
    }).format(slotDate);

    const confirmUrl = `https://dash.pandoras.finance/api/scheduling/respond?id=${bookingId}&action=confirm`;
    const rejectUrl = `https://dash.pandoras.finance/api/scheduling/respond?id=${bookingId}&action=reject`;

    const embed = {
        title: "🗓️ Nueva Solicitud de Agenda",
        description: `**${lead.name}** ha solicitado una sesión.`,
        color: 0x84cc16, // Lime-500
        fields: [
            { name: "Fecha", value: dateStr, inline: true },
            { name: "Email", value: lead.email, inline: true },
            { name: "Notas", value: lead.notes || "_Sin notas_" },
        ],
        footer: { text: `ID: ${bookingId}` },
        timestamp: new Date().toISOString(),
    };

    // Note: Discord Webhooks don't support "Buttons" (Components) directly without a Bot Application.
    // For standard Webhooks, we must use Markdown Links in the description or fields.
    // "Actionable" webhooks require a full Bot. 
    // STRATEGY SHIFT: We will use Markdown Links for Actions.

    if (actionNeeded) {
        embed.description += `\n\n**Acciones:**\n[✅ Aceptar Cita](${confirmUrl})  •  [❌ Rechazar](${rejectUrl})`;
    }

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "Pandoras Scheduler",
                avatar_url: "https://dash.pandoras.finance/images/logo.png",
                embeds: [embed],
            }),
        });
    } catch (err) {
        console.error("❌ Failed to send Discord notification:", err);
    }
}
