'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, UserGroupIcon, PlusIcon, LinkIcon, ClipboardDocumentIcon, TrashIcon, ArrowTopRightOnSquareIcon, PencilIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { AvailabilityScheduler, defaultAvailability } from '@/components/shared/AvailabilityScheduler';
import type { AvailabilityConfig } from '@/components/shared/AvailabilityScheduler';

interface ProjectEvent {
    id: number;
    title: string;
    type: 'MACRO' | 'CALENDAR';
    date: string | null;
    location: string | null;
    config: { maxCapacity?: number };
    is_active: boolean;
}

export function EventsTab({ project }: { project: any }) {
    const [isLoadingCal, setIsLoadingCal] = useState(false);
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [events, setEvents] = useState<ProjectEvent[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [showNewForm, setShowNewForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<number | null>(null);

    // Shortlink states
    const [shortlinkSlug, setShortlinkSlug] = useState('');
    const [creatingShortlinkFor, setCreatingShortlinkFor] = useState<number | string | null>(null);
    const [isCreatingShortlink, setIsCreatingShortlink] = useState(false);
    const [projectShortlinks, setProjectShortlinks] = useState<any[]>([]);

    useEffect(() => {
        // Fetch existing shortlinks
        fetch('/api/admin/shortlinks')
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    const filtered = data.data.filter((sl: any) => sl.destinationUrl.includes(`events/${project.slug}/`));
                    setProjectShortlinks(filtered);
                }
            })
            .catch(console.error);
    }, [project.slug]);

    const handleDeleteShortlink = async (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar este shortlink?')) return;
        try {
            const res = await fetch('/api/admin/shortlinks', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al eliminar');
            
            setProjectShortlinks(prev => prev.filter(sl => sl.id !== id));
            toast.success('Shortlink eliminado');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleCreateShortlink = async (id: number | string, destinationUrl: string, title: string) => {
        if (!shortlinkSlug) return toast.error('Ingresa un slug válido');
        setIsCreatingShortlink(true);
        try {
            const cleanSlug = shortlinkSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
            const res = await fetch('/api/admin/shortlinks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        slug: cleanSlug,
                        destinationUrl,
                        title: `Shortlink para ${title}`,
                        description: '',
                        landingConfig: { isMasked: true }
                    })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al crear');
            
            toast.success(`Shortlink creado: pbox.dev/${cleanSlug}`);
            setProjectShortlinks(prev => [{ slug: cleanSlug, destinationUrl, title: `Shortlink para ${title}` }, ...prev]);
            setCreatingShortlinkFor(null);
            setShortlinkSlug('');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsCreatingShortlink(false);
        }
    };

    const [calendarConfig, setCalendarConfig] = useState(
        (project.extraConfig as any)?.sovereignCalendar || {
            isActive: true,
            calendarUrl: ''
        }
    );

    const [newEvent, setNewEvent] = useState({
        title: '',
        type: 'MACRO' as 'MACRO' | 'CALENDAR',
        date: '',
        time: '',
        location: '',
        maxCapacity: 20,
        durationMinutes: 45,
        bufferMinutes: 15,
        minAdvanceHours: 24,
        maxDaysInFuture: 14,
        mapsLink: '',
        meetingType: 'PHYSICAL' as 'PHYSICAL' | 'VIRTUAL' | 'CHOICE',
        availability: defaultAvailability as AvailabilityConfig
    });

    // Load existing events
    useEffect(() => {
        fetch(`/api/v1/projects/${project.id}/events`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setEvents(data);
            })
            .catch(() => {})
            .finally(() => setIsLoadingEvents(false));
    }, [project.id]);

    const handleSaveCalendar = async () => {
        setIsLoadingCal(true);
        try {
            const res = await fetch(`/api/v1/projects/${project.id}/admin/config`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sovereignCalendar: calendarConfig })
            });
            if (!res.ok) throw new Error();
            toast.success('Calendario Soberano guardado ✓');
        } catch {
            toast.error('Error al guardar el Calendario');
        } finally {
            setIsLoadingCal(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!newEvent.title) {
            toast.error('El título es obligatorio');
            return;
        }
        if (newEvent.type === 'MACRO' && !newEvent.date) {
            toast.error('La fecha es obligatoria para un Macro Evento');
            return;
        }
        try {
            setIsCreatingEvent(true);
            const dateTime = newEvent.date && newEvent.time ? `${newEvent.date}T${newEvent.time}:00` : null;
            
            const payload = {
                title: newEvent.title,
                type: newEvent.type,
                date: dateTime,
                location: newEvent.location,
                config: { 
                    maxCapacity: newEvent.maxCapacity,
                    mapsLink: newEvent.mapsLink || undefined,
                    meetingType: newEvent.type === 'CALENDAR' ? newEvent.meetingType : undefined,
                    durationMinutes: newEvent.type === 'CALENDAR' ? newEvent.durationMinutes : undefined,
                    bufferMinutes: newEvent.type === 'CALENDAR' ? newEvent.bufferMinutes : undefined,
                    minAdvanceHours: newEvent.type === 'CALENDAR' ? newEvent.minAdvanceHours : undefined,
                    maxDaysInFuture: newEvent.type === 'CALENDAR' ? newEvent.maxDaysInFuture : undefined,
                    availability: newEvent.type === 'CALENDAR' ? newEvent.availability : undefined
                }
            };

            const url = editingEvent 
                ? `/api/v1/projects/${project.id}/events/${editingEvent}`
                : `/api/v1/projects/${project.id}/events`;

            const method = editingEvent ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error();
            const savedEvent = await res.json();
            
            if (editingEvent) {
                setEvents(prev => prev.map(e => e.id === savedEvent.id ? { ...savedEvent, registrations: (e as any).registrations } : e));
            } else {
                setEvents(prev => [savedEvent, ...prev]);
            }
            
            setNewEvent({ title: '', type: 'MACRO', date: '', time: '', location: '', maxCapacity: 20, durationMinutes: 45, bufferMinutes: 15, minAdvanceHours: 24, maxDaysInFuture: 14, mapsLink: '', meetingType: 'PHYSICAL', availability: defaultAvailability as AvailabilityConfig });
            setShowNewForm(false);
            setEditingEvent(null);
            toast.success('Evento guardado ✓');
        } catch (e) {
            console.error('Error saving event:', e);
            toast.error('Error al guardar evento');
        } finally {
            setIsCreatingEvent(false);
        }
    };

    const startEditEvent = (event: any) => {
        let dateStr = '';
        let timeStr = '';
        if (event.date) {
            const dateObj = new Date(event.date);
            dateStr = dateObj.toISOString().split('T')[0] || '';
            timeStr = dateObj.toTimeString().slice(0,5);
        }
        
        const config = event.config || {};
        
        setNewEvent({
            title: event.title,
            type: event.type,
            date: dateStr,
            time: timeStr,
            location: event.location || '',
            maxCapacity: config.maxCapacity || 20,
            durationMinutes: config.durationMinutes || 45,
            bufferMinutes: config.bufferMinutes || 0,
            minAdvanceHours: config.minAdvanceHours ?? 24,
            maxDaysInFuture: config.maxDaysInFuture ?? 14,
            mapsLink: config.mapsLink || '',
            meetingType: config.meetingType || 'PHYSICAL',
            availability: config.availability || defaultAvailability
        });
        
        setEditingEvent(event.id);
        setShowNewForm(true);
    };

    const copyEventLink = (eventId: number) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dash.pandoras.finance';
        const url = `${origin}/events/${project.slug}/${eventId}`;
        navigator.clipboard.writeText(url);
        toast.success('Enlace copiado ✓');
    };

    const formatDate = (d: string | null) => {
        if (!d) return 'Sin fecha';
        return new Intl.DateTimeFormat('es-MX', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric'
        }).format(new Date(d));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 w-full"
        >
            {/* ── CALENDARIO SOBERANO ── */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#D4A853]/10 rounded-lg">
                        <CalendarIcon className="w-5 h-5 text-[#D4A853]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Calendario Soberano</h3>
                        <p className="text-zinc-400 text-sm">Enlace de reuniones 1:1 que se inyecta en tu Hub y Widget.</p>
                    </div>
                </div>

                <div className="space-y-4 mt-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={calendarConfig.isActive}
                            onChange={(e) => setCalendarConfig({ ...calendarConfig, isActive: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4A853]" />
                        <span className="ml-3 text-sm font-medium">Activar Calendario Público</span>
                    </label>

                    {calendarConfig.isActive && (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">URL del Calendario</label>
                            <input
                                type="url"
                                value={calendarConfig.calendarUrl}
                                onChange={(e) => setCalendarConfig({ ...calendarConfig, calendarUrl: e.target.value })}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                placeholder="https://cal.pandoras.finance/snarai o calendly.com/..."
                            />
                            <p className="text-xs text-zinc-500 mt-2">
                                Este enlace se muestra en tu Hub de Recursos y se puede embeber en el Widget.
                            </p>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end border-t border-white/5">
                        <button
                            onClick={handleSaveCalendar}
                            disabled={isLoadingCal}
                            className="px-6 py-2.5 bg-[#D4A853] text-black text-sm font-bold rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50"
                        >
                            {isLoadingCal ? 'Guardando...' : 'Guardar Calendario'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── MACRO EVENTOS ── */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <UserGroupIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Macro Eventos</h3>
                            <p className="text-zinc-400 text-sm">Crea páginas de invitación privadas y gestiona asistentes.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowNewForm(v => !v)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-bold rounded-xl hover:bg-blue-500/20 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Crear Evento
                    </button>
                </div>

                {/* NEW OR EDIT EVENT FORM */}
                {(showNewForm || editingEvent) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 p-5 bg-black/50 border border-blue-500/20 rounded-xl space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-blue-400">
                                {editingEvent ? 'Editar Horarios de Evento' : 'Nuevo Evento'}
                            </h4>
                            {!editingEvent && (
                                <div className="flex bg-black rounded-lg p-1 border border-white/10">
                                    <button
                                        onClick={() => setNewEvent({ ...newEvent, type: 'MACRO' })}
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${newEvent.type === 'MACRO' ? 'bg-blue-500 text-white' : 'text-zinc-500 hover:text-white'}`}
                                    >
                                        Macro Evento
                                    </button>
                                    <button
                                        onClick={() => setNewEvent({ ...newEvent, type: 'CALENDAR' })}
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${newEvent.type === 'CALENDAR' ? 'bg-blue-500 text-white' : 'text-zinc-500 hover:text-white'}`}
                                    >
                                        Calendario Soberano
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Título del Evento *</label>
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                    placeholder="Ej. Private Briefing — S'Narai"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Ubicación Física</label>
                                <input
                                    type="text"
                                    value={newEvent.location}
                                    onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                    placeholder="Ej. 626 Café · Bucerías, Nayarit"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs text-zinc-500 mb-1">Enlace de Google Maps (Opcional)</label>
                                <input
                                    type="url"
                                    value={newEvent.mapsLink}
                                    onChange={e => setNewEvent({ ...newEvent, mapsLink: e.target.value })}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                    placeholder="https://maps.app.goo.gl/..."
                                />
                            </div>
                            {newEvent.type === 'MACRO' && (
                                <>
                                    <div>
                                        <label className="block text-xs text-zinc-500 mb-1">Fecha *</label>
                                        <input
                                            type="date"
                                            value={newEvent.date}
                                            onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                            className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-500 mb-1">Hora</label>
                                        <input
                                            type="time"
                                            value={newEvent.time}
                                            onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                                            className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                        />
                                    </div>
                                </>
                            )}
                            {newEvent.type === 'CALENDAR' && (
                                <>
                                    <div>
                                        <label className="block text-xs text-zinc-500 mb-1">Opciones de Reunión</label>
                                        <select
                                            value={newEvent.meetingType}
                                            onChange={e => setNewEvent({ ...newEvent, meetingType: e.target.value as any })}
                                            className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none appearance-none"
                                        >
                                            <option value="PHYSICAL">Solo Presencial</option>
                                            <option value="VIRTUAL">Solo Virtual (Jitsi automático)</option>
                                            <option value="CHOICE">A elección del usuario</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-500 mb-1">Duración (minutos)</label>
                                        <input
                                            type="number"
                                            min={15}
                                            step={5}
                                            value={newEvent.durationMinutes}
                                            onChange={e => setNewEvent({ ...newEvent, durationMinutes: Number(e.target.value) })}
                                            className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-500 mb-1">Espacio entre citas (minutos)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={5}
                                            value={newEvent.bufferMinutes}
                                            onChange={e => setNewEvent({ ...newEvent, bufferMinutes: Number(e.target.value) })}
                                            className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-500 mb-1">Anticipación Mínima (horas)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={newEvent.minAdvanceHours}
                                            onChange={e => setNewEvent({ ...newEvent, minAdvanceHours: Number(e.target.value) })}
                                            className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                            placeholder="Ej. 24"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs text-zinc-500 mb-1">Límite de la campaña (Días al futuro)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            step={1}
                                            value={newEvent.maxDaysInFuture}
                                            onChange={e => setNewEvent({ ...newEvent, maxDaysInFuture: Number(e.target.value) })}
                                            className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                            placeholder="Ej. 14 (equivale a 2 semanas)"
                                        />
                                    </div>
                                    <div className="md:col-span-2 pt-2 border-t border-white/10">
                                        <label className="block text-xs text-zinc-500 mb-2">Disponibilidad (Días y Horarios)</label>
                                        <AvailabilityScheduler 
                                            config={newEvent.availability} 
                                            onChange={newConfig => setNewEvent({ ...newEvent, availability: newConfig })} 
                                        />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">{newEvent.type === 'MACRO' ? 'Cupo Máximo' : 'Cupo Máximo por Horario'}</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={newEvent.maxCapacity}
                                    onChange={e => setNewEvent({ ...newEvent, maxCapacity: Number(e.target.value) })}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleCreateEvent}
                                disabled={isCreatingEvent}
                                className="px-6 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-400 transition-colors disabled:opacity-50"
                            >
                                {isCreatingEvent ? 'Creando...' : 'Crear y Obtener Enlace'}
                            </button>
                            <button
                                onClick={() => setShowNewForm(false)}
                                className="px-6 py-2.5 bg-zinc-800 text-zinc-400 text-sm font-bold rounded-xl hover:bg-zinc-700 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                )}

                {isLoadingEvents ? (
                    <div className="text-zinc-500 text-sm text-center py-8">Cargando eventos...</div>
                ) : events.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                        <UserGroupIcon className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm">No hay eventos creados aún.</p>
                        <p className="text-zinc-600 text-xs mt-1">Haz clic en "Crear Evento" para generar tu primera página de invitación.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {events.map(event => {
                            const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dash.pandoras.finance';
                            const eventUrl = `${origin}/events/${project.slug}/${event.id}`;
                            const regs = (event as any).registrations || [];
                            return (
                                <div key={event.id} className="flex flex-col p-4 bg-black/30 border border-white/5 rounded-xl gap-3">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm truncate flex items-center gap-2">
                                                {event.title}
                                                <span className={`text-[0.65rem] px-1.5 py-0.5 rounded font-bold ${event.type === 'CALENDAR' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {event.type}
                                                </span>
                                            </div>
                                            {event.type === 'MACRO' ? (
                                                <div className="text-xs text-zinc-500 mt-0.5">{formatDate(event.date)}</div>
                                            ) : (
                                                <div className="text-xs text-zinc-500 mt-0.5">Calendario Interactivo</div>
                                            )}
                                            {event.location && (
                                                <div className="text-xs text-zinc-600 mt-0.5">📍 {event.location}</div>
                                            )}
                                            {event.type === 'MACRO' && (
                                                <div className="text-xs font-semibold text-[#D4A853] mt-1">
                                                    Asistencias Confirmadas: {regs.length} {((event.config as any) || {}).maxCapacity ? `/ ${((event.config as any) || {}).maxCapacity}` : ''}
                                                </div>
                                            )}
                                            <div className="mt-1.5 flex flex-col gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <code className="text-xs text-[#D4A853] bg-[#D4A853]/5 px-2 py-0.5 rounded truncate max-w-xs">
                                                        {eventUrl}
                                                    </code>
                                                    <button 
                                                        onClick={() => setCreatingShortlinkFor(creatingShortlinkFor === event.id ? null : event.id)} 
                                                        className="text-[0.65rem] text-lime-400 bg-lime-400/10 hover:bg-lime-400/20 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1"
                                                    >
                                                        🪄 Shortlink
                                                    </button>
                                                </div>
                                                {creatingShortlinkFor === event.id && (
                                                    <div className="flex items-center gap-2 mt-1 p-2 bg-black/40 border border-lime-400/20 rounded-lg animate-[fadeIn_0.2s_ease-out]">
                                                        <span className="text-xs text-zinc-500 font-mono">pbox.dev/</span>
                                                        <input 
                                                            value={shortlinkSlug}
                                                            onChange={e => setShortlinkSlug(e.target.value)}
                                                            placeholder="mi-enlace" 
                                                            className="bg-transparent border-b border-lime-400/30 text-sm text-lime-100 placeholder-zinc-600 focus:outline-none focus:border-lime-400 px-1 w-24 sm:w-32"
                                                        />
                                                        <button 
                                                            onClick={() => handleCreateShortlink(event.id, eventUrl, `[${project.title || project.slug}] ${event.title}`)}
                                                            disabled={isCreatingShortlink}
                                                            className="ml-auto text-xs bg-lime-400 text-black px-3 py-1 rounded font-bold hover:bg-lime-500 disabled:opacity-50"
                                                        >
                                                            {isCreatingShortlink ? '...' : 'Crear'}
                                                        </button>
                                                    </div>
                                                )}
                                                {projectShortlinks.filter(sl => sl.destinationUrl.endsWith(`events/${project.slug}/${event.id}`)).length > 0 && (
                                                    <div className="mt-3 space-y-1">
                                                        <p className="text-[10px] uppercase text-zinc-500 font-bold mb-2">Enlaces Creados:</p>
                                                        {projectShortlinks.filter(sl => sl.destinationUrl.endsWith(`events/${project.slug}/${event.id}`)).map((sl: any) => (
                                                            <div key={sl.slug} className="flex justify-between items-center text-xs bg-black/40 p-2 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                                                <span className="text-lime-400 font-mono tracking-wide">pbox.dev/{sl.slug}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <button 
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(`https://pbox.dev/${sl.slug}`);
                                                                            toast.success('Enlace copiado al portapapeles');
                                                                        }} 
                                                                        className="text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                                                    >
                                                                        <ClipboardDocumentIcon className="w-3 h-3" /> Copiar
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteShortlink(sl.id)}
                                                                        className="text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/40 px-2 py-1 rounded transition-colors"
                                                                        title="Eliminar enlace"
                                                                    >
                                                                        Eliminar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => startEditEvent(event)}
                                                    title="Editar evento"
                                                    className="p-2 text-zinc-400 hover:text-white border border-white/10 rounded-lg transition-colors"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => copyEventLink(event.id)}
                                                    title="Copiar enlace"
                                                    className="p-2 text-zinc-400 hover:text-[#D4A853] border border-white/10 rounded-lg transition-colors"
                                                >
                                                    <ClipboardDocumentIcon className="w-4 h-4" />
                                                </button>
                                                <a
                                                    href={eventUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Abrir página del evento"
                                                    className="p-2 text-zinc-400 hover:text-blue-400 border border-white/10 rounded-lg transition-colors"
                                                >
                                                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                                </a>
                                            </div>
                                            <div className="text-xs font-bold text-zinc-400 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                                                {regs.length} Asistencia{regs.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Lista de Registros */}
                                    {regs.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Asistentes Confirmados</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {regs.map((r: any) => (
                                                    <div key={r.id} className="bg-zinc-900/50 rounded-lg p-3 text-xs border border-white/5">
                                                        <div className="font-bold text-white mb-1">{r.nombre}</div>
                                                        <div className="text-zinc-400">{r.email}</div>
                                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                                                            <span className="text-zinc-500">{r.telefono || 'Sin tel.'}</span>
                                                            <span className="bg-[#D4A853]/20 text-[#D4A853] px-2 py-0.5 rounded uppercase text-[0.6rem] font-bold">
                                                                {r.perfil || 'Invitado'}
                                                            </span>
                                                        </div>
                                                        {r.selectedDateTime && (
                                                            <div className="text-[0.65rem] text-blue-400 mt-1">
                                                                📅 {new Date(r.selectedDateTime).toLocaleString('es-MX')}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
