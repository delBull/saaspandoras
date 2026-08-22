/**
 * 🎓 Pandora's Academy — CFO Executive Readiness Assessment Framework (v1.0)
 * apps/dashboard/src/lib/pandoras/core/domains/academy/curriculum/cfo-program.ts
 *
 * Grounded 100% in real Pandora's documentation:
 * - Pandoras Asset Standard (PAS v1.0) & Fiduciary Vault Architecture
 * - Libro V: Capital Formation, Secondary Market Dynamics & Buyback Pools
 * - Libro VI: Treasury Governance, Safe-Stops, Multi-Sig & Pro-Rata Yield Distribution
 * - Multi-Jurisdictional Tax & Institutional Settlement (USDC / Fiat Gateways)
 */

import { AcademyProgram } from '../types';

export const CFO_EXECUTIVE_PROGRAM: AcademyProgram = {
  id: 'prog_cfo_executive_v1',
  code: 'CFO_EXECUTIVE_V1',
  title: 'Chief Financial Officer (CFO) & Capital Engine Executive Certification',
  description: 'Programa de certificación ejecutiva para el Chief Financial Officer (CFO) de Pandora\'s. Evalúa dominio integral del Pandoras Asset Standard (PAS v1.0), gestión de tesorerías multi-firma, gobernanza de pools de recompra, liquidación fiduciaria y distribución pro-rata de rendimientos.',
  targetRole: 'CFO',
  status: 'ACTIVE',
  version: 1,
  passingScore: 80,
  modules: [
    // ── MÓDULO 1: PANDORAS ASSET STANDARD (PAS v1.0) & VAULTS (20%) ──────────
    {
      id: 'mod_cfo_01_pas_standard',
      programId: 'prog_cfo_executive_v1',
      sequence: 1,
      code: 'MOD_1_PAS_FIDUCIARY_VAULTS',
      title: 'Pandoras Asset Standard (PAS v1.0) y Bóvedas Fiduciarias',
      description: 'Estructura de respaldo 1:1, segregación patrimonial en fideicomisos bancarios y smart contracts colaterales.',
      weightPercentage: 20,
      requiredKnowledgeDocs: ['PAS_ASSET_STANDARD_v1_0', 'IOM_v1_0'],
      assessments: [
        {
          id: 'asm_cfo_01_collateral_ratio',
          moduleId: 'mod_cfo_01_pas_standard',
          title: 'Auditoría Fiduciaria: Verificación de Colateralización 1:1',
          scenarioContext: 'Un proyecto emisor de tokens inmobiliarios en la plataforma solicita liberar el 30% de los fondos en custodia del Fideicomiso antes de inscribir formalmente la hipoteca de garantía en el Registro Público de la Propiedad, alegando urgencia de flujo para proveedores.',
          questionPrompt: `Como CFO de Pandora's:
1. Conforme al estándar PAS v1.0, ¿cuál es la regla de oro para la liberación de fondos fiduciarios?
2. Explica qué responsabilidad fiduciaria y riesgo de insolvencia asumiría Pandora's si se liberan fondos sin el gravamen inscrito.
3. ¿Cómo estructuras el cronograma de hitos (Milestones Escrow) de liberación progresiva contra dictamen notarial vinculante?`,
          rubricCriteria: [
            {
              id: 'rc_cfo_01_strict_fiduciary',
              title: 'Defensa Irrestricta del Estándar PAS v1.0',
              description: 'Rechaza la liberación anticipada sin el perfeccionamiento legal del colateral registrado.',
              maxScore: 40,
              evaluationGuideline: 'Debe exigir estricto cumplimiento del principio de respaldo 1:1.'
            },
            {
              id: 'rc_cfo_01_insolvency_risk',
              title: 'Análisis de Riesgo de Descalce Patrimonial',
              description: 'Identifica que los tenedores de tokens quedarían desprotegidos ante una quiebra del desarrollador.',
              maxScore: 35,
              evaluationGuideline: 'Debe explicar la prelación de créditos y la protección del fideicomiso.'
            },
            {
              id: 'rc_cfo_01_escrow_milestones',
              title: 'Diseño de Escrow Condicionado',
              description: 'Establece liberación contra fe notarial y avance de obra supervisado por perito independiente.',
              maxScore: 25,
              evaluationGuideline: 'Debe vincular smart contracts con validaciones del fiduciario.'
            }
          ],
          criticalFailureConditions: [
            'Autorizar la liberación de fondos fiduciarios sin colateral legalmente inscrito.',
            'Aceptar pagarés simples no garantizados en sustitución de hipotecas o fideicomisos registrados.',
            'Mezclar fondos de custodia del proyecto con cuentas operativas de Pandora\'s.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 2: GOBERNANZA DE TESORERÍA, MULTI-SIG & SAFE-STOPS (20%) ──────
    {
      id: 'mod_cfo_02_treasury_safestops',
      programId: 'prog_cfo_executive_v1',
      sequence: 2,
      code: 'MOD_2_TREASURY_SAFESTOPS',
      title: 'Gobernanza de Tesorería On-Chain, Safe-Stops y Esquema Multi-Firma',
      description: 'Políticas de custodia con Safe (Gnosis), umbrales de firma 3/5, límites de retiro diario y circuitos de parada de emergencia.',
      weightPercentage: 20,
      requiredKnowledgeDocs: ['PAS_ASSET_STANDARD_v1_0', 'PANDORAS_LIBRO_VI_GOVERNANCE'],
      assessments: [
        {
          id: 'asm_cfo_02_multi_sig_ops',
          moduleId: 'mod_cfo_02_treasury_safestops',
          title: 'Gestión de Tesorería: Operación de Emergencia y Activación de Safe-Stop',
          scenarioContext: 'Se detecta una anomalía transaccional donde una wallet externa no identificada intenta ejecutar swaps repetitivos de alta frecuencia contra el pool de liquidez secundario, amenazando con desequilibrar la paridad del token.',
          questionPrompt: `Como CFO de Pandora's:
1. ¿Cuál es el protocolo de activación del Safe-Stop en los smart contracts del proyecto?
2. ¿Quiénes deben componer el quórum de firmas (ej. 3 de 5) para ejecutar una pausa de emergencia de la tesorería?
3. ¿Cómo se audita y reanuda la operación una vez mitigado el vector de riesgo, garantizando la seguridad de los fondos de los usuarios?`,
          rubricCriteria: [
            {
              id: 'rc_cfo_02_circuit_breaker',
              title: 'Activación Oportuna de Circuit Breakers',
              description: 'Detalla la ejecución inmediata de la función pause() en los contratos autorizados.',
              maxScore: 40,
              evaluationGuideline: 'Debe priorizar la preservación de capital antes de cualquier análisis posterior.'
            },
            {
              id: 'rc_cfo_02_multisig_quorum',
              title: 'Gobernanza Multi-Firma Sin Puntos Únicos de Falla',
              description: 'Estructura la custodia con firmantes distribuidos geográficamente (CEO, CFO, CTO, Legal, Auditor Externo).',
              maxScore: 35,
              evaluationGuideline: 'Debe prohibir la posesión de claves por una sola persona.'
            },
            {
              id: 'rc_cfo_02_recovery_protocol',
              title: 'Protocolo de Reanudación y Auditoría Post-Incidente',
              description: 'Requiere reporte de balance reconciliado antes de despausar los contratos.',
              maxScore: 25,
              evaluationGuideline: 'Debe presentar conciliación bancaria y on-chain.'
            }
          ],
          criticalFailureConditions: [
            'Permitir que una sola persona controle las claves privadas de la tesorería (Single Point of Failure).',
            'Demorar la pausa de emergencia mientras se discute comercialmente la pérdida.',
            'Omitir la auditoría de balances antes de reanudar operaciones tras un exploit.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 3: BUYBACK POOLS & MERCADOS SECUNDARIOS (20%) ────────────────
    {
      id: 'mod_cfo_03_buyback_engine',
      programId: 'prog_cfo_executive_v1',
      sequence: 3,
      code: 'MOD_3_BUYBACK_SECONDARY_MARKETS',
      title: 'Mecanismos de Recompra (Buyback Engine) y Liquidez Secundaria',
      description: 'Matemática de los pools de recompra garantizada, algoritmos de absorción de oferta y protección del valor liquidativo (NAV).',
      weightPercentage: 20,
      requiredKnowledgeDocs: ['PANDORAS_LIBRO_V_CAPITAL_FORMATION', 'PAS_ASSET_STANDARD_v1_0'],
      assessments: [
        {
          id: 'asm_cfo_03_liquidity_stabilization',
          moduleId: 'mod_cfo_03_buyback_engine',
          title: 'Modelado Financiero: Cálculo de Fondo de Reserva para Buybacks',
          scenarioContext: 'Un proyecto inmobiliario de $5M USD entra en su segundo año de operación. Varios inversionistas minoritarios desean salir de su posición y solicitan la recompra del 10% de los tokens emitidos.',
          questionPrompt: `Como CFO de Pandora's:
1. ¿Cómo se determina el precio de recompra (NAV por token) considerando la plusvalía auditada y las reservas acumuladas?
2. ¿Qué porcentaje de los flujos de rentas mensuales debe retenerse en el Pandora Buyback Pool para garantizar liquidez sin asfixiar la distribución de dividendos?
3. ¿Cómo evitas el arbitraje malicioso en el mercado secundario entre compras con descuento y redenciones al NAV?`,
          rubricCriteria: [
            {
              id: 'rc_cfo_03_nav_valuation',
              title: 'Determinación Rigurosa del NAV',
              description: 'Calcula el valor liquidativo basado en avalúos actualizados, deduciendo comisiones y pasivos.',
              maxScore: 35,
              evaluationGuideline: 'Debe basarse en el valor neto de los activos y no en especulación.'
            },
            {
              id: 'rc_cfo_03_reserve_sizing',
              title: 'Dimensionamiento Óptimo del Pool de Recompra',
              description: 'Modela una reserva dinámica (ej. 10%-15% del flujo operativo) para atender solicitudes de salida.',
              maxScore: 35,
              evaluationGuideline: 'Debe equilibrar rendimiento corriente para los holders con liquidez de salida.'
            },
            {
              id: 'rc_cfo_03_arbitrage_prevention',
              title: 'Mecanismos Anti-Arbitraje y Ventanas de Redención',
              description: 'Implementa periodos de corte y fee de salida escalonado para desincentivar salidas intradiarias.',
              maxScore: 30,
              evaluationGuideline: 'Debe aplicar lockups y colas de liquidación ordenadas.'
            }
          ],
          criticalFailureConditions: [
            'Garantizar recompras a precio de entrada sin deducir depreciación o gastos de liquidación.',
            'Agotar las reservas de capital operativo del proyecto para pagar salidas preferenciales.',
            'Permitir arbitraje intradiario que descapitalice a los holders de largo plazo.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 4: DISTRIBUCIÓN PRO-RATA DE RENDIMIENTOS (USDC/FIAT) (20%) ───
    {
      id: 'mod_cfo_04_yield_distribution',
      programId: 'prog_cfo_executive_v1',
      sequence: 4,
      code: 'MOD_4_PRO_RATA_YIELD_DISTRIBUTION',
      title: 'Distribución Pro-Rata de Dividendos en USDC y Pasarelas Fiat',
      description: 'Motor de snapshots de tenencia, cálculo determinista de rendimiento por wallet, retenciones fiscales y ejecución por lotes.',
      weightPercentage: 20,
      requiredKnowledgeDocs: ['PANDORAS_LIBRO_VI_GOVERNANCE', 'PAS_ASSET_STANDARD_v1_0'],
      assessments: [
        {
          id: 'asm_cfo_04_batch_distribution',
          moduleId: 'mod_cfo_04_yield_distribution',
          title: 'Ejecución Ejecutiva: Distribución Trimestral de $250,000 USDC a 850 Holders',
          scenarioContext: 'Llega la fecha de distribución trimestral de rendimientos por rentas hoteleras ($250k USDC). Hay 850 holders en 12 países diferentes, con 45 holders que compraron tokens hace 10 días en el mercado secundario.',
          questionPrompt: `Como CFO de Pandora's:
1. ¿Cómo se define y audita el Snapshot de Bloque (Block Timestamp) para calcular el derecho pro-rata exacto de cada holder?
2. ¿Cómo se tratan los holders recientes (pro-rata temporal o derecho pleno a partir del siguiente ciclo de corte)?
3. Diseña el proceso de ejecución mediante /api/v1/projects/[projectId]/admin/distribute: cómo se reconcilian los saldos en DB (user_balances) con la dispersión on-chain para evitar gas spikes o transferencias fallidas.`,
          rubricCriteria: [
            {
              id: 'rc_cfo_04_snapshot_integrity',
              title: 'Integridad Criptográfica del Snapshot',
              description: 'Fija un bloque específico y audita balances para evitar ataques de préstamo flash (Flash Loans).',
              maxScore: 40,
              evaluationGuideline: 'Debe utilizar snapshots históricos verificables.'
            },
            {
              id: 'rc_cfo_04_prorata_fairness',
              title: 'Equidad en la Asignación Pro-Rata',
              description: 'Aplica reglas claras de devengamiento según los días de tenencia o corte de cupón.',
              maxScore: 30,
              evaluationGuideline: 'Debe transparentar las reglas en el prospecto del proyecto.'
            },
            {
              id: 'rc_cfo_04_batch_execution',
              title: 'Eficiencia en la Dispersión y Reconciliación',
              description: 'Utiliza distribución por lotes (Merkle Drop o Smart Contracts de dispersión) con fallback a balances en portal.',
              maxScore: 30,
              evaluationGuideline: 'Debe garantizar idempotencia en la dispersión.'
            }
          ],
          criticalFailureConditions: [
            'Ejecutar dispersión sin snapshot de bloque permitiendo manipulación por flash loans.',
            'Calcular rendimientos sobre saldos no liquidados o pendientes en pasarelas fiat.',
            'Omitir la conciliación de doble entrada entre saldos off-chain y contratos on-chain.'
          ],
          passingThreshold: 80
        }
      ]
    },

    // ── MÓDULO 5: RECONCILIACIÓN FISCAL & REPORTES AUDITADOS (20%) ───────────
    {
      id: 'mod_cfo_05_tax_audit',
      programId: 'prog_cfo_executive_v1',
      sequence: 5,
      code: 'MOD_5_TAX_RECONCILIATION_AUDIT',
      title: 'Cumplimiento Fiscal Multi-Jurisdiccional y Estados Financieros Auditados',
      description: 'Tratamiento contable de criptoactivos, reportes para auditores Big Four y separación entre ingresos operativos y fondos de clientes.',
      weightPercentage: 20,
      requiredKnowledgeDocs: ['CORP_STRUCTURE_WYOMING_HOLDING_v1_0', 'IOM_v1_0'],
      assessments: [
        {
          id: 'asm_cfo_05_audit_readiness',
          moduleId: 'mod_cfo_05_tax_audit',
          title: 'Auditoría Institucional: Reconciliación de Wallets con Libros Contables',
          scenarioContext: 'Una firma auditora internacional inicia la revisión anual de Pandora\'s USA Operations LLC y exige conciliar $12M USD en transacciones on-chain con los extractos bancarios de Wyoming y México.',
          questionPrompt: `Como CFO de Pandora's:
1. ¿Cómo se estructura el Libro Mayor Contable (General Ledger) para mapear transacciones blockchain a cuentas GAAP/NIF?
2. ¿Por qué es fundamental la separación contable entre los fondos propios de Pandora\'s (Revenue por SaaS, Fees) y los fondos de custodia de los proyectos (SPVs)?
3. ¿Qué reportes mensuales debe emitir la dirección de finanzas para el Consejo de Administración y los LPs institucionales?`,
          rubricCriteria: [
            {
              id: 'rc_cfo_05_gaap_crypto',
              title: 'Mapeo Contable Riguroso (GAAP / NIF)',
              description: 'Explica el tratamiento de stablecoins como efectivo o equivalentes de efectivo y activos digitales como intangibles.',
              maxScore: 40,
              evaluationGuideline: 'Debe cumplir normativas contables estándar.'
            },
            {
              id: 'rc_cfo_05_custody_segregation',
              title: 'Segregación Estricta de Fondos Propios vs Terceros',
              description: 'Demuestra que los fondos de clientes nunca tocan el balance operativo de la compañía gestora.',
              maxScore: 35,
              evaluationGuideline: 'Debe preservar la inviolabilidad patrimonial de los proyectos.'
            },
            {
              id: 'rc_cfo_05_board_reporting',
              title: 'Claridad en Reportes de Consejo y LPs',
              description: 'Define métricas clave: Runway, Burn Rate, Total Value Locked (TVL), Net Revenue Retention y Cash Flow.',
              maxScore: 25,
              evaluationGuideline: 'Debe entregar reportes comprensibles para auditores e inversionistas.'
            }
          ],
          criticalFailureConditions: [
            'Consolidar fondos de custodia de proyectos como ingresos propios en el estado de resultados.',
            'Omitir la retención de impuestos aplicables en distribuciones internacionales.',
            'Presentar estados financieros sin conciliación cripto-bancaria auditada.'
          ],
          passingThreshold: 80
        }
      ]
    }
  ]
};
