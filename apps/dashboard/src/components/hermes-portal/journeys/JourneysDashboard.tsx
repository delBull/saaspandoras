'use client';

import React, { useState } from 'react';
import { 
  GitBranch, 
  Goal, 
  CheckCircle2, 
  Circle, 
  PlayCircle, 
  PauseCircle, 
  Plus, 
  LayoutGrid, 
  Settings2, 
  Trash2, 
  X, 
  Save, 
  AlertTriangle,
  MoveUp,
  MoveDown
} from 'lucide-react';
import { toast } from 'sonner';
import { createJourney, updateJourney, deleteJourney, toggleJourneyState } from '@/app/portal/[organizationSlug]/audience/journeys/actions';

export interface JourneyView {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'DRAFT' | 'PAUSED';
  milestones: string[];
}

interface JourneysDashboardProps {
  journeys: JourneyView[];
  organizationSlug: string;
  onToggleJourney?: (id: string, activate: boolean) => Promise<void>;
}

export function JourneysDashboard({ journeys, organizationSlug, onToggleJourney }: JourneysDashboardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(journeys[0]?.id || null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Modals state
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMilestones, setFormMilestones] = useState<string[]>(['']);

  const activeJourney = journeys.find(j => j.id === selectedId) || journeys[0];

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormName('');
    setFormDescription('');
    setFormMilestones(['Identificar necesidades del prospecto', 'Presentar propuesta de valor']);
    setIsCreating(true);
  };

  // Open Settings/Edit Modal
  const handleOpenSettings = () => {
    if (!activeJourney) return;
    setFormName(activeJourney.name);
    setFormDescription(activeJourney.description || '');
    setFormMilestones(activeJourney.milestones.length > 0 ? [...activeJourney.milestones] : ['']);
    setIsEditingSettings(true);
  };

  // Add / Remove / Edit Milestone in Form
  const handleAddMilestone = () => {
    setFormMilestones(prev => [...prev, '']);
  };

  const handleRemoveMilestone = (index: number) => {
    setFormMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index: number, val: string) => {
    setFormMilestones(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('El nombre del journey es obligatorio');
      return;
    }
    const cleanMilestones = formMilestones.filter(m => m.trim().length > 0);
    if (cleanMilestones.length === 0) {
      toast.error('Agrega al menos un hito (milestone)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createJourney(organizationSlug, {
        name: formName,
        description: formDescription,
        milestones: cleanMilestones,
      });
      if (res.success) {
        toast.success('Journey creado exitosamente');
        setIsCreating(false);
        if (res.journeyId) setSelectedId(res.journeyId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al crear journey');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Update
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJourney || !formName.trim()) {
      toast.error('El nombre del journey es obligatorio');
      return;
    }
    const cleanMilestones = formMilestones.filter(m => m.trim().length > 0);
    if (cleanMilestones.length === 0) {
      toast.error('Agrega al menos un hito (milestone)');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateJourney(organizationSlug, activeJourney.id, {
        name: formName,
        description: formDescription,
        milestones: cleanMilestones,
      });
      toast.success('Journey actualizado exitosamente');
      setIsEditingSettings(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar journey');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete
  const handleDeleteSubmit = async () => {
    if (!activeJourney) return;
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar el journey "${activeJourney.name}"?`);
    if (!confirmDelete) return;

    setIsSubmitting(true);
    try {
      await deleteJourney(organizationSlug, activeJourney.id);
      toast.success('Journey eliminado');
      setIsEditingSettings(false);
      const remaining = journeys.filter(j => j.id !== activeJourney.id);
      if (remaining.length > 0 && remaining[0]) setSelectedId(remaining[0].id);
      else setSelectedId(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar journey');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggle = async (journeyId: string, activate: boolean) => {
    setTogglingId(journeyId);
    try {
      if (onToggleJourney) {
        await onToggleJourney(journeyId, activate);
      } else {
        await toggleJourneyState(organizationSlug, journeyId, activate);
      }
      toast.success(activate ? 'Journey activado' : 'Journey pausado');
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar estado');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 sm:gap-8">
      
      {/* Sidebar: List of Journeys */}
      <div className="lg:w-80 shrink-0 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <GitBranch className="w-7 h-7 text-indigo-400" />
            Agent Journeys
          </h1>
          <p className="text-white/50 mt-2 text-xs leading-relaxed">
            Autonomous workflows. Define the strategic goals Hermes should pursue in conversations.
          </p>
        </div>

        <button 
          onClick={handleOpenCreate}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-900/20 min-h-[44px]"
        >
          <Plus size={16} />
          Create New Journey
        </button>

        <div className="space-y-2">
          {journeys.length === 0 ? (
            <div className="text-center p-6 bg-white/5 rounded-xl border border-white/5 text-white/40 text-sm">
              No journeys defined.
            </div>
          ) : (
            journeys.map(journey => (
              <button
                key={journey.id}
                onClick={() => setSelectedId(journey.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  (selectedId === journey.id || (!selectedId && journey.id === activeJourney?.id))
                    ? 'bg-indigo-600/10 border-indigo-500/40 shadow-sm' 
                    : 'bg-[#0C0C12] border-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-white text-sm line-clamp-1">{journey.name}</div>
                  <div className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                    journey.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    journey.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {journey.status}
                  </div>
                </div>
                <div className="text-xs text-white/40 mt-2 flex items-center gap-1.5">
                  <Goal size={12} />
                  {journey.milestones.length} Milestones
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main View: Journey Details */}
      <div className="flex-1 min-h-[500px]">
        {activeJourney ? (
          <div className="bg-[#0C0C12] border border-white/[0.06] rounded-2xl p-6 lg:p-10 h-full flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-white/10 pb-6 mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{activeJourney.name}</h2>
                  {activeJourney.description && (
                    <p className="text-xs text-white/50 mt-1">{activeJourney.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <div className={`text-xs font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                      activeJourney.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      'bg-white/5 text-white/50 border-white/10'
                    }`}>
                      {activeJourney.status}
                    </div>
                    <div className="text-sm text-white/40 flex items-center gap-2">
                      <LayoutGrid size={16} />
                      Goal Engine V2
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleOpenSettings}
                    title="Journey Settings"
                    className="p-2.5 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                  >
                    <Settings2 size={18} />
                  </button>

                  {activeJourney.status !== 'ACTIVE' ? (
                    <button 
                      onClick={() => handleToggle(activeJourney.id, true)}
                      disabled={togglingId === activeJourney.id}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-900/20"
                    >
                      <PlayCircle size={16} />
                      {togglingId === activeJourney.id ? 'Activando...' : 'Activate'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleToggle(activeJourney.id, false)}
                      disabled={togglingId === activeJourney.id}
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    >
                      <PauseCircle size={16} />
                      {togglingId === activeJourney.id ? 'Pausando...' : 'Pause Journey'}
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-medium text-white mb-6">Milestones (Goal Funnel)</h3>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-white/10 before:to-transparent mt-4">
                {activeJourney.milestones.map((milestone, idx) => (
                  <div key={idx} className="relative flex items-start gap-6 group">
                    
                    {/* Icon */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-[#0C0C12] bg-[#12121A] group-hover:bg-indigo-500/20 text-white/30 group-hover:text-indigo-400 transition-colors shrink-0 relative z-10">
                      <CheckCircle2 size={20} className={idx === 0 ? "text-indigo-400" : ""} />
                    </div>
                    
                    {/* Card */}
                    <div className="flex-1 p-5 rounded-2xl bg-[#12121A] border border-white/5 group-hover:border-indigo-500/30 transition-all shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase">
                          Step {idx + 1}
                        </div>
                      </div>
                      <div className="text-sm text-white/90 font-medium">
                        {milestone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center text-xs text-white/40">
              <span>Goal transitions are validated on each customer message turn.</span>
              <button 
                onClick={handleOpenSettings}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Configurar Pasos ➔
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#0C0C12] border border-white/[0.06] rounded-2xl p-12 text-center text-white/40 flex flex-col items-center justify-center h-full">
            <GitBranch size={40} className="mb-4 text-white/20" />
            <h3 className="text-white text-lg font-semibold mb-2">No Journey Selected</h3>
            <p className="text-xs max-w-sm mb-6">Selecciona un journey de la barra lateral o crea uno nuevo para tu asistente.</p>
            <button 
              onClick={handleOpenCreate}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold"
            >
              Crear Nuevo Journey
            </button>
          </div>
        )}
      </div>

      {/* ── MODAL: CREATE JOURNEY ── */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 lg:p-10 animate-in fade-in">
          <div className="bg-[#12121A] border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <GitBranch className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Create New Journey</h3>
              </div>
              <button 
                onClick={() => setIsCreating(false)}
                className="text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">Nombre del Journey</label>
                <input
                  type="text"
                  placeholder="Ej. Onboarding de Inversionistas VIP"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-[#0C0C12] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">Descripción (Opcional)</label>
                <input
                  type="text"
                  placeholder="Propósito estratégico del workflow..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full bg-[#0C0C12] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-neutral-300">Hitos del Funnel (Milestones)</label>
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Plus size={14} /> Añadir Paso
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {formMilestones.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-white/30 w-6 text-right">#{idx + 1}</span>
                      <input
                        type="text"
                        placeholder={`Paso ${idx + 1}...`}
                        value={m}
                        onChange={e => handleMilestoneChange(idx, e.target.value)}
                        className="flex-1 bg-[#0C0C12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      {formMilestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(idx)}
                          className="p-2 text-white/30 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs text-white/60 hover:text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-900/20"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Journey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SETTINGS & EDIT JOURNEY ── */}
      {isEditingSettings && activeJourney && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 lg:p-10 animate-in fade-in">
          <div className="bg-[#12121A] border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Journey Settings</h3>
              </div>
              <button 
                onClick={() => setIsEditingSettings(false)}
                className="text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">Nombre del Journey</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-[#0C0C12] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">Descripción</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full bg-[#0C0C12] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-neutral-300">Hitos del Funnel (Milestones)</label>
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Plus size={14} /> Añadir Paso
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {formMilestones.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-white/30 w-6 text-right">#{idx + 1}</span>
                      <input
                        type="text"
                        value={m}
                        onChange={e => handleMilestoneChange(idx, e.target.value)}
                        className="flex-1 bg-[#0C0C12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      {formMilestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(idx)}
                          className="p-2 text-white/30 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-rose-500/20 bg-rose-500/5 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-400">Eliminar Journey</h4>
                  <p className="text-[11px] text-rose-300/70">Esta acción borrará permanentemente este flujo y sus etapas.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-semibold transition-all"
                >
                  Eliminar
                </button>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(false)}
                  className="px-4 py-2 text-xs text-white/60 hover:text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-900/20"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
