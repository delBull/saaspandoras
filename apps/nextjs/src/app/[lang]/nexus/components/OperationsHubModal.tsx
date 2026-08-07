'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import TaskTerminal, { TerminalTask } from './TaskTerminal';
import { TaskItem } from './taskTypes';

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

const INITIAL_ASSETS: IPAsset[] = [
  {
    id: 'PAND-MARK-HIST',
    name: 'PANDORAS FOUNDATION (Histórica)',
    category: 'Marca Denominativa',
    classes: 'Clase 42 (Servicios Tecnológicos)',
    status: 'ABANDONED',
    authority: 'IMPI (México)',
    owner: 'MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.',
    notes: 'Solicitud archivada por el IMPI (Expediente 3394059). Permite reiniciar la estrategia registral limpia desde la marca madre.',
    riskAssessment: 'LOW',
    findingsCount: 1
  },
  {
    id: 'PAND-MARK-001',
    name: 'PANDORAS (Marca Madre)',
    category: 'Marca Denominativa Principal',
    classes: 'Clase 36 (Finanzas/RWA) + Clase 42 (Tecnología)',
    status: 'PENDING',
    authority: 'IMPI (México) / USPTO (USA)',
    owner: 'MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.',
    notes: 'Examen de anterioridades en Marcanet completado (Riesgo BAJO). Búsqueda realizada para PANDORAS y PANDORA\'S en Clases 36 y 42. Sin marcas idénticas ni conflictos graves.',
    riskAssessment: 'LOW',
    findingsCount: 6
  },
  {
    id: 'PAND-MARK-002',
    name: 'PANDORAS FINANCE',
    category: 'Marca Secundaria (Financiera)',
    classes: 'Clase 36 (Finanzas, RWA, Crowdlending)',
    status: 'PLANNED',
    authority: 'IMPI (México)',
    owner: 'MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.',
    notes: 'Infraestructura de activos reales, tokenización y comercialización crediticia.',
    riskAssessment: 'LOW',
    findingsCount: 0
  },
  {
    id: 'PAND-MARK-003',
    name: 'PANDORAS OS',
    category: 'Marca Secundaria (SaaS)',
    classes: 'Clase 9 (Software) + Clase 42 (SaaS/AI)',
    status: 'PLANNED',
    authority: 'IMPI (México)',
    owner: 'MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.',
    notes: 'Sistema operativo comercial, herramientas de inteligencia artificial y dashboards.',
    riskAssessment: 'LOW',
    findingsCount: 0
  },
  {
    id: 'PAND-IP-CORE',
    name: 'Growth OS Kernel & Capital Engine',
    category: 'Copyright & Trade Secret',
    classes: 'Código Fuente / Algoritmos',
    status: 'ACTIVE',
    authority: 'Safe-Keep / Indautor Depósito',
    owner: 'Pandoras IP Holding / MXHUB',
    notes: 'Propiedad inalienable del Holding. Ninguna filial ni inversionista operativo puede reclamar titularidad.',
    riskAssessment: 'LOW',
    findingsCount: 0
  },
  {
    id: 'PAND-CONST-v3',
    name: 'Pandora\'s Product Constitution (10 Principios)',
    category: 'Marco Doctrinario & Gobernanza de Producto',
    classes: 'Libro 0 — Documento Supremo',
    status: 'ACTIVE',
    authority: 'Pandoras Holdings / Consejo',
    owner: 'Pandoras IP Holding / MXHUB',
    notes: 'Los 10 Principios Invariables de Producto y Congelamiento de Arquitectura v3.0 (Architecture Freeze v3.0). Regula el desarrollo de software y capacidades.',
    riskAssessment: 'LOW',
    findingsCount: 0
  },
  {
    id: 'PAND-HERMES-RUNTIME',
    name: 'Hermes Runtime & Multi-Tenant Agent OS',
    category: 'Trade Secret & Architecture Standard',
    classes: 'Clase 9 (Software) + Clase 42 (SaaS/AI)',
    status: 'ACTIVE',
    authority: 'Pandoras IP Holding',
    owner: 'MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.',
    notes: 'Motor de Ejecución de Inteligencia Autónoma multi-tenant sobre el cual corren los Agent Packs, Capabilities y adaptadores omnicanal.',
    riskAssessment: 'LOW',
    findingsCount: 0
  }
];

