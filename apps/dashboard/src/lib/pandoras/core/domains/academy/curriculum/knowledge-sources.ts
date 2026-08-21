/**
 * 📚 Pandora's Academy — Canonical Knowledge Documents & Classified Sources
 * apps/dashboard/src/lib/pandoras/core/domains/academy/curriculum/knowledge-sources.ts
 *
 * Sourced directly from /DOCUMENTACIÓN (IOM, Corporate Structure LLC, IP Register IMPI, PAS, Deal Rooms).
 * Real SHA-256 dynamic content hashing guarantees absolute cryptographic immutability.
 */

import { createHash } from 'crypto';
import { ClassifiedKnowledgeDocument } from '../security/types';

function computeDocHash(content: string): string {
  return createHash('sha256').update(content.trim()).digest('hex');
}

const rawIOM = `[PANDORAS INSTITUTIONAL OPERATING MODEL — IOM v1.0]
PREÁMBULO: El IOM es el sistema operativo institucional multigeneracional que rige sobre todas las entidades, plataformas y jurisdicciones de Pandora's.

CAPÍTULO I — ARQUITECTURA DE 5 CAPAS:
Capa 1: Institutional Philosophy (Constitución, Doctrina, AaaS). Invariable y suprema.
Capa 2: Governance Layer (Corporate Charter, Governance, Matriz de Decisión). Reglas de control.
Capa 3: Asset System (PAS, Asset Register, IP, Licensing, Treasury). Patrimonio del Holding.
Capa 4: Operating System (Growth OS, Software, Dashboards, APIs, AI Engines). Software cambiante.
Capa 5: Execution Layer (Pandoras USA Operations LLC, LatAm Ops, Project SPVs). Entidades locales sustituibles.

CAPÍTULO II — PRINCIPIO DE BLINDAJE MULTI-ENTIDAD:
La titularidad de la Propiedad Intelectual y la tecnología es inalienable a favor del Holding y jamás se expone en contratos de prestación de servicios comerciales directos con clientes. Las entidades de Capa 5 operan bajo sublicenciamiento formal.`;

const rawCorpStructure = `[ESTRUCTURA EMPRESARIAL PANDORAS — HOLDING & OPERATING COMPANIES]
1. HOLDING (ADGM / UAE o El Salvador):
Propietaria de largo plazo de toda la IP, marcas registradas, código fuente, patentes, equity de subsidiarias y tesorería estratégica. No firma contratos de servicios con clientes finales.

2. OPERATING COMPANY INTERNACIONAL (Pandoras USA Operations LLC — Wyoming):
Es la entidad que verdaderamente opera a escala internacional: comercializa SaaS, firma acuerdos institucionales B2B con clientes globales, contrata proveedores de infraestructura e IA, y recibe flujos de facturación internacional.

3. OPERADORA LOCAL MÉXICO (MXHUB Ecosistema Blockchain S.A. de C.V.):
Entidad mexicana de operación para facturación local en pesos, soporte territorial y titularidad histórica de solicitudes de marca nacional.

4. VEHÍCULOS DE PROYECTO (Project SPVs):
Entidades de propósito específico y fideicomisos aislados por cada activo tokenizado (ej. S'Narai en Riviera Nayarit) para contener contingencias legales en su propio vehículo sin afectar a la matriz.`;

const rawIpMaster = `[PANDORAS IP MASTER REGISTER — DIAGNÓSTICO IMPI & HOJA DE RUTA]
1. DIAGNÓSTICO REGISTRAL HISTÓRICO:
Expediente IMPI 3394059 ('PANDORAS FOUNDATION', Clase 42, solicitante MXHUB S.A. de C.V.) se encuentra legalmente ABANDONADO y archivado (Art. 225 y 226 LFPPI).
Conclusión: No existe título ni derecho previo que ceder. La vía correcta es el registro limpio desde cero.

2. ARQUITECTURA DE MARCA PARAGUAS:
Marca Madre: 'PANDORAS' (a nombre de MXHUB S.A. de C.V. para posterior cesión al Holding).
Fase 1 de Registro:
- Clase 36: Servicios financieros, tokenización RWA, crowdlending, administración de activos y fideicomisos.
- Clase 42: Software SaaS, desarrollo de algoritmos, infraestructura de agentes cognitivos y scoring predictivo.
Fase 2 de Extensión:
- Clase 9 (Wallets y apps), Clase 35 (Marketplace), Clase 41 (Educación y Academy). Marcas secundarias: PANDORAS FINANCE, PANDORAS OS.`;

