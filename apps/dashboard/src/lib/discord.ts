import { Project } from "@/db/schema";

// Environment variables for Webhooks
const DISCORD_WEBHOOK_LEADS = process.env.DISCORD_WEBHOOK_WHATSAPP_LEADS || ''; // Leads from WhatsApp Flow
const DISCORD_WEBHOOK_APPLICATIONS = process.env.DISCORD_WEBHOOK_APPLICATIONS || ''; // Protocol Applications (Web)
const DISCORD_WEBHOOK_ALERTS = process.env.DISCORD_WEBHOOK_ALERTS || ''; // System Alerts & Human Support

interface DiscordField {
    name: string;
    value: string;
    inline?: boolean;
}

interface DiscordEmbed {
    title: string;
    description?: string;
    url?: string;
    color?: number; // Decimal color
    fields?: DiscordField[];
    footer?: { text: string };
    timestamp?: string;
}

/**
 * Send a standardized notification to Discord
 */
async function sendDiscordNotification(webhookUrl: string, content: string, embeds: DiscordEmbed[] = []) {
    if (!webhookUrl) {
        console.warn('⚠️ Discord Webhook URL not configured');
        return;
    }

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content,
                embeds,
            }),
        });
    } catch (error) {
        console.error('❌ Failed to send Discord notification:', error);
    }
}

// Predefined colors
const COLORS = {
    SUCCESS: 5763719, // Green
    WARNING: 16776960, // Yellow
    ERROR: 15548997, // Red
    INFO: 5793266, // Blue
    PURPLE: 10181046 // Pandora Purple
};

/**
 * Notify about a new Protocol Application Lead
 */
export async function notifyNewLead(projectTitle: string, userEmail: string, score: number, packageType: string, summary: string) {
    const fields: DiscordField[] = [
        { name: 'Package', value: packageType, inline: true },
        { name: 'Score', value: score.toString(), inline: true },
        { name: 'Email', value: userEmail, inline: true },
        { name: 'Summary', value: summary.substring(0, 1024) }
    ];

    const embed: DiscordEmbed = {
        title: `🚀 New Protocol Application: ${projectTitle}`,
        color: COLORS.SUCCESS,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: 'Pandora\'s Lead System' }
    };

    await sendDiscordNotification(DISCORD_WEBHOOK_LEADS, '', [embed]);
}

/**
 * Notify about a Human Support Request from WhatsApp
 */
export async function notifySupportRequest(phone: string, lastMessage: string, context: string) {
    const embed: DiscordEmbed = {
        title: `👨‍💼 WhatsApp Human Support Requested`,
        description: `User **${phone}** requested an agent.`,
        color: COLORS.WARNING,
        fields: [
            { name: 'Context/Flow', value: context, inline: true },
            { name: 'Last Message', value: lastMessage || 'N/A' }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Reply via WhatsApp Dashboard' }
    };

    await sendDiscordNotification(DISCORD_WEBHOOK_ALERTS, '<@&MANAGER_ROLE_ID> Support needed!', [embed]);
}

/**
 * Notify System Alert (Error/Critical)
 */
export async function notifySystemAlert(source: string, error: string) {
    const embed: DiscordEmbed = {
        title: `🚨 System Alert: ${source}`,
        description: error,
        color: COLORS.ERROR,
        timestamp: new Date().toISOString()
    };

    await sendDiscordNotification(DISCORD_WEBHOOK_ALERTS, '', [embed]);
}
