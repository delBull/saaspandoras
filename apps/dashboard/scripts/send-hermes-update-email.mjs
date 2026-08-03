/**
 * send-hermes-update-email.mjs
 * Reusable script to send an upgrade/update notification email to trial users
 *
 * Usage: RESEND_API_KEY=re_xxx node scripts/send-hermes-update-email.mjs [email] [name]
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'hello@pandoras.finance';
const SANDBOX_URL = 'https://dash.pandoras.finance/hermes';

const toEmail = process.argv[2] || 'escuelalibredigital@proton.me';
const toName  = process.argv[3] || 'Oscar';

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY missing. Run: RESEND_API_KEY=re_xxx node scripts/send-hermes-update-email.mjs [email] [name]');
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Actualización de Hermes OS — Tu Sandbox está Listo</title>
</head>
<body style="margin:0;padding:0;background-color:#08080C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;background:#0F0F18;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0533 0%,#0a0a1a 100%);padding:32px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:rgba(160,120,255,0.7);margin-bottom:10px;">PANDORA'S PLATFORM OS</div>
                    <div style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">Actualización: Hermes OS Sandbox</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:6px;">Nuevas funcionalidades listas para tus pruebas</div>
                  </td>
                  <td align="right" valign="top">
                    <img src="https://dash.pandoras.finance/apple-touch-icon.png" alt="Pandora's" width="48" height="48" style="border-radius:10px;object-fit:contain;background:#111;display:block;padding:4px;"/>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <p style="margin:0 0 8px;font-size:15px;color:rgba(255,255,255,0.5);">Estimado(a)</p>
              <p style="margin:0 0 28px;font-size:22px;font-weight:600;color:#ffffff;">${toName},</p>

              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
                Esperamos que estés teniendo un excelente día. Queremos compartirte que hemos completado una actualización importante en el <strong style="color:#a78bfa;">Sandbox de Hermes OS</strong>.
              </p>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
                Ahora ya puedes probar tu agente con personalización en tiempo real, catálogo de capacidades por industria, wizard de preguntas frecuentes y simulación de conectores omnicanal.
              </p>

              <!-- Feature Highlight Box -->
              <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:20px;margin-bottom:28px;">
                <div style="font-size:14px;font-weight:600;color:#a78bfa;margin-bottom:8px;">✨ Lo que puedes probar hoy en el Sandbox:</div>
                <ul style="margin:0;padding-left:20px;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.8;">
                  <li>Configuración del nombre de tu empresa e industria.</li>
                  <li>Simulación de conversación inteligente con memoria de contexto.</li>
                  <li>Prueba de flujos de agendamiento y atención a clientes.</li>
                  <li>Vista previa de integración de conectores (Telegram, WhatsApp, Webchat).</li>
                </ul>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin:32px 0 28px;">
                <a href="${SANDBOX_URL}" style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:12px;box-shadow:0 8px 24px rgba(124,58,237,0.35);">
                  Probar el Sandbox de Hermes →
                </a>
              </div>

              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent);margin:28px 0;"></div>

              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.6;text-align:center;">
                Si necesitas ayuda para configurar tu prueba o quieres dar el paso a producción, puedes responder a este correo.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#08080C;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <div style="font-size:12px;color:rgba(255,255,255,0.25);">
                © ${new Date().getFullYear()} Pandora's Growth OS · Enterprise Infrastructure
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

async function main() {
  console.log(`🚀 Sending Hermes update email to ${toName} <${toEmail}>...`);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Pandora's Platform OS <${FROM_EMAIL}>`,
      to: [toEmail],
      subject: `Novedades en Hermes OS — Tu Sandbox está listo para probar`,
      html,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('❌ Resend Error:', data);
    process.exit(1);
  }

  console.log('✅ Email sent successfully!', data);
}

main().catch(err => console.error('❌ Unexpected error:', err));
