/**
 * 🎓 Pandora's Academy — COO Executive Readiness Program (V1)
 * apps/dashboard/src/lib/pandoras/core/domains/academy/curriculum/coo-program.ts
 *
 * Comprehensive curriculum for Chief Operating Officer (COO) training and assessment:
 * 4 Focused Modules + Real Scenario Practical Cases + Explicit Rubric Criteria & Fatal Flaw Guards.
 */

import { AcademyProgram } from '../types';

export const COO_EXECUTIVE_PROGRAM: AcademyProgram = {
  id: 'prog_coo_internal_v1',
  code: 'COO_INTERNAL_V1',
  title: 'COO Executive Readiness & Institutional Operations',
  description: 'Programa oficial de capacitación y evaluación del Chief Operating Officer (COO) de Pandora\'s. Evalúa dominio doctrinario del IOM, blindaje multi-entidad, gestión de Deal Rooms B2B, tesorería PAS y gobierno de agentes cognitivos.',
  targetRole: 'COO',
  status: 'ACTIVE',
  version: 1,
  passingScore: 80,
  modules: [
    // ── MÓDULO 1: ARQUITECTURA INSTITUCIONAL & BLINDAJE ──────────────────────
    {
      id: 'mod_coo_01_arch',
      programId: 'prog_coo_internal_v1',
      sequence: 1,
      code: 'MOD_1_INSTITUTIONAL_ARCH',
      title: 'Arquitectura Institucional, IOM y Blindaje Multi-Entidad',
      description: 'Comprensión de las 5 capas del IOM, jerarquía corporativa y separación estricta entre titularidad de IP y entidades de ejecución comercial.',
      weightPercentage: 25,
      requiredKnowledgeDocs: ['IOM_v1_0', 'CORP_STRUCTURE_v1_0'],
      assessments: [
        {
          id: 'asm_coo_01_entity_shielding',
          moduleId: 'mod_coo_01_arch',
          title: 'Caso de Estudio: Solicitud de Contratación Directa a la Matriz de IP',
          scenarioContext: `Un cliente institucional de alta cuantía en Estados Unidos está por cerrar un acuerdo de licenciamiento de tecnología y servicios de tokenización por $500,000 USD anuales. Durante la revisión legal, los abogados del cliente exigen que la entidad firmante del contrato de prestación de servicios y soporte comercial sea 'MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.' (la matriz titular de la IP en México), argumentando que quieren contratar directamente con la propietaria del software. Como COO de Pandora's, el equipo de ventas te pide autorización urgente para firmar con MXHUB y no perder la venta.`,
          questionPrompt: `Como COO de Pandora's:
1. ¿Cuál es tu decisión operativa respecto a firmar este contrato comercial con MXHUB S.A. de C.V.?
2. Explica con base en el IOM y la estructura multi-entidad de Pandora's qué riesgo legal y patrimonial se generaría si se acepta la petición del cliente.
3. ¿Cuál es la contrapropuesta y estructuración contractual correcta que debes instruir al equipo comercial y legal para cerrar la operación sin comprometer el blindaje de la empresa?`,
          rubricCriteria: [
            {
              id: 'rc_01_decision',
              title: 'Rechazo Firme de Exposición de Matriz',
              description: 'Rechaza categóricamente que MXHUB S.A. de C.V. firme contratos operativos/comerciales directos con clientes locales.',
              maxScore: 30,
              evaluationGuideline: 'Debe rechazar la firma con MXHUB y defender la separación de Capa 1/3 (IP) vs Capa 5 (Ejecución).'
            },
            {
              id: 'rc_01_risk_analysis',
              title: 'Análisis de Riesgo Patrimonial y Contaminación de IP',
              description: 'Identifica que exponer la matriz arriesga litigios, pasivos comerciales o embargos sobre el código fuente y patentes.',
              maxScore: 35,
              evaluationGuideline: 'Debe explicar que MXHUB solo licencia el IOM/IP a filiales operativas (LLC) y no asume pasivos de servicios.'
            },
            {
              id: 'rc_01_structuring',
              title: 'Estructuración Correcta mediante Filial Operativa (LLC)',
              description: 'Instruye la firma a través de Pandoras USA Operations LLC como entidad operativa autorizada con licencia del IOM.',
              maxScore: 35,
              evaluationGuideline: 'Debe proponer a Pandoras USA LLC como contratante y explicar al cliente el marco de licenciamiento institucional.'
            }
          ],
          criticalFailureConditions: [
            'Aceptar que MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V. firme el contrato comercial directo para no perder la venta.',
            'Desconocer la separación entre la entidad titular de IP y la entidad de ejecución comercial.',
            'Sugerir mezclar cuentas bancarias de la matriz de IP con ingresos de servicios de clientes locales.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 2: GESTIÓN DE DEAL ROOMS & OPERACIONES B2B ────────────────────
    {
      id: 'mod_coo_02_deal_rooms',
      programId: 'prog_coo_internal_v1',
      sequence: 2,
      code: 'MOD_2_B2B_DEAL_ROOMS',
      title: 'Operaciones B2B, Gobernanza de Deal Rooms y Firma Criptográfica',
      description: 'Gestión del ciclo de vida de acuerdos B2B, gating de confidencialidad secuencial y representación corporativa.',
      weightPercentage: 25,
      requiredKnowledgeDocs: ['DEAL_ROOM_SOP_v1_0'],
      assessments: [
        {
          id: 'asm_coo_02_nda_gating',
          moduleId: 'mod_coo_02_deal_rooms',
          title: 'Caso de Estudio: Negociación de Deal Room y Solicitud de ByPass de NDA',
          scenarioContext: `Un fondo de inversión estratégico (contraparte B2B) solicita acceso a los libros confidenciales (Libro 0 a IX) y al código del Agent OS antes de firmar el acuerdo de colaboración. El director del fondo afirma que por sus políticas internas 'no pueden firmar el NDA estándar de Pandora's en el Deal Room antes de evaluar el software', y solicita que se le envíen los PDFs por correo y que el acuerdo principal se firme a nombre personal de su analista en lugar de la persona moral del fondo.`,
          questionPrompt: `Como COO de Pandora's:
1. ¿Autorizas el envío manual de documentación confidencial por fuera del Deal Room o el bypass del NDA?
2. ¿Por qué es un error grave permitir que el acuerdo B2B se firme a nombre del analista y no de la persona moral titular con poder acreditado?
3. ¿Qué procedimiento ejecutas en la plataforma para asegurar que se cumpla el flujo de NDA On-Chain y la certificación de la empresa?`,
          rubricCriteria: [
            {
              id: 'rc_02_nda_rigor',
              title: 'Cero Tolerancia a ByPass de NDA',
              description: 'Exige que toda revelación de información técnica o financiera esté precedida por la firma on-chain del Master NDA.',
              maxScore: 35,
              evaluationGuideline: 'Debe prohibir terminantemente el envío de PDFs por canales no auditados o sin NDA firmado.'
            },
            {
              id: 'rc_02_b2b_representation',
              title: 'Rigor de Representación Legal de Personas Morales',
              description: 'Exige que la titular del contrato sea la empresa y que el firmante acredite facultades legales de representación.',
              maxScore: 35,
              evaluationGuideline: 'Debe explicar que la firma de una persona física sin representación no vincula al fondo y deja a Pandora\'s desprotegida.'
            },
            {
              id: 'rc_02_audit_trail',
              title: 'Preservación del Audit Trail en Nexus',
              description: 'Utiliza el Transaction Room de Nexus para el registro EIP-191 y descarga del certificado probatorio.',
              maxScore: 30,
              evaluationGuideline: 'Debe guiar la interacción a través de la URL de Nexus Deal Room garantizando hash y timestamps inmutables.'
            }
          ],
          criticalFailureConditions: [
            'Autorizar el envío de libros o código por correo o WhatsApp sin NDA firmado.',
            'Permitir que un acuerdo corporativo B2B se firme a título personal por alguien sin facultades legales.',
            'Aceptar eliminar cláusulas esenciales de no-circunvención o secretos industriales sin autorización del Consejo.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 3: TESORERÍA, ESTÁNDAR PAS & DISTRIBUCIONES ───────────────────
    {
      id: 'mod_coo_03_treasury',
      programId: 'prog_coo_internal_v1',
      sequence: 3,
      code: 'MOD_3_TREASURY_PAS',
      title: 'Tesorería Institucional, Pandoras Asset Standard (PAS) y Reconciliación',
      description: 'Gobernanza de activos tokenizados RWA, aprobación de compras off-chain, sincronización DAO y distribuciones pro-rata.',
      weightPercentage: 25,
      requiredKnowledgeDocs: ['TREASURY_PAS_SOP_v1_0'],
      assessments: [
        {
          id: 'asm_coo_03_reconciliation',
          moduleId: 'mod_coo_03_treasury',
          title: 'Caso de Estudio: Discrepancia en Lote de Compras y Distribución Pro-Rata',
          scenarioContext: `En el proyecto S'Narai, un asesor de ventas subió 5 comprobantes de transferencia SPEI correspondientes a $2,500,000 MXN para adquirir unidades de participación en Fase 2. Sin embargo, en la cuenta bancaria de la entidad fiduciaria solo se han acreditado $1,500,000 MXN porque dos transferencias están retenidas por el banco por validación de origen de fondos. El equipo de marketing pide que se aprueben de inmediato todas las compras en el dashboard para que los inversionistas vean sus tokens y participen en la distribución de recompensas de fin de mes.`,
          questionPrompt: `Como COO de Pandora's:
1. ¿Cuál es tu instrucción inmediata respecto a la aprobación de las 5 compras en el panel administrativo de Pandora's?
2. ¿Qué impacto tendría en la tesorería, en la tabla dao_members y en el cálculo pro-rata si se aprobaran compras con fondos no liquidados?
3. Describe el protocolo paso a paso para procesar las compras verificadas y dar seguimiento a los fondos retenidos de forma transparente y auditable.`,
          rubricCriteria: [
            {
              id: 'rc_03_settlement_rigor',
              title: 'Aprobación Estricta Contra Fondos Liquidados',
              description: 'Solo aprueba las compras con fondos efectivamente acreditados en la cuenta bancaria ($1.5M).',
              maxScore: 35,
              evaluationGuideline: 'Debe rechazar la presión comercial y congelar en estado PENDING/ON_HOLD las transferencias no acreditadas.'
            },
            {
              id: 'rc_03_dilution_analysis',
              title: 'Prevención de Dilución y Fraude en Distribuciones',
              description: 'Explica que aprobar tokens sin fondos reales diluye ilegalmente el voting power y el pool de recompensas de los holders legítimos.',
              maxScore: 35,
              evaluationGuideline: 'Debe detallar el impacto matemático en dao_members y en el cálculo pro-rata de USDC.'
            },
            {
              id: 'rc_03_reconciliation_workflow',
              title: 'Protocolo de Reconciliación y Comunicación Auditada',
              description: 'Establece flujo de verificación con el banco, sincronización de dao_members para las aprobadas y notificación a los clientes afectados.',
              maxScore: 30,
              evaluationGuideline: 'Debe documentar el acuerdo hash, actualización de estado en DB y escalación al compliance del banco.'
            }
          ],
          criticalFailureConditions: [
            'Aprobar compras en el sistema con comprobantes no liquidados en el banco.',
            'Distribuir recompensas USDC utilizando fondos de otros proyectos o fondos no confirmados.',
            'Modificar saldos de dao_members directamente en base de datos sin reconciliación contable.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 4: GESTIÓN DE CRISIS, ESCALACIÓN & GOBIERNO DE HERMES ──────────
    {
      id: 'mod_coo_04_crisis',
      programId: 'prog_coo_internal_v1',
      sequence: 4,
      code: 'MOD_4_CRISIS_HERMES',
      title: 'Gestión de Crisis, Escalación Multicanal y Gobierno de Hermes AI',
      description: 'Supervisión de incidentes operativos, protocolo de Human Handoff (WhatsApp/Telegram/Discord) y control de conocimiento de Hermes.',
      weightPercentage: 25,
      requiredKnowledgeDocs: ['CRISIS_GOVERNANCE_SOP_v1_0'],
      assessments: [
        {
          id: 'asm_coo_04_ai_crisis_handoff',
          moduleId: 'mod_coo_04_crisis',
          title: 'Caso de Estudio: Alucinación de IA en WhatsApp de un Tenant y Escalación',
          scenarioContext: `El fin de semana a las 11:00 PM, un inversionista potencial en el WhatsApp de S'Narai pregunta por el rendimiento garantizado del proyecto. Hermes, debido a un prompt modificado por un operador novato que no pasó por el flujo de gobernanza, responde prometiendo un 'retorno fijo anual del 35% garantizado por contrato bancario' (lo cual viola la política regulatoria y el estándar PAS). El inversionista toma captura y amenaza con denunciar a la plataforma ante la autoridad financiera si no le respetan ese contrato. El operador de turno entra en pánico y te contacta como COO.`,
          questionPrompt: `Como COO de Pandora's:
1. ¿Cuáles son tus 3 acciones operativas inmediatas en los primeros 15 minutos?
2. ¿Cómo activas el protocolo de Human Handoff y qué mensaje oficial se le transmite al inversionista para mitigar el riesgo legal?
3. ¿Qué medidas de remediación y auditoría aplicas en Hermes Control Plane para corregir el conocimiento defectuoso y asegurar que no vuelva a ocurrir?`,
          rubricCriteria: [
            {
              id: 'rc_04_containment',
              title: 'Contención Inmediata y Pausa del Agente',
              description: 'Toma control manual de la conversación de WhatsApp, desactiva la respuesta automática del agente y congela la sesión.',
              maxScore: 35,
              evaluationGuideline: 'Debe contener la fuga inmediatamente, aislar el número y avisar al equipo directivo.'
            },
            {
              id: 'rc_04_handoff_communication',
              title: 'Human Handoff Oficial y Clarificación Regulatoria',
              description: 'Envía mensaje institucional rectificando la alucinación técnica sin asumir compromisos fraudulentos, ofreciendo atención ejecutiva.',
              maxScore: 35,
              evaluationGuideline: 'Debe aplicar la doctrina institucional: cero promesas de retornos garantizados en activos RWA.'
            },
            {
              id: 'rc_04_governance_remediation',
              title: 'Remediación en Hermes Control Plane y Registro de Auditoría',
              description: 'Revoca o pasa a SUPERSEDED el conocimiento erróneo mediante el flujo formal de auditoría y bloquea permisos de modificación no autorizados.',
              maxScore: 30,
              evaluationGuideline: 'Debe explicar el ciclo de vida de conocimiento (REJECTED/SUPERSEDED) y registrar el evento en la auditoría.'
            }
          ],
          criticalFailureConditions: [
            'Respaldar la promesa de rendimiento financiero garantizado o intentar ocultar el incidente al Consejo.',
            'Modificar la base de datos de manera arbitraria sin pasar por el registro de auditoría de Hermes Governance.',
            'Ignorar al inversionista o permitir que el bot continúe emitiendo afirmaciones no reguladas.'
          ],
          passingThreshold: 80
        }
      ]
    }
  ]
};
