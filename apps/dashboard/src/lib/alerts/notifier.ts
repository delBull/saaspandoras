/**
 * Discord Webhook Notifier for Pandoras Alerts
 *
 * Sends rich embeds to DISCORD_WEBHOOK_PANDORAS_ALERTS.
 * Uses severity-specific colors and includes:
 * - Alert metadata (ID, window, severity)
 * - Metric context
 * - Recommended playbook with deep link
 * - Admin panel deep link
 */
import { DISCORD_COLORS } from './types';
import { PLAYBOOK_LINKS } from './rules';
import type { FiredAlert, AlertSeverity } from './types';

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_PANDORAS_ALERTS;

// ── Severity badge text ───────────────────────────────────────────────────

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
    critical: '🔴 CRITICAL',
    warning: '🟠 WARNING',
    info: '🔵 INFO',
};

// ── Build Discord Embed ───────────────────────────────────────────────────

function buildEmbed(alert: FiredAlert) {
    const { rule, metrics, firedAt } = alert;
    const severity = rule.severity;
    const isNew = alert.isNew;

    const fields: { name: string; value: string; inline?: boolean }[] = [];

    // 🎯 Suggested action — prominently first when present
    if (rule.suggestedAction) {
        fields.push({
            name: '🎯 Suggested Action',
            value: `**${rule.suggestedAction}**`,
            inline: false,
        });
    }

    fields.push(
        { name: 'Alert ID', value: `\`${rule.id}\``, inline: true },
        { name: 'Severity', value: SEVERITY_LABEL[severity], inline: true },
        { name: 'Window', value: rule.window, inline: true },
        { name: 'Status', value: isNew ? '🔔 **New Alert**' : '🔁 Still Active', inline: true },
        {
            name: 'Detail',
            value: rule.description(metrics).slice(0, 1024),
            inline: false,
        },
    );

    // Key metrics snapshot
    const metricsSummary = [
        `Events (5m): **${metrics.events_accepted_5m}** / ${metrics.events_received_5m}`,
        `PBOX: earned **${metrics.pbox_earned_total}**, reserved **${metrics.pbox_reserved_total}**, claimed **${metrics.pbox_claimed_total}**`,
        `Webhook queue: **${metrics.webhook_pending}** pending`,
        `Rates: ${metrics.webhook_success_rate_15m.toFixed(1)}% webhook success (15m)`,
    ].join('\n');

    fields.push({ name: '📊 Metrics Snapshot', value: metricsSummary, inline: false });

    // Playbook CTA
    if (rule.playbook && PLAYBOOK_LINKS[rule.playbook]) {
        fields.push({
            name: '🧯 Recommended Playbook',
            value: `[${rule.playbook.replace(/-/g, ' ').toUpperCase()}](${PLAYBOOK_LINKS[rule.playbook]})`,
            inline: false,
        });
    }

    // Admin panel deep link
    fields.push({
        name: '🔗 Admin Panel',
        value: `[Open Telegram Bridge Control](/admin/telegram-bridge)`,
        inline: false,
    });

    return {
        title: `${rule.emoji} Telegram Bridge Alert — ${SEVERITY_LABEL[severity]}`,
        description: `**${rule.title}**`,
        color: DISCORD_COLORS[severity],
        fields,
        footer: {
            text: `Pandoras Platform · ${firedAt.toISOString()} · Bridge Alerting v1`,
        },
        timestamp: firedAt.toISOString(),
    };
}

// ── Send to Discord ───────────────────────────────────────────────────────

export async function sendDiscordAlert(alert: FiredAlert): Promise<void> {
    if (!WEBHOOK_URL) {
        console.warn('[AlertNotifier] DISCORD_WEBHOOK_PANDORAS_ALERTS not set — skipping notification');
        return;
    }

    const payload = {
        username: 'Pandoras Alerts',
        avatar_url: 'https://pandoras.io/favicon.ico',
        embeds: [buildEmbed(alert)],
    };

    try {
        const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error(`[AlertNotifier] Discord webhook failed: ${res.status} — ${body}`);
        } else {
            console.log(`[AlertNotifier] Sent ${alert.rule.severity} alert: ${alert.rule.id}`);
        }
    } catch (err) {
        console.error('[AlertNotifier] Failed to send Discord alert:', err);
    }
}

// ── Send a plain INFO / audit notification ────────────────────────────────

export async function sendAuditNotification({
    title,
    description,
    fields,
}: {
    title: string;
    description: string;
    fields?: { name: string; value: string; inline?: boolean }[];
}) {
    if (!WEBHOOK_URL) return;

    const payload = {
        username: 'Pandoras Alerts',
        avatar_url: 'https://pandoras.io/favicon.ico',
        embeds: [{
            title: `🔵 ${title}`,
            description,
            color: DISCORD_COLORS.info,
            fields: fields ?? [],
            footer: { text: `Pandoras Platform · Audit Log · ${new Date().toISOString()}` },
            timestamp: new Date().toISOString(),
        }],
    };

    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (err) {
        console.error('[AlertNotifier] Audit notification failed:', err);
    }
}
