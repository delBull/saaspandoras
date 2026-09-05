/**
 * 🧭 TENANT VERTICAL GUIDES DATA (SOURCE OF TRUTH)
 * apps/dashboard/src/lib/guides/tenant-vertical-guides.data.ts
 *
 * Canonical definition of client onboarding stations tailored by industry vertical:
 * 1. RWA_REAL_ESTATE: Inversión fraccionada inmobiliaria, legal K25, tokenomics y tesorería Safe.
 * 2. SAAS_GROWTH: Plataformas B2B, inbound omnicanal (WhatsApp Meta API), prompts Hermes y GPU.
 * 3. CREATOR_COMMUNITY: Membresías tokenizadas, beneficios de comunidad y gobernanza.
 */

import { EcosystemStation } from './ecosystem-guides.data';

export type TenantVertical = 'RWA_REAL_ESTATE' | 'SAAS_GROWTH' | 'CREATOR_COMMUNITY';

export interface TenantVerticalConfig {
  id: TenantVertical;
  name: string;
  badge: string;
  iconName: string;
  description: string;
  accentColor: string;
}

export const TENANT_VERTICALS_CONFIG: TenantVerticalConfig[] = [
  {
    id: 'RWA_REAL_ESTATE',
    name: 'Real Estate & Inversión Fraccionada (RWA)',
    badge: 'RWA & Tokenización',
    iconName: 'Landmark',
    description: 'Estructuración de proyectos inmobiliarios, legal K25 en IPFS, rondas de financiamiento y portal de inversores.',
    accentColor: 'amber',
  },
  {
    id: 'SAAS_GROWTH',
    name: 'SaaS B2B & Growth OS',
    badge: 'SaaS & Omnicanal',
    iconName: 'Zap',
    description: 'Captación de prospectos con WhatsApp Meta Cloud API, orquestación de Hermes AI y cómputo GPU.',
    accentColor: 'emerald',
  },
  {
    id: 'CREATOR_COMMUNITY',
    name: 'Creadores & Comunidades Web3',
    badge: 'Comunidad & DAO',
    iconName: 'Users',
    description: 'Monetización de audiencias, membresías tokenizadas, votaciones comunitarias y beneficios de holders.',
    accentColor: 'indigo',
  },
];

/**
 * Returns the onboarding reconnaissance stations for a specific tenant vertical,
 * with URLs dynamically resolved to the tenant's slug.
 */
