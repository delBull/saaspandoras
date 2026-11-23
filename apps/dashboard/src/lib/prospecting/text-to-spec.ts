import OpenAI from "openai";
import { normalizeForMatch, llmAvailable } from "./extract";
import { asInt, asSchedule, normalizeSpec, safeUrl } from "./spec";
import {
  DEFAULT_RULES,
  DOORS,
  SOURCE_TYPES,
  type Door,
  type JobSpec,
  type Schedule,
  type SourceType,
} from "./types";

/**
 * Text-to-scrap.
 *
 * Camino B del módulo: el operador escribe en lenguaje natural qué quiere
 * encontrar ("family offices en CDMX que hayan comprado hoteles en los últimos
 * 6 meses, con correo") y se produce un `JobSpec` estructurado.
 *
 * El parser determinista siempre corre y es la base. Si hay `OPENAI_API_KEY`, el
 * modelo **refina** el spec; sus valores se validan contra los enums y formatos
 * antes de aceptarse. Lo que no se entiende queda como nota visible, nunca como
 * una suposición silenciosa.
 */

export interface TextToSpecResult {
  spec: JobSpec;
  notes: string[];
  usedLlm: boolean;
  /** Frecuencia detectada en el texto (la columna vive en el job, no en el spec). */
  suggestedSchedule: Schedule | null;
}

const DOOR_PATTERNS: Array<{ door: Door; re: RegExp }> = [
  { door: "MX_FAMILY", re: /family offices?|oficinas? de familia|patrimonio familiar|hnw/i },
  { door: "PATIENT_CAPITAL", re: /patient capital|capital paciente|fondos? cerrados?|endowment|pensiones?/i },
  { door: "CONSOLIDATOR", re: /consolidador|consolidadores|roll-?up|grupos? hoteleros?|holdings?/i },
  { door: "BROKER", re: /brokers?|corredores?|intermediarios?|asesores?|advisors?/i },
  { door: "SOVEREIGN", re: /soberanos?|sovereign|wealth funds?|multilaterales?/i },
];

const SOURCE_PATTERNS: Array<{ source: SourceType; re: RegExp }> = [
  { source: "press", re: /prensa|noticias|news|medios|comunicados?|press releases?/i },
  { source: "sec", re: /\bsec\b|edgar|8-?k|10-?k|filings?|regulatori/i },
  { source: "corporate", re: /sitios? web|p[aá]ginas? oficiales|webs? corporativ|portafolios?/i },
  { source: "search", re: /busca(r)? en (la )?web|google|b[uú]squeda web|search/i },
];

function parseAgeDays(text: string): number | null {
  const match = /(?:[uú]ltimos?|hace)\s+(\d+)\s*(d[ií]as?|semanas?|meses?|a[nñ]os?)/i.exec(text);
  if (match) {
    const value = Number.parseInt(match[1] ?? "", 10);
    const unit = normalizeForMatch(match[2] ?? "");
    if (Number.isFinite(value)) {
      if (unit.startsWith("dia")) return value;
      if (unit.startsWith("semana")) return value * 7;
      if (unit.startsWith("mes")) return value * 30;
      if (unit.startsWith("ano")) return value * 365;
    }
  }
  if (/[uú]ltimo\s+a[nñ]o|[uú]ltimos\s+12\s+meses/i.test(text)) return 365;
  if (/[uú]ltimo\s+trimestre|[uú]ltimos?\s+3\s+meses/i.test(text)) return 90;
  if (/[uú]ltimo\s+mes|[uú]ltimos?\s+30\s+d[ií]as/i.test(text)) return 30;
  if (/este\s+a[nñ]o/i.test(text)) {
    const start = new Date(new Date().getFullYear(), 0, 1).getTime();
    return Math.max(1, Math.ceil((Date.now() - start) / 86_400_000));
  }
  return null;
}

