import { createHash } from "node:crypto";
import OpenAI from "openai";
import type { Door, ExtractedCandidate, JobSpec, RawCandidate, SourceType } from "./types";
import { DOORS } from "./types";

/**
 * Extractor.
 *
 * Dos caminos, explícitos y auditables:
 *  1. **regex**: lo que se puede probar sin inferencia (correo literal, cargo y
 *     nombre adyacentes en el texto).
 *  2. **llm**: refinamiento con salida estructurada, sólo si `OPENAI_API_KEY`
 *     existe. Toda salida del modelo se valida contra el texto: si el nombre o
 *     el correo no aparecen literalmente en la fuente, se descartan.
 *
 * La confianza se calcula aquí, de forma determinista. Nunca la autoevalúa el
 * modelo y nunca llega a 100: un prospecto no verificado no es un hecho.
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const GENERIC_EMAIL_TOKENS = [
  "noreply",
  "no-reply",
  "donotreply",
  "example.",
  "sentry",
  "wixpress",
  "domain.com",
  "email.com",
  "@2x",
  "sentry.io",
  "schema.org",
];
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif|ico)$/i;

const ROLE_PATTERN =
  "(?:Chief [A-Z][a-z]+ Officer|CEO|CFO|COO|CTO|Managing Director|Managing Partner|General Partner|" +
  "Director General|Director de Inversiones|Director of Acquisitions|Head of Acquisitions|" +
  "Head of Investments|Vice President|VP of Acquisitions|President|Founder|Co-Founder|Chairman)";

const PERSON_ROLE_RE = new RegExp(
  `([A-ZÁÉÍÓÚÑ][a-zà-ÿ]+(?:\\s+[A-ZÁÉÍÓÚÑ][a-zà-ÿ]+){1,3})\\s*[,–—-]\\s*(${ROLE_PATTERN})`,
  "g",
);

const DOOR_HINTS: Array<{ door: Door; re: RegExp }> = [
  { door: "MX_FAMILY", re: /family office|oficina de familia|patrimonio familiar/i },
  { door: "PATIENT_CAPITAL", re: /patient capital|capital paciente|fondo cerrado|endowment|pension/i },
  { door: "CONSOLIDATOR", re: /consolidat|roll-?up|holding hotelero|grupo hotelero/i },
  { door: "BROKER", re: /broker|corredur|intermediari|advisor|asesor de inversi/i },
  { door: "SOVEREIGN", re: /sovereign|fondo soberano|wealth fund|multilateral/i },
];

export function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@._\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findEmails(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(EMAIL_RE)) {
    const email = match[0].toLowerCase();
    if (IMAGE_EXT.test(email)) continue;
    if (GENERIC_EMAIL_TOKENS.some((token) => email.includes(token))) continue;
    if (email.length > 320) continue;
    found.add(email);
  }
  return [...found];
}

function registrableDomain(host: string): string {
  const parts = host.toLowerCase().replace(/^www\./, "").split(".");
  return parts.length >= 2 ? parts.slice(-2).join(".") : host.toLowerCase();
}

function pickEmail(emails: string[], candidate: RawCandidate): string | null {
  if (emails.length === 0) return null;
  let host = "";
  try {
    host = registrableDomain(new URL(candidate.sourceUrl).hostname);
  } catch {
    host = "";
  }
  const sameDomain = emails.find((email) => host && email.endsWith(`@${host}`));
  return sameDomain ?? emails[0] ?? null;
}

function inferDoor(text: string, allowed: Door[]): Door | null {
  for (const hint of DOOR_HINTS) {
    if (!hint.re.test(text)) continue;
    if (allowed.length === 0 || allowed.includes(hint.door)) return hint.door;
  }
  return null;
}

function regexPerson(text: string): { personName: string | null; role: string | null } {
  PERSON_ROLE_RE.lastIndex = 0;
  const match = PERSON_ROLE_RE.exec(text);
  if (!match) return { personName: null, role: null };
  return { personName: match[1]?.trim() ?? null, role: match[2]?.trim() ?? null };
}

interface LlmExtract {
  company: string | null;
  personName: string | null;
  role: string | null;
  email: string | null;
  door: Door | null;
  discarded: string[];
}

let cachedClient: OpenAI | null = null;
function llmClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!cachedClient) {
    cachedClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 20000,
      maxRetries: 1,
    });
  }
  return cachedClient;
}

export function llmAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function llmExtract(input: {
  text: string;
  title: string | null;
  url: string;
  query: string;
  doors: Door[];
}): Promise<LlmExtract | null> {
  const client = llmClient();
  if (!client) return null;

  const model = process.env.PROSPECTING_MODEL ?? process.env.HERMES_COGNITIVE_MODEL ?? "gpt-4o-mini";
  const system = [
    "Eres un extractor de datos de prospección B2B. Devuelves sólo JSON válido.",
    "Reglas absolutas:",
    "- No inventes nada. Si un dato no aparece literalmente en el texto, devuelve cadena vacía.",
    "- No infieras correos por patrón (nombre@dominio). Sólo copia correos que aparezcan escritos.",
    "- El nombre de la persona debe aparecer escrito; el cargo debe estar asociado a esa persona.",
    "- door debe ser uno de: " + DOORS.join(", ") + ". Si no hay evidencia, cadena vacía.",
    'Formato: {"company":"","personName":"","role":"","email":"","door":""}',
  ].join("\n");

  const user = [
    `URL: ${input.url}`,
    `Titular: ${input.title ?? "(sin titular)"}`,
    `Consulta del operador: ${input.query || "(sin consulta)"}`,
    `Puertas objetivo: ${input.doors.join(", ") || "(cualquiera)"}`,
    "Texto:",
    input.text.slice(0, 12000),
  ].join("\n");

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const text = normalizeForMatch(input.text);
    const discarded: string[] = [];

    const pick = (key: string, max: number): string | null => {
      const value = parsed[key];
      if (typeof value !== "string") return null;
      const trimmed = value.trim().slice(0, max);
      return trimmed || null;
    };

    let personName = pick("personName", 255);
    if (personName) {
      const tokens = normalizeForMatch(personName).split(" ").filter((t) => t.length > 1);
      const present = tokens.length > 0 && tokens.every((token) => text.includes(token));
      if (!present) {
        discarded.push(`nombre descartado (no aparece en la fuente): ${personName}`);
        personName = null;
      }
    }

    let role = pick("role", 255);
    if (role) {
      const roleNorm = normalizeForMatch(role);
      const tokens = roleNorm.split(" ").filter((t) => t.length > 2);
      const present = text.includes(roleNorm) || (tokens[0] ? text.includes(tokens[0]) : false);
      if (!present) {
        discarded.push(`cargo descartado (no aparece en la fuente): ${role}`);
        role = null;
      }
    }

    let company = pick("company", 255);
    if (company) {
      const tokens = normalizeForMatch(company).split(" ").filter((t) => t.length > 2);
      const present = tokens.length > 0 && tokens.slice(0, 3).every((token) => text.includes(token));
      if (!present) {
        discarded.push(`empresa descartada (no aparece en la fuente): ${company}`);
        company = null;
      }
    }

    let email = pick("email", 320)?.toLowerCase() ?? null;
    if (email) {
      const inText = findEmails(input.text).includes(email);
      if (!inText || !email.includes("@")) {
        discarded.push(`correo descartado (no aparece literal en la fuente): ${email}`);
        email = null;
      }
    }

    const rawDoor = pick("door", 32)?.toUpperCase() ?? null;
    const door = rawDoor && (DOORS as readonly string[]).includes(rawDoor) ? (rawDoor as Door) : null;

    return { company, personName, role, email, door, discarded };
  } catch (error) {
    // Degradación explícita: el llamador sabrá que fue por regex.
    console.warn("[prospecting] LLM no disponible:", (error as Error).message);
    return null;
  }
}

const BASE_SCORE: Record<SourceType, number> = {
  corporate: 45,
  sec: 40,
  press: 28,
  search: 25,
};

function scoreCandidate(params: {
  sourceType: SourceType;
  hasEmail: boolean;
  hasPersonRole: boolean;
  hasCompany: boolean;
  hasDoor: boolean;
  fresh: boolean;
  fromFeedOnly: boolean;
}): number {
  let score = BASE_SCORE[params.sourceType];
  if (params.hasEmail) score += 25;
  if (params.hasPersonRole) score += 15;
  if (params.hasCompany) score += 8;
  if (params.hasDoor) score += 4;
  if (params.fresh) score += 3;
  if (params.fromFeedOnly) score = Math.min(score, 35);
  // Nunca 100: nada aquí está verificado.
  return Math.max(0, Math.min(92, score));
}

export interface ExtractArgs {
  candidate: RawCandidate;
  spec: JobSpec;
  /** Fecha de referencia para "frescura". */
  now?: Date;
}

