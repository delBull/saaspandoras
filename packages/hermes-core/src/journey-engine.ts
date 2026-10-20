/**
 * 🏛️ HERMES OS V7 — JOURNEY & PLAYBOOK ENGINE DOMAIN TYPES & EXECUTOR
 */
import { ChannelContext, EventContext, ContactContext, MemoryContext } from './contracts/execution-contracts';

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
        objective: 'Responder dudas sobre la estructura de Certificados de Participación, el marco jurídico de Aztecas Hub S.A.P.I. de C.V. y certificar seguridad patrimonial.',
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
  },

  // 1. Agencia de Marketing (Consolidación de Operaciones, CRM & Hermes AI)
  'agency_operations_playbook': {
    id: 'agency_operations_playbook',
    name: 'Agencia de Marketing Operations & Growth Playbook',
    version: '1.0',
    stages: [
      {
        id: 'stage_agency_bottleneck_diagnosis',
        name: 'Diagnóstico de Dispersión Operativa',
        objective: 'Identificar los servicios regados que la agencia ofrece y la falta de un hub central de analítica y métricas.',
        nextStageId: 'stage_agency_solution_hub',
        suggestedAction: 'Preguntar qué herramientas usan actualmente y cómo entregan reportes de métricas a sus clientes.'
      },
      {
        id: 'stage_agency_solution_hub',
        name: 'Demostración de Growth OS & Multi-Tenant Whitelabel',
        objective: 'Presentar cómo centralizar telemetría, CRM de leads y agentes Hermes con dashboards unificados.',
        requiredData: ['email', 'phone'],
        nextStageId: 'stage_agency_demo_booking',
        suggestedAction: 'Mostrar demo interactiva de dash.pandoras.finance/onboarding o agendar videollamada.'
      },
      {
        id: 'stage_agency_demo_booking',
        name: 'Agendamiento de Sesión Estratégica',
        objective: 'Coordinar videollamada en /meet para estructurar su hub de agencia.',
        suggestedAction: 'Ejecutar calendar.schedule para agendar demo.'
      }
    ]
  },

  // 2. Café Local (Lanzamiento, Fidelización & Captación Local)
  'local_coffee_launch_playbook': {
    id: 'local_coffee_launch_playbook',
    name: 'Café Local Launch & Local Foot-Traffic Playbook',
    version: '1.0',
    stages: [
      {
        id: 'stage_coffee_welcome_ambiance',
        name: 'Bienvenida al Lanzamiento & Concepto',
        objective: 'Presentar el concepto del café de especialidad y la fecha/ubicación de apertura sin fricción.',
        nextStageId: 'stage_coffee_exclusive_invitation',
        suggestedAction: 'Compartir invitación de cata inaugural o promoción de apertura por WhatsApp.'
      },
      {
        id: 'stage_coffee_exclusive_invitation',
        name: 'Invitación a Apertura & Pase VIP',
        objective: 'Registrar al cliente local en la lista VIP de apertura a cambio de una cortesía o descuento.',
        requiredData: ['name', 'phone'],
        nextStageId: 'stage_coffee_vip_pass_confirmed',
        suggestedAction: 'Entregar pase digital para la inauguración o menú de bienvenida.'
      },
      {
        id: 'stage_coffee_vip_pass_confirmed',
        name: 'Confirmación & Recordatorio de Visita',
        objective: 'Enviar recordatorio por WhatsApp horas antes de la apertura.',
        suggestedAction: 'Activar recordatorio automático de WhatsApp.'
      }
    ]
  },

  // 3. App de Recompensas Globales (Puntos, Incentivos, POS & Tokenomics)
  'rewards_app_growth_playbook': {
    id: 'rewards_app_growth_playbook',
    name: 'Rewards & Incentive Protocol Playbook',
    version: '1.0',
    stages: [
      {
        id: 'stage_rewards_architecture_discovery',
        name: 'Descubrimiento de Mecánica de Incentivos',
        objective: 'Identificar si el proyecto requiere puntos off-chain, liquidación en POS, cupones o tokenización on-chain.',
        nextStageId: 'stage_rewards_engine_alignment',
        suggestedAction: 'Explicar cómo Pandora\'s conecta puntos de recompensa con fidelización y pagos.'
      },
      {
        id: 'stage_rewards_engine_alignment',
        name: 'Alineación de Infraestructura & APIs',
        objective: 'Validar volumen transaccional y requerimientos de integración de API / POS.',
        requiredData: ['email', 'company'],
        nextStageId: 'stage_rewards_partner_meeting',
        suggestedAction: 'Entregar documentación de integración y agendar sesión con arquitectura.'
      },
      {
        id: 'stage_rewards_partner_meeting',
        name: 'Agendamiento de Integración & Tokenomics',
        objective: 'Coordinar sesión técnica para desplegar bóvedas de recompensas y contratos.',
        suggestedAction: 'Ejecutar calendar.schedule con equipo de ingeniería de producto.'
      }
    ]
  },

  // 4. Real Estate & RWA Syndication (Activos Reales, Preventa & SPV)
  'rwa_syndicate_playbook': {
    id: 'rwa_syndicate_playbook',
    name: 'Real Estate & RWA Syndication Playbook',
    version: '1.0',
    stages: [
      {
        id: 'stage_rwa_asset_qualification',
        name: 'Diagnóstico de Activo & Estructura Legal',
        objective: 'Calificar el tipo de activo (inmueble, desarrollo hotelero, portafolio) y estructura societaria/fideicomiso.',
        nextStageId: 'stage_rwa_teaser_absorption',
        suggestedAction: 'Explicar cómo opera la tokenización vía SPV/Certificados de Participación y solicitar dossier del activo.'
      },
      {
        id: 'stage_rwa_teaser_absorption',
        name: 'Simulación Financiera & Absorción de Capital',
        objective: 'Calcular meta de fondeo, ticket promedio y esquema de retornos/dividendos.',
        requiredData: ['email', 'company'],
        nextStageId: 'stage_rwa_private_deal_room',
        suggestedAction: 'Entregar resumen ejecutivo y modelo de tokenización financiera.'
      },
      {
        id: 'stage_rwa_private_deal_room',
        name: 'Agendamiento Privado de Estructuración',
        objective: 'Coordinar sesión técnica-financiera con el equipo de capital de Pandora\'s.',
        suggestedAction: 'Ejecutar calendar.schedule con directores de estructuración RWA.'
      }
    ]
  },

  // 5. Retail Omnichannel & Fidelización E-Commerce (Recuperación y Carritos)
  'ecommerce_omnichannel_playbook': {
    id: 'ecommerce_omnichannel_playbook',
    name: 'Retail Omnichannel & Direct-to-Consumer Loyalty Playbook',
    version: '1.0',
    stages: [
      {
        id: 'stage_omnichannel_welcome_offer',
        name: 'Bienvenida & Recuperación de Intención',
        objective: 'Reconectar con el visitante o carrito abandonado sin fricción vía WhatsApp con incentivo inmediato.',
        nextStageId: 'stage_omnichannel_loyalty_activation',
        suggestedAction: 'Entregar código de beneficio o cortesía personalizada según su última visita.'
      },
      {
        id: 'stage_omnichannel_loyalty_activation',
        name: 'Activación de Monedero / Puntos Digitales',
        objective: 'Registrar la wallet o número móvil del comprador para acumular cashback en futuras compras.',
        requiredData: ['phone'],
        nextStageId: 'stage_omnichannel_checkout_assistance',
        suggestedAction: 'Confirmar el balance inicial de recompensas y sugerir productos de su interés.'
      },
      {
        id: 'stage_omnichannel_checkout_assistance',
        name: 'Asistencia de Cierre & Checkout Conversacional',
        objective: 'Resolver preguntas de envío, tallas o pago y guiar al pago con 1 clic.',
        suggestedAction: 'Generar enlace de pago directo o checkout express.'
      }
    ]
  },

  // 6. Embajadores, Brokers & Afiliados On-Chain (Revenue Share & Splits)
  'ambassador_network_playbook': {
    id: 'ambassador_network_playbook',
    name: 'Ambassador & Partner On-Chain Network Playbook',
    version: '1.0',
    stages: [
      {
        id: 'stage_ambassador_onboarding_evaluation',
        name: 'Evaluación de Perfil & Audiencia de Embajador',
        objective: 'Validar si el afiliado/broker cuenta con cartera de clientes, comunidad o presencia en sector meta.',
        nextStageId: 'stage_ambassador_deal_agreement',
        suggestedAction: 'Presentar el esquema de comisiones y splits automáticos en stablecoin/SPEI.'
      },
      {
        id: 'stage_ambassador_deal_agreement',
        name: 'Asignación de Golden Link & Contrato de Afiliación',
        objective: 'Generar el enlace único de referidos y registrar la wallet/cuenta receptora.',
        requiredData: ['email', 'phone'],
        nextStageId: 'stage_ambassador_active_enablement',
        suggestedAction: 'Entregar Golden Link rastreable y kit de prospección verificado.'
      },
      {
        id: 'stage_ambassador_active_enablement',
        name: 'Capacitación & Sesión de Estrategia de Prospección',
        objective: 'Agendar llamada de alineación para revisar material de ventas y primeros leads.',
        suggestedAction: 'Ejecutar calendar.schedule con el coordinador de la red de embajadores.'
      }
    ]
  }
};

