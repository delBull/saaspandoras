import { parseRss, politeFetch, RobotsBlockedError } from "../http";
import type { Door, JobSpec, RawCandidate, SourceResult } from "../types";

/**
 * Fuente `press` — descubrimiento por sindicación (Google News RSS).
 *
 * Se usa el feed porque su lectura programática es explícita. Los enlaces del
 * feed son envoltorios de Google que no entregan el cuerpo del artículo, así
 * que aquí **sólo** se registran titular, medio y fecha: el prospecto nace con
 * `extraction: "feed"` y confianza baja. No se inventa contenido ni correo.
 */

const DOOR_QUERY: Record<Door, string> = {
  MX_FAMILY: "family office",
  PATIENT_CAPITAL: "patient capital fund",
  CONSOLIDATOR: "hotel consolidator",
  BROKER: "hotel investment broker",
  SOVEREIGN: "sovereign wealth fund",
};

function looksSpanish(value: string): boolean {
  return /[áéíóúñ¿¡]|\b(de|para|con|los|las|hotelero|inversión|inversionistas)\b/i.test(value);
}

function buildQuery(spec: JobSpec): string {
  const parts = [spec.query.trim()];
  if (spec.doors.length > 0) parts.push(DOOR_QUERY[spec.doors[0]!]);
  parts.push(...spec.keywords.slice(0, 4));
  return parts.filter(Boolean).join(" ").slice(0, 280);
}

export async function collectPress(spec: JobSpec, limit: number): Promise<SourceResult> {
  const started = Date.now();
  const query = buildQuery(spec);
  if (!query) {
    return { source: "press", candidates: [], warning: "sin consulta para prensa", ms: 0 };
  }

  const spanish = looksSpanish(query);
  const locale = spanish
    ? "hl=es-419&gl=MX&ceid=MX:es-419"
    : "hl=en-US&gl=US&ceid=US:en";
  const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${locale}`;

  try {
    const response = await politeFetch(feedUrl, {
      skipRobots: true,
      accept: "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.5",
      timeoutMs: 7000,
    });
    if (!response.ok) {
      return {
        source: "press",
        candidates: [],
        warning: `el feed respondió ${response.status}`,
        ms: Date.now() - started,
      };
    }

    const xml = await response.text();
    const items = parseRss(xml);
    if (items.length === 0) {
      return {
        source: "press",
        candidates: [],
        warning: "el feed no devolvió resultados",
        ms: Date.now() - started,
      };
    }

    const maxAgeMs = spec.rules.maxAgeDays > 0 ? spec.rules.maxAgeDays * 86_400_000 : Infinity;
    const now = Date.now();

    const candidates: RawCandidate[] = [];
    for (const item of items) {
      const published = item.pubDate ? new Date(item.pubDate) : null;
      if (published && Number.isFinite(published.getTime())) {
        if (now - published.getTime() > maxAgeMs) continue;
      }
      candidates.push({
        sourceType: "press",
        sourceUrl: item.link,
        sourceTitle: item.title,
        publisher: item.source,
        publishedAt: published && Number.isFinite(published.getTime()) ? published.toISOString() : null,
        text: [item.title, item.description, item.source].filter(Boolean).join(" \n"),
        note: "sindicación sin cuerpo: abrir el enlace para leer la nota",
      });
      if (candidates.length >= limit) break;
    }

    return {
      source: "press",
      candidates,
      warning: candidates.length === 0 ? "todos los resultados exceden la edad máxima" : undefined,
      ms: Date.now() - started,
    };
  } catch (error) {
    const message =
      error instanceof RobotsBlockedError ? error.message : (error as Error).message ?? "error de red";
    return { source: "press", candidates: [], warning: `prensa: ${message}`, ms: Date.now() - started };
  }
}
