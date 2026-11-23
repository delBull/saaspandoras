import { WebExtractTool } from "@saasfly/hermes-core";
import { politeFetch } from "../http";
import type { JobSpec, RawCandidate, SourceResult } from "../types";

/**
 * Fuente `sec` — EDGAR full-text search (API pública de la SEC).
 *
 * Aporta hechos duros: formulario, empresa declarante, fecha y URL del documento.
 * El cuerpo se descarga del archivo público para buscar nombres y cargos; los
 * correos sólo se conservan si aparecen escritos en el documento.
 */

const FTS_ENDPOINT = "https://efts.sec.gov/LATEST/search-index";
const MAX_DOC_FETCHES = 4;

interface EdgarHit {
  _id?: string;
  _source?: {
    adsh?: string;
    ciks?: string[];
    display_names?: string[];
    file_date?: string;
    form?: string;
    file_description?: string;
  };
}

function buildFtsQuery(spec: JobSpec): string {
  const quoted = spec.query.trim().replace(/"/g, "").slice(0, 200);
  const keywords = spec.keywords.filter(Boolean).slice(0, 4);
  if (quoted && keywords.length) return `"${quoted}" OR ${keywords.join(" OR ")}`;
  if (quoted) return `"${quoted}"`;
  return keywords.join(" OR ");
}

function cleanCompany(displayName: string | undefined): string | null {
  if (!displayName) return null;
  const withoutTickers = displayName.split("  (")[0] ?? displayName;
  const withoutCik = withoutTickers.replace(/\s*\(CIK\s*\d+\)\s*$/i, "");
  return withoutCik.trim().slice(0, 255) || null;
}

function documentUrl(hit: EdgarHit): string | null {
  const source = hit._source;
  const [adshFromId, fileFromId] = (hit._id ?? "").split(":");
  const adsh = source?.adsh ?? adshFromId;
  const cik = source?.ciks?.[0];
  if (!adsh || !fileFromId || !cik) return null;
  const cikNumeric = String(Number(cik));
  if (!Number.isFinite(Number(cikNumeric))) return null;
  return `https://www.sec.gov/Archives/edgar/data/${cikNumeric}/${adsh.replace(/-/g, "")}/${fileFromId}`;
}

export async function collectSec(spec: JobSpec, limit: number): Promise<SourceResult> {
  const started = Date.now();
  const query = buildFtsQuery(spec);
  if (!query) {
    return { source: "sec", candidates: [], warning: "sin consulta para EDGAR", ms: 0 };
  }

  // EDGAR ordena por relevancia, no por fecha: el rango se filtra en el servidor.
  const params = new URLSearchParams({ q: query, forms: "8-K" });
  if (spec.rules.maxAgeDays > 0) {
    const end = new Date();
    const start = new Date(end.getTime() - spec.rules.maxAgeDays * 86_400_000);
    params.set("dateRange", "custom");
    params.set("startdt", start.toISOString().slice(0, 10));
    params.set("enddt", end.toISOString().slice(0, 10));
  }
  const url = `${FTS_ENDPOINT}?${params.toString()}`;
  let hits: EdgarHit[] = [];
  try {
    const response = await politeFetch(url, {
      skipRobots: true,
      accept: "application/json",
      timeoutMs: 9000,
    });
    if (!response.ok) {
      return {
        source: "sec",
        candidates: [],
        warning: `EDGAR respondió ${response.status}`,
        ms: Date.now() - started,
      };
    }
    const payload = (await response.json()) as { hits?: { hits?: EdgarHit[] } };
    hits = payload.hits?.hits ?? [];
  } catch (error) {
    return {
      source: "sec",
      candidates: [],
      warning: `EDGAR: ${(error as Error).message ?? "error de red"}`,
      ms: Date.now() - started,
    };
  }

  const maxAgeMs = spec.rules.maxAgeDays > 0 ? spec.rules.maxAgeDays * 86_400_000 : Infinity;
  const now = Date.now();
  const candidates: RawCandidate[] = [];
  const warnings: string[] = [];
  let docFetches = 0;

  for (const hit of hits) {
    if (candidates.length >= limit) break;
    const filedAt = hit._source?.file_date ? new Date(hit._source.file_date) : null;
    if (filedAt && Number.isFinite(filedAt.getTime()) && now - filedAt.getTime() > maxAgeMs) continue;

    const docUrl = documentUrl(hit);
    if (!docUrl) continue;
    const company = cleanCompany(hit._source?.display_names?.[0]);

    let text = "";
    if (docFetches < MAX_DOC_FETCHES) {
      docFetches += 1;
      try {
        const doc = await politeFetch(docUrl, {
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          timeoutMs: 9000,
        });
        if (doc.ok) {
          const html = await doc.text();
          text = WebExtractTool.parseHtml(html, docUrl).text.slice(0, 24_000);
        } else {
          warnings.push(`${docUrl}: HTTP ${doc.status}`);
        }
      } catch (error) {
        warnings.push(`${docUrl}: ${(error as Error).message ?? "error"}`);
      }
    }

    candidates.push({
      sourceType: "sec",
      sourceUrl: docUrl,
      sourceTitle: `${hit._source?.form ?? "8-K"} · ${company ?? "declarante"}`,
      publisher: company,
      publishedAt: filedAt && Number.isFinite(filedAt.getTime()) ? filedAt.toISOString() : null,
      text,
      note: text ? undefined : "documento sin cuerpo recuperado",
    });
  }

  return {
    source: "sec",
    candidates,
    warning: warnings.length ? warnings.join(" · ") : undefined,
    ms: Date.now() - started,
  };
}
