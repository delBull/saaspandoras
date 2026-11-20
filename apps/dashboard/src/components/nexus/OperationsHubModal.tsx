'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield,
  Plus,
  RefreshCw,
  X,
  Layers,
  ArrowUpRight,
  FolderGit2,
  Code2,
  Cpu,
  TerminalSquare,
  Activity,
  Bell,
  ExternalLink,
  FileText,
  Handshake,
  Calendar,
  BookOpen,
  BrainCircuit,
  GraduationCap,
  Map,
} from 'lucide-react';
import TaskTerminal, { TerminalTask } from './TaskTerminal';
import { TaskItem } from './taskTypes';
import { NexusHermesTerminal } from '@/app/nexus/settings/NexusHermesTerminal';
import type { OperatorContext } from '@/app/nexus/settings/SettingsClient';
import { OperationsBroadcastTab } from './OperationsBroadcastTab';
import { OperationsIncidentCenter } from './OperationsIncidentCenter';
import { OperationsApprovalsTab } from './OperationsApprovalsTab';
import { OperationsClientsTab } from './OperationsClientsTab';
import { OperationsKnowledgeTab } from './OperationsKnowledgeTab';
import { OperationsCollaboratorsTab } from './OperationsCollaboratorsTab';
import TasksPanel from './TasksPanel';
import { AlertTriangle, CheckCircle, Building2, LayoutDashboard } from 'lucide-react';
import { getNexusClientHeaders } from '@/lib/nexus/client-auth-headers';

export type Tab = 'REGISTER' | 'CLIENTS' | 'WORK_ENGINE' | 'ACTIVITY' | 'KNOWLEDGE' | 'COHORTS' | 'APPROVALS';

interface IPAsset {
  id: string;
  name: string;
  category: string;
  classes: string;
  status: 'ABANDONED' | 'PENDING' | 'PLANNED' | 'ACTIVE';
  authority: string;
  owner: string;
  notes: string;
  riskAssessment?: 'LOW' | 'MEDIUM' | 'HIGH';
  findingsCount?: number;
}

const INITIAL_ASSETS: IPAsset[] = [];

/** El hub es una pantalla (ruta). El modo modal se retiró: una sola capa. */

/** Slug de URL por tab (única fuente para rutas y sidebar). */
export const OPS_TAB_SLUGS: Record<Tab, string> = {
  WORK_ENGINE: "work",
  CLIENTS: "clients",
  KNOWLEDGE: "knowledge",
  ACTIVITY: "activity",
  APPROVALS: "approvals",
  COHORTS: "cohorts",
  REGISTER: "register",
};

export const OPS_SLUG_TABS: Record<string, Tab> = Object.fromEntries(
  Object.entries(OPS_TAB_SLUGS).map(([tab, slug]) => [slug, tab as Tab])
) as Record<string, Tab>;

interface OpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  permissions?: Record<string, boolean>;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
}

