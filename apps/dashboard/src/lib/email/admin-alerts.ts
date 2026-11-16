/**
 * Alertas operativas por correo.
 *
 * Hoy lo usa `paying-wallet.ts` cuando la wallet pagadora de Hermes (x402) se
 * queda sin saldo. Antes de existir este archivo, el import dinámico fallaba y
 * la alerta **nunca se enviaba** (fallaba abierto y en silencio).
 *
 * Regla: si falta configuración de correo, se lanza el error para que el
 * llamador lo registre; nunca se simula un envío exitoso.
 */

import { sendEmail } from './client';

export interface AdminAlertParams {
  to: string;
  subject: string;
  text: string;
}

/**
 * Envía una alerta a operación.
 * @returns el id del mensaje o `null` si el proveedor no lo devuelve.
 */
export async function sendAdminAlertEmail(params: AdminAlertParams): Promise<string | null> {
  const to = (params.to ?? '').trim();
  if (!to) {
    throw new Error('[AdminAlert] Falta el destinatario de la alerta.');
  }

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
      <h2 style="font-size:18px;margin:0 0 12px">${escapeHtml(params.subject)}</h2>
      <pre style="white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,monospace;font-size:13px;line-height:1.6;color:#374151;background:#f4f4f5;padding:12px;border-radius:8px;margin:0">${escapeHtml(
        params.text,
      )}</pre>
      <p style="font-size:12px;color:#6b7280;margin-top:16px">
        Alerta automática de Pandora&apos;s. No responder a este mensaje.
      </p>
    </div>
  `;

  const result = (await sendEmail({
    to,
    subject: params.subject,
    html,
  })) as { id?: string } | null | undefined;

  return result?.id ?? null;
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
