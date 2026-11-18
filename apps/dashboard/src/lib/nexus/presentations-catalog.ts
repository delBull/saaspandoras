/**
 * 🏛️ ARCHITECTURE NOTE: Catálogo canónico de presentaciones soberanas
 * ================================================================
 * Fuente única de verdad para:
 *   - /nexus/presentations      (catálogo)
 *   - /nexus/presentations/[slug] (guión del presentador)
 *   - Deal Room → deck por deal (nexus_deal_rooms.presentation_id)
 *   - Sovereign Meet → deck inyectado (meetings.presentation_id)
 *
 * El `slug` es el identificador que se persiste en base de datos. Debe coincidir
 * con la ruta del deck en /pitch/<slug>.
 *
 * Los decks son páginas estáticas (React) del propio repo: este catálogo NO evalúa
 * contenido, solo declara metadatos y el guión de conducción.
 */

export interface PresentationScriptBlock {
  /** Identificador del slide en el deck (referencia humana, no se evalúa) */
  slide: string;
  title: string;
  /** Puntos de conducción, en orden. No son claims de marketing: son instrucciones. */
  beats: string[];
  /** Minutos objetivo para este bloque */
  minutes: number;
}

export interface NexusPresentation {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  tags: string[];
  /** Ruta canónica del deck */
  href: string;
  status: string;
  /** Duración sugerida total, en minutos */
  targetMinutes: number;
  script: PresentationScriptBlock[];
  /** Reglas de conducción específicas de este deck */
  guardrails: string[];
}

