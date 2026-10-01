import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { discordHandle, projectId, email } = await req.json();

    if (!discordHandle) {
      return NextResponse.json({ error: 'Discord handle is required' }, { status: 400 });
    }

    // SECURITY FIX (GitGuardian Oct-2026): the beta-request webhook was
    // hardcoded in source and got flagged as a leaked secret. It now lives
    // SECURITY FIX (GitGuardian Oct-2026): the beta-request webhook was
    // hardcoded in source and got flagged as a leaked secret (revoked in
    // Discord). Centralized: all public/dev traffic goes through the single
    // DISCORD_CHANGELOG_WEBHOOK (channel de anuncios). Alerts operativas
    // siguen en DISCORD_WEBHOOK_ALERTS (no cambia).
    const webhookUrl = process.env.DISCORD_CHANGELOG_WEBHOOK || '';
    if (!webhookUrl) {
      console.error('[BetaRequest] DISCORD_CHANGELOG_WEBHOOK missing — beta requests unavailable.');
      return NextResponse.json({ error: 'Beta requests temporarily unavailable' }, { status: 503 });
    }
    if (!/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//.test(webhookUrl)) {
      console.error('[BetaRequest] Malformed webhook env.');
      return NextResponse.json({ error: 'Beta requests temporarily unavailable' }, { status: 503 });
    }

    const message = {
      embeds: [
        {
          title: '🛎️ Solicitud de Acceso — API Beta (Dev)',
          color: 5814783, // blurple
          fields: [
            { name: 'Discord Handle', value: `\`${discordHandle}\``, inline: true },
            { name: 'Project ID', value: projectId || 'Desconocido', inline: true },
            { name: 'Email del Admin', value: email || 'Desconocido', inline: false }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Beta request webhook error:', error);
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
  }
}
