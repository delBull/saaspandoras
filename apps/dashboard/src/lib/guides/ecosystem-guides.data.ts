/**
 * 🧭 ECOSYSTEM GUIDES DATA (SOURCE OF TRUTH)
 * apps/dashboard/src/lib/guides/ecosystem-guides.data.ts
 *
 * Canonical definition of Pandora's Ecosystem Reconnaissance Stations,
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
  category: 'LEGAL' | 'COMMERCIAL' | 'FINANCE' | 'PORTAL' | 'GOVERNANCE' | 'ACADEMY';
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
    id: 'nexus_identity',
    order: 1,
    title: 'Identidad Soberana & Seguridad (Nexus Core)',
    subtitle: 'Wallet Connection, Roles RBAC y API Keys',
    category: 'GOVERNANCE',
    badgeColor: 'blue',
    iconName: 'ShieldCheck',
    targetUrl: '/nexus',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MARKETING', 'VIEWER'],
    hermesGreeting: 'El fundamento de nuestra seguridad: tu identidad criptográfica.',
    hermesNarrative:
      'En Pandoras no utilizamos contraseñas vulnerables. Tu acceso y nivel de permisos (RBAC) están anclados a tu Wallet Web3 o credencial institucional. Desde el Nexus Core gestionas tus llaves de API, monitoreas tus sesiones activas y aseguras que cada acción administrativa quede firmada criptográficamente en nuestra bóveda.',
    keyHighlights: [
      'Autenticación Web3 sin contraseñas (Passwordless Web3 Auth).',
      'Matriz de control de acceso basado en roles (RBAC).',
      'Generación y rotación segura de API Keys para integraciones.',
    ],
    faqs: [
      {
        question: '¿Qué pasa si pierdo acceso a mi Wallet?',
        answer: 'Un Super Admin puede iniciar un protocolo de recuperación social para reasignar tu perfil a una nueva dirección pública sin perder tu historial.',
      },
      {
        question: '¿Para qué sirven las API Keys?',
        answer: 'Para conectar sistemas externos (como tu propio CRM o bots) a la infraestructura de Pandoras de manera programática y segura.',
      },
    ],
  },
  {
    id: 'deal_rooms',
    order: 2,
    title: 'Deal Rooms & Legal Institucional',
    subtitle: 'Contratos Notarizados, NDAs y Sovereign e-Sign',
    category: 'LEGAL',
    badgeColor: 'amber',
    iconName: 'Handshake',
    targetUrl: '/nexus/rooms',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MARKETING'],
    hermesGreeting: 'Saludos. Te encuentras en la antesala de acuerdos de alta fidelidad.',
    hermesNarrative:
      'Las Deal Rooms son el espacio seguro donde estructuramos, revisamos y notarizamos acuerdos institucionales, cartas de intención (LOIs), NDAs y acuerdos de inversión. Cada documento firmado aquí genera un hash SHA-256 inmutable vinculado a la bóveda Sovereign K25, brindando trazabilidad legal y forense sin depender de intermediarios de firma tradicionales.',
    keyHighlights: [
      'Redacción y custodia de contratos bilaterales notarizados con validez jurídica.',
      'Sovereign e-Sign con sellado criptográfico y hash auditado en IPFS.',
      'Panel de seguimiento de contrapartes y estados de firma en tiempo real.',
    ],
    faqs: [
      {
        question: '¿Cómo se garantiza la validez legal de los acuerdos firmados?',
        answer:
          'Cada acuerdo genera un digest SHA-256 con timestamp atómico, direcciones de wallet y registro de auditoría en la bóveda Sovereign K25. Esto proporciona una prueba inmutable admitida bajo estándares probatorios digitales.',
      },
      {
        question: '¿Quién puede invitar a contrapartes externas a una sala?',
        answer:
          'Solo roles con permisos de Deal Room (Super Admin, Admin y Managers autorizados) pueden generar invitaciones seguras con token de acceso transaccional.',
      },
      {
        question: '¿Qué diferencia hay entre un NDA y un contrato maestro?',
        answer:
          'Los NDAs utilizan plantillas estandarizadas de revelación confidencial rápida; los contratos maestros activan cláusulas paramétricas y cuentas de custodia condicional (escrow).',
      },
    ],
  },
  {
    id: 'growth_os_crm',
    order: 3,
    title: 'Growth OS CRM & Pipeline Comercial',
    subtitle: 'Captación, Nutrición y Conversión Omnicanal',
    category: 'COMMERCIAL',
    badgeColor: 'emerald',
    iconName: 'Briefcase',
    targetUrl: '/growth-os',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MARKETING', 'VIEWER'],
    hermesGreeting: 'Bienvenido al motor de tracción comercial omnicanal.',
    hermesNarrative:
      'Growth OS centraliza el pipeline comercial y de atracción de inversores de todo el ecosistema. Conecta canales inbound como WhatsApp Business (vía Meta Cloud API), SignalWire, formularios web y landing pages. Yo, Hermes, analizo las conversaciones en tiempo real, califico los prospectos según su perfil de interés y sincronizo los estados directamente con el tablero comercial.',
    keyHighlights: [
      'Pipeline de oportunidades en tiempo real con etapas parametrizables.',
      'Integración nativa con WhatsApp Meta API y telefonía SignalWire.',
      'Scoring automático de prospectos y alertas instantáneas al equipo comercial.',
    ],
    faqs: [
      {
        question: '¿Cómo califica Hermes el interés de un lead?',
        answer:
          'Analizo la intención conversacional, solvencia declarada, mención de tickets de inversión y recurrencia de interacción para asignar un score predictivo de conversión.',
      },
      {
        question: '¿Puede un colaborador tomar control manual de un chat?',
        answer:
          'Absolutamente. Cualquier conversación iniciada por Hermes puede pausarse o transferirse a un operador humano sin perder el contexto histórico.',
      },
      {
        question: '¿Cómo se registran nuevos prospectos desde eventos o llamadas?',
        answer:
          'Se pueden dar de alta manualmente en el tablero CRM o enviar un webhook desde landing pages o bots de Telegram vinculados.',
      },
    ],
  },
  {
    id: 'rwa_capital',
    order: 4,
    title: 'Capital & Tokenomics RWA',
    subtitle: 'Fases de Emisión, Tesorería Safe y Smart Contracts',
    category: 'FINANCE',
    badgeColor: 'violet',
    iconName: 'ShieldCheck',
    targetUrl: '/profile/projects',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MARKETING'],
    hermesGreeting: 'Aquí reside la arquitectura de liquidez y tokenización de activos.',
    hermesNarrative:
      'En esta sección se configuran las rondas de capital, precios por token fraccionado, cuotas mínimas y contratos inteligentes de emisión para proyectos de activos reales (RWA) como S’Narai. Cuando un inversor adquiere participaciones fiduciarias o crypto, aquí se audita y aprueba la operación, emitiendo certificados y distribuyendo el voting power de la DAO.',
    keyHighlights: [
      'Configuración de fases de emisión: Semilla, Venta Privada y Oferta Pública.',
      'Módulo de aprobación de compras con sincronización de voting power.',
      'Vinculación con tesorerías multifirma Safe y distribución de utilidades en USDC.',
    ],
    faqs: [
      {
        question: '¿Cómo se aprueba una compra que entra por transferencia fiat?',
        answer:
          'Un administrador verifica el comprobante bancario en el módulo de compras y ejecuta la aprobación. El sistema genera el hash del acuerdo y acredita los tokens al inversor.',
      },
      {
        question: '¿Qué es el voting power y cuándo se asigna?',
        answer:
          'El voting power representa la ponderación de voto en la gobernanza comunitaria. Se calcula de forma proporcional a los tokens adquiridos y liquidados en la tabla dao_members.',
      },
      {
        question: '¿Dónde se custodian los fondos recaudados?',
        answer:
          'En las wallets de tesorería Safe multi-firma configuradas por el proyecto, con políticas de autorización colegiada.',
      },
    ],
  },
  {
    id: 'investor_portals',
    order: 5,
    title: 'Portales de Inversores & Whitelabel',
    subtitle: 'Experiencia Web3 de Clientes y Miembros DAO',
    category: 'PORTAL',
    badgeColor: 'blue',
    iconName: 'Globe',
    targetUrl: '/portal/showcase',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MARKETING', 'VIEWER'],
    hermesGreeting: 'Esta es la experiencia soberana que viven nuestros inversores.',
    hermesNarrative:
      'El portal público whitelabel (ejemplificado en S’Narai Portal) es la ventana donde los inversores conectan su billetera Web3 para visualizar su portafolio de tokens, certificados de propiedad notariada, historial de rendimientos mensuales en USDC y propuestas de gobernanza en las que pueden emitir su voto con firma criptográfica.',
    keyHighlights: [
      'Dashboard Web3 personalizado para tenedores de tokens y socios.',
      'Liquidación y reclamo transparente de rendimientos pro-rata.',
      'Votación descentralizada de propuestas de gobernanza de la comunidad.',
    ],
    faqs: [
      {
        question: '¿Requiere el inversor pagar gas para votar en propuestas?',
        answer:
          'No necesariamente. Las propuestas admiten firmas off-chain notarizadas o transacciones patrocinadas según las reglas de cada proyecto.',
      },
      {
        question: '¿Cómo accede un inversor que compró por transferencia bancaria?',
        answer:
          'Al momento de la compra se asocia su wallet o correo. Al conectar su wallet compatible en el portal, sus participaciones y certificados se cargan automáticamente.',
      },
      {
        question: '¿Es posible crear un portal para un nuevo proyecto de inmediato?',
        answer:
          'Sí. El motor de portales es completamente multitenant y se aprovisiona desde la creación del proyecto.',
      },
    ],
  },
  {
    id: 'platform_governance',
    order: 6,
    title: 'Platform Governance & Infraestructura HQ',
    subtitle: 'GPU Compute, Auditoría Hash-Chain y Fleet',
    category: 'GOVERNANCE',
    badgeColor: 'purple',
    iconName: 'Cpu',
    targetUrl: '/admin',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    hermesGreeting: 'Control maestro de la infraestructura y soberanía operativa.',
    hermesNarrative:
      'Esta es la cabina de gobierno global de Pandora’s OS. Supervisamos la flota de servidores RunPod con aceleración GPU, el consumo de tokens y segundos de inferencia de Hermes, las cuentas de créditos de cada tenant, los márgenes retenidos de cómputo y la bitácora criptográfica hash-chain que audita cada acción administrativa crítica.',
    keyHighlights: [
      'Monitoreo en tiempo real de GPU seconds, inferencias de LLM y endpoints RunPod.',
      'Control de balances de créditos, markups y liquidaciones por tenant.',
      'Auditoría inmutable hash-chain con verificación de integridad de bloques.',
    ],
    faqs: [
      {
        question: '¿Cómo se computa el costo y margen de las consultas de Hermes?',
        answer:
          'Registramos cada inferencia con su latencia y tokens exactos, aplicando el markup pactado sobre el costo bruto de GPU y deduciendo del balance de créditos del tenant.',
      },
      {
        question: '¿Qué sucede si un tenant agota sus créditos?',
        answer:
          'El sistema suspende temporalmente las inferencias externas o degrada a modo sandbox según la política asignada, alertando al administrador del tenant.',
      },
      {
        question: '¿Por qué la bitácora de auditoría utiliza una hash-chain?',
        answer:
          'Para que ningún registro pueda ser alterado ni borrado a posteriori. Cada entrada enlaza el hash del bloque previo, garantizando trazabilidad ante auditorías forenses.',
      },
    ],
  },
  {
    id: 'academy_vault',
    order: 7,
    title: 'Academy & Bóveda Constitucional',
    subtitle: 'Formación de Liderazgo, Blueprints y Libros I-IX',
    category: 'ACADEMY',
    badgeColor: 'rose',
    iconName: 'GraduationCap',
    targetUrl: '/admin/academy',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MARKETING'],
    hermesGreeting: 'El bastión de conocimiento, principios rectores y certificación.',
    hermesNarrative:
      'La Academia y la Bóveda Constitucional son los cimientos culturales y doctrinales de Pandora’s. Aquí se evalúa y certifica a los directores y operadores del ecosistema (tracks COO y CFO), al tiempo que se preserva la Constitución y los Libros I al IX del protocolo, protegidos por políticas estrictas de control de acceso.',
    keyHighlights: [
      'Currículum de certificación operativa para directores y operadores de protocolo.',
      'Emisión de blueprints académicos verificables en la cadena.',
      'Custodia de los 9 Libros Fundacionales de la Bóveda Constitucional.',
    ],
    faqs: [
      {
        question: '¿Qué evalúa la Academia en los candidatos a operadores?',
        answer:
          'Dominio de gobernanza RWA, gestión de riesgos legales, operación de Deal Rooms y auditoría financiera de tesorerías Safe.',
      },
      {
        question: '¿Quién puede consultar los Libros Constitucionales completos?',
        answer:
          'Los Libros I al IX están restringidos al Super Admin y roles con autorización explícita protegida con doble capa de autenticación.',
      },
      {
        question: '¿Qué es un Blueprint de Certificación?',
        answer:
          'Un documento digital emitido al finalizar los módulos que acredita la capacidad del operador para gobernar un tenant de forma soberana.',
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
 * Generates an actionable deep link for the ecosystem tour.
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
 */
