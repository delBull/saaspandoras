import { SchedulerWebhookPayload } from "@/types/discord";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_SCHEDULING_WEBHOOK;

export async function sendSchedulerNotification(
    bookingId: string,
    slotDate: Date,
    lead: { name: string, email: string, notes?: string, phone?: string, projectTitle?: string },
    actionNeeded = true,
    projectWebhookUrl?: string | null
) {
    const dateStr = new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'America/Mexico_City'
    }).format(slotDate);

    const confirmUrl = `https://dash.pandoras.finance/api/scheduling/respond?id=${bookingId}&action=confirm`;
    const rejectUrl = `https://dash.pandoras.finance/api/scheduling/respond?id=${bookingId}&action=reject`;

    const embed = {
        title: "🎫 Nueva Solicitud de Agenda",
        description: `**${lead.name}** ha solicitado una sesión${lead.projectTitle ? ` para *${lead.projectTitle}*` : ''}.`,
        color: 0xD4A853, // Gold (#D4A853)
        fields: [
            { name: "Fecha", value: dateStr, inline: true },
            { name: "Email", value: lead.email, inline: true },
            { name: "Teléfono", value: lead.phone || "_Sin teléfono_", inline: true },
            { name: "Notas", value: lead.notes || "_Sin notas_" },
        ],
        footer: { text: `ID: ${bookingId}` },
        timestamp: new Date().toISOString(),
    };

    if (actionNeeded) {
        embed.description += `\n\n**Acciones:**\n[✅ Aceptar Cita](${confirmUrl})  •  [❌ Rechazar](${rejectUrl})`;
    }

    const payload = {
        username: "Pandoras Scheduler",
        avatar_url: "https://dash.pandoras.finance/images/logo.png",
        embeds: [embed],
    };

    const urls = [DISCORD_WEBHOOK_URL, projectWebhookUrl].filter(Boolean) as string[];

    if (urls.length === 0) {
        console.warn("⚠️ No Discord webhook URLs available.");
        return;
    }

    await Promise.allSettled(urls.map(url =>
        fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }).catch(err => console.error(`❌ Failed to send Discord notification to ${url.slice(0, 40)}...:`, err))
    ));
}
