import { WebSearchTool } from "@saasfly/hermes-core";
import type { JobSpec, RawCandidate, SourceResult } from "../types";

/**
 * Fuente `search` — búsqueda web (Brave).
 *
 * Opcional por diseño: si no hay `BRAVE_SEARCH_API_KEY` la fuente se declara
 * omitida con un motivo, nunca se simulan resultados. Los snippets son cortos,
 * así que producen candidatos de confianza baja (`extraction: "feed"`).
 */

export function searchConfigured(): boolean {
  return Boolean(process.env.BRAVE_SEARCH_API_KEY);
}

export async function collectSearch(spec: JobSpec, limit: number): Promise<SourceResult> {
  const started = Date.now();
  if (!searchConfigured()) {
    return {
      source: "search",
      candidates: [],
      warning: "BRAVE_SEARCH_API_KEY no configurada: fuente 'search' omitida",
      ms: 0,
    };
  }

  const query = [spec.query.trim(), ...spec.keywords.slice(0, 4)].filter(Boolean).join(" ").slice(0, 280);
  if (!query) {
    return { source: "search", candidates: [], warning: "sin consulta para búsqueda web", ms: 0 };
  }

  try {
    const result = await WebSearchTool.execute({ query, limit });
    const candidates: RawCandidate[] = result.results.slice(0, limit).map((item) => ({
      sourceType: "search",
      sourceUrl: item.url,
      sourceTitle: item.title || null,
      text: [item.title, item.snippet].filter(Boolean).join(" \n"),
      note: "resultado de búsqueda: verificar en la fuente antes de contactar",
    }));
    return {
      source: "search",
      candidates,
      warning: candidates.length === 0 ? "la búsqueda no devolvió resultados" : undefined,
      ms: Date.now() - started,
    };
  } catch (error) {
    return {
      source: "search",
      candidates: [],
      warning: `búsqueda: ${(error as Error).message ?? "error"}`,
      ms: Date.now() - started,
    };
  }
}
