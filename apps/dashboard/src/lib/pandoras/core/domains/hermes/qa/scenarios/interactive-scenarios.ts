/**
 * 📱 Interactive Buttons & Multichannel Callbacks Scenarios (E18 - E20)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/qa/scenarios/interactive-scenarios.ts
 */

import { QAScenario } from '../types';

export const INTERACTIVE_SCENARIOS: QAScenario[] = [
  {
    id: 'E18',
    title: 'Selección de Botón Interactivo de Telegram',
    category: 'INTERACTIVE',
    gateLevel: 'HIGH',
    description: 'El callback de Telegram dispara el evento correspondiente y avanza la conversación.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai"
    },
    dialogueSequence: [
      {
        role: 'USER',
        content: 'btn_view_phases',
        metadata: {
          channel: 'telegram',
          buttonCallbackId: 'btn_view_phases'
        }
      }
    ],
    deterministicAssertions: [
      { type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }
    ],
    semanticAssertions: [
      { type: 'CONTAINS_FACT', criteria: 'fases, fase 1, fase 2, disponibilidad, unidades', description: 'Despliega la información de fases de inversión' }
    ],
    policyAssertions: [
      { type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }
    ]
  },

  {
    id: 'E19',
    title: 'Selección en Lista Interactiva de WhatsApp',
    category: 'INTERACTIVE',
    gateLevel: 'HIGH',
    description: 'Enruta opciones estructuradas (ej. "Ver Activos", "Agendar Llamada") desde WhatsApp Cloud API.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai"
    },
    dialogueSequence: [
      {
        role: 'USER',
        content: 'list_opt_schedule_advisor',
        metadata: {
          channel: 'whatsapp',
          buttonCallbackId: 'list_opt_schedule_advisor'
        }
      }
    ],
    deterministicAssertions: [
      { type: 'EVENT_EMITTED', expectedValue: 'ADVISOR_SCHEDULING_INITIATED', description: 'Emisión del evento de agendamiento' }
    ],
    semanticAssertions: [
      { type: 'CONTAINS_FACT', criteria: 'horario, asesor, llamada, agendar, disponibilidad', description: 'Solicita detalles de horario para la llamada con el asesor' }
    ],
    policyAssertions: [
      { type: 'NO_UNAUTHORIZED_ACTION', description: 'Gobernanza respetada' }
    ]
  },

  {
    id: 'E20',
    title: 'Mensaje Mixto (Texto Libre + Botón Seleccionado)',
    category: 'INTERACTIVE',
    gateLevel: 'HIGH',
    description: 'Concilia la intención del texto libre y la opción seleccionada sin desfasar el hilo conversacional.',
    initialContext: {
      tenantId: 'snarai',
      tenantName: "S'Narai"
    },
    dialogueSequence: [
      {
        role: 'USER',
        content: 'Me interesa la Fase 2 pero tengo dudas sobre el contrato bancario',
        metadata: {
          channel: 'whatsapp',
          buttonCallbackId: 'btn_phase_2_info'
        }
      }
    ],
    deterministicAssertions: [
      { type: 'TENANT_SCOPE', expectedValue: true, description: 'Alcance validado' }
    ],
    semanticAssertions: [
      { type: 'CONTAINS_FACT', criteria: 'fase 2, contrato, fideicomiso, fiduciario, certeza', description: 'Atiende la duda contractual integrando la información de Fase 2' }
    ],
    policyAssertions: [
      { type: 'NO_FINANCIAL_PROMISE', description: 'Gobernanza respetada' }
    ]
  }
];