export function getStationsForTenantVertical(
  vertical: TenantVertical = 'RWA_REAL_ESTATE',
  organizationSlug: string = 'snarai'
): EcosystemStation[] {
  const cleanSlug = encodeURIComponent(organizationSlug.trim().toLowerCase());

  switch (vertical) {
    case 'RWA_REAL_ESTATE':
      return [
        {
          id: 'rwa_project_overview',
          order: 1,
          title: 'Ficha del Proyecto & Fideicomiso',
          subtitle: 'Metadata del Activo, Ubicación y Registro Institucional',
          category: 'FINANCE',
          badgeColor: 'amber',
          iconName: 'Briefcase',
          targetUrl: `/profile/projects/${cleanSlug}/manage`,
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
          hermesGreeting: 'Bienvenido a la tokenización de activos de alta plusvalía.',
          hermesNarrative:
            'En este primer paso establecemos la ficha técnica del activo inmobiliario: ubicación geográfica, valuación comercial, documentación de propiedad y datos del fideicomiso emisor. Esta información se ancla en los metadatos públicos del proyecto.',
          keyHighlights: [
            'Carga de nombre, descripción y valuación comercial del inmueble.',
            'Configuración de tickets mínimos de inversión fiduciaria y crypto.',
            'Definición de entidades legales custodias y garantes.',
          ],
          faqs: [
            {
              question: '¿Qué documentos se necesitan para dar de alta el activo?',
              answer: 'Escritura pública o contrato de fideicomiso, avalúo comercial certificado y dictamen de no gravamen.',
            },
            {
              question: '¿Puedo actualizar la valuación después del lanzamiento?',
              answer: 'Sí, mediante una actualización de avalúo que emite un nuevo registro notariado en la cadena.',
            },
          ],
        },
        {
          id: 'rwa_legal_vault',
          order: 2,
          title: 'Bóveda Legal Soberana (K25)',
          subtitle: 'Escrituras, Contratos de Adhesión y Hash SHA-256 en IPFS',
          category: 'LEGAL',
          badgeColor: 'violet',
          iconName: 'ShieldCheck',
          targetUrl: `/portal/${cleanSlug}/knowledge`,
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
          hermesGreeting: 'La seguridad legal de tus inversores es innegociable.',
          hermesNarrative:
            'Cada contrato de compra, reglamento de copropiedad y dictamen jurídico se custodia en la Bóveda Sovereign K25. El sistema genera un hash SHA-256 inmutable indexado en IPFS, garantizando que nadie pueda alterar los términos pactados.',
          keyHighlights: [
            'Custodia descentralizada de documentos maestros en IPFS.',
            'Sellado de tiempo atómico y verificación forense.',
            'Acceso protegido para auditorías legales y due diligence.',
          ],
          faqs: [
            {
              question: '¿Los inversores pueden descargar estos contratos?',
              answer: 'Sí, desde su portal privado una vez que su compra es acreditada y firmada.',
            },
            {
              question: '¿Qué pasa si se requiere una adenda al contrato?',
              answer: 'Se genera una versión sucesora en la bóveda con trazabilidad histórica completa.',
            },
          ],
        },
        {
          id: 'rwa_tokenomics_phases',
          order: 3,
          title: 'Fases de Venta & Tokenomics',
          subtitle: 'Rondas Semilla, Preventa Privada y Precio por Fracción',
          category: 'FINANCE',
          badgeColor: 'amber',
          iconName: 'Handshake',
          targetUrl: `/profile/projects/${cleanSlug}/manage`,
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
          hermesGreeting: 'Diseñemos las fases de capitalización de tu desarrollo.',
          hermesNarrative:
            'Aquí programas tus rondas de financiamiento: Fase Friends & Family, Preventa Exclusiva y Oferta Pública. Puedes definir precios dinámicos por metro cuadrado fraccionado, límites máximos de adquisición y periodos de bloqueo (lockups).',
          keyHighlights: [
            'Parametrización de fases con fechas de inicio y cierre automático.',
            'Asignación de cuotas de tokens por fase con precios escalonados.',
            'Cálculo pro-rata de participaciones para reparto de dividendos.',
          ],
          faqs: [
            {
              question: '¿Cómo se controla que no se sobrevendan unidades?',
              answer: 'El contrato inteligente bloquea nuevas suscripciones tan pronto como se alcanza el cupo de la fase.',
            },
            {
              question: '¿Se admiten compras en moneda local (fiat)?',
              answer: 'Sí, con conciliación bancaria manual o vía pasarelas fiduciarias integradas.',
            },
          ],
        },
        {
          id: 'rwa_safe_treasury',
          order: 4,
          title: 'Tesorería Multisig Safe & Rendimientos',
          subtitle: 'Custodia Colegiada y Liquidación de Rentas en USDC',
          category: 'GOVERNANCE',
          badgeColor: 'purple',
          iconName: 'Cpu',
          targetUrl: `/portal/${cleanSlug}`,
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
          hermesGreeting: 'Transparencia bancaria y descentralizada de los fondos.',
          hermesNarrative:
            'Los fondos recaudados y las rentas generadas se resguardan en contratos Safe multifirma. Cuando el desarrollo genera rendimientos por arrendamiento, el administrador distribuye los dividendos en USDC pro-rata con un solo clic.',
          keyHighlights: [
            'Billeteras de tesorería Safe con control multi-firmante.',
            'Distribución algorítmica de rentas mensuales a cada poseedor de token.',
            'Trazabilidad pública de cada movimiento de capital.',
          ],
          faqs: [
            {
              question: '¿Quién tiene las firmas de la tesorería?',
              answer: 'Los directores designados del fideicomiso o comité técnico del proyecto.',
            },
            {
              question: '¿Cómo cobran los inversores sus rendimientos?',
              answer: 'Conectando su billetera en el portal y haciendo clic en "Reclamar Dividendos USDC".',
            },
          ],
        },
        {
          id: 'rwa_investor_portal',
          order: 5,
          title: 'Portal de Inversores & Experiencia Whitelabel',
          subtitle: 'La Ventana Soberana para tus Socios y Compradores',
          category: 'PORTAL',
          badgeColor: 'blue',
          iconName: 'Globe',
          targetUrl: `/portal/${cleanSlug}`,
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
          hermesGreeting: 'Tu desarrollo con presencia institucional y portal propio.',
          hermesNarrative:
            'Tus inversores acceden a un portal con tu identidad visual donde pueden consultar sus metros cuadrados tokenizados, certificados notarizados, bitácora de avances de obra y participar en votaciones comunitarias.',
          keyHighlights: [
            'Portal personalizado con logotipo, colores y dominio del proyecto.',
            'Certificados de participación verificables y descargables.',
            'Módulo de propuestas de gobernanza para decisiones de comunidad.',
          ],
          faqs: [
            {
              question: '¿El portal funciona en teléfonos móviles?',
              answer: 'Totalmente optimizado para móviles y navegadores Web3 como Metamask o Coinbase Wallet.',
            },
            {
              question: '¿Puedo usar mi propio dominio web (ej. portal.midominio.com)?',
              answer: 'Sí, el motor de portales admite dominios personalizados vía CNAME.',
            },
          ],
        },
      ];

    case 'SAAS_GROWTH':
      return [
        {
          id: 'saas_organization_brand',
          order: 1,
          title: 'Organización, Dominio & Marca',
          subtitle: 'Configuración Institucional de tu Tenant B2B',
          category: 'COMMERCIAL',
          badgeColor: 'emerald',
          iconName: 'Briefcase',
          targetUrl: `/growth-os/organizations/${cleanSlug}`,
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
          hermesGreeting: 'Configura la identidad operativa de tu organización.',
          hermesNarrative:
            'Establece el nombre corporativo, logotipos, dominios autorizados y zonas horarias de tu empresa. Esto garantiza que todos los correos, mensajes de WhatsApp y enlaces compartidos mantengan tu marca impecable.',
          keyHighlights: [
            'Personalización de marca blanca corporativa.',
            'Control de acceso de colaboradores y asignación de permisos.',
            'Configuración de webhook URLs para eventos de negocio.',
          ],
          faqs: [
            {
              question: '¿Cuántos colaboradores puedo invitar?',
              answer: 'Dependiendo de tu plan, puedes invitar operadores ilimitados con roles diferenciados.',
            },
          ],
        },
        {
          id: 'saas_inbound_channels',
          order: 2,
          title: 'Canales Inbound (WhatsApp Meta API)',
          subtitle: 'Conexión Directa con WhatsApp Business Cloud API & Telefonía',
          category: 'COMMERCIAL',
          badgeColor: 'emerald',
          iconName: 'Handshake',
          targetUrl: `/growth-os/organizations/${cleanSlug}`,
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
          hermesGreeting: 'Conectemos tus canales de captación más calientes.',
          hermesNarrative:
            'Conecta tu número oficial de WhatsApp Business mediante la Meta Cloud API. Cada mensaje entrante es recibido instantáneamente, calificado por Hermes y canalizado al pipeline comercial sin pérdida de prospectos.',
          keyHighlights: [
            'Recepción de webhooks con verificación HMAC-SHA256.',
            'Cola de despacho transaccional con lease atómico.',
            'Enmascaramiento de datos personales (PII) en registros de auditoría.',
          ],
          faqs: [
            {
              question: '¿Puedo conectar más de un número de WhatsApp?',
              answer: 'Sí, puedes enrutar diferentes números a pipelines específicos.',
            },
          ],
        },
        {
          id: 'saas_hermes_prompts',
          order: 3,
          title: 'Hermes AI OS & Prompt Studio',
          subtitle: 'Entrenamiento del Agente de Ventas y Atención 24/7',
          category: 'GOVERNANCE',
          badgeColor: 'violet',
          iconName: 'Bot',
          targetUrl: `/portal/${cleanSlug}`,
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
          hermesGreeting: 'Yo seré tu copiloto comercial y operativo de alta velocidad.',
          hermesNarrative:
            'Personaliza el tono, las reglas de calificación y las respuestas frecuentes de Hermes. Puedo agendar llamadas, responder objeciones de precio y notificar a tus ejecutivos de cuenta en el momento óptimo.',
          keyHighlights: [
            'Prompt Studio con simulación y evaluación en vivo.',
            'Políticas de guardrails deterministas para prevenir alucinaciones.',
            'Traspaso fluido a agentes humanos cuando el cliente lo solicite.',
          ],
          faqs: [
            {
              question: '¿Cómo evita Hermes dar información incorrecta?',
              answer: 'Respondo estrictamente basado en los documentos cargados en tu bóveda de conocimiento K25.',
            },
          ],
        },
        {
          id: 'saas_gpu_credits',
          order: 4,
          title: 'Créditos GPU & Fleet RunPod',
          subtitle: 'Contabilidad de Tokens y Aceleración de Cómputo',
          category: 'GOVERNANCE',
          badgeColor: 'purple',
          iconName: 'Cpu',
          targetUrl: `/portal/${cleanSlug}`,
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
          hermesGreeting: 'Supervisa el rendimiento y consumo de inferencia.',
          hermesNarrative:
            'Monitorea el saldo de créditos de cómputo, la latencia de respuesta en milisegundos y el costo por inferencia de tus agentes. Todo respaldado por nuestra flota de GPU dedicada.',
          keyHighlights: [
            'Recarga transparente de créditos en USD o crypto.',
            'Desglose analítico de tokens de entrada y salida por conversación.',
            'Modo sandbox para pruebas ilimitadas de desarrollo.',
          ],
          faqs: [
            {
              question: '¿Qué sucede si mis créditos bajan del 10%?',
              answer: 'El sistema emite una alerta preventiva por WhatsApp y correo electrónico.',
            },
          ],
        },
      ];

    case 'CREATOR_COMMUNITY':
      return [
        {
          id: 'creator_community_profile',
          order: 1,
          title: 'Perfil de Comunidad & Audiencia',
          subtitle: 'Branding, Misión y Reglas de Convivencia',
          category: 'PORTAL',
          badgeColor: 'indigo',
          iconName: 'Globe',
          targetUrl: `/portal/${cleanSlug}`,
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
          hermesGreeting: 'Crea un espacio exclusivo y soberano para tu comunidad.',
          hermesNarrative:
            'Personaliza la puerta de bienvenida para tus miembros más leales: bio de comunidad, enlaces a transmisiones exclusivas y manifiesto de valores.',
          keyHighlights: [
            'Landing de comunidad optimizada para conversión.',
            'Muro de anuncios oficiales y eventos en vivo.',
            'Directorio público de miembros con insignias de fidelidad.',
          ],
          faqs: [
            {
              question: '¿Puedo restringir el contenido solo a miembros verificados?',
              answer: 'Sí, mediante token-gating que comprueba la tenencia de tokens o membresía activa.',
            },
          ],
        },
        {
          id: 'creator_token_memberships',
          order: 2,
          title: 'Membresías & Pases de Acceso',
          subtitle: 'Tiers de Suscripción, NFTs y Beneficios Exclusivos',
          category: 'FINANCE',
          badgeColor: 'violet',
          iconName: 'ShieldCheck',
          targetUrl: `/profile/projects/${cleanSlug}/manage`,
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
          hermesGreeting: 'Estructura tus niveles de membresía con recompensas reales.',
          hermesNarrative:
            'Diseña pases de acceso con ventajas escalonadas: acceso a chats VIP, llamadas privadas 1 a 1, descargas de material exclusivo y descuentos.',
          keyHighlights: [
            'Niveles Bronce, Plata y Oro con ventajas diferenciadas.',
            'Emisión de pases coleccionables verificables on-chain.',
            'Renovación automática y gestión de bajas sin fricción.',
          ],
          faqs: [
            {
              question: '¿Los miembros pueden pagar con tarjeta de crédito?',
              answer: 'Sí, la pasarela admite tanto tarjeta como billeteras crypto habituales.',
            },
          ],
        },
        {
          id: 'creator_dao_governance',
          order: 3,
          title: 'Gobernanza & Votaciones de Miembros',
          subtitle: 'Encuestas Comunitarias y Decisiones Colectivas',
          category: 'GOVERNANCE',
          badgeColor: 'amber',
          iconName: 'Handshake',
          targetUrl: `/portal/${cleanSlug}`,
          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
          hermesGreeting: 'Involucra a tu comunidad en las decisiones estratégicas.',
          hermesNarrative:
            'Publica propuestas y votaciones donde tus seguidores utilicen su voting power para elegir temas de próximos lanzamientos, dinámicas benéficas o uso de fondos comunitarios.',
          keyHighlights: [
            'Votaciones sin costo de gas mediante firmas off-chain.',
            'Visualización de quorum y resultados en tiempo real.',
            'Registro histórico inmutable de decisiones comunitarias.',
          ],
          faqs: [
            {
              question: '¿Cómo se asigna el poder de voto?',
              answer: 'En proporción al nivel de membresía o tiempo de permanencia en la comunidad.',
            },
          ],
        },
      ];
  }
}

