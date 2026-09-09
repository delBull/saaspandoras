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
