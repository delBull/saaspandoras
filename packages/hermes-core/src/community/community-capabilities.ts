/**
 * 🗣️ Community · catálogo de capacidades del agente de comunidad
 *
 * Una sola fuente para los ids: el registro de agentes, el handler A2A y la CLI
 * del bot leen de aquí. No se crea otro registro de capacidades (ya hay tres en
 * el repo; ver deuda en el ADR-019).
 */

export const COMMUNITY_CAPABILITIES = {
  /** Lee el embudo, fuentes, clics y aprobaciones pendientes. Solo lectura. */
  REPORT: 'community.report',
  /** Propone publicaciones; crea una aprobación, no publica. */
  PROPOSE_PUBLISH: 'community.publish_post',
  /** Plan semanal: señales reales → 2-3 piezas concretas. Sólo lectura. */
  PLAN_WEEK: 'community.plan_week',
} as const;

export type CommunityCapability = (typeof COMMUNITY_CAPABILITIES)[keyof typeof COMMUNITY_CAPABILITIES];

export const COMMUNITY_CAPABILITY_IDS: string[] = Object.values(COMMUNITY_CAPABILITIES);

export const COMMUNITY_CAPABILITY_DEFINITIONS = [
  {
    id: COMMUNITY_CAPABILITIES.REPORT,
    name: 'Community report',
    version: '1.0.0',
    inputType: 'CommunityReportRequest',
    outputType: 'CommunityDigest',
  },
  {
    id: COMMUNITY_CAPABILITIES.PLAN_WEEK,
    name: 'Community weekly plan',
    version: '1.0.0',
    inputType: 'CommunityPlanRequest',
    outputType: 'WeeklyPlan',
  },
  {
    id: COMMUNITY_CAPABILITIES.PROPOSE_PUBLISH,
    name: 'Propose community publication',
    version: '1.0.0',
    inputType: 'CommunityProposalRequest',
    outputType: 'CommunityProposalResult',
  },
] as const;
