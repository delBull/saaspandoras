// Fuente de verdad de las tareas del Nexus (Operaciones) para vincularlas al Deal Room.
// Espejo de `apps/nextjs/src/app/[lang]/nexus/components/taskTypes.ts` (INITIAL_TASKS).
// Si cambian las tareas en Nexus, actualizar esta lista.

export interface NexusTask {
  id: string;
  week: string;
  title: string;
  category: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  completed: boolean;
  dueDate: string;
}

export const NEXUS_TASKS: NexusTask[] = [
  { id: "TSK-W1-01", week: "Semana 1", title: "Nexus IP Governance Operating System", category: "Tech & Data Room", priority: "HIGH", completed: true, dueDate: "2026-07-31" },
  { id: "TSK-W1-02", week: "Semana 1", title: 'Búsqueda de Disponibilidad Fonética "PANDORAS" (IMPI)', category: "IP & Trademarks", priority: "HIGH", completed: true, dueDate: "2026-07-31" },
  { id: "TSK-W1-03", week: "Semana 1", title: 'Preparación de Solicitud IMPI Marca Madre "PANDORAS"', category: "IP & Trademarks", priority: "HIGH", completed: false, dueDate: "2026-08-05" },
  { id: "TSK-W1-04", week: "Semana 1", title: 'Ingreso Solicitud IMPI Marca Madre "PANDORAS"', category: "IP & Trademarks", priority: "HIGH", completed: false, dueDate: "2026-08-07" },
  { id: "TSK-W1-05", week: "Semana 1", title: 'Firma de Founders Agreement (Strategic Partner)', category: "Legal & Corporate", priority: "HIGH", completed: false, dueDate: "2026-08-15" },
  { id: "TSK-W1-06", week: "Semana 1", title: 'Constitución de Pandoras US Operations LLC', category: "Legal & Corporate", priority: "HIGH", completed: false, dueDate: "2026-08-16" },
  { id: "TSK-W2-01", week: "Semana 2", title: "Corporate IP Resolution MXHUB S.A. de C.V.", category: "Legal & Corporate", priority: "HIGH", completed: true, dueDate: "2026-08-10" },
  { id: "TSK-W2-02", week: "Semana 2", title: "Technology Ownership Register & Code Audit", category: "Tech & Data Room", priority: "HIGH", completed: false, dueDate: "2026-08-12" },
  { id: "TSK-W2-03", week: "Semana 2", title: "Smart Contract & Deployer Registry", category: "Tech & Data Room", priority: "MEDIUM", completed: false, dueDate: "2026-08-14" },
  { id: "TSK-W2-04", week: "Semana 2", title: "Firma de Operating Agreement Interno (Ingreso Founder)", category: "Legal & Corporate", priority: "HIGH", completed: false, dueDate: "2026-08-18" },
  { id: "TSK-W2-05", week: "Semana 2", title: "Apertura de Cuenta Bancaria US (Mercury)", category: "Treasury", priority: "HIGH", completed: false, dueDate: "2026-08-20" },
  { id: "TSK-W2-06", week: "Semana 2", title: "Master Services Agreement (MXHub ↔ Pandoras LLC)", category: "Legal & Corporate", priority: "HIGH", completed: false, dueDate: "2026-08-22" },
  { id: "TSK-W3-01", week: "Semana 3", title: "Master Licensing Framework v1 (Holding ➔ USA LLC)", category: "Legal & Corporate", priority: "HIGH", completed: false, dueDate: "2026-08-18" },
  { id: "TSK-W3-02", week: "Semana 3", title: "Estructuración del Corporate Data Room en 5 Carpetas", category: "Legal & Corporate", priority: "MEDIUM", completed: false, dueDate: "2026-08-21" },
  { id: "TSK-W4-01", week: "Semana 4", title: "Due Diligence Readiness Audit & Investor Package", category: "Legal & Corporate", priority: "HIGH", completed: false, dueDate: "2026-08-28" },
];

export function taskTitle(taskRef?: string | null): string | null {
  if (!taskRef) return null;
  return NEXUS_TASKS.find((t) => t.id === taskRef)?.title ?? null;
}
