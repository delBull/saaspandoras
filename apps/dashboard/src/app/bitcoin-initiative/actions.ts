'use server';

export async function submitPartnershipContact(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const community = formData.get('community') as string;
  const message = formData.get('message') as string;

  if (!name || !email) {
    return { success: false, message: 'Name and Email are required.' };
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_ALERTS;
  
  if (!webhookUrl) {
    console.error('[BitcoinInitiative] DISCORD_WEBHOOK_ALERTS not found.');
    return { success: false, message: 'Configuration error. Please try again later.' };
  }

  try {
    const payload = {
      embeds: [{
        title: "₿ New Bitcoin Partnership Inquiry",
        color: 16225050, // Bitcoin Orange #F7931A
        fields: [
          { name: "Name", value: name || "N/A", inline: true },
          { name: "Email", value: email || "N/A", inline: true },
          { name: "Community/Organization", value: community || "N/A", inline: false },
          { name: "Message", value: message || "No message provided", inline: false },
        ],
        footer: { text: "Pandoras Bitcoin Real Estate Initiative" },
        timestamp: new Date().toISOString()
      }]
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error('[BitcoinInitiative] Discord webhook error:', await res.text());
      return { success: false, message: 'Fallo al enviar la notificación.' };
    }

    // Send Resend Email to User (via unified Email Engine — platform profile)
    if (email) {
      try {
        const { renderEmailAsync } = await import('@/lib/email/engine/render-email');
        const { resolveEmailBranding } = await import('@/lib/email/engine/branding');
        const { sendEmail } = await import('@/lib/email/client');
        const { BitcoinInitiativeWelcomeTemplate } = await import('@/lib/email/templates/campaigns/BitcoinInitiativeWelcomeTemplate');

        const branding = await resolveEmailBranding();
        const rendered = await renderEmailAsync({
          template: BitcoinInitiativeWelcomeTemplate,
          props: { branding, name: name || '', },
        });
        await sendEmail({
          from: 'Pandoras Initiative <noreply@pandoras.finance>',
          to: email,
          subject: 'Bienvenido a Pandoras Bitcoin Real Estate Initiative',
          html: rendered.html,
        });
      } catch (emailErr) {
        console.error('[BitcoinInitiative] Failed to send resend email:', emailErr);
      }
    }

    // Artificial delay for better UX
    await new Promise(r => setTimeout(r, 1500));

    return { success: true, message: 'Tu solicitud ha sido recibida. Nos pondremos en contacto pronto.' };
  } catch (error) {
    console.error('[BitcoinInitiative] Error sending webhook:', error);
    return { success: false, message: 'Ocurrió un error inesperado.' };
  }
}
