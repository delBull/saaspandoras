import { resend } from "@/lib/resend";

const FROM = process.env.RESEND_FROM_EMAIL ?? "Pandora's Group <hello@pandoras.finance>";

/**
 * Email de magic link para firmar/aceptar un deal (Resend, marca Pandora's).
 */
export async function sendDealMagicLink(input: {
  to: string;
  firstName?: string;
  dealKindLabel: string;
  counterparty: string;
  publicUrl: string;
}) {
  const { to, firstName, dealKindLabel, counterparty, publicUrl } = input;
  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Pandora's — Documento para revisión</title></head>
<body style="margin:0;padding:0;background-color:#08080C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;min-height:100vh;">
    <tr><td align="center" style="padding:48px 16px;">
      <table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;background:#0F0F18;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a0533 0%,#0a0a1a 100%);padding:32px 40px 28px;">
            <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:rgba(251,191,36,0.7);margin-bottom:10px;">PANDORA'S NEXUS · TRANSACTION ROOMS</div>
            <div style="font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${dealKindLabel}</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:6px;">${counterparty}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
              ${firstName ? `Hola ${firstName},` : "Hola,"}<br/><br/>
              Se ha compartido contigo un documento institucional desde el <strong style="color:#fbbf24;">Pandora's Nexus</strong>.
              Este enlace es <strong style="color:#ffffff;">personal y de un solo uso</strong> para tu revisión y aceptación.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${publicUrl}" target="_blank"
                   style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#b45309);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:16px 40px;border-radius:10px;letter-spacing:0.3px;">
                  Revisar y Aceptar →
                </a>
              </td></tr>
            </table>
            <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.3);text-align:center;line-height:1.6;">
              Este enlace es de un solo uso y expira en 7 días.<br/>
              Si no esperabas este correo, puedes ignorarlo.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#080810;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);">
            <div style="font-size:11px;color:rgba(255,255,255,0.25);text-align:center;">Pandora's Group · Confidential · Transaction Room</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return resend.emails.send({ from: FROM, to, subject: `Pandora's — ${dealKindLabel} · ${counterparty}`, html });
}
