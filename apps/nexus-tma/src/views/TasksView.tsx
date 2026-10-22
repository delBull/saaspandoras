import { useState, useEffect, useCallback } from 'react';
import { nexusGet, nexusPost, nexusPatch } from '../lib/api-client';
import type { NexusTmaSession } from '../lib/session-store';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Loader2,
  Sparkles
} from 'lucide-react';

interface TasksViewProps {
  session: NexusTmaSession;
}

interface NexusTask {
  id: string;
  title: string;
  description: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  visibility: 'TEAM_VISIBLE' | 'PRIVATE';
  assigneeCollaboratorId: number | null;
  assigneeName: string | null;
  dueDate: string | null;
  createdAt: string;
}

export function TasksView({ session }: TasksViewProps) {
  const [tasks, setTasks] = useState<NexusTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'MY' | 'TEAM' | 'ALL'>('MY');
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'>('NORMAL');
  const [submitting, setSubmitting] = useState(false);

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      // @ts-ignore
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type);
    } catch {
      // ignore
    }
  };

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await nexusGet<{ tasks: NexusTask[] }>('/api/v1/tma/nexus/tasks');
      setTasks(data.tasks || []);
    } catch (err: any) {
      setError(err.message || 'No se pudieron sincronizar las tareas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      triggerHaptic('medium');
      setSubmitting(true);
      await nexusPost('/api/v1/tma/nexus/tasks', {
        title: newTaskTitle,
        priority: newTaskPriority,
      });
      setIsCreating(false);
      setNewTaskTitle('');
      setNewTaskPriority('NORMAL');
      await fetchTasks();
    } catch (err: any) {
      setError(err.message || 'No se pudo crear la tarea');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (taskId: string, action: 'CLAIM' | 'COMPLETE' | 'CANCEL') => {
    try {
      triggerHaptic('medium');
      await nexusPatch(`/api/v1/tma/nexus/tasks/${taskId}`, { action });
      await fetchTasks();
    } catch (err: any) {
      setError(err.message || `Error al actualizar tarea`);
    }
  };

  const myTasks = tasks.filter(t => t.assigneeCollaboratorId === session.collaboratorId && ['OPEN', 'IN_PROGRESS'].includes(t.status));
  const teamTasks = tasks.filter(t => !t.assigneeCollaboratorId && t.status === 'OPEN');
  
  const displayedTasks = activeTab === 'MY' ? myTasks : activeTab === 'TEAM' ? teamTasks : tasks;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="badge badge-danger">CRÍTICO</span>;
      case 'HIGH':
        return <span className="badge badge-amber">ALTA</span>;
      case 'LOW':
        return <span className="badge badge-success">BAJA</span>;
      default:
        return <span className="badge badge-accent">NORMAL</span>;
    }
  };

  return (
    <div className="screen fade-in pb-24">
      {/* Top Header */}
      <header className="nexus-top-bar">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-accent">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight">Work Engine</h1>
            <p className="text-[11px] text-muted font-mono">Gestor de Operaciones & SLAs</p>
          </div>
        </div>

        <button 
          onClick={() => {
            triggerHaptic('light');
            setIsCreating(true);
          }}
          className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md shadow-violet-500/25"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva</span>
        </button>
      </header>

      <div className="page-content flex flex-col gap-4">
        {/* Create Task Modal / Sheet */}
        {isCreating && (
          <div className="card p-4 border-violet-500/40 bg-violet-950/20 mb-2">
            <h4 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Nueva Tarea Operativa
            </h4>
            <input 
              type="text" 
              placeholder="¿Qué operación debe ejecutarse?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500 mb-3"
              autoFocus
            />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-secondary">Nivel de Prioridad:</span>
              <div className="flex gap-1.5">
                {(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => { triggerHaptic('light'); setNewTaskPriority(p); }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      newTaskPriority === p 
                        ? p === 'CRITICAL' ? 'bg-rose-500 text-white' : p === 'HIGH' ? 'bg-amber-500 text-black' : 'bg-violet-600 text-white'
                        : 'bg-white/5 text-muted hover:bg-white/10'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleCreateTask}
                disabled={submitting || !newTaskTitle.trim()}
                className="btn btn-primary flex-1 py-2.5 text-xs font-bold"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Tarea'}
              </button>
              <button 
                onClick={() => setIsCreating(false)}
                className="btn btn-ghost py-2.5 text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Tab Filters */}
        <div className="pill-filter-strip">
          <button 
            onClick={() => { triggerHaptic('light'); setActiveTab('MY'); }}
            className={`pill-item ${activeTab === 'MY' ? 'active' : ''}`}
          >
            Mis Asignaciones ({myTasks.length})
          </button>
          <button 
            onClick={() => { triggerHaptic('light'); setActiveTab('TEAM'); }}
            className={`pill-item ${activeTab === 'TEAM' ? 'active' : ''}`}
          >
            Pool del Equipo ({teamTasks.length})
          </button>
          <button 
            onClick={() => { triggerHaptic('light'); setActiveTab('ALL'); }}
            className={`pill-item ${activeTab === 'ALL' ? 'active' : ''}`}
          >
            Todas ({tasks.length})
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Task Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="spinner" />
            <span className="text-xs text-secondary">Cargando tareas del Work Engine...</span>
          </div>
        ) : displayedTasks.length === 0 ? (
          <div className="card text-center py-12 px-6 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white text-base">Sin tareas pendientes</h3>
            <p className="text-xs text-secondary mt-1 max-w-xs leading-relaxed">
              {activeTab === 'MY' 
                ? 'No tienes tareas activas asignadas actualmente. ¡Buen trabajo!' 
                : 'No hay tareas en esta categoría.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {displayedTasks.map(t => {
              const isDone = t.status === 'DONE';
              return (
                <div 
                  key={t.id}
                  className={`card p-4 transition-all ${isDone ? 'opacity-50' : 'border-white/10'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {getPriorityBadge(t.priority)}
                        <span className="text-[10px] font-mono text-muted">
                          {t.assigneeName ? `Asignado a @${t.assigneeName}` : 'Sin asignar'}
                        </span>
                      </div>
                      <h4 className={`font-semibold text-sm text-white ${isDone ? 'line-through text-muted' : ''}`}>
                        {t.title}
                      </h4>
                      {t.description && (
                        <p className="text-xs text-secondary mt-1 line-clamp-2">
                          {t.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {!isDone && (
                        <>
                          {!t.assigneeCollaboratorId && (
                            <button 
                              onClick={() => handleAction(t.id, 'CLAIM')}
                              className="btn btn-ghost btn-sm text-[11px] py-1 px-2.5 border-violet-500/30 text-violet-300"
                            >
                              Tomar
                            </button>
                          )}
                          <button 
                            onClick={() => handleAction(t.id, 'COMPLETE')}
                            className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 active:scale-90"
                            title="Completar"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[10px] text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t.dueDate ? `Vence: ${new Date(t.dueDate).toLocaleDateString()}` : 'Sin fecha límite'}
                    </span>
                    <span className="font-mono">#{t.id.slice(0, 8)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
