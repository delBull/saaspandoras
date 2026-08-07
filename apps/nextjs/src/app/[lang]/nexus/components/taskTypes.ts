export interface TipoTarea {
  key: string;
  label: string;
  short: string;
}

export const TIPOS: TipoTarea[] = [
  { key: 'ROADMAP', label: 'Roadmap General', short: 'Hoja de ruta estratégica del ecosistema: fases, hitos y visión.' },
  { key: 'PLATAFORMA', label: 'Plataforma · To-dos', short: 'Pendientes de la plataforma/dashboard: flujos, UX y secciones.' },
  { key: 'CODIGO', label: 'Código', short: 'Implementación o corrección de código en apps, libs o paquetes.' },
  { key: 'ESTRUCTURA', label: 'Estructura', short: 'Organización del repo, scaffolding, migraciones o esquema de datos.' },
  { key: 'ARQUITECTURA', label: 'Arquitectura', short: 'Decisiones de diseño de alto nivel: ADRs, contratos y patrones.' },
  { key: 'NEGOCIO', label: 'Negocio', short: 'Producto, go-to-market, métricas y decisiones de negocio.' },
  { key: 'OPERACION', label: 'Operación', short: 'Procesos operativos diarios, coordinación y seguimiento.' },
];

export interface TaskItem {
  id: string;
  week: string;
  title: string;
  category: 'IP & Trademarks' | 'Legal & Corporate' | 'Tech & Data Room' | 'Operaciones' | 'Marketing & Media' | 'Finanzas';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
  dueDate: string;
  detail: string;
  requester?: string;
  tipo?: string;
  evidence?: string;
  evidenceType?: 'texto' | 'código' | 'foto' | 'enlace';
  evidenceLink?: string;
}

const strip = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function suggestTipo(text: string): string {
  const t = strip(text);
  if (/(roadmap|fase|hito|vision|estrategia general|road ?map)/.test(t)) return 'ROADMAP';
  if (/(plataforma|dashboard|ui|ux|flujo|seccion|pantalla|panel|portal)/.test(t)) return 'PLATAFORMA';
  if (/(codigo|bug|fix|implement|refactor|script|funcion|feature|route|componente|error)/.test(t)) return 'CODIGO';
  if (/(estructura|carpeta|scaffold|migracion|esquema|schema|organiza|monorepo)/.test(t)) return 'ESTRUCTURA';
  if (/(arquitectura|adr|diseno|pattern|patron|contrato|kernel|event.?source|integraci)/.test(t)) return 'ARQUITECTURA';
  if (/(negocio|go.?to.?market|producto|metrica|revenue|ingreso|cliente|venta|inversor)/.test(t)) return 'NEGOCIO';
  return 'OPERACION';
}

export function normalizeTipo(v: string): string {
  const t = strip(v.trim());
  if (!t) return 'OPERACION';
  const match = TIPOS.find((x) => strip(x.key) === t || strip(x.label).startsWith(t) || strip(x.key).startsWith(t));
  return match ? match.key : v.trim().toUpperCase();
}

export function tipoLabel(key?: string): string {
  if (!key) return 'Operación';
  return TIPOS.find((t) => t.key === key)?.label ?? key;
}

