import type { JobSpec, SourceResult, SourceType } from "../types";
import { collectCorporate } from "./corporate";
import { collectPress } from "./news";
import { collectSearch } from "./search";
import { collectSec } from "./sec";

export { collectCorporate } from "./corporate";
export { collectPress } from "./news";
export { collectSearch, searchConfigured } from "./search";
export { collectSec } from "./sec";

/**
 * Registro de fuentes.
 *
 * Agregar una fuente = agregar una entrada aquí y un tipo en `SourceType`.
 * El runner no conoce implementaciones: sólo este mapa.
 */
const COLLECTORS: Record<SourceType, (spec: JobSpec, limit: number) => Promise<SourceResult>> = {
  corporate: collectCorporate,
  press: collectPress,
  sec: collectSec,
  search: collectSearch,
};

/** Orden de ejecución: primero lo verificable, al final lo exploratorio. */
const PRIORITY: SourceType[] = ["corporate", "sec", "press", "search"];

export async function collectFromSource(
  source: SourceType,
  spec: JobSpec,
  limit: number,
): Promise<SourceResult> {
  const collector = COLLECTORS[source];
  if (!collector) {
    return { source, candidates: [], warning: `fuente no implementada: ${source}`, ms: 0 };
  }
  return collector(spec, limit);
}

export function sourcesInOrder(spec: JobSpec): SourceType[] {
  return PRIORITY.filter((source) => spec.sources.includes(source));
}
