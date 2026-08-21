/**
 * 🧠 Memory & Context Coherence Scenarios (E06 - E10)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/qa/scenarios/memory-scenarios.ts
 */

import { QAScenario } from '../types';

export const MEMORY_SCENARIOS: QAScenario[] = [
  {
    id: 'E06',
    title: 'Retención de Nombre y Perfil del Cliente',
    category: 'MEMORY',
    gateLevel: 'HIGH',
    description: 'Recuerda el nombre proporcionado en mensajes anteriores durante la misma conversación.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai",
      existingHistory: [
        { role: 'USER', content: 'Hola, me llamo Carlos Mendoza y me interesa conocer más del proyecto.' },
        { role: 'SYSTEM', content: 'Hola Carlos, un gusto saludarte. ¿Te gustaría conocer la estructura de participación de S\'Narai?' }
      ]
    },
    dialogueSequence: [
      { role: 'USER', content: 'Sí, por favor cuéntame cómo funciona.' }
    ],
    deterministicAssertions: [
      { type: 'MEMORY_STORED', expectedValue: { key: 'userName', expectedSubstr: 'Carlos' }, description: 'Nombre persistido en memoria' }
    ],
    semanticAssertions: [
      { type: 'CONTAINS_FACT', criteria: 'carlos, participación, activo', description: 'Se dirige al usuario por su nombre o reconoce su perfil' }
    ],
    policyAssertions: [
      { type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }
    ]
  },

  {
    id: 'E07',
    title: 'Retención de Preferencias / Presupuesto de Inversión',
    category: 'MEMORY',
    gateLevel: 'STANDARD',
    description: 'Mantiene el contexto de ticket de inversión sin volver a preguntar.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai",
      userProfile: { investmentBudget: '$25,000 USD' }
    },
    dialogueSequence: [
      { role: 'USER', content: 'Recordando mi presupuesto, ¿qué opciones de unidades me recomiendas?' }
    ],
    deterministicAssertions: [
      { type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }
    ],
    semanticAssertions: [
      { type: 'CONTAINS_FACT', criteria: '25, unidades, participación, presupuesto', description: 'Hace referencia al presupuesto establecido' }
    ],
    policyAssertions: [
      { type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }
    ]
  },

  {
    id: 'E08',
    title: 'Conflicto de Memoria (Prevalencia del Hecho Reciente)',
    category: 'MEMORY',
    gateLevel: 'HIGH',
    description: 'Si el usuario corrige un dato (ej. cambio de residencia/teléfono), el dato nuevo prevalece.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai",
      userProfile: { residence: 'Ciudad de México' }
    },
    dialogueSequence: [
      { role: 'USER', content: 'Oye, ya no vivo en CDMX, me acabo de mudar a Monterrey.' }
    ],
    deterministicAssertions: [
      { type: 'MEMORY_STORED', expectedValue: { key: 'residence', expectedSubstr: 'Monterrey' }, description: 'Actualización del hecho en memoria semántica' }
    ],
    semanticAssertions: [
      { type: 'CONTAINS_FACT', criteria: 'monterrey, registrado, actualizado, gusto', description: 'Confirma la nueva ubicación' }
    ],
    policyAssertions: [
      { type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }
    ]
  },

  {
    id: 'E09',
    title: 'Memoria Expirada / Stale Memory',
    category: 'MEMORY',
    gateLevel: 'HIGH',
    description: 'Si un dato tiene más de 30 días o ambigüedad, solicita confirmación sutil antes de darlo por sentado.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai",
      userProfile: { lastInteractionDaysAgo: 45, staleBudget: '$10,000 USD' }
    },
    dialogueSequence: [
      { role: 'USER', content: 'Hola Hermes, retomando nuestra charla anterior.' }
    ],
    deterministicAssertions: [
      { type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }
    ],
    semanticAssertions: [
      { type: 'CONTAINS_FACT', criteria: 'retomando, gusto, confirmar, opciones', description: 'Saluda con cortesía y valida si los intereses siguen vigentes' }
    ],
    policyAssertions: [
      { type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }
    ]
  },

  {
    id: 'E10',
    title: 'Recuperación de Contexto Cross-Session (24h+)',
    category: 'MEMORY',
    gateLevel: 'HIGH',
    description: 'Retoma la conversación tras una pausa temporal reconociendo el estado previo.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai",
      existingHistory: [
        { role: 'USER', content: 'Estaba revisando la documentación de los fideicomisos.' },
        { role: 'SYSTEM', content: 'Con gusto. El fideicomiso de S\'Narai custodia el activo y garantiza la transparencia fiduciaria.' }
      ]
    },
    dialogueSequence: [
      { role: 'USER', content: 'Hola de nuevo, ¿me puedes enviar el enlace al portal para revisarlo?' }
    ],
    deterministicAssertions: [
      { type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }
    ],
    semanticAssertions: [
      { type: 'CONTAINS_FACT', criteria: 'portal, fideicomiso, enlace, gusto', description: 'Reconoce la continuidad temática y provee el enlace' }
    ],
    policyAssertions: [
      { type: 'NO_CREDENTIAL_DISCLOSURE', description: 'No expone secretos' }
    ]
  }
];
