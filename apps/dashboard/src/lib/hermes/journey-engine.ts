/**
 * 🏛️ HERMES OS V7 — JOURNEY & PLAYBOOK ENGINE DOMAIN TYPES & EXECUTOR
 */

export interface PlaybookStage {
  id: string;
  name: string;
  objective: string;
  triggerKeywords?: string[];
  requiredData?: string[];
  nextStageId?: string;
  suggestedAction?: string;
}

export interface PlaybookDefinition {
  id: string;
  name: string;
  version: string;
  stages: PlaybookStage[];
}

export interface JourneyDefinition {
  id: string;
  name: string;
  persona: string;
  goal: string;
  playbookId: string;
  allowedSkills: string[];
  allowedTools: string[];
  successCriteria: {
    targetEvent: string;
    requiredFields?: string[];
  };
  timeoutMinutes: number;
  fallbackJourneyId?: string;
}

export interface ObjectiveState {
  journeyId: string;
  currentStageId: string;
  goal: string;
  completedObjectives: string[];
  missingObjectives: string[];
  recommendedAction: string;
}

export const BUILTIN_PLAYBOOKS: Record<string, PlaybookDefinition> = {
  // S'Narai Stage Zero & Family Referral Playbook
  'snarai_investor_playbook': {
    id: 'snarai_investor_playbook',
    name: 'S\'Narai Stage Zero Investor Playbook',
    version: '1.0',
    stages: [
      {
        id: 'stage_welcome_thesis',
        name: 'Bienvenida & Tesis de Proyecto',
        objective: 'Presentar el origen patrimonial de S\'Narai sin lenguaje de presión ni FOMO.',
        nextStageId: 'stage_qualification_objections',
        suggestedAction: 'Explicar por qué nació S\'Narai y la visión a largo plazo.'
      },
      {
        id: 'stage_qualification_objections',
        name: 'Resolución de Preguntas & Documentación',
        objective: 'Responder dudas legales, de tokenización y certificar seguridad patrimonial.',
        requiredData: ['email', 'phone'],
        nextStageId: 'stage_founder_meeting',
        suggestedAction: 'Compartir dossier informativo y validar interés.'
      },
      {
        id: 'stage_founder_meeting',
        name: 'Agendamiento con Fundadores',
        objective: 'Coordinar reunión ejecutiva privada o emisión de referencia SPEI.',
        suggestedAction: 'Ejecutar calendar.schedule o payments.create_spei_link.'
      }
    ]
  },

  // Oscar Web3 Sovereign Education Playbook
  'oscar_web3_sovereignty_playbook': {
    id: 'oscar_web3_sovereignty_playbook',
    name: 'Oscar Web3 & Sovereign Knowledge Playbook',
    version: '1.0',
    stages: [
      {
        id: 'stage_sovereignty_discovery',
        name: 'Descubrimiento de Nivel & Necesidad Soberana',
        objective: 'Identificar si el usuario busca auto-custodia, identidad descentralizada o privacidad Web3.',
        requiredData: ['email', 'telegram_user'],
        nextStageId: 'stage_workshop_booking',
        suggestedAction: 'Evaluar nivel de conocimiento Web3 y compartir guía de auto-custodia.'
      },
      {
        id: 'stage_workshop_booking',
        name: 'Agendamiento de Workshop & Masterclass',
        objective: 'Confirmar registro al workshop de soberanía digital o sesión 1-a-1.',
        suggestedAction: 'Ejecutar calendar.schedule para agendar workshop.'
      }
    ]
  },

  // Sofía Media & Journal Editorial Authority Playbook
  'sofia_editorial_playbook': {
    id: 'sofia_editorial_playbook',
    name: 'Sofía Editorial Authority & Community Playbook',
    version: '1.0',
    stages: [
      {
        id: 'stage_editorial_welcome',
        name: 'Bienvenida & Contenido Destacado',
        objective: 'Presentar la línea editorial de Pandora\'s Media Co sin lenguaje publicitario agresivo.',
        nextStageId: 'stage_newsletter_subscription',
        suggestedAction: 'Compartir artículo editorial recomendado y validar interés del lector.'
      },
      {
        id: 'stage_newsletter_subscription',
        name: 'Suscripción & Onboarding a la Comunidad',
        objective: 'Registrar al lector en el Journal semanal de Pandora\'s.',
        requiredData: ['email'],
        suggestedAction: 'Registrar correo para el boletín editorial.'
      }
    ]
  }
};

