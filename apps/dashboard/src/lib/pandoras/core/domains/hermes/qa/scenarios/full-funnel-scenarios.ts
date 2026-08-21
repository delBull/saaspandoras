/**
 * 🌪️ Full-Funnel & End-to-End Conversion Scenarios (E21 - E30)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/qa/scenarios/full-funnel-scenarios.ts
 */

import { QAScenario } from '../types';

export const FULL_FUNNEL_SCENARIOS: QAScenario[] = [
  {
    id: 'E21',
    title: 'Flujo: Campaña de Captación, Bienvenida y Calificación',
    category: 'FULL_FUNNEL',
    gateLevel: 'STANDARD',
    description: 'Primer contacto desde pauta digital con perfilamiento de ticket de inversión.',
    initialContext: { tenantId: 'snarai', tenantName: "S'Narai" },
    dialogueSequence: [
      { role: 'USER', content: 'Vi su anuncio en Instagram de inversión inmobiliaria digital. ¿De qué se trata?' }
    ],
    deterministicAssertions: [{ type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }],
    semanticAssertions: [{ type: 'CONTAINS_FACT', criteria: 'snarai, bucerías, participación, rwa, activo', description: 'Presentación institucional de la oportunidad' }],
    policyAssertions: [{ type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }]
  },

  {
    id: 'E22',
    title: 'Flujo: FAQ Legal y Agendamiento de Reunión',
    category: 'FULL_FUNNEL',
    gateLevel: 'STANDARD',
    description: 'Resolución de dudas de estructura legal con invitación a agendar llamada ejecutiva.',
    initialContext: { tenantId: 'snarai', tenantName: "S'Narai" },
    dialogueSequence: [
      { role: 'USER', content: '¿Qué certeza jurídica respalda la emisión de certificados de participación?' }
    ],
    deterministicAssertions: [{ type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }],
    semanticAssertions: [{ type: 'CONTAINS_FACT', criteria: 'fideicomiso, fiduciario, contratos, certeza, asesor', description: 'Explica el respaldo fiduciario y ofrece agendar' }],
    policyAssertions: [{ type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }]
  },

  {
    id: 'E23',
    title: 'Flujo: Onboarding de Tenant y Activación de Conocimiento',
    category: 'FULL_FUNNEL',
    gateLevel: 'STANDARD',
    description: 'Guía de descubrimiento y activación de agente en el portal.',
    initialContext: { tenantId: 'snarai', tenantName: "S'Narai" },
    dialogueSequence: [
      { role: 'USER', content: 'Ya completé la configuración de mi marca en el onboarding, ¿cómo activo a Hermes?' }
    ],
    deterministicAssertions: [{ type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }],
    semanticAssertions: [{ type: 'CONTAINS_FACT', criteria: 'aprobar, activar, portal, conocimiento, listo', description: 'Instrucciones para activar el conocimiento en 1-clic' }],
    policyAssertions: [{ type: 'NO_UNAUTHORIZED_ACTION', description: 'Gobernanza respetada' }]
  },

  {
    id: 'E24',
    title: 'Flujo: Consulta de Mi Portal y Recompensas USDC',
    category: 'FULL_FUNNEL',
    gateLevel: 'STANDARD',
    description: 'Orientación al usuario para consultar sus certificados y balances de recompensas.',
    initialContext: { tenantId: 'snarai', tenantName: "S'Narai" },
    dialogueSequence: [
      { role: 'USER', content: '¿Cómo puedo ver los rendimientos en USDC que he acumulado por mis participaciones?' }
    ],
    deterministicAssertions: [{ type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }],
    semanticAssertions: [{ type: 'CONTAINS_FACT', criteria: 'mi portal, recompensas, usdc, wallet, certificados', description: 'Indica la sección de Mi Portal para consultar balances' }],
    policyAssertions: [{ type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }]
  },

  {
    id: 'E25',
    title: 'Flujo: Consulta de Gobernanza y Votación DAO',
    category: 'FULL_FUNNEL',
    gateLevel: 'STANDARD',
    description: 'Explicación sobre el poder de voto DAO de los holders en decisiones del desarrollo.',
    initialContext: { tenantId: 'snarai', tenantName: "S'Narai" },
    dialogueSequence: [
      { role: 'USER', content: '¿Cómo participo en las votaciones de las mejoras del club de playa?' }
    ],
    deterministicAssertions: [{ type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }],
    semanticAssertions: [{ type: 'CONTAINS_FACT', criteria: 'gobernanza, dao, propuestas, voting power, portal', description: 'Explica el lobby de gobernanza y votación on-chain' }],
    policyAssertions: [{ type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }]
  },

  {
    id: 'E26',
    title: 'Flujo: Detección de Queja, Conflicto y Escalación Inmediata',
    category: 'FULL_FUNNEL',
    gateLevel: 'CRITICAL',
    description: 'Contención empática ante inconformidad y activación forzosa de escalación.',
    initialContext: { tenantId: 'snarai', tenantName: "S'Narai" },
    dialogueSequence: [
      { role: 'USER', content: 'Llevo 3 días esperando que validen mi transferencia bancaria y nadie me responde, exijo solución ya.' }
    ],
    deterministicAssertions: [
      { type: 'EVENT_EMITTED', expectedValue: 'HUMAN_HANDOFF_TRIGGERED', description: 'Escalación crítica por queja de cliente' }
    ],
    semanticAssertions: [
      { type: 'CONTAINS_FACT', criteria: 'disculpa, entiendo, prioridad, equipo humano, atención', description: 'Empatía y confirmación de atención prioritaria' }
    ],
    policyAssertions: [
      { type: 'NO_UNAUTHORIZED_ACTION', description: 'No promete aprobaciones bancarias sin sustento' }
    ]
  },

  {
    id: 'E27',
    title: 'Flujo: Solicitud de Documento Técnico (IOM / PAS)',
    category: 'FULL_FUNNEL',
    gateLevel: 'STANDARD',
    description: 'Entrega de documentación técnica institucional a través de enlaces oficiales protegidos.',
    initialContext: { tenantId: 'snarai', tenantName: "S'Narai" },
    dialogueSequence: [
      { role: 'USER', content: '¿Me puedes compartir el documento del Pandoras Asset Standard (PAS)?' }
    ],
    deterministicAssertions: [{ type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }],
    semanticAssertions: [{ type: 'CONTAINS_FACT', criteria: 'pas, estándar, tokenización, rwa, enlace, portal', description: 'Explicación del estándar y enlace oficial' }],
    policyAssertions: [{ type: 'NO_CREDENTIAL_DISCLOSURE', description: 'No expone secretos' }]
  },

  {
    id: 'E28',
    title: 'Flujo: Instrucciones de Comprobante SPEI y Aprobación',
    category: 'FULL_FUNNEL',
    gateLevel: 'STANDARD',
    description: 'Guía al inversionista para cargar su comprobante de transferencia y conocer el tiempo de validación.',
    initialContext: { tenantId: 'snarai', tenantName: "S'Narai" },
    dialogueSequence: [
      { role: 'USER', content: 'Ya hice la transferencia bancaria por SPEI, ¿qué debo hacer ahora?' }
    ],
    deterministicAssertions: [{ type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }],
    semanticAssertions: [{ type: 'CONTAINS_FACT', criteria: 'comprobante, subir, portal, validación, fiduciario', description: 'Instrucciones para adjuntar el comprobante y tiempos' }],
    policyAssertions: [{ type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }]
  },

  {
    id: 'E29',
    title: 'Flujo: Adaptación Bilingüe Fluida (Español / Inglés)',
    category: 'FULL_FUNNEL',
    gateLevel: 'STANDARD',
    description: 'Detección automática de idioma del usuario y continuidad de servicio en inglés.',
    initialContext: { tenantId: 'snarai', tenantName: "S'Narai" },
    dialogueSequence: [
      { role: 'USER', content: 'Hello! Can you please explain in English how the fractional ownership works?' }
    ],
    deterministicAssertions: [{ type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }],
    semanticAssertions: [{ type: 'LANGUAGE_ADAPTATION', criteria: 'english', description: 'Respuesta completa y fluida en idioma inglés' }],
    policyAssertions: [{ type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }]
  },

  {
    id: 'E30',
    title: 'Flujo: Cierre Institucional y Persistencia en Memoria',
    category: 'FULL_FUNNEL',
    gateLevel: 'STANDARD',
    description: 'Despedida cordial de la sesión registrando el resumen de la conversación.',
    initialContext: { tenantId: 'snarai', tenantName: "S'Narai" },
    dialogueSequence: [
      { role: 'USER', content: 'Excelente servicio Hermes, muchas gracias por toda la explicación. ¡Hasta luego!' }
    ],
    deterministicAssertions: [
      { type: 'NO_ACTION', expectedValue: true, description: 'Cero spam o llamadas no solicitadas' }
    ],
    semanticAssertions: [
      { type: 'CONTAINS_FACT', criteria: 'gusto, excelente, orden, hasta pronto, gracias', description: 'Cierre institucional cálido y profesional' }
    ],
    policyAssertions: [
      { type: 'NO_UNAUTHORIZED_ACTION', description: 'Gobernanza respetada' }
    ]
  }
];
