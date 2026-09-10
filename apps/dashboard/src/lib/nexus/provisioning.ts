/**
 * 🤝 Nexus Collaborator Provisioning — Approval Workflow Notifications
 * src/lib/nexus/provisioning.ts
 *
 * Fire-and-forget Discord notification to `#pandoras-alerts` (DISCORD_WEBHOOK_PANDORAS_ALERTS)
 * when a collaborator self-registration completes and requires admin approval.
 * The embed carries a deep link to the admin provisioning queue:
 *   {base}/admin/collaborators
 */

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_PANDORAS_ALERTS;

/**
 * Resolve the base URL for admin deep links.
 * Prefers the hosting env; falls back to the canonical admin subdomain.
 */
export function adminBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'https://admin.pandoras.finance'
  );
}

export interface ProvisioningRequestInfo {
  name: string;
  email: string;
  whatsappPhone?: string | null;
  role?: string | null;
}

export async function notifyProvisioningRequest(info: ProvisioningRequestInfo): Promise<void> {
  if (!WEBHOOK_URL) {
    console.warn('[Provisioning] DISCORD_WEBHOOK_PANDORAS_ALERTS not set — skipping approval request notification');
    return;
  }

  const approvalUrl = `${adminBaseUrl()}/admin/collaborators`;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: '👤 Nombre', value: info.name || '—', inline: true },
    { name: '📧 Email', value: info.email || '—', inline: true },
    { name: '📱 WhatsApp', value: info.whatsappPhone || '—', inline: true },
    { name: '🛡️ Rol Solicitado', value: info.role || 'COLLABORATOR', inline: true },
  ];

  const payload = {
    username: 'Pandoras Alerts',
    avatar_url: 'https://pandoras.io/favicon.ico',
    embeds: [
      {
        title: '🧾 Solicitud de Aprovisionamiento — Nexus',
        description: `**${info.name || info.email}** completó su registro por magic link y espera aprobación de acceso al Nexus.`,
        color: 0xf59e0b,
        fields,
        footer: {
          text: 'Pandoras Nexus OS · Provisioning Workflow',
        },
        timestamp: new Date().toISOString(),
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: 'Revisar en Admin',
            url: approvalUrl,
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[Provisioning] Discord webhook failed: ${res.status} — ${body}`);
    } else {
      console.log(`[Provisioning] Approval request notified: ${info.email}`);
    }
  } catch (err) {
    console.error('[Provisioning] Failed to send approval request notification:', err);
  }
}