import { DISCORD_COLORS } from '../alerts/types';

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_PANDORAS_ALERTS;

export async function sendBusinessNotification(
    eventName: string,
    details: Record<string, any>,
    severity: 'info' | 'success' | 'warning' = 'info'
) {
    if (!WEBHOOK_URL) return;

    const colors = {
        info: DISCORD_COLORS.info,
        success: DISCORD_COLORS.success || 0x10b981, // Default tailored green if missing
        warning: DISCORD_COLORS.warning
    };

    const fields = Object.entries(details).map(([key, value]) => ({
        name: key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        inline: true
    }));

    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️'
    };

    const payload = {
        username: 'Pandoras Core',
        avatar_url: 'https://dash.pandoras.finance/images/logo.png',
        embeds: [{
            title: `${emojis[severity]} Business Event: ${eventName}`,
            color: colors[severity],
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: 'Pandoras Live Signals' }
        }]
    };

    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error('[BusinessNotifier] Failed to send Discord notification:', err);
    }
}