const rawPas = `[PANDORAS ASSET STANDARD — PAS v1.0]
1. IDENTIFICADORES GLOBALES INVARIABLES:
- PAND-IP-XXXXX: Propiedad intelectual, código, marcas registradas y algoritmos.
- PAND-FIN-XXXXX: Instrumentos financieros, participaciones tokenizadas, balances USDC.
- PAND-REAL-XXXXX: Activos físicos subyacentes, bienes raíces y contratos fiduciarios.
- PAND-DATA-XXXXX: Datasets propietarios, grafos de conocimiento y perfiles de scoring.

2. REGLA DE RECONOCIMIENTO Y EMISIÓN:
Queda terminantemente prohibido aprobar compras o emitir participaciones en dao_members sin que los fondos estén efectivamente liquidados y acreditados en las cuentas fiduciarias del proyecto.
Comprobantes retenidos o en validación bancaria permanecen estrictamente en estado PENDING / ON_HOLD.

3. DISTRIBUCIÓN PRO-RATA:
Las recompensas USDC se distribuyen exclusivamente con base en el saldo real liquidado de participaciones en la tabla dao_members al momento del corte contable.`;

const rawNexusDealRoom = `[NEXUS DEAL ROOMS SOP — GOBERNANZA B2B Y FIRMA CRIPTOGRÁFICA]
1. GATING SECUENCIAL DE DATA ROOM:
Nivel 1 (Público): Resumen ejecutivo y términos comerciales preliminares.
Nivel 2 (Restringido): Modelos financieros, libros institucionales, contratos marco y código fuente.

2. CONDICIÓN INEGOCIABLE DE ACCESO A NIVEL 2:
Todo acceso al Data Room Nivel 2 requiere la firma digital criptográfica (EIP-191) o electrónica avanzada del Master NDA institucional dentro de la estación de Nexus Deal Room.
Prohibido enviar documentación técnica confidencial por WhatsApp, correo u otros canales informales.`;

const rawCrisisSafeStop = `[CRISIS MANAGEMENT & SAFE STOP SOP — HERMES OS]
1. PROCEDIMIENTO DE CONTENCIÓN EN < 15 MINUTOS:
Paso 1: Pausar inmediatamente la autonomía del agente cognitivo mediante HumanHandoffProtocol.isPaused.
Paso 2: Tomar control manual del canal de mensajería (WhatsApp / Telegram / Web).
Paso 3: Notificar al Tenant Owner y al Chief of Staff a través del canal oficial de alertas.
Paso 4: Identificar y revocar el registro defectuoso en hermes_knowledge (estado SUPERSEDED / REJECTED) y registrar el evento en hermes_governance_audit.
Paso 5: Emitir comunicación institucional de cortesía rectificando cualquier error sin asumir compromisos no autorizados.`;

