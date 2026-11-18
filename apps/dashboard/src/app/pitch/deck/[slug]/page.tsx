import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { DeckRenderer } from "@/components/presentation/DeckRenderer";
import { getDeck } from "@/lib/nexus/deck-repository";

export const dynamic = "force-dynamic";

/**
 * Deck servido desde base de datos (CMS soberano).
 * `/pitch/deck/celeste` — el contenido y el guión viven en `nexus_presentations`.
 *
 * Si el deck no está sembrado, devuelve 404 en vez de un deck vacío: nunca se
 * presenta contenido inventado.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const deck = await getDeck(slug);
  return {
    title: deck ? `${deck.title} | Pandora's` : "Deck no disponible | Pandora's",
    description: deck?.subtitle ?? undefined,
    robots: { index: false, follow: false },
  };
}

/** Decks versionados en código que sirven de respaldo mientras no estén sembrados. */
const STATIC_DECK_FALLBACK: Record<string, string> = {
  celeste: "/pitch/celeste",
  "real-estate-growth": "/pitch/real-estate-growth",
  "institutional-os": "/pitch/institutional-os",
};

export default async function DeckPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const deck = await getDeck(slug);

  if (!deck) {
    // Antes de sembrar la DB el deck sigue funcionando con su versión estática.
    const fallback = STATIC_DECK_FALLBACK[slug];
    if (fallback) redirect(fallback);
    notFound();
  }

  return <DeckRenderer deck={deck} />;
}
