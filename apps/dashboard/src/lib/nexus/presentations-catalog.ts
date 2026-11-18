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
  /** Documento de propuesta asociado (opcional) */
  proposalHref?: string;
  status: string;
  /** Duración sugerida total, en minutos */
  targetMinutes: number;
  script: PresentationScriptBlock[];
  /** Reglas de conducción específicas de este deck */
  guardrails: string[];
}

export const NEXUS_PRESENTATIONS: NexusPresentation[] = [
  {
    slug: "celeste",
    title: "Celeste · Sistema Comercial",
    subtitle:
      "Captación y conversión comercial para Celeste Beach Residences & Spa. Piloto de 90 días con atribución y medición semanal.",
    category: "Deal activo · Hospitalidad",
    tags: ["Celeste Beach Residences", "104 fracciones", "Estancia Discovery", "Deal Room PDR-63C2E9"],
    href: "/pitch/deck/celeste",
    proposalHref: "/propuesta/celeste",
    status: "Listo para presentar",
    targetMinutes: 35,
    guardrails: [
      "No garantizar prospectos, visitas ni ventas: se presenta el sistema y cómo se mide.",
      "Usar solo los datos confirmados por Eduardo (104 fracciones · $138k/$181k · promedio $155k · equipos Huatulco y CDMX).",
      "No mencionar subdivisiones 1/8 ni 1/16: no están confirmadas.",
      "El 8% de Posadas/Curamoria se menciona como información del cliente y se marca como 'a confirmar de qué se calcula'.",
      "Los ~$16.12M USD son inventario nominal, NO ventas ni ingreso atribuible a Pandora's.",
      "Publicidad fondeada por Celeste y separada de honorarios. No hay success fee en la base.",
      "La automatización de WhatsApp se presenta sujeta a aprobación de Meta; al inicio la atención es humana asistida.",
    ],
    script: [
      {
        slide: "s1-portada",
        title: "Apertura y encuadre",
        minutes: 2,
        beats: [
          "Agradece el tiempo y confirma quién está en la llamada (Eduardo y área comercial).",
          "Encuadra: 30-35 minutos, y al final se validan 4 datos y deciden si arranca el piloto.",
          "Abre el deck cuando termines el encuadre (botón Presentar deck en la sala).",
        ],
      },
      {
        slide: "s2-oportunidad",
        title: "La oportunidad",
        minutes: 4,
        beats: [
          "Repite lo que ellos dijeron, no lo que supones: 104 fracciones disponibles, $138k (2 rec) y $181k (3 rec), promedio $155k.",
          "Perfil: uso vacacional, compradores de CDMX, Oaxaca y extranjeros. Equipo: 1 asesora en Huatulco y 2 vendedores en CDMX.",
          "Menciona la Estancia Discovery (USD 250/noche, descontable del anticipo) como activo existente, con condiciones a confirmar.",
          "Si surge el inventario total, aclara que es valor nominal de lo disponible, no ventas.",
        ],
      },
      {
        slide: "s3-diagnostico",
        title: "Diagnóstico",
        minutes: 5,
        beats: [
          "Nombra su propio diagnóstico: el cuello de botella es conseguir interesados calificados.",
          "Presenta las tres hipótesis como hipótesis: dependencia de Posadas/Curamoria (8%, a confirmar base de cálculo), falta de proceso único y falta de medición.",
          "Pregunta antes de afirmar: ¿cuántos interesados reciben al mes y cuántos llegan a visita?",
          "Compromiso explícito: el diagnóstico se valida con datos en la semana 1, no se da por cierto.",
        ],
      },
      {
        slide: "s4-solucion",
        title: "La solución",
        minutes: 5,
        beats: [
          "Explica el servicio como sistema único: captar, atender, precalificar, convertir a visita y medir.",
          "Deja claro el límite: Pandora's opera el sistema; Celeste conserva el cierre y la relación con el comprador.",
          "Sobre automatización: al inicio es atención humana asistida; el asistente en WhatsApp requiere aprobación de Meta.",
        ],
      },
      {
        slide: "s5-como",
        title: "El recorrido del prospecto",
        minutes: 4,
        beats: [
          "Recorre el flujo completo con sus etapas y responsables, de captación a registro y atribución.",
          "Detente en la entrega al equipo de ellos: qué recibe, con qué criterios y quién responde.",
          "Si preguntan por su CRM actual, deja abierto integrarse o usar el entorno de Pandora's (se define en semana 1).",
        ],
      },
      {
        slide: "s6-plan",
        title: "Plan de 90 días",
        minutes: 4,
        beats: [
          "Semana 1 diagnóstico · semanas 2-3 construcción · semana 4 activación (meta, depende de accesos y aprobaciones).",
          "Semanas 5-11 optimización semanal · semana 12 reporte final y decisión de continuidad.",
          "Pide aquí los accesos y materiales: sin ellos la semana 4 se mueve, y decirlo ahora evita fricción después.",
        ],
      },
      {
        slide: "s7-entregables",
        title: "Qué incluye",
        minutes: 3,
        beats: [
          "Recorre los entregables sin leerlos todos: destaca landing + catálogo, CRM con pipeline, campañas y reporte semanal.",
          "Contenido: 4 piezas al mes incluidas; 8 como ampliación sujeta a material y aprobaciones a tiempo.",
        ],
      },
      {
        slide: "s8-inversion",
        title: "Propuesta económica",
        minutes: 5,
        beats: [
          "Cifras: $2,500 de configuración + $1,800/mes por 3 meses = $7,900 de honorarios en 90 días.",
          "Publicidad aparte, la paga Celeste directo a plataformas; escenario de trabajo $1,500-3,000/mes a validar.",
          "No incluye IVA, viajes, producción audiovisual especial ni comisión por ventas.",
          "Si piden incentivo por ventas: se negocia por separado con reglas de atribución. No improvisar descuentos ni plazos en la llamada.",
        ],
      },
      {
        slide: "s9-indicadores",
        title: "Qué medimos",
        minutes: 3,
        beats: [
          "CPL, porcentaje de prospectos calificados, solicitudes y visitas Discovery, ventas atribuibles si se acuerda.",
          "Di la frase completa: no se garantizan prospectos, visitas ni ventas; el resultado también depende de su oferta, disponibilidad y velocidad de cierre.",
        ],
      },
      {
        slide: "s10-siguientes",
        title: "Siguientes pasos",
        minutes: 2,
        beats: [
          "Cierra con los 3 pasos: validar 4 datos (anticipo, reglas Discovery, presupuesto de pauta, accesos) → aceptar la propuesta → kickoff.",
          "Confirma que el documento de aceptación se firma en el Deal Room de Celeste.",
          "Finaliza la reunión con el botón Finalizar: dispara el seguimiento por email a los asistentes.",
        ],
      },
    ],
  },
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