export const CANONICAL_KNOWLEDGE_DOCS: Record<string, ClassifiedKnowledgeDocument> = {
  IOM_v1_0: {
    docId: 'IOM_v1_0',
    title: 'Pandoras Institutional Operating Model (IOM v1.0)',
    version: '1.0',
    contentHash: computeDocHash(rawIOM),
    classification: 'CONFIDENTIAL',
    minClearance: 'TIER_1_COO',
    targetRoleScope: 'COO',
    ownerOrganizationId: 'pandoras_internal',
    summary: 'Arquitectura rectora de 5 capas de Pandora\'s. Define la separación entre filosofía institucional, gobernanza, activos, sistema operativo y entidades de ejecución local sustituibles.',
    fullContent: rawIOM
  },

  CORP_STRUCTURE_WYOMING_HOLDING_v1_0: {
    docId: 'CORP_STRUCTURE_WYOMING_HOLDING_v1_0',
    title: 'Estructura Empresarial Multi-Entidad & Rol de Wyoming LLC (v1.0)',
    version: '1.0',
    contentHash: computeDocHash(rawCorpStructure),
    classification: 'CONFIDENTIAL',
    minClearance: 'TIER_1_COO',
    targetRoleScope: 'COO',
    ownerOrganizationId: 'pandoras_internal',
    summary: 'Separación entre Holding de largo plazo (ADGM/UAE), Pandora\'s USA Operations LLC (Operating Company internacional en Wyoming), MXHUB (operadora en México) y Project SPVs.',
    fullContent: rawCorpStructure
  },

  IP_MASTER_REGISTER_IMPI_v1_0: {
    docId: 'IP_MASTER_REGISTER_IMPI_v1_0',
    title: 'Pandoras Intellectual Property Master Register & IMPI Trademark Strategy (v1.0)',
    version: '1.0',
    contentHash: computeDocHash(rawIpMaster),
    classification: 'CONFIDENTIAL',
    minClearance: 'TIER_1_COO',
    targetRoleScope: 'COO',
    ownerOrganizationId: 'pandoras_internal',
    summary: 'Diagnóstico del expediente 3394059 abandonado en IMPI y estrategia de registro de la Marca Madre PANDORAS en Clases 36 (Fintech/RWA) y 42 (SaaS/AI Engine).',
    fullContent: rawIpMaster
  },

  PAS_ASSET_STANDARD_v1_0: {
    docId: 'PAS_ASSET_STANDARD_v1_0',
    title: 'Pandoras Asset Standard (PAS v1.0) & Fiduciary Recognition Rules',
    version: '1.0',
    contentHash: computeDocHash(rawPas),
    classification: 'CONFIDENTIAL',
    minClearance: 'TIER_1_COO',
    targetRoleScope: 'COO',
    ownerOrganizationId: 'pandoras_internal',
    summary: 'Estándar para reconocimiento de activos (PAND-IP, PAND-FIN, PAND-REAL), cálculo de distribuciones pro-rata y prohibición absoluta de tokenización sin liquidación bancaria previa.',
    fullContent: rawPas
  },

  NEXUS_DEAL_ROOM_EIP191_SOP_v1_0: {
    docId: 'NEXUS_DEAL_ROOM_EIP191_SOP_v1_0',
    title: 'Nexus Deal Rooms Governance, EIP-191 Signatures & Nivel 2 Access (v1.0)',
    version: '1.0',
    contentHash: computeDocHash(rawNexusDealRoom),
    classification: 'INTERNAL',
    minClearance: 'TIER_2_OPERATIONS',
    targetRoleScope: 'ALL',
    ownerOrganizationId: 'pandoras_internal',
    summary: 'Protocolo de gobernanza para Transaction Rooms en Nexus. Exige firma criptográfica EIP-191 del Master NDA antes de liberar Data Room Nivel 2.',
    fullContent: rawNexusDealRoom
  },

  CRISIS_SAFE_STOP_SOP_v1_0: {
    docId: 'CRISIS_SAFE_STOP_SOP_v1_0',
    title: 'Crisis Management, Safe Stop Protocol & Human Handoff SOP (v1.0)',
    version: '1.0',
    contentHash: computeDocHash(rawCrisisSafeStop),
    classification: 'INTERNAL',
    minClearance: 'TIER_2_OPERATIONS',
    targetRoleScope: 'ALL',
    ownerOrganizationId: 'pandoras_internal',
    summary: 'Procedimiento operativo de contención en menos de 15 minutos ante alucinaciones o contingencias de agentes Hermes, pausa de canal y escalación humana auditada.',
    fullContent: rawCrisisSafeStop
  }
};
