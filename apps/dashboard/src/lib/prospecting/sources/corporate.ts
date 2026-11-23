import { WebExtractTool } from "@saasfly/hermes-core";
import { decodeEntities, politeFetch, RobotsBlockedError } from "../http";
import type { JobSpec, RawCandidate, SourceResult } from "../types";

/**
 * Fuente `corporate` — webs que el operador declara como objetivo.
 *
 * No se adivina el sitio de una empresa: se recolecta exactamente lo que el
 * operador puso en `targetUrls` (más páginas de equipo/contacto del mismo host,
 * hasta 2 por sitio). Todo pasa por `robots.txt` y rate limit de 1 req/s.
 */

const FOLLOW_RE = /(team|leadership|people|about|contact|management|board|equipo|nosotros|contacto|directivos|qui[eé]nes-somos)/i;
const MAX_SITES = 5;
const MAX_FOLLOW_PER_SITE = 2;
const MAX_TEXT = 24_000;

function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).hostname.toLowerCase() === new URL(b).hostname.toLowerCase();
  } catch {
    return false;
  }
}

async function fetchPage(url: string): Promise<{ title: string; text: string; links: string[] }> {
  const response = await politeFetch(url, {
    accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const extracted = WebExtractTool.parseHtml(html, url);
  return {
    title: decodeEntities(extracted.title),
    text: extracted.text.slice(0, MAX_TEXT),
    links: extracted.links,
  };
}

export async function collectCorporate(spec: JobSpec, limit: number): Promise<SourceResult> {
  const started = Date.now();
  const warnings: string[] = [];
  const candidates: RawCandidate[] = [];

  const sites = spec.targetUrls.slice(0, MAX_SITES);
  if (sites.length === 0) {
    return {
      source: "corporate",
      candidates: [],
      warning: "sin targets: agrega al menos una URL corporativa",
      ms: 0,
    };
  }

  for (const site of sites) {
    if (candidates.length >= limit) break;
    let followUrls: string[] = [];
    try {
      const page = await fetchPage(site);
      candidates.push({
        sourceType: "corporate",
        sourceUrl: site,
        sourceTitle: page.title || null,
        text: page.text,
      });
      followUrls = page.links
        .filter((link) => sameHost(link, site) && FOLLOW_RE.test(link))
        .filter((link) => !/\/(blog|news|press|pr|careers|jobs)\//i.test(link))
        .slice(0, MAX_FOLLOW_PER_SITE);
    } catch (error) {
      const message =
        error instanceof RobotsBlockedError ? error.message : (error as Error).message ?? "error";
      warnings.push(`${site}: ${message}`);
      continue;
    }

    for (const follow of followUrls) {
      if (candidates.length >= limit) break;
      try {
        const page = await fetchPage(follow);
        candidates.push({
          sourceType: "corporate",
          sourceUrl: follow,
          sourceTitle: page.title || null,
          text: page.text,
        });
      } catch (error) {
        const message =
          error instanceof RobotsBlockedError ? error.message : (error as Error).message ?? "error";
        warnings.push(`${follow}: ${message}`);
      }
    }
  }

  return {
    source: "corporate",
    candidates,
    warning: warnings.length ? warnings.join(" · ") : undefined,
    ms: Date.now() - started,
  };
}
