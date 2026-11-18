import { db } from "@saasfly/db-core";
import { nexusPresentations } from "@saasfly/db-core/schema";
import { eq } from "@saasfly/db-core";
import { normalizeDeck, type DeckDocument } from "./deck-schema";

/**
 * Repositorio de decks (CMS soberano).
 *
 * `getDeck(slug)` devuelve el deck desde `nexus_presentations` normalizado. Si la tabla
 * no existe todavía (migración pendiente) o el deck no está publicado, devuelve null
 * y el llamador decide el fallback — nunca se inventa contenido.
 */
export async function getDeck(slug: string): Promise<DeckDocument | null> {
  try {
    const [row] = await db
      .select()
      .from(nexusPresentations)
      .where(eq(nexusPresentations.slug, slug))
      .limit(1);

    if (!row) return null;

    const { deck } = normalizeDeck(
      {
        slug: row.slug,
        title: row.title,
        subtitle: row.subtitle,
        category: row.category,
        status: row.status,
        targetMinutes: row.targetMinutes,
        proposalKey: row.proposalKey,
        guardrails: row.guardrails,
        slides: row.slides,
      },
      slug
    );

    return deck.slides.length > 0 ? deck : null;
  } catch (error) {
    console.error(`[Decks] No se pudo leer el deck '${slug}':`, error);
    return null;
  }
}

export async function listDecks(): Promise<DeckDocument[]> {
  try {
    const rows = await db.select().from(nexusPresentations);
    return rows
      .map((row) =>
        normalizeDeck(
          {
            slug: row.slug,
            title: row.title,
            subtitle: row.subtitle,
            category: row.category,
            status: row.status,
            targetMinutes: row.targetMinutes,
            proposalKey: row.proposalKey,
            guardrails: row.guardrails,
            slides: row.slides,
          },
          row.slug
        ).deck
      )
      .filter((deck) => deck.slides.length > 0);
  } catch (error) {
    console.error("[Decks] No se pudo listar:", error);
    return [];
  }
}
