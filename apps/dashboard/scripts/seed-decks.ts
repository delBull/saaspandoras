/**
 * Seed de decks (CMS soberano).
 *
 * Uso (requiere DATABASE_URL):
 *   cd apps/dashboard && bun run seed:decks
 *
 * - Lee todos los `src/lib/nexus/decks/*.deck.json`
 * - Upsert por `slug` en `nexus_presentations`
 * - `ON CONFLICT DO UPDATE` controlado: refresca metadata y slides del archivo
 *   (el archivo es la fuente versionada; si editas en DB y corres el seed, se
 *   sobrescribe con el contenido del repo).
 *
 * Es idempotente: correrlo dos veces deja el mismo resultado.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "@saasfly/db-core";
import { nexusPresentations } from "@saasfly/db-core/schema";

interface DeckFile {
  slug: string;
  title: string;
  subtitle?: string;
  category?: string;
  status?: string;
  targetMinutes?: number;
  proposalKey?: string;
  guardrails?: string[];
  slides: unknown[];
}

const DECKS_DIR = fileURLToPath(new URL("../src/lib/nexus/decks/", import.meta.url));

async function main() {
  const files = readdirSync(DECKS_DIR).filter((name) => name.endsWith(".deck.json"));
  if (files.length === 0) {
    console.log("[SeedDecks] No hay archivos *.deck.json — nada que sembrar.");
    return;
  }

  for (const file of files) {
    const raw = readFileSync(join(DECKS_DIR, file), "utf8");
    const deck = JSON.parse(raw) as DeckFile;

    if (!deck.slug || !Array.isArray(deck.slides) || deck.slides.length === 0) {
      console.error(`[SeedDecks] ${file}: falta slug o slides — se omite.`);
      continue;
    }

    await db
      .insert(nexusPresentations)
      .values({
        slug: deck.slug,
        title: deck.title,
        subtitle: deck.subtitle ?? null,
        category: deck.category ?? null,
        status: deck.status ?? "PUBLISHED",
        targetMinutes: deck.targetMinutes ?? 30,
        proposalKey: deck.proposalKey ?? null,
        guardrails: deck.guardrails ?? [],
        slides: deck.slides,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: nexusPresentations.slug,
        set: {
          title: deck.title,
          subtitle: deck.subtitle ?? null,
          category: deck.category ?? null,
          status: deck.status ?? "PUBLISHED",
          targetMinutes: deck.targetMinutes ?? 30,
          proposalKey: deck.proposalKey ?? null,
          guardrails: deck.guardrails ?? [],
          slides: deck.slides,
          updatedAt: new Date(),
        },
      });

    console.log(`[SeedDecks] ${deck.slug}: ${deck.slides.length} slides.`);
  }

  console.log("[SeedDecks] Listo.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[SeedDecks] Error:", error);
    process.exit(1);
  });
