/**
 * 🏛️ Recap de la presentación para el correo de seguimiento
 * =========================================================
 * Describe QUÉ se presentó a partir del deck canónico (títulos y subtítulos de
 * los bloques `hero`). Nunca usa `slide.notes`: esos son los beats del
 * presentador (guión interno) y no deben salir al cliente.
 *
 * Sirve como sección por defecto del seguimiento para no reescribir el resumen
 * de la presentación en cada reunión.
 */

interface DeckBlockLike {
  type?: string;
  title?: string;
  subtitle?: string;
  text?: string;
}

interface DeckSlideLike {
  id: string;
  title: string;
  blocks?: DeckBlockLike[];
}

interface DeckLike {
  title: string;
  subtitle?: string | null;
  slides: DeckSlideLike[];
}

/** Línea corta por diapositiva: título + subtítulo del hero (si existe). */
function slideLine(slide: DeckSlideLike, index: number): string {
  const hero = (slide.blocks ?? []).find((block) => block.type === "hero");
  const detail = (hero?.subtitle ?? "").trim();
  return detail
    ? `${index + 1}. ${slide.title} — ${detail}`
    : `${index + 1}. ${slide.title}`;
}

/**
 * Devuelve el recap en texto plano (se escapa al renderizar el correo).
 * Límite: 18 líneas para no inflar el correo.
 */
export function buildPresentationRecap(document: DeckLike | null | undefined): string | null {
  if (!document || !Array.isArray(document.slides) || document.slides.length === 0) {
    return null;
  }

  const header = document.subtitle?.trim()
    ? `${document.title} — ${document.subtitle.trim()}`
    : document.title;

  const lines = document.slides.slice(0, 18).map((slide, index) => slideLine(slide, index));

  return `${header}\n${lines.join("\n")}`;
}
