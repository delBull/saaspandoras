
import type { Project } from "@/types/admin";

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
        console.log("🔔 Attempting to send Discord Alert to webhook...");
        const response = await fetch(DISCORD_ALERTS_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "Pandoras Safety",
                avatar_url: "https://dash.pandoras.finance/images/safety-shield.png",
                embeds: [embed],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Discord Webhook Failed: ${response.status} ${response.statusText}`, errorText);
        } else {
            console.log("✅ Discord Alert sent successfully.");
        }
    } catch (err) {
        console.error("❌ Failed to send Discord alert (Network Error):", err);
    }
}

export interface ApplicationData {
    name: string;
    contact: string;
    concept: string;
    capital: string;
    time: string;
}

export async function sendApplicationAlert(data: ApplicationData) {
    if (!DISCORD_ALERTS_WEBHOOK) {
        console.warn("⚠️ No DISCORD_ALERTS_WEBHOOK defined.");
        return;
    }

    const embed = {
        title: "🚀 Nueva Solicitud de Aplicación (Whitepaper)",
        description: `Un candidato ha aplicado para iniciar su protocolo en Pandoras.`,
        color: 0x84cc16, // Lime-500
        fields: [
            { name: "Nombre", value: data.name, inline: true },
            { name: "Contacto", value: data.contact, inline: true },
            { name: "Capital Disponible", value: data.capital, inline: true },
            { name: "Disponibilidad de Tiempo", value: data.time, inline: true },
            { name: "Concepto / Idea", value: data.concept || "No especificado" }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Pandoras Growth Bot" }
    };

    try {
        await fetch(DISCORD_ALERTS_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "Pandoras Applications",
                avatar_url: "https://dash.pandoras.finance/images/rocket-icon.png",
                embeds: [embed],
            }),
        });
    } catch (err) {
        console.error("❌ Failed to send Discord Application alert:", err);
    }
}

export async function sendAmbassadorAlert(data: any, projectWebhookUrl?: string | null) {
    const webhookUrl = projectWebhookUrl || DISCORD_ALERTS_WEBHOOK;
    
    if (!webhookUrl) {
        console.warn("⚠️ No Discord webhook URL defined for ambassador alert.");
        return;
    }

    const embed = {
        title: "🤝 Nueva Aplicación: Gestor Patrimonial / Ambassador",
        description: `Un candidato ha aplicado para el programa de embajadores${data.origin === 'pandoras' ? ' de Pandoras' : ' de un proyecto'}.`,
        color: 0x3b82f6, // Blue-500
        fields: [
            { name: "Nombre", value: data.fullName, inline: true },
            { name: "Correo", value: data.email, inline: true },
            { name: "Teléfono", value: data.phone || "No especificado", inline: true },
            { name: "LinkedIn / Social", value: data.socialUrl || "No especificado" },
            { name: "Wallet", value: data.walletAddress || "No especificada" },
            { name: "Origen", value: data.origin, inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Pandoras Growth Bot" }
    };

    if (data.projectId) {
        embed.fields.push({ name: "Project ID", value: data.projectId.toString(), inline: true });
    }
    
    // Anexar enlace directo para aceptar al gestor
    embed.fields.push({ 
        name: "Acción", 
        value: `[Ver Panel de Protocolos](https://dash.pandoras.finance/profile/projects)`,
        inline: false
    });

    try {
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "Pandoras Partners",
                avatar_url: "https://dash.pandoras.finance/images/safety-shield.png",
                embeds: [embed],
            }),
        });
    } catch (err) {
        console.error("❌ Failed to send Discord Ambassador alert:", err);
    }
}
