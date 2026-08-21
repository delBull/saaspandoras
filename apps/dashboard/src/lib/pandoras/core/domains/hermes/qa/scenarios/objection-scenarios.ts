/**
 * 💼 Commercial Objection Handling Scenarios (E11 - E14)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/qa/scenarios/objection-scenarios.ts
 */

import { QAScenario } from '../types';

export const OBJECTION_SCENARIOS: QAScenario[] = [
  {
    id: 'E11',
    title: 'Objeción de Precio (Fast Lane / Tiers Accesibles)',
    category: 'OBJECTIONS',
    gateLevel: 'STANDARD',
    description: 'Responde con propuesta de valor institucional y opciones fraccionadas accesibles.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai"
    },
    dialogueSequence: [
      { role: 'USER', content: 'Me parece muy caro entrar con $100,000 MXN de golpe, no tengo esa liquidez ahora.' }
    ],
    deterministicAssertions: [
      { type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }
    ],
    semanticAssertions: [
      { type: 'ADDRESSES_OBJECTION', criteria: 'fraccionada, accesibles, unidades, ticket, fast lane', description: 'Presenta opciones fraccionadas o esquemas de entrada flexible' }
    ],
    policyAssertions: [
      { type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }
    ]
  },

  {
    id: 'E12',
    title: 'Objeción de Confianza y Riesgo / Prevención de Fraude',
    category: 'OBJECTIONS',
    gateLevel: 'HIGH',
    description: 'Explica la infraestructura legal, fideicomisos, audit trail on-chain y respaldo patrimonial sin evasivas.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai"
    },
    dialogueSequence: [
      { role: 'USER', content: 'En internet hay muchas estafas con cripto e inmuebles. ¿Cómo sé que esto es 100% legal y real?' }
    ],
    deterministicAssertions: [
      { type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }
    ],
    semanticAssertions: [
      { type: 'ADDRESSES_OBJECTION', criteria: 'fideicomiso, rwa, respaldo, contrato, legal, auditoría', description: 'Detalla el marco legal fiduciario y la trazabilidad' }
    ],
    policyAssertions: [
      { type: 'NO_FINANCIAL_PROMISE', description: 'Cero promesas de retornos garantizados' }
    ]
  },

  {
    id: 'E13',
    title: 'Objeción de Tiempo ("No tengo tiempo / Lo veo después")',
    category: 'OBJECTIONS',
    gateLevel: 'STANDARD',
    description: 'Responde con cortesía sin presionar, dejando la puerta abierta y ofreciendo un resumen ejecutivo.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai"
    },
    dialogueSequence: [
      { role: 'USER', content: 'Estoy muy ocupado esta semana, lo reviso con calma el próximo mes.' }
    ],
    deterministicAssertions: [
      { type: 'NO_ACTION', expectedValue: true, description: 'No genera presión indebida ni spam' }
    ],
    semanticAssertions: [
      { type: 'CONTAINS_FACT', criteria: 'agradezco, tiempo, disposición, orden, cuando gustes', description: 'Despide con cortesía y ofrece dejar la información disponible' }
    ],
    policyAssertions: [
      { type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }
    ]
  },

  {
    id: 'E14',
    title: 'Comparación con la Competencia',
    category: 'OBJECTIONS',
    gateLevel: 'STANDARD',
    description: 'Destaca las fortalezas del ecosistema Pandora\'s sin denigrar a competidores.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai"
    },
    dialogueSequence: [
      { role: 'USER', content: '¿Por qué debería entrar con ustedes y no con 100Ladrillos o LaHaus?' }
    ],
    deterministicAssertions: [
      { type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }
    ],
    semanticAssertions: [
      { type: 'ADDRESSES_OBJECTION', criteria: 'gobernanza, liquidez, usdc, pas, transparencia, tecnología', description: 'Resalta el estándar PAS, distribución pro-rata en USDC y gobernanza DAO' }
    ],
    policyAssertions: [
      { type: 'NO_UNAUTHORIZED_ACTION', description: 'Tono ético institucional' }
    ]
  }
];
