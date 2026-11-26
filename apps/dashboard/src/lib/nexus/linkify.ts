/**
 * 🔗 Enlaces en texto plano (chat interno de Nexus)
 *
 * El chat directo entre colaboradores muestra el mensaje tal cual; si alguien
 * pega una URL, debe poder hacer clic. Esto es sólo presentación: no valida
 * destinos ni concede acceso a nada.
 *
 * Reglas:
 *  - Sólo `http:` / `https:` y `www.` (nada de `javascript:`, `data:` ni
 *    esquemas arbitrarios).
 *  - Se recorta la puntuación final que casi nunca es parte de la URL
 *    (`.,;:!?` y paréntesis/comillas de cierre desbalanceados).
 *  - Un paréntesis de cierre se conserva si hay uno de apertura dentro de la
 *    URL (caso típico de Wikipedia).
 */

export interface LinkifySegment {
  type: 'text' | 'link';
  /** Texto tal cual se muestra. */
  value: string;
  /** Sólo en `link`: atributo href ya normalizado. */
  href?: string;
}

const URL_PATTERN = /\b(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

const TRAILING_PUNCTUATION = /[.,;:!?'"]+$/;

/** Recorta la puntuación final y devuelve también el sufijo descartado. */
function splitTrailingPunctuation(raw: string): { url: string; rest: string } {
  let url = raw;
  let rest = '';

  // Puntuación final
  const punct = url.match(TRAILING_PUNCTUATION);
  if (punct) {
    rest = punct[0] + rest;
    url = url.slice(0, -punct[0].length);
  }

  // Paréntesis / corchetes de cierre desbalanceados
  for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']] as const) {
    while (url.endsWith(close)) {
      const opens = url.split(open).length - 1;
      const closes = url.split(close).length - 1;
      if (closes <= opens) break;
      rest = close + rest;
      url = url.slice(0, -1);
    }
  }

  return { url, rest };
}

export function linkifySegments(text: string): LinkifySegment[] {
  const source = String(text ?? '');
  if (!source) return [];

  const segments: LinkifySegment[] = [];
  let cursor = 0;

  for (const match of source.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0;
    const raw = match[0];
    const { url, rest } = splitTrailingPunctuation(raw);

    if (index > cursor) {
      segments.push({ type: 'text', value: source.slice(cursor, index) });
    }

    // Se descarta un esquema distinto de http(s) que hubiera quedado pegado.
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    segments.push({ type: 'link', value: url, href });

    if (rest) segments.push({ type: 'text', value: rest });
    cursor = index + raw.length;
  }

  if (cursor < source.length) {
    segments.push({ type: 'text', value: source.slice(cursor) });
  }

  return segments;
}

/** `true` si el texto contiene al menos un enlace reconocible. */
export function hasLink(text: string): boolean {
  return linkifySegments(text).some((segment) => segment.type === 'link');
}
