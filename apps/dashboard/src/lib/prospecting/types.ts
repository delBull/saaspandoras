/**
 * Prospección — tipos del módulo.
 *
 * Este módulo es **autónomo**: no importa componentes de UI ni conoce el Deal
 * Pod. El pod sólo aporta contexto (`podId`) para agrupar y enlazar semillas.
 * Eso permite reutilizarlo desde el Portal de Hermes o Growth OS sin reescribir
 * la lógica: se importa el runner y se le pasa un `JobSpec` + la organización.
 */

export const DOORS = [
  "CONSOLIDATOR",
  "BROKER",
  "PATIENT_CAPITAL",
  "SOVEREIGN",
  "MX_FAMILY",
] as const;
export type Door = (typeof DOORS)[number];

export const SOURCE_TYPES = ["press", "corporate", "sec", "search"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const SCHEDULES = ["MANUAL", "HOURLY", "DAILY", "WEEKLY"] as const;
export type Schedule = (typeof SCHEDULES)[number];

export const JOB_STATUSES = ["QUEUED", "RUNNING", "DONE", "FAILED", "PAUSED"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const PROSPECT_STATUSES = ["NEW", "APPROVED", "REJECTED", "CONTACTED"] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

/** Reglas duras del job: qué entra y qué se descarta. */
export interface ProspectRules {
  /** Confianza mínima (0–100). */
  minConfidence: number;
  /** Edad máxima de la fuente en días. 0 = sin límite. */
  maxAgeDays: number;
  /** Si es true, sólo entran prospectos con correo literal en la fuente. */
  requireEmail: boolean;
  /** Dominios que nunca se recolectan (p. ej. linkedin.com). */
  excludeDomains: string[];
  /** Palabras que descalifican un candidato (p. ej. "becario"). */
  excludeKeywords: string[];
}

/** Job normalizado. Es el contrato que consume el runner. */
export interface JobSpec {
  query: string;
  doors: Door[];
  sources: SourceType[];
  /** URLs objetivo (webs corporativas, prensa concreta, etc.). */
  targetUrls: string[];
  keywords: string[];
  rules: ProspectRules;
  /** Tope de candidatos por fuente y corrida (controla costo y latencia). */
  maxItemsPerSource: number;
}

export const DEFAULT_RULES: ProspectRules = {
  minConfidence: 50,
  maxAgeDays: 30,
  requireEmail: false,
  excludeDomains: ["linkedin.com", "facebook.com", "instagram.com", "twitter.com", "x.com"],
  excludeKeywords: [],
};

export const DEFAULT_SPEC: JobSpec = {
  query: "",
  doors: [],
  sources: ["press", "corporate"],
  targetUrls: [],
  keywords: [],
  rules: DEFAULT_RULES,
  maxItemsPerSource: 8,
};

/** Candidato crudo, antes de extracción. */
export interface RawCandidate {
  sourceType: SourceType;
  sourceUrl: string;
  sourceTitle: string | null;
  publisher?: string | null;
  /** ISO date si la fuente la publica. */
  publishedAt?: string | null;
  /** Texto ya limpio (puede venir vacío: hay fuentes que sólo permiten titular). */
  text?: string;
  /** Nota de por qué no hay texto (p. ej. "feed sin cuerpo"). */
  note?: string;
}

/** Resultado de extracción sobre un candidato. */
export interface ExtractedCandidate {
  company: string | null;
  personName: string | null;
  role: string | null;
  email: string | null;
  door: Door | null;
  confidence: number;
  extraction: "llm" | "regex" | "feed";
  evidence: string[];
}

export interface SourceResult {
  source: SourceType;
  candidates: RawCandidate[];
  /** Motivo honesto cuando la fuente no devuelve nada. */
  warning?: string;
  ms: number;
}

export interface RunSummary {
  jobId: string;
  status: JobStatus;
  candidates: number;
  extracted: number;
  inserted: number;
  skipped: number;
  /** Conteo por motivo: edad, dominio/palabra excluida, sin correo, confianza, duplicado, error. */
  skipReasons: Record<string, number>;
  warnings: string[];
  perSource: Array<{ source: SourceType; found: number; warning?: string; ms: number }>;
  ms: number;
}

/** Fila de `nexus_prospects` tal como la devuelve la API. */
export interface ProspectRow {
  id: string;
  jobId: string | null;
  podId: string | null;
  company: string | null;
  personName: string | null;
  role: string | null;
  email: string | null;
  emailStatus: string;
  door: string | null;
  sourceType: string;
  sourceUrl: string;
  sourceTitle: string | null;
  publisher: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  confidence: number;
  extraction: string;
  status: string;
  linkId: string | null;
  createdAt: string;
}