/**
 * Generates an actionable deep link for a tenant vertical onboarding tour.
 */
export function generateTenantTourShareLink(
  vertical: TenantVertical = 'RWA_REAL_ESTATE',
  organizationSlug: string = 'snarai',
  baseUrl: string = 'https://dash.pandoras.finance'
): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanSlug = encodeURIComponent(organizationSlug.trim().toLowerCase());
  return `${cleanBase}/ecosystem/${cleanSlug}?tour=setup&vertical=${vertical.toLowerCase()}`;
}

/**
 * Generates a ready-to-send WhatsApp invite message for onboarding a tenant client.
 */
export function generateTenantWhatsAppShareText(
  vertical: TenantVertical = 'RWA_REAL_ESTATE',
  organizationSlug: string = 'snarai',
  tourLink?: string
): string {
  const link = tourLink || generateTenantTourShareLink(vertical, organizationSlug);
  const stations = getStationsForTenantVertical(vertical, organizationSlug);
  const stationsList = stations.map((s, idx) => `  ${idx + 1}. *${s.title}*`).join('\n');
  const verticalConfig = TENANT_VERTICALS_CONFIG.find((v) => v.id === vertical);

  return (
    `🏛️ *Bienvenido a tu Ecosistema Pandora's (${organizationSlug.toUpperCase()})*\n\n` +
    `Te hemos habilitado la *Guía de Configuración e Inducción* asistida por *Hermes AI* especialmente adaptada para tu vertical (*${
      verticalConfig?.name || vertical
    }*).\n\n` +
    `🧭 *Pasos guiados de configuración:*\n` +
    `${stationsList}\n\n` +
    `🔗 *Inicia la inducción asistida con Hermes aquí:*\n${link}\n\n` +
    `_Nota: Sigue cada paso a tu propio ritmo. Hermes resolverá cualquier duda técnica o legal en vivo._`
  );
}
