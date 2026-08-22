/**
 * 🎓 Pandora's Academy — CMO Executive Readiness Assessment Framework (v1.0)
 * apps/dashboard/src/lib/pandoras/core/domains/academy/curriculum/cmo-program.ts
 *
 * Grounded 100% in real Pandora's documentation:
 * - Libro IV: Pandora's Media Co & Content Distribution Velocity
 * - Libro VII: Growth Engine, Viral Loops & Institutional Demand Funnels
 * - IMPI Trademark Protection in Marketing (Classes 36 & 42)
 * - Conversion Attribution, Lead Scoring & Multi-Channel Orchestration
 */

import { AcademyProgram } from '../types';

export const CMO_EXECUTIVE_PROGRAM: AcademyProgram = {
  id: 'prog_cmo_executive_v1',
  code: 'CMO_EXECUTIVE_V1',
  title: 'Chief Marketing Officer (CMO) & Demand Engine Executive Certification',
  description: 'Programa de certificación ejecutiva para el Chief Marketing Officer (CMO) de Pandora\'s. Evalúa dominio integral de Media Co, adquisición viral multicanal, protección de marca IMPI, embudos de conversión institucional y atribución determinista.',
  targetRole: 'CMO',
  status: 'ACTIVE',
  version: 1,
  passingScore: 80,
  modules: [
    // ── MÓDULO 1: ARQUITECTURA MEDIA CO & DISTRIBUCIÓN (20%) ────────────────
    {
      id: 'mod_cmo_01_mediaco',
      programId: 'prog_cmo_executive_v1',
      sequence: 1,
      code: 'MOD_1_MEDIACO_DISTRIBUTION',
      title: 'Arquitectura Media Co, Velocidad de Contenido y Distribución Omnicanal',
      description: 'Estrategia de medios propios (Owned Media), sindicación algorítmica y posicionamiento de autoridad institucional en Web3 y Fintech.',
      weightPercentage: 20,
      requiredKnowledgeDocs: ['PANDORAS_LIBRO_IV_MEDIA_CO', 'PANDORAS_LIBRO_VII_GROWTH'],
      assessments: [
        {
          id: 'asm_cmo_01_content_engine',
          moduleId: 'mod_cmo_01_mediaco',
          title: 'Estrategia Ejecutiva: Conversión de Audiencia Fría a LPs Institucionales',
          scenarioContext: 'Pandora\'s lanza una nueva vertical de tokenización de activos de hospitalidad premium ($20M USD target). El equipo de marketing propone gastar $50k USD en pauta tradicional en Google Ads sin crear activos editoriales ni embudos de autoridad.',
          questionPrompt: `Como CMO de Pandora's:
1. ¿Por qué el enfoque de pauta tradicional directa es ineficiente para tickets institucionales conforme al Libro IV?
2. Diseña la estrategia de Pandora's Media Co: qué pilares de contenido, reportes de investigación y canales propios (Newsletters, Deal Rooms, Podcasts ejecutivos) desplegarás para crear demanda orgánica calificada.
3. ¿Cómo estructuras el loop de redistribución de micro-contenidos para maximizar el alcance orgánico en X (Twitter), LinkedIn y Telegram?`,
          rubricCriteria: [
            {
              id: 'rc_cmo_01_owned_media',
              title: 'Defensa de Owned Media y Autoridad',
              description: 'Rechaza la dependencia exclusiva de pauta fría y fundamenta la creación de activos editoriales de alta autoridad (Libro IV).',
              maxScore: 35,
              evaluationGuideline: 'Debe estructurar Pandora\'s Media Co como centro generador de credibilidad y distribución.'
            },
            {
              id: 'rc_cmo_01_funnel_design',
              title: 'Diseño de Embudo de Conversión de Alta Fidelidad',
              description: 'Detalla cómo el contenido educativo y los whitepapers conducen al prospecto hacia el Deal Room de Nexus.',
              maxScore: 35,
              evaluationGuideline: 'Debe conectar el consumo de contenido con la cualificación en el Deal Room.'
            },
            {
              id: 'rc_cmo_01_distribution_loops',
              title: 'Velocidad de Distribución Multicanal',
              description: 'Presenta un workflow claro de repurposing: reporte maestro -> hilos técnicos -> video pills -> newsletter.',
              maxScore: 30,
              evaluationGuideline: 'Debe demostrar sincronía entre canales cortos y piezas de análisis profundo.'
            }
          ],
          criticalFailureConditions: [
            'Proponer únicamente anuncios pagados sin construcción de autoridad ni activos editoriales propios.',
            'Desconocer el rol del Deal Room en la conversión de inversionistas calificados.',
            'Prometer rendimientos garantizados en material publicitario público.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 2: BRAND MOAT & GOBERNANZA DE MARCA IMPI (20%) ────────────────
    {
      id: 'mod_cmo_02_brand_impi',
      programId: 'prog_cmo_executive_v1',
      sequence: 2,
      code: 'MOD_2_BRAND_IMPI_GOVERNANCE',
      title: 'Protección de Marcas IMPI, Narrativa Institucional y Brand Moat',
      description: 'Gestión de marcas registradas (Clases 36 y 42), lineamientos de co-branding con partners y blindaje contra dilución.',
      weightPercentage: 20,
      requiredKnowledgeDocs: ['PANDORAS_IP_MASTER_REGISTER', 'IOM_v1_0'],
      assessments: [
        {
          id: 'asm_cmo_02_brand_shield',
          moduleId: 'mod_cmo_02_brand_impi',
          title: 'Gobernanza de Marca: Co-Branding con Partner sin Dilución de IP',
          scenarioContext: 'Un partner regional de desarrollo inmobiliario quiere lanzar una campaña publicitaria anunciando "Pandora\'s Real Estate Token Fund" usando el logo de Pandora\'s en espectaculares y televisión abierta, gestionando ellos mismos la pauta bajo su propia marca secundaria.',
          questionPrompt: `Como CMO de Pandora's:
1. Con base en el Master IP Register y el IOM v1.0, ¿qué autorizaciones y restricciones específicas aplican al uso de la marca registrada "PANDORAS"?
2. ¿Qué riesgos de dilución de marca o responsabilidad regulatoria se evitan al rechazar la denominación no autorizada "Pandora's Real Estate Token Fund"?
3. Redacta la directiva de Co-Branding institucional que el partner debe seguir para operar bajo el sello "Powered by Pandora's Growth OS".`,
          rubricCriteria: [
            {
              id: 'rc_cmo_02_trademark_rigor',
              title: 'Rigor en Marcas Registradas IMPI',
              description: 'Aplica estrictamente las Clases 36 y 42 del Master IP Register y prohíbe variaciones no registradas.',
              maxScore: 40,
              evaluationGuideline: 'Debe exigir el formato "Powered by Pandora\'s" sin comprometer la titularidad de MXHUB.'
            },
            {
              id: 'rc_cmo_02_regulatory_shielding',
              title: 'Prevención de Riesgos de Captación Pública',
              description: 'Identifica que promocionar "Fondos" en medios masivos puede infringir normativas financieras de captación pública.',
              maxScore: 35,
              evaluationGuideline: 'Debe proteger la naturaleza tecnológica de la plataforma frente a reclamos de intermediación financiera no regulada.'
            },
            {
              id: 'rc_cmo_02_brand_guidelines',
              title: 'Directiva de Co-Branding Clara y Asertiva',
              description: 'Entrega lineamientos ejecutivos listos para el partner con paleta, disclaimer legal y estructura de acreditación.',
              maxScore: 25,
              evaluationGuideline: 'Debe exigir aprobación previa por escrito de todo arte final.'
            }
          ],
          criticalFailureConditions: [
            'Permitir que terceros usen la marca PANDORAS como fondo de inversión sin control regulatorio.',
            'Omitir la exigencia de autorización por escrito previa para piezas publicitarias.',
            'Ceder la titularidad de la marca o crear marcas conjuntas que diluyan la IP matriz.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 3: VIRAL LOOPS, EMBAJADORES & GAMIFICACIÓN (20%) ──────────────
    {
      id: 'mod_cmo_03_growth_loops',
      programId: 'prog_cmo_executive_v1',
      sequence: 3,
      code: 'MOD_3_GROWTH_LOOPS_AMBASSADORS',
      title: 'Mecanismos de Adquisición Viral, Programa de Embajadores y PBOX Points',
      description: 'Estructuración de incentivos descentralizados, gamificación con PBOX Points, programas de referidos y buyback engagement.',
      weightPercentage: 20,
      requiredKnowledgeDocs: ['PANDORAS_LIBRO_VII_GROWTH', 'PAS_ASSET_STANDARD_v1_0'],
      assessments: [
        {
          id: 'asm_cmo_03_ambassador_economy',
          moduleId: 'mod_cmo_03_growth_loops',
          title: 'Diseño de Incentivos: Programa de Embajadores Sostenible y Anti-Sybil',
          scenarioContext: 'El programa de referidos de la dApp registra 5,000 registros nuevos en 48 horas, pero el 80% proviene de cuentas de Telegram y bots automatizados que intentan extraer incentivos de bienvenida en tokens.',
          questionPrompt: `Como CMO de Pandora's:
1. ¿Qué fallas de diseño en los incentivos permitieron el ataque de bots (Sybil attack)?
2. Rediseña el programa de embajadores aplicando Proof of Action: ¿qué hitos verificables (KYC, conexión de wallet con historial, depósito mínimo o firma de NDA en Deal Room) deben cumplirse antes de liberar comisiones o puntos PBOX?
3. ¿Cómo alineas el programa de embajadores para recompensar volumen de colocación real y no meros clicks?`,
          rubricCriteria: [
            {
              id: 'rc_cmo_03_sybil_defense',
              title: 'Blindaje Anti-Sybil y Proof of Value',
              description: 'Elimina recompensas por meros registros y exige hitos transaccionales o de cualificación real.',
              maxScore: 40,
              evaluationGuideline: 'Debe vincular incentivos a volumen colocado o leads verificados en Deal Room.'
            },
            {
              id: 'rc_cmo_03_gamification_design',
              title: 'Arquitectura de PBOX Points y Tiers',
              description: 'Estructura un sistema de niveles por reputación y aportación de liquidez al ecosistema.',
              maxScore: 30,
              evaluationGuideline: 'Debe usar los PBOX points como multiplicadores de retención y gobernanza.'
            },
            {
              id: 'rc_cmo_03_economic_alignment',
              title: 'Sostenibilidad Económica del CAC',
              description: 'Demuestra que el Costo de Adquisición (CAC) es inferior al Life-Time Value (LTV) generado.',
              maxScore: 30,
              evaluationGuideline: 'Debe calcular márgenes de comisión basados en success fees reales.'
            }
          ],
          criticalFailureConditions: [
            'Mantener incentivos en efectivo o tokens por meros registros sin verificación alguna.',
            'Pagar comisiones antes de que los fondos de inversión se liquiden en el fideicomiso.',
            'Desconocer el riesgo de drenaje de tesorería por ataques Sybil automatizados.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 4: FUNNELS DE CONVERSIÓN & HERMES AI AGENTIC MARKETING (20%) ──
    {
      id: 'mod_cmo_04_agentic_funnels',
      programId: 'prog_cmo_executive_v1',
      sequence: 4,
      code: 'MOD_4_AGENTIC_FUNNELS_HERMES',
      title: 'Embudos Agénticos de Hermes, Calificación Conversacional y Atribución',
      description: 'Automatización de prospección con Hermes OS, cualificación socrática de leads en WhatsApp/Telegram y tracking de atribución.',
      weightPercentage: 20,
      requiredKnowledgeDocs: ['HERMES_INSTITUTIONAL_VISION', 'PANDORAS_LIBRO_VII_GROWTH'],
      assessments: [
        {
          id: 'asm_cmo_04_hermes_conversion',
          moduleId: 'mod_cmo_04_agentic_funnels',
          title: 'Orquestación de Hermes: Del Primer Contacto en WhatsApp al Cierre en Deal Room',
          scenarioContext: 'Un lead inbound proveniente de una campaña de LinkedIn escribe por WhatsApp a Hermes diciendo: "Me interesa invertir pero no confío en plataformas de cripto y quiero hablar con un asesor ahora mismo".',
          questionPrompt: `Como CMO de Pandora's:
1. Define la directiva de Journey de Hermes para manejar esta objeción: ¿cómo debe posicionar Hermes la seguridad institucional (fideicomiso, smart contracts auditados, portal regulado) sin sonar defensivo?
2. ¿En qué momento exacto del embudo Hermes debe transicionar al usuario hacia la reserva de llamada o el acceso al Deal Room privado?
3. ¿Cómo garantizas la atribución unificada del lead si el usuario empezó en LinkedIn, continuó en WhatsApp y cerró firmando en el Deal Room con su wallet?`,
          rubricCriteria: [
            {
              id: 'rc_cmo_04_objection_handling',
              title: 'Manejo Estratégico de Objeciones Institucionales',
              description: 'Utiliza el marco de activos reales (RWA) y fideicomiso regulado para disipar desconfianza cripto.',
              maxScore: 35,
              evaluationGuideline: 'Debe destacar el respaldo en bienes raíces y contratos legales vinculantes.'
            },
            {
              id: 'rc_cmo_04_journey_progression',
              title: 'Progresión Óptima de Hitos (Next Best Action)',
              description: 'Guía la conversación de forma consultiva hacia la invitación formal al Deal Room o calendarización.',
              maxScore: 35,
              evaluationGuideline: 'Debe evitar presionar el cierre prematuro y priorizar la educación del lead.'
            },
            {
              id: 'rc_cmo_04_multi_touch_attribution',
              title: 'Atribución Multitáctil y Canonical Identity',
              description: 'Explica el binding entre tracking UTM, número telefónico y wallet address en el data spine.',
              maxScore: 30,
              evaluationGuideline: 'Debe explicar la unificación de identidad en el backend de marketing.'
            }
          ],
          criticalFailureConditions: [
            'Ignorar la objeción del usuario y forzar un link de compra directo.',
            'Omitir los mecanismos de atribución unificada perdiendo el tracking de la campaña de origen.',
            'Permitir que el agente haga declaraciones financieras engañosas o no autorizadas.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 5: METRICS COCKPIT, CAC/LTV & CRISIS PR EN DIGITAL (20%) ──────
    {
      id: 'mod_cmo_05_cockpit_pr',
      programId: 'prog_cmo_executive_v1',
      sequence: 5,
      code: 'MOD_5_METRICS_COCKPIT_CRISIS_PR',
      title: 'Cockpit de Métricas Ejecutivas, Retención y Gestión de Crisis de Comunicación',
      description: 'Gestión del Growth Cockpit, optimización de tasas de conversión y protocolo de contención ante FUD o ataques reputacionales.',
      weightPercentage: 20,
      requiredKnowledgeDocs: ['PANDORAS_LIBRO_IV_MEDIA_CO', 'IOM_v1_0'],
      assessments: [
        {
          id: 'asm_cmo_05_pr_crisis',
          moduleId: 'mod_cmo_05_cockpit_pr',
          title: 'Mando en Crisis: Ataque Reputacional y Desinformación en Redes Sociales',
          scenarioContext: 'Una cuenta influyente en X publica acusaciones falsas afirmando que Pandora\'s "congeló retiros de usuarios" tras confundir un periodo estándar de vesting de un proyecto con una insolvencia, generando pánico en la comunidad.',
          questionPrompt: `Como CMO de Pandora's:
1. ¿Cuál es el protocolo de respuesta inmediata en los primeros 30 minutos?
2. ¿Por qué está prohibido borrar comentarios o confrontar de forma emocional en canales públicos?
3. Redacta el comunicado oficial institucional y la estrategia de prueba on-chain (transparencia de tesorería y contratos inteligentes) para neutralizar el FUD definitivamente.`,
          rubricCriteria: [
            {
              id: 'rc_cmo_05_crisis_speed',
              title: 'Velocidad y Calma Institucional',
              description: 'Establece comando unificado de vocería, congelando declaraciones no autorizadas del equipo.',
              maxScore: 35,
              evaluationGuideline: 'Debe priorizar hechos verificables sobre confrontaciones.'
            },
            {
              id: 'rc_cmo_05_onchain_proof',
              title: 'Uso de Evidencia Criptográfica y On-Chain',
              description: 'Publica enlaces a exploradores de bloques, saldos de tesorería y cláusulas del smart contract que demuestran la liquidez intacta.',
              maxScore: 40,
              evaluationGuideline: 'Debe convertir la crisis en una demostración de transparencia radical.'
            },
            {
              id: 'rc_cmo_05_community_restoration',
              title: 'Restauración de la Confianza y Retención',
              description: 'Convoca a un Community Town Hall o X Space con el equipo directivo para responder preguntas en vivo.',
              maxScore: 25,
              evaluationGuideline: 'Debe cerrar el incidente con un post-mortem transparente.'
            }
          ],
          criticalFailureConditions: [
            'Responder agresivamente en redes sociales o borrar mensajes de usuarios desatando el Efecto Streisand.',
            'Tardar más de 2 horas en emitir una declaración inicial oficial con hechos verificables.',
            'Omitir la presentación de evidencia pública on-chain que desmienta la acusación.'
          ],
          passingThreshold: 80
        }
      ]
    }
  ]
};