export function generateWhatsAppShareText(
  role: EcosystemTourRole = 'VIEWER',
  tourLink?: string
): string {
  const link = tourLink || generateTourShareLink(role);
  const stations = getStationsForRole(role);
  const stationsList = stations.map((s, idx) => `  ${idx + 1}. *${s.title}*`).join('\n');

  return (
    `🏛️ *Bienvenido al Ecosistema Pandora's Protocol*\n\n` +
    `Te hemos habilitado una *Guía de Reconocimiento Interactiva* guiada por *Hermes AI* para que conozcas las verticales, portales y herramientas operativas correspondientes a tu rol (*${role}*).\n\n` +
    `🧭 *Estaciones incluidas en tu recorrido:*\n` +
    `${stationsList}\n\n` +
    `🔗 *Inicia tu recorrido interactivo aquí:*\n${link}\n\n` +
    `_Nota: Inicia sesión con tu wallet o credencial institucional para acceder a cada estación._`
  );
}

/**
 * Provides an immediate conversational answer from Hermes for any query on a specific station.
 */
export function getHermesAnswerForStation(station: EcosystemStation, query: string): string {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return station.hermesNarrative;
  }

  // Look for direct match in FAQs
  const foundFaq = station.faqs.find(
    (f) =>
      f.question.toLowerCase().includes(trimmed) ||
      trimmed.includes(f.question.toLowerCase().slice(0, 15))
  );

  if (foundFaq) {
    return foundFaq.answer;
  }

  // Keyword-based intelligence matching
  if (trimmed.includes('seguridad') || trimmed.includes('legal') || trimmed.includes('validez')) {
    return `En cuanto a seguridad y validez en '${station.title}': Toda la operación se respalda con sellado criptográfico SHA-256 e IPFS, garantizando inmutabilidad y cumplimiento estricto de gobernanza.`;
  }

  if (trimmed.includes('acceso') || trimmed.includes('permiso') || trimmed.includes('rol')) {
    return `El acceso a '${station.title}' está restringido a los roles: ${station.allowedRoles.join(
      ', '
    )}. Cada acción queda auditada en la bitácora institucional.`;
  }

  if (trimmed.includes('cómo') || trimmed.includes('empezar') || trimmed.includes('usar')) {
    return `Para comenzar en '${station.title}', puedes pulsar en 'Explorar esta estación ahora' para abrir la interfaz en vivo. ${station.keyHighlights[0]}`;
  }

  return `Excelente pregunta sobre ${station.title}. Como Hermes AI, te confirmo que esta estación está diseñada para garantizar: ${station.keyHighlights.join(
    '; '
  )}. Puedes explorarla pulsando el botón de enlace directo o consultar con el equipo de soporte institucional.`;
}
