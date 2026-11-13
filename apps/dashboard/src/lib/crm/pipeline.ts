/**
 * P0.2 — Pipeline por defecto (uno por organización, `is_default`).
 *
 * Etapas cerradas en la especificación v1.0:
 *   nuevo → contactado → calificado → discovery_solicitado → visita_realizada → propuesta → ganada | perdida
 *
 * `requiresNextAction` obliga a próxima acción + fecha en esa etapa.
 */

export type StageKind = 'open' | 'won' | 'lost';

export interface StageDefinition {
  key: string;
  name: string;
  position: number;
  kind: StageKind;
  requiresNextAction: boolean;
}

export const DEFAULT_PIPELINE_NAME = 'Pipeline principal';

export const DEFAULT_STAGES: readonly StageDefinition[] = Object.freeze([
  { key: 'nuevo', name: 'Nuevo', position: 1, kind: 'open', requiresNextAction: false },
  { key: 'contactado', name: 'Contactado', position: 2, kind: 'open', requiresNextAction: true },
  { key: 'calificado', name: 'Calificado', position: 3, kind: 'open', requiresNextAction: true },
  {
    key: 'discovery_solicitado',
    name: 'Discovery solicitado',
    position: 4,
    kind: 'open',
    requiresNextAction: true,
  },
  {
    key: 'visita_realizada',
    name: 'Visita realizada',
    position: 5,
    kind: 'open',
    requiresNextAction: true,
  },
  { key: 'propuesta', name: 'Propuesta', position: 6, kind: 'open', requiresNextAction: true },
  { key: 'ganada', name: 'Ganada', position: 7, kind: 'won', requiresNextAction: false },
  { key: 'perdida', name: 'Perdida', position: 8, kind: 'lost', requiresNextAction: false },
] as const satisfies readonly StageDefinition[]);

export const FIRST_STAGE_KEY = 'nuevo';

/** Actividades que cuentan como CONTACTO verificable (requisito para ganar). */
export const CONTACT_ACTIVITY_TYPES = ['call', 'message', 'email', 'visit'] as const;

export type ContactActivityType = (typeof CONTACT_ACTIVITY_TYPES)[number];

export function findStage(key: string): StageDefinition | null {
  return DEFAULT_STAGES.find((stage) => stage.key === key) ?? null;
}

export function isContactActivity(type: string): type is ContactActivityType {
  return (CONTACT_ACTIVITY_TYPES as readonly string[]).includes(type);
}
