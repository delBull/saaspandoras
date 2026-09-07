'use server';

export async function requestDeveloperAccessAction(userName: string, userRole: string) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_ALERTS;
    if (!webhookUrl) {
      console.warn('DISCORD_WEBHOOK_ALERTS not configured.');
      // Simulating success if webhook is not configured locally
      return { success: true };
    }

    const payload = {
      embeds: [
        {
          title: '🚨 Solicitud de Acceso: Developer Hub',
          color: 0x8b5cf6, // purple-500
          description: `**${userName}** (Rol: \`${userRole}\`) ha solicitado acceso al ecosistema de integración para desarrolladores (Engineering Harness).`,
          fields: [
            {
              name: 'Acción Requerida',
              value: 'Aprobar acceso (añadir capacidad "developer") desde los ajustes de Nexus.',
            },
          ],
          footer: {
            text: 'Pandoras Nexus OS',
          },
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: 'Abrir Ajustes de Nexus',
              url: 'https://dash.pandoras.finance/nexus?settings=open',
            },
          ],
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error('Failed to send webhook');
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error in requestDeveloperAccessAction:', err);
    return { success: false, error: 'No se pudo enviar la solicitud.' };
  }
}
