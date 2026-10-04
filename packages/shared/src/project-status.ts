/**
 * 🏛️ Canonical Project Lifecycle Statuses & Configurations
 * lib/project-status.ts
 *
 * Single Source of Truth for the 8 canonical project statuses in Postgres project_status enum.
 */

export type CanonicalProjectStatus = 
  | "draft"
  | "pending"
  | "active_client"
  | "approved"
  | "live"
  | "completed"
  | "incomplete"
  | "rejected";

export interface ProjectStatusMetadata {
  id: CanonicalProjectStatus;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  badgeClass: string;
  iconBg: string;
  step: number; // 1 to 6 for standard lifecycle, 0 for alternative
  isTerminal?: boolean;
}

export const CANONICAL_PROJECT_STATUSES: readonly CanonicalProjectStatus[] = [
  "draft",
  "pending",
  "active_client",
  "approved",
  "live",
  "completed",
  "incomplete",
  "rejected",
] as const;

export const PROJECT_STATUS_CONFIG: Record<CanonicalProjectStatus, ProjectStatusMetadata> = {
  draft: {
    id: "draft",
    label: "Borrador",
    shortLabel: "Borrador",
    description: "Proyecto en edición guardado por el solicitante.",
    color: "purple",
    badgeClass: "text-purple-300 bg-purple-500/10 border-purple-500/20",
    iconBg: "bg-purple-500/20 text-purple-400",
    step: 1,
  },
  pending: {
    id: "pending",
    label: "Pendiente de Revisión",
    shortLabel: "Pendiente",
    description: "Aplicación completa enviada, en espera de validación preliminar.",
    color: "yellow",
    badgeClass: "text-yellow-300 bg-yellow-500/10 border-yellow-500/20",
    iconBg: "bg-yellow-500/20 text-yellow-400",
    step: 2,
  },
  active_client: {
    id: "active_client",
    label: "Cliente Activo (Tier 1)",
    shortLabel: "Cliente Activo",
    description: "Análisis institucional y due diligence en proceso.",
    color: "cyan",
    badgeClass: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
    iconBg: "bg-cyan-500/20 text-cyan-400",
    step: 3,
  },
  approved: {
    id: "approved",
    label: "Aprobado (Listo p/ Despliegue)",
    shortLabel: "Aprobado",
    description: "Due diligence completado; contratos listos para despliegue en Base.",
    color: "blue",
    badgeClass: "text-blue-300 bg-blue-500/10 border-blue-500/20",
    iconBg: "bg-blue-500/20 text-blue-400",
    step: 4,
  },
  live: {
    id: "live",
    label: "Live (Aceptando Inversiones)",
    shortLabel: "Live",
    description: "Smart contracts desplegados en Base Mainnet activos y operando.",
    color: "emerald",
    badgeClass: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    iconBg: "bg-emerald-500/20 text-emerald-400",
    step: 5,
  },
  completed: {
    id: "completed",
    label: "Financiado (Completado)",
    shortLabel: "Completado",
    description: "Ronda de financiamiento completada al 100%.",
    color: "teal",
    badgeClass: "text-teal-300 bg-teal-500/10 border-teal-500/20",
    iconBg: "bg-teal-500/20 text-teal-400",
    step: 6,
    isTerminal: true,
  },
  incomplete: {
    id: "incomplete",
    label: "Documentación Incompleta",
    shortLabel: "Incompleto",
    description: "Pausado temporalmente por falta de información o requisitos.",
    color: "orange",
    badgeClass: "text-orange-300 bg-orange-500/10 border-orange-500/20",
    iconBg: "bg-orange-500/20 text-orange-400",
    step: 0,
  },
  rejected: {
    id: "rejected",
    label: "Rechazado",
    shortLabel: "Rechazado",
    description: "Aplicación declinada tras análisis de riesgo o compliance.",
    color: "rose",
    badgeClass: "text-rose-300 bg-rose-500/10 border-rose-500/20",
    iconBg: "bg-rose-500/20 text-rose-400",
    step: 0,
    isTerminal: true,
  },
};

export function getProjectStatusConfig(status?: string | null): ProjectStatusMetadata {
  if (!status || !(status in PROJECT_STATUS_CONFIG)) {
    return {
      id: "draft",
      label: status ? String(status).toUpperCase() : "Desconocido",
      shortLabel: status ? String(status) : "Desconocido",
      description: "Estado no reconocido",
      color: "zinc",
      badgeClass: "text-zinc-300 bg-zinc-500/10 border-zinc-500/20",
      iconBg: "bg-zinc-500/20 text-zinc-400",
      step: 0,
    };
  }
  return PROJECT_STATUS_CONFIG[status as CanonicalProjectStatus];
}
