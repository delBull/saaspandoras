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
      "Infraestructura comercial para Celeste Beach Residences & Spa. Implementación + operación de 90 días con atribución y medición semanal.",
    category: "Deal activo · Hospitalidad",
    tags: ["Celeste Beach Residences", "104 fracciones", "Implementación USD 4,500", "Operación USD 2,500/mes", "Incentivo 0.75–1%"],
    href: "/pitch/deck/celeste",
    proposalHref: "/propuesta/celeste",
    status: "Listo para presentar",
    targetMinutes: 38,
    guardrails: [
      "No garantizar prospectos, visitas ni ventas: se presenta el sistema y cómo se mide.",
      "Usar solo los datos confirmados por Eduardo (104 fracciones · $138k/$181k · promedio $155k · equipos Huatulco y CDMX).",
      "No mencionar subdivisiones 1/8 ni 1/16: no están confirmadas.",
      "El 8% de Posadas/Curamoria se menciona como información del cliente y se marca como 'a confirmar de qué se calcula'.",
      "Los ~$16.12M USD son inventario nominal, NO ventas ni ingreso atribuible a Pandora's.",
      "Publicidad fondeada por Celeste y separada de honorarios.",
      "Honorarios: implementación USD 4,500 + operación USD 2,500/mes × 3 = USD 12,000. No descontar la implementación.",
      "Incentivo por ventas opcional 0.75%–1% sobre importe efectivamente cobrado; no sustituye honorarios y requiere revisión legal.",
      "Contenido: 4 piezas/mes incluidas; 8 solo mediante ampliación cotizada.",
      "Activos (dominio, landing, catálogo, CRM, datos, cuentas, campañas y documentación) bajo control de Celeste; Pandora's conserva metodología, herramientas y PI preexistente.",
      "La automatización de WhatsApp se presenta sujeta a aprobación de Meta; al inicio la atención es humana asistida.",
    ],
    script: [
      {
        slide: "s1-portada",
        title: "Apertura",
        minutes: 2,
        beats: [
          "Saluda y confirma quién está: Eduardo y su equipo comercial. Pregunta si hay alguien más que decida.",
          "Encuadre: 35-40 min. Al final validamos 4 datos y decides si arrancamos la implementación.",
          "No abras el deck todavía: ábrelo al terminar el encuadre (botón Presentar deck en la sala).",
        ],
      },
      {
        slide: "s2-oportunidad",
        title: "La oportunidad",
        minutes: 4,
        beats: [
          "104 fracciones · USD 138k (2 rec) / USD 181k (3 rec) · promedio USD 155k. Mercados CDMX, Oaxaca y extranjero; motivo principal uso vacacional.",
          "Activo comercial: Estancia Discovery USD 250/noche, descontable del anticipo (confirmar condiciones en la llamada).",
          "Equipo: 1 asesora en Huatulco + 2 vendedores en CDMX. Posadas/Curamoria con 8% (marcar: a confirmar de qué se calcula).",
          "Pregunta abierta: ¿cuántos interesados y visitas reciben al mes hoy? Su respuesta es la línea base del piloto.",
        ],
      },
      {
        slide: "s3-diagnostico",
        title: "Diagnóstico",
        minutes: 4,
        beats: [
          "El cuello de botella no es producto ni precio: es volumen de interesados calificados y seguimiento hasta la visita.",
          "Tres hipótesis: captación intermitente, respuesta lenta sin registro y visitas sin seguimiento medible.",
          "Pide confirmación: ¿quién responde hoy los mensajes y en cuánto tiempo? ¿Dónde se registra?",
          "No des cifras: el diagnóstico es hipótesis y se valida en la semana 1 con sus datos.",
        ],
      },
      {
        slide: "s4-solucion",
        title: "Infraestructura comercial",
        minutes: 5,
        beats: [
          "Cambia el marco: Pandora's no administra redes sociales. Diseña, implementa y opera la infraestructura comercial.",
          "Cuatro componentes como un solo sistema: captar, atender y precalificar, llevar a visita, medir.",
          "Celeste conserva el cierre y la relación con el comprador; nosotros operamos el sistema y lo medimos.",
          "La implementación queda como activo de Celeste aunque después cambie de operador. Pandora's conserva metodología, herramientas y PI.",
        ],
      },
      {
        slide: "s5-como",
        title: "El recorrido del prospecto",
        minutes: 3,
        beats: [
          "Recorre las etapas sin leerlas: cada una tiene responsable y registro.",
          "El punto crítico es la solicitud y la visita Discovery: ahí se gana o se pierde la venta.",
          "Todo queda en el CRM: origen, etapa, responsable, visita y resultado.",
        ],
      },
      {
        slide: "s6-plan",
        title: "Dos fases, un solo sistema",
        minutes: 4,
        beats: [
          "Fase 1 Implementación (semanas 1-4) y Fase 2 Operación (semanas 5-12). Son dos trabajos distintos.",
          "La semana 4 se mueve si faltan accesos, materiales o aprobaciones. Decirlo ahora evita fricción después.",
          "Semana 12: reporte final, entrega de activos y decisión de continuidad.",
        ],
      },
      {
        slide: "s7-entregables",
        title: "Qué incluye el sistema",
        minutes: 3,
        beats: [
          "Destaca cuatro: landing y catálogo, CRM con pipeline, campañas y reporte semanal. No leas los ocho puntos.",
          "Contenido: 4 piezas al mes incluidas; 8 solo mediante ampliación cotizada.",
          "Activos bajo control de Celeste: dominio, landing, catálogo, CRM, datos, cuentas, campañas y documentación.",
        ],
      },
      {
        slide: "s8-inversion",
        title: "Inversión: implementación + operación",
        minutes: 5,
        beats: [
          "USD 4,500 de implementación (una vez) + USD 2,500/mes x 3 = USD 12,000 en 90 días. Pauta aparte: USD 1,500-3,000/mes.",
          "Di el porqué: construir no es operar. La implementación queda como activo de Celeste aunque cambien de operador.",
          "Pago propuesto: 50% de implementación al inicio y 50% al lanzamiento (semana 4); mensualidad por adelantado.",
          "No incluye impuestos, viajes, producción audiovisual especial, tokenización, migración ni incentivo por ventas.",
          "Si hay resistencia: reduce alcance. No ofrezcas descuento automático ni regales horas de implementación.",
        ],
      },
      {
        slide: "s9-incentivo",
        title: "Incentivo por ventas atribuibles",
        minutes: 3,
        beats: [
          "Opcional y adicional: no sustituye los honorarios ni es la base del negocio.",
          "0.75%-1% del importe efectivamente cobrado. Ejemplo: 1% de USD 155k = USD 1,550 por venta.",
          "Reglas: primer contacto documentado, ventana de 90 días, excluir prospectos preexistentes, solo importes cobrados.",
          "Aclara que requiere revisión legal y que no es comisión inmobiliaria por intermediación.",
        ],
      },
      {
        slide: "s10-indicadores",
        title: "Qué medimos",
        minutes: 3,
        beats: [
          "CPL, prospectos, % calificado, solicitudes y visitas Discovery; ventas atribuibles solo si se firma el incentivo.",
          "Di la frase completa: no garantizamos prospectos, visitas ni ventas; depende también de su oferta, disponibilidad y velocidad de cierre.",
          "Ofrece reporte semanal y reunión de revisión: la medición es parte del servicio, no un extra.",
        ],
      },
      {
        slide: "s11-siguientes",
        title: "Siguientes pasos",
        minutes: 2,
        beats: [
          "Cierra con tres pasos: validar 4 datos (anticipo, reglas Discovery, presupuesto de pauta y accesos), aceptar la propuesta, kickoff.",
          "El documento v1.1 se firma en el Deal Room de Celeste; Eduardo ya tiene su liga personal.",
          "Define qué pasa a los 90 días: continuidad mensual, nuevo alcance o cierre ordenado con activos bajo control de Celeste.",
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
  {
    slug: "aurora-demo",
    title: "Aurora · Sistema Comercial (Demo)",
    subtitle:
      "Captación y conversión comercial para Aurora Bay Residences & Spa. Piloto de 90 días con atribución y medición semanal. Datos ficticios para ensayo.",
    category: "Demo interna · Hospitalidad",
    tags: ["Aurora Bay (demo)", "86 fracciones", "Estancia Discovery", "Ensayo interno"],
    href: "/pitch/deck/aurora-demo",
    status: "Deck de prueba",
    targetMinutes: 35,
    guardrails: [
      "Deck de prueba: Aurora Bay y sus cifras son ficticias; no presentar a un cliente real.",
      "No garantizar prospectos, visitas ni ventas: se presenta el sistema y cómo se mide.",
      "Usar solo los datos de ejemplo de este deck (86 fracciones · $112k/$149k · promedio $128k · equipos Puerto Vallarta y CDMX).",
      "El 6% de Marina Group es información de ejemplo y se marca como 'a confirmar de qué se calcula'.",
      "Los ~$11.0M USD son inventario nominal, NO ventas ni ingreso atribuible a Pandora's.",
      "Publicidad fondeada por Aurora y separada de honorarios. No hay success fee en la base.",
      "La automatización de WhatsApp se presenta sujeta a aprobación de Meta; al inicio la atención es humana asistida.",
    ],
    script: [
      {
        slide: "s1-portada",
        title: "Apertura y encuadre",
        minutes: 2,
        beats: [
          "Ensayo: este deck es ficticio (Aurora Bay). Úsalo para probar la sala, el deck y los controles antes de la presentación real.",
          "Agradece el tiempo y confirma quién está en la llamada (dirección y área comercial).",
          "Encuadra: 30-35 minutos; al final se validan 4 datos y deciden si arranca el piloto.",
          "Abre el deck cuando termines el encuadre (botón Presentar deck en la sala).",
        ],
      },
      {
        slide: "s2-oportunidad",
        title: "La oportunidad",
        minutes: 4,
        beats: [
          "Repite lo que ellos dijeron: 86 fracciones disponibles, $112k (2 rec) y $149k (3 rec), promedio $128k.",
          "Perfil: uso vacacional, compradores de CDMX, Guadalajara y extranjeros. Equipo: 1 asesora en Puerto Vallarta y 2 vendedores en CDMX.",
          "Estancia Discovery (USD 210/noche, descontable del anticipo) como activo existente, condiciones a confirmar.",
          "Si surge el inventario total, aclara que es valor nominal de lo disponible, no ventas.",
        ],
      },
      {
        slide: "s3-diagnostico",
        title: "Diagnóstico",
        minutes: 5,
        beats: [
          "Nombra su propio diagnóstico: el cuello de botella es conseguir interesados calificados.",
          "Presenta las tres hipótesis como hipótesis: dependencia de Marina Group (6%, base de cálculo a confirmar), falta de proceso único y falta de medición.",
          "Pregunta antes de afirmar: ¿cuántos interesados reciben al mes y cuántos llegan a visita?",
          "Compromiso explícito: el diagnóstico se valida con datos en la semana 1.",
        ],
      },
      {
        slide: "s4-solucion",
        title: "La solución",
        minutes: 5,
        beats: [
          "Explica el servicio como sistema único: captar, atender, precalificar, convertir a visita y medir.",
          "Deja claro el límite: Pandora's opera el sistema; Aurora conserva el cierre y la relación con el comprador.",
          "Sobre automatización: al inicio es atención humana asistida; el asistente en WhatsApp requiere aprobación de Meta.",
        ],
      },
      {
        slide: "s5-como",
        title: "El recorrido del prospecto",
        minutes: 4,
        beats: [
          "Recorre el flujo completo con etapas y responsables, de captación a registro y atribución.",
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
          "Cifras: $2,200 de configuración + $1,600/mes por 3 meses = $7,000 de honorarios en 90 días.",
          "Publicidad aparte, la paga Aurora directo a plataformas; escenario de trabajo $1,200-2,500/mes a validar.",
          "No incluye IVA, viajes, producción audiovisual especial ni comisión por ventas.",
          "Si piden incentivo por ventas: se negocia por separado con reglas de atribución. No improvisar descuentos ni plazos.",
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
          "Confirma que el documento de aceptación se firma en el Deal Room de Aurora (demo).",
          "Finaliza la reunión con el botón Finalizar: dispara el seguimiento por email a los asistentes.",
        ],
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
