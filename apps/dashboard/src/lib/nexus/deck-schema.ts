/**
 * 🏛️ ARCHITECTURE NOTE: Esquema de deck como DATO
 * ==============================================
 * Un deck es `{ title, subtitle, slides[] }`, y cada slide es un conjunto de bloques
 * tipados con sus notas de conducción. El contenido vive en `nexus_presentations`
 * (jsonb), no en JSX: editar el deck ya no requiere un deploy.
 *
 * Regla de validación: cualquier bloque desconocido se descarta y se reporta. Nunca se
 * renderiza HTML libre del cliente.
 */

export type DeckBlock =
  | { type: "hero"; kicker?: string; title: string; subtitle?: string; footnote?: string }
  | { type: "metrics"; items: Array<{ value: string; label: string }> }
  | { type: "info"; boxes: Array<{ title: string; text: string }> }
  | { type: "numbered"; items: Array<{ title: string; text: string }> }
  | { type: "pillars"; items: Array<{ title: string; text: string }> }
  | { type: "steps"; items: Array<{ label: string; title: string; text: string }> }
  | { type: "checklist"; items: string[] }
  | { type: "prices"; items: Array<{ label: string; value: string; note: string; accent?: boolean }>; footnote?: string }
  | { type: "note"; text: string }
  | { type: "closing"; title: string; steps: Array<{ label: string; title: string; text: string }>; footnote?: string };

export interface DeckSlide {
  id: string;
  title: string;
  blocks: DeckBlock[];
  /** Guión del presentador para ESTE slide */
  notes: string[];
  /** Minutos objetivo */
  minutes?: number;
}

export interface DeckDocument {
  slug: string;
  title: string;
  subtitle?: string | null;
  category?: string | null;
  status: string;
  targetMinutes: number;
  proposalKey?: string | null;
  guardrails: string[];
  slides: DeckSlide[];
}

const BLOCK_TYPES = new Set<DeckBlock["type"]>([
  "hero",
  "metrics",
  "info",
  "numbered",
  "pillars",
  "steps",
  "checklist",
  "prices",
  "note",
  "closing",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(asString).filter(Boolean) : [];
}

/**
 * Normaliza un documento de deck venido de la DB (jsonb sin tipar).
 * Devuelve `dropped` para poder reportar honestamente qué se descartó.
 */
export function normalizeDeck(
  raw: Record<string, unknown>,
  fallbackSlug: string
): { deck: DeckDocument; dropped: string[] } {
  const dropped: string[] = [];
  const rawSlides = Array.isArray(raw.slides) ? raw.slides : [];

  const slides: DeckSlide[] = [];

  rawSlides.forEach((value, index) => {
    if (!isRecord(value)) {
      dropped.push(`slide#${index}:not-an-object`);
      return;
    }

    const blocks: DeckBlock[] = [];
    (Array.isArray(value.blocks) ? value.blocks : []).forEach((block, blockIndex) => {
      if (!isRecord(block) || !BLOCK_TYPES.has(asString(block.type) as DeckBlock["type"])) {
        dropped.push(`slide#${index}.block#${blockIndex}:unknown-type`);
        return;
      }
      blocks.push(block as unknown as DeckBlock);
    });

    slides.push({
      id: asString(value.id) || `slide-${index + 1}`,
      title: asString(value.title) || `Slide ${index + 1}`,
      blocks,
      notes: asStringArray(value.notes),
      minutes: typeof value.minutes === "number" ? value.minutes : undefined,
    });
  });

  const deck: DeckDocument = {
    slug: asString(raw.slug) || fallbackSlug,
    title: asString(raw.title) || fallbackSlug,
    subtitle: asString(raw.subtitle) || null,
    category: asString(raw.category) || null,
    status: asString(raw.status) || "DRAFT",
    targetMinutes: typeof raw.targetMinutes === "number" ? raw.targetMinutes : 30,
    proposalKey: asString(raw.proposalKey) || null,
    guardrails: asStringArray(raw.guardrails),
    slides,
  };

  return { deck, dropped };
}
