/**
 * Notificación de depósitos pendientes de revisión.
 *
 * Reutiliza el webhook de alertas de Pandora's (`DISCORD_WEBHOOK_PANDORAS_ALERTS`),
 * el mismo que usa el resto de alertas operativas. No inventa un canal nuevo.
 *
 * Reglas:
 *  - Nunca bloquea el flujo de depósito: si Discord falla, el depósito sigue
 *    `pending` (nadie pierde el pago por un webhook caído).
 *  - No incluye datos sensibles: tenant, importe, txHash y wallet de origen son
 *    públicos on-chain; no se envían tokens ni secretos.
 *  - Devuelve el resultado para que el llamador pueda dejar traza si falló.
 */

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_PANDORAS_ALERTS;
const ADMIN_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';

export interface PendingDepositNotice {
  depositId: string;
  tenantId: string;
  amountUsd: number;
  txHash: string;
  chainId: number;
  fromAddress?: string | null;
  blockNumber?: string | null;
}

export interface NotifyResult {
  sent: boolean;
  reason?: 'NOT_CONFIGURED' | 'DELIVERY_FAILED';
}

function explorerUrl(chainId: number, txHash: string): string {
  return chainId === 8453
    ? `https://basescan.org/tx/${txHash}`
    : `https://sepolia.basescan.org/tx/${txHash}`;
}

export async function notifyPendingDeposit(deposit: PendingDepositNotice): Promise<NotifyResult> {
  if (!WEBHOOK_URL) {
    console.error(
      '[DepositReview] DISCORD_WEBHOOK_PANDORAS_ALERTS no configurado: el depósito queda pendiente sin alerta.'
    );
    return { sent: false, reason: 'NOT_CONFIGURED' };
  }

  const reviewUrl = `${ADMIN_BASE_URL}/admin/finance/deposits`;
  const embed = {
    title: '💰 Depósito pendiente de aprobación',
    color: 0xfacc15, // amarillo: requiere acción
    url: reviewUrl,
    fields: [
      { name: 'Tenant', value: `\`${deposit.tenantId}\``, inline: true },
      { name: 'Importe', value: `**$${deposit.amountUsd.toFixed(2)} USD** (on-chain)`, inline: true },
      { name: 'Red', value: `chainId ${deposit.chainId}`, inline: true },
      { name: 'txHash', value: `[${deposit.txHash.slice(0, 18)}…](${explorerUrl(deposit.chainId, deposit.txHash)})`, inline: false },
      { name: 'Origen', value: deposit.fromAddress ? `\`${deposit.fromAddress}\`` : 'desconocido', inline: false },
      { name: 'Bloque', value: deposit.blockNumber ?? '—', inline: true },
      { name: 'Depósito', value: `\`${deposit.depositId}\``, inline: false },
    ],
    footer: { text: 'Verificado on-chain · requiere aprobación en admin' },
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `⏳ **${deposit.tenantId}** declaró un depósito de $${deposit.amountUsd.toFixed(2)} — <${reviewUrl}>`,
        embeds: [embed],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error('[DepositReview] Discord respondió', res.status, '— alerta no entregada.');
      return { sent: false, reason: 'DELIVERY_FAILED' };
    }
    return { sent: true };
  } catch (error: unknown) {
    console.error('[DepositReview] No se pudo enviar la alerta a Discord:', error);
    return { sent: false, reason: 'DELIVERY_FAILED' };
  }
}
