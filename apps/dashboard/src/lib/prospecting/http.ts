import { SafeHttpClient } from "@saasfly/hermes-core";

/**
 * Transporte del recolector.
 *
 * Reutiliza `SafeHttpClient` de Hermes (anti-SSRF, límite de tamaño, timeouts,
 * revalidación de cada salto de redirect) en lugar de `fetch` directo.
 *
 * Política de robots: se respeta `robots.txt` para **páginas HTML**. Los
 * endpoints de sindicación (RSS) y las APIs públicas (EDGAR) se consumen como
 * se publican: no son crawling de contenido, y los feeds existen precisamente
 * para ser leídos por programas.
 */

const UA =
  process.env.PROSPECTING_USER_AGENT ??
  "PandorasProspectingBot/1.0 (+https://pandoras.finance; ops@pandoras.finance)";

const DEFAULT_TIMEOUT_MS = 8000;
const PER_HOST_INTERVAL_MS = 1000;

const lastHitByHost = new Map<string, number>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Rate limit cooperativo por host (1 req/s). */
async function waitForHost(host: string): Promise<void> {
  const last = lastHitByHost.get(host) ?? 0;
  const wait = PER_HOST_INTERVAL_MS - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  lastHitByHost.set(host, Date.now());
}

export interface PoliteFetchOptions {
  timeoutMs?: number;
  maxSizeBytes?: number;
  accept?: string;
  /** Omite el chequeo de robots (sólo para feeds/APIs de sindicación). */
  skipRobots?: boolean;
}

export class RobotsBlockedError extends Error {
  constructor(public readonly url: string) {
    super(`robots.txt prohíbe recolectar ${url}`);
    this.name = "RobotsBlockedError";
  }
}

/** `fetch` educado: robots + rate limit + límites. */
export async function politeFetch(
  url: string,
  options: PoliteFetchOptions = {},
): Promise<Response> {
  const parsed = new URL(url);
  if (!options.skipRobots) {
    const allowed = await isAllowedByRobots(url);
    if (!allowed) throw new RobotsBlockedError(url);
  }
  await waitForHost(parsed.host);
  return SafeHttpClient.fetch(url, {
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxSizeBytes: options.maxSizeBytes ?? 5 * 1024 * 1024,
    headers: {
      "User-Agent": UA,
      Accept:
        options.accept ??
        "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,text/plain;q=0.7,*/*;q=0.5",
    },
  });
}

// ─── robots.txt ────────────────────────────────────────────────────────────────

interface RobotsRules {
  allow: string[];
  disallow: string[];
  fetchedAt: number;
  /** 5xx: no se puede saber → se asume prohibido (fail-closed). */
  blockedAll?: boolean;
}

const robotsCache = new Map<string, RobotsRules>();
const ROBOTS_TTL_MS = 60 * 60 * 1000;

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\*/g, ".*")
    .replace(/\\\$$/, "$");
  return new RegExp(`^${escaped}`);
}

export function parseRobotsTxt(
  content: string,
  userAgentToken = "pandorasprospectingbot",
): { allow: string[]; disallow: string[] } {
  const allow: string[] = [];
  const disallow: string[] = [];
  let applies = false;
  let inAgentBlock = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.split("#")[0]?.trim() ?? "";
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (key === "user-agent") {
      const agent = value.toLowerCase();
      // Un bloque aplica si menciona nuestro token o el comodín.
      applies = agent === "*" || agent.includes(userAgentToken);
      inAgentBlock = applies;
      continue;
    }
    if (!inAgentBlock) continue;
    if (key === "allow" && value) allow.push(value);
    if (key === "disallow") disallow.push(value);
  }
  return { allow, disallow };
}

function isPathAllowed(path: string, rules: { allow: string[]; disallow: string[] }): boolean {
  const matchLength = (pattern: string): number => {
    if (!pattern) return -1;
    return patternToRegex(pattern).test(path) ? pattern.length : -1;
  };

  let bestAllow = -1;
  let bestDisallow = -1;
  for (const pattern of rules.allow) bestAllow = Math.max(bestAllow, matchLength(pattern));
  for (const pattern of rules.disallow) bestDisallow = Math.max(bestDisallow, matchLength(pattern));

  if (bestDisallow === -1) return true;
  // La regla más específica gana (semántica de Google).
  return bestAllow >= bestDisallow;
}

export async function isAllowedByRobots(url: string): Promise<boolean> {
  const parsed = new URL(url);
  const origin = parsed.origin;
  const cached = robotsCache.get(origin);
  let rules = cached;

  if (!rules || Date.now() - rules.fetchedAt > ROBOTS_TTL_MS) {
    try {
      await waitForHost(parsed.host);
      const response = await SafeHttpClient.fetch(`${origin}/robots.txt`, {
        timeoutMs: 5000,
        maxSizeBytes: 512 * 1024,
        headers: { "User-Agent": UA, Accept: "text/plain" },
      });
      if (response.status === 404) {
        rules = { allow: ["/"], disallow: [], fetchedAt: Date.now() };
      } else if (response.ok) {
        const body = await response.text();
        rules = { ...parseRobotsTxt(body), fetchedAt: Date.now() };
      } else {
        // 401/403 y 5xx: no se puede verificar → fail-closed, con TTL corto.
        rules = { allow: [], disallow: ["/"], fetchedAt: Date.now(), blockedAll: true };
      }
    } catch {
      rules = { allow: [], disallow: ["/"], fetchedAt: Date.now(), blockedAll: true };
    }
    robotsCache.set(origin, rules);
  }

  if (rules.blockedAll) return false;
  return isPathAllowed(parsed.pathname + parsed.search, rules);
}

// ─── RSS ──────────────────────────────────────────────────────────────────────

export interface RssItem {
  title: string;
  link: string;
  pubDate: string | null;
  source: string | null;
  description: string | null;
}

export function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagContent(xml: string, tag: string): string | null {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(xml);
  return match?.[1] ? decodeEntities(match[1]) : null;
}

/** Parser mínimo y tolerante de RSS 2.0 / Atom (sin dependencias). */
export function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  for (const block of blocks) {
    const title = tagContent(block, "title") ?? "";
    let link = tagContent(block, "link") ?? "";
    if (!link) {
      const href = /<link[^>]*href=["']([^"']+)["']/i.exec(block);
      if (href?.[1]) link = href[1];
    }
    if (!title || !link) continue;
    const sourceTag = /<source[^>]*>([\s\S]*?)<\/source>/i.exec(block);
    items.push({
      title,
      link,
      pubDate: tagContent(block, "pubDate") ?? tagContent(block, "updated") ?? null,
      source: sourceTag?.[1] ? decodeEntities(sourceTag[1]) : null,
      description: tagContent(block, "description") ?? tagContent(block, "summary"),
    });
  }
  return items;
}
