'use server';

import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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

    // Send Resend Email to User
    if (resend && email) {
      try {
        await resend.emails.send({
          from: 'Pandoras Initiative <noreply@pandoras.finance>',
          to: email,
          subject: 'Bienvenido a Pandoras Bitcoin Real Estate Initiative',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
              <h2 style="color: #F7931A;">Iniciativa Pandoras Bitcoin</h2>
              <p>Hola ${name},</p>
              <p>Hemos recibido tu solicitud de contacto para explorar oportunidades de colaboración estratégica con tu comunidad.</p>
              <p>En Pandoras estamos construyendo el primer puente institucional entre el capital Bitcoin y los activos del mundo real (Real World Assets). Pronto un miembro de nuestro equipo se pondrá en contacto contigo para agendar una sesión introductoria.</p>
              <p>Mientras tanto, te invitamos a explorar a profundidad nuestro <a href="https://dash.pandoras.finance/bitcoin-initiative/brief" style="color: #F7931A; font-weight: bold; text-decoration: none;">Partnership Brief</a> que detalla nuestra visión, los activos génesis como S'Narai Bucerías y el roadmap de integración de Bitcoin.</p>
              <p>Atentamente,<br/><strong>El Equipo de Pandoras</strong></p>
            </div>
          `
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