/**
 * Extrae un candidato. Nunca lanza por datos: devuelve null sólo si el
 * candidato no tiene URL (violación del contrato) y registra evidencia.
 */
export async function extractCandidate(args: ExtractArgs): Promise<ExtractedCandidate> {
  const { candidate, spec } = args;
  const text = candidate.text ?? "";
  const evidence: string[] = [];
  const fromFeedOnly = text.trim().length < 200;

  const emails = findEmails(text);
  const regexEmail = pickEmail(emails, candidate);
  if (regexEmail) evidence.push(`correo literal en la fuente: ${regexEmail}`);

  const llm = text.trim().length >= 200 ? await llmExtract({
    text,
    title: candidate.sourceTitle,
    url: candidate.sourceUrl,
    query: spec.query,
    doors: spec.doors,
  }) : null;
  if (llm?.discarded.length) evidence.push(...llm.discarded);

  const regex = regexPerson(text);
  const personName = llm?.personName ?? regex.personName;
  const role = llm?.role ?? regex.role;
  const company =
    llm?.company ?? (candidate.sourceType === "sec" ? candidate.publisher ?? null : null);
  const email = llm?.email ?? regexEmail;
  const door = llm?.door ?? inferDoor(text, spec.doors);

  let fresh = true;
  if (candidate.publishedAt && spec.rules.maxAgeDays > 0) {
    const published = new Date(candidate.publishedAt).getTime();
    if (Number.isFinite(published)) {
      fresh = args.now
        ? args.now.getTime() - published <= spec.rules.maxAgeDays * 86_400_000
        : true;
    }
  }

  const confidence = scoreCandidate({
    sourceType: candidate.sourceType,
    hasEmail: Boolean(email),
    hasPersonRole: Boolean(personName && role),
    hasCompany: Boolean(company),
    hasDoor: Boolean(door),
    fresh,
    fromFeedOnly,
  });

  if (fromFeedOnly) evidence.push("fuente sin cuerpo recuperable: sólo titular/fecha");

  return {
    company,
    personName,
    role,
    email,
    door,
    confidence,
    extraction: llm ? "llm" : fromFeedOnly ? "feed" : "regex",
    evidence,
  };
}

/** Clave de deduplicación estable por organización. */
export function dedupeKey(params: {
  email: string | null;
  company: string | null;
  personName: string | null;
  role: string | null;
  sourceUrl: string;
}): string {
  const email = params.email?.toLowerCase().trim();
  if (email) return `e:${createHash("sha256").update(email).digest("hex").slice(0, 48)}`;
  const composite = [params.company, params.personName, params.role]
    .map((value) => (value ? normalizeForMatch(value) : ""))
    .join("|");
  if (composite.replace(/\|/g, "").length > 0) {
    return `c:${createHash("sha256").update(composite).digest("hex").slice(0, 48)}`;
  }
  return `u:${createHash("sha256").update(params.sourceUrl).digest("hex").slice(0, 48)}`;
}