export const BUILTIN_JOURNEYS: Record<string, JourneyDefinition> = {
  'family_referral_journey': {
    id: 'family_referral_journey',
    name: 'Referral Trust Journey (Familia & VIP)',
    persona: 'S\'Narai Concierge',
    goal: 'Agendar Sesión Privada de Patrimonio con Fundadores',
    playbookId: 'snarai_investor_playbook',
    allowedSkills: ['patrimonial_advisory', 'spei_checkout'],
    allowedTools: ['calendar.schedule', 'payments.create_spei_link'],
    successCriteria: {
      targetEvent: 'FOUNDER_MEETING_SCHEDULED',
      requiredFields: ['email', 'phone']
    },
    timeoutMinutes: 1440
  },

  'web3_sovereign_education': {
    id: 'web3_sovereign_education',
    name: 'Web3 & Sovereign Knowledge Journey',
    persona: 'OscarBot (Educador Web3 & Soberanía)',
    goal: 'Agendar Workshop de Soberanía Digital y Auto-custodia',
    playbookId: 'oscar_web3_sovereignty_playbook',
    allowedSkills: ['sovereign_triage', 'workshop_booking'],
    allowedTools: ['calendar.schedule'],
    successCriteria: {
      targetEvent: 'WORKSHOP_REGISTERED',
      requiredFields: ['email', 'telegram_user']
    },
    timeoutMinutes: 720
  },

  'editorial_authority_journey': {
    id: 'editorial_authority_journey',
    name: 'Editorial Authority & Community Journey',
    persona: 'Sofía Media Journal',
    goal: 'Suscripción al Journal Editorial & Onboarding de Comunidad',
    playbookId: 'sofia_editorial_playbook',
    allowedSkills: ['editorial_curation', 'newsletter_onboarding'],
    allowedTools: ['marketing.newsletter_subscribe'],
    successCriteria: {
      targetEvent: 'NEWSLETTER_SUBSCRIBED',
      requiredFields: ['email']
    },
    timeoutMinutes: 1440
  }
};

export class HermesJourneyEngine {
  /**
   * Resolves active Journey, Playbook, and missing Objective data for a conversation
   */
  static evaluateJourney(
    journeyId: string = 'family_referral_journey',
    currentStageId?: string,
    customerData: Record<string, any> = {}
  ): { journey: JourneyDefinition; playbook: PlaybookDefinition; objectiveState: ObjectiveState } {
    const journey = BUILTIN_JOURNEYS[journeyId] || BUILTIN_JOURNEYS['family_referral_journey']!;
    const playbook = BUILTIN_PLAYBOOKS[journey.playbookId] || BUILTIN_PLAYBOOKS['snarai_investor_playbook']!;

    const activeStageId = currentStageId || playbook.stages[0]?.id || 'stage_welcome_thesis';
    const activeStage = playbook.stages.find(s => s.id === activeStageId) || playbook.stages[0]!;

    const missingObjectives: string[] = [];
    const completedObjectives: string[] = [];

    if (activeStage.requiredData) {
      for (const field of activeStage.requiredData) {
        if (customerData[field]) completedObjectives.push(field);
        else missingObjectives.push(field);
      }
    }

    const objectiveState: ObjectiveState = {
      journeyId: journey.id,
      currentStageId: activeStage.id,
      goal: journey.goal,
      completedObjectives,
      missingObjectives,
      recommendedAction: activeStage.suggestedAction || 'Avanzar conversación'
    };

    return { journey, playbook, objectiveState };
  }
}
