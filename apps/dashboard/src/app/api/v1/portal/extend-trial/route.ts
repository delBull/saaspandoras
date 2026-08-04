import { NextResponse } from 'next/server';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionToken, reason } = body;

    if (!sessionToken) {
      return NextResponse.json({ error: 'sessionToken is required' }, { status: 400 });
    }

    const session = await validatePortalSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const org = await OrganizationSDK.resolve(session.projectId, session.product as any);

    // Notify Discord via pandoras-alerts Webhook
    const discordWebhook = process.env.DISCORD_WEBHOOK_ALERTS || process.env.DISCORD_WEBHOOK_WHATSAPP_LEADS;
    const adminClientsUrl = 'https://dash.pandoras.finance/admin/dashboard?tab=clients';

    if (discordWebhook) {
      await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: `⏳ Solicitud de Extensión de Prueba Sandbox — ${org.name}`,
            color: 0xf59e0b, // Amber
            fields: [
              { name: 'Empresa / Cliente', value: org.name, inline: true },
              { name: 'Slug', value: org.slug, inline: true },
              { name: 'Razón / Nota', value: reason || 'El cliente solicitó 3 días más de prueba en el Portal', inline: false },
              { name: '⚡ Acción Admin', value: `[👉 Ir al Admin CRM para Re-Aprovisionar / Extender](${adminClientsUrl})`, inline: false },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: "Pandora's Negotiation Flow Engine" },
          }],
        }),
      }).catch(e => console.error('[TrialExtension] Discord notify failed:', e));
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud de extensión enviada exitosamente. Tu ejecutivo revisará la solicitud.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to request extension' }, { status: 500 });
  }
}
