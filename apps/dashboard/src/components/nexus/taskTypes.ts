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
  assignee?: string;
  tipo?: string;
  evidence?: string;
  evidenceType?: 'texto' | 'código' | 'foto' | 'enlace';
  evidenceLink?: string;
  isPrivate?: boolean;
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
