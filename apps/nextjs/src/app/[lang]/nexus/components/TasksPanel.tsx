'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Calendar,
  Check,
  ChevronRight,
  X,
  Trash2,
  Link2,
  Image as ImageIcon,
  Code2,
  MessageSquareText,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { TIPOS, TaskItem, tipoLabel } from './taskTypes';

interface Props {
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
}

const prioBadge = (p: TaskItem['priority']) => {
  if (p === 'HIGH') return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
  if (p === 'MEDIUM') return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  return 'border-white/10 bg-black/40 text-zinc-400';
};

export default function TasksPanel({ tasks, setTasks }: Props) {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [evText, setEvText] = useState('');
  const [evCode, setEvCode] = useState('');
  const [evLink, setEvLink] = useState('');
  const [evPhoto, setEvPhoto] = useState('');
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDetail, setNewDetail] = useState('');
  const [newCategory, setNewCategory] = useState<TaskItem['category']>('IP & Trademarks');
  const [newPriority, setNewPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [newTipo, setNewTipo] = useState<string>('OPERACION');
  const [newWeek, setNewWeek] = useState<string>('Semana 1');

  const [tipoFilter, setTipoFilter] = useState('');

  const pending = tasks.filter((t) => !t.completed).length;
  const sorted = [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed));
  const filtered = tipoFilter
    ? sorted.filter((t) => (t.tipo ? tipoLabel(t.tipo) : 'Operación') === tipoFilter)
    : sorted;
  const CATS: TaskItem['category'][] = [
    'IP & Trademarks',
    'Legal & Corporate',
    'Tech & Data Room',
    'Operaciones',
    'Marketing & Media',
    'Finanzas',
  ];
  const catGroups = CATS.filter((c) => filtered.some((t) => t.category === c));

  const confirmComplete = async (task: TaskItem) => {
    if (sending) return;
    const parts: string[] = [];
    if (evText.trim()) parts.push(evText.trim());
    if (evCode.trim()) parts.push('```\n' + evCode.trim() + '\n```');
    const evidence = parts.join('\n\n');
    const hasPhoto = evPhoto.trim().length > 0;
    const evidenceType: TaskItem['evidenceType'] = hasPhoto
      ? 'foto'
      : evCode.trim()
        ? 'código'
        : evText.trim()
          ? 'texto'
          : 'enlace';
    const evidenceLink = evLink.trim() || evPhoto.trim() || undefined;

    setSending(true);
    try {
      const res = await fetch('/api/nexus/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'task-done',
          taskId: task.id,
          task: task.title,
          requester: task.requester || 'Nexus Ops',
          category: task.category,
          priority: task.priority,
          tipo: task.tipo,
          dueDate: task.dueDate,
          evidence,
          evidenceType,
          evidenceLink,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.warn('[Nexus Tasks] Discord notify failed:', data);
      }
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, completed: true, evidence, evidenceType, evidenceLink }
            : t
        )
      );
      setCompleting(null);
      setEvText('');
      setEvCode('');
      setEvLink('');
      setEvPhoto('');
      setFlash(`✓ ${task.id} completada · notificada a #pandoras-security`);
      setTimeout(() => setFlash(null), 4000);
    } catch (e: any) {
      setFlash(`✗ ${e.message || 'error al notificar'}`);
      setTimeout(() => setFlash(null), 4000);
    } finally {
      setSending(false);
    }
  };

  const cancelComplete = () => {
    setCompleting(null);
    setEvText('');
    setEvCode('');
    setEvLink('');
    setEvPhoto('');
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const formattedDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '2026-08-07';

    const newTask: TaskItem = {
      id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      week: newWeek,
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      tipo: tipoLabel(newTipo),
      completed: false,
      dueDate: formattedDueDate,
      detail: newDetail.trim() || 'Tarea operativa añadida a la hoja de ruta institucional.',
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTitle('');
    setNewDetail('');
    setShowAddForm(false);
    setFlash(`✓ ${newTask.id} · Hito registrado en el plan 30D`);
    setTimeout(() => setFlash(null), 4000);

    try {
      const res = await fetch('/api/nexus/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'task',
          requester: 'Nexus Ops',
          task: newTask.title,
          details: newTask.detail,
          priority: newTask.priority,
          category: newTask.category,
          tipo: newTask.tipo,
          dueDate: newTask.dueDate,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.warn('[Nexus Tasks] create notify failed:', data);
      }
    } catch (err: any) {
      console.warn('[Nexus Tasks] create notify failed:', err);
    }
  };

  const renderTask = (task: TaskItem) => {
    const isCompleting = completing === task.id;
    return (
      <div
        key={task.id}
        className={`p-3 rounded-xl border transition-all ${
          task.completed
            ? 'border-white/5 bg-black/30 opacity-60'
            : 'border-white/10 bg-[#08080A] hover:border-white/20'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[11px] ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                {task.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono ${prioBadge(task.priority)}`}>
                {task.priority}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 bg-black/40 text-zinc-400 font-mono">
                {task.category}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-purple-300 font-mono">
                {tipoLabel(task.tipo)}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed">{task.detail}</p>
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-600">
              <span>{task.week}</span>
              <span>·</span>
              <span>{task.dueDate}</span>
              {task.requester && (
                <>
                  <span>·</span>
                  <span className="text-purple-300/80">{task.requester}</span>
                </>
              )}
            </div>
            {task.completed && task.evidence && (
              <p className="text-[10px] text-emerald-300/90 font-mono whitespace-pre-wrap break-words">
                ✓ {task.evidenceType ? `(${task.evidenceType}) ` : ''}{task.evidence.slice(0, 240)}{task.evidence.length > 240 ? '…' : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!task.completed ? (
              <button
                onClick={() => {
                  setCompleting(task.id);
                  setEvText('');
                  setEvCode('');
                  setEvLink('');
                  setEvPhoto('');
                }}
                className="px-2 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[9px] font-mono hover:bg-emerald-500/20 transition-colors"
              >
                COMPLETAR
              </button>
            ) : (
              <span className="p-1 text-emerald-400"><Check className="w-3.5 h-3.5" /></span>
            )}
            <button
              onClick={() => setTasks((prev) => prev.filter((t) => t.id !== task.id))}
              className="p-1 text-zinc-600 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {isCompleting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-white/10 space-y-2 overflow-hidden"
          >
            <p className="text-[9px] font-mono uppercase tracking-wider text-purple-300">Evidencia de ejecución</p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-1.5">
                <MessageSquareText className="w-3 h-3 text-zinc-500 mt-1.5 shrink-0" />
                <textarea
                  placeholder="Texto / descripción de lo ejecutado..."
                  value={evText}
                  onChange={(e) => setEvText(e.target.value)}
                  rows={2}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/40"
                />
              </div>
              <div className="flex items-start gap-1.5">
                <Code2 className="w-3 h-3 text-zinc-500 mt-1.5 shrink-0" />
                <textarea
                  placeholder="Código / commit / diff (opcional)..."
                  value={evCode}
                  onChange={(e) => setEvCode(e.target.value)}
                  rows={2}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/40"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Link2 className="w-3 h-3 text-zinc-500 shrink-0" />
                <input
                  placeholder="Enlace (URL)..."
                  value={evLink}
                  onChange={(e) => setEvLink(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/40"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3 text-zinc-500 shrink-0" />
                <input
                  placeholder="Foto (URL)..."
                  value={evPhoto}
                  onChange={(e) => setEvPhoto(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/40"
                />
              </div>
            </div>
            {evPhoto && (
              <div className="flex items-center gap-2">
                <img
                  src={evPhoto}
                  alt="evidencia"
                  className="max-h-24 max-w-full rounded-lg border border-white/10 object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <a href={evPhoto} target="_blank" rel="noopener noreferrer" className="text-[10px] text-purple-300 flex items-center gap-1">
                  ver original <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={cancelComplete}
                className="px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmComplete(task)}
                disabled={sending}
                className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-200 text-[10px] font-mono transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {sending ? 'Enviando…' : (<><Check className="w-3 h-3" /> Confirmar y notificar</>)}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const renderList = () => (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddTask}
            className="p-3 border border-purple-500/20 rounded-xl bg-[#0C0C10] space-y-2 overflow-hidden"
          >
            <p className="text-[9px] text-purple-300 uppercase font-mono">Nuevo Hito del Plan 30 Días</p>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Un <span className="text-purple-300 font-mono">HITO 30D</span> es un objetivo de ejecución de la hoja de ruta institucional:
              se agenda en una semana (1-4) o en Pendientes, y al guardarlo se notifica a #pandoras-security.
            </p>
            <input
              type="text"
              placeholder="Título del hito..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-2 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/40"
            />
            <select
              value={newWeek}
              onChange={(e) => setNewWeek(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-purple-500/40"
            >
              <option value="Semana 1">Semana 1: Arquitectura & Solicitud IMPI</option>
              <option value="Semana 2">Semana 2: Corporate Resolution & Tech Ownership</option>
              <option value="Semana 3">Semana 3: Master Licensing & Data Room</option>
              <option value="Semana 4">Semana 4: Due Diligence Readiness Audit</option>
              <option value="Pendientes">Pendientes (fuera de plan)</option>
            </select>
            <textarea
              placeholder="Detalle de ejecución u observaciones..."
              value={newDetail}
              onChange={(e) => setNewDetail(e.target.value)}
              rows={2}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-2 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/40"
            />
            <div className="flex flex-wrap gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as TaskItem['category'])}
                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-zinc-300 focus:outline-none focus:border-purple-500/40"
              >
                <option value="IP & Trademarks">IP & Trademarks</option>
                <option value="Legal & Corporate">Legal & Corporate</option>
                <option value="Tech & Data Room">Tech & Data Room</option>
                <option value="Operaciones">Operaciones</option>
                <option value="Marketing & Media">Marketing & Media</option>
                <option value="Finanzas">Finanzas</option>
              </select>
              <select
                value={newTipo}
                onChange={(e) => setNewTipo(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-zinc-300 focus:outline-none focus:border-purple-500/40"
              >
                {TIPOS.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as 'HIGH' | 'MEDIUM' | 'LOW')}
                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-zinc-300 focus:outline-none focus:border-purple-500/40"
              >
                <option value="HIGH">Prioridad Alta</option>
                <option value="MEDIUM">Prioridad Media</option>
                <option value="LOW">Prioridad Baja</option>
              </select>
              <button
                type="submit"
                className="ml-auto px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 text-[10px] font-mono transition-colors"
              >
                Guardar Hito
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      {flash && (
        <div className="p-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-[10px] font-mono">
          {flash}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {TIPOS.map((t) => {
          const active = tipoFilter === t.label;
          return (
            <button
              key={t.key}
              onClick={() => setTipoFilter(active ? '' : t.label)}
              className={`px-2 py-0.5 rounded-full border font-mono transition-colors ${
                active
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-black/40 border-white/10 text-zinc-500 hover:border-white/25 hover:text-zinc-300'
              }`}
              title={t.short}
            >
              {t.key}
            </button>
          );
        })}
      </div>
      {catGroups.length > 0 ? (
        catGroups.map((cat) => {
          const catTasks = filtered.filter((t) => t.category === cat);
          if (catTasks.length === 0) return null;
          return (
            <div key={cat} className="space-y-1.5">
              <div className="flex items-center gap-2 pt-1.5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">{cat}</span>
                <span className="ml-auto font-mono text-[9px] text-zinc-600">{catTasks.length}</span>
              </div>
              {catTasks.map(renderTask)}
            </div>
          );
        })
      ) : (
        <p className="text-[11px] text-zinc-600 font-mono p-2">
          {tipoFilter ? 'Sin tareas para este tipo.' : 'Sin tareas registradas.'}
        </p>
      )}
    </div>
  );

  const renderHeader = (onClose?: () => void) => (
    <div className="flex items-center justify-between h-11 px-3 border-b border-white/10 bg-black/40 shrink-0">
      <span className="flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-purple-300" />
        <span className="text-[10px] font-mono tracking-widest text-zinc-300">TAREAS</span>
        {pending > 0 && (
          <span className="w-4 h-4 rounded-full bg-rose-500 text-black text-[9px] font-bold flex items-center justify-center animate-pulse">
            {pending}
          </span>
        )}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          title="HITO 30D: registra un objetivo del plan de ejecución a 30 días (agenda Semana 1-4 o Pendientes) y notifícalo a #pandoras-security"
          className={`px-2 py-1 rounded-lg border text-[9px] font-mono transition-all flex items-center gap-1 ${
            showAddForm
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
              : 'bg-black/40 border-white/10 text-zinc-300 hover:border-purple-500/30 hover:text-purple-300'
          }`}
        >
          <Plus className="w-3 h-3" />
          HITO 30D
        </button>
        {onClose ? (
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setOpen(false)} className="p-1 text-zinc-400 hover:text-white rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop docked panel */}
      <div
        className={`hidden md:flex flex-col shrink-0 border-l border-white/10 bg-[#0C0C10] transition-[width] duration-300 overflow-hidden ${
          open ? 'w-[360px]' : 'w-12'
        }`}
      >
        {open ? (
          <>
            {renderHeader()}
            <AnimatePresence>
              <motion.div
                key="body"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
              >
                {renderList()}
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="relative flex flex-col items-center justify-center gap-1.5 h-full w-full text-zinc-400 hover:text-purple-300 transition-colors"
            title="Abrir Tareas"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[8px] font-mono tracking-widest" style={{ writingMode: 'vertical-rl' }}>
              TAREAS
            </span>
            {pending > 0 && (
              <span className="absolute top-2 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-black text-[9px] font-bold flex items-center justify-center">
                {pending}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Mobile floating button + drawer */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[11px] font-mono hover:bg-purple-500/20 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" />
          TAREAS
          {pending > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-black text-[9px] font-bold flex items-center justify-center">
              {pending}
            </span>
          )}
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                className="fixed inset-y-0 right-0 z-[51] w-[85vw] max-w-sm bg-[#0C0C10] border-l border-white/10 flex flex-col"
              >
                {renderHeader(() => setMobileOpen(false))}
                <div className="flex-1 min-h-0 flex flex-col">{renderList()}</div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
