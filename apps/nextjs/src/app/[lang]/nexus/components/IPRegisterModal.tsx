'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Clock, Plus, Trash2, Check, RefreshCw, X, ChevronRight, ListTodo, Layers, Calendar, ArrowUpRight, FolderGit2, Code2, Cpu } from 'lucide-react';

interface IPAsset {
  id: string;
  name: string;
  category: string;
  classes: string;
  status: 'ABANDONED' | 'PENDING' | 'PLANNED' | 'ACTIVE';
  authority: string;
  owner: string;
  notes: string;
}

interface TaskItem {
  id: string;
  week: string;
  title: string;
  category: 'IP & Trademarks' | 'Legal & Corporate' | 'Tech & Data Room';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
  dueDate: string;
  detail: string;
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
    notes: 'Solicitud archivada por el IMPI (Expediente 3394059). Permite reiniciar la estrategia registral limpia desde la marca madre.'
  },
  {
    id: 'PAND-MARK-001',
    name: 'PANDORAS (Marca Madre)',
    category: 'Marca Denominativa Principal',
    classes: 'Clase 36 (Finanzas/RWA) + Clase 42 (Tecnología)',
    status: 'PENDING',
    authority: 'IMPI (México) / USPTO (USA)',
    owner: 'MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.',
    notes: 'Prioridad 1. Protege la palabra madre en ambas clases críticas antes de la apertura de licencias en EE.UU.'
  },
  {
    id: 'PAND-MARK-002',
    name: 'PANDORAS FINANCE',
    category: 'Marca Secundaria (Financiera)',
    classes: 'Clase 36 (Finanzas, RWA, Crowdlending)',
    status: 'PLANNED',
    authority: 'IMPI (México)',
    owner: 'MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.',
    notes: 'Infraestructura de activos reales, tokenización y comercialización crediticia.'
  },
  {
    id: 'PAND-MARK-003',
    name: 'PANDORAS OS',
    category: 'Marca Secundaria (SaaS)',
    classes: 'Clase 9 (Software) + Clase 42 (SaaS/AI)',
    status: 'PLANNED',
    authority: 'IMPI (México)',
    owner: 'MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.',
    notes: 'Sistema operativo comercial, herramientas de inteligencia artificial y dashboards.'
  },
  {
    id: 'PAND-IP-CORE',
    name: 'Growth OS Kernel & Capital Engine',
    category: 'Copyright & Trade Secret',
    classes: 'Código Fuente / Algoritmos',
    status: 'ACTIVE',
    authority: 'Safe-Keep / Indautor Depósito',
    owner: 'Pandoras IP Holding / MXHUB',
    notes: 'Propiedad inalienable del Holding. Ninguna filial ni inversionista operativo puede reclamar titularidad.'
  }
];