export const INITIAL_TASKS: TaskItem[] = [
  // SEMANA 1: ARQUITECTURA DE MARCA & SOLICITUD
  {
    id: 'TSK-W1-01',
    week: 'Semana 1',
    title: 'Nexus IP Governance Operating System',
    category: 'Tech & Data Room',
    priority: 'HIGH',
    completed: true,
    dueDate: '2026-07-31',
    detail: 'Plataforma interactiva desplegada en producción con control de estatus, tareas y alertas vía Discord.'
  },
  {
    id: 'TSK-W1-02',
    week: 'Semana 1',
    title: 'Búsqueda de Disponibilidad Fonética "PANDORAS" (IMPI)',
    category: 'IP & Trademarks',
    priority: 'HIGH',
    completed: true,
    dueDate: '2026-07-31',
    detail: 'Examen de anterioridades en Marcanet completado (Riesgo BAJO). Evidencia documentada en /nexus Data Room.'
  },
  {
    id: 'TSK-W1-03',
    week: 'Semana 1',
    title: 'Preparación de Solicitud IMPI Marca Madre "PANDORAS"',
    category: 'IP & Trademarks',
    priority: 'HIGH',
    completed: false,
    dueDate: '2026-08-05',
    detail: 'Definición de clasificación de productos/servicios para Clases 36 + 42 y selección de denominación PANDORAS vs PANDORA\'S.'
  },
  {
    id: 'TSK-W1-04',
    week: 'Semana 1',
    title: 'Ingreso Solicitud IMPI Marca Madre "PANDORAS"',
    category: 'IP & Trademarks',
    priority: 'HIGH',
    completed: false,
    dueDate: '2026-08-07',
    detail: 'Presentación de la solicitud oficial a nombre directo de MXHUB Ecosistema Blockchain S.A. de C.V. Uso del distintivo PANDORAS™.'
  },

  // SEMANA 2: CORPORATE RESOLUTION & OWNERSHIP AUDIT
  {
    id: 'TSK-W2-01',
    week: 'Semana 2',
    title: 'Corporate IP Resolution MXHUB S.A. de C.V.',
    category: 'Legal & Corporate',
    priority: 'HIGH',
    completed: true,
    dueDate: '2026-08-10',
    detail: 'Resolución de asamblea formalizando que el 100% de desarrollos, marcas y software de Pandoras pertenecen inalienablemente a MXHUB.'
  },
  {
    id: 'TSK-W2-02',
    week: 'Semana 2',
    title: 'Technology Ownership Register & Code Audit',
    category: 'Tech & Data Room',
    priority: 'HIGH',
    completed: false,
    dueDate: '2026-08-12',
    detail: 'Auditoría de propiedad en repositorios Git: asignación de autoría y cláusulas `Owned by: MXHUB / IP Holding` en headers.'
  },
  {
    id: 'TSK-W2-03',
    week: 'Semana 2',
    title: 'Smart Contract & Deployer Registry',
    category: 'Tech & Data Room',
    priority: 'MEDIUM',
    completed: false,
    dueDate: '2026-08-14',
    detail: 'Registro institucional de contratos inteligentes desplegados (red, address, deployer wallet y licencias de uso).'
  },

  // SEMANA 3: LICENSING & INVESTOR DATA ROOM
  {
    id: 'TSK-W3-01',
    week: 'Semana 3',
    title: 'Master Licensing Framework v1 (Holding ➔ USA LLC)',
    category: 'Legal & Corporate',
    priority: 'HIGH',
    completed: false,
    dueDate: '2026-08-18',
    detail: 'Borrador del Master License Agreement definiendo Royalty Fees (3%-10%), Platform Fees y Aislamiento de IP.'
  },
  {
    id: 'TSK-W3-02',
    week: 'Semana 3',
    title: 'Estructuración del Corporate Data Room en 5 Carpetas',
    category: 'Legal & Corporate',
    priority: 'MEDIUM',
    completed: false,
    dueDate: '2026-08-21',
    detail: 'Organización del Data Room institucional (/nexus 01_company, 02_ip, 03_technology, 04_business, 05_legal, 06_investor).'
  },

  // SEMANA 4: DUE DILIGENCE READINESS
  {
    id: 'TSK-W4-01',
    week: 'Semana 4',
    title: 'Due Diligence Readiness Audit & Investor Package',
    category: 'Legal & Corporate',
    priority: 'HIGH',
    completed: false,
    dueDate: '2026-08-28',
    detail: 'Auditoría de validación para recepción de capital estratégico e inversionistas en Pandoras USA Operations LLC.'
  }
];
