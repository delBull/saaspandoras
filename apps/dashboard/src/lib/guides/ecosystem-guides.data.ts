/**
 * 🧭 NEXUS ONBOARDING DATA (SOURCE OF TRUTH)
 * apps/dashboard/src/lib/guides/ecosystem-guides.data.ts
 *
 * Canonical definition of Pandora's Nexus Onboarding Stations,
 * RBAC access matrices, Hermes conversational narratives, and shareable link generators.
 */

export type EcosystemTourRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'MARKETING' | 'VIEWER';

export interface GuideFaqItem {
  question: string;
  answer: string;
}

export interface EcosystemStation {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  category: 'LEGAL' | 'COMMERCIAL' | 'FINANCE' | 'PORTAL' | 'GOVERNANCE' | 'ACADEMY' | 'CORE' | 'GROWTH' | 'ACCESS' | 'RESOURCES' | 'COGNITIVE';
  badgeColor: string;
  iconName: string;
  targetUrl: string;
  allowedRoles: EcosystemTourRole[];
  hermesGreeting: string;
  hermesNarrative: string;
  keyHighlights: string[];
  faqs: GuideFaqItem[];
}

export const ECOSYSTEM_STATIONS: EcosystemStation[] = [
  {
    id: 'nexus_core',
    order: 1,
    title: 'Core Protocol',
    subtitle: 'Deal Rooms, Ejecución Soberana & Contratos Notarizados',
    category: 'CORE',
    badgeColor: 'blue',
    iconName: 'Boxes',
    targetUrl: '/nexus/rooms',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MARKETING', 'OPERATOR', 'VIEWER'],
    hermesGreeting: 'El fundamento de nuestros acuerdos de alta fidelidad.',
    hermesNarrative:
      'El Core Protocol gestiona las Transaction y Deal Rooms. Aquí estructuramos, revisamos y notarizamos acuerdos institucionales, propuestas y contratos. Cada documento firmado genera un hash SHA-256 inmutable vinculado a nuestra bóveda criptográfica Sovereign K25, brindando trazabilidad forense absoluta.',
    keyHighlights: [
      'Redacción y custodia de contratos bilaterales con validez jurídica.',
      'Sovereign e-Sign con sellado criptográfico y hash auditado.',
      'Jerarquía natural entre Propuestas, Acuerdos y Amendments.',
    ],
    faqs: [
      {
        question: '¿Cómo se garantiza la validez legal de los acuerdos firmados?',
        answer: 'Cada acuerdo genera un digest SHA-256 con timestamp atómico, direcciones de wallet y registro de auditoría. Es prueba inmutable bajo estándares probatorios digitales.',
      },
      {
        question: '¿Por qué no veo mis Propuestas creadas?',
        answer: 'Asegúrate de no tener filtros activos. Las propuestas se listan como nodos raíz, y los acuerdos derivados aparecen debajo de ellas en forma de árbol jerárquico.',
      },
    ],
  },
  {
    id: 'nexus_growth',
    order: 2,
    title: 'Growth & Platform Infrastructure',
    subtitle: 'Developer Hub, Marketing Leads & Analytics',
    category: 'GROWTH',
    badgeColor: 'emerald',
    iconName: 'TrendingUp',
    targetUrl: '/nexus/developers',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MARKETING', 'OPERATOR'],
    hermesGreeting: 'El motor de expansión y arquitectura técnica.',
    hermesNarrative:
      'Esta sección contiene nuestro Developer Hub y la integración con el Pipeline Comercial de marketing. Aquí documentamos el protocolo A2A para que equipos externos integren agentes al Hub Cognitivo. Además, canalizamos los leads, tickets y soporte a través de arquitecturas multicanal integradas con Discord.',
    keyHighlights: [
      'Instrucciones de integración del SDK A2A para agentes locales.',
      'Reglas de bases de datos serverless (Neon) y mutaciones seguras.',
      'Gestión de leads y flujos automatizados de adquisición.',
    ],
    faqs: [
      {
        question: '¿Qué es el protocolo A2A?',
        answer: 'El estándar de comunicación de Agente a Agente (Agent-to-Agent) que permite a sistemas externos conversar de forma segura usando L1 Transport Headers y firmas EIP-191.',
      },
      {
        question: '¿Dónde gestionamos los leads comerciales?',
        answer: 'Se centralizan en la sección de Marketing Leads, donde Hermes asiste calificando prospectos de manera asíncrona.',
      },
    ],
  },
  {
    id: 'nexus_access',
    order: 3,
    title: 'Platform & Access',
    subtitle: 'Identity Provider, Colaboradores y Discord Verify',
    category: 'ACCESS',
    badgeColor: 'amber',
    iconName: 'Key',
    targetUrl: '/nexus/settings',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    hermesGreeting: 'Control absoluto de identidades y accesos (RBAC).',
    hermesNarrative:
      'Platform & Access permite gestionar los Colaboradores Cross-Tenant, asignarles roles y configurar las llaves de seguridad. Utilizamos Sovereign Auth, por lo que todo acceso se vincula a Wallets Web3, correos cifrados o roles delegados a través de Discord.',
    keyHighlights: [
      'Autenticación Zero-Trust sin contraseñas.',
      'Control de colaboradores y matriz RBAC.',
      'Verificación y asignación de roles a través de servidores de Discord.',
    ],
    faqs: [
      {
        question: '¿Qué pasa si un colaborador pierde su Wallet?',
        answer: 'Un Administrador puede revocar el acceso del colaborador y emitir una nueva delegación mediante el Identity Provider.',
      },
      {
        question: '¿Para qué sirve el Discord Verify?',
        answer: 'Permite que roles de operadores de soporte actúen oficialmente en nombre de Pandoras vinculando su Smart Wallet a su cuenta de Discord.',
      },
    ],
  },
  {
    id: 'nexus_resources',
    order: 4,
    title: 'Resources & Institutional Books',
    subtitle: 'Data Room Institucional, Academia & Graph',
    category: 'RESOURCES',
    badgeColor: 'purple',
    iconName: 'BookOpen',
    targetUrl: '/nexus/academy',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MARKETING', 'OPERATOR', 'VIEWER'],
    hermesGreeting: 'El bastión de conocimiento y principios rectores.',
    hermesNarrative:
      'Aquí se alojan nuestros Documentos Institucionales (Data Room), Whitepapers y el Knowledge Graph de la Academia. Esta área está diseñada para la certificación de operadores, auditorías debidas (due diligence) y preservación de los protocolos operacionales.',
    keyHighlights: [
      'Acceso directo a la Data Room Institucional para auditorías.',
      'Academia para certificación de operadores del protocolo.',
      'Grafo de Conocimiento (Knowledge Graph) estructurado.',
    ],
    faqs: [
      {
        question: '¿Qué es el Knowledge Graph?',
        answer: 'Es un mapa interactivo de todo el conocimiento del ecosistema, permitiendo consultas semánticas complejas sobre nuestros procesos y reglas.',
      },
      {
        question: '¿Quién tiene acceso a la Data Room Institucional?',
        answer: 'Solo entidades autorizadas e inversores admitidos mediante un NDA previamente firmado en el Deal Room.',
      },
    ],
  },
  {
    id: 'nexus_cognitive',
    order: 5,
    title: 'Hermes Cognitive',
    subtitle: 'Hermes Command QA, Agentes Cognitivos & Vectores',
    category: 'COGNITIVE',
    badgeColor: 'rose',
    iconName: 'BrainCircuit',
    targetUrl: '/admin/hermes',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    hermesGreeting: 'Estás ante el Kernel de IA y memoria de Pandoras.',
    hermesNarrative:
      'El módulo cognitivo es la capa de orquestación de IA. Aquí interactúas directamente con Hermes Command QA para validar prompts y respuestas del LLM, y configuras Agentes Cognitivos adicionales. Todo se guarda y recupera desde nuestra base de memoria vectorial.',
    keyHighlights: [
      'Panel de Quality Assurance (QA) para evaluar a Hermes en tiempo real.',
      'Gestor de Agentes Cognitivos para dar de alta sub-agentes.',
      'Monitoreo de latencia y respuestas semánticas en la base de datos vectorial.',
    ],
    faqs: [
      {
        question: '¿Qué es el Hermes Command QA?',
        answer: 'Un entorno de pruebas (sandbox) donde los administradores inyectan prompts y validan la calidad y alineación de las respuestas de Hermes.',
      },
      {
        question: '¿Cómo doy de alta un nuevo Agente Cognitivo?',
        answer: 'Mediante la sección de Configuración > Cognitive Agents, especificando su Agent ID y generando su secreto criptográfico para integrarlo vía A2A.',
      },
    ],
  },
  {
    id: 'nexus_scheduling',
    order: 6,
    title: 'Agenda Soberana & Pipeline de Citas',
    subtitle: 'Agendamiento Autónomo con Hermes, Hold Atómico & Lead Nurturing',
    category: 'GROWTH',
    badgeColor: 'amber',
    iconName: 'Calendar',
    targetUrl: '/nexus/settings',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MARKETING', 'OPERATOR'],
    hermesGreeting: 'El motor de citas autónomas y conversión de alta fidelidad.',
    hermesNarrative:
      'La Agenda Soberana permite a prospectos e inversores reservar llamadas de 15, 30 o 60 minutos con tu equipo. Hermes propone y confirma slots en tiempo real por WhatsApp y Telegram, o los usuarios pueden agendar directamente desde tu link soberano público. Cada cita confirmada crea un lead en el CRM (+50 score), genera un hold atómico anti-colisiones, envía invitaciones de Google Meet con archivos .ics y activa recordatorios automáticos T-24h y T-1h.',
    keyHighlights: [
      'Agendamiento conversacional autónomo por Hermes en WhatsApp y Telegram.',
      'Hold atómico de 10 minutos para prevenir dobles reservas concurrentes.',
      'Sincronización transaccional con CRM, Growth Engine y alertas por Telegram.',
      'Invitaciones con Google Meet, archivo de calendario .ics y recordatorios automáticos por email y mensajería.',
    ],
    faqs: [
      {
        question: '¿Cómo configuro mis horarios disponibles?',
        answer: 'Haz clic en el botón "Agenda Soberana" en Nexus Settings, Deal Room o Marketing Dashboard para definir tus días hábiles, buffers entre llamadas y link de Google Meet.',
      },
      {
        question: '¿Cómo funciona la integración con Hermes en WhatsApp?',
        answer: 'Cuando un prospecto escribe solicitando una reunión, Hermes consulta tus slots libres en tiempo real, le propone opciones y concreta la cita sin intervención humana.',
      },
      {
        question: '¿Puedo tener un enlace público para compartir?',
        answer: 'Sí. Tu enlace soberano es https://dash.pandoras.finance/p/scheduling/[slug]. Puedes compartirlo en firmas de correo, redes sociales o portales.',
      },
    ],
  },
];

