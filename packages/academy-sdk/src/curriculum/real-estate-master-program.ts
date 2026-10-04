/**
 * 🎓 Pandora's Academy — Master Executive en Tokenización Inmobiliaria y Activos Reales (RWA)
 * apps/dashboard/src/lib/pandoras/core/domains/academy/curriculum/real-estate-master-program.ts
 *
 * Programa canónico de certificación de grado profesional para:
 * - Realtors Independientes & Brokers de Alto Patrimonio
 * - Agencias Inmobiliarias & Master Brokers
 * - Desarrolladores Inmobiliarios
 *
 * Grounded 100% en casos reales del Ecosistema Pandora's:
 * - S'Narai Residences & Sanctuary (Zona Dorada, Bucerías, Nayarit)
 * - Torre Vista Horizonte (Bucerías, Nayarit)
 * - Condominio Frente al Mar (Nuevo Vallarta, Nayarit)
 * - Estándar PAS v1.0, Bóvedas Fiduciarias, Bóveda de Recompra (Buyback Engine)
 */

import { AcademyProgram } from '../types';

export const REAL_ESTATE_MASTER_PROGRAM: AcademyProgram = {
  id: 'prog_rwa_real_estate_master_v1',
  code: 'RWA_REAL_ESTATE_MASTER_V1',
  title: 'Master Executive en Tokenización Inmobiliaria y Activos Reales (RWA)',
  description: 'Programa formativo y de validación socrática institucional. Capacita y certifica a realtors, agencias y desarrolladores en estructuración fiduciaria, ingeniería financiera dual, operación hotelera y auditoría RevPAR, tributación cross-border (USA/Canadá), cumplimiento AML/UIF, comercialización fraccional sin fricción cripto y cierre consultivo. Culmina con la adquisición de participación real en S\'Narai como tesis de inversión.',
  targetRole: 'RWA_REAL_ESTATE_SPECIALIST',
  status: 'ACTIVE',
  version: 2,
  passingScore: 85,
  modules: [
    // ── MÓDULO 1: ARQUITECTURA JURÍDICA, FIDEICOMISOS Y BLINDAJE REGISTRAL (14%) ────
    {
      id: 'mod_rwa_01_legal_structure',
      programId: 'prog_rwa_real_estate_master_v1',
      sequence: 1,
      code: 'MOD_1_LEGAL_FIDUCIARY_ARCH',
      title: 'Arquitectura Jurídica, Fideicomisos de Garantía y Blindaje Registral',
      description: 'Estructuración legal de activos tangibles: Fideicomiso de Administración y Garantía vs SPV (SAPI de C.V. / LLC de Wyoming), vinculación fehaciente con el Registro Público de la Propiedad y cumplimiento ante CNBV y Ley Fintech.',
      weightPercentage: 14,
      requiredKnowledgeDocs: ['RWA_FIDUCIARY_FRAMEWORK_v1_0', 'SNARAI_LEGAL_STRUCTURE_v1_0'],
      assessments: [
        {
          id: 'asm_rwa_01_fiduciary_shield',
          moduleId: 'mod_rwa_01_legal_structure',
          title: 'Caso Práctico: Desmontando la Objeción de "Criptomoneda vs Propiedad Real"',
          scenarioContext: `Un cliente patrimonial conservador con $250,000 USD para invertir te dice: "A mí no me vengan con criptomonedas ni bitcoins. Si yo pongo mi dinero en un desarrollo inmobiliario, quiero saber qué notaría tiene mi escritura y quién me garantiza que si la constructora quiebra yo no pierdo mi capital". Su abogado le recomendó abstenerse de cualquier 'token'.`,
          questionPrompt: `Como Especialista Certificado en Tokenización Inmobiliaria de Pandora's:
1. Explica la diferencia fiduciaria entre una criptomoneda volátil y un derecho de fideicomiso fraccional tokenizado (RWA) bajo el estándar PAS v1.0.
2. ¿Qué figura jurídica (Fideicomiso / SPV) ostenta la titularidad registral del inmueble y cómo está protegido el inversionista contra embargos de la constructora?
3. ¿Cuál es el rol de la escritura pública matriz y el contrato de custodia digital notariado que recibe el inversionista en su portal?`,
          rubricCriteria: [
            {
              id: 'rc_01_fiduciary_distinction',
              title: 'Distinción Rigurosa Cripto vs RWA Fiduciario',
              description: 'Diferencia con claridad absoluta el token como representación criptográfica de un derecho fideicomisario respaldado 1:1 por ladrillo y tierra real.',
              maxScore: 35,
              evaluationGuideline: 'Debe dejar claro que no es especulación ni token fungible sin respaldo; es copropiedad fiduciaria sobre un activo escriturado.'
            },
            {
              id: 'rc_01_bankruptcy_remoteness',
              title: 'Aislamiento de Quiebra (Bankruptcy Remoteness)',
              description: 'Explica el patrimonio autónomo del Fideicomiso de Administración y Garantía donde el bien sale del balance de la constructora.',
              maxScore: 35,
              evaluationGuideline: 'Debe argumentar que si la constructora quiebra, los acreedores no pueden tocar el inmueble porque está en patrimonio fideicomitido autónomo.'
            },
            {
              id: 'rc_01_notarial_certainty',
              title: 'Certeza Notarial y Trazabilidad Registral',
              description: 'Detalla cómo la escritura pública matriz en el Registro Público se vincula con los certificados digitales en IPFS y la gobernanza fiduciaria.',
              maxScore: 30,
              evaluationGuideline: 'Debe explicar la fe pública notarial y el acuerdo de derechos EIP-191 descargable con hash soberano.'
            }
          ],
          criticalFailureConditions: [
            'Afirmar que la tokenización sustituye a los notarios o al Registro Público de la Propiedad.',
            'Comparar el token con una criptomoneda de libre fluctuación o memecoin sin respaldo.',
            'Desconocer el concepto de patrimonio autónomo en el fideicomiso inmobiliario.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 2: FINANZAS RWA, CAP RATES DUALES Y BÓVEDAS PAS v1.0 (14%) ───────────
    {
      id: 'mod_rwa_02_financial_engineering',
      programId: 'prog_rwa_real_estate_master_v1',
      sequence: 2,
      code: 'MOD_2_RWA_FINANCIAL_ENGINEERING',
      title: 'Finanzas RWA: Rendimientos Duales, Cap Rates y Bóvedas On-Chain',
      description: 'Ingeniería financiera de proyectos tokenizados: tickets de entrada accesibles, rendimientos duales (Renta en USDC + Plusvalía por revalorización), Bóvedas PAS v1.0 y mecanismos de recompra de liquidez (Buyback Engine).',
      weightPercentage: 14,
      requiredKnowledgeDocs: ['PAS_ASSET_STANDARD_v1_0', 'SNARAI_FINANCIAL_MODEL_v1_0'],
      assessments: [
        {
          id: 'asm_rwa_02_yield_modeling',
          moduleId: 'mod_rwa_02_financial_engineering',
          title: 'Decisión Financiera: Estructuración del Retorno Pro-Rata y Liquidez Secundaria',
          scenarioContext: `Un inversionista institucional analiza una inversión de $50,000 USD en S'Narai. Pregunta cómo se calcula el Cap Rate proyectado del 9.5% anual, en qué moneda se dispersan las rentas del pool hotelero, cómo se audita el flujo de caja antes de la dispersión y qué mecanismos existen si necesita liquidar su posición antes de los 5 años.`,
          questionPrompt: `Como Especialista en Finanzas RWA:
1. Modela cómo opera la rentabilidad dual: flujo operativo de rentas (USDC / Fiat) versus plusvalía de salida o revalorización de obra.
2. Explica la mecánica de las Bóvedas Fiduciarias PAS v1.0 y cómo se realiza la dispersión pro-rata automática a cada wallet de inversionista.
3. Detalla la función del Buyback Pool (Bóveda de Recompra) y el cálculo de Net Asset Value (NAV) para proveer liquidez secundaria sin colapsar el precio del desarrollo.`,
          rubricCriteria: [
            {
              id: 'rc_02_dual_yield',
              title: 'Modelado de Retorno Dual (Yield + Capital Gain)',
              description: 'Distingue con precisión entre el flujo operativo de rentas pro-rata y la plusvalía de apreciación del activo.',
              maxScore: 35,
              evaluationGuideline: 'Debe explicar la dispersión en stablecoins auditadas (USDC) o cuenta bancaria y el cálculo del Cap Rate.'
            },
            {
              id: 'rc_02_pas_vault_distribution',
              title: 'Dispersión Pro-Rata Soberana (PAS v1.0)',
              description: 'Explica cómo las bóvedas programables distribuyen utilidades según el número de fracciones custodiadas sin intermediación bancaria burocrática.',
              maxScore: 35,
              evaluationGuideline: 'Debe mencionar snapshots de balances y dispersión atómica.'
            },
            {
              id: 'rc_02_buyback_nav',
              title: 'Liquidez Secundaria y Buyback Engine',
              description: 'Fundamenta cómo el Buyback Pool absorbe órdenes de venta de salida con base en el NAV certificado por valuador pericial independiente.',
              maxScore: 30,
              evaluationGuideline: 'Debe evitar la idea de un pool desregulado estilo Uniswap; debe hablar de recompra fiduciaria institucional.'
            }
          ],
          criticalFailureConditions: [
            'Prometer rendimientos garantizados o libres de riesgo (prohibido por regulación fiduciaria).',
            'Desconocer el concepto de NAV (Net Asset Value) en activos inmobiliarios.',
            'Sugerir que los fondos de renta se mezclan con la cuenta personal del desarrollador.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 3: PROPERTY MANAGEMENT HOTELERO, OPERACIÓN Y AUDITORÍA REVPAR (14%) ──
    {
      id: 'mod_rwa_03_hotel_property_mgmt',
      programId: 'prog_rwa_real_estate_master_v1',
      sequence: 3,
      code: 'MOD_3_HOTEL_PROPERTY_MGMT_REVPAR',
      title: 'Operación Hotelera, Property Management y Auditoría de Rentas Vacacionales (RevPAR)',
      description: 'Gestión operacional del activo vacacional de lujo: rol del Master Host institucional vs Co-Host, algoritmos de tarificación dinámica (ADR), distribución omnicanal en Airbnb Luxe/Vrbo/Direct Booking, fondo de reserva FF&E (Furniture, Fixtures & Equipment), auditoría pericial de ocupación y conciliación de flujo neto hacia la Bóveda de Distribución en USDC.',
      weightPercentage: 14,
      requiredKnowledgeDocs: ['SNARAI_HOTEL_OPERATING_MANUAL_v1_0', 'REVPAR_AUDIT_PROTOCOL_v1_0'],
      assessments: [
        {
          id: 'asm_rwa_03_hotel_operation_audit',
          moduleId: 'mod_rwa_03_hotel_property_mgmt',
          title: 'Auditoría Operativa: Conciliación de Corte Mensual y Dispersión del Pool Hotelero',
          scenarioContext: `En el mes de enero, el complejo turístico S'Narai (Bucerías) reportó ingresos brutos por hospedaje de $72,000 USD con una tarifa promedio (ADR) de $380 USD y ocupación del 78%. El comité de 12 co-propietarios solicita auditar el corte mensual porque observan discrepancias en los cargos por comisiones de plataformas OTA (15%), costos de lavandería/limpieza, fee de administración del Master Host (20%) y retención de fondo FF&E (4%). Uno de los inversionistas sospecha de fuga de ingresos por reservas en efectivo directas.`,
          questionPrompt: `Como Especialista en Operación Hotelera RWA de Pandora's:
1. Realiza el desglose financiero auditable: de los $72,000 USD brutos, calcula las deducciones operativas legítimas (comisiones OTA, costos directos de limpieza/mantenimiento, fee del Master Host y reserva FF&E) y determina el Flujo Operativo Neto (NOI) a distribuir.
2. ¿Cómo garantiza el sistema de Pandora's OS que cada reserva (incluso las directas o en efectivo) quede sellada con timestamp inmutable y reconciliada con la cerradura inteligente (IoT) para evitar "noches fantasma"?
3. Explica el protocolo de aprobación multifirma del informe de corte mensual antes de ejecutar la dispersión pro-rata atómica en USDC a las wallets de los inversionistas.`,
          rubricCriteria: [
            {
              id: 'rc_03_noi_breakdown',
              title: 'Cálculo Riguroso de NOI y Cascadas de Distribución',
              description: 'Deduce de manera ordenada y matemáticamente precisa los costos operativos legítimos, separando OPEX del fondo de reposición de activos (FF&E).',
              maxScore: 35,
              evaluationGuideline: 'Debe demostrar conocimiento de la cascada de ingresos hoteleros y cálculo exacto de la utilidad neta repartible.'
            },
            {
              id: 'rc_03_anti_ghost_nights',
              title: 'Prevención de Fugas de Ingresos (Anti-Ghost Nights)',
              description: 'Articula la integración entre el Channel Manager, hardware IoT (cerraduras digitales) y el ledger fiduciario de reservas de Pandora\'s OS.',
              maxScore: 35,
              evaluationGuideline: 'Debe explicar la auditoría de ocupación en tiempo real y el cruzamiento de check-ins con reportes de ingresos.'
            },
            {
              id: 'rc_03_multisig_audit_dispersal',
              title: 'Gobernanza de Dispersión Multifirma',
              description: 'Detalla cómo el comité de vigilancia o supervisor fiduciario valida el estado de cuenta mensual antes de disparar el contrato de distribución en USDC.',
              maxScore: 30,
              evaluationGuideline: 'Debe explicar la conciliación previa y la trazabilidad de la dispersión atómica sin discrecionalidad humana.'
            }
          ],
          criticalFailureConditions: [
            'Omitir la retención del fondo de reserva FF&E (imprescindible para mantener el valor del inmueble de lujo).',
            'Ignorar el riesgo de reservas no declaradas ("noches fantasma") por parte del operador.',
            'Proponer que el Master Host disperse fondos directamente desde su cuenta bancaria personal.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 4: FISCALIDAD CROSS-BORDER (USA/CANADÁ) Y CUMPLIMIENTO AML / UIF (14%) ─
    {
      id: 'mod_rwa_04_cross_border_tax_aml',
      programId: 'prog_rwa_real_estate_master_v1',
      sequence: 4,
      code: 'MOD_4_CROSS_BORDER_TAX_AML',
      title: 'Fiscalidad Cross-Border (USA/Canadá), Tratados Internacionales y Cumplimiento AML / UIF',
      description: 'Estructuración tributaria y de cumplimiento para inversionistas extranjeros en el corredor Riviera Nayarit / Bahía de Banderas: aplicación de tratados de doble tributación (México-USA / México-Canadá), Formulario W-8BEN, retención de ISR (Art. 153/160 LISR) vs Foreign Tax Credit en el IRS (Form 1116) y CRA, régimen de arrendamiento con deducción ciega del 35% (Art. 115 LISR), y prevención de lavado de dinero bajo la Ley Federal Antilavado (LFPIORPI), avisos ante la UIF e identificación de beneficiario controlador (Art. 32-B Quáter CFF).',
      weightPercentage: 14,
      requiredKnowledgeDocs: ['CROSS_BORDER_TAX_GUIDE_v1_0', 'AML_KYC_COMPLIANCE_FRAMEWORK_v1_0'],
      assessments: [
        {
          id: 'asm_rwa_04_tax_syndicate_memo',
          moduleId: 'mod_rwa_04_cross_border_tax_aml',
          title: 'Dictamen Fiscal y Cumplimiento AML: Sindicación de Inversionistas Norteamericanos',
          scenarioContext: `Un syndication group integrado por dos ciudadanos estadounidenses (California y Texas) y un canadiense (Vancouver) desean adquirir conjuntamente $300,000 USD en fracciones de S'Narai. Tienen 3 inquietudes críticas:
1. Temen una doble tributación confiscatoria entre el SAT de México y el IRS/CRA.
2. Desconocen si la recepción de dividendos en USDC califica como ganancia de capital o dividendo ordinario en sus declaraciones anuales.
3. El banco mexicano o el fideicomiso les solicita acreditar el origen de fondos y temen que la operación sea bloqueada por la Unidad de Inteligencia Financiera (UIF) por usar stablecoins.`,
          questionPrompt: `Como Consultor Fiduciario y Fiscal RWA de Pandora's:
1. Diseña la ruta fiscal óptima para estos inversionistas extranjeros: explica el mecanismo de retención en la fuente por parte del Fideicomiso mexicano (Art. 153 LISR) y cómo acreditan el 100% de ese impuesto pagado en México mediante el Foreign Tax Credit (IRS Form 1116 / CRA Foreign Tax Credit), eliminando la doble imposición.
2. Compara la eficiencia fiscal entre tributar como Persona Física extranjera con deducción ciega del 35% frente a constituir una LLC o SPV en Wyoming.
3. Estructura el expediente de Prevención de Lavado de Dinero (AML) de acuerdo con la LFPIORPI: ¿qué documentación KYC/KYB se integra en su Sovereign Vault y cómo se emite el comprobante fehaciente de origen lícito de fondos para la recepción de USDC/SPEI?`,
          rubricCriteria: [
            {
              id: 'rc_04_double_tax_treaty',
              title: 'Dominio de Tratados de Doble Tributación (W-8BEN & Form 1116)',
              description: 'Explica con precisión técnica el crédito fiscal exterior en USA (IRC Sec. 901/904) y Canadá, demostrando que no hay doble pago de impuestos.',
              maxScore: 35,
              evaluationGuideline: 'Debe dominar la retención aplicable en México y el acreditamiento formal en el país de residencia del inversionista.'
            },
            {
              id: 'rc_04_mexican_tax_regimes',
              title: 'Estrategia de Deducción Ciega (Art. 115 LISR) vs SPV',
              description: 'Evalúa la deducción ciega del 35% sin comprobantes de gastos frente a la deducción tradicional de gastos operativos y depreciación del activo.',
              maxScore: 35,
              evaluationGuideline: 'Debe fundamentar cuándo conviene persona física extranjera vs vehículo corporativo dedicado.'
            },
            {
              id: 'rc_04_aml_beneficial_ownership',
              title: 'Cumplimiento LFPIORPI y Beneficiario Controlador',
              description: 'Detalla los umbrales de identificación y aviso de actividades vulnerables ante el SAT/UIF, y la identificación fehaciente del beneficiario final.',
              maxScore: 30,
              evaluationGuideline: 'Debe dejar claro que la tokenización RWA en Pandora\'s cumple al 100% las normativas AML y bancarias mexicanas.'
            }
          ],
          criticalFailureConditions: [
            'Afirmar que los extranjeros pueden operar en México sin pagar impuestos o evadiendo al SAT.',
            'Desconocer el Formulario W-8BEN o los mecanismos de Foreign Tax Credit en USA y Canadá.',
            'Sugerir que el uso de USDC permite evadir los requerimientos de Prevención de Lavado de Dinero (AML/UIF).'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 5: PSICOLOGÍA DE VENTA Y CIERRE PARA REALTORS & BROKERS (14%) ────────
    {
      id: 'mod_rwa_05_sales_psychology',
      programId: 'prog_rwa_real_estate_master_v1',
      sequence: 5,
      code: 'MOD_5_SALES_PSYCHOLOGY_CLOSING',
      title: 'Psicología de Venta, Argumentario y Cierre de Alto Ticket para Realtors',
      description: 'El método de anti-venta y consultoría patrimonial: cómo presentar la tokenización a compradores tradicionales sin hablar de blockchain, los 7 argumentos clave de cierre y el uso en vivo del portal de cliente para generar confianza instantánea.',
      weightPercentage: 14,
      requiredKnowledgeDocs: ['RWA_REALTOR_PLAYBOOK_v1_0', 'SALES_OBJECTION_MATRIX_v1_0'],
      assessments: [
        {
          id: 'asm_rwa_05_roleplay_closing',
          moduleId: 'mod_rwa_05_sales_psychology',
          title: 'Simulación de Cierre: La Demostración en Vivo con el Portal de S\'Narai',
          scenarioContext: `Estás en una reunión con una pareja de médicos inversionistas que buscan proteger $80,000 USD contra la devaluación. Les mostraste una propiedad tradicional pero no les alcanza para el departamento completo de $400,000 USD y no quieren endeudarse con hipotecas al 12% de interés. Tienen miedo a perder su dinero en 'proyectos digitales'.`,
          questionPrompt: `Aplica la técnica de Cierre Consultivo de Pandora's Academy:
1. Redacta el guion exacto de apertura con el que introduces la inversión fraccional sin usar jerga tecnológica (blockchain, hashes o tokens).
2. ¿Cómo utilizas tu propio Portal de Inversionista en tu smartphone para mostrar tu propia inversión en S'Narai como prueba social irrefutable?
3. Cierra la venta ofreciendo la solución al problema de liquidez y ticket mínimo, guiándolos hacia su primera aportación fiduciaria.`,
          rubricCriteria: [
            {
              id: 'rc_05_human_language',
              title: 'Lenguaje Humano y Eliminación de Fricción',
              description: 'Habla de "copropiedad fiduciaria fraccional", "escritura colectiva", "rentas hoteleras" y "certeza patrimonial", eliminando palabras complejas de Web3.',
              maxScore: 35,
              evaluationGuideline: 'Debe demostrar empatía con el perfil médico/tradicional y enfocarse en la protección patrimonial.'
            },
            {
              id: 'rc_05_skin_in_the_game',
              title: 'Uso de Autoridad y Prueba Social Real',
              description: 'Muestra su propio portal de S\'Narai como inversionista real para generar certidumbre inmediata ("yo mismo soy copropietario").',
              maxScore: 35,
              evaluationGuideline: 'Debe apalancar el hecho de ser co-inversionista activo en el proyecto.'
            },
            {
              id: 'rc_05_closing_technique',
              title: 'Técnica de Cierre sin Presión (Anti-Venta)',
              description: 'Estructura una llamada a la acción elegante con asignación de fracciones limitadas de preventa.',
              maxScore: 30,
              evaluationGuideline: 'Debe generar escasez real basada en el cupo del fideicomiso.'
            }
          ],
          criticalFailureConditions: [
            'Presionar con tácticas agresivas de venta tradicional de tiempos compartidos.',
            'Enredarse en explicaciones técnicas de criptografía en lugar de beneficios patrimoniales.',
            'No resolver la duda sobre qué documento legal acredita la propiedad del cliente.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 6: FONDEO DE PREVENTAS Y TOKENIZACIÓN PARA DESARROLLADORES (15%) ──────
    {
      id: 'mod_rwa_06_developer_syndication',
      programId: 'prog_rwa_real_estate_master_v1',
      sequence: 6,
      code: 'MOD_6_DEVELOPER_SYNDICATION',
      title: 'Estructuración de Preventas y Levantamiento de Capital para Desarrolladores',
      description: 'Sustitución de crédito puente bancario (TIIE+5%) por sindicación fraccional RWA: diseño de fases de venta, hitos de avance de obra con escrow fiduciario, gobernanza de DAO de inversionistas y onboarding en Pandora\'s Growth OS.',
      weightPercentage: 15,
      requiredKnowledgeDocs: ['DEVELOPER_TOKENIZATION_BLUEPRINT_v1_0', 'ESCROW_MILESTONE_ENGINE_v1_0'],
      assessments: [
        {
          id: 'asm_rwa_06_bridge_loan_replacement',
          moduleId: 'mod_rwa_06_developer_syndication',
          title: 'Caso de Negocio: Sustitución de Crédito Puente Bancario por Preventa Tokenizada',
          scenarioContext: `Un desarrollador en Bahía de Banderas tiene el terreno pagado y licencia de construcción para un proyecto de 24 departamentos ($6M USD valor total). El banco le ofrece un crédito puente de $3M USD con tasa del 18% anual más comisiones de apertura y supervisión, exigiendo hipotecar todo el predio. El desarrollador calcula pagar $850,000 USD de solo intereses bancarios.`,
          questionPrompt: `Como Consultor RWA de Pandora's para este Desarrollador:
1. Diseña una estrategia de Fondeo por Fases Tokenizadas en Pandora's OS para sustituir o reducir al 80% el crédito puente bancario.
2. ¿Cómo se estructuran los Smart Contracts de Escrow vinculados a Hitos de Obra para que el desarrollador reciba fondos únicamente contra avance pericial físico?
3. ¿Qué beneficio económico en margen neto y velocidad de absorción obtiene el desarrollador frente al esquema tradicional bancario?`,
          rubricCriteria: [
            {
              id: 'rc_06_phased_capital',
              title: 'Estrategia de Absorción en Fases (Seed, Obra, Acabados)',
              description: 'Diseña tramos de preventa con descuentos decrecientes que atraen inversionistas tempranos sin comprometer el margen total.',
              maxScore: 35,
              evaluationGuideline: 'Debe articular fases con precios de salida atractivos y absorción acelerada.'
            },
            {
              id: 'rc_06_milestone_escrow',
              title: 'Escrow Fiduciario por Hitos de Construcción',
              description: 'Establece liberación condicionada a estimaciones de obra validadas por DRO/perito independiente, protegiendo a los inversionistas.',
              maxScore: 35,
              evaluationGuideline: 'Debe explicar la liberación progresiva de tesorería y gobernanza con timelocks.'
            },
            {
              id: 'rc_06_cost_of_capital',
              title: 'Optimización del Costo de Capital y Margen Neto',
              description: 'Cuantifica el ahorro de intereses no bancarios y cómo la preventa genera lealtad y compradores finales orgánicos.',
              maxScore: 30,
              evaluationGuideline: 'Debe demostrar conocimiento de los números reales de desarrollo inmobiliario.'
            }
          ],
          criticalFailureConditions: [
            'Proponer liberar el 100% de los fondos al desarrollador el día 1 sin hitos de obra.',
            'Ignorar el cálculo de costos financieros bancarios.',
            'Omitir la figura del fideicomiso constructor en la estructura de garantías.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 7: TESIS DE GRADUACIÓN: INVERSIÓN EN FRACCIÓN REAL DE S'NARAI (15%) ───
    {
      id: 'mod_rwa_07_snarai_thesis',
      programId: 'prog_rwa_real_estate_master_v1',
      sequence: 7,
      code: 'MOD_7_SNARAI_CAPSTONE_INVESTMENT',
      title: 'Tesis de Graduación: Inversión en Fracción Real de S\'Narai & Acreditación de Broker',
      description: 'El proyecto final transaccional con Skin in the Game: onboarding real en S\'Narai (Zona Dorada, Bucerías, Nayarit), vinculación de wallet fiduciaria, firma del Acuerdo de Inversión Soberano (EIP-191), recepción de fracción real y activación como Broker Certificado de los 3 proyectos activos de Bahía de Banderas (S\'Narai en Bucerías, Torre Vista Horizonte en Bucerías y Departamento a pie de playa en Nuevo Vallarta).',
      weightPercentage: 15,
      requiredKnowledgeDocs: ['SNARAI_PROJECT_WHITE_PAPER_v1_0', 'SOVEREIGN_INVESTOR_ONBOARDING_v1_0'],
      assessments: [
        {
          id: 'asm_rwa_07_capstone_execution',
          moduleId: 'mod_rwa_07_snarai_thesis',
          title: 'Defensa de Tesis de Inversión y Ejecución Soberana en S\'Narai',
          scenarioContext: `Para completar tu graduación del Master de Tokenización Inmobiliaria, debes defender tu tesis de inversión sobre S'Narai (ubicado en la exclusiva Zona Dorada de Bucerías, Bahía de Banderas, a pasos del mar) ante el Tribunal Socrático de Hermes AI. Una vez aprobada tu defensa conceptual, el sistema desbloquea la asignación de tu fracción oficial en el proyecto S'Narai y emite tu Credencial Soulbound verificable en IPFS, acreditándote además para la comercialización de Torre Vista Horizonte (Bucerías) y el Departamento a pie de playa en Nuevo Vallarta.`,
          questionPrompt: `Defiende tu Tesis Ejecutiva:
1. Sintetiza la tesis de inversión de S'Narai: el "Factor Bucerías" en la Zona Dorada de Riviera Nayarit, la escasez de inventario premium a pasos del mar, modelo de pool de rentas hoteleras y plusvalía proyectada del 12-15% anual.
2. Explica cómo tu experiencia vivencial en el portal de S'Narai (como copropietario activo con voting power y dividendos en USDC) transforma tu modelo de negocio como realtor o desarrollador frente a tus clientes.
3. Define tu estrategia comercial para canalizar prospectos según su perfil hacia los 3 proyectos activos:
   - Perfil Preventa Máxima Plusvalía: S'Narai (Zona Dorada, Bucerías).
   - Perfil Residencial Vertical Panorámico: Torre Vista Horizonte (Bucerías).
   - Perfil Flujo Inmediato Llave en Mano: Departamento a pie de playa (Nuevo Vallarta).`,
          rubricCriteria: [
            {
              id: 'rc_07_investment_thesis',
              title: 'Rigor en la Tesis de Inversión Territorial (Factor Bucerías)',
              description: 'Demuestra conocimiento profundo del mercado de Bucerías Zona Dorada, precios por m2, escasez de tierra, absorción de nómadas digitales y turismo de alto poder adquisitivo.',
              maxScore: 35,
              evaluationGuideline: 'Debe defender los fundamentos reales del proyecto S\'Narai en Bucerías con métricas de plusvalía y ocupación >70%.'
            },
            {
              id: 'rc_07_skin_in_the_game_conviction',
              title: 'Skin in the Game y Autoridad Moral',
              description: 'Articula con elocuencia por qué ser inversionista real en S\'Narai le confiere la máxima ventaja competitiva frente al 99% de realtors tradicionales.',
              maxScore: 35,
              evaluationGuideline: 'Debe explicar la convicción de vender lo que uno mismo posee y mostrar su propio portal activo.'
            },
            {
              id: 'rc_07_commercial_execution_plan',
              title: 'Segmentación de Portafolio Territorial (3 Proyectos)',
              description: 'Plantea una estrategia clara diferenciando preventa de lujo (S\'Narai), torre con vista al mar (Vista Horizonte) y activo terminado a pie de playa (Nuevo Vallarta).',
              maxScore: 30,
              evaluationGuideline: 'Debe presentar un plan viable de prospección con Hermes y matching de producto según la tolerancia al riesgo del cliente.'
            }
          ],
          criticalFailureConditions: [
            'Confundir la ubicación de S\'Narai o tratarlo como un proyecto ficticio.',
            'No entender cómo la condición de inversionista real respalda la comercialización.',
            'No saber diferenciar los 3 perfiles de inversión entre Bucerías y Nuevo Vallarta.'
          ],
          passingThreshold: 85
        }
      ]
    }
  ]
};