const INITIAL_TASKS: TaskItem[] = [
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
    completed: false,
    dueDate: '2026-08-03',
    detail: 'Examen previo de anterioridades en el Marcanet del IMPI para Clases 36 (Finanzas) y 42 (Tecnología) a nombre de MXHUB S.A. de C.V.'
  },
  {
    id: 'TSK-W1-03',
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

export function IPRegisterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'REGISTER' | 'TASKS' | 'DATAROOM'>('REGISTER');
  const [assets, setAssets] = useState<IPAsset[]>(INITIAL_ASSETS);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [selectedAsset, setSelectedAsset] = useState<IPAsset | null>(INITIAL_ASSETS[1] ?? null);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDetail, setNewDetail] = useState('');
  const [newCategory, setNewCategory] = useState<'IP & Trademarks' | 'Legal & Corporate' | 'Tech & Data Room'>('IP & Trademarks');
  const [newPriority, setNewPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [newWeek, setNewWeek] = useState<string>('Semana 1');
  const [showAddForm, setShowAddForm] = useState(false);

  // Persistence in localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedTasks = localStorage.getItem('pandoras_ip_tasks_30d');
    if (storedTasks) {
      try { setTasks(JSON.parse(storedTasks)); } catch {}
    }
  }, []);

  const saveTasks = (updated: TaskItem[]) => {
    setTasks(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pandoras_ip_tasks_30d', JSON.stringify(updated));
    }
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const formattedDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '2026-08-07';

    const newTask: TaskItem = {
      id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      week: newWeek,
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      completed: false,
      dueDate: formattedDueDate,
      detail: newDetail.trim() || 'Tarea operativa añadida a la hoja de ruta institucional.'
    };

    saveTasks([newTask, ...tasks]);
    setNewTitle('');
    setNewDetail('');
    setShowAddForm(false);

    sendDiscordAlert(`Nueva Tarea Creada (${newTask.week}): ${newTask.title}`);
  };

  const sendDiscordAlert = async (customMessage?: string) => {
    setNotifying(true);
    try {
      const msg = customMessage || (selectedAsset ? `Estatus IP: ${selectedAsset.name} (${selectedAsset.status})` : 'Actualización de Roadmap IP');
      await fetch('/api/books/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'marco.munoz9@gmail.com',
          bookSlug: `📋 Nexus Governance: ${msg}`
        })
      });
      setNotified(true);
      setTimeout(() => setNotified(false), 4000);
    } finally {
      setNotifying(false);
    }
  };

  if (!isOpen) return null;

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c0c0e] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-light text-white tracking-tight">IP Governance & Corporate OS</h3>
                <p className="text-xs text-zinc-400 font-light">Plan de Ejecución a 30 Días & Corporate Data Room</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2">
              <div className="flex p-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs">
                <button
                  onClick={() => setTab('REGISTER')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    tab === 'REGISTER' ? 'bg-amber-500/20 text-amber-300 font-normal border border-amber-500/30' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Master Register</span>
                </button>
                <button
                  onClick={() => setTab('TASKS')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    tab === 'TASKS' ? 'bg-amber-500/20 text-amber-300 font-normal border border-amber-500/30' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Plan 30 Días ({tasks.length})</span>
                </button>
                <button
                  onClick={() => setTab('DATAROOM')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    tab === 'DATAROOM' ? 'bg-amber-500/20 text-amber-300 font-normal border border-amber-500/30' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span>Corporate Data Room</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* TAB 1: MASTER REGISTER */}
          {tab === 'REGISTER' && (
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Status Summary Banner */}
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.03] flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-normal text-amber-300">Diagnóstico IMPI Expediente 3394059 (Histórico): ABANDONADO</p>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    La solicitud de <em>Pandoras Foundation</em> fue archivada por el IMPI. <strong className="text-white">Conclusión estratégica:</strong> No existe activo registral previo ni cesión requerida entre Juan Pablo y MXHUB. Se reinicia el registro limpio de la marca madre <strong className="text-amber-400">"PANDORAS"</strong> a nombre directo de <strong>MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.</strong> en Clases 36 + 42. Usa el distintivo PANDORAS™.
                  </p>
                </div>
              </div>

              {/* Asset List */}
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-mono">Registro Institucional de Activos IP</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    let badgeBg = 'bg-zinc-800 text-zinc-400 border-zinc-700';
                    if (asset.status === 'ABANDONED') badgeBg = 'bg-rose-950/60 text-rose-400 border-rose-800/60';
                    if (asset.status === 'PENDING') badgeBg = 'bg-amber-950/60 text-amber-400 border-amber-800/60';
                    if (asset.status === 'PLANNED') badgeBg = 'bg-blue-950/60 text-blue-400 border-blue-800/60';
                    if (asset.status === 'ACTIVE') badgeBg = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';

                    return (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-500/60 bg-amber-500/[0.04]'
                            : 'border-zinc-800/80 bg-zinc-900/20 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs text-white font-normal">{asset.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono tracking-wider ${badgeBg}`}>
                            {asset.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-light mb-2">{asset.category} · {asset.classes}</p>
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-zinc-800/50">
                          <span>{asset.authority}</span>
                          <span className="font-mono">{asset.id}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Asset Details */}
              {selectedAsset && (
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                    <div>
                      <h4 className="text-sm font-normal text-white">{selectedAsset.name}</h4>
                      <p className="text-xs text-amber-400 font-mono mt-0.5">Titular Propuesto: {selectedAsset.owner}</p>
                    </div>
                    <button
                      onClick={() => sendDiscordAlert(`Notificación de Marca: ${selectedAsset.name}`)}
                      disabled={notifying}
                      className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${notifying ? 'animate-spin' : ''}`} />
                      <span>{notified ? 'Enviado a Discord ✓' : 'Notificar a Discord'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-300 font-light leading-relaxed">{selectedAsset.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PLAN 30 DÍAS & ACCIONES */}
          {tab === 'TASKS' && (
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Progress & Quick Stats */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-400 font-mono">Plan de Ejecución Institucional (Próximos 30 Días)</p>
                  <p className="text-lg font-light text-white">{completedCount} de {tasks.length} Hitos Completados ({progressPct}%)</p>
                </div>
                <div className="w-36 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-normal transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Hito</span>
                </button>
              </div>

              {/* Add Task Form (Collapsible) */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddTask}
                    className="p-4 border border-zinc-800 rounded-xl bg-zinc-950/80 space-y-3 overflow-hidden"
                  >
                    <p className="text-xs text-amber-400 uppercase font-mono">Nuevo Hito del Plan 30 Días</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Título del hito..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                      />
                      <select
                        value={newWeek}
                        onChange={(e) => setNewWeek(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300"
                      >
                        <option value="Semana 1">Semana 1: Arquitectura & Solicitud IMPI</option>
                        <option value="Semana 2">Semana 2: Corporate Resolution & Tech Ownership</option>
                        <option value="Semana 3">Semana 3: Master Licensing & Data Room</option>
                        <option value="Semana 4">Semana 4: Due Diligence Readiness Audit</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Detalle de ejecución u observaciones..."
                      value={newDetail}
                      onChange={(e) => setNewDetail(e.target.value)}
                      rows={2}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                    />
                    <div className="flex gap-3">
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as any)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300"
                      >
                        <option value="IP & Trademarks">IP & Trademarks</option>
                        <option value="Legal & Corporate">Legal & Corporate</option>
                        <option value="Tech & Data Room">Tech & Data Room</option>
                      </select>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300"
                      >
                        <option value="HIGH">Prioridad Alta</option>
                        <option value="MEDIUM">Prioridad Media</option>
                        <option value="LOW">Prioridad Baja</option>
                      </select>
                      <button
                        type="submit"
                        className="ml-auto px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-normal transition-colors"
                      >
                        Guardar Hito
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Tasks List by Week */}
              {['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'].map((weekName) => {
                const weekTasks = tasks.filter(t => t.week === weekName);
                if (weekTasks.length === 0) return null;

                return (
                  <div key={weekName} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs uppercase tracking-wider text-amber-400 font-mono">{weekName}</h4>
                    </div>
                    <div className="space-y-2">
                      {weekTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                            task.completed
                              ? 'border-zinc-800/40 bg-zinc-950/40 opacity-60'
                              : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <button
                              onClick={() => toggleTask(task.id)}
                              className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                task.completed
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                  : 'border-zinc-700 hover:border-amber-400'
                              }`}
                            >
                              {task.completed && <Check className="w-3.5 h-3.5" />}
                            </button>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-normal ${task.completed ? 'line-through text-zinc-400' : 'text-white'}`}>
                                  {task.title}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 font-mono">
                                  {task.category}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-mono ${
                                  task.priority === 'HIGH' ? 'text-amber-400 bg-amber-950/40' : 'text-zinc-400 bg-zinc-800'
                                }`}>
                                  {task.priority}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 font-light leading-relaxed">{task.detail}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-zinc-400 font-mono">{task.dueDate}</span>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1 text-zinc-400 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: CORPORATE DATA ROOM */}
          {tab === 'DATAROOM' && (
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.03]">
                <p className="text-xs text-amber-300 font-mono uppercase mb-1">Estructura del Corporate Data Room (/nexus)</p>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">
                  Cadena documental organizada en 6 módulos institucionales para due diligence e inversionistas estratégicos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                    <FolderGit2 className="w-4 h-4" />
                    <span>01_company</span>
                  </div>
                  <p className="text-xs text-zinc-300 font-light">Estatutos de constitución, libro de accionistas de MXHUB S.A. de C.V. y resoluciones corporativas de asamblea.</p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-mono text-xs">
                    <Shield className="w-4 h-4" />
                    <span>02_ip</span>
                  </div>
                  <p className="text-xs text-zinc-300 font-light">Registro IMPI PANDORAS™, depósitos de código fuente, marcas denominativas y expedientes AEP.</p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs">
                    <Code2 className="w-4 h-4" />
                    <span>03_technology</span>
                  </div>
                  <p className="text-xs text-zinc-300 font-light">Arquitectura Growth OS v3.0, repositorios bajo control, smart contracts verificados y deployer keys.</p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs">
                    <Cpu className="w-4 h-4" />
                    <span>04_business</span>
                  </div>
                  <p className="text-xs text-zinc-300 font-light">Modelos financieros, proyecciones de cobro de Platform Fees/Royalty Fees y pipeline de alianzas RWA.</p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs">
                    <FolderGit2 className="w-4 h-4" />
                    <span>05_legal</span>
                  </div>
                  <p className="text-xs text-zinc-300 font-light">Master License Agreement (Holding ➔ USA LLC), convenios de confidencialidad NDA y licencias territoriales.</p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-mono text-xs">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>06_investor</span>
                  </div>
                  <p className="text-xs text-zinc-300 font-light">Institutional Pitch, Data Room index, modelos SAFE y estructura de participación en Pandoras USA LLC.</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Titular Registral: MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.</span>
            <div className="flex gap-3">
              <button
                onClick={() => sendDiscordAlert('Resumen de Plan 30 Días Enviado')}
                disabled={notifying}
                className="px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${notifying ? 'animate-spin' : ''}`} />
                <span>Enviar Resumen a Discord</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs transition-colors font-light"
              >
                Cerrar Módulo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
