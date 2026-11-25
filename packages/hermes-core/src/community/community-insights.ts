/**
 * 🗣️ Community insights · análisis de mensajes (solo lectura)
 *
 * Estas funciones NO publican nada ni tocan Discord: reciben mensajes ya leídos y
 * devuelven hallazgos. Se separan del transporte para poder probarlas y para que
 * el agente las use con el bot lector cuando exista.
 *
 * Reglas: los hallazgos son recomendaciones para un humano. Nunca borran, silencian
 * ni responden por su cuenta.
 */

export interface CommunityMessage {
  id: string;
  channel: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  isBot?: boolean;
}

export interface ModerationFinding {
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  channel: string;
  messageId: string;
  authorName: string;
  reason: string;
  excerpt: string;
}

export interface CommunityHealth {
  messages: number;
  authors: number;
  questions: number;
  unansweredQuestions: number;
  oldestUnansweredHours: number | null;
  topQuestions: Array<{ channel: string; excerpt: string; hoursOpen: number; authorName: string }>;
}

const INVITE_PATTERN = /\b(discord\.gg|discord\.com\/invite)\//i;
const SCAM_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /duplica\s+tu\s+(dinero|capital)/i, reason: 'Promesa de duplicar capital' },
  { pattern: /rendimiento\s+garantiz|retorno\s+garantiz/i, reason: 'Garantía de rendimiento (prohibida)' },
  { pattern: /\b(airdrop|free\s+nft|regalo\s+de\s+cripto)\b/i, reason: 'Señuelo típico de estafa' },
  { pattern: /invierte\s+en\s+\d+\s*(d[ií]as|horas)/i, reason: 'Urgencia artificial de inversión' },
  { pattern: /(whatsapp|telegram)\s*[:+]?\s*\+?\d{7,}/i, reason: 'Intento de sacar la conversación a privado' },
];
const URL_PATTERN = /https?:\/\/([^\s/]+)/gi;

/** Dominios que sí son nuestros (o del proyecto) y no deben marcarse. */
const TRUSTED_HOSTS = [
  'pandoras.finance',
  'dash.pandoras.finance',
  'snarai.aztecaz.xyz',
  'aztecaz.xyz',
  'discord.com',
];

function isTrustedHost(host: string): boolean {
  const clean = host.toLowerCase().replace(/^www\./, '');
  return TRUSTED_HOSTS.some((trusted) => clean === trusted || clean.endsWith(`.${trusted}`));
}

/** Detecta spam, invitaciones ajenas, enlaces sospechosos y promesas prohibidas. */
export function analyzeModeration(messages: CommunityMessage[]): ModerationFinding[] {
  const findings: ModerationFinding[] = [];
  const seen = new Map<string, number>();

  for (const message of messages) {
    if (message.isBot) continue;
    const text = message.content || '';
    const excerpt = text.slice(0, 120);

    // Repetición: mismo texto 3+ veces en la ventana.
    const key = text.trim().toLowerCase();
    if (key.length > 20) {
      const count = (seen.get(key) ?? 0) + 1;
      seen.set(key, count);
      if (count === 3) {
        findings.push({
          severity: 'MEDIUM',
          channel: message.channel,
          messageId: message.id,
          authorName: message.authorName,
          reason: 'Mensaje repetido 3 veces en la ventana',
          excerpt,
        });
      }
    }

    if (INVITE_PATTERN.test(text)) {
      findings.push({
        severity: 'HIGH',
        channel: message.channel,
        messageId: message.id,
        authorName: message.authorName,
        reason: 'Invita a otro servidor de Discord',
        excerpt,
      });
    }

    for (const scam of SCAM_PATTERNS) {
      if (scam.pattern.test(text)) {
        findings.push({
          severity: 'HIGH',
          channel: message.channel,
          messageId: message.id,
          authorName: message.authorName,
          reason: scam.reason,
          excerpt,
        });
      }
    }

    for (const match of text.matchAll(URL_PATTERN)) {
      const host = match[1] ?? '';
      if (host && !isTrustedHost(host)) {
        findings.push({
          severity: 'LOW',
          channel: message.channel,
          messageId: message.id,
          authorName: message.authorName,
          reason: `Enlace externo: ${host}`,
          excerpt,
        });
      }
    }
  }

  return findings;
}

/**
 * Salud de la comunidad.
 *
 * "Sin responder" se aproxima de forma conservadora: una pregunta del último
 * mensaje del canal no tiene respuesta posterior en la ventana leída. No pretendemos
 * leer hilos completos todavía.
 */
export function buildCommunityHealth(messages: CommunityMessage[], now = Date.now()): CommunityHealth {
  const byChannel = new Map<string, CommunityMessage[]>();
  for (const message of messages) {
    if (message.isBot) continue;
    const list = byChannel.get(message.channel) ?? [];
    list.push(message);
    byChannel.set(message.channel, list);
  }

  const authors = new Set(messages.filter((m) => !m.isBot).map((m) => m.authorId));
  let questions = 0;
  let unanswered = 0;
  let oldestHours = 0;
  const top: CommunityHealth['topQuestions'] = [];

  for (const [channel, list] of byChannel) {
    const ordered = [...list].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    const last = ordered[ordered.length - 1];
    for (const message of ordered) {
      if (!message.content.trim().endsWith('?')) continue;
      questions++;
      const answered = ordered.some(
        (other) =>
          other !== message &&
          Date.parse(other.createdAt) > Date.parse(message.createdAt) &&
          other.authorId !== message.authorId,
      );
      if (!answered) {
        unanswered++;
        const hours = Math.max(0, Math.round((now - Date.parse(message.createdAt)) / 3_600_000));
        oldestHours = Math.max(oldestHours, hours);
        top.push({ channel, excerpt: message.content.slice(0, 140), hoursOpen: hours, authorName: message.authorName });
      }
    }
    // Pregunta abierta al final del canal aunque no termine en '?'.
    if (last && !last.content.trim().endsWith('?') && last.content.includes('¿')) {
      questions++;
      unanswered++;
      const hours = Math.max(0, Math.round((now - Date.parse(last.createdAt)) / 3_600_000));
      oldestHours = Math.max(oldestHours, hours);
      top.push({ channel, excerpt: last.content.slice(0, 140), hoursOpen: hours, authorName: last.authorName });
    }
  }

  return {
    messages: messages.filter((m) => !m.isBot).length,
    authors: authors.size,
    questions,
    unansweredQuestions: unanswered,
    oldestUnansweredHours: unanswered > 0 ? oldestHours : null,
    topQuestions: top.sort((a, b) => b.hoursOpen - a.hoursOpen).slice(0, 10),
  };
}