/**
 * Filters ecosystem stations according to the given user role.
 */
export function getStationsForRole(role: EcosystemTourRole = 'VIEWER'): EcosystemStation[] {
  return ECOSYSTEM_STATIONS.filter((station) => station.allowedRoles.includes(role));
}

/**
 * Generates an actionable deep link for the ecosystem onboarding.
 */
export function generateTourShareLink(
  role: EcosystemTourRole = 'VIEWER',
  baseUrl: string = 'https://dash.pandoras.finance'
): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/nexus?tour=ecosystem&role=${role.toLowerCase()}`;
}

/**
 * Generates a ready-to-send WhatsApp invite message formatted for onboarding team members.
 * @param role - The role being onboarded
 * @param tourLink - Optional pre-generated deep link; auto-generated from role if omitted
 */
export function generateWhatsAppShareText(
  role: EcosystemTourRole,
  tourLink?: string
): string {
  const link = tourLink ?? generateTourShareLink(role);
  const stationList = getStationsForRole(role)
    .map((s) => `\u2022 ${s.title}`)
    .join('\n');
  return `\uD83D\uDC4B Bienvenido a *Pandoras Growth OS* \u2014 Rol: *${role}*.\n\nTu onboarding incluye:\n${stationList}\n\nInicia aqu\u00ed:\n${link}\n\nAcceso sin contrase\u00f1as (Sovereign Auth).\n\n\u2014 _El equipo de Protocolo_`;
}

/**
 * Helper to fetch a canned response from Hermes based on user input during onboarding.
 * Uses keyword overlap matching for natural language FAQ lookup.
 */
export function getHermesAnswerForStation(
  station: EcosystemStation,
  query: string
): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('hola') || lowerQuery.includes('saludos')) {
    return 'Saludos. Soy Hermes, tu IA residente. Pregúntame sobre esta sección de la plataforma.';
  }

  const STOPWORDS = new Set(['?', 'qué', 'que', 'cómo', 'como', 'por', 'se', 'la', 'los', 'las', 'de', 'el', 'en', 'un', 'una', 'es', 'y', 'a', 'no', 'si']);
  const queryWords = lowerQuery.split(/\s+/).filter((w) => !STOPWORDS.has(w) && w.length > 2);

  if (station && station.faqs && queryWords.length > 0) {
    let bestMatch = null;
    let bestScore = 0;
    for (const faq of station.faqs) {
      const faqWords = faq.question.toLowerCase().split(/\s+/).filter((w) => !STOPWORDS.has(w) && w.length > 2);
      const overlap = queryWords.filter((qw) => faqWords.some((fw) => fw.includes(qw) || qw.includes(fw))).length;
      if (overlap > bestScore) { bestScore = overlap; bestMatch = faq; }
    }
    if (bestMatch && bestScore >= 1) return bestMatch.answer;
  }

  return 'Esa es una pregunta excelente. Mi base de conocimientos está optimizándose constantemente. Para detalles profundos, puedes consultar la sección "Academy & Graph" o los canales de soporte en Discord.';
}
