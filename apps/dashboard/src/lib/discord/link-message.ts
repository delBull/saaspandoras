/**
 * 🎭 Discord · mensaje de vínculo (módulo neutro)
 *
 * Vive separado de `oauth.ts` a propósito: ese archivo usa `node:crypto` y la
 * página `/discord/link` es un componente cliente. Importar `oauth.ts` desde el
 * navegador rompería el build.
 *
 * Debe producir EXACTAMENTE el mismo texto en cliente y servidor: el servidor
 * compara igualdad estricta antes de aceptar la firma.
 */
export function buildLinkMessage(discordUserId: string, token: string): string {
  return [
    'Autorizo vincular mi cuenta de Discord a mi wallet en Pandora\'s Growth OS.',
    `Discord ID: ${discordUserId}`,
    `Token: ${token.slice(-24)}`,
    'Este mensaje no autoriza ninguna transacción ni transferencia de fondos.',
  ].join('\n');
}
