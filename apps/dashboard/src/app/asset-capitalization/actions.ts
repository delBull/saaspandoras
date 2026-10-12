'use server';

export async function submitAssetCapitalizationLead(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const assetType = formData.get('assetType') as string;
  const message = formData.get('message') as string;

  if (!name || !email) {
    return { success: false, message: 'El nombre y correo electrónico son obligatorios.' };
  }

  try {
    // 1. Persistir el lead en Growth OS via el mecanismo canónico de ingesta.
    //    (Identidad canónica resuelta server-side → project 'pandoras'; consent requerido).
    const { captureInstitutionalLead } = await import('@/lib/marketing/capture-institutional-lead');
    const capture = await captureInstitutionalLead({
      email,
      name,
      assetType,
      message,
      source: 'asset_capitalization_playbook',
      tags: ['asset-capitalization', ...(assetType ? [assetType] : [])],
    });
    if (!capture.ok) {
      // Honest, non-blocking: Discord + email still notify the team, but we log loudly.
      console.error(
        `[AssetCapitalization] Lead persistence FAILED (${capture.error}). Inquiry for ${email} was NOT persisted to CRM.`,
      );
    }

    // 2. Notificación Interna a Discord
    const webhookUrl = process.env.DISCORD_WEBHOOK_ALERTS;
    if (webhookUrl) {
      const payload = {
        embeds: [{
          title: "👑 New Asset Capitalization Inquiry",
          color: 13938487, // Gold Color #D4AF37
          fields: [
            { name: "Name", value: name || "N/A", inline: true },
            { name: "Email", value: email || "N/A", inline: true },
            { name: "Asset Type", value: assetType || "N/A", inline: false },
            { name: "Message", value: message || "No message provided", inline: false },
          ],
          footer: { text: "Pandoras Asset Capitalization Playbook" },
          timestamp: new Date().toISOString()
        }]
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.error('[AssetCapitalization] Discord webhook error:', err));
    } else {
      console.error('[AssetCapitalization] DISCORD_WEBHOOK_ALERTS no configurado.');
    }

    // 3. Email al Usuario (via unified Email Engine — platform profile)
    if (email) {
      try {
        const { renderEmailAsync } = await import('@/lib/email/engine/render-email');
        const { resolveEmailBranding } = await import('@/lib/email/engine/branding');
        const { sendEmail } = await import('@/lib/email/client');
        const { AssetCapitalizationWelcomeTemplate } = await import('@/lib/email/templates/campaigns/AssetCapitalizationWelcomeTemplate');

        const branding = await resolveEmailBranding();
        const rendered = await renderEmailAsync({
          template: AssetCapitalizationWelcomeTemplate,
          props: { branding, name: name || '', assetType: assetType || undefined },
        });
        await sendEmail({
          from: 'Pandoras Structuring <noreply@pandoras.finance>',
          to: email,
          subject: 'Pandoras Asset Capitalization - Solicitud Recibida',
          html: rendered.html,
        });
      } catch (emailErr) {
        console.error('[AssetCapitalization] Failed to send resend email:', emailErr);
      }
    }

    // Artificial delay for better UX
    await new Promise(r => setTimeout(r, 1200));

    return { success: true, message: 'Su solicitud ha sido recibida. Un director se pondrá en contacto a la brevedad.' };
  } catch (error) {
    console.error('[AssetCapitalization] Error processing lead:', error);
    return { success: false, message: 'Ocurrió un error inesperado. Por favor intente más tarde.' };
  }
}
