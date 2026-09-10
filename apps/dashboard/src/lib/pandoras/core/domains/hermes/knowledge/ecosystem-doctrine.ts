/**
 * 🏛️ Pandora's Ecosystem Canonical Doctrine & Knowledge Claims
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/ecosystem-doctrine.ts
 *
 * Single Source of Truth for Pandora's Growth OS & Hermes OS Ecosystem Architecture.
 * Governed under Sovereign Knowledge Vault (K25) and Claim Contract Standards.
 */

import crypto from 'crypto';
import type { GovernedClaim, KnowledgeDisclosureClearance } from './claim-contract-engine';
import { computeCanonicalCidV1ForData } from './ipfs/canonical-cid';

export interface EcosystemDoctrineClaim extends GovernedClaim {
  disclosureClearance: KnowledgeDisclosureClearance;
  targetSurface: 
    | 'GLOBAL'
    | 'ADMIN_PANDORAS'
    | 'DASH_PANDORAS'
    | 'APP_PANDORAS'
    | 'TMA_PANDORAS'
    | 'TMA_HERMES';
  subArea?: string;
}

function computeProvenance(artifactId: string, assertion: string, version: number = 1) {
  const contentHash = crypto.createHash('sha256').update(assertion, 'utf8').digest('hex');
  const ipfsCid = computeCanonicalCidV1ForData({
    artifactId,
    assertion,
    version,
    domain: 'pandoras_ecosystem_doctrine',
  });
  return {
    artifactId,
    contentHash,
    ipfsCid,
    version,
  };
}

