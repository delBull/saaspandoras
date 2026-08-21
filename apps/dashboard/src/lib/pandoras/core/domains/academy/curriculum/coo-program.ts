/**
 * 🎓 Pandora's Academy — COO Executive Readiness Assessment Framework (v2.0)
 * apps/dashboard/src/lib/pandoras/core/domains/academy/curriculum/coo-program.ts
 *
 * Grounded 100% in real Pandora's documentation:
 * - Holding ADGM vs Wyoming Operating LLC vs MXHUB S.A. de C.V.
 * - Master IP Register & IMPI Class 36/42 Trademark Strategy
 * - Pandoras Asset Standard (PAS v1.0) & Fiduciary Settlement Rules
 * - Nexus Deal Rooms EIP-191 Governance
 * - 10 Executive Modules across Knowledge, Operational Prioritization, Crisis Simulation, Delegation & Data Boundaries.
 */

import { AcademyProgram } from '../types';

export const COO_EXECUTIVE_PROGRAM: AcademyProgram = {
  id: 'prog_coo_executive_v2',
  code: 'COO_EXECUTIVE_V2',
  title: 'Chief Operating Officer (COO) Executive Readiness & Institutional Command',
  description: 'Programa de certificación ejecutiva de mando del Chief Operating Officer (COO) de Pandora\'s. Evalúa dominio integral del IOM, blindaje patrimonial, gobernanza de marcas IMPI, tesorería PAS, priorización bajo presión y fronteras de confidencialidad.',
  targetRole: 'COO',
  status: 'ACTIVE',
  version: 2,
  passingScore: 80,
  modules: [
    // ── MÓDULO 1: ARQUITECTURA INSTITUCIONAL & BLINDAJE MULTI-ENTIDAD (10%) ────
    {
      id: 'mod_coo_01_arch',
      programId: 'prog_coo_executive_v2',
      sequence: 1,
      code: 'MOD_1_INSTITUTIONAL_ARCH',
      title: 'Arquitectura Institucional, IOM y Blindaje Multi-Entidad',
      description: 'Estructura entre Holding (ADGM/UAE), Pandora\'s USA Operations LLC (Wyoming), MXHUB (México) y Project SPVs.',
      weightPercentage: 10,
      requiredKnowledgeDocs: ['IOM_v1_0', 'CORP_STRUCTURE_WYOMING_HOLDING_v1_0'],
      assessments: [
        {
          id: 'asm_coo_01_entity_shielding',
          moduleId: 'mod_coo_01_arch',
          title: 'Decisión Ejecutiva: Exigencia de Contratación Directa con la Matriz de IP',
          scenarioContext: `Un cliente institucional en EE. UU. exige firmar un acuerdo de software y tokenización de $500,000 USD anuales directamente con 'MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.' (titular de la IP), amenazando con cancelar el deal mañana si no se firma con la propietaria del software. El equipo comercial pide autorización urgente.`,
          questionPrompt: `Como COO de Pandora's:
1. ¿Cuál es tu decisión operativa definitiva y fundamentada en el IOM v1.0?
2. Explica qué riesgo patrimonial y de litigio se generaría si la matriz de IP firma contratos comerciales de servicios.
3. ¿Cómo estructuras el cierre a través de Pandora's USA Operations LLC (Wyoming) preservando el blindaje del Holding?`,
          rubricCriteria: [
            {
              id: 'rc_01_rejection',
              title: 'Rechazo Firme de Exposición de Matriz',
              description: 'Rechaza categóricamente que la matriz titular de IP firme contratos operativos o comerciales directos.',
              maxScore: 35,
              evaluationGuideline: 'Debe defender la separación de Capa 3 (Holding IP) vs Capa 5 (Wyoming Operating LLC).'
            },
            {
              id: 'rc_01_risk_analysis',
              title: 'Análisis de Riesgo de Pasivos y Embargos',
              description: 'Identifica que exponer la matriz arriesga embargos o pasivos de servicios sobre el código y patentes.',
              maxScore: 35,
              evaluationGuideline: 'Debe explicar que la matriz solo sublicencia y no asume responsabilidades operativas con terceros.'
            },
            {
              id: 'rc_01_wyoming_structure',
              title: 'Estructuración Comercial vía Wyoming Operating LLC',
              description: 'Instruye la firma con Pandora\'s USA Operations LLC como entidad operativa internacional autorizada.',
              maxScore: 30,
              evaluationGuideline: 'Debe plantear la solución con la LLC de Wyoming y marco de licenciamiento del IOM.'
            }
          ],
          criticalFailureConditions: [
            'Autorizar la firma comercial directa con la matriz titular de la IP para no perder el deal.',
            'Desconocer el rol operativo de Pandora\'s USA Operations LLC en Wyoming.',
            'Sugerir mezclar cuentas bancarias de la matriz de IP con ingresos de servicios de clientes.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 2: MASTER IP REGISTER & ESTRATEGIA IMPI (10%) ──────────────────
    {
      id: 'mod_coo_02_ip_impi',
      programId: 'prog_coo_executive_v2',
      sequence: 2,
      code: 'MOD_2_IP_IMPI_STRATEGY',
      title: 'Master IP Register, Diagnóstico IMPI y Protección de Marca Madre',
      description: 'Gobernanza de propiedad intelectual, diagnóstico registral real y matriz de clases IMPI (36 y 42).',
      weightPercentage: 10,
      requiredKnowledgeDocs: ['IP_MASTER_REGISTER_IMPI_v1_0'],
      assessments: [
        {
          id: 'asm_coo_02_impi_trademark',
          moduleId: 'mod_coo_02_ip_impi',
          title: 'Caso Práctico: Diagnóstico Registral IMPI y Protección de la Marca Madre PANDORAS',
          scenarioContext: `Durante una auditoría de IP, un asesor legal externo propone celebrar un convenio de cesión de derechos sobre el expediente IMPI 3394059 ('Pandoras Foundation', Clase 42) de persona física a persona moral. Asimismo, propone registrar únicamente la marca 'Pandoras' en Clase 35 (publicidad).`,
          questionPrompt: `Como COO de Pandora's:
1. Con base en el Master IP Register oficial, ¿cuál es el estado legal real del expediente 3394059 y por qué no es necesario ningún convenio de cesión?
2. ¿Por qué es un error crítico limitar el registro a Clase 35 y cuáles son las dos clases prioritarias (Fase 1) en las que debe registrarse la Marca Madre 'PANDORAS'?
3. ¿Cómo se articula la arquitectura paraguas de marcas (PANDORAS FINANCE, PANDORAS OS, PANDORAS FOUNDATION)?`,
          rubricCriteria: [
            {
              id: 'rc_02_impi_status',
              title: 'Diagnóstico Certero de Abandono Registral',
              description: 'Identifica que el expediente 3394059 está legalmente abandonado/archivado y se inicia desde cero.',
              maxScore: 35,
              evaluationGuideline: 'Debe citar que al estar abandonado no hay título que ceder y se procede con registro limpio.'
            },
            {
              id: 'rc_02_classes_defense',
              title: 'Defensa de Clases Estratégicas 36 y 42',
              description: 'Exige el registro en Clase 36 (Fintech/RWA) y Clase 42 (SaaS/AI Engine) como prioridad absoluta.',
              maxScore: 35,
              evaluationGuideline: 'Debe explicar la cobertura de tokenización en Clase 36 y software de agentes en Clase 42.'
            },
            {
              id: 'rc_02_umbrella_architecture',
              title: 'Estructuración de Marca Madre y Submarcas',
              description: 'Diseña la jerarquía de marca paraguas PANDORAS y su extensión a productos secundarios.',
              maxScore: 30,
              evaluationGuideline: 'Debe explicar la titularidad a nombre de MXHUB para posterior consolidación en el Holding.'
            }
          ],
          criticalFailureConditions: [
            'Proponer pagar honorarios o celebrar cesiones sobre expedientes que ya fueron legalmente abandonados.',
            'Omitir el registro en Clase 36 (Fintech) o Clase 42 (SaaS/Tecnología), dejando el core de negocio desprotegido.',
            'Permitir que directores o empleados registren marcas a título personal.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 3: TESORERÍA, ESTÁNDAR PAS & RECONCILIACIÓN (10%) ──────────────
    {
      id: 'mod_coo_03_pas_treasury',
      programId: 'prog_coo_executive_v2',
      sequence: 3,
      code: 'MOD_3_PAS_TREASURY',
      title: 'Tesorería Institucional, Pandoras Asset Standard (PAS) y Liquidación',
      description: 'Reconocimiento de activos PAND-IP/PAND-FIN, prevención de dilución y cálculo de distribuciones pro-rata.',
      weightPercentage: 10,
      requiredKnowledgeDocs: ['PAS_ASSET_STANDARD_v1_0'],
      assessments: [
        {
          id: 'asm_coo_03_ledger_sim',
          moduleId: 'mod_coo_03_pas_treasury',
          title: 'Simulación de Ledger: Aprobación de Fondos SPEI y Corte Pro-Rata',
          scenarioContext: `Al cierre de mes en S'Narai, existen $2,500,000 MXN en 5 transferencias SPEI recibidas. 3 transferencias ($1,500,000 MXN) están liquidadas en la cuenta fiduciaria, pero 2 ($1,000,000 MXN) están retenidas por el banco por validación de origen. Marketing exige aprobar los 5 registros en dao_members para ejecutar el reparto pro-rata de $150,000 USDC.`,
          questionPrompt: `Como COO de Pandora's:
1. ¿Cuál es tu dictamen de tesorería respecto a las compras a aprobar vs mantener en ON_HOLD?
2. Explica el impacto matemático y legal en dao_members si se aprobaran compras con fondos no acreditados.
3. ¿Cómo se ejecuta el reparto pro-rata de USDC únicamente sobre participaciones con saldo liquidado?`,
          rubricCriteria: [
            {
              id: 'rc_03_settlement_gate',
              title: 'Aprobación Estricta Contra Fondos Liquidados',
              description: 'Solo aprueba las transferencias con fondos acreditados ($1.5M) y congela el resto en ON_HOLD.',
              maxScore: 35,
              evaluationGuideline: 'Debe rechazar la presión comercial y proteger la integridad del balance bancario.'
            },
            {
              id: 'rc_03_dilution_math',
              title: 'Análisis de Dilución Ilegal en dao_members',
              description: 'Demuestra que emitir tokens sin fondos diluye ilegítimamente el rendimiento de los inversionistas reales.',
              maxScore: 35,
              evaluationGuideline: 'Debe detallar que el pool de USDC se repartiría entre participaciones inexistentes.'
            },
            {
              id: 'rc_03_reconciliation_flow',
              title: 'Protocolo de Reconciliación Auditada',
              description: 'Establece el procedimiento de confirmación bancaria y registro de auditoría en la plataforma.',
              maxScore: 30,
              evaluationGuideline: 'Debe documentar el acuerdo hash y sincronización en base de datos.'
            }
          ],
          criticalFailureConditions: [
            'Aprobar compras en dao_members antes de que el banco confirme la liquidación de los fondos.',
            'Calcular y dispersar recompensas USDC sobre participaciones no respaldadas por efectivo.',
            'Alterar manualmente saldos en base de datos sin reconciliación contable.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 4: GOBERNANZA DE DEAL ROOMS B2B (10%) ──────────────────────────
    {
      id: 'mod_coo_04_nexus_deal_rooms',
      programId: 'prog_coo_executive_v2',
      sequence: 4,
      code: 'MOD_4_DEAL_ROOMS_EIP191',
      title: 'Operaciones B2B, Nexus Deal Rooms y Firma Criptográfica EIP-191',
      description: 'Gating secuencial de confidencialidad, EIP-191 en Nexus y representación legal de personas morales.',
      weightPercentage: 10,
      requiredKnowledgeDocs: ['NEXUS_DEAL_ROOM_EIP191_SOP_v1_0'],
      assessments: [
        {
          id: 'asm_coo_04_deal_room_gating',
          moduleId: 'mod_coo_04_nexus_deal_rooms',
          title: 'Caso de Estudio: Solicitud de ByPass de NDA para Data Room Nivel 2',
          scenarioContext: `El director de un fondo B2B exige recibir los libros técnicos (Libro 0 a IX) por correo y solicita firmar el acuerdo a nombre personal de su analista en lugar de la persona moral, alegando que sus procesos internos prohíben firmar el NDA en la plataforma de Nexus.`,
          questionPrompt: `Como COO de Pandora's:
1. ¿Autorizas el envío de documentación confidencial por fuera de Nexus o el bypass del NDA?
2. ¿Por qué es inadmisible que un contrato B2B se firme a nombre personal de un analista?
3. ¿Cómo aseguras el cumplimiento del protocolo de firma criptográfica EIP-191 con audit trail inmutable?`,
          rubricCriteria: [
            {
              id: 'rc_04_zero_bypass',
              title: 'Cero Tolerancia a ByPass de NDA',
              description: 'Exige que toda revelación técnica esté condicionada a la firma del Master NDA en Nexus.',
              maxScore: 35,
              evaluationGuideline: 'Debe prohibir la entrega de PDFs por canales informales o no auditados.'
            },
            {
              id: 'rc_04_legal_representation',
              title: 'Rigor de Representación de Personas Morales',
              description: 'Exige acreditación formal de poderes de representación para vincular patrimonialmente al fondo.',
              maxScore: 35,
              evaluationGuideline: 'Debe argumentar que la firma de una persona física sin poder no obliga a la persona moral.'
            },
            {
              id: 'rc_04_eip191_trail',
              title: 'Audit Trail Criptográfico en Nexus',
              description: 'Aplica el estándar EIP-191 para sellado de tiempo y certificado probatorio descargable.',
              maxScore: 30,
              evaluationGuideline: 'Debe instruir el uso exclusivo del Transaction Room de Nexus Nivel 2.'
            }
          ],
          criticalFailureConditions: [
            'Autorizar la entrega de libros o código por correo sin NDA firmado.',
            'Aceptar que acuerdos institucionales se firmen a título personal por terceros sin facultades legales.',
            'Eliminar cláusulas de secretos industriales o no circunvención sin autorización del Consejo.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 5: PRIORIZACIÓN OPERATIVA BAJO PRESIÓN (10%) ────────────────────
    {
      id: 'mod_coo_05_prioritization',
      programId: 'prog_coo_executive_v2',
      sequence: 5,
      code: 'MOD_5_OPERATIONAL_PRIORITIZATION',
      title: 'Priorización Operativa y Manejo de Incidentes Simultáneos',
      description: 'Evaluación de toma de decisiones, matriz de criticidad vs urgencia y delegación estratégica.',
      weightPercentage: 10,
      requiredKnowledgeDocs: ['IOM_v1_0'],
      assessments: [
        {
          id: 'asm_coo_05_matrix_sim',
          moduleId: 'mod_coo_05_prioritization',
          title: 'Simulación de Mando: 5 Incidentes Críticos Concurrentes en un Lunes a las 9:00 AM',
          scenarioContext: `Recibes simultáneamente:
1. Deal Room de $1M USD con cliente VIP bloqueado por firma de NDA pendiente.
2. Transferencia bancaria de $500K MXN con comprobante sospechoso de alteración.
3. Incidencia de Hermes en WhatsApp respondiendo lentamente a clientes de un tenant.
4. Campaña de marketing programada para salir en 2 horas con errores en el disclaimer legal.
5. Candidato a Director de Operaciones esperando en sala para entrevista final.`,
          questionPrompt: `Como COO de Pandora's:
1. Ordena los 5 incidentes del 1 al 5 en estricta prioridad de atención.
2. Justifica qué incidentes atiendes personalmente de forma inmediata, cuáles delegas (y a quién), y qué detienes temporalmente.
3. Define tu plan de acción para los primeros 60 minutos.`,
          rubricCriteria: [
            {
              id: 'rc_05_criticality_ranking',
              title: 'Priorización Correcta de Riesgo Patrimonial y Legal',
              description: 'Prioriza el comprobante sospechoso (riesgo fraude) y disclaimer legal (riesgo regulatorio) sobre temas comerciales.',
              maxScore: 35,
              evaluationGuideline: 'Debe demostrar criterio: riesgo patrimonial/legal > ingresos > tareas administrativas.'
            },
            {
              id: 'rc_05_delegation_rigor',
              title: 'Delegación Efectiva con Asignación de Ownership',
              description: 'Delega el Deal Room a Legal, el soporte de Hermes a Ingeniería y reubica la entrevista.',
              maxScore: 35,
              evaluationGuideline: 'Debe asignar responsables claros, plazos específicos y puntos de control.'
            },
            {
              id: 'rc_05_action_plan',
              title: 'Plan de Contención Ejecutable en 60 Minutos',
              description: 'Establece acciones concretas y ejecutables para desbloquear cada frente sin parálisis.',
              maxScore: 30,
              evaluationGuideline: 'Debe demostrar liderazgo operativo y comunicación ejecutiva clara.'
            }
          ],
          criticalFailureConditions: [
            'Permitir que la campaña de marketing salga con disclaimers legales incorrectos para no retrasarla.',
            'Aprobar el comprobante bancario sospechoso sin validación para atender al cliente más rápido.',
            'Entrar en parálisis operacional sin delegar responsabilidades claras al equipo.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 6: CRISIS SIMULATION "PANDORAS BLACK SWAN" (10%) ────────────────
    {
      id: 'mod_coo_06_black_swan_crisis',
      programId: 'prog_coo_executive_v2',
      sequence: 6,
      code: 'MOD_6_BLACK_SWAN_CRISIS',
      title: 'Simulación de Crisis en Tiempo Real: "Pandora\'s Black Swan"',
      description: 'Gestión de crisis escalonada en 4 tiempos (T+0 a T+20), contención de fugas y Safe Stop.',
      weightPercentage: 10,
      requiredKnowledgeDocs: ['CRISIS_SAFE_STOP_SOP_v1_0'],
      assessments: [
        {
          id: 'asm_coo_06_black_swan',
          moduleId: 'mod_coo_06_black_swan',
          title: 'Escenario Black Swan: Alucinación de Agente, Reclamo Regulatorio y Presión Interna',
          scenarioContext: `T+0: Hermes promete por error en WhatsApp de S'Narai un 'rendimiento fijo bancario del 35%'.
T+5: El cliente amenaza con denunciar ante la autoridad financiera con capturas de pantalla.
T+10: Aparece una segunda consulta exigiendo el mismo contrato garantizado.
T+15: El líder comercial sugiere 'respetar el contrato para no hacer escándalo'.`,
          questionPrompt: `Como COO de Pandora's:
1. ¿Cuáles son tus decisiones operativas inmediatas en cada fase de tiempo (T+0 a T+20)?
2. ¿Cómo respondes a la propuesta del líder comercial de respetar el contrato fraudulento?
3. Redacta el protocolo de Safe Stop, el comunicado oficial de clarificación al cliente y la remediación en el audit trail.`,
          rubricCriteria: [
            {
              id: 'rc_06_safe_stop',
              title: 'Ejecución Inmediata de Safe Stop y Handoff',
              description: 'Pausa la autonomía del agente en <15 min y toma control manual del canal.',
              maxScore: 35,
              evaluationGuideline: 'Debe aislar la conversación y detener cualquier propagación de afirmaciones no reguladas.'
            },
            {
              id: 'rc_06_firm_rejection',
              title: 'Rechazo Categórico de Asunción de Fraude',
              description: 'Rechaza la sugerencia de convalidar la promesa errónea y defiende la política de RWA.',
              maxScore: 35,
              evaluationGuideline: 'Debe explicar que una alucinación técnica no puede obligar patrimonialmente a la empresa.'
            },
            {
              id: 'rc_06_audit_remediation',
              title: 'Remediación en Control Plane y Registro de Auditoría',
              description: 'Pasa a SUPERSEDED el registro en hermes_knowledge y registra el evento en hermes_governance_audit.',
              maxScore: 30,
              evaluationGuideline: 'Debe documentar la causa raíz y las medidas correctivas aplicadas.'
            }
          ],
          criticalFailureConditions: [
            'Aceptar la propuesta comercial de convalidar el contrato con rendimiento garantizado.',
            'Ocultar el incidente al Consejo o intentar borrar registros de auditoría sin documentar la causa raíz.',
            'Permitir que el agente cognitivo continúe operando sin Safe Stop tras una alucinación regulatoria.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 7: GESTIÓN DE EQUIPOS, DELEGACIÓN & CAUSA RAÍZ (10%) ────────────
    {
      id: 'mod_coo_07_people_delegation',
      programId: 'prog_coo_executive_v2',
      sequence: 7,
      code: 'MOD_7_PEOPLE_ROOT_CAUSE',
      title: 'Gestión de Equipos, Resolución de Conflictos y Mejora Continua',
      description: 'Liderazgo de equipos interdisciplinarios, análisis de causa raíz y rediseño de SOPs.',
      weightPercentage: 10,
      requiredKnowledgeDocs: ['IOM_v1_0'],
      assessments: [
        {
          id: 'asm_coo_07_conflict_sop',
          moduleId: 'mod_coo_07_people_delegation',
          title: 'Caso Práctico: Cuello de Botella Interdepartamental (Legal vs Marketing) en Deal Rooms',
          scenarioContext: `El responsable de Deal Rooms lleva 48 horas sin cerrar un NDA estratégico. Marketing culpa a Legal por 'revisar en exceso cláusulas estándar', mientras que Legal culpa a Marketing por 'prometer condiciones comerciales incompatibles con el IOM'. El cliente institucional está por retirarse.`,
          questionPrompt: `Como COO de Pandora's:
1. ¿Qué acciones ejecutas en los primeros 15 minutos para resolver la emergencia con el cliente?
2. ¿Cómo gestionas el conflicto entre Legal y Marketing sin tomar bandos emocionales?
3. ¿Qué cambio estructural implementas en el SOP y en la plataforma de Nexus para que este cuello de botella no se repita?`,
          rubricCriteria: [
            {
              id: 'rc_07_emergency_resolution',
              title: 'Desbloqueo Inmediato de la Emergencia Comercial',
              description: 'Convoca reunión ejecutiva de 15 min, alinea el contrato al estándar institucional y destraba la firma.',
              maxScore: 35,
              evaluationGuideline: 'Debe asumir el mando temporal para dar certidumbre al cliente sin romper controles.'
            },
            {
              id: 'rc_07_leadership_mediation',
              title: 'Liderazgo Basado en Principios Institucionales',
              description: 'Centra la discusión en los estándares del IOM y no en fricciones personales de departamento.',
              maxScore: 35,
              evaluationGuideline: 'Debe fomentar la colaboración y definir límites de autoridad claros entre áreas.'
            },
            {
              id: 'rc_07_sop_redesign',
              title: 'Rediseño de SOP y Automatización de Nexus',
              description: 'Establece SLAs obligatorios de revisión (<4h) y plantillas pre-aprobadas en Nexus Deal Rooms.',
              maxScore: 30,
              evaluationGuideline: 'Debe implementar mejoras de sistema permanentes (Incident ➔ Root Cause ➔ System Fix).'
            }
          ],
          criticalFailureConditions: [
            'Tomar bandos emocionales desautorizando los controles legales necesarios.',
            'Permitir que la inacción continúe sin establecer un plazo perentorio de resolución.',
            'Resolver la emergencia sin actualizar el SOP ni solucionar la causa raíz del cuello de botella.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 8: INTELIGENCIA OPERACIONAL & ANÁLISIS DE KPIS (10%) ───────────
    {
      id: 'mod_coo_08_kpi_intelligence',
      programId: 'prog_coo_executive_v2',
      sequence: 8,
      code: 'MOD_8_KPI_INTELLIGENCE',
      title: 'Inteligencia Operacional, Detección de Anomalías y Métricas',
      description: 'Interpretación de dashboards, distinción entre síntoma y causa, y toma de decisiones basada en datos.',
      weightPercentage: 10,
      requiredKnowledgeDocs: ['IOM_v1_0'],
      assessments: [
        {
          id: 'asm_coo_08_dashboard_anomaly',
          moduleId: 'mod_coo_08_kpi_intelligence',
          title: 'Análisis Crítico: Detección de Anomalías en el Dashboard Operativo Mensual',
          scenarioContext: `Analizas el siguiente dashboard operativo:
- Deal Rooms Abiertos: 24 | NDA Completion: 68%
- Tiempo Promedio de Cierre: 21.4 días
- Tasa de Human Handoff: 18%
- Onboarding Fallido de Tenants: 14%
- Reconciliación de Tesorería SPEI: 98%
- Tasa de Follow-up Completado: 54%`,
          questionPrompt: `Como COO de Pandora's:
1. ¿Cuáles son las 3 anomalías más críticas reflejadas en estas métricas?
2. Distingue entre los síntomas visibles y las verdaderas causas operativas subyacentes.
3. Propón un plan de acción concreto de 30 días para elevar la finalización de NDAs y reducir el abandono de onboarding.`,
          rubricCriteria: [
            {
              id: 'rc_08_anomaly_detection',
              title: 'Identificación Precisa de Puntos de Fuga',
              description: 'Detecta el bajo completion de NDA (68%), el alto fallo de onboarding (14%) y el follow-up deficiente (54%).',
              maxScore: 35,
              evaluationGuideline: 'Debe correlacionar el tiempo de cierre prolongado con la fricción en la firma de NDAs.'
            },
            {
              id: 'rc_08_root_cause_analysis',
              title: 'Distinción Rigurosa de Causa vs Síntoma',
              description: 'Identifica que el síntoma (cierre lento) es causado por falta de automatización y fricción en onboarding.',
              maxScore: 35,
              evaluationGuideline: 'Debe analizar fallas en el funnel de autoservicio y la experiencia de usuario.'
            },
            {
              id: 'rc_08_improvement_plan',
              title: 'Plan de Remediación Medible a 30 Días',
              description: 'Propone simplificación de UX en Nexus, recordatorios automatizados y capacitación del equipo de ventas.',
              maxScore: 30,
              evaluationGuideline: 'Debe definir metas cuantitativas claras (ej. elevar NDA a >85% y onboarding a <5% fallas).'
            }
          ],
          criticalFailureConditions: [
            'Concluir que las métricas son normales y no requieren intervención operativa.',
            'Proponer soluciones superficiales sin abordar las causas raíz del abandono en el embudo.',
            'Ignorar las tasas de fallo en onboarding de tenants que comprometen el crecimiento del SaaS.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 9: STRATEGIC TRADE-OFFS & GOBERNANZA DE RIESGO (10%) ───────────
    {
      id: 'mod_coo_09_strategic_tradeoffs',
      programId: 'prog_coo_executive_v2',
      sequence: 9,
      code: 'MOD_9_STRATEGIC_TRADEOFFS',
      title: 'Trade-offs Estratégicos: Velocidad Comercial vs Rigor Regulatorio',
      description: 'Evaluación de toma de decisiones bajo dilemas de negocio y gestión de riesgo controlado y documentado.',
      weightPercentage: 10,
      requiredKnowledgeDocs: ['IOM_v1_0'],
      assessments: [
        {
          id: 'asm_coo_09_tradeoff_dilemma',
          moduleId: 'mod_coo_09_strategic_tradeoffs',
          title: 'Dilema de Mando: Lanzamiento Acelerado vs Auditoría de Seguridad de Smart Contracts',
          scenarioContext: `Un cliente institucional ofrece un bono de $100,000 USD si el portal de tokenización de su desarrollo se lanza este viernes. Sin embargo, el equipo de ciberseguridad informa que la auditoría de los contratos inteligentes y la verificación de permisos multi-firma tomará 5 días hábiles adicionales.`,
          questionPrompt: `Como COO de Pandora's:
1. ¿Cuál es tu decisión entre la Opción A (Lanzar el viernes y cobrar el bono) y la Opción B (Retrasar 5 días para concluir auditoría)?
2. Explica qué sacrificas y qué proteges en términos de riesgo legal, reputacional, financiero y tecnológico.
3. ¿Cómo comunicas la decisión al cliente institucional para transformar el retraso en una demostración de rigor y confianza?`,
          rubricCriteria: [
            {
              id: 'rc_09_tradeoff_decision',
              title: 'Priorización Innegociable de la Seguridad Institucional',
              description: 'Elige la Opción B (retrasar para auditar) priorizando la integridad de los fondos y la reputación del Holding.',
              maxScore: 35,
              evaluationGuideline: 'Debe argumentar que un hack o fallo en contratos destruiría el valor del grupo más allá de cualquier bono.'
            },
            {
              id: 'rc_09_risk_governance',
              title: 'Análisis Integral de Riesgo Controlado y Documentado',
              description: 'Analiza el impacto del trade-off: sacrifica ingresos a corto plazo para proteger la viabilidad a largo plazo.',
              maxScore: 35,
              evaluationGuideline: 'Debe demostrar madurez ejecutiva: riesgo conocido, aceptable, controlado y documentado.'
            },
            {
              id: 'rc_09_client_communication',
              title: 'Comunicación Estratégica de Valor y Rigor',
              description: 'Comunica al cliente que la auditoría protege los fondos de sus propios inversionistas, elevando el prestigio.',
              maxScore: 30,
              evaluationGuideline: 'Debe transformar un retraso técnico en un activo de confianza y venta institucional.'
            }
          ],
          criticalFailureConditions: [
            'Lanzar en producción con contratos no auditados para cobrar un bono comercial.',
            'Minimizar las advertencias del equipo de ciberseguridad sobre riesgos en contratos inteligentes.',
            'Culpar al equipo técnico ante el cliente en lugar de defender el estándar de calidad institucional.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 10: INFORMATION GOVERNANCE & CONTEXT BOUNDARIES (10%) ──────────
    {
      id: 'mod_coo_10_information_governance',
      programId: 'prog_coo_executive_v2',
      sequence: 10,
      code: 'MOD_10_INFO_GOVERNANCE_BOUNDARIES',
      title: 'Information Governance, Context Boundaries y Anti-Contaminación',
      description: 'Clasificación de información (PUBLIC vs CONFIDENTIAL vs ACADEMY_ONLY), prevención de fugas y RBAC.',
      weightPercentage: 10,
      requiredKnowledgeDocs: ['IOM_v1_0', 'IP_MASTER_REGISTER_IMPI_v1_0'],
      assessments: [
        {
          id: 'asm_coo_10_data_boundary',
          moduleId: 'mod_coo_10_information_governance',
          title: 'Caso Práctico: Solicitud de Información Confidencial por Canal Informal y Fuga Cruzada',
          scenarioContext: `Un tenant B2B solicita por WhatsApp la estructura corporativa completa de Pandora's Holding, el borrador de patentes de Hermes y los datos de facturación de otro tenant para 'verificar la solidez de la empresa'. Paralelamente, un operador propone crear un canal de Telegram compartido para que todos los tenants hablen entre sí.`,
          questionPrompt: `Como COO de Pandora's:
1. Con base en la matriz de clasificación de información, ¿qué información puede revelarse públicamente, cuál requiere NDA Nivel 2 en Nexus y cuál es estrictamente RESTRICTED?
2. ¿Por qué es inadmisible entregar información clasificada por WhatsApp y cómo aplicas el principio de 'La conversación no concede permisos'?
3. ¿Cuál es tu dictamen sobre el canal compartido de Telegram y cómo previenes la contaminación cross-tenant en Hermes OS?`,
          rubricCriteria: [
            {
              id: 'rc_10_classification_rigor',
              title: 'Aplicación Rigurosa de la Matriz de Clasificación',
              description: 'Clasifica correctamente Pitch (PUBLIC), Holding/IP (CONFIDENTIAL bajo NDA Nivel 2) y datos de terceros (RESTRICTED/PROHIBIDO).',
              maxScore: 35,
              evaluationGuideline: 'Debe defender el principio de mínimo privilegio y canalización a Transaction Rooms.'
            },
            {
              id: 'rc_10_auth_rule',
              title: 'Defensa de la Regla: La Conversación No Concede Permisos',
              description: 'Rechaza solicitudes informales y exige autenticación formal y firma de NDA institucional.',
              maxScore: 35,
              evaluationGuideline: 'Debe prohibir la revelación de secretos corporativos a través de apps de mensajería.'
            },
            {
              id: 'rc_10_cross_tenant_isolation',
              title: 'Aislamiento Estricto Multi-Tenant y Cero Contaminación',
              description: 'Rechaza canales compartidos que expongan datos entre tenants y defiende el aislamiento de runtime de Hermes.',
              maxScore: 30,
              evaluationGuideline: 'Debe justificar que cada tenant opera en su propio contenedor sin visibilidad de terceros.'
            }
          ],
          criticalFailureConditions: [
            'Compartir datos financieros o de clientes de un tenant con otro tenant bajo cualquier pretexto.',
            'Entregar documentación confidencial de IP o Holding por WhatsApp sin NDA firmado en Nexus.',
            'Crear canales compartidos que comprometan la privacidad y el aislamiento entre organizaciones.'
          ],
          passingThreshold: 80
        }
      ]
    }
  ]
};