export const BUILTIN_JOURNEYS: Record<string, JourneyDefinition> = {
  'family_referral_journey': {
    id: 'family_referral_journey',
    name: 'Referral Trust Journey (Familia & VIP)',
    persona: 'S\'Narai Concierge',
    goal: 'Agendar Sesión Privada de Patrimonio con Fundadores o completar adquisición vía SPEI Fast Lane',
    playbookId: 'snarai_investor_playbook',
    allowedSkills: ['patrimonial_advisory', 'spei_checkout'],
    allowedTools: ['calendar.schedule', 'payments.create_spei_link'],
    successCriteria: {
      targetEvent: 'FOUNDER_MEETING_SCHEDULED',
      requiredFields: ['email', 'phone']
    },
    timeoutMinutes: 1440
  },

  'agency_consolidation_journey': {
    id: 'agency_consolidation_journey',
    name: 'Agencia de Marketing Hub & Operations Journey',
    persona: 'Pandoras Growth Advisor',
    goal: 'Demostrar centralización operativa en Growth OS y agendar Demo en /meet',
    playbookId: 'agency_operations_playbook',
    allowedSkills: ['marketing_audit', 'whitelabel_advisory'],
    allowedTools: ['calendar.schedule'],
    successCriteria: {
      targetEvent: 'AGENCY_DEMO_SCHEDULED',
      requiredFields: ['email', 'phone']
    },
    timeoutMinutes: 1440
  },

  'local_coffee_launch_journey': {
    id: 'local_coffee_launch_journey',
    name: 'Café Local Launch & Foot-Traffic Journey',
    persona: 'Hermes Café Concierge',
    goal: 'Registrar cliente local en lista VIP de apertura y enviar pase por WhatsApp',
    playbookId: 'local_coffee_launch_playbook',
    allowedSkills: ['local_hospitality', 'vip_rsvp'],
    allowedTools: ['calendar.schedule', 'notifications.whatsapp_send'],
    successCriteria: {
      targetEvent: 'COFFEE_VIP_RSVP_COMPLETED',
      requiredFields: ['name', 'phone']
    },
    timeoutMinutes: 720
  },

  'global_rewards_app_journey': {
    id: 'global_rewards_app_journey',
    name: 'Global Rewards & POS Loyalty Journey',
    persona: 'Pandoras Protocol Architect',
    goal: 'Calificar volumen de transacciones y agendar sesión de arquitectura técnica',
    playbookId: 'rewards_app_growth_playbook',
    allowedSkills: ['tokenomics_consulting', 'pos_rewards_architecture'],
    allowedTools: ['calendar.schedule'],
    successCriteria: {
      targetEvent: 'REWARDS_ARCHITECTURE_SCHEDULED',
      requiredFields: ['email', 'company']
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
  },

  'rwa_real_estate_syndicate_journey': {
    id: 'rwa_real_estate_syndicate_journey',
    name: 'Real Estate & RWA Syndication Journey',
    persona: 'Pandoras Real Estate Capital Director',
    goal: 'Calificar activo inmobiliario y agendar sesión privada de estructuración SPV',
    playbookId: 'rwa_syndicate_playbook',
    allowedSkills: ['rwa_advisory', 'deal_room_access'],
    allowedTools: ['calendar.schedule'],
    successCriteria: {
      targetEvent: 'RWA_DEAL_ROOM_SCHEDULED',
      requiredFields: ['email', 'company']
    },
    timeoutMinutes: 1440
  },

  'ecommerce_omnichannel_loyalty_journey': {
    id: 'ecommerce_omnichannel_loyalty_journey',
    name: 'Retail Omnichannel & D2C Loyalty Journey',
    persona: 'Hermes Omnichannel Retailer',
    goal: 'Recuperar intención de compra, activar cashback digital y asistir checkout',
    playbookId: 'ecommerce_omnichannel_playbook',
    allowedSkills: ['cart_recovery', 'loyalty_balance'],
    allowedTools: ['notifications.whatsapp_send', 'payments.checkout'],
    successCriteria: {
      targetEvent: 'OMNICHANNEL_PURCHASE_COMPLETED',
      requiredFields: ['phone']
    },
    timeoutMinutes: 720
  },

  'ambassador_deal_closer_journey': {
    id: 'ambassador_deal_closer_journey',
    name: 'Ambassador & Partner On-Chain Network Journey',
    persona: 'Pandoras Partnership Lead',
    goal: 'Asignar Golden Link de afiliado con split automático y agendar sesión de ventas',
    playbookId: 'ambassador_network_playbook',
    allowedSkills: ['affiliate_onboarding', 'golden_link_dispatch'],
    allowedTools: ['calendar.schedule', 'notifications.whatsapp_send'],
    successCriteria: {
      targetEvent: 'AMBASSADOR_GOLDEN_LINK_ASSIGNED',
      requiredFields: ['email', 'phone']
    },
    timeoutMinutes: 1440
  }
};

export class HermesJourneyEngine {
  /**
   * Resolves active Journey, Playbook, and missing Objective data for a conversation
   * using the multidimensional execution context.
   */
  static evaluate(
    journeyDefinition: JourneyDefinition,
    contactContext: ContactContext,
    intent: string,
    memory: MemoryContext,
    channelContext: ChannelContext,
    eventContext?: EventContext
  ): { nextBestAction: string; objectiveState: ObjectiveState } {
    
    // 1. Resolve Playbook from Definition
    const playbook = BUILTIN_PLAYBOOKS[journeyDefinition.playbookId];
    if (!playbook) {
      throw new Error(`DomainPackNotFound: Playbook ${journeyDefinition.playbookId} no encontrado para el tenant actual.`);
    }

    // 2. Determine current stage based on memory/contact state or fallback to first
    // (A real implementation would map contactContext.status to stage, or use memory)
    const activeStageId = playbook.stages[0]?.id || 'stage_welcome_thesis';
    const activeStage = playbook.stages.find(s => s.id === activeStageId) || playbook.stages[0]!;

    const missingObjectives: string[] = [];
    const completedObjectives: string[] = [];

    // Mock customer data derived from contexts (in reality, read from DB/Memory)
    const customerData: Record<string, any> = {}; 

    if (activeStage.requiredData) {
      for (const field of activeStage.requiredData) {
        if (customerData[field]) completedObjectives.push(field);
        else missingObjectives.push(field);
      }
    }

    // 3. Compute NBA based on Event, Intent, and Channel Constraints
    let nextBestAction = activeStage.suggestedAction || 'Avanzar conversación';
    
    if (intent === 'OBJECTION' && contactContext.status !== 'NEW') {
      nextBestAction = 'Abordar objeción y registrar follow-up';
    } else if (eventContext && eventContext.eventType === 'MEETING_BOOKED') {
      nextBestAction = 'Agradecer y avanzar a QUALIFIED';
    }

    if (!channelContext.capabilities.supportsButtons && nextBestAction.includes('calendar')) {
      nextBestAction += ' (Proveer URL plana, sin botones)';
    }

    const objectiveState: ObjectiveState = {
      journeyId: journeyDefinition.id,
      currentStageId: activeStage.id,
      goal: journeyDefinition.goal,
      completedObjectives,
      missingObjectives,
      recommendedAction: activeStage.suggestedAction || 'Avanzar conversación'
    };

    return { nextBestAction, objectiveState };
  }
}
