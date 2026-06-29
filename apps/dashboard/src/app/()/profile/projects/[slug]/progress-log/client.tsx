'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getProgressLogs, addProgressLog, deleteProgressLog, type ProgressLogEntry } from '@/actions/progress-log';

interface Props {
    project: any;
}

export function ProgressLogClient({ project }: Props) {
    const [logs, setLogs] = useState<ProgressLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [weekNumber, setWeekNumber] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [highlightsStr, setHighlightsStr] = useState('');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        const data = await getProgressLogs(Number(project.id));
        setLogs(data);
        setLoading(false);
    }, [project.id]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    useEffect(() => {
        if (!loading && logs.length === 0) {
            const timer = setTimeout(async () => {
                const result = await addProgressLog(Number(project.id), {
                    weekNumber: 0,
                    title: 'Bienvenido a tu Progress Log',
                    content: 'Este es el inicio oficial del registro de avances de tu proyecto. A partir de aquí, cada semana documentaremos el progreso real: hitos cumplidos, reuniones clave, métricas de tracción y decisiones estratégicas. Usa este espacio para mantener la narrativa institucional viva.',
                    highlights: ['Progress Log activado', 'Seguimiento semanal', 'Trazabilidad institucional'],
                });
                if (result.success) {
                    setLogs([result.entry!]);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, logs.length, project.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !weekNumber) return;
        setSubmitting(true);
        const highlights = highlightsStr.split(',').map(s => s.trim()).filter(Boolean);
        const result = await addProgressLog(Number(project.id), {
            weekNumber: Number(weekNumber),
            title: title.trim(),
            content: content.trim(),
            highlights,
        });
        if (result.success) {
            setLogs(prev => [result.entry!, ...prev]);
            setShowForm(false);
            setWeekNumber('');
            setTitle('');
            setContent('');
            setHighlightsStr('');
        }
        setSubmitting(false);
    };

    const handleDelete = async (entryId: string) => {
        if (!confirm('¿Eliminar esta entrada?')) return;
        await deleteProgressLog(Number(project.id), entryId);
        setLogs(prev => prev.filter(l => l.id !== entryId));
    };

    return (
        <div className="w-full space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/profile/projects/${project.slug}/manage`} className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5 text-zinc-400" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Progress Log</h1>
                    <p className="text-zinc-500 text-sm font-medium">{project.title}</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-lg text-sm transition-all"
                >
                    <PlusIcon className="w-4 h-4" />
                    Nueva Semana
                </button>
            </div>

            {/* Add Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-zinc-900 rounded-xl border border-zinc-800"
                    >
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Semana #</label>
                                    <input
                                        type="number"
                                        value={weekNumber}
                                        onChange={(e) => setWeekNumber(e.target.value)}
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white font-mono focus:border-emerald-500 outline-none transition-colors"
                                        placeholder="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Título</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition-colors"
                                        placeholder="Semana 1: Portal terminado. Mainnet"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Contenido / Notas</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={4}
                                    className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none transition-colors resize-none"
                                    placeholder="Describe el progreso de esta semana..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Highlights (separados por coma)</label>
                                <input
                                    type="text"
                                    value={highlightsStr}
                                    onChange={(e) => setHighlightsStr(e.target.value)}
                                    className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none transition-colors"
                                    placeholder="Primer evento, 10 leads, Portal deployado"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !title.trim() || !weekNumber}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-bold rounded-lg text-sm transition-all"
                                >
                                    {submitting ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Log Entries */}
            {loading ? (
                <div className="py-20 text-center text-zinc-500 animate-pulse">Cargando Progress Log...</div>
            ) : logs.length === 0 ? (
                <div className="p-12 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500">
                    <p className="text-lg font-bold mb-2">Aún no hay entradas</p>
                    <p className="text-sm">Agrega tu primera semana de progreso para empezar a documentar el avance de {project.title}.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {logs.map((entry) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 hover:border-zinc-700 transition-colors group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Semana {entry.weekNumber}</span>
                                    <span className="text-xs text-zinc-600">{new Date(entry.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="p-1.5 bg-zinc-800 hover:bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <TrashIcon className="w-4 h-4 text-zinc-500 hover:text-red-400" />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{entry.title}</h3>
                            {entry.content && (
                                <p className="text-sm text-zinc-400 mb-3 whitespace-pre-wrap">{entry.content}</p>
                            )}
                            {entry.highlights.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {entry.highlights.map((h, i) => (
                                        <span key={i} className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{h}</span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