type Tab = 'REGISTER' | 'DATAROOM' | 'TERMINAL';

interface OpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
}

export function OperationsHubModal({ isOpen, onClose, tasks, setTasks }: OpsModalProps) {
  const [tab, setTab] = useState<Tab>('TERMINAL');
  const [assets, setAssets] = useState<IPAsset[]>(INITIAL_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<IPAsset | null>(INITIAL_ASSETS[1] ?? null);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);

  const [showAssetForm, setShowAssetForm] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState('Marca Denominativa');
  const [newAssetClasses, setNewAssetClasses] = useState('Clase 36 + Clase 42');
  const [newAssetAuthority, setNewAssetAuthority] = useState('IMPI (México)');
  const [newAssetRisk, setNewAssetRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [newAssetNotes, setNewAssetNotes] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedAssets = localStorage.getItem('pandoras_ip_assets_custom');
    if (storedAssets) {
      try { setAssets(JSON.parse(storedAssets)); } catch { }
    }
  }, []);

  const saveAssets = (updated: IPAsset[]) => {
    setAssets(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pandoras_ip_assets_custom', JSON.stringify(updated));
    }
  };

  const saveTasks = (updated: TaskItem[]) => {
    setTasks(updated);
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim()) return;

    const newAssetItem: IPAsset = {
      id: `PAND-MARK-${Math.floor(100 + Math.random() * 900)}`,
      name: newAssetName.trim(),
      category: newAssetCategory,
      classes: newAssetClasses,
      status: 'PENDING',
      authority: newAssetAuthority,
      owner: 'MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.',
      notes: newAssetNotes.trim() || 'Búsqueda de disponibilidad registrada de forma interactiva.',
      riskAssessment: newAssetRisk,
      findingsCount: 0
    };

    const updatedAssets = [newAssetItem, ...assets];
    saveAssets(updatedAssets);
    setSelectedAsset(newAssetItem);
    setNewAssetName('');
    setNewAssetNotes('');
    setShowAssetForm(false);

    const newTask: TaskItem = {
      id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      week: 'Semana 1',
      title: `Preparación de Solicitud "${newAssetItem.name}"`,
      category: 'IP & Trademarks',
      priority: 'HIGH',
      completed: false,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '2026-08-05',
      detail: `Definición de productos/servicios para ${newAssetItem.classes} y presentación ante ${newAssetItem.authority}.`
    };
    saveTasks([newTask, ...tasks]);

    sendDiscordAlert(`Nueva Búsqueda/Marca Registrada: ${newAssetItem.name} (Riesgo: ${newAssetItem.riskAssessment})`);
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
    };
    saveTasks([taskItem, ...tasks]);
  };

  const sendDiscordAlert = async (message: string, requester = 'Nexus Ops') => {
    setNotifying(true);
    try {
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
      setNotified(true);
      setTimeout(() => setNotified(false), 4000);
    } finally {
      setNotifying(false);
    }
  };

  if (!isOpen) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'TERMINAL', label: 'TERMINAL', icon: <TerminalSquare className="w-3.5 h-3.5" /> },
    { id: 'REGISTER', label: `OPS REGISTER (${assets.length})`, icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'DATAROOM', label: 'DATA ROOM', icon: <FolderGit2 className="w-3.5 h-3.5" /> },
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-5xl max-h-[92vh] bg-[#08080A] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.12)] flex flex-col"
        >
          {/* Header command bar */}
          <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 border-b border-white/10 bg-[#0C0C10]">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 shrink-0">
                <Shield className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-100 tracking-tight truncate">NEXUS OPERATIONS HUB</h3>
                  <span className="hidden sm:flex items-center gap-1 font-mono text-[9px] text-purple-300/80">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500" />
                    </span>
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] font-mono text-zinc-500 truncate">OPERATIONS HUB · IP · DATA ROOM · #pandoras-security</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden lg:flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                <Activity className="w-3 h-3 text-purple-300" />
                v2.5
              </span>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 px-4 md:px-5 py-2.5 border-b border-white/10 bg-black/30 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] tracking-wider transition-all whitespace-nowrap ${
                  tab === t.id
                    ? 'border border-purple-500/30 bg-purple-500/10 text-purple-300'
                    : 'border border-white/10 bg-black/40 text-zinc-500 hover:text-zinc-200 hover:border-white/20'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB: TERMINAL */}
          {tab === 'TERMINAL' && (
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-purple-300">Adicionador de Tareas Pendientes</p>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    Responde las preguntas del terminal · la tarea queda pendiente y se envía a #pandoras-security
                  </p>
                </div>
                <span className="hidden sm:block px-2 py-1 rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300 font-mono text-[10px]">
                  sudo nexus ops
                </span>
              </div>
              <TaskTerminal onTaskCreated={handleTerminalTask} />
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
                    <p className="text-[11px] font-mono uppercase tracking-wider text-amber-300">Análisis Marcanet Finalizado: PANDORAS / PANDORA'S (Clases 36 + 42)</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Examen de anterioridad completado (6 hallazgos, 0 conflictos graves). <strong className="text-white">Clasificación: RIESGO BAJO.</strong> Se procede con la marca madre <strong className="text-amber-300">PANDORAS™</strong> a nombre directo de <strong>MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.</strong>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    return (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
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
                      onClick={() => sendDiscordAlert(`Notificación de Marca: ${selectedAsset.name}`)}
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

          {/* TAB: DATA ROOM */}
          {tab === 'DATAROOM' && (
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.03]">
                <p className="text-[11px] text-purple-300 font-mono uppercase mb-1">Estructura del Corporate Data Room (/nexus)</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Cadena documental organizada en 6 módulos institucionales para due diligence e inversionistas estratégicos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-white/10 bg-[#0C0C10] space-y-2 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-2 text-purple-300 font-mono text-xs">
                    <FolderGit2 className="w-4 h-4" />
                    <span>01_company</span>
                  </div>
                  <p className="text-xs text-zinc-300">Estatutos de constitución, libro de accionistas de MXHUB S.A. de C.V. y resoluciones corporativas de asamblea.</p>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-[#0C0C10] space-y-2 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-2 text-rose-300 font-mono text-xs">
                    <Shield className="w-4 h-4" />
                    <span>02_ip</span>
                  </div>
                  <p className="text-xs text-zinc-300">Registro IMPI PANDORAS™, depósitos de código fuente, marcas denominativas y expedientes AEP.</p>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-[#0C0C10] space-y-2 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-2 text-indigo-300 font-mono text-xs">
                    <Code2 className="w-4 h-4" />
                    <span>03_technology</span>
                  </div>
                  <p className="text-xs text-zinc-300">Arquitectura Growth OS v3.0, repositorios bajo control, smart contracts verificados y deployer keys.</p>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-[#0C0C10] space-y-2 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs">
                    <Cpu className="w-4 h-4" />
                    <span>04_business</span>
                  </div>
                  <p className="text-xs text-zinc-300">Modelos financieros, proyecciones de cobro de Platform Fees/Royalty Fees y pipeline de alianzas RWA.</p>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-[#0C0C10] space-y-2 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs">
                    <FolderGit2 className="w-4 h-4" />
                    <span>05_legal</span>
                  </div>
                  <p className="text-xs text-zinc-300">Master License Agreement (Holding ➔ USA LLC), convenios de confidencialidad NDA y licencias territoriales.</p>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-[#0C0C10] space-y-2 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-2 text-amber-300 font-mono text-xs">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>06_investor</span>
                  </div>
                  <p className="text-xs text-zinc-300">Institutional Pitch, Data Room index, modelos SAFE y estructura de participación en Pandoras USA LLC.</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer status bar */}
          <div className="px-5 py-3 border-t border-white/10 bg-[#0C0C10] flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] text-zinc-500 truncate">
              MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V. · HOLDING
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => sendDiscordAlert('Resumen de Operaciones Enviado')}
                disabled={notifying}
                className="px-3.5 py-2 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[11px] font-mono transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${notifying ? 'animate-spin' : ''}`} />
                <span>{notified ? 'ENVIADO ✓' : 'ENVIAR A DISCORD'}</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-black/40 hover:bg-white/5 border border-white/10 text-zinc-300 rounded-lg text-[11px] font-mono transition-colors"
              >
                CERRAR
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
