import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { discordHandle, projectId, email } = await req.json();

    if (!discordHandle) {
      return NextResponse.json({ error: 'Discord handle is required' }, { status: 400 });
    }

    const webhookUrl = 'https://discord.com/api/webhooks/1555012559906799639/LldcOZ_TKI6Fykhr6Er8IUI0xKF215uIUe-MRkjwnQmQ2zE5ZiAYfx05-T95LESz7xqO';

    const message = {
      embeds: [
        {
          title: '🚀 Nuevo Request de Acceso API Beta',
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
