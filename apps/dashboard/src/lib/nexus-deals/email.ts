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
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;margin:0 auto;background:#0F0F18;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
        <tr>
          <td style="background:linear-gradient(135deg,#1a0533 0%,#0a0a1a 100%);padding:30px 32px 24px;text-align:center;">
            <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(251,191,36,0.7);margin-bottom:12px;">PANDORA'S NEXUS · TRANSACTION ROOMS</div>
            <div style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;margin-bottom:6px;">${dealKindLabel}</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.5);">${counterparty}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px;">
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.75);text-align:center;">
              <span style="color:#ffffff;font-weight:600;">${firstName ? `Hola ${firstName}` : "Hola"}</span>,<br/><br/>
              Se ha compartido contigo un documento institucional desde el <strong style="color:#fbbf24;font-weight:600;">Pandora's Nexus</strong>.<br/>
              Este enlace es <strong style="color:#ffffff;font-weight:600;">personal y de un solo uso</strong> para tu revisión y aceptación.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${publicUrl}" target="_blank"
                   style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#b45309);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 34px;border-radius:10px;letter-spacing:0.3px;">
                  Revisar y Aceptar →
                </a>
              </td></tr>
            </table>
            <p style="margin:20px 0 0;font-size:11px;color:rgba(255,255,255,0.3);text-align:center;line-height:1.6;">
              Este enlace es de un solo uso y expira en 7 días.<br/>
              Si no esperabas este correo, puedes ignorarlo.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#080810;padding:14px 28px;border-top:1px solid rgba(255,255,255,0.05);">
            <div style="font-size:10px;color:rgba(255,255,255,0.25);text-align:center;">Pandora's Group · Confidential · Transaction Room</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return resend.emails.send({ from: FROM, to, subject: `Pandora's — ${dealKindLabel} · ${counterparty}`, html });
}

/**
 * Email de confirmación al firmante del NDA (Pandoras Ecosystem Confidentiality v1.0).
 * Se envía inmediatamente tras la firma on-chain, con el registro de aceptación.
 */
export async function sendNdaConfirmationEmail(input: {
  to: string;
  firstName?: string;
  ndaVersion?: string;
  roomLabel: string;
  wallet?: string;
  acceptedAt?: string;
}) {
  const { to, firstName, ndaVersion = "v1.0", roomLabel, wallet, acceptedAt } = input;
  const date = acceptedAt ? new Date(acceptedAt).toLocaleString("es-MX", { timeZone: "America/Mexico_City" }) : new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Pandora's — NDA Firmado</title></head>
<body style="margin:0;padding:0;background-color:#08080C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;background:#0F0F18;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
        <tr>
          <td style="background:linear-gradient(135deg,#0a1a0a 0%,#0a0a1a 100%);padding:30px 32px 24px;text-align:center;">
            <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(134,239,172,0.7);margin-bottom:12px;">PANDORA'S NEXUS · ACUERDO DE CONFIDENCIALIDAD</div>
            <div style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;margin-bottom:6px;">🔐 NDA Firmado</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.5);">Pandoras Ecosystem Confidentiality & Non-Use Agreement ${ndaVersion}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.75);text-align:center;">
              <span style="color:#ffffff;font-weight:600;">${firstName ? `Hola ${firstName}` : "Hola"}</span>,<br/><br/>
              Tu firma del <strong style="color:#86efac;">Acuerdo de Confidencialidad Pandora's Ecosystem ${ndaVersion}</strong> ha sido registrada exitosamente.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;">
              <tr><td style="padding:16px 20px;">
                <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(134,239,172,0.7);margin-bottom:12px;">Registro de Aceptación</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:2;">
                  <strong style="color:rgba(255,255,255,0.85);">Deal Room:</strong> ${roomLabel}<br/>
                  <strong style="color:rgba(255,255,255,0.85);">Versión NDA:</strong> ${ndaVersion}<br/>
                  <strong style="color:rgba(255,255,255,0.85);">Fecha:</strong> ${date} (CDMX)<br/>
                  ${wallet ? `<strong style="color:rgba(255,255,255,0.85);">Wallet:</strong> ${wallet}<br/>` : ""}
                  <strong style="color:rgba(255,255,255,0.85);">Legislación:</strong> Leyes de los Estados Unidos Mexicanos
                </div>
              </td></tr>
            </table>
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.6;">
              Este acuerdo tiene una vigencia de 5 años desde la fecha de firma.<br/>
              Conserva este correo como evidencia de tu aceptación.<br/>
              Para cualquier consulta: <a href="mailto:legal@pandoras.finance" style="color:rgba(134,239,172,0.7);">legal@pandoras.finance</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#080810;padding:14px 28px;border-top:1px solid rgba(255,255,255,0.05);">
            <div style="font-size:10px;color:rgba(255,255,255,0.25);text-align:center;">Pandora's Group · Confidential · NDA Engine · Nexus Deal Room</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Pandora's — NDA Firmado · ${ndaVersion} · ${roomLabel}`,
    html,
  });
}

