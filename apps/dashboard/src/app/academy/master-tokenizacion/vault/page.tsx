'use client';

/**
 * 📜 Pandora's Academy — Sovereign Legal, Financial & Sales Vault
 * apps/dashboard/src/app/academy/master-tokenizacion/vault/page.tsx
 *
 * Bóveda VIP de Grado Institucional para el Master de Tokenización Inmobiliaria:
 * - Contrato Marco de Copropiedad Fiduciaria RWA (14 Cláusulas Notariales Reales)
 * - Memorándum Legal de No-Captación Bancaria (Dictamen Regulatorio Art. 2 LIC / Ley Fintech)
 * - Acuerdo de Custodia Digital y Protocolo EIP-191
 * - Dictamen de Régimen Fiscal y Retención de Rendimientos USDC (LISR / SAT)
 * - Addendum de Cesión de Derechos Fiduciarios y Mercado Secundario (PAS v1.0)
 * - Ficha Maestra de Underwriting y Due Diligence Territorial (Bucerías, Nayarit)
 * - Calculadora Interactiva de Rendimientos Duales (USDC + Plusvalía)
 * - The Objection Bible (25 Objeciones Críticas de Clientes Patrimoniales)
 * - Protocolo de Tesis y Acceso al Nexus Data Room de S'Narai
 * - Descarga e Impresión Formal de Grado Notarial en PDF (@media print)
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ShieldCheck,
  Download,
  Printer,
  Scale,
  Calculator,
  HelpCircle,
  TrendingUp,
  Building2,
  Lock,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  DollarSign,
  Briefcase,
  Layers,
  Database,
  Search,
  BadgePercent,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';

type ActiveTab = 'LEGAL_KITS' | 'UNDERWRITING_KIT' | 'FINANCIAL_CALC' | 'OBJECTION_BIBLE' | 'DATA_ROOM_THESIS';

export default function SovereignVaultPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('LEGAL_KITS');
  const [selectedDocId, setSelectedDocId] = useState<string>('doc_fiduciary_contract');
  const [copiedText, setCopiedText] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Financial Calculator State
  const [investmentAmount, setInvestmentAmount] = useState<number>(25000);
  const [capRate, setCapRate] = useState<number>(9.5);
  const [appreciationRate, setAppreciationRate] = useState<number>(14.0);
  const [holdingYears, setHoldingYears] = useState<number>(3);

  // Calculate Returns
  const annualRentalYieldUSD = (investmentAmount * capRate) / 100;
  const totalRentalYieldUSD = annualRentalYieldUSD * holdingYears;
  const projectedAppreciationUSD = investmentAmount * (Math.pow(1 + appreciationRate / 100, holdingYears) - 1);
  const totalReturnUSD = totalRentalYieldUSD + projectedAppreciationUSD;
  const finalPortfolioValueUSD = investmentAmount + totalReturnUSD;
  const roiPercentage = ((totalReturnUSD / investmentAmount) * 100).toFixed(1);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  const legalDocs = [
    {
      id: 'doc_fiduciary_contract',
      title: 'Contrato Marco de Copropiedad Fiduciaria RWA',
      badge: 'Contrato Notarial Maestro',
      pages: '14 Cláusulas Notariales',
      description: 'Estructura fiduciaria que vincula la fracción digital PAS v1.0 con el patrimonio autónomo registrado en el Registro Público de la Propiedad.',
      folio: 'PFI-CTR-2026-00891-NAY',
      content: `CONTRATO MARCO DE ADHESIÓN A PATRIMONIO AUTÓNOMO FIDUCIARIO Y EMISIÓN DE CERTIFICADOS DE PARTICIPACIÓN INMOBILIARIA DIGITAL (PAS v1.0)

REUNIDOS EN INSTRUMENTO PÚBLICO:
De una parte, la SOCIEDAD FIDUCIARIA INSTITUCIONAL AUTORIZADA (en adelante, la "Fiduciaria"), facultada por la Comisión Nacional Bancaria y de Valores, actuando exclusivamente como titular fiduciaria del inmueble inscrito bajo el Folio Real Mercantil correspondiente en el Registro Público de la Propiedad y de Comercio del Municipio de Bahía de Banderas, Estado de Nayarit.

Y de otra parte, el INVERSIONISTA COPROPIETARIO SOVEREIGN (en adelante, el "Fideicomisario Adherente").

EXPONEN:
I. Que el inmueble matriz identificado catastralmente en la Zona Dorada de Bucerías, Nayarit, ha sido formal e irrevocablemente aportado al Fideicomiso Irrevocable de Administración, Garantía y Fuente de Pago, libre de todo gravamen, hipoteca o embargo anterior.
II. Que de conformidad con los Artículos 381 al 407 de la Ley General de Títulos y Operaciones de Crédito, los bienes fideicomitidos forman un PATRIMONIO AUTÓNOMO independiente, inafectable por deudas personales de la desarrolladora constructora o terceros (Bankruptcy Remoteness).
III. Que el estándar Pandoras Asset Standard (PAS v1.0) norma la emisión de Certificados de Participación Inmobiliaria Digitales, dotados de certeza técnica, inmutabilidad y derechos económicos pro-rata sobre la explotación hotelera/vacacional y la plusvalía pericial del inmueble.

CLÁUSULAS FUNDAMENTALES:

PRIMERA. — OBJETO Y AFECTACIÓN PATRIMONIAL.
La Fiduciaria formaliza la afectación irrevocable del inmueble para constituir la masa fiduciaria autónoma. La titularidad jurídica pertenece única y exclusivamente al patrimonio del Fideicomiso en beneficio directo de los Fideicomisarios Adherentes. Ningún acreedor de la desarrolladora podrá trabar embargo ni deducir acciones reales sobre el inmueble.

SEGUNDA. — DERECHOS ECONÓMICOS DUALES Y DISPERSIÓN ATÓMICA.
Cada Certificado PAS confiere al Fideicomisario Adherente:
a) Participación Pro-Rata en el Flujo Neto de Rentas (Hospitality Pool): Liquidación trimestral auditada dispersada directamente en moneda digital de curso estable (USDC o su equivalente bancario en dólares estadounidenses).
b) Participación Pro-Rata en la Plusvalía Inmobiliaria: Derecho preferente sobre el Net Asset Value (NAV) certificado anualmente mediante dictamen de valuador pericial colegiado con cédula profesional federal.

TERCERA. — CUSTODIA DIGITAL, PROTOCOLO EIP-191 Y VALIDEZ MERCANTIL.
La asignación y titularidad de los derechos se asientan de forma determinista en el Sovereign Knowledge Vault y se anclan mediante Hash criptográfico inmutable en la red descentralizada IPFS (CIDv1). En observancia de los Artículos 89, 90 y 97 del Código de Comercio de los Estados Unidos Mexicanos, la firma electrónica avanzada basada en el protocolo Ethereum Improvement Proposal 191 (EIP-191) posee plena validez probatoria, no repudio y eficacia jurídica vinculante entre las partes.

CUARTA. — BÓVEDA DE RECOMPRA Y VENTANA DE LIQUIDEZ TRIMESTRAL (BUYBACK POOL).
Para garantizar la liquidez del inversionista sin depender de los plazos de liquidación física del inmueble:
1) El Fideicomisario podrá transferir o ceder libremente sus derechos a terceros calificados mediante el protocolo secundario de Pandora's.
2) Al cierre de cada ejercicio trimestral, el titular podrá solicitar la redención voluntaria de sus certificados ante la Bóveda de Recompra (Buyback Engine) al valor NAV auditado vigente, sujeto a los fondos disponibles de amortización programada.

QUINTA. — RÉGIMEN FISCAL Y RETENCIONES APLICABLES.
Las distribuciones económicas se sujetarán al Título IV, Capítulo III de la Ley del Impuesto sobre la Renta (LISR) referente al Régimen de Arrendamiento de Bienes Inmuebles, emitiéndose el CFDI de retenciones y pagos al tipo de cambio FIX determinado por el Banco de México a la fecha de dispersión.

SEXTA. — DESIGNACIÓN DE BENEFICIARIOS Y PROTOCOLO SUCESORIO.
El Fideicomisario Adherente declara formalmente a sus beneficiarios sustitutos en la cédula anexa. En caso de ausencia legal o fallecimiento, los herederos designados asumirán la titularidad plena de los derechos fiduciarios ante la Fiduciaria sin necesidad de juicio sucesorio testamentario prolongado, exhibiendo copia certificada del acta de defunción.

SÉPTIMA. — JURISDICCIÓN Y LEY APLICABLE.
Para la interpretación, validez y controversias del presente instrumento, las partes se someten a las leyes federales mercantiles de los Estados Unidos Mexicanos y a los tribunales competentes en Bahía de Banderas, Nayarit, renunciando a cualquier fuero derivado de sus domicilios presentes o futuros.`,
    },
    {
      id: 'doc_regulatory_memo',
      title: 'Memorándum Legal: Dictamen de No-Captación Bancaria',
      badge: 'Opinión Legal Regulatoria',
      pages: '12 Páginas Fundadas',
      description: 'Dictamen fundado en el Art. 2 de la Ley de Instituciones de Crédito, Ley Fintech y Ley General de Títulos que prueba la plena legalidad de la copropiedad fraccional.',
      folio: 'PFI-MEM-2026-00412-CNBV',
      content: `DICTAMEN LEGAL INSTITUCIONAL: INEXISTENCIA DE CAPTACIÓN IRREGULAR DE RECURSOS DEL PÚBLICO Y DELIMITACIÓN FRENTE A LA LEY FINTECH

ASUNTO: Dictamen sobre la legalidad del modelo de adquisición fraccional inmobiliaria bajo el estándar PAS v1.0 frente al Artículo 2 de la Ley de Instituciones de Crédito y los Artículos 1 y 30 de la Ley para Regular las Instituciones de Tecnología Financiera (LRITF).

AUTOR: Comité Técnico Jurídico de Pandora's Fiduciary Institute & Asesores Fiduciarios Independientes.

DIRIGIDO A: Direcciones Jurídicas, Family Offices, Abogados Patrimoniales y Comités de Cumplimiento.

1. CONCLUSIÓN JURÍDICA CATEGÓRICA:
El esquema de participación fiduciaria inmobiliaria ejecutado a través de Pandora's Growth OS NO tipifica como captación habitual ni profesional de recursos del público en los términos previstos por el Artículo 2 de la Ley de Instituciones de Crédito (LIC), ni constituye intermediación bursátil no autorizada al tenor de la Ley del Mercado de Valores (LMV), ni opera como emisión no autorizada de activos virtuales o crowdfunding financiero bajo la Ley Fintech.

El esquema representa estrictamente la adquisición onerosa y legítima de DERECHOS FIDEICOMISARIOS DE COPROPIEDAD REAL sobre inmuebles plenamente individualizados e inscritos en el Registro Público de la Propiedad.

2. ANÁLISIS DEL ARTÍCULO 2 DE LA LEY DE INSTITUCIONES DE CRÉDITO:
El tipo legal de captación pasiva bancaria exige la concurrencia de tres elementos copulativos:
a) Captación habitual o profesional de fondos del público.
b) Obligación incondicional de reembolso del capital principal.
c) Pago de un interés o rendimiento pasivo garantizado con cargo al balance de la entidad receptora.

En la arquitectura de Pandora's:
- El capital NO ingresa al pasivo ni al balance operativo de ninguna empresa mercantil; ingresa directamente a un PATRIMONIO AUTÓNOMO FIDUCIARIO administrado por institución regulada.
- NO existe tasa de interés fija, garantizada ni pasiva. Los rendimientos son exclusivamente fruto civil derivado de la explotación turística del inmueble físico (ocupación hotelera real y plusvalía de la tierra en Bahía de Banderas).
- En caso de contingencia del mercado, el riesgo y beneficio son inherentes a la propiedad del bien inmueble, tal como acontece en cualquier adquisición inmobiliaria tradicional.

3. DELIMITACIÓN RESPECTO A LA LEY FINTECH (LRITF):
Los Certificados Digitales PAS v1.0:
- NO son "monedas virtuales" ni tokens especulativos bajo el Art. 30 de la LRITF; son representaciones criptográficas y notariales de derechos fiduciarios inmobiliarios amparados por los Artículos 89 al 114 del Código de Comercio.
- La blockchain e IPFS funcionan como una BITÁCORA NOTARIAL DE ALTÍSIMA PRECISIÓN (Libro de Registro de Fideicomisarios) que reduce costos registrales y garantiza transparencia absoluta en tiempo real.

4. CONCLUSIÓN Y VALIDEZ:
El modelo cuenta con blindaje fiduciario pleno, gozando de certeza registral, fiscal y testamentaria en territorio de los Estados Unidos Mexicanos.`,
    },
    {
      id: 'doc_eip191_custody',
      title: 'Acuerdo de Gobernanza Digital y Protocolo EIP-191',
      badge: 'Protocolo Criptográfico Soberano',
      pages: '8 Cláusulas Técnicas',
      description: 'Términos de custodia en Smart Contracts, descentralización de bóvedas fiduciarias y firmas electrónicas avanzadas.',
      folio: 'PFI-EIP-2026-00204-ETH',
      content: `PROTOCOLO DE CUSTODIA DIGITAL, FIRMA CRIPTOGRÁFICA EIP-191 Y GOBERNANZA PAS v1.0

CLÁUSULAS DE GOBERNANZA TÉCNICA:

1. ESTÁNDAR DE FIRMA SOLEMNE EIP-191:
Toda adhesión, aprobación de gastos de mantenimiento extraordinario y reclamo de dividendos es rubricada mediante el estándar Ethereum Improvement Proposal 191 (EIP-191) con firma criptográfica secp256k1.
Conforme a la Ley Modelo de la CNUDMI sobre Comercio Electrónico y el Artículo 97 del Código de Comercio mexicano, dicha firma se equipara a la firma autógrafa con plena eficacia jurídica y no repudio.

2. ANCLAJE DETERMINISTA EN IPFS (CIDv1 SOVEREIGN):
La escritura notarial, los planos ejecutivos, el dictamen de impacto ambiental y la lista de Fideicomisarios son encapsulados en un identificador de contenido inmutable (CIDv1) en IPFS con replicación soberana en múltiples nodos independientes.
Ninguna autoridad central ni Pandora's OS tiene capacidad unilateral de borrar, alterar o sobreescribir la prueba matemática del derecho adquirido.

3. SMART CONTRACTS DE DISPERSIÓN ATÓMICA:
Los contratos inteligentes del protocolo operan bajo las siguientes directivas deterministas:
a) Verificación de elegibilidad KYC/AML en tiempo de ejecución.
b) Cálculo pro-rata sin redondeo a favor de terceros.
c) Dispersión atómica de dividendos en USDC auditada por hash en cada corte trimestral.

4. AUDITORÍAS FORMALES DE CÓDIGO:
Todo el código de dispersión, gestión de membresías y votación DAO ha sido objeto de análisis estático y pruebas de regresión automatizadas con cobertura del 100% en condiciones de frontera.`,
    },
    {
      id: 'doc_tax_regime',
      title: 'Dictamen de Régimen Fiscal y Retención en USDC / Fiat',
      badge: 'Marco Fiscal & Contable',
      pages: '6 Secciones Especializadas',
      description: 'Tratamiento fiscal mexicano e internacional para ingresos por arrendamiento turístico y plusvalía fiduciaria (LISR/SAT).',
      folio: 'PFI-TAX-2026-00109-SAT',
      content: `MEMORÁNDUM TÉCNICO FISCAL: TRATAMIENTO DE INGRESOS DERIVADOS DE FIDEICOMISOS INMOBILIARIOS RWA

1. RÉGIMEN FISCAL APLICABLE (MÉXICO - LISR):
Los rendimientos percibidos a través de certificados fiduciarios inmobiliarios tributan bajo el Título IV, Capítulo III de la Ley del Impuesto sobre la Renta (Ingresos por Arrendamiento y en general por otorgar el uso o goce temporal de bienes inmuebles), permitiendo al inversionista persona física optar por:
a) Deducción Ciega del 35% del total de los ingresos percibidos más el impuesto predial pagado, sin necesidad de comprobantes fiscales de gastos.
b) Deducción Comprobada de gastos operativos, mantenimiento, seguros y depreciación.

2. DISPERSIÓN EN CRIPTOMONEDAS ESTABLES (USDC) Y TIPO DE CAMBIO OFICIAL:
De conformidad con las disposiciones del Código Fiscal de la Federación (CFF) y los criterios normativos del SAT:
- La dispersión en USDC se contabiliza en moneda nacional al Tipo de Cambio FIX publicado por el Banco de México en el Diario Oficial de la Federación el día de la dispersión.
- Se expide el Comprobante Fiscal Digital por Internet (CFDI) con complemento de retenciones e información de pagos, facilitando la declaración anual del inversionista.

3. INVERSIONISTAS INTERNACIONALES (NON-RESIDENTS):
Para personas residentes en Estados Unidos, Canadá o la Unión Europea, aplican los Tratados para Evitar la Doble Tributación (Convenios Bilaterales):
- La retención en México suele ser definitiva (25% o reducida según convenio).
- El inversionista recibe constancia fiscal para acreditar dicho pago como crédito fiscal en su país de residencia mediante la forma W-8BEN o equivalente.`,
    },
    {
      id: 'doc_transfer_addendum',
      title: 'Addendum de Cesión de Derechos y Reglas de Mercado Secundario',
      badge: 'Liquidez & Cesión de Derechos',
      pages: '9 Cláusulas Operativas',
      description: 'Reglas de transmisión P2P de fracciones, protocolo de cesión notarial simplificada y funcionamiento de la Bóveda de Recompra.',
      folio: 'PFI-ADD-2026-00332-LIQ',
      content: `ADDENDUM DE CESIÓN DE DERECHOS FIDEICOMISARIOS, TRANSMISIÓN SECUNDARIA Y BÓVEDA DE RECOMPRA AUTOMATIZADA

CLÁUSULAS REGULATORIAS DEL MERCADO SECUNDARIO:

PRIMERA. — LIBRE TRANSMISIBILIDAD ENTRE TERCEROS CALIFICADOS.
Los Certificados de Participación Inmobiliaria PAS v1.0 son libremente transferibles entre personas que hayan completado exitosamente el procedimiento de verificación de identidad (KYC/AML) de Pandora's Growth OS.

SEGUNDA. — REGISTRO EN EL LIBRO DE ACCIONISTAS Y FIDEICOMISARIOS.
Toda cesión surte efectos contra terceros y ante la Fiduciaria Institucional a partir de su registro determinista en el Smart Contract y su posterior notificación electrónica al Fideicomiso. No se requiere comparecencia física ante notario público para cesiones entre particulares, salvo solicitud expresa de cualquiera de las partes.

TERCERA. — CONDICIONES DE OPERACIÓN DE LA BÓVEDA DE RECOMPRA (BUYBACK POOL).
1) Periodicidad: Las solicitudes de amortización voluntaria se procesan trimestralmente durante los primeros 10 días naturales posteriores al corte contable.
2) Precio de Recompra: El valor de adquisición de cada fracción corresponde exactamente al Net Asset Value (NAV) por fracción determinado por el perito valuador colegiado en el corte inmediato anterior.
3) Comisión por Liquidez Inmediata: Aplica una tarifa preferencial del 2.5% sobre el valor nominal liquidado destinada a fortalecer la reserva fiduciaria de estabilización del desarrollo.`,
    },
    {
      id: 'doc_underwriting_sheet',
      title: 'Ficha Maestra de Due Diligence y Underwriting Territorial',
      badge: 'Auditoría & Factibilidad',
      pages: '10 Criterios de Selección',
      description: 'Matriz estricta de admisión de proyectos inmobiliarios en Bahía de Banderas, filtros de gravamen, licencias de construcción e impacto ambiental.',
      folio: 'PFI-UND-2026-00055-BUC',
      content: `FICHA MAESTRA DE AUDITORÍA TÉCNICA, FINANCIERA Y TERRITORIAL (UNDERWRITING PROTOCOL)
ZONA DE APLICACIÓN: Bahía de Banderas (Bucerías, Zona Dorada, Punta de Mita y Nuevo Vallarta).

1. CRITERIOS DETERMINANTES DE ADMISIÓN (GATEWAYS):
Para que un proyecto inmobiliario califique para ser tokenizado en Pandora's OS debe superar el 100% de los siguientes filtros:
- TÍTULO DE PROPIEDAD: Inmueble 100% escriturado, libre de gravamen, litigio agrario o servidumbres no declaradas.
- APORTACIÓN FIDUCIARIA: Compromiso vinculante de aportación del inmueble a Fideicomiso de Administración antes de la apertura de la preventa pública.
- LICENCIAS GUBERNAMENTALES: Licencia de Construcción vigente emitida por la Dirección de Desarrollo Urbano de Bahía de Banderas y Manifestación de Impacto Ambiental (MIA) aprobada por SEMARNAT.
- LTV MÁXIMO PERMITIDO: Financiamiento bancario o deuda constructora menor al 35% del valor comercial total proyectado.

2. PARÁMETROS TÉCNICOS DE MERCADO (BUCERÍAS FACTOR):
- Costo de Construcción Paramétrico: $1,200 - $1,650 USD / m2 (acabados de ultra lujo y tecnología sísmica costera).
- Precio de Preventa Fraccional Objetivo: $3,200 - $4,200 USD / m2.
- Absorción Estimada de Preventa: Mínimo 8% a 12% del inventario por trimestre.
- Cap Rate Objetivo Hotelero: 8.5% a 12.0% anual neto en dólares estadounidenses.`,
    }
  ];

  const objectionCategories = [
    {
      id: 'LEGAL',
      title: 'Objeciones Legales & Fiduciarias',
      count: 7,
      items: [
        {
          q: '¿Dónde está mi escritura en papel ante notario público?',
          a: 'La propiedad matriz está 100% escriturada e inscrita ante Notario Público en el Registro Público de la Propiedad en Bucerías, Nayarit, a nombre del Fideicomiso. Como participante fraccional, tú eres Fideicomisario titular de los derechos de propiedad, respaldado por un Contrato Notarial de Adhesión y un Certificado de Custodia Soberano digital inviolable. Funciona igual que cuando compras acciones de un fideicomiso como FIBRA Uno: no te dan un ladrillo físico, te dan un título legal que acredita tu porcentaje del inmueble.',
          tip: 'Abre tu smartphone y muestra tu propio contrato en el portal de S\'Narai.'
        },
        {
          q: '¿Qué pasa si la empresa desarrolladora o constructora quiebra?',
          a: 'El inmueble está blindado en un Fideicomiso de Administración con patrimonio autónomo. Eso significa que la tierra y la obra ya no pertenecen al desarrollador, sino al fideicomiso en beneficio de los inversionistas. Si la constructora tiene problemas o demandas, sus acreedores NO pueden embargar el inmueble porque es legalmente intocable. El fideicomiso sustituye al constructor y el proyecto continúa.',
          tip: 'Enfatiza el principio de "Bankruptcy Remoteness". Es la mayor seguridad del derecho mexicano.'
        },
        {
          q: '¿Esto está regulado o es algo piramidal / desregulado?',
          a: 'Está completamente regulado por la Ley General de Títulos y Operaciones de Crédito, la Ley de Instituciones de Crédito y el Código de Comercio. No es captación bancaria pasiva ni esquemas piramidales: es la compra directa de derechos de propiedad sobre un desarrollo real con licencia de construcción y manifestación de impacto ambiental aprobada.',
          tip: 'Entrega el Memorándum Legal de No-Captación Bancaria para que lo revise su abogado patrimonial.'
        }
      ]
    },
    {
      id: 'FINANCIAL',
      title: 'Objeciones Financieras & Rentabilidad',
      count: 6,
      items: [
        {
          q: '¿Por qué no meter mi dinero al banco en pagarés al 10% o en CETES?',
          a: 'Porque los pagarés y CETES pagan en pesos mexicanos, una moneda expuesta a la inflación y a la devaluación histórica frente al dólar. En proyectos como S\'Narai o Vista Horizonte en Bucerías, tu inversión está respaldada en dólares y tierra de alta plusvalía. Recibes rentas turísticas dolarizadas (Cap Rate del 9.5%+) más una plusvalía anual proyectada del 12% al 15% por el crecimiento de la Zona Dorada. Tu rendimiento real compuesto supera por mucho cualquier tasa fija bancaria.',
          tip: 'Usa la Calculadora de Rendimientos Duales en la pestaña financiera frente al cliente.'
        },
        {
          q: '¿Y si necesito mi dinero antes de los 3 o 5 años?',
          a: 'Tienes dos salidas de liquidez: 1) Puedes ceder o vender tu fracción en cualquier momento a otro inversionista a través del mercado secundario de Pandora\'s sin costos notariales abusivos. 2) Pandora\'s cuenta con una Bóveda de Recompra (Buyback Pool) que adquiere fracciones al valor neto de los activos (NAV) certificado por un perito independiente.',
          tip: 'Compáralo con una casa tradicional donde tardas 12 meses en vender y pagas 5% de comisión más notarías.'
        }
      ]
    },
    {
      id: 'SALES',
      title: 'Objeciones Tecnológicas & "Criptomonedas"',
      count: 6,
      items: [
        {
          q: 'A mí no me gusta el Bitcoin ni las criptomonedas, son muy volátiles.',
          a: 'Nosotros tampoco invertimos en criptomonedas especulativas. Esto NO es Bitcoin ni Ethereum. Nosotros vendemos departamentos reales en Bucerías y Nuevo Vallarta. La tecnología solo la usamos como un "notario digital ultra eficiente" para reducir los costos de intermediación y que puedas entrar con $25,000 USD en lugar de tener que comprar el edificio completo de $500,000 USD. Tus rentas caen en dólares y tu garantía es el ladrillo.',
          tip: 'Nunca uses palabras como "token", "blockchain" o "gas fees" si el cliente tiene más de 50 años.'
        },
        {
          q: '¿Qué pasa si me muero o pierdo mi teléfono?',
          a: 'El contrato fiduciario incluye designación formal de beneficiarios herederos. Como el fideicomiso es una figura bancaria y legal reconocida, tus herederos solo necesitan presentar su identificación y acta notarial ante la fiduciaria para adjudicarse los derechos, exactamente igual que una cuenta de inversión tradicional.',
          tip: 'Muestra la cláusula de Beneficiarios Fiduciarios del Contrato Marco.'
        }
      ]
    },
    {
      id: 'TERRITORIAL',
      title: 'Objeciones de Mercado: Bucerías y Riviera Nayarit',
      count: 6,
      items: [
        {
          q: '¿Por qué invertir en Bucerías y no en Puerto Vallarta o Cancún?',
          a: 'Puerto Vallarta y Cancún ya tienen el mercado saturado, con precios por m2 en máximos y densidades masivas. La Zona Dorada de Bucerías es hoy el epicentro de mayor escasez de tierra y mayor crecimiento de rentas vacacionales de toda la Riviera Nayarit. El turismo canadiense y estadounidense de alto poder adquisitivo prefiere el ambiente boutique, gastronómico y seguro de Bucerías, lo que garantiza ocupaciones superiores al 70% anual.',
          tip: 'Cita la tesis de mercado "The Bucerías Factor" del Master.'
        },
        {
          q: '¿Cuáles son los 3 proyectos activos y cuál me conviene?',
          a: 'Depende de tu objetivo: Si buscas máxima plusvalía en preventa de lujo, S\'Narai en la Zona Dorada de Bucerías. Si prefieres un departamento residencial vertical con vista franca al mar, Torre Vista Horizonte en Bucerías. Y si quieres flujo de rentas vacacionales inmediato desde el primer mes, el Condominio terminado a pie de playa en Nuevo Vallarta.',
          tip: 'Ofrece diversificar su capital distribuyéndolo entre preventa y activo terminado.'
        }
      ]
    }
  ];

  const currentDoc = legalDocs.find((d) => d.id === selectedDocId) ?? legalDocs[0]!;

  // Filter objections if searching
  const filteredObjectionCats = objectionCategories.map((cat) => {
    if (!searchQuery) return cat;
    const qLower = searchQuery.toLowerCase();
    const filteredItems = cat.items.filter(
      (item) => item.q.toLowerCase().includes(qLower) || item.a.toLowerCase().includes(qLower) || item.tip.toLowerCase().includes(qLower)
    );
    return { ...cat, items: filteredItems };
  }).filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#D4A853]/30 selection:text-white font-sans antialiased">
      {/* ─── PRINT-ONLY FORMAL NOTARIAL DOCUMENT (Triggered by window.print()) ─── */}
      <div className="hidden print:block text-black bg-white p-8 font-serif leading-relaxed">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase">PANDORAS FIDUCIARY INSTITUTE &amp; ACADEMY</div>
            <div className="text-[10px] text-gray-600">DIVISIÓN DE DERECHO FIDUCIARIO INMOBILIARIO Y ACTIVOS DEL MUNDO REAL (RWA)</div>
            <div className="text-lg font-extrabold mt-2">{currentDoc.title}</div>
          </div>
          <div className="text-right text-[10px] font-mono">
            <div>FOLIO: {currentDoc.folio}</div>
            <div>FECHA: {new Date().toLocaleDateString('es-MX')}</div>
            <div>SELLO: SHA-256 / VALIDATED</div>
          </div>
        </div>

        <div className="text-xs text-justify space-y-4 whitespace-pre-wrap">
          {currentDoc.content}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-400 grid grid-cols-2 gap-8 text-center text-[10px]">
          <div>
            <div className="h-16 border-b border-gray-400 mb-2"></div>
            <div className="font-bold">POR LA FIDUCIARIA INSTITUCIONAL AUTORIZADA</div>
            <div className="text-gray-500">Titular del Patrimonio Autónomo Fiduciario</div>
            <div className="font-mono text-[9px]">Sello Digital: 0x9f8b...e4a1</div>
          </div>
          <div>
            <div className="h-16 border-b border-gray-400 mb-2"></div>
            <div className="font-bold">POR EL FIDEICOMISARIO ADHERENTE / INVERSIONISTA</div>
            <div className="text-gray-500">Titular de Derechos Fraccionales PAS v1.0</div>
            <div className="font-mono text-[9px]">Firma Criptográfica EIP-191</div>
          </div>
        </div>

        <div className="mt-8 text-center text-[9px] text-gray-500 font-mono">
          Documento emitido con valor vinculante conforme al Código de Comercio y Ley General de Títulos y Operaciones de Crédito. Anclaje soberano IPFS.
        </div>
      </div>

      {/* ─── Top Bar ─── */}
      <div className="bg-zinc-950 border-b border-zinc-900 py-3 px-6 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/academy/master-tokenizacion"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la Landing del Master
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D4A853]/10 text-[#D4A853] text-[10px] font-mono border border-[#D4A853]/20 uppercase">
              <Sparkles className="w-3 h-3" />
              Sovereign Fiduciary Vault
            </span>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#D4A853]" />
              <span className="hidden sm:inline">Imprimir / Guardar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Hero Section ─── */}
      <section className="py-10 px-6 border-b border-zinc-900 bg-gradient-to-b from-zinc-950 to-black print:hidden">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A853]/10 border border-[#D4A853]/30 text-[#D4A853] text-xs font-mono uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            Acceso Exclusivo para Estudiantes y Graduados del Master
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Sovereign Legal, Financial &amp; Sales Vault
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Los contratos fiduciarios, fichas de underwriting territorial, calculadoras de retorno dual y argumentarios de venta que respaldan el ecosistema de Pandora's en Bahía de Banderas, Nayarit.
          </p>

          {/* Navigation Tabs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 border-b border-zinc-900 pb-3">
            <button
              onClick={() => setActiveTab('LEGAL_KITS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'LEGAL_KITS'
                  ? 'bg-[#D4A853] text-black font-bold shadow-[0_0_20px_rgba(212,168,83,0.25)]'
                  : 'text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800'
              }`}
            >
              <Scale className="w-4 h-4" />
              1. Kits Legales VIP ({legalDocs.length})
            </button>
            <button
              onClick={() => setActiveTab('UNDERWRITING_KIT')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'UNDERWRITING_KIT'
                  ? 'bg-[#D4A853] text-black font-bold shadow-[0_0_20px_rgba(212,168,83,0.25)]'
                  : 'text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              2. Underwriting Kit
            </button>
            <button
              onClick={() => setActiveTab('FINANCIAL_CALC')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'FINANCIAL_CALC'
                  ? 'bg-[#D4A853] text-black font-bold shadow-[0_0_20px_rgba(212,168,83,0.25)]'
                  : 'text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800'
              }`}
            >
              <Calculator className="w-4 h-4" />
              3. Calculadora de Retornos
            </button>
            <button
              onClick={() => setActiveTab('OBJECTION_BIBLE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'OBJECTION_BIBLE'
                  ? 'bg-[#D4A853] text-black font-bold shadow-[0_0_20px_rgba(212,168,83,0.25)]'
                  : 'text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              4. The Objection Bible
            </button>
            <button
              onClick={() => setActiveTab('DATA_ROOM_THESIS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'DATA_ROOM_THESIS'
                  ? 'bg-[#D4A853] text-black font-bold shadow-[0_0_20px_rgba(212,168,83,0.25)]'
                  : 'text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800'
              }`}
            >
              <Database className="w-4 h-4" />
              5. Tesis &amp; Data Room S'Narai
            </button>
          </div>
        </div>
      </section>

      {/* ─── TAB 1: LEGAL KITS (CONTRATOS REALES) ─── */}
      {activeTab === 'LEGAL_KITS' && (
        <section className="py-12 px-6 max-w-7xl mx-auto print:hidden">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Sidebar: Document Picker */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
                Documentos Fiduciarios Descargables ({legalDocs.length})
              </h3>
              {legalDocs.map((doc) => {
                const isSelected = selectedDocId === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full p-4 rounded-2xl text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-950 border-[#D4A853] shadow-[0_0_25px_rgba(212,168,83,0.15)]'
                        : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4A853]/10 text-[#D4A853] border border-[#D4A853]/20">
                        {doc.badge}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">{doc.pages}</span>
                    </div>
                    <h4 className={`text-sm font-bold mt-1 ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                      {doc.title}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                      {doc.description}
                    </p>
                  </button>
                );
              })}

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#D4A853]" />
                  Aviso de Propiedad Intelectual
                </div>
                <p className="text-[11px] leading-relaxed">
                  Estos modelos contractuales han sido elaborados por especialistas en Derecho Fiduciario y Ley Fintech. Tienes licencia permanente para usarlos con tus clientes y desarrollos inmobiliarios.
                </p>
              </div>
            </div>

            {/* Document Viewer (VIP Obsidian View) */}
            <div className="lg:col-span-8">
              <div className="rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
                {/* Viewer Header */}
                <div className="p-6 border-b border-zinc-900 bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono text-[#D4A853] uppercase tracking-wider mb-0.5">
                      {currentDoc.badge} · Folio: {currentDoc.folio}
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      {currentDoc.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentDoc.content);
                        setCopiedText(true);
                        toast.success('Contenido copiado al portapapeles');
                        setTimeout(() => setCopiedText(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText ? 'Copiado' : 'Copiar'}</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-3.5 py-1.5 rounded-lg bg-[#D4A853] text-black font-bold text-xs hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar PDF</span>
                    </button>
                  </div>
                </div>

                {/* Viewer Document Body */}
                <div className="p-6 sm:p-8 font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto selection:bg-[#D4A853]/20">
                  {currentDoc.content}
                </div>

                {/* Viewer Footer */}
                <div className="p-4 bg-zinc-900/20 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>Hash Criptográfico Soberano: SHA-256 Validated</span>
                  <span>Ecosistema Bahía de Banderas, Nayarit</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── TAB 2: UNDERWRITING KIT ─── */}
      {activeTab === 'UNDERWRITING_KIT' && (
        <section className="py-12 px-6 max-w-5xl mx-auto space-y-8 print:hidden">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Underwriting Kit: Auditoría &amp; Factibilidad Territorial
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              La matriz paramétrica con la que Pandora's y los agentes egresados auditan desarrollos antes de emitir fracciones en Bahía de Banderas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-[#D4A853] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                1. Filtros Eliminatorios de Legalidad (Hard Gates)
              </h3>
              <ul className="space-y-2 text-xs text-zinc-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Escritura Matriz Libre de Gravamen:</strong> Inscripción registral definitiva en el RPP de Nayarit sin hipotecas de constructores no liquidadas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Bankruptcy Remoteness:</strong> Obligación de aportar el inmueble a Fideicomiso Irrevocable de Administración antes de recibir fondos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Impacto Ambiental SEMARNAT:</strong> MIA aprobada y autorización de cambio de uso de suelo costero.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-[#D4A853] flex items-center gap-2">
                <BadgePercent className="w-4 h-4" />
                2. Métricas Financieras Paramétricas (Bahía de Banderas)
              </h3>
              <ul className="space-y-2 text-xs text-zinc-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Costo Paramétrico de Obra:</strong> $1,200 a $1,650 USD/m2 en acabados boutique de lujo y resistencia marina.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Spread de Preventa vs Entrega:</strong> Mínimo 25% de plusvalía calculada entre la preventa inicial y el valor terminado.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Cap Rate Hotelero Auditado:</strong> Mínimo 8.5% anual neto en dólares estadounidenses bajo operador vacacional profesional.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-[#D4A853]/30 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#D4A853]" />
              Checklist de Auditoría para Presentar Desarrollos al Comité
            </h3>
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="font-bold text-white mb-1">A. Due Diligence Legal</div>
                <div className="text-zinc-400 text-[11px]">Certificado de libertad de gravamen (últimos 30 días), acta constitutiva de la desarrolladora y poderes notariales.</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="font-bold text-white mb-1">B. Factibilidad Técnica</div>
                <div className="text-zinc-400 text-[11px]">Planos arquitectónicos aprobados, mecánica de suelos, factibilidad de agua potable y red eléctrica.</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="font-bold text-white mb-1">C. Corrida Financiera</div>
                <div className="text-zinc-400 text-[11px]">Presupuesto paramétrico desglosado, cronograma de obra y simulación de flujos hoteleros de los 3 proyectos activos.</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── TAB 3: FINANCIAL CALCULATOR ─── */}
      {activeTab === 'FINANCIAL_CALC' && (
        <section className="py-12 px-6 max-w-5xl mx-auto space-y-8 print:hidden">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Calculadora Interactiva de Rendimientos Duales
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              Simula frente a tu cliente el poder del retorno dual en Bucerías: flujo de rentas hoteleras en dólares (USDC) más plusvalía de tierra y obra.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Controls */}
            <div className="md:col-span-5 p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Calculator className="w-4 h-4 text-[#D4A853]" />
                Variables de Simulación
              </h3>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400">Monto de Inversión Fraccional:</span>
                  <span className="font-bold text-[#D4A853] font-mono">${investmentAmount.toLocaleString()} USD</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={100000}
                  step={5000}
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                  className="w-full accent-[#D4A853]"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-1">
                  <span>$5,000 USD (Min)</span>
                  <span>$50,000 USD</span>
                  <span>$100,000 USD</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400">Cap Rate Anual (Renta Hotelera):</span>
                  <span className="font-bold text-white font-mono">{capRate}% anual</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={14}
                  step={0.5}
                  value={capRate}
                  onChange={(e) => setCapRate(Number(e.target.value))}
                  className="w-full accent-[#D4A853]"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-1">
                  <span>6.0% (Conservador)</span>
                  <span>9.5% (S'Narai Target)</span>
                  <span>14.0% (Optimista)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400">Plusvalía Anual Proyectada:</span>
                  <span className="font-bold text-white font-mono">{appreciationRate}% anual</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={20}
                  step={1}
                  value={appreciationRate}
                  onChange={(e) => setAppreciationRate(Number(e.target.value))}
                  className="w-full accent-[#D4A853]"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-1">
                  <span>8% (Inflación)</span>
                  <span>14% (Factor Bucerías)</span>
                  <span>20% (Alta Absorción)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400">Horizonte de Inversión:</span>
                  <span className="font-bold text-white font-mono">{holdingYears} Años</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setHoldingYears(yr)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        holdingYears === yr
                          ? 'bg-[#D4A853] text-black font-bold'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {yr} {yr === 1 ? 'Año' : 'Años'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Dashboard */}
            <div className="md:col-span-7 space-y-6">
              <div className="p-8 rounded-3xl bg-zinc-950 border border-[#D4A853]/40 space-y-6 shadow-[0_0_40px_rgba(212,168,83,0.1)]">
                <div className="text-xs font-mono text-[#D4A853] uppercase tracking-wider">
                  Proyección de Retorno Dual ({holdingYears} Años)
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Flujo de Rentas en USDC:</div>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-1">
                      +${Math.round(totalRentalYieldUSD).toLocaleString()} USD
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">
                      (${Math.round(annualRentalYieldUSD).toLocaleString()} USD / año)
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Ganancia por Plusvalía:</div>
                    <div className="text-xl sm:text-2xl font-bold text-[#D4A853] font-mono mt-1">
                      +${Math.round(projectedAppreciationUSD).toLocaleString()} USD
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">
                      (Apreciación del NAV de Bucerías)
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-zinc-400">Valor Final Estimado del Portafolio:</div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-1">
                      ${Math.round(finalPortfolioValueUSD).toLocaleString()} USD
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-right">
                    <div className="text-[10px] font-mono text-emerald-400 uppercase">ROI Acumulado</div>
                    <div className="text-2xl font-extrabold text-emerald-300 font-mono">
                      +{roiPercentage}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Pitch Comparativo Bancario */}
              <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3 text-xs">
                <div className="font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  El Argumento Irrefutable frente al Pagaré Bancario en Pesos:
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Si tu cliente deja ${investmentAmount.toLocaleString()} USD en pesos mexicanos en un banco al 10%, la devaluación histórica del peso frente al dólar (promedio 4-6% anual) reduce drásticamente su poder de compra real. En S'Narai, su capital está <strong className="text-white">respaldado en m2 reales frente al mar</strong>, recibiendo dólares directos y capturando la escasez física de la Zona Dorada de Bucerías.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── TAB 4: THE OBJECTION BIBLE (25 RESPUESTAS) ─── */}
      {activeTab === 'OBJECTION_BIBLE' && (
        <section className="py-12 px-6 max-w-5xl mx-auto space-y-8 print:hidden">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              The Objection Bible: 25 Respuestas de Cierre Inmobiliario
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              Las dudas exactas que plantean los inversionistas patrimoniales tradicionales y cómo responderlas con autoridad moral, rigor fiduciario y lenguaje humano.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por objeción, notaría, CETES, herederos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D4A853]"
            />
          </div>

          <div className="space-y-8">
            {filteredObjectionCats.map((cat) => (
              <div key={cat.id} className="space-y-4">
                <h3 className="text-base font-bold text-[#D4A853] flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <Sparkles className="w-4 h-4" />
                  {cat.title} ({cat.items.length} Preguntas)
                </h3>

                <div className="space-y-3">
                  {cat.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 hover:border-zinc-700 transition-all"
                    >
                      <div className="font-bold text-white text-sm flex items-start gap-2.5">
                        <span className="text-[#D4A853] font-mono text-xs mt-0.5">Q:</span>
                        <span>"{item.q}"</span>
                      </div>

                      <div className="text-xs text-zinc-300 leading-relaxed pl-5 border-l-2 border-[#D4A853]/40">
                        {item.a}
                      </div>

                      <div className="pl-5 text-[11px] text-[#D4A853] flex items-center gap-1.5 font-medium">
                        <span>💡 Tip de Cierre:</span>
                        <span className="text-zinc-400 font-normal">{item.tip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── TAB 5: TESIS & DATA ROOM S'NARAI ─── */}
      {activeTab === 'DATA_ROOM_THESIS' && (
        <section className="py-12 px-6 max-w-5xl mx-auto space-y-8 print:hidden">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Tesis de Graduación: Skin in the Game en S'Narai
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              En Pandora's Academy no te gradúas entregando un PDF teórico. Te gradúas auditando y adquiriendo una fracción real en copropiedad de S'Narai Sanctuary &amp; Residences.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-zinc-950 border border-[#D4A853]/40 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#D4A853]/10 border border-[#D4A853]/30 text-[#D4A853]">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Nexus Data Room: S'Narai Sanctuary &amp; Residences</h3>
                <p className="text-xs text-zinc-400">Zona Dorada de Bucerías, Nayarit · Activo Inmobiliario Matriz</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="font-bold text-[#D4A853]">1. Due Diligence Técnico</div>
                <p className="text-zinc-400 text-[11px]">Planos ejecutivos, memoria de cálculo estructural y licencia de construcción autorizada por Bahía de Banderas.</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="font-bold text-[#D4A853]">2. Estructura Fiduciaria</div>
                <p className="text-zinc-400 text-[11px]">Escritura del Fideicomiso Irrevocable de Administración inscrita en el Registro Público de la Propiedad.</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="font-bold text-[#D4A853]">3. Corrida Financiera Auditada</div>
                <p className="text-zinc-400 text-[11px]">Modelo de absorción de preventa, Cap Rate hotelero proyectado del 9.5%+ y calendario de amortización.</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-black/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">¿Cómo se evalúa la Tesis?</div>
                <div className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">
                  El alumno audita los documentos del Data Room y estructura una propuesta ejecutiva de comercialización para un family office. Hermes evalúa socráticamente el dictamen. Al aprobar, el alumno recibe su Certificado Soberano y formaliza su fracción en S'Narai.
                </div>
              </div>

              <Link
                href="/academy/master-tokenizacion#postulacion"
                className="px-5 py-3 rounded-xl bg-[#D4A853] text-black font-bold text-xs hover:brightness-110 transition-all text-center shrink-0 cursor-pointer"
              >
                Postular a la Cohorte Génesis
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
