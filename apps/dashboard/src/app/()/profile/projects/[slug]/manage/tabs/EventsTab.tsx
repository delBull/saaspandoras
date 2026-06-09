'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, UserGroupIcon, PlusIcon, LinkIcon, ClipboardDocumentIcon, TrashIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface ProjectEvent {
    id: number;
    title: string;
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

    const [calendarConfig, setCalendarConfig] = useState(
        (project.extraConfig as any)?.sovereignCalendar || {
            isActive: true,
            calendarUrl: ''
        }
    );

    const [newEvent, setNewEvent] = useState({
        title: '',
        date: '',
        time: '',
        location: '',
        maxCapacity: 20,
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
        if (!newEvent.title || !newEvent.date) {
            toast.error('El título y la fecha son obligatorios');
            return;
        }
        setIsCreatingEvent(true);
        try {
            const dateTime = newEvent.time
                ? `${newEvent.date}T${newEvent.time}:00`
                : `${newEvent.date}T00:00:00`;

            const res = await fetch(`/api/v1/projects/${project.id}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newEvent.title,
                    date: dateTime,
                    location: newEvent.location,
                    config: { maxCapacity: newEvent.maxCapacity },
                })
            });

            if (!res.ok) throw new Error();
            const created = await res.json();
            setEvents(prev => [created, ...prev]);
            setNewEvent({ title: '', date: '', time: '', location: '', maxCapacity: 20 });
            setShowNewForm(false);
            toast.success('Evento creado ✓');
        } catch {
            toast.error('Error al crear el evento');
        } finally {
            setIsCreatingEvent(false);
        }
    };

    const copyEventLink = (eventId: number) => {
        const url = `https://dash.pandoras.finance/events/${project.slug}/${eventId}`;
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
            className="space-y-6 max-w-4xl"
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

                {/* NEW EVENT FORM */}
                {showNewForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 p-5 bg-black/50 border border-blue-500/20 rounded-xl space-y-4"
                    >
                        <h4 className="text-sm font-bold uppercase tracking-widest text-blue-400">Nuevo Evento</h4>

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
                                <label className="block text-xs text-zinc-500 mb-1">Ubicación</label>
                                <input
                                    type="text"
                                    value={newEvent.location}
                                    onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:border-[#D4A853] focus:outline-none"
                                    placeholder="626 Café · Bucerías, Nayarit"
                                />
                            </div>
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
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Cupo Máximo</label>
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

                {/* EVENT LIST */}
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
                            const eventUrl = `https://dash.pandoras.finance/events/${project.slug}/${event.id}`;
                            return (
                                <div key={event.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-black/30 border border-white/5 rounded-xl gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm truncate">{event.title}</div>
                                        <div className="text-xs text-zinc-500 mt-0.5">{formatDate(event.date)}</div>
                                        {event.location && (
                                            <div className="text-xs text-zinc-600 mt-0.5">📍 {event.location}</div>
                                        )}
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                            <code className="text-xs text-[#D4A853] bg-[#D4A853]/5 px-2 py-0.5 rounded truncate max-w-xs">
                                                {eventUrl}
                                            </code>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
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
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
