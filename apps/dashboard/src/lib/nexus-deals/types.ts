import { randomUUID } from "crypto";
import type { nexusDealKindEnum, nexusDealStatusEnum } from "@/db/schema";

export type DealKind = (typeof nexusDealKindEnum.enumValues)[number];
export type DealStatus = (typeof nexusDealStatusEnum.enumValues)[number];

export const KIND_LABEL: Record<DealKind, string> = {
  PROPOSAL: "Propuesta de Colaboración",
  AGREEMENT: "Acuerdo",
  CONTRACT: "Contrato",
  AMENDMENT: "Enmienda",
  CHARTER: "Documento Fundacional",
};

export const KIND_BADGE: Record<DealKind, string> = {
  PROPOSAL: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  AGREEMENT: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  CONTRACT: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  AMENDMENT: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  CHARTER: "border-stone-500/30 bg-stone-500/10 text-stone-200",
};

export const STATUS_LABEL: Record<DealStatus, string> = {
  DRAFT: "Borrador",
  PROPOSAL_SENT: "Propuesta Enviada",
  REVIEW: "En Revisión",
  ACCEPTED: "Aceptada",
  SIGNED: "Firmada",
  EXECUTING: "En Ejecución",
  EXECUTED: "Ejecutada",
};

export const STATUS_ORDER: DealStatus[] = [
  "DRAFT",
  "PROPOSAL_SENT",
  "REVIEW",
  "ACCEPTED",
  "SIGNED",
  "EXECUTING",
  "EXECUTED",
];

export interface DealSectionInput {
  code: string;
  title: string;
  subtitle: string;
  content: string;
}

export interface SignerInput {
  email: string;
}

/**
 * 🛡️ ON-CHAIN KYC GATEWAY (Future Infrastructure)
 * Consultar especificación y mini-roadmap en:
 * file:///DOCUMENTACIÓN/DEALS_KYC_ROADMAP.md
 */
export type KycStatus = "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "REJECTED";
export type KycLevel = "TIER_1_LITE" | "TIER_2_PASSPORT" | "TIER_3_KYB_CORPORATE";

export interface KycGateConfig {
  kycRequired?: boolean;
  kycLevel?: KycLevel;
  kycStatus?: KycStatus;
  attestationHash?: string | null;
}

// Secciones por defecto del Deal Room (Nivel 2)
const DEFAULT_ROLE = [
  "Representación institucional y apertura de canales corporativos para el ecosistema Pandora's.",
  "Gestión de relaciones con socios estratégicos e inversionistas institucionales.",
  "Participación en el Consejo Operativo y revisión trimestral de KPIs del ecosistema.",
  "Firma como autoridad designada únicamente para acuerdos autorizados por el consejo.",
].join("\n");

const DEFAULT_COMP = [
  "Modelo: compensación híbrida (base + éxito).",
  "Retribución variable ligada a capital captado o mandatos activados.",
  "Términos detallados se definen en el Acuerdo de Socios (Sección 08).",
  "Toda transferencia queda registrada en el audit trail del Deal Room.",
].join("\n");

const DEFAULT_OVERVIEW = [
  "MXHUB Ecosistema Blockchain S.A. de C.V. (México) — matriz y titular de propiedad intelectual.",
  "Pandora's Nexus — Data Room institucional (Nivel 1) + Transaction Rooms (Nivel 2).",
  "Ecosistema: DeFi / RWA / credit intelligence · Hermes AI Platform · Growth OS.",
].join("\n");

const DEFAULT_HERMES = [
  "Acceso a Hermes AI Platform (AI-OS), Growth OS y panel de métricas del ecosistema.",
  "Credenciales emitidas por el consejo; niveles de acceso definidos por rol.",
  "Toda consulta a documentación confidencial se registra en el audit trail.",
].join("\n");

const DEFAULT_PROJECTS = [
  "Captación e integración de inversionistas estratégicos (mandato activo).",
  "Apertura de canales corporativos e institucionales.",
  "Activación de alianzas con vehículos de capital.",
].join("\n");

const DEFAULT_DOCS = [
  "Proposal Deck — Pandora's Ecosystem (PDF)",
  "Institutional Books (Libros 0–IX) — acceso vía /libros",
  "Pandoras Asset Standard (PAS v1.0)",
  "Corporate Data Room — MXHUB S.A. de C.V.",
  "Legal / Licensing Framework (Libro V)",
  "Hermes Agent OS & Kernel Architecture (Libro IX)",
].join("\n");

const DEFAULT_AGREEMENT = [
  "Acuerdo de Sociedad Estratégica.",
  "Las enmiendas se registran con número secuencial y quedan firmadas en esta sección.",
  "Este documento constituye una oferta formal y vinculante por parte de MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.",
].join("\n");

const DEFAULT_SIGN = [
  "La firma electrónica o aceptación mediante la plataforma por parte de la Contraparte perfecciona y da entrada en vigor al presente acuerdo, sin requerir firma adicional de nuestra parte.",
  "El registro de firma genera un evento inmutable en el audit trail (nombre + wallet/email).",
  "Provider: pending-esign (DocuSign / HelloSign / equivalente).",
].join("\n");

export function defaultSections(note?: string): DealSectionInput[] {
  return [
    { code: "01", title: "Executive Proposal", subtitle: "Propuesta ejecutiva", content: note ?? "" },
    { code: "02", title: "Role & Responsibilities", subtitle: "Rol y responsabilidades", content: DEFAULT_ROLE },
    { code: "03", title: "Compensation Framework", subtitle: "Marco de compensación", content: DEFAULT_COMP },
    { code: "04", title: "Company Overview", subtitle: "Panorama corporativo", content: DEFAULT_OVERVIEW },
    { code: "05", title: "Hermes OS Access", subtitle: "Acceso a la plataforma", content: DEFAULT_HERMES },
    { code: "06", title: "Projects & Mandates", subtitle: "Proyectos y mandatos", content: DEFAULT_PROJECTS },
    { code: "07", title: "Confidential Documents", subtitle: "Documentos confidenciales", content: DEFAULT_DOCS },
    { code: "08", title: "Agreement", subtitle: "Acuerdo y enmiendas", content: DEFAULT_AGREEMENT },
    { code: "09", title: "Signature", subtitle: "Firma y ejecución", content: DEFAULT_SIGN },
  ];
}

export function generatePublicId(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PDR-${rand}`;
}

export function newRoomId(): string {
  return randomUUID();
}

export const ADMIN_UNLOCK_SECRET = process.env.NEXUS_DEAL_UNLOCK_SECRET;
export const DEAL_TOKEN_SECRET = process.env.NEXUS_DEAL_TOKEN_SECRET ?? process.env.PORTAL_JWT_SECRET;
export const UNLOCK_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas
export const DEAL_TOKEN_EXPIRY = "7d";
