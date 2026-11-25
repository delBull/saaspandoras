/**
 * 🔑 Palabra clave de entrada por DM (ADR-020)
 *
 * Un post de Instagram/Facebook no tiene enlace clicable. La conversión se hace
 * así: el post pide escribir una palabra (`SNARAI`) al WhatsApp del tenant y, si
 * el mensaje trae además el código del post, el lead queda atribuido a esa
 * publicación.
 *
 *   "SNARAI"            → matched, sin código
 *   "SNARAI god2f7wy"   → matched, código god2f7wy
 *
 * Es puro: no toca DB ni red.
 */

export const DEFAULT_DM_KEYWORD = 'SNARAI';

function normalize(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export interface DmKeywordMatch {
  matched: boolean;
  /** Código de atribución válido encontrado en el mensaje. */
  code: string | null;
  keyword: string;
}

export function parseDmKeyword(
  text: string,
  keyword: string = process.env.COMMUNITY_DM_KEYWORD || DEFAULT_DM_KEYWORD,
): DmKeywordMatch {
  const key = normalize(keyword).toUpperCase() || DEFAULT_DM_KEYWORD;
  const tokens = normalize(text)
    .split(/[\s,.;:!?¡¿()"'`]+/)
    .filter(Boolean)
    .map((token) => token.toUpperCase());

  if (tokens.length === 0) return { matched: false, code: null, keyword: key };

  // Se acepta la palabra clave en cualquier posición, pero sólo en los primeros
  // tokens: un mensaje largo que la mencione de pasada no es una entrada de campaña.
  const head = tokens.slice(0, 6);
  const matched = head.includes(key);
  if (!matched) return { matched: false, code: null, keyword: key };

  // Los códigos de atribución son minúsculas alfanuméricas de 4 a 16; se excluye
  // la propia palabra clave (SNARAI también encaja en ese patrón).
  const codeToken = head
    .map((token) => token.toLowerCase())
    .find((token) => token !== key.toLowerCase() && /^[a-z0-9]{4,16}$/.test(token));

  return { matched: true, code: codeToken ?? null, keyword: key };
}
