import {
  DEFAULT_RULES,
  DOORS,
  SCHEDULES,
  SOURCE_TYPES,
  type Door,
  type JobSpec,
  type ProspectRules,
  type Schedule,
  type SourceType,
} from "./types";

/** Sólo http(s) y host válido. */
export function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function asString(value: unknown, max = 255): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export function asInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function asDoors(value: unknown): Door[] {
  if (!Array.isArray(value)) return [];
  const set = new Set<Door>();
  for (const item of value) {
    if (typeof item === "string" && (DOORS as readonly string[]).includes(item)) {
      set.add(item as Door);
    }
  }
  return [...set];
}

function asSources(value: unknown): SourceType[] {
  if (!Array.isArray(value)) return [];
  const set = new Set<SourceType>();
  for (const item of value) {
    if (typeof item === "string" && (SOURCE_TYPES as readonly string[]).includes(item)) {
      set.add(item as SourceType);
    }
  }
  return [...set];
}

function asStringList(value: unknown, maxItems = 20, maxLen = 120): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    const parsed = asString(item, maxLen);
    if (parsed && !out.includes(parsed)) out.push(parsed);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function asSchedule(value: unknown): Schedule {
  const raw = String(value ?? "").toUpperCase();
  return (SCHEDULES as readonly string[]).includes(raw) ? (raw as Schedule) : "MANUAL";
}

function normalizeRules(value: unknown): ProspectRules {
  const raw = (value ?? {}) as Record<string, unknown>;
  return {
    minConfidence: asInt(raw.minConfidence, DEFAULT_RULES.minConfidence, 0, 100),
    maxAgeDays: asInt(raw.maxAgeDays, DEFAULT_RULES.maxAgeDays, 0, 3650),
    requireEmail: raw.requireEmail === true,
    excludeDomains: asStringList(raw.excludeDomains, 30, 120).map((d) =>
      d.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? d,
    ),
    excludeKeywords: asStringList(raw.excludeKeywords, 30, 60),
  };
}

/**
 * Normaliza cualquier entrada (body de API o jsonb de la DB) a un `JobSpec`
 * completo. Nunca lanza: si un campo es inválido cae al default y se ignora.
 */
export function normalizeSpec(value: unknown, fallbackQuery = ""): JobSpec {
  const raw = (value ?? {}) as Record<string, unknown>;
  const query = asString(raw.query, 500) ?? fallbackQuery;
  const targetUrls: string[] = [];
  if (Array.isArray(raw.targetUrls)) {
    for (const item of raw.targetUrls) {
      const url = safeUrl(item);
      if (url && !targetUrls.includes(url)) targetUrls.push(url);
      if (targetUrls.length >= 15) break;
    }
  }
  const sources = asSources(raw.sources);
  const resolvedSources: SourceType[] = sources.length
    ? sources
    : targetUrls.length
      ? ["corporate"]
      : ["press", "corporate"];

  return {
    query,
    doors: asDoors(raw.doors),
    sources: resolvedSources,
    targetUrls,
    keywords: asStringList(raw.keywords, 20, 80),
    rules: normalizeRules(raw.rules),
    maxItemsPerSource: asInt(raw.maxItemsPerSource, 8, 1, 20),
  };
}

/** Texto legible del spec para mostrar en la UI. */
export function describeSpec(spec: JobSpec): string[] {
  const notes: string[] = [];
  notes.push(`Consulta: “${spec.query || "(sin texto)"}”`);
  if (spec.doors.length) notes.push(`Puertas: ${spec.doors.join(", ")}`);
  notes.push(`Fuentes: ${spec.sources.join(", ")}`);
  if (spec.targetUrls.length) notes.push(`Targets: ${spec.targetUrls.length} URL(s)`);
  if (spec.keywords.length) notes.push(`Palabras clave: ${spec.keywords.join(", ")}`);
  notes.push(
    `Reglas: confianza ≥ ${spec.rules.minConfidence} · edad ≤ ${spec.rules.maxAgeDays || "∞"} días${
      spec.rules.requireEmail ? " · sólo con correo" : ""
    }`,
  );
  return notes;
}
