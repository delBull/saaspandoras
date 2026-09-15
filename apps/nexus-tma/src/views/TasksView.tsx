import { useState, useEffect, useCallback } from 'react';
import { nexusGet, nexusPost, nexusPatch } from '../lib/api-client';
import type { NexusTmaSession } from '../lib/session-store';

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

  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'>('NORMAL');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await nexusGet<{ tasks: NexusTask[] }>('/api/v1/tma/nexus/tasks', session.token);
      setTasks(data.tasks || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [session.token]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      setSubmitting(true);
      await nexusPost('/api/v1/tma/nexus/tasks', {
        title: newTaskTitle,
        priority: newTaskPriority,
      }, session.token);
      setIsCreating(false);
      setNewTaskTitle('');
      setNewTaskPriority('NORMAL');
      await fetchTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (taskId: string, action: 'CLAIM' | 'COMPLETE' | 'CANCEL') => {
    try {
      await nexusPatch(`/api/v1/tma/nexus/tasks/${taskId}`, { action }, session.token);
      await fetchTasks();
    } catch (err: any) {
      setError(err.message || `Failed to ${action.toLowerCase()} task`);
    }
  };

  const myTasks = tasks.filter(t => t.assigneeCollaboratorId === session.collaboratorId && ['OPEN', 'IN_PROGRESS'].includes(t.status));
  const teamTasks = tasks.filter(t => !t.assigneeCollaboratorId && t.status === 'OPEN');
  
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return 'var(--color-danger)';
      case 'HIGH': return 'var(--color-warning)';
      case 'NORMAL': return 'var(--color-accent)';
      case 'LOW': return 'var(--color-text-muted)';
      default: return 'var(--color-accent)';
    }
  };

  return (
    <div className="screen fade-in">
      <header className="nexus-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 16 }}>✓</span>
            <span className="font-semibold text-lg">Work Queue</span>
          </div>
          <button 
            onClick={() => fetchTasks()} 
            className="flex items-center justify-center"
            style={{ width: 36, height: 36, background: 'var(--color-bg-elevated)', borderRadius: '50%' }}
          >
            🔄
          </button>
        </div>
      </header>

      <div className="page-content flex-col gap-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        {isCreating ? (
          <div className="card flex-col gap-3" style={{ marginBottom: 'var(--space-3)' }}>
            <h4 className="font-semibold text-sm">Nueva Tarea</h4>
            <input 
              type="text" 
              placeholder="Descripción de la tarea..." 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full p-2 text-sm"
              style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
            />
            <div className="flex gap-2">
              <select 
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="flex-1 p-2 text-sm"
                style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              >
                <option value="CRITICAL">🔴 Critical</option>
                <option value="HIGH">🟠 High</option>
                <option value="NORMAL">🔵 Normal</option>
                <option value="LOW">⚪ Low</option>
              </select>
            </div>
            <div className="flex gap-2 mt-2">
              <button 
                className="btn btn-secondary flex-1 p-2 text-sm font-semibold rounded-sm"
                onClick={() => setIsCreating(false)}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-accent flex-1 p-2 text-sm font-semibold rounded-sm"
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim() || submitting}
              >
                {submitting ? 'Guardando...' : 'Crear Tarea'}
              </button>
            </div>
          </div>
        ) : (
          <button 
            className="w-full py-3 border border-dashed border-accent text-accent text-sm font-bold flex items-center justify-center gap-2 rounded-xl mb-2"
            onClick={() => setIsCreating(true)}
            style={{ background: 'rgba(56, 189, 248, 0.05)' }}
          >
            <span>+</span> Nueva Tarea
          </button>
        )}

        {loading && tasks.length === 0 && (
          <div className="text-center p-8 text-secondary">Loading tasks...</div>
        )}

        {/* ASSIGNED TO ME */}
        {myTasks.length > 0 && (
          <div>
            <h3 className="font-bold text-sm text-accent mb-3 flex items-center gap-2">
              <span>👤</span> MIS TAREAS ({myTasks.length})
            </h3>
            {myTasks.map(task => (
              <div key={task.id} className="card flex-col gap-3" style={{ marginBottom: 'var(--space-3)', borderLeft: `4px solid ${getPriorityColor(task.priority)}` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm">{task.title}</h4>
                    <span className="text-secondary text-xs">{task.status === 'IN_PROGRESS' ? '⏳ En progreso' : '⭕ Abierta'}</span>
                  </div>
                  {task.priority === 'CRITICAL' && <span className="badge badge-danger text-xs text-white">Critical</span>}
                </div>
                <div className="flex gap-2 mt-2">
                  <button 
                    className="btn btn-success flex-1 p-2 text-sm font-semibold rounded-sm"
                    onClick={() => handleAction(task.id, 'COMPLETE')}
                  >
                    ✓ Completar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TEAM QUEUE */}
        {teamTasks.length > 0 && (
          <div className="mt-4">
            <h3 className="font-bold text-sm text-secondary mb-3 flex items-center gap-2">
              <span>👥</span> TEAM QUEUE ({teamTasks.length})
            </h3>
            {teamTasks.map(task => (
              <div key={task.id} className="card flex-col gap-3 opacity-90" style={{ marginBottom: 'var(--space-3)', borderLeft: `4px solid ${getPriorityColor(task.priority)}` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm">{task.title}</h4>
                    <span className="text-secondary text-xs">Unassigned</span>
                  </div>
                  {task.priority === 'CRITICAL' && <span className="badge badge-danger text-xs text-white">Critical</span>}
                </div>
                <div className="flex gap-2 mt-2">
                  <button 
                    className="btn btn-accent flex-1 p-2 text-sm font-semibold rounded-sm"
                    onClick={() => handleAction(task.id, 'CLAIM')}
                  >
                    ✋ Reclamar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && myTasks.length === 0 && teamTasks.length === 0 && (
          <div className="text-center p-8">
            <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🧘‍♂️</span>
            <p className="font-medium">No hay tareas pendientes</p>
          </div>
        )}
      </div>
    </div>
  );
}
