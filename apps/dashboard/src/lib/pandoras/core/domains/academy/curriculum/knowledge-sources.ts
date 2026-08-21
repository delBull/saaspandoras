/**
 * 📚 Pandora's Academy — Official Knowledge Baseline
 * apps/dashboard/src/lib/pandoras/core/domains/academy/curriculum/knowledge-sources.ts
 *
 * Canonical versioned sources for training and assessment:
 * 1. IOM v1.0 (5-Layer Operating Model)
 * 2. Corporate Structure & Entity Shielding (MXHUB vs LLCs/SPVs)
 * 3. Deal Room & B2B Mandate SOP
 * 4. Treasury, PAS Asset Standard & Pro-Rata Distributions
 * 5. Crisis Protocols, Multichannel Escalation & Hermes Governance
 */

import { createHash } from 'crypto';
import { KnowledgeDocumentRef } from '../types';

function computeHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export const CANONICAL_KNOWLEDGE_DOCS: Record<string, KnowledgeDocumentRef> = {
  IOM_v1_0: {
    docId: 'IOM_v1_0',
    title: 'Pandoras Institutional Operating Model (IOM v1.0)',
    version: '1.0',
    contentHash: '',
    summary: 'Arquitectura de 5 capas: Filosofía (1), Gobernanza (2), Activos/PAS/Tesorería (3), Growth OS (4) y Capa de Ejecución (5). Define la separación estricta de responsabilidades y la jerarquía superior.',
    fullContent: `[IOM v1.0 PREÁMBULO & ARQUITECTURA DE 5 CAPAS]
El Pandoras Institutional Operating Model (IOM) es el sistema operativo institucional multigeneracional.
1. Capa 1 — Institutional Philosophy: Invariable y suprema (Doctrina, Principios, Misión).
2. Capa 2 — Governance Layer: Corporate Charter, Risk, Decision Matrix, Autorizaciones del Consejo.
3. Capa 3 — Asset System: PAS (Pandoras Asset Standard), Asset Register, IP, Licensing, Treasury.
4. Capa 4 — Operating System (Growth OS): Software, Dashboards, APIs, SDKs, Hermes AI Engines.
5. Capa 5 — Execution Layer: Entidades locales sustituibles (Pandoras USA LLC, LatAm Ops, SPVs, Clientes).

Principio Fundamental: La entidad titular de IP y matriz tecnológica jamás opera comercialmente en jurisdicciones locales con riesgo operativo directo; las filiales de ejecución (LLCs/SPVs) licencian el IOM y operan bajo mandato delimitado.`
  },

  CORP_STRUCTURE_v1_0: {
    docId: 'CORP_STRUCTURE_v1_0',
    title: 'Estructura Corporativa y Blindaje Patrimonial v1.0',
    version: '1.0',
    contentHash: '',
    summary: 'Definición de entidades: MXHUB Ecosistema Blockchain S.A. de C.V. (Titular de IP y matriz) vs Pandoras USA Operations LLC y SPVs de proyectos (Entidades operativas licenciadas).',
    fullContent: `[ESTRUCTURA CORPORATIVA & BLINDAJE]
- MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.: Matriz titular de toda la Propiedad Intelectual, código fuente, smart contracts, marcas, patentes y del IOM. Nunca asume pasivos comerciales directos ni firmas de contratos locales de servicios fuera de su objeto de matriz.
- PANDORAS USA OPERATIONS LLC: Entidad operativa de ejecución comercial en Estados Unidos y mercados internacionales. Licenciataria del IOM.
- VEHÍCULOS DE PROYECTOS (SPVs): Cada proyecto tokenizado (ej. S'Narai, Zunu) opera bajo un vehículo específico o mandato contractual delimitado, aislando el riesgo de crédito y pasivos entre proyectos.`
  },

  DEAL_ROOM_SOP_v1_0: {
    docId: 'DEAL_ROOM_SOP_v1_0',
    title: 'SOP de Gestión de Deal Rooms y Acuerdos B2B v1.0',
    version: '1.0',
    contentHash: '',
    summary: 'Procedimiento de apertura, protección y firma de Deal Rooms: Gating secuencial de NDA, verificación de facultades legales de personas morales, audit trail criptográfico y no divulgación.',
    fullContent: `[DEAL ROOM & B2B SOP]
1. Acceso y Confidencialidad: Ningún documento confidencial, propuesta financiera o arquitectura técnica puede revelarse sin la firma on-chain previa del Master NDA (v2.2).
2. Representación B2B: En acuerdos corporativos, la titular del contrato es la Empresa / Razón Social. El firmante debe acreditar carácter de Representante Legal o apoderado facultado.
3. Perfeccionamiento Criptográfico: Toda firma se registra on-chain (EIP-191) con timestamp inmutable, hash de documento y metadata en el audit trail de Nexus.
4. Prohibición de Modificación Unilateral: Las cláusulas de no-circunvención (24 meses) y protección de secretos industriales (indefinida) son no negociables sin autorización expresa del Consejo.`
  },

  TREASURY_PAS_SOP_v1_0: {
    docId: 'TREASURY_PAS_SOP_v1_0',
    title: 'SOP de Tesorería Institucional, PAS y Distribuciones v1.0',
    version: '1.0',
    contentHash: '',
    summary: 'Estándar de Activos PAS v1.0, custodia, arbitraje de compras off-chain/on-chain, sincronización de miembros DAO y distribución pro-rata de USDC.',
    fullContent: `[TREASURY & PAS SOP]
1. Pandoras Asset Standard (PAS v1.0): Marco de tokenización que vincula derechos económicos de activos del mundo real (RWA) con registros de gobernanza y trazabilidad on-chain.
2. Aprobación de Compras: Toda compra completada (fiat o cripto) requiere verificación de fondos, generación de agreement hash y sincronización en la tabla 'dao_members'.
3. Distribución Pro-Rata: Las recompensas y rendimientos se distribuyen en USDC directamente a los balances de los miembros proporcional a su voting power / unidades vigentes, registrando cada lote con auditoría contable.
4. Cero Mezcla de Fondos: Los fondos de tesorería de cada proyecto están estrictamente segregados; queda prohibido fondear gastos operativos de un proyecto con tesorería de otro.`
  },

  CRISIS_GOVERNANCE_SOP_v1_0: {
    docId: 'CRISIS_GOVERNANCE_SOP_v1_0',
    title: 'Protocolo de Crisis, Escalación Humana y Gobernanza Hermes v1.0',
    version: '1.0',
    contentHash: '',
    summary: 'Protocolo de Human Handoff multicanal (Telegram, WhatsApp, Discord, Email), ciclo de vida del conocimiento de Hermes (DISCOVERED -> PENDING_REVIEW -> ACTIVE -> SUPERSEDED) y respuesta ante incidentes.',
    fullContent: `[CRISIS & HERMES GOVERNANCE SOP]
1. Ciclo de Vida del Conocimiento: Ningún dato descubierto por la IA puede responder a clientes hasta ser aprobado por un OWNER/ADMIN (estado ACTIVE). Modificaciones directas en DB sin evento de auditoría constituyen una violación grave.
2. Protocolo de Escalación (Human Handoff): Ante consultas de alta cuantía, controversias o solicitudes de intervención, Hermes activa el protocolo de escalación y notifica al canal oficial configurado por el operador (Email, Telegram, WhatsApp o Discord).
3. Respuesta ante Incidentes: Ante una falla de servicio, ataque o discrepancia de datos, el COO debe suspender la interacción del agente, congelar los estados de auditoría y reportar al Consejo dentro de los primeros 60 minutos.`
  }
};

// Compute hashes safely
for (const key of Object.keys(CANONICAL_KNOWLEDGE_DOCS)) {
  const doc = CANONICAL_KNOWLEDGE_DOCS[key];
  if (doc) {
    doc.contentHash = computeHash(doc.fullContent);
  }
}