export const NEXUS_PRESENTATIONS: NexusPresentation[] = [
  {
    slug: "real-estate-growth",
    title: "Real Estate Growth Infrastructure",
    subtitle: "Infraestructura inteligente para adquisición, gestión y conversión comercial inmobiliaria.",
    category: "Hospitalidad & Copropiedad",
    tags: ["Celeste Huatulco", "Fraccional 1/8 & 1/16", "Deal Room", "Hermes 24/7"],
    href: "/pitch/real-estate-growth",
    status: "Activo / Master",
    targetMinutes: 35,
    guardrails: [
      "No prometer ventas, leads ni visitas garantizadas: se presenta infraestructura y método.",
      "El piloto se plantea como medición de indicadores, no como resultado comprometido.",
      "Toda cifra mencionada debe existir en el deck o en el Deal Room; si no está, decir UNKNOWN.",
      "El deck no reemplaza el Deal Room: al cerrar, el siguiente paso es la propuesta formal.",
    ],
    script: [
      {
        slide: "s1-apertura",
        title: "Apertura y encuadre",
        minutes: 2,
        beats: [
          "Saluda por nombre y confirma quién más está en la llamada.",
          "Encuadra la sesión: 'diagnóstico comercial y expansión', 35 minutos, y qué deciden al final.",
          "Abre el deck solo cuando termines el encuadre (botón Presentar en la sala).",
        ],
      },
      {
        slide: "s2-problema",
        title: "El reto comercial",
        minutes: 4,
        beats: [
          "Pregunta antes de mostrar: ¿cómo llegan hoy los leads y cuánto tarda la primera respuesta?",
          "Conecta los tres síntomas con lo que acaban de decir: respuesta lenta, dispersión, ceguera del embudo.",
          "No corrijas su operación en voz alta; registra el síntoma.",
        ],
      },
      {
        slide: "s3-solucion",
        title: "La solución integral",
        minutes: 5,
        beats: [
          "Explica la infraestructura como capas: captación, conversión, expediente, seguimiento.",
          "Aclara qué es software, qué es media y qué es operación del equipo de ellos.",
          "Si preguntan por precios aquí, indica que el modelo económico se ve en el bloque 9.",
        ],
      },
      {
        slide: "s4-deal-room",
        title: "Experiencia del comprador (Deal Room)",
        minutes: 4,
        beats: [
          "Muestra el Deal Room real del cliente (enlace público) y cómo el comprador firma sin wallet.",
          "Señala que la firma es off-chain y que queda audit trail: no es una promesa, es la pantalla.",
        ],
      },
      {
        slide: "s5-automatizacion",
        title: "Hermes y Sofía",
        minutes: 4,
        beats: [
          "Separa roles: Hermes propone y ejecuta dentro de límites; la gobernanza autoriza.",
          "Aclara el límite del LLM: nunca autoriza ni ejecuta sin política determinista.",
          "Evita presentar a Hermes como 'vendedor autónomo': es concierge y ejecutor gobernado.",
        ],
      },
      {
        slide: "s6-medicion",
        title: "Medición y embudo",
        minutes: 3,
        beats: [
          "Muestra qué métricas existen y cuáles devuelven UNAVAILABLE cuando no hay fuente.",
          "Regla explícita: no se inventan números. Si falta datos, se dice.",
        ],
      },
      {
        slide: "s7-trazabilidad",
        title: "Trazabilidad e integridad documental",
        minutes: 3,
        beats: [
          "Explica versiones, aprobación humana y tokens de entrega firmados.",
          "Conecta con compliance: cada aprobación es de un humano identificado, no de una API key.",
        ],
      },
      {
        slide: "s8-piloto",
        title: "Piloto comercial de 30 días",
        minutes: 4,
        beats: [
          "Define alcance, responsables de ambas partes y qué se mide.",
          "Pide explícitamente lo que necesitas de ellos: accesos, inventario y dueño del proyecto.",
          "Cierra el bloque con la pregunta: '¿este alcance es el correcto o sobra algo?'",
        ],
      },
      {
        slide: "s9-economia",
        title: "Modelo económico",
        minutes: 4,
        beats: [
          "Presenta Modelo A (licencia + setup) y Modelo B (tecnología + media).",
          "No improvises descuentos ni plazos: lo que no esté aprobado se documenta y se responde por escrito.",
          "Anota objeciones y respóndelas en el seguimiento, no en la llamada.",
        ],
      },
      {
        slide: "s10-cierre",
        title: "Cierre y siguiente paso",
        minutes: 2,
        beats: [
          "Resume en tres frases lo acordado y lo pendiente.",
          "Compromete el siguiente paso con fecha (propuesta vía Deal Room).",
          "Finaliza la reunión con el botón Finalizar: dispara el seguimiento por email a los invitados.",
        ],
      },
    ],
  },
  {
    slug: "institutional-os",
    title: "Institutional Agent OS",
    subtitle: "AI that can operate — without becoming the authority. Gobernanza y ejecución institucional.",
    category: "Plataforma & Core",
    tags: ["Hermes Cognitive", "Sovereign Vault", "Ecosistema B2B"],
    href: "/pitch/institutional-os",
    status: "Activo / Core",
    targetMinutes: 30,
    guardrails: [
      "Es un deck de arquitectura y gobernanza: no es una demo de producto.",
      "Cada afirmación debe poder señalarse en el deck; si no está, se marca para verificación.",
      "No comprometer integraciones ni plazos en la llamada.",
    ],
    script: [
      {
        slide: "s1-title",
        title: "Apertura",
        minutes: 1,
        beats: ["Encuadra: qué es un Agent OS y por qué la autoridad no puede vivir en el modelo."],
      },
      {
        slide: "s2-problem",
        title: "El problema",
        minutes: 3,
        beats: ["El agente que ejecuta sin fronteras es un riesgo, no una ventaja."],
      },
      {
        slide: "s3-opportunity",
        title: "La oportunidad",
        minutes: 3,
        beats: ["Automatizar operación real exige gobernanza verificable, no prompts."],
      },
      {
        slide: "s4-pandoras",
        title: "Pandora's",
        minutes: 2,
        beats: ["Contexto institucional y alcance del ecosistema."],
      },
      {
        slide: "s5-hermes",
        title: "Hermes",
        minutes: 3,
        beats: ["Hermes propone; gobernanza autoriza; operaciones ejecutan."],
      },
      {
        slide: "s6-architecture",
        title: "La arquitectura",
        minutes: 4,
        beats: ["Identidad → contexto → capability → policy → resource scope → ejecución."],
      },
      {
        slide: "s7-rule",
        title: "La regla fundamental",
        minutes: 2,
        beats: ["El LLM nunca es frontera de autorización. Un prompt no concede permisos."],
      },
      {
        slide: "s8-difference",
        title: "Por qué es diferente",
        minutes: 3,
        beats: ["Compara con automatizaciones frágiles: aquí hay contratos y auditoría."],
      },
      {
        slide: "s9-objective",
        title: "El objetivo",
        minutes: 2,
        beats: ["Operación gobernada, no asistente conversacional."],
      },
      {
        slide: "s10-status",
        title: "Estado actual",
        minutes: 3,
        beats: ["Sé literal sobre qué está en producción y qué está en especificación."],
      },
      {
        slide: "s11-define",
        title: "Definición estratégica",
        minutes: 2,
        beats: ["Qué se construye y qué no, para evitar expectativas falsas."],
      },
      {
        slide: "s12-market-fit",
        title: "Lo que necesitamos validar",
        minutes: 2,
        beats: ["Convierte la llamada en validación conjunta, no en pitch cerrado."],
      },
      {
        slide: "s13-beachhead",
        title: "El primer beachhead",
        minutes: 2,
        beats: ["Un caso concreto con métricas, no un programa completo."],
      },
      {
        slide: "s14-sequence",
        title: "De piloto a plataforma",
        minutes: 2,
        beats: ["Secuencia por fases con criterios de salida."],
      },
      {
        slide: "s15-vision",
        title: "La visión",
        minutes: 1,
        beats: ["Cierre conceptual."],
      },
      {
        slide: "s16-final",
        title: "Siguiente paso",
        minutes: 1,
        beats: ["Compromete el siguiente paso con fecha y responsable."],
      },
    ],
  },
];

export const PRESENTATION_SLUGS = NEXUS_PRESENTATIONS.map((presentation) => presentation.slug);

export function findPresentation(slug: string | null | undefined): NexusPresentation | undefined {
  if (!slug) return undefined;
  return NEXUS_PRESENTATIONS.find((presentation) => presentation.slug === slug);
}

export function isKnownPresentation(slug: string): boolean {
  return PRESENTATION_SLUGS.includes(slug);
}