export const PANDORAS_ECOSYSTEM_CLAIMS: EcosystemDoctrineClaim[] = [
  // ===========================================================================
  // 1. PUBLIC TIER (Accessible to all: Retail investors, leads, operators, admins)
  // ===========================================================================
  {
    claimId: 'claim_pandoras_growth_os_overview',
    category: 'FACT',
    disclosureClearance: 'PUBLIC',
    targetSurface: 'GLOBAL',
    canonicalAssertion: "Pandora's Growth OS es la infraestructura integral para empresas autónomas que permite desplegar agentes de inteligencia cognitiva, gobernanza descentralizada y tokenización de activos de la economía real (RWA) bajo su propia identidad soberana.",
    permittedPhrasings: [
      "sistema operativo de crecimiento de Pandora's",
      "plataforma para empresas autónomas y tokenización RWA",
      "ecosistema integral de agentes, gobernanza y finanzas descentralizadas",
      'infraestructura para empresas autónomas',
    ],
    provenance: computeProvenance(
      'pandoras-overview-doctrine',
      "Pandora's Growth OS es la infraestructura integral para empresas autónomas que permite desplegar agentes de inteligencia cognitiva, gobernanza descentralizada y tokenización de activos de la economía real (RWA) bajo su propia identidad soberana."
    ),
  },
  {
    claimId: 'claim_hermes_growth_intelligence',
    category: 'FACT',
    disclosureClearance: 'PUBLIC',
    targetSurface: 'GLOBAL',
    canonicalAssertion: "Hermes es el sistema operativo cognitivo y de inteligencia de crecimiento de Pandora's Growth OS. Atiende a clientes, califica prospectos, interactúa por WhatsApp y Telegram, y opera bajo estrictas barreras criptográficas para evitar alucinaciones.",
    permittedPhrasings: [
      'inteligencia de crecimiento de Pandora',
      'sistema operativo cognitivo Hermes OS',
      'oficial de inteligencia de crecimiento',
      'infraestructura de agentes autónomos',
      'asistente cognitivo y sistema operativo Hermes OS',
    ],
    provenance: computeProvenance(
      'pandoras-hermes-core',
      "Hermes es el sistema operativo cognitivo y de inteligencia de crecimiento de Pandora's Growth OS. Atiende a clientes, califica prospectos, interactúa por WhatsApp y Telegram, y opera bajo estrictas barreras criptográficas para evitar alucinaciones."
    ),
  },
  {
    claimId: 'claim_pandoras_platform_capabilities',
    category: 'FACT',
    disclosureClearance: 'PUBLIC',
    targetSurface: 'GLOBAL',
    canonicalAssertion: "Pandora's Growth OS permite a empresas desplegar ecosistemas de agentes autónomos, gobernanza y tokenización de activos bajo su propia marca.",
    permittedPhrasings: [
      'plataforma de infraestructura para empresas autónomas',
      'tokenización de activos y gobernanza descentralizada',
      'soporte de marketing, tokenomics y activos inmobiliarios',
    ],
    provenance: computeProvenance(
      'pandoras-platform-capabilities',
      "Pandora's Growth OS permite a empresas desplegar ecosistemas de agentes autónomos, gobernanza y tokenización de activos bajo su propia marca."
    ),
  },
  {
    claimId: 'claim_app_pandoras_retail_portal',
    category: 'FACT',
    disclosureClearance: 'PUBLIC',
    targetSurface: 'APP_PANDORAS',
    subArea: 'Retail Investment & Exploration',
    canonicalAssertion: "app.pandoras.finance es el portal retail B2C donde los usuarios e inversores exploran proyectos tokenizados, adquieren fracciones de activos inmobiliarios o productivos, gestionan su portafolio patrimonial y monitorean sus rendimientos en USDC.",
    permittedPhrasings: [
      'portal de inversión retail de Pandora (app.pandoras.finance)',
      'explorador de proyectos tokenizados y rendimientos',
      'portal de usuario para comprar fracciones y ver portafolio',
    ],
    provenance: computeProvenance(
      'app-pandoras-portal',
      "app.pandoras.finance es el portal retail B2C donde los usuarios e inversores exploran proyectos tokenizados, adquieren fracciones de activos inmobiliarios o productivos, gestionan su portafolio patrimonial y monitorean sus rendimientos en USDC."
    ),
  },

  // ===========================================================================
  // 2. TENANT_RESTRICTED TIER (Tenants, Collaborators, Operators & Admins)
  // ===========================================================================
  {
    claimId: 'claim_dash_pandoras_nexus_overview',
    category: 'FACT',
    disclosureClearance: 'TENANT_RESTRICTED',
    targetSurface: 'DASH_PANDORAS',
    canonicalAssertion: "dash.pandoras.finance (Nexus Command Center) es la estación central de mando para empresas asociadas y colaboradores. Articula 3 verticales: 1) Core Protocol & Deal Rooms, 2) Growth OS & Developer Hub, y 3) Data Room Institucional & Academia.",
    permittedPhrasings: [
      'panel de control Nexus en dash.pandoras.finance',
      'estación de mando Nexus con sus 3 verticales operativas',
      'portal de operaciones y gobernanza para proyectos y equipos',
    ],
    provenance: computeProvenance(
      'dash-pandoras-nexus-overview',
      "dash.pandoras.finance (Nexus Command Center) es la estación central de mando para empresas asociadas y colaboradores. Articula 3 verticales: 1) Core Protocol & Deal Rooms, 2) Growth OS & Developer Hub, y 3) Data Room Institucional & Academia."
    ),
  },
  {
    claimId: 'claim_vertical_core_protocol_deal_rooms',
    category: 'FACT',
    disclosureClearance: 'TENANT_RESTRICTED',
    targetSurface: 'DASH_PANDORAS',
    subArea: 'Core Protocol (/nexus/rooms)',
    canonicalAssertion: "La vertical de Core Protocol y Deal Rooms (/nexus/rooms) permite crear, revisar y notarizar propuestas, acuerdos bilaterales, NDAs y contratos. Cada documento firmado genera un digest SHA-256 inmutable vinculado a la bóveda Sovereign K25 en IPFS.",
    permittedPhrasings: [
      'Deal Rooms y contratos notarizados en /nexus/rooms',
      'ejecución soberana de acuerdos bilaterales con firma SHA-256',
      'gestión jerárquica de propuestas, acuerdos y enmiendas',
    ],
    provenance: computeProvenance(
      'nexus-deal-rooms',
      "La vertical de Core Protocol y Deal Rooms (/nexus/rooms) permite crear, revisar y notarizar propuestas, acuerdos bilaterales, NDAs y contratos. Cada documento firmado genera un digest SHA-256 inmutable vinculado a la bóveda Sovereign K25 en IPFS."
    ),
  },
  {
    claimId: 'claim_vertical_growth_mesh_dev_hub',
    category: 'FACT',
    disclosureClearance: 'TENANT_RESTRICTED',
    targetSurface: 'DASH_PANDORAS',
    subArea: 'Growth OS & Channel Mesh (/nexus/developers)',
    canonicalAssertion: "La vertical de Growth OS y Developer Hub (/nexus/developers) coordina el Hermes Channel Mesh (WhatsApp vía SignalWire, Telegram y Discord HITL) y expone el SDK A2A para interconectar agentes externos mediante autenticación HMAC L1 y firmas EIP-191 L2.",
    permittedPhrasings: [
      'Developer Hub y SDK A2A en /nexus/developers',
      'Hermes Channel Mesh para WhatsApp, Telegram y Discord',
      'mensajería segura de agente a agente (A2A)',
    ],
    provenance: computeProvenance(
      'nexus-growth-mesh',
      "La vertical de Growth OS y Developer Hub (/nexus/developers) coordina el Hermes Channel Mesh (WhatsApp vía SignalWire, Telegram y Discord HITL) y expone el SDK A2A para interconectar agentes externos mediante autenticación HMAC L1 y firmas EIP-191 L2."
    ),
  },
  {
    claimId: 'claim_vertical_resources_data_room_academy',
    category: 'FACT',
    disclosureClearance: 'TENANT_RESTRICTED',
    targetSurface: 'DASH_PANDORAS',
    subArea: 'Data Room & Academia (/nexus/academy)',
    canonicalAssertion: "La vertical de Data Room Institucional y Academia (/nexus/academy) aloja los libros fundacionales, whitepapers, contratos modelo y el Knowledge Graph interactivo para la debida diligencia (due diligence) y certificación de operadores del protocolo.",
    permittedPhrasings: [
      'Data Room Institucional y Academia en /nexus/academy',
      'Knowledge Graph interactivo y manuales de certificación',
      'repositorio documental para due diligence y libros rectores',
    ],
    provenance: computeProvenance(
      'nexus-academy-data-room',
      "La vertical de Data Room Institucional y Academia (/nexus/academy) aloja los libros fundacionales, whitepapers, contratos modelo y el Knowledge Graph interactivo para la debida diligencia (due diligence) y certificación de operadores del protocolo."
    ),
  },
  {
    claimId: 'claim_tma_pandoras_transaction_plane',
    category: 'FACT',
    disclosureClearance: 'TENANT_RESTRICTED',
    targetSurface: 'TMA_PANDORAS',
    canonicalAssertion: "La Telegram Mini App de Pandora's (pandoras-telegram-app) actúa como el Interactive Transaction Plane del protocolo. Permite a los usuarios consultar Claim Contracts, explorar oportunidades fraccionadas en Web3 y visualizar recibos notarizados en IPFS directamente desde Telegram.",
    permittedPhrasings: [
      "Telegram Mini App de Pandora's (TMA)",
      'Interactive Transaction Plane para transacciones Web3 en Telegram',
      'exploración móvil de oportunidades y recibos notarizados',
    ],
    provenance: computeProvenance(
      'tma-pandoras-plane',
      "La Telegram Mini App de Pandora's (pandoras-telegram-app) actúa como el Interactive Transaction Plane del protocolo. Permite a los usuarios consultar Claim Contracts, explorar oportunidades fraccionadas en Web3 y visualizar recibos notarizados en IPFS directamente desde Telegram."
    ),
  },
  {
    claimId: 'claim_tma_hermes_assistant_plane',
    category: 'FACT',
    disclosureClearance: 'TENANT_RESTRICTED',
    targetSurface: 'TMA_HERMES',
    canonicalAssertion: "La Telegram Mini App de Hermes es el asistente personal interactivo de productividad y concierge para operadores y usuarios, ofreciendo acceso rápido al estado de tareas, resúmenes operativos y soporte contextual.",
    permittedPhrasings: [
      'Telegram Mini App de Hermes',
      'concierge y asistente interactivo en Telegram',
      'interfaz móvil de productividad asistida por Hermes',
    ],
    provenance: computeProvenance(
      'tma-hermes-plane',
      "La Telegram Mini App de Hermes es el asistente personal interactivo de productividad y concierge para operadores y usuarios, ofreciendo acceso rápido al estado de tareas, resúmenes operativos y soporte contextual."
    ),
  },

  // ===========================================================================
  // 3. INTERNAL_OPERATIONAL TIER (Internal Collaborators, Support & Ops)
  // ===========================================================================
  {
    claimId: 'claim_hitl_discord_escalation_protocol',
    category: 'FACT',
    disclosureClearance: 'INTERNAL_OPERATIONAL',
    targetSurface: 'DASH_PANDORAS',
    subArea: 'Support & Escalation Operations',
    canonicalAssertion: "El protocolo HITL (Human-in-the-Loop) en Discord permite a los colaboradores responder en vivo a clientes de WhatsApp o Telegram: 1) Unirse al servidor oficial, 2) Ejecutar !link-wallet para vincular Smart Wallet, 3) Responder dentro del hilo abierto por Hermes, 4) Escribir !resolver para devolver el control autónomo al bot.",
    permittedPhrasings: [
      'protocolo HITL de soporte en Discord (!link-wallet y !resolver)',
      'escalamiento bidireccional de clientes a hilos de Discord',
      'flujo de intervención humana supervisada',
    ],
    provenance: computeProvenance(
      'hitl-discord-protocol',
      "El protocolo HITL (Human-in-the-Loop) en Discord permite a los colaboradores responder en vivo a clientes de WhatsApp o Telegram: 1) Unirse al servidor oficial, 2) Ejecutar !link-wallet para vincular Smart Wallet, 3) Responder dentro del hilo abierto por Hermes, 4) Escribir !resolver para devolver el control autónomo al bot."
    ),
  },
  {
    claimId: 'claim_collaborator_rbac_management',
    category: 'FACT',
    disclosureClearance: 'INTERNAL_OPERATIONAL',
    targetSurface: 'DASH_PANDORAS',
    subArea: 'Access & Team Management (/nexus/settings)',
    canonicalAssertion: "La gestión de colaboradores se realiza en /nexus/settings pestaña 'Equipo'. Soporta roles RBAC (SUPER_ADMIN, ADMIN, OPERATOR, MARKETING, VIEWER), envío de invitaciones por Magic Link por email y WhatsApp, y acceso granular a los documentos del Data Room del colaborador.",
    permittedPhrasings: [
      'gestión de colaboradores y matriz RBAC en /nexus/settings',
      'invitación con Magic Link y onboarding automático por WhatsApp',
      'asignación de permisos por rol y Data Room de colaborador',
    ],
    provenance: computeProvenance(
      'collaborator-rbac-doctrine',
      "La gestión de colaboradores se realiza en /nexus/settings pestaña 'Equipo'. Soporta roles RBAC (SUPER_ADMIN, ADMIN, OPERATOR, MARKETING, VIEWER), envío de invitaciones por Magic Link por email y WhatsApp, y acceso granular a los documentos del Data Room del colaborador."
    ),
  },

  // ===========================================================================
  // 4. CONFIDENTIAL TIER (Super Administrators & Platform Governance)
  // ===========================================================================
  {
    claimId: 'claim_admin_pandoras_hq_governance',
    category: 'FACT',
    disclosureClearance: 'CONFIDENTIAL',
    targetSurface: 'ADMIN_PANDORAS',
    subArea: 'Platform Governance & HQ Engine',
    canonicalAssertion: "admin.pandoras.finance es la consola central de gobernanza de plataforma reservada para SUPER_ADMIN. Aloja el Hermes Command QA (/admin/hermes) para validación de prompts y auditoría vectorial, y el Billing Studio para monitoreo de instancias RunPod GPU, consumo de tokens y balances por tenant.",
    permittedPhrasings: [
      'consola central HQ en admin.pandoras.finance',
      'Hermes Command QA en /admin/hermes y Billing Studio',
      'monitoreo de infraestructura de cómputo GPU y cuotas de plataforma',
    ],
    provenance: computeProvenance(
      'admin-pandoras-hq',
      "admin.pandoras.finance es la consola central de gobernanza de plataforma reservada para SUPER_ADMIN. Aloja el Hermes Command QA (/admin/hermes) para validación de prompts y auditoría vectorial, y el Billing Studio para monitoreo de instancias RunPod GPU, consumo de tokens y balances por tenant."
    ),
  },
  {
    claimId: 'claim_sovereign_knowledge_vault',
    category: 'FACT',
    disclosureClearance: 'CONFIDENTIAL',
    targetSurface: 'GLOBAL',
    subArea: 'Cryptographic Storage Stack',
    canonicalAssertion: "Hermes OS custodia la información de cada proyecto mediante bóvedas soberanas en IPFS con cifrado de grado institucional y firmas EIP-712. El stack se compone de K25 (Envelope Vault AES-256-GCM), K26 (Anclaje forense de hash-chain) y K27 (Pinning resiliente multi-nodo con fail-closed en producción).",
    permittedPhrasings: [
      'bóvedas soberanas en IPFS',
      'cifrado institucional y firmas criptográficas',
      'cero alucinaciones respaldado por contratos de hechos',
      'stack de almacenamiento soberano K25, K26 y K27',
    ],
    provenance: computeProvenance(
      'pandoras-sovereign-vault',
      "Hermes OS custodia la información de cada proyecto mediante bóvedas soberanas en IPFS con cifrado de grado institucional y firmas EIP-712. El stack se compone de K25 (Envelope Vault AES-256-GCM), K26 (Anclaje forense de hash-chain) y K27 (Pinning resiliente multi-nodo con fail-closed en producción)."
    ),
  },
];

/**
 * Returns ecosystem doctrine claims filtered by the actor's clearance level.
 */
export function getEcosystemClaimsForClearance(clearance: KnowledgeDisclosureClearance = 'PUBLIC'): EcosystemDoctrineClaim[] {
  const clearanceRanking: Record<KnowledgeDisclosureClearance, number> = {
    PUBLIC: 1,
    TENANT_RESTRICTED: 2,
    INTERNAL_OPERATIONAL: 3,
    CONFIDENTIAL: 4,
    SECRET: 5,
  };

  const maxRank = clearanceRanking[clearance] ?? 1;
  return PANDORAS_ECOSYSTEM_CLAIMS.filter(c => (clearanceRanking[c.disclosureClearance] ?? 1) <= maxRank);
}
