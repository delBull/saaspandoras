'use server';

import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function submitAssetCapitalizationLead(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const assetType = formData.get('assetType') as string;
  const message = formData.get('message') as string;

  if (!name || !email) {
    return { success: false, message: 'El nombre y correo electrónico son obligatorios.' };
  }

  try {
    // 1. Guardar en Growth OS DB (vía API centralizada)
    const apiBase = process.env.PANDORAS_API_URL || 'https://dash.pandoras.finance/api/v1';
    const apiKey = process.env.PANDORAS_SECRET_KEY || process.env.NEXT_PUBLIC_PANDORAS_PUBLIC_KEY;
    
    if (apiKey) {
      await fetch(`${apiBase}/marketing/leads/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          projectId: 'pandoras_capital',
          email: email,
          metadata: {
            name: name,
            assetType: assetType,
            message: message,
            source: 'asset_capitalization_playbook',
            tags: ['institutional', assetType]
          }
        })
      }).catch(err => console.error('[AssetCapitalization] DB Sync Error:', err));
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

    // 3. Email al Usuario (Resend)
    if (resend && email) {
      try {
        await resend.emails.send({
          from: 'Pandoras Structuring <noreply@pandoras.finance>',
          to: email,
          subject: 'Pandoras Asset Capitalization - Solicitud Recibida',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111111; background-color: #fcfcfc; padding: 40px; border: 1px solid #e5e5e5; border-radius: 8px;">
              <h2 style="color: #D4AF37; font-family: serif; font-size: 24px; margin-bottom: 24px;">Asset Capitalization</h2>
              <p style="font-size: 16px; line-height: 1.6;">Estimado/a ${name},</p>
              <p style="font-size: 16px; line-height: 1.6;">Hemos recibido de manera exitosa su solicitud de contacto a través de nuestro Playbook Institucional.</p>
              <p style="font-size: 16px; line-height: 1.6;">En Pandoras nos especializamos en transformar patrimonio inmovilizado en capital productivo mediante estructuración institucional. Entendemos que cada activo requiere una arquitectura jurídica y financiera específica para maximizar su potencial de liquidez y crecimiento sin que el propietario pierda el control del mismo.</p>
              <p style="font-size: 16px; line-height: 1.6;">En breve, uno de nuestros directores de estructuración revisará la información de su activo (${assetType || 'no especificado'}) y se pondrá en contacto con usted para agendar una sesión exploratoria confidencial.</p>
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea;">
                <p style="font-size: 14px; color: #666;">
                  Atentamente,<br/>
                  <strong style="color: #111;">Pandoras Capital Structuring Team</strong>
                </p>
              </div>
            </div>
          `
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
