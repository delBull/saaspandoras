/**
 * 🗓️ Planificador semanal de comunidad (ADR-020 §2.7)
 *
 * Convierte señales reales (preguntas sin responder, última publicación por
 * canal, pendientes y motivos de rechazo) en un plan concreto de la semana.
 *
 * Reglas:
 *  - Máximo 3 piezas: se aprueba rápido y no se quema el canal.
 *  - Una pieza por canal como máximo (Discord/IG/FB).
 *  - Si hay preguntas sin responder, **la primera pieza las responde**: es el
 *    contenido de mayor valor y el que sostiene la confianza.
 *  - Si un motivo de rechazo se repite, el plan evita ese ángulo.
 *  - Instagram sólo aparece si hay material (`hasAssets`): sin asset no hay post.
 *
 * Es puro: no toca DB ni red. El agente lo usa como propuesta, no como permiso.
 */

export type PlannerPlatform = 'discord' | 'instagram' | 'facebook';

export interface PlannerSignals {
  tenantId: string;
  now?: Date;
  /** Preguntas abiertas detectadas por el lector. */
  openQuestions?: number;
  /** Última publicación por canal (ISO) para no repetir el mismo día. */
  lastPublishedByChannel?: Partial<Record<PlannerPlatform, string | null>>;
  /** Canales con una propuesta ya pendiente: no se duplica. */
  pendingChannels?: string[];
  /** Motivos de rechazo frecuentes (para evitar el mismo ángulo). */
  repeatedRejectionReasons?: string[];
  /** ¿Hay assets reales cargados? Sin ellos no se propone Instagram. */
  hasAssets?: boolean;
  /**
   * Redes habilitadas para el tenant. Por defecto Discord + Instagram:
   * Facebook está implementado pero apagado (ADR-020 §2.6).
   */
  platforms?: PlannerPlatform[];
}

export interface PlanItem {
  day: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes';
  platform: PlannerPlatform;
  channel: string;
  angle: 'respuesta' | 'obra' | 'modelo' | 'objecion' | 'equipo';
  title: string;
  /** `true` cuando la pieza necesita una imagen real antes de publicarse. */
  needsAsset: boolean;
}

export interface WeeklyPlan {
  tenantId: string;
  weekStart: string;
  items: PlanItem[];
  notes: string[];
}

const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'] as const;

function channelFor(platform: PlannerPlatform, tenantId: string): string {
  // S'Narai conserva su prefijo histórico; el resto usa el slug (ADR-020 §2.5).
  const prefix = tenantId === 'snarai' ? 's-narai' : tenantId.replace(/[^a-z0-9-]/g, '');
  if (platform === 'instagram') return tenantId;
  if (platform === 'facebook') return tenantId;
  return `${prefix}-anuncios`;
}

export function buildWeeklyPlan(signals: PlannerSignals): WeeklyPlan {
  const now = signals.now ?? new Date();
  const weekStart = new Date(now);
  const dayOfWeek = (weekStart.getUTCDay() + 6) % 7; // lunes = 0
  weekStart.setUTCDate(weekStart.getUTCDate() - dayOfWeek);

  const items: PlanItem[] = [];
  const notes: string[] = [];
  const pending = new Set((signals.pendingChannels ?? []).map((c) => c.toLowerCase()));
  const enabled = new Set<PlannerPlatform>(
    signals.platforms && signals.platforms.length > 0 ? signals.platforms : ['discord', 'instagram'],
  );
  const reasons = (signals.repeatedRejectionReasons ?? []).join(' ').toLowerCase();

  const push = (item: PlanItem) => {
    if (items.length >= 3) return;
    if (!enabled.has(item.platform)) return;
    if (pending.has(item.channel.toLowerCase())) return;
    if (items.some((existing) => existing.platform === item.platform)) return;
    items.push(item);
  };

  // 1. Responder es lo primero.
  if ((signals.openQuestions ?? 0) > 0) {
    push({
      day: DAYS[0],
      platform: 'discord',
      channel: channelFor('discord', signals.tenantId).replace(/-anuncios$/, '-preguntas'),
      angle: 'respuesta',
      title: `Responder ${signals.openQuestions} pregunta(s) abierta(s)`,
      needsAsset: false,
    });
  }

  // 2. Obra real (no se inventa nada: se pide material).
  if (!reasons.includes('obra')) {
    push({
      day: DAYS[1],
      platform: 'instagram',
      channel: channelFor('instagram', signals.tenantId),
      angle: 'obra',
      title: 'Avance de obra con material real',
      needsAsset: true,
    });
  }

  // 3. El modelo, sin precios ni rendimientos.
  push({
    day: DAYS[2],
    platform: 'discord',
    channel: channelFor('discord', signals.tenantId),
    angle: 'modelo',
    title: 'Cómo funciona el Título de Propiedad y las estancias anuales',
    needsAsset: false,
  });

  // 4. Facebook: texto, sin depender de imagen.
  if (!reasons.includes('precio') && !reasons.includes('rendimiento')) {
    push({
      day: DAYS[3],
      platform: 'facebook',
      channel: channelFor('facebook', signals.tenantId),
      angle: 'objecion',
      title: 'Responder la objeción más repetida de la semana',
      needsAsset: false,
    });
  }

  if (!signals.hasAssets) {
    notes.push('Sin assets reales: Instagram se propone pero no se publica hasta cargar material.');
  }
  if (reasons.length > 0) {
    notes.push(`Se evitan ángulos ya rechazados: ${signals.repeatedRejectionReasons!.slice(0, 3).join(' · ')}`);
  }
  if (pending.size > 0) {
    notes.push(`Canales con propuesta pendiente (no se duplican): ${[...pending].join(', ')}`);
  }

  return {
    tenantId: signals.tenantId,
    weekStart: weekStart.toISOString().slice(0, 10),
    items,
    notes,
  };
}
