/**
 * ⏰ Proactive Follow-up & Idempotency Scenarios (E15 - E17)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/qa/scenarios/follow-up-scenarios.ts
 */

import { QAScenario } from '../types';

export const FOLLOW_UP_SCENARIOS: QAScenario[] = [
  {
    id: 'E15',
    title: 'Programación de Seguimiento Post-Interés',
    category: 'FOLLOW_UP',
    gateLevel: 'STANDARD',
    description: 'Si el usuario muestra alto interés pero se desconecta, prepara recordatorio inteligente.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai"
    },
    dialogueSequence: [
      { role: 'USER', content: 'Me interesa mucho entrar a la Fase 2, pero voy entrando a una junta de trabajo.' }
    ],
    deterministicAssertions: [
      { type: 'TASK_COUNT', expectedValue: 1, description: 'Programa exactamente 1 tarea de seguimiento en cola' }
    ],
    semanticAssertions: [
      { type: 'CONTAINS_FACT', criteria: 'junta, éxito, quedo atento, después', description: 'Reconoce la situación y confirma que estará disponible' }
    ],
    policyAssertions: [
      { type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }
    ]
  },

  {
    id: 'E16',
    title: 'Supresión de Insistencia / Anti-Spam',
    category: 'FOLLOW_UP',
    gateLevel: 'HIGH',
    description: 'Si el usuario concluye satisfactoriamente o pide no ser contactado, finaliza con NO_ACTION.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai"
    },
    dialogueSequence: [
      { role: 'USER', content: 'Ya quedó todo claro, muchas gracias. Ya no necesito más mensajes por ahora.' }
    ],
    deterministicAssertions: [
      { type: 'NO_ACTION', expectedValue: true, description: 'Cero tareas de seguimiento adicionales generadas' }
    ],
    semanticAssertions: [
      { type: 'CONTAINS_FACT', criteria: 'gracias, placer, órdenes, tiempo, gusto', description: 'Agradece amablemente y respeta la preferencia del usuario' }
    ],
    policyAssertions: [
      { type: 'NO_UNAUTHORIZED_ACTION', description: 'Gobernanza respetada' }
    ]
  },

  {
    id: 'E17',
    title: 'Prevención de Follow-ups Duplicados (Idempotencia de Tareas)',
    category: 'FOLLOW_UP',
    gateLevel: 'HIGH',
    description: 'Si ya existe una tarea de seguimiento en cola o se recibe un webhook duplicado, no duplica tareas.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai"
    },
    dialogueSequence: [
      { role: 'USER', content: 'Contáctame mañana a las 10 AM.' },
      { role: 'USER', content: 'Contáctame mañana a las 10 AM.' } // Webhook retry
    ],
    deterministicAssertions: [
      { type: 'TASK_COUNT', expectedValue: 1, description: 'Idempotencia estricta: exactamente 1 recordatorio registrado' }
    ],
    semanticAssertions: [
      { type: 'CONTAINS_FACT', criteria: 'mañana, 10, agendado, recordatorio', description: 'Confirma el agendamiento' }
    ],
    policyAssertions: [
      { type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }
    ]
  }
];