export function OperationsHubModal({ isOpen, onClose, tasks, setTasks, userName, userEmail, userRole, permissions = {}, activeTab, onTabChange }: OpsModalProps) {
  const isOpsAdmin = !!permissions['growth.manage'] || !!permissions['ecosystem'] || !!permissions['nexus.manage'];

  const [tab, setInternalTab] = useState<Tab>(activeTab || 'WORK_ENGINE');

  useEffect(() => {
    if (activeTab) setInternalTab(activeTab);
  }, [activeTab]);

  const setTab = (newTab: Tab) => {
    setInternalTab(newTab);
    if (onTabChange) onTabChange(newTab);
  };

  const panelRootRef = useRef<HTMLDivElement>(null);

  // P5: accesibilidad y una sola capa.
  // - Escape cierra (vuelve al Command Center).
  // - Flechas mueven entre tabs (patrón tablist).
  // - Tab queda atrapado dentro del hub: el fondo no es navegable.
  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const root = panelRootRef.current;
    if (!root) return;
    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((node) => node.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const active = document.activeElement as HTMLElement | null;
      if (!active || active.getAttribute("role") !== "tab") return;
      event.preventDefault();
      const tabs = Array.from(
        panelRootRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []
      );
      if (tabs.length === 0) return;
      const currentIndex = tabs.findIndex((node) => node === active);
      const nextIndex =
        event.key === "ArrowRight"
          ? (currentIndex + 1 + tabs.length) % tabs.length
          : (currentIndex - 1 + tabs.length) % tabs.length;
      tabs[nextIndex]?.focus();
      tabs[nextIndex]?.click();
    };
    window.addEventListener("keydown", onKeyDown);
    // Foco inicial en el tab activo (no en el fondo).
    const timer = window.setTimeout(() => {
      panelRootRef.current?.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')?.focus();
    }, 40);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [workLeftWidth, setWorkLeftWidth] = useState(50);
  const [activityLeftWidth, setActivityLeftWidth] = useState(50);
  // Resize by click instead of drag for smoother UX
  const cycleWidth = (current: number, setter: (val: number) => void) => {
    if (current === 50) setter(70);
    else if (current === 70) setter(30);
    else setter(50);
  };

  const [terminalMode, setTerminalMode] = useState<'TASK' | 'HERMES'>('TASK');
  const [assets, setAssets] = useState<IPAsset[]>(INITIAL_ASSETS);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [localImportCount, setLocalImportCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<IPAsset | null>(INITIAL_ASSETS[1] ?? null);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);

  // Data Room deals & user-connected documents

  // Auto-fallback if a non-admin was on REGISTER
  useEffect(() => {
    if (tab === 'REGISTER' && !isOpsAdmin) {
      setTab('WORK_ENGINE');
    }
  }, [tab, isOpsAdmin]);

  const operatorContext: OperatorContext | null = userName
    ? {
      name: userName,
      email: userEmail ?? '',
      role: userRole || 'VIEWER',
      permissions: {},
    }
    : null;

  const [showAssetForm, setShowAssetForm] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState('Marca Denominativa');
  const [newAssetClasses, setNewAssetClasses] = useState('Clase 36 + Clase 42');
  const [newAssetAuthority, setNewAssetAuthority] = useState('IMPI (México)');
  const [newAssetRisk, setNewAssetRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [newAssetNotes, setNewAssetNotes] = useState('');

  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  const refreshAssets = useCallback(async () => {
    setAssetsLoading(true);
    setAssetsError(null);
    try {
      const res = await fetch('/api/nexus/ip-assets', {
        headers: getNexusClientHeaders(),
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAssetsError(
          data.code === 'ORG_UNRESOLVED'
            ? 'Tu identidad no tiene una organización asignada.'
            : data.code === 'MISSING_CAPABILITY'
              ? 'No tienes permiso para ver el registro de activos.'
              : data.error ?? 'No se pudieron cargar los activos.'
        );
        setAssets([]);
        return;
      }
      const rows = Array.isArray(data.assets) ? data.assets : [];
      setAssets(rows.map((row: any) => ({
        id: String(row.id),
        name: String(row.name ?? 'Sin nombre'),
        category: String(row.category ?? 'Sin categoría'),
        classes: String(row.classes ?? ''),
        status: (row.status ?? 'PLANNED') as IPAsset['status'],
        authority: String(row.jurisdiction ?? ''),
        owner: '',
        notes: String(row.riskNotes ?? ''),
        riskAssessment: (row.risk ?? undefined) as IPAsset['riskAssessment'],
      })));
    } catch {
      setAssetsError('Error de red al cargar los activos.');
      setAssets([]);
    } finally {
      setAssetsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== 'REGISTER') return;
    void refreshAssets();
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('pandoras_ip_assets_custom');
        const parsed = stored ? JSON.parse(stored) : null;
        setLocalImportCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch {
        setLocalImportCount(0);
      }
    }
  }, [tab, refreshAssets]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    fetch('/api/nexus/collaborators/list')
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.collaborators) {
          setCollaborators(data.collaborators);
        }
      })
      .catch(console.error);
  }, []);


  /** Migración única: sube al API lo que quedó en el navegador. No es automática. */
  const importLocalAssets = async () => {
    if (typeof window === 'undefined') return;
    setImporting(true);
    setAssetsError(null);
    try {
      const stored = localStorage.getItem('pandoras_ip_assets_custom');
      const parsed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setLocalImportCount(0);
        return;
      }
      for (const item of parsed) {
        const name = typeof item?.name === 'string' ? item.name.trim() : '';
        if (!name) continue;
        await fetch('/api/nexus/ip-assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getNexusClientHeaders() },
          credentials: 'include',
          body: JSON.stringify({
            name,
            category: item?.category,
            classes: item?.classes,
            jurisdiction: item?.authority,
            status: 'PLANNED',
            risk: item?.riskAssessment,
            riskNotes: item?.notes,
          }),
        });
      }
      localStorage.removeItem('pandoras_ip_assets_custom');
      setLocalImportCount(0);
      await refreshAssets();
    } catch {
      setAssetsError('No se pudieron importar los activos locales.');
    } finally {
      setImporting(false);
    }
  };

  const saveTasks = (updated: TaskItem[]) => {
    setTasks(updated);
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim()) return;

    setAssetsError(null);
    try {
      const res = await fetch('/api/nexus/ip-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getNexusClientHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          name: newAssetName.trim(),
          category: newAssetCategory,
          classes: newAssetClasses,
          jurisdiction: newAssetAuthority,
          risk: newAssetRisk,
          riskNotes: newAssetNotes.trim() || undefined,
          status: 'PLANNED',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAssetsError(data.error ?? 'No se pudo registrar el activo.');
        return;
      }
      await refreshAssets();
      if (data.asset) {
        setSelectedAsset({
          id: String(data.asset.id),
          name: String(data.asset.name ?? newAssetName),
          category: String(data.asset.category ?? newAssetCategory),
          classes: String(data.asset.classes ?? newAssetClasses),
          status: (data.asset.status ?? 'PLANNED') as IPAsset['status'],
          authority: String(data.asset.jurisdiction ?? newAssetAuthority),
          owner: '',
          notes: String(data.asset.riskNotes ?? ''),
          riskAssessment: (data.asset.risk ?? newAssetRisk) as IPAsset['riskAssessment'],
        });
      }
      setNewAssetName('');
      setNewAssetNotes('');
      setShowAssetForm(false);
      void assignTask(`Nuevo activo IP registrado: ${newAssetName.trim()}`);
    } catch {
      setAssetsError('Error de red al registrar el activo.');
    }
  };

  const handleTerminalTask = (task: TerminalTask) => {
    const taskItem: TaskItem = {
      id: task.id,
      week: task.week,
      title: task.title,
      category: task.category as TaskItem['category'],
      priority: task.priority,
      tipo: task.tipo,
      completed: task.completed,
      dueDate: task.dueDate,
      detail: task.detail,
      requester: task.requester,
      assignee: task.assignee,
    };
    saveTasks([taskItem, ...tasks]);
  };

  const getWalletHeaders = (): Record<string, string> => getNexusClientHeaders();

  const assignTask = async (message: string, requester = 'Nexus Ops') => {
    setNotifying(true);
    try {
      if (selectedAssignee) {
        console.log("[HERMES META API] Enviando WhatsApp a ID:", selectedAssignee, "Mensaje:", message);
        await fetch('/api/nexus/assignments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getWalletHeaders()
          },
          credentials: 'include',
          body: JSON.stringify({
            assigneeId: selectedAssignee,
            message: `[HERMES WA] ${message}`,
            requester,
            task: selectedAsset ? selectedAsset.name : undefined,
          }),
        }).catch(() => null);

        // Also keep Discord log if needed, or rely on fallback in assignments route
      } else {
        const res = await fetch('/api/nexus/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: 'alert',
            message,
            requester,
            task: selectedAsset ? selectedAsset.name : undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          console.warn('[Nexus Ops] Discord alert failed:', data);
        }
      }
      setNotified(true);
      setTimeout(() => setNotified(false), 4000);
    } finally {
      setNotifying(false);
    }
  };

  if (!isOpen) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'WORK_ENGINE', label: 'MY WORK & TASKS', icon: <TerminalSquare className="w-3.5 h-3.5" /> },
    ...(isOpsAdmin
      ? [{ id: 'REGISTER' as Tab, label: `OPS REGISTER (${assets.length})`, icon: <Layers className="w-3.5 h-3.5" /> }]
      : []),
    { id: 'CLIENTS', label: 'CLIENTS & CRM', icon: <Building2 className="w-3.5 h-3.5" /> },
    ...(isOpsAdmin
      ? [{ id: 'COHORTS' as Tab, label: 'COHORTS', icon: <Shield className="w-3.5 h-3.5" /> }]
      : []),
    { id: 'KNOWLEDGE', label: 'KNOWLEDGE BASE', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'ACTIVITY', label: 'ACTIVITY & INCIDENTS', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'APPROVALS', label: 'APPROVALS', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  ];

  const assetBadge = (status: IPAsset['status']) => {
    const map: Record<string, string> = {
      ACTIVE: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
      PENDING: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
      PLANNED: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
      ABANDONED: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
    };
    return map[status] || 'border-white/10 bg-black/40 text-zinc-400';
  };

  return (
    <AnimatePresence>
      <div
        className="absolute inset-0 z-20 flex items-stretch justify-stretch bg-[#07070B]"
        role="region"
        aria-label="Operations Hub"
        ref={panelRootRef}
        onKeyDown={trapFocus}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full h-[100dvh] max-h-none bg-[#08080A] border-0 rounded-none overflow-hidden flex flex-col"
        >
          {/* Header command bar */}
          <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 border-b border-white/10 bg-[#0C0C10]">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 shrink-0">
                <Shield className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-100 tracking-tight truncate">OPERATIONS HUB</h3>
                </div>
                <p className="text-[10px] font-mono text-zinc-500 truncate">
                  Operación diaria · tareas, clientes, aprobaciones y conocimiento
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setTab('WORK_ENGINE');
                  setTerminalMode(terminalMode === 'HERMES' ? 'TASK' : 'HERMES');
                }}
                title="Alternar entre Hermes y el terminal de tareas"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-[10px] transition-colors ${terminalMode === 'HERMES' && tab === 'WORK_ENGINE' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20' : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'}`}
              >
                <TerminalSquare className="w-3 h-3" />
                {terminalMode === 'HERMES' && tab === 'WORK_ENGINE' ? 'Terminal de tareas' : 'Terminal Hermes'}
              </button>
              <span className="hidden lg:flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                <Activity className="w-3 h-3 text-purple-300" />
                v2.5
              </span>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                title="Volver al Command Center (Esc)"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Command Center
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Secciones de Operations Hub"
            className="flex flex-wrap items-center gap-1.5 px-4 md:px-5 py-2 border-b border-white/10 bg-black/30"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                id={`ops-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`ops-panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-mono text-[11px] tracking-wider transition-all whitespace-nowrap ${tab === t.id
                    ? 'border border-purple-500/30 bg-purple-500/10 text-purple-300'
                    : 'border border-white/10 bg-black/40 text-zinc-500 hover:text-zinc-200 hover:border-white/20'
                  }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id={`ops-panel-${tab}`}
            aria-labelledby={`ops-tab-${tab}`}
            tabIndex={0}
            className="flex-1 flex flex-col min-h-0 outline-none"
          >

          {/* TAB: WORK ENGINE */}
          {tab === 'WORK_ENGINE' && (
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-purple-300">
                    {terminalMode === 'HERMES' ? 'Hermes Kernel · Asistente Operativo' : 'Nexus Work Engine · Adicionador de Tareas'}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    {terminalMode === 'HERMES'
                      ? 'Terminal conversacional integrada para delegar trabajo operativo a Hermes.'
                      : 'Ingresa comandos estructurados para despachar tareas a #pandoras-security.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="/nexus/agenda"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 font-mono text-[10px] transition-colors"
                  >
                    <Calendar className="w-3 h-3" />
                    Abrir Agenda (Sovereign Meet)
                  </a>
                  <span className="hidden sm:block px-2 py-1 rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300 font-mono text-[10px]">
                    sudo nexus work
                  </span>
                </div>
              </div>

              <div
                ref={tab === 'WORK_ENGINE' ? containerRef : null}
                className="flex flex-col lg:flex-row flex-1 min-h-0 relative gap-6"
                style={{ '--left-pct': `${workLeftWidth}%`, '--right-pct': `${100 - workLeftWidth}%` } as React.CSSProperties}
              >
                <div className="flex flex-col min-h-0 h-[600px] overflow-hidden transition-all duration-300 w-full lg:w-[calc(var(--left-pct)-12px)]">
                  {terminalMode === 'HERMES' ? (
                    <NexusHermesTerminal role={userRole} operatorContext={operatorContext} autoBoot />
                  ) : (
                    <TaskTerminal mode="TASK" onTaskCreated={handleTerminalTask} userName={userName} userRole={userRole} />
                  )}
                </div>

                <div
                  className="hidden lg:flex absolute top-0 bottom-0 w-6 -ml-3 cursor-pointer group items-center justify-center z-10 hover:scale-110 transition-transform"
                  style={{ left: `var(--left-pct)` }}
                  onClick={(e) => { e.preventDefault(); cycleWidth(workLeftWidth, setWorkLeftWidth); }}
                  title="Haz clic para ajustar el tamaño de los paneles"
                >
                  <div className="flex flex-col items-center justify-center py-4 px-1 rounded-full border shadow-lg transition-all bg-[#08080A] border-white/20 group-hover:border-purple-500/50 group-hover:bg-purple-500/20 group-hover:shadow-purple-500/20">
                    <div className="flex gap-0.5">
                      <div className="w-0.5 h-8 rounded-full bg-white/40 group-hover:bg-purple-400" />
                      <div className="w-0.5 h-8 rounded-full bg-white/40 group-hover:bg-purple-400" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col min-h-0 h-[600px] border border-white/10 rounded-2xl overflow-hidden w-full lg:w-[calc(var(--right-pct)-12px)]">
                  <TasksPanel tasks={tasks} setTasks={setTasks} role={userRole} forceOpen={true} />
                </div>
              </div>
            </div>
          )}

          {/* TAB: OPS REGISTER */}
          {tab === 'REGISTER' && (
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.03]">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-300 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </span>
                  <div className="space-y-1 min-w-0">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-amber-300">Registro de Activos IP</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Marcas, clases, expediente y riesgo por organización.
                      <span className="text-zinc-500"> {assets.length} {assets.length === 1 ? "activo" : "activos"} registrados.</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAssetForm(!showAssetForm)}
                  className="px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-mono transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + REGISTRAR MARCA
                </button>
              </div>

              {assetsError && (
                <p className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-[11px] text-rose-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {assetsError}
                </p>
              )}

              {localImportCount > 0 && (
                <div className="flex flex-col gap-2 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] leading-relaxed text-sky-200">
                    Hay {localImportCount} {localImportCount === 1 ? "activo" : "activos"} guardados en este
                    navegador. Se pueden subir a la base una sola vez.
                  </p>
                  <button
                    type="button"
                    onClick={() => void importLocalAssets()}
                    disabled={importing}
                    className="shrink-0 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-sky-100 hover:bg-sky-500/25 disabled:opacity-50"
                  >
                    {importing ? "Importando…" : `Importar ${localImportCount}`}
                  </button>
                </div>
              )}

              {assetsLoading && (
                <p className="text-[11px] font-mono text-zinc-500">Cargando activos…</p>
              )}

              <AnimatePresence>
                {showAssetForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddAsset}
                    className="p-4 border border-white/10 rounded-xl bg-[#0C0C10] space-y-3 overflow-hidden"
                  >
                    <p className="text-[11px] text-purple-300 uppercase font-mono">Registrar Nueva Búsqueda / Denominación IP</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Ej. PANDORAS FINANCE..."
                        value={newAssetName}
                        onChange={(e) => setNewAssetName(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/40"
                      />
                      <select
                        value={newAssetCategory}
                        onChange={(e) => setNewAssetCategory(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/40"
                      >
                        <option value="Marca Denominativa Principal">Marca Denominativa Principal</option>
                        <option value="Marca Mixta (Nombre + Logo)">Marca Mixta (Nombre + Logo)</option>
                        <option value="Marca Secundaria / Ecosistema">Marca Secundaria / Ecosistema</option>
                        <option value="Copyright / Código Fuente">Copyright / Código Fuente</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Clases (Ej. Clase 36 + Clase 42)"
                        value={newAssetClasses}
                        onChange={(e) => setNewAssetClasses(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/40"
                      />
                      <select
                        value={newAssetAuthority}
                        onChange={(e) => setNewAssetAuthority(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/40"
                      >
                        <option value="IMPI (México)">IMPI (México)</option>
                        <option value="USPTO (EE.UU.)">USPTO (EE.UU.)</option>
                        <option value="WIPO / Internacional">WIPO / Internacional</option>
                        <option value="Indautor Depósito">Indautor Depósito</option>
                      </select>
                      <select
                        value={newAssetRisk}
                        onChange={(e) => setNewAssetRisk(e.target.value as any)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/40"
                      >
                        <option value="LOW">Riesgo Bajo (Aprobado)</option>
                        <option value="MEDIUM">Riesgo Medio (Revisar)</option>
                        <option value="HIGH">Riesgo Alto (Conflicto)</option>
                      </select>
                    </div>

                    <textarea
                      placeholder="Conclusiones de la búsqueda fonética u observaciones corporativas..."
                      value={newAssetNotes}
                      onChange={(e) => setNewAssetNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/40"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAssetForm(false)}
                        className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 text-xs font-mono transition-colors"
                      >
                        Guardar Activo & Generar Hito
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono">Registro Institucional de Activos IP ({assets.length})</p>
                {assets.length === 0 && (
                  <div className="rounded-xl border border-white/10 bg-[#0C0C10] p-6 text-center">
                    <p className="text-xs text-zinc-400">Sin activos registrados.</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-zinc-600">
                      Agrega un activo con “+ REGISTRAR MARCA”. Se guarda en la base de la organización.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    return (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${isSelected
                            ? 'border-purple-500/40 bg-purple-500/[0.04]'
                            : 'border-white/10 bg-[#0C0C10] hover:border-white/20'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs text-zinc-100">{asset.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono tracking-wider ${assetBadge(asset.status)}`}>
                            {asset.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mb-2">{asset.category} · {asset.classes}</p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-white/10">
                          <span>{asset.authority}</span>
                          <span>{asset.id}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedAsset && (
                <div className="p-5 rounded-xl border border-white/10 bg-[#0C0C10] space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm text-zinc-100">{selectedAsset.name}</h4>
                        {selectedAsset.riskAssessment && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                            Riesgo Legal: {selectedAsset.riskAssessment}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-purple-300 font-mono mt-0.5">Titular Registral: {selectedAsset.owner}</p>
                    </div>
                    <button
                      onClick={() => assignTask(`Notificación de Marca: ${selectedAsset.name}`)}
                      disabled={notifying}
                      className="px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[11px] font-mono transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${notifying ? 'animate-spin' : ''}`} />
                      <span>{notified ? 'ENVIADO A DISCORD ✓' : 'NOTIFICAR A DISCORD'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{selectedAsset.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: CLIENTS & CRM */}
          {tab === 'CLIENTS' && (
            <OperationsClientsTab onOpenApprovals={() => setTab('APPROVALS')} />
          )}

          {tab === 'COHORTS' && (
            <OperationsCollaboratorsTab isAdmin={isOpsAdmin} />
          )}

          {/* TAB: KNOWLEDGE BASE */}
          {tab === 'KNOWLEDGE' && (
            <OperationsKnowledgeTab />
          )}

          {tab === 'ACTIVITY' && (
            <div
              ref={tab === 'ACTIVITY' ? containerRef : null}
              className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 p-5 overflow-hidden relative"
              style={{ '--left-pct': `${activityLeftWidth}%`, '--right-pct': `${100 - activityLeftWidth}%` } as React.CSSProperties}
            >
              <div className="flex flex-col min-h-0 overflow-hidden relative transition-all duration-300 w-full lg:w-[calc(var(--left-pct)-12px)]">
                <OperationsBroadcastTab
                  userName={userName}
                  userEmail={userEmail}
                  userRole={userRole}
                  collaborators={collaborators}
                />
              </div>

              <div
                className="hidden lg:flex absolute top-5 bottom-5 w-6 -ml-3 cursor-pointer group items-center justify-center z-10 hover:scale-110 transition-transform"
                style={{ left: `var(--left-pct)` }}
                onClick={(e) => { e.preventDefault(); cycleWidth(activityLeftWidth, setActivityLeftWidth); }}
                title="Haz clic para ajustar el tamaño de los paneles"
              >
                <div className="flex flex-col items-center justify-center py-4 px-1 rounded-full border shadow-lg transition-all bg-[#08080A] border-white/20 group-hover:border-purple-500/50 group-hover:bg-purple-500/20 group-hover:shadow-purple-500/20">
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-8 rounded-full bg-white/40 group-hover:bg-purple-400" />
                    <div className="w-0.5 h-8 rounded-full bg-white/40 group-hover:bg-purple-400" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col min-h-0 overflow-hidden relative w-full lg:w-[calc(var(--right-pct)-12px)]">
                <OperationsIncidentCenter />
              </div>
            </div>
          )}

          {tab === 'APPROVALS' && (
            <OperationsApprovalsTab />
          )}

          {/* Footer status bar */}
          <div className="px-5 py-3 border-t border-white/10 bg-[#0C0C10] flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] text-zinc-500 truncate">
              MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V. · HOLDING
            </span>
            <div className="flex items-center gap-3 shrink-0">
              {/* Assignee & Discord controls strictly visible on WORK_ENGINE tab */}
              {tab === 'WORK_ENGINE' && (
                <>
                  <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="bg-[#0C0C10] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 font-mono outline-none focus:border-amber-500/50"
                  >
                    <option value="">Sin Asignar (Discord)</option>
                    {collaborators.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                    ))}
                  </select>
                  <button
                    onClick={() => assignTask(selectedAssignee ? `Operación asignada a ${collaborators.find(c => c.id === selectedAssignee)?.name}` : 'Resumen de Operaciones Enviado')}
                    disabled={notifying}
                    className="px-3.5 py-2 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[11px] font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${notifying ? 'animate-spin' : ''}`} />
                    <span>{notified ? 'ENVIADO ✓' : selectedAssignee ? 'ASIGNAR (HERMES WA)' : 'ENVIAR A DISCORD'}</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-black/40 hover:bg-white/5 border border-white/10 text-zinc-300 rounded-lg text-[11px] font-mono transition-colors cursor-pointer"
              >
                CERRAR
              </button>
            </div>
          </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
