/**
 * ⚡ Hermes Sales Simulator 2.0 Types & Sanitizers
 * apps/dashboard/src/lib/hermes/simulator-types.ts
 *
 * Directivas de Seguridad:
 * - Parámetros de URL estrictamente validados contra un enum cerrado.
 * - rep es solo atribución de marketing, cero capacidades de autorización.
 * - Cero inyección de prompts arbitrarios desde el cliente.
 */

export type SimulatorIndustry = 
  | 'real_estate' 
  | 'automotive' 
  | 'legal' 
  | 'saas' 
  | 'healthcare' 
  | 'general';

export type SimulatorGoal = 
  | 'CLOSE_SALES' 
  | 'BOOK_APPOINTMENTS' 
  | 'QUALIFY_LEADS';

export interface DemoContext {
  company: string;
  industry: SimulatorIndustry;
  goal: SimulatorGoal;
  attributionRep?: string;
  source?: string;
}

export interface IndustryConfig {
  id: SimulatorIndustry;
  label: string;
  agentName: string;
  accent: string;
  description: string;
  starterSuggestions: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Hermes OS Engine Trace — functionality that SELLS
// Reflects the real Hermes OS portal modules and 5-layer cognitive pipeline
// (see /growth-os/hermes/architecture). Each step maps to a real product feature.
// ─────────────────────────────────────────────────────────────────────────────

export type HermesTraceAction =
  | 'RESPOND'
  | 'BOOK_APPOINTMENT'
  | 'ESCALATE_TO_HUMAN'
  | 'AUTONOMOUS_CLOSE';

export interface HermesTraceStep {
  id: 'inbound' | 'authority' | 'intent' | 'knowledge' | 'governance' | 'action';
  module: string;
  step: string;
  detail: string;
  status: 'done' | 'active' | 'pending';
}

export interface HermesTrace {
  steps: HermesTraceStep[];
  action: HermesTraceAction;
  actionLabel: string;
}

// Real portal modules the demo proves, surfaced as chips in the UI
export const HERMES_PORTAL_MODULES = [
  'Canales',
  'Knowledge Base',
  'Journeys',
  'Escalación HITL',
  'Pagos',
  'Whitelabel',
] as const;

export const SIMULATOR_INDUSTRIES: Record<SimulatorIndustry, IndustryConfig> = {
  real_estate: {
    id: 'real_estate',
    label: '🏠 Real Estate',
    agentName: 'Hermes Patrimonial',
    accent: '#f59e0b',
    description: 'Calificación de inversionistas, disponibilidad de unidades y agenda de visitas.',
    starterSuggestions: [
      '¿Qué propiedades tienen disponibles en este momento?',
      '¿Cuánto cuesta un departamento o lote promedio?',
      'Quiero agendar una visita privada esta semana',
    ],
  },
  automotive: {
    id: 'automotive',
    label: '🚗 Automotriz',
    agentName: 'Hermes AutoAdvisor',
    accent: '#3b82f6',
    description: 'Cotizaciones instantáneas, inventario y agendado de pruebas de manejo.',
    starterSuggestions: [
      '¿Qué modelos tienen disponibles para entrega inmediata?',
      '¿Manejan opciones de financiamiento o enganche?',
      'Quiero agendar una prueba de manejo para el sábado',
    ],
  },
  legal: {
    id: 'legal',
    label: '⚖️ Legal & Notarial',
    agentName: 'Hermes Legal',
    accent: '#8b5cf6',
    description: 'Recepción y triaje de casos, asesoría preliminar y agenda de consultas.',
    starterSuggestions: [
      'Necesito asesoría legal para constitución y contratos',
      '¿Cuál es el costo de una consulta inicial?',
      '¿Puedo agendar una videollamada con un abogado?',
    ],
  },
  saas: {
    id: 'saas',
    label: '💻 SaaS & Tecnología',
    agentName: 'Hermes Tech',
    accent: '#10b981',
    description: 'Demostración de producto, planes de precios y activación de cuentas.',
    starterSuggestions: [
      '¿Qué diferencias hay entre sus planes de suscripción?',
      '¿Se puede integrar con nuestro CRM o sistemas actuales?',
      'Quiero ver una demo guiada con un especialista',
    ],
  },
  healthcare: {
    id: 'healthcare',
    label: '🏥 Salud & Clínicas',
    agentName: 'Hermes Health',
    accent: '#ef4444',
    description: 'Agenda de citas médicas, especialidades y recordatorios automáticos.',
    starterSuggestions: [
      'Quiero agendar una consulta médica disponible',
      '¿Qué especialistas atienden en su clínica?',
      '¿Cuáles son sus horarios y formas de pago?',
    ],
  },
  general: {
    id: 'general',
    label: '🏢 Negocio General',
    agentName: 'Hermes Closer',
    accent: '#6366f1',
    description: 'Atención 24/7, prospección de clientes y cierre en canales de mensajería.',
    starterSuggestions: [
      '¿Qué servicios o productos ofrecen?',
      '¿Cuáles son sus precios y tiempos de entrega?',
      'Quiero hablar con un asesor humano para contratar',
    ],
  },
};

/**
 * Sanitizes and resolves raw parameters into a safe, deterministic DemoContext.
 */
export function resolveSafeDemoContext(params: {
  company?: string | null;
  industry?: string | null;
  goal?: string | null;
  rep?: string | null;
  source?: string | null;
}): DemoContext {
  // 1. Sanitize Company (Max 60 chars, clean special chars)
  const rawCompany = (params.company || '').trim();
  const safeCompany = rawCompany
    ? rawCompany.replace(/[^a-zA-Z0-9\s.,&'-]/g, '').slice(0, 60)
    : 'Tu Negocio';

  // 2. Validate Industry against closed enum
  const validIndustries: SimulatorIndustry[] = [
    'real_estate',
    'automotive',
    'legal',
    'saas',
    'healthcare',
    'general',
  ];
  const safeIndustry: SimulatorIndustry = validIndustries.includes(params.industry as any)
    ? (params.industry as SimulatorIndustry)
    : 'general';

  // 3. Validate Goal against closed enum
  const validGoals: SimulatorGoal[] = [
    'CLOSE_SALES',
    'BOOK_APPOINTMENTS',
    'QUALIFY_LEADS',
  ];
  const safeGoal: SimulatorGoal = validGoals.includes(params.goal as any)
    ? (params.goal as SimulatorGoal)
    : 'QUALIFY_LEADS';

  // 4. Sanitize Rep (strictly marketing attribution tracking, max 30 chars, alphanumeric)
  const rawRep = (params.rep || '').trim();
  const safeRep = rawRep
    ? rawRep.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30)
    : undefined;

  // 5. Sanitize Source (marketing origin channel, e.g. whatsapp, landing, linkedin)
  const rawSource = (params.source || '').trim();
  const safeSource = rawSource
    ? rawSource.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30)
    : 'landing';

  return {
    company: safeCompany,
    industry: safeIndustry,
    goal: safeGoal,
    attributionRep: safeRep,
    source: safeSource,
  };
}

/**
 * Builds the live engine trace shown in the simulator — maps each step to a REAL
 * Hermes OS module (the 5-layer cognitive pipeline + execution action).
 * Pure & deterministic so it can be unit-tested and reused client/server.
 */
export function buildSandboxTrace(params: {
  company: string;
  industry: SimulatorIndustry;
  goal?: SimulatorGoal;
  intent: { type: string; label: string; confidence: string } | null;
  message: string;
}): HermesTrace {
  const lowerMsg = params.message.toLowerCase();
  const wantsHuman =
    /(humano|asesor|persona|ejecutivo|hablar con alguien|representante|no un robot)/i.test(lowerMsg);

  const steps: HermesTraceStep[] = [
    {
      id: 'inbound',
      module: 'Omnicanal',
      step: 'Entrada por canal',
      detail:
        'Prospecto escribió vía Web Widget (demostración). En producción entra por WhatsApp, Telegram, SMS o Web con normalización de sesión.',
      status: 'done',
    },
    {
      id: 'authority',
      module: 'Aislamiento Tenant',
      step: 'Resolución de autoridad',
      detail: `Modo demo pre-tenant para ${params.company}. En producción cada organización opera aislada con Row-Level Security.`,
      status: 'done',
    },
    {
      id: 'intent',
      module: 'Intent Engine',
      step: 'Clasificación de intención',
      detail: params.intent
        ? `Detectó: ${params.intent.label} (confianza ${params.intent.confidence}).`
        : 'Intención aún no comercial; sigue calificando con preguntas de contexto.',
      status: 'done',
    },
    {
      id: 'knowledge',
      module: 'Knowledge Base',
      step: 'Respuesta desde hechos verificados',
      detail: `Solo responde lo que la bóveda de ${params.industry} respalda (en demo, estructura estándar; en producción, catálogo y precios exactos).`,
      status: 'done',
    },
    {
      id: 'governance',
      module: 'Gobernanza',
      step: 'Firewall post-LLM',
      detail:
        'Respuesta auditada antes de enviarse: cero alucinaciones, cero promesas de precio o rendimiento inventadas, normalización del vocabulario institucional.',
      status: 'done',
    },
  ];

  let action: HermesTraceAction = 'RESPOND';
  let actionLabel = 'Respondió y sigue calificando al prospecto en el embudo';

  if (wantsHuman) {
    action = 'ESCALATE_TO_HUMAN';
    actionLabel =
      'Escaló a tu equipo con contexto completo (HITL): no entregó el lead, lo priorizó con todo el historial.';
  } else if (params.intent?.type === 'HIGH_PRIORITY_PURCHASE') {
    action = 'AUTONOMOUS_CLOSE';
    actionLabel =
      'Señal de compra detectada: en producción Hermes valida elegibilidad y genera un link de pago SPEI o Web3 en el chat (cierre autónomo).';
  } else if (params.intent?.type === 'APPOINTMENT_REQUEST') {
    action = 'BOOK_APPOINTMENT';
    actionLabel =
      'Agenda conectada: en producción Hermes propone slot, confirma la cita automáticamente y envía recordatorios.';
  }

  steps.push({
    id: 'action',
    module: 'Ejecución',
    step: 'Acción final',
    detail: actionLabel,
    status: 'done',
  });

  return { steps, action, actionLabel };
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo scenario builder — deterministic extra scenarios for the Portal preview.
// Lets a seller replay the three money moments (close, appointment, escalation)
// WITHOUT burning the sandbox global/LLM quota. Mirrors the exact same intent
// regex the real sandbox API uses (see api/v1/hermes/sandbox/route.ts).
// ─────────────────────────────────────────────────────────────────────────────

export interface SimulatedScenario {
  kind: 'purchase' | 'appointment' | 'escalate';
  prompt: string;
  reply: string;
  intent: { type: string; label: string; confidence: string } | null;
  trace: HermesTrace;
}

const SCENARIO_PROMPTS: Record<SimulatedScenario['kind'], string> = {
  purchase:
    'Quiero comprar el paquete completo ahora, ¿puedo pagar con tarjeta?',
  appointment: 'Quiero agendar una reunión o visita esta semana, por favor',
  escalate: 'Prefiero hablar con una persona real, no con un robot',
};

const SCENARIO_INTENTS: Record<
  'purchase' | 'appointment',
  { type: string; label: string; confidence: string }
> = {
  purchase: {
    type: 'HIGH_PRIORITY_PURCHASE',
    label: 'Intención de Compra / Consulta de Precios',
    confidence: '94%',
  },
  appointment: {
    type: 'APPOINTMENT_REQUEST',
    label: 'Solicitud de Agenda / Visita',
    confidence: '91%',
  },
};

export function buildDemoScenario(params: {
  kind: SimulatedScenario['kind'];
  company: string;
  industry: SimulatorIndustry;
  goal: SimulatorGoal;
}): SimulatedScenario {
  const { kind, company, industry, goal } = params;
  const industryLabel = (SIMULATOR_INDUSTRIES[industry] || SIMULATOR_INDUSTRIES.general).label;
  const cleanCompany = company !== 'Tu Negocio' ? company : 'tu empresa';
  const prompt = SCENARIO_PROMPTS[kind];

  let reply: string;
  let intent: SimulatedScenario['intent'] = null;

  if (kind === 'purchase') {
    intent = SCENARIO_INTENTS.purchase;
    reply =
      `¡Excelente decisión! 🎉 Hermes **detectó tu intención de compra** al instante.\n\n` +
      `• Estoy validando la elegibilidad de tu paquete ${industryLabel}.\n` +
      `• En tu **instancia en producción**, esto continúa solo: recibes tu **link de pago** 💳 (SPEI o crypto) en este chat y quedas registrado en **Onboarding**, sin intervención humana.`;
  } else if (kind === 'appointment') {
    intent = SCENARIO_INTENTS.appointment;
    reply =
      `¡Claro! 📅 Reviso la agenda disponible de **${cleanCompany}**.\n\n` +
      `• En producción enlazamos tu **calendario real** y te propongo **slots** al instante.\n` +
      `• Confirma y Hermes agenda + envía **recordatorios automáticos** hasta el día de tu visita.`;
  } else {
    reply =
      `¡Por supuesto! 🙋 Entiendo que prefieres atención humana.\n\n` +
      `Hermes **ya escaló esta conversación a tu equipo con contexto completo**: historial, intención detectada y datos de contacto. Un asesor te llamará a la brevedad.\n\n` +
      `• Esta es la parte que más valoran tus clientes: **nada se pierde en la transferencia**.`;
  }

  const trace = buildSandboxTrace({
    company,
    industry,
    goal,
    intent,
    message: prompt,
  });

  return { kind, prompt, reply, intent, trace };
}
