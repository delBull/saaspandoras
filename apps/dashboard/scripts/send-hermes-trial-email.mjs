/**
 * send-hermes-trial-email.mjs
 * Script one-shot para disparar el email de demo/trial de Hermes
 * Usage: RESEND_API_KEY=re_xxx node send-hermes-trial-email.mjs [email] [name]
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'hello@pandoras.finance';
const SANDBOX_URL = 'https://dash.pandoras.finance/hermes';

const toEmail = process.argv[2] || 'marco.munoz9@gmail.com';
const toName  = process.argv[3] || 'Marco';

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY missing. Run: RESEND_API_KEY=re_xxx node send-hermes-trial-email.mjs');
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Hermes Runtime — Acceso a Demo</title>
</head>
<body style="margin:0;padding:0;background-color:#08080C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- Card -->
        <table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;background:#0F0F18;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;">

          <!-- Header bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0533 0%,#0a0a1a 100%);padding:32px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:rgba(160,120,255,0.7);margin-bottom:10px;">PANDORA'S PLATFORM OS</div>
                    <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">Hermes Runtime</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:6px;letter-spacing:0.5px;">Enterprise Infrastructure for Intelligent Assets</div>
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

              <p style="margin:0 0 8px;font-size:15px;color:rgba(255,255,255,0.5);letter-spacing:0.3px;">Estimado(a)</p>
              <p style="margin:0 0 28px;font-size:22px;font-weight:600;color:#ffffff;">${toName},</p>

              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
                Has sido seleccionado(a) para acceder a una sesión de demostración de
                <strong style="color:#a78bfa;">Hermes Runtime</strong> —
                la infraestructura de inteligencia autónoma de Pandora's que permite a organizaciones
                operar agentes conversacionales de alto rendimiento en todos sus canales de comunicación.
              </p>

              <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
                Hermes no es un chatbot. Es infraestructura operativa. Igual que Stripe es infraestructura
                financiera, o AWS infraestructura tecnológica — Hermes es la capa de inteligencia que
                opera tu empresa de forma autónoma.
              </p>

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(124,58,237,0.4),transparent);margin:0 0 28px;"></div>

              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td width="50%" style="padding:0 8px 16px 0;vertical-align:top;">
                    <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:10px;padding:16px;">
                      <div style="font-size:18px;margin-bottom:8px;">🧠</div>
                      <div style="font-size:13px;font-weight:600;color:#a78bfa;margin-bottom:4px;">Intelligence Studio</div>
                      <div style="font-size:12px;color:rgba(255,255,255,0.45);line-height:1.5;">Configura el LLM, prompts y personalidad de tu agente.</div>
                    </div>
                  </td>
                  <td width="50%" style="padding:0 0 16px 8px;vertical-align:top;">
                    <div style="background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.2);border-radius:10px;padding:16px;">
                      <div style="font-size:18px;margin-bottom:8px;">📡</div>
                      <div style="font-size:13px;font-weight:600;color:#818cf8;margin-bottom:4px;">Omnichannel</div>
                      <div style="font-size:12px;color:rgba(255,255,255,0.45);line-height:1.5;">Telegram, WhatsApp, SMS, Voz y Web Widget.</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
                    <div style="background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.18);border-radius:10px;padding:16px;">
                      <div style="font-size:18px;margin-bottom:8px;">📚</div>
                      <div style="font-size:13px;font-weight:600;color:#34d399;margin-bottom:4px;">Knowledge Studio</div>
                      <div style="font-size:12px;color:rgba(255,255,255,0.45);line-height:1.5;">FAQs, catálogos, contratos y playbooks como fuente de verdad.</div>
                    </div>
                  </td>
                  <td width="50%" style="padding:0 0 0 8px;vertical-align:top;">
                    <div style="background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.18);border-radius:10px;padding:16px;">
                      <div style="font-size:18px;margin-bottom:8px;">📊</div>
                      <div style="font-size:13px;font-weight:600;color:#fbbf24;margin-bottom:4px;">Mission Control</div>
                      <div style="font-size:12px;color:rgba(255,255,255,0.45);line-height:1.5;">Observabilidad en tiempo real de conversaciones y conversión.</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${SANDBOX_URL}" target="_blank"
                       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:16px 40px;border-radius:10px;letter-spacing:0.3px;">
                      Acceder al Sandbox de Hermes →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.3);text-align:center;line-height:1.6;">
                Esta sesión de demostración está limitada a un número controlado de interacciones.<br/>
                El acceso completo a producción se activa al completar el proceso de assessment.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#080810;padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:12px;color:rgba(255,255,255,0.25);line-height:1.7;">
                      <strong style="color:rgba(255,255,255,0.4);">Pandora's Platform OS</strong><br/>
                      Enterprise Infrastructure for Intelligent Assets<br/>
                      <a href="https://pandoras.finance" style="color:rgba(124,58,237,0.7);text-decoration:none;">pandoras.finance</a>
                    </div>
                  </td>
                  <td align="right">
                    <div style="font-size:10px;color:rgba(255,255,255,0.18);letter-spacing:2px;text-transform:uppercase;">Hermes Runtime v5.0</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;

const payload = {
  from: `Pandora's Group <${FROM_EMAIL}>`,
  to: [toEmail],
  subject: `Hermes Runtime — Tu acceso a la demostración está listo`,
  html,
};

console.log(`📧 Enviando email a ${toEmail}...`);

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

const data = await res.json();

if (res.ok) {
  console.log(`✅ Email enviado exitosamente. ID: ${data.id}`);
} else {
  console.error('❌ Error al enviar:', JSON.stringify(data, null, 2));
}
