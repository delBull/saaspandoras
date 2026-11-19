import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findPresentation } from "../presentations-catalog";

const DECK_PATH = join(process.cwd(), "src/lib/nexus/decks/aurora-demo.deck.json");

const ALLOWED_BLOCKS = new Set([
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

describe("🧪 Deck de prueba Aurora (demo)", () => {
  const deck = JSON.parse(readFileSync(DECK_PATH, "utf8"));
  const catalog = findPresentation("aurora-demo");

  it("AUR-01: está en el catálogo y se declara como demo", () => {
    expect(catalog).toBeTruthy();
    expect(catalog?.slug).toBe("aurora-demo");
    expect(catalog?.title).toContain("Aurora");
    expect(catalog?.subtitle.toLowerCase()).toContain("ficticios");
    expect(catalog?.status).toBe("Deck de prueba");
  });

  it("AUR-02: mantiene la estructura de Celeste (10 slides) sin datos reales", () => {
    expect(deck.slides).toHaveLength(10);
    expect(deck.guardrails).toHaveLength(7);
    const notes = deck.slides.reduce((acc: number, slide: any) => acc + slide.notes.length, 0);
    expect(notes).toBe(32);
    expect(deck.guardrails[0].toLowerCase()).toContain("ficticias");
  });

  it("AUR-03: todos los bloques son tipos soportados por el renderer", () => {
    for (const slide of deck.slides) {
      for (const block of slide.blocks) {
        expect(ALLOWED_BLOCKS.has(block.type)).toBe(true);
      }
    }
  });

  it("AUR-04: el guión del catálogo cubre los mismos slides y notas", () => {
    expect(catalog?.script).toHaveLength(deck.slides.length);
    const catalogBeats = catalog?.script.reduce((acc, block) => acc + block.beats.length, 0);
    const deckNotes = deck.slides.reduce((acc: number, slide: any) => acc + slide.notes.length, 0);
    expect(catalogBeats).toBe(deckNotes);
  });

  it("AUR-05: no reutiliza el nombre ni las cifras de Celeste", () => {
    const raw = JSON.stringify(deck);
    expect(raw).not.toContain("Celeste");
    expect(raw).not.toContain("$138k");
    expect(raw).not.toContain("104 fracciones");
  });
});