/**
 * Email de confirmación post-firma del documento.
 * Se envía al firmante después de completar la firma on-chain del deal.
 * Si hay un siguiente documento (room chaining), se incluye la notificación
 * en el mismo email para no ser redundante.
 */
export async function sendDealSignedEmail(input: {
  to: string;
  firstName?: string;
  dealKindLabel: string;
  counterparty: string;
  publicId: string;
  enteredIntoForce?: boolean;
  baseUrl?: string;
  nextRoom?: {
    publicId: string;
    kind: string;
    kindLabel: string;
    counterparty: string;
    company: string;
  };
}) {
  const { to, firstName, dealKindLabel, counterparty, publicId, enteredIntoForce, nextRoom, baseUrl } = input;
  const base = baseUrl ?? "https://dash.pandoras.finance";
  const date = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });

  const nextRoomSection = nextRoom ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:rgba(134,239,172,0.06);border:1px solid rgba(134,239,172,0.2);border-radius:10px;">
              <tr><td style="padding:16px 20px;">
                <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(134,239,172,0.7);margin-bottom:12px;">Siguiente Documento Disponible</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:2;">
                  <strong style="color:rgba(255,255,255,0.85);">Documento:</strong> ${nextRoom.kindLabel}<br/>
                  <strong style="color:rgba(255,255,255,0.85);">Deal Room:</strong> ${nextRoom.publicId}<br/>
                  <strong style="color:rgba(255,255,255,0.85);">Contraparte:</strong> ${nextRoom.counterparty}<br/>
                  <strong style="color:rgba(255,255,255,0.85);">Empresa:</strong> ${nextRoom.company}
                </div>
                <p style="margin:12px 0 0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.5;">
                  Este documento ha sido desbloqueado automáticamente tras la firma de ${dealKindLabel}. 
                  Pendiente de revisión y firma.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 0;">
                  <tr><td>
                    <a href="${base}/deal/${nextRoom.publicId}" style="display:inline-block;background:#86efac;color:#08080C;font-size:13px;font-weight:700;text-decoration:none;padding:10px 24px;border-radius:6px;">Abrir Documento</a>
                  </td></tr>
                </table>
              </td></tr>
            </table>` : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Pandora's — Documento Firmado</title></head>
<body style="margin:0;padding:0;background-color:#08080C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;background:#0F0F18;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
        <tr>
          <td style="background:linear-gradient(135deg,#0a1a0a 0%,#0a0a1a 100%);padding:30px 32px 24px;text-align:center;">
            <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(134,239,172,0.7);margin-bottom:12px;">PANDORA'S NEXUS · TRANSACTION ROOMS</div>
            <div style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;margin-bottom:6px;">${enteredIntoForce ? "Documento en vigor" : "Firma registrada"}</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.5);">${dealKindLabel} · ${counterparty}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.75);text-align:center;">
              <span style="color:#ffffff;font-weight:600;">${firstName ? `Hola ${firstName}` : "Hola"}</span>,<br/><br/>
              Tu firma del <strong style="color:#86efac;">${dealKindLabel}</strong> con ${counterparty} ha sido registrada exitosamente.
              ${enteredIntoForce
                ? `El documento ha entrado en vigor tras la firma de todas las partes.`
                : `Tu aceptación quedó registrada en el audit trail del Deal Room.`}
              ${nextRoom ? `<br/><br/><strong style="color:#86efac;">${nextRoom.kindLabel}</strong> ha sido desbloqueado y está listo para revisión.` : ""}
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;">
              <tr><td style="padding:16px 20px;">
                <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(134,239,172,0.7);margin-bottom:12px;">Registro de Firma</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:2;">
                  <strong style="color:rgba(255,255,255,0.85);">Deal Room:</strong> ${publicId}<br/>
                  <strong style="color:rgba(255,255,255,0.85);">Tipo:</strong> ${dealKindLabel}<br/>
                  <strong style="color:rgba(255,255,255,0.85);">Contraparte:</strong> ${counterparty}<br/>
                  <strong style="color:rgba(255,255,255,0.85);">Fecha:</strong> ${date} (CDMX)<br/>
                  <strong style="color:rgba(255,255,255,0.85);">Legislación:</strong> Leyes de los Estados Unidos Mexicanos
                </div>
              </td></tr>
            </table>
            ${nextRoomSection}
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.6;">
              Conserva este correo como evidencia de tu aceptación.<br/>
              Para cualquier consulta: <a href="mailto:legal@pandoras.finance" style="color:rgba(134,239,172,0.7);">legal@pandoras.finance</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#080810;padding:14px 28px;border-top:1px solid rgba(255,255,255,0.05);">
            <div style="font-size:10px;color:rgba(255,255,255,0.25);text-align:center;">Pandora's Group · Confidential · Nexus Deal Room</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `${enteredIntoForce ? "Documento en vigor" : "Firma registrada"} · ${dealKindLabel} · ${counterparty}`,
    html,
  });
}

/**
 * Email de notificación: un documento ha sido desbloqueado y está listo para revisión/firma.
 * Se envía cuando el room chaining libera un nuevo deal room tras la firma del previo.
export async function sendDealAvailableEmail(input: {
  to: string;
  firstName?: string;
  dealKindLabel: string;
  counterparty: string;
  company: string;
  publicId: string;
  previousRoomPublicId: string;
  baseUrl?: string;
  magicUrl?: string;
}) {
  const { to, firstName, dealKindLabel, counterparty, company, publicId, previousRoomPublicId, baseUrl, magicUrl } = input;
  const base = baseUrl ?? "https://dash.pandoras.finance";
  const dealUrl = magicUrl ?? `${base}/deal/${publicId}`;
  const date = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });
  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Pandora's — Documento Disponible</title></head>
<body style="margin:0;padding:0;background-color:#08080C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;background:#0F0F18;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
        <tr>
          <td style="background:linear-gradient(135deg,#0a1a0a 0%,#0a0a1a 100%);padding:30px 32px 24px;text-align:center;">
            <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(134,239,172,0.7);margin-bottom:12px;">PANDORA'S NEXUS · TRANSACTION ROOMS</div>
            <div style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;margin-bottom:6px;">Documento Disponible</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.5);">${dealKindLabel} · ${counterparty}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.75);text-align:center;">
              <span style="color:#ffffff;font-weight:600;">${firstName ? `Hola ${firstName}` : "Hola"}</span>,<br/><br/>
              El <strong style="color:#86efac;">${dealKindLabel}</strong> con ${counterparty} ha sido desbloqueado y está listo para que lo revises y firmes.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;">
              <tr><td style="padding:16px 20px;">
                <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(134,239,172,0.7);margin-bottom:12px;">Detalle</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:2;">
                  <strong style="color:rgba(255,255,255,0.85);">Deal Room:</strong> ${publicId}<br/>
                  <strong style="color:rgba(255,255,255,0.85);">Tipo:</strong> ${dealKindLabel}<br/>
                  <strong style="color:rgba(255,255,255,0.85);">Contraparte:</strong> ${counterparty}<br/>
                  <strong style="color:rgba(255,255,255,0.85);">Empresa:</strong> ${company}<br/>
                  <strong style="color:rgba(255,255,255,0.85);">Desbloqueado por:</strong> Firma de ${previousRoomPublicId}<br/>
                  <strong style="color:rgba(255,255,255,0.85);">Fecha:</strong> ${date} (CDMX)
                </div>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
              <tr><td align="center">
                <a href="${dealUrl}" style="display:inline-block;background:#86efac;color:#08080C;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:0.5px;">Abrir Documento</a>
              </td></tr>
            </table>
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.6;">
              Para cualquier consulta: <a href="mailto:legal@pandoras.finance" style="color:rgba(134,239,172,0.7);">legal@pandoras.finance</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#080810;padding:14px 28px;border-top:1px solid rgba(255,255,255,0.05);">
            <div style="font-size:10px;color:rgba(255,255,255,0.25);text-align:center;">Pandora's Group · Confidential · Nexus Deal Room</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `${dealKindLabel} listo para revisión · ${publicId} · ${counterparty}`,
    html,
  });
}

/**
 * Email de notificación de trato cancelado.
 */
export async function sendDealCancelledEmail(input: {
  to: string;
  firstName?: string;
  dealKindLabel: string;
  counterparty: string;
  publicId: string;
}) {
  const { to, firstName, dealKindLabel, counterparty, publicId } = input;
  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Pandora's — Trato Cancelado</title></head>
<body style="margin:0;padding:0;background-color:#08080C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;margin:0 auto;background:#0F0F18;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
        <tr>
          <td style="background:linear-gradient(135deg,#330505 0%,#1a0a0a 100%);padding:30px 32px 24px;text-align:center;">
            <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(239,68,68,0.7);margin-bottom:12px;">PANDORA'S NEXUS · TRANSACTION ROOMS</div>
            <div style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;margin-bottom:6px;">Documento Cancelado</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.5);">${dealKindLabel} · ${counterparty}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px;">
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.75);text-align:center;">
              <span style="color:#ffffff;font-weight:600;">${firstName ? `Hola ${firstName}` : "Hola"}</span>,<br/><br/>
              Te notificamos que las negociaciones o el proceso de firma para <strong style="color:#ffffff;font-weight:600;">${dealKindLabel}</strong> (${publicId}) han sido formalmente <strong style="color:#ef4444;font-weight:600;">cancelados</strong> desde el Deal Room de Pandora's.<br/><br/>
              Los enlaces mágicos previos han sido invalidados y el acceso al documento ha sido revocado.
            </p>
            <p style="margin:20px 0 0;font-size:11px;color:rgba(255,255,255,0.3);text-align:center;line-height:1.6;">
              Si consideras que esto es un error o tienes alguna duda, responde a este correo.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#080810;padding:14px 28px;border-top:1px solid rgba(255,255,255,0.05);">
            <div style="font-size:10px;color:rgba(255,255,255,0.25);text-align:center;">Pandora's Group · Confidential · Transaction Room</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return resend.emails.send({ from: FROM, to, subject: `Pandora's — Negociación Cancelada · ${publicId}`, html });
}