function parseSchedule(text: string): Schedule | null {
  if (/cada\s+hora|por\s+hora|horari[ao]/i.test(text)) return "HOURLY";
  if (/diari[ao]|todos\s+los\s+d[ií]as|cada\s+d[ií]a/i.test(text)) return "DAILY";
  if (/semanal|cada\s+semana|semanales/i.test(text)) return "WEEKLY";
  if (/mensual|cada\s+mes/i.test(text)) return "WEEKLY"; // el cron mínimo es semanal; se anota
  if (/manual|bajo\s+demanda|cuando\s+yo\s+lo\s+pida/i.test(text)) return "MANUAL";
  return null;
}

function extractQuoted(text: string): string[] {
  const out: string[] = [];
  for (const match of text.matchAll(/["“”']([^"“”']{3,80})["“”']/g)) {
    const value = match[1]?.trim();
    if (value && !out.includes(value)) out.push(value);
  }
  return out.slice(0, 8);
}

function extractUrls(text: string): string[] {
  const out: string[] = [];
  for (const match of text.matchAll(/https?:\/\/[^\s<>"')]+/gi)) {
    const url = safeUrl(match[0]);
    if (url && !out.includes(url)) out.push(url);
  }
  return out.slice(0, 15);
}

function cleanQuery(text: string): string {
  return text
    .replace(/https?:\/\/[^\s<>"')]+/gi, " ")
    .replace(/["“”']/g, " ")
    .replace(/\b(con correo|que tengan correo|correo electr[oó]nico|email)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

export function deterministicSpec(text: string): TextToSpecResult {
  const notes: string[] = [];
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      spec: normalizeSpec({}, ""),
      notes: ["No hay texto: escribe qué quieres encontrar."],
      usedLlm: false,
      suggestedSchedule: null,
    };
  }

  const doors = DOOR_PATTERNS.filter((pattern) => pattern.re.test(trimmed)).map((pattern) => pattern.door);
  const urls = extractUrls(trimmed);
  const quoted = extractQuoted(trimmed);
  const ageDays = parseAgeDays(trimmed);
  const schedule = parseSchedule(trimmed);
  const requireEmail = /\bcon correo|que tengan correo|correo electr[oó]nico verificado|email verificado\b/i.test(trimmed);

  const explicitSources = SOURCE_PATTERNS.filter((pattern) => pattern.re.test(trimmed)).map((pattern) => pattern.source);
  const sources = new Set<SourceType>(explicitSources);
  if (urls.length > 0) sources.add("corporate");
  if (sources.size === 0) {
    sources.add("press");
    sources.add("corporate");
    notes.push("No se indicó fuente: se usan prensa + targets (si agregas URLs, se rastrean).");
  }

  const query = quoted.length > 0 ? quoted.join(" OR ") : cleanQuery(trimmed);
  if (!query) notes.push("La consulta quedó vacía después de limpiar instrucciones: agrégala en el campo de consulta.");

  const spec = normalizeSpec({
    query,
    doors,
    sources: [...sources],
    targetUrls: urls,
    keywords: quoted,
    rules: {
      minConfidence: /confianza\s+alta|muy\s+confiable/i.test(trimmed) ? 65 : DEFAULT_RULES.minConfidence,
      maxAgeDays: ageDays ?? DEFAULT_RULES.maxAgeDays,
      requireEmail,
      excludeDomains: DEFAULT_RULES.excludeDomains,
      excludeKeywords: [],
    },
    maxItemsPerSource: 8,
  });

  if (doors.length) notes.push(`Puertas detectadas: ${doors.join(", ")}`);
  if (urls.length) notes.push(`Targets detectados: ${urls.length}`);
  if (ageDays !== null) notes.push(`Edad máxima: ${ageDays} días`);
  if (schedule) notes.push(`Frecuencia: ${schedule}${/mensual|cada mes/i.test(trimmed) ? " (el cron mínimo es semanal)" : ""}`);
  if (requireEmail) notes.push("Sólo se aceptarán prospectos con correo escrito en la fuente");

  return {
    spec: { ...spec, query: query || spec.query },
    notes,
    usedLlm: false,
    suggestedSchedule: schedule,
  };
}

interface LlmSpecPatch {
  query?: unknown;
  doors?: unknown;
  sources?: unknown;
  targetUrls?: unknown;
  keywords?: unknown;
  maxAgeDays?: unknown;
  minConfidence?: unknown;
  requireEmail?: unknown;
  schedule?: unknown;
}

async function refineWithLlm(text: string, base: TextToSpecResult): Promise<TextToSpecResult> {
  if (!llmAvailable()) return base;

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 20000,
    maxRetries: 1,
  });
  const model = process.env.PROSPECTING_MODEL ?? process.env.HERMES_COGNITIVE_MODEL ?? "gpt-4o-mini";

  const system = [
    "Convierte la petición de prospección en un job estructurado. Devuelves sólo JSON.",
    `doors válidos: ${DOORS.join(", ")}.`,
    `sources válidos: ${SOURCE_TYPES.join(", ")}.`,
    "schedule válido: MANUAL, HOURLY, DAILY, WEEKLY.",
    "No inventes URLs: sólo las que aparezcan en el texto.",
    'Formato: {"query":"","doors":[],"sources":[],"targetUrls":[],"keywords":[],"maxAgeDays":30,"minConfidence":50,"requireEmail":false,"schedule":"MANUAL"}',
  ].join("\n");

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: text.slice(0, 4000) },
      ],
    });
    const raw = (response.choices[0]?.message?.content ?? "{}") as string;
    const patch = JSON.parse(raw) as LlmSpecPatch;
    const notes = [...base.notes];
    const spec = { ...base.spec };

    if (typeof patch.query === "string" && patch.query.trim()) {
      const query = patch.query.trim().slice(0, 240);
      if (query !== spec.query) {
        spec.query = query;
        notes.push("Consulta refinada por el modelo");
      }
    }
    if (Array.isArray(patch.doors)) {
      const doors = patch.doors.filter(
        (door): door is Door => typeof door === "string" && (DOORS as readonly string[]).includes(door),
      );
      if (doors.length) spec.doors = [...new Set(doors)];
    }
    if (Array.isArray(patch.sources)) {
      const sources = patch.sources.filter(
        (source): source is SourceType =>
          typeof source === "string" && (SOURCE_TYPES as readonly string[]).includes(source),
      );
      if (sources.length) spec.sources = [...new Set(sources)];
    }
    if (Array.isArray(patch.targetUrls)) {
      const urls = patch.targetUrls.map(safeUrl).filter((url): url is string => Boolean(url));
      if (urls.length) spec.targetUrls = [...new Set(urls)].slice(0, 15);
    }
    if (Array.isArray(patch.keywords)) {
      const keywords = patch.keywords
        .filter((keyword): keyword is string => typeof keyword === "string")
        .map((keyword) => keyword.trim().slice(0, 80))
        .filter(Boolean)
        .slice(0, 20);
      if (keywords.length) spec.keywords = [...new Set(keywords)];
    }
    if (patch.maxAgeDays !== undefined) {
      spec.rules = { ...spec.rules, maxAgeDays: asInt(patch.maxAgeDays, spec.rules.maxAgeDays, 0, 3650) };
    }
    if (patch.minConfidence !== undefined) {
      spec.rules = { ...spec.rules, minConfidence: asInt(patch.minConfidence, spec.rules.minConfidence, 0, 100) };
    }
    if (typeof patch.requireEmail === "boolean") {
      spec.rules = { ...spec.rules, requireEmail: patch.requireEmail };
    }

    // El schedule no vive en el spec (columna propia), se anota para la UI.
    const schedule = asSchedule(patch.schedule);
    if (schedule !== "MANUAL") notes.push(`Frecuencia sugerida: ${schedule}`);

    return { spec, notes, usedLlm: true, suggestedSchedule: schedule ?? base.suggestedSchedule };
  } catch (error) {
    console.warn("[prospecting] refinamiento LLM falló:", (error as Error).message);
    return {
      ...base,
      notes: [...base.notes, "El modelo no respondió: se usó el parser determinista."],
    };
  }
}

/** Convierte texto libre en un spec, con o sin LLM. */
export async function textToSpec(text: string): Promise<TextToSpecResult> {
  const base = deterministicSpec(text);
  return refineWithLlm(text, base);
}
