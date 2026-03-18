'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    BookOpen, Plus, Pencil, Trash2, RefreshCw, Check, X,
    Zap, Coins, Users, BarChart3, Database, Eye, EyeOff, GripVertical,
    ChevronDown, ChevronUp, Tag, HelpCircle
} from 'lucide-react';

interface CourseModule {
    id: string;
    title: string;
    type: 'video' | 'article' | 'quiz';
    duration?: string;
    passing_score?: number;
}

interface AdminCourse {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: string;
    imageUrl?: string | null;
    xpReward: number;
    creditsReward: number;
    isActive: boolean;
    orderIndex: number;
    prerequisites: string[];
    modules: CourseModule[];
    skillsCovered: string[];
    instructor: string;
    enrolledCount: number;
    completionRate: number;
    totalEnrollments?: number;
    completedEnrollments?: number;
    createdAt: string;
    updatedAt: string;
}

const EMPTY_FORM: {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: string;
    imageUrl: string;
    xpReward: number;
    creditsReward: number;
    isActive: boolean;
    orderIndex: number;
    instructor: string;
    prerequisites: string;
    skillsCovered: string;
    modules: string;
} = {
    id: '',
    title: '',
    description: '',
    category: 'DeFi',
    difficulty: 'beginner' as const,
    duration: '2 horas',
    imageUrl: '',
    xpReward: 100,
    creditsReward: 10,
    isActive: true,
    orderIndex: 0,
    instructor: "Pandora's Team",
    prerequisites: '',
    skillsCovered: '',
    modules: '[]',
};

const DIFF_COLORS: Record<string, string> = {
    beginner: 'text-green-400 bg-green-400/10 border-green-500/30',
    intermediate: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30',
    advanced: 'text-red-400 bg-red-400/10 border-red-500/30',
};

const CATEGORIES = ['DeFi', 'NFTs', 'Security', 'DAO', 'Trading', 'Web3', 'Blockchain', 'General'];

export function CoursesAdminPanel() {
    const [courses, setCourses] = useState<AdminCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [showModuleHelp, setShowModuleHelp] = useState(false);

    const [form, setForm] = useState({ ...EMPTY_FORM });

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/courses');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setCourses(data.courses ?? []);
        } catch {
            toast.error('Error al cargar cursos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const res = await fetch('/api/admin/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'seed' }),
            });
            const data = await res.json();
            if (res.ok) {
                const created = data.results.filter((r: any) => r.action === 'created').length;
                const skipped = data.results.filter((r: any) => r.action === 'skipped').length;
                toast.success(`Seed completado: ${created} creados, ${skipped} existentes`);
                fetchCourses();
            } else {
                toast.error(data.error || 'Error en seed');
            }
        } catch {
            toast.error('Error de red');
        } finally {
            setSeeding(false);
        }
    };

    const startCreate = () => {
        setForm({ ...EMPTY_FORM, orderIndex: courses.length });
        setEditingId(null);
        setCreating(true);
    };

    const startEdit = (course: AdminCourse) => {
        setForm({
            id: course.id,
            title: course.title,
            description: course.description,
            category: course.category,
            difficulty: course.difficulty,
            duration: course.duration,
            imageUrl: course.imageUrl ?? '',
            xpReward: course.xpReward,
            creditsReward: course.creditsReward,
            isActive: course.isActive,
            orderIndex: course.orderIndex,
            instructor: course.instructor,
            prerequisites: (course.prerequisites ?? []).join(', '),
            skillsCovered: (course.skillsCovered ?? []).join(', '),
            modules: JSON.stringify(course.modules ?? [], null, 2),
        });
        setEditingId(course.id);
        setCreating(true);
    };

    const handleSave = async () => {
        if (!form.id || !form.title || !form.description) {
            return toast.error('ID, título y descripción son requeridos');
        }
        setSaving(true);
        try {
            let parsedModules: CourseModule[] = [];
            try { parsedModules = JSON.parse(form.modules); } catch { /* empty */ }

            const payload = {
                id: form.id,
                title: form.title,
                description: form.description,
                category: form.category,
                difficulty: form.difficulty,
                duration: form.duration,
                imageUrl: form.imageUrl || null,
                xpReward: Number(form.xpReward),
                creditsReward: Number(form.creditsReward),
                isActive: form.isActive,
                orderIndex: Number(form.orderIndex),
                instructor: form.instructor,
                prerequisites: form.prerequisites.split(',').map(s => s.trim()).filter(Boolean),
                skillsCovered: form.skillsCovered.split(',').map(s => s.trim()).filter(Boolean),
                modules: parsedModules,
            };

            const res = await fetch('/api/admin/courses', {
                method: editingId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(editingId ? 'Curso actualizado ✅' : 'Curso creado ✅');
                setCreating(false);
                setEditingId(null);
                fetchCourses();
            } else {
                toast.error(data.error || 'Error al guardar');
            }
        } catch {
            toast.error('Error de red');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (course: AdminCourse) => {
        try {
            const res = await fetch('/api/admin/courses', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: course.id, isActive: !course.isActive }),
            });
            if (res.ok) {
                toast.success(course.isActive ? 'Curso desactivado' : 'Curso activado');
                fetchCourses();
            }
        } catch {
            toast.error('Error al cambiar estado');
        }
    };

    const handleDelete = async (courseId: string) => {
        if (!confirm(`¿Desactivar el curso "${courseId}"?`)) return;
        const res = await fetch(`/api/admin/courses?id=${courseId}`, { method: 'DELETE' });
        if (res.ok) {
            toast.success('Curso desactivado');
            fetchCourses();
        } else {
            toast.error('Error al desactivar');
        }
    };

    // Summary stats
    const totalActive = courses.filter(c => c.isActive).length;
    const totalEnrollments = courses.reduce((s, c) => s + (c.totalEnrollments ?? c.enrolledCount ?? 0), 0);
    const totalCompletions = courses.reduce((s, c) => s + (c.completedEnrollments ?? 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Course Manager</h3>
                        <p className="text-xs text-gray-400">Gestiona el catálogo de cursos educativos de la plataforma</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSeed}
                        disabled={seeding}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Database className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
                        Seed Inicial
                    </button>
                    <button
                        onClick={fetchCourses}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-700/60 border border-zinc-600/40 text-gray-300 hover:bg-zinc-600/60 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={startCreate}
                        className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors shadow-lg shadow-cyan-900/20"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Nuevo Curso
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Cursos', value: courses.length, icon: BookOpen, color: 'text-cyan-400' },
                    { label: 'Activos', value: totalActive, icon: Check, color: 'text-green-400' },
                    { label: 'Inscripciones', value: totalEnrollments, icon: Users, color: 'text-blue-400' },
                    { label: 'Completados', value: totalCompletions, icon: BarChart3, color: 'text-purple-400' },
                ].map(s => (
                    <div key={s.label} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{s.label}</span>
                        </div>
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Form */}
            {creating && (
                <div className="bg-zinc-900/80 border border-cyan-500/30 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-white">{editingId ? 'Editar Curso' : 'Crear Nuevo Curso'}</h4>
                        <button onClick={() => { setCreating(false); setEditingId(null); }} className="text-gray-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {/* ID */}
                        <div className="space-y-1">
                            <label htmlFor="course-id" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">ID (slug) *</label>
                            <input
                                id="course-id"
                                type="text"
                                placeholder="defi-basics"
                                disabled={!!editingId}
                                value={form.id}
                                onChange={e => setForm({ ...form, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500 disabled:opacity-40 font-mono"
                            />
                        </div>
                        {/* Title */}
                        <div className="space-y-1">
                            <label htmlFor="course-title" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Título *</label>
                            <input
                                id="course-title"
                                type="text"
                                placeholder="Fundamentos de DeFi"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500"
                            />
                        </div>
                        {/* Description */}
                        <div className="space-y-1 md:col-span-2">
                            <label htmlFor="course-desc" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Descripción *</label>
                            <textarea
                                id="course-desc"
                                placeholder="Aprende los conceptos básicos de..."
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500 h-20 resize-none"
                            />
                        </div>
                        {/* Category */}
                        <div className="space-y-1">
                            <label htmlFor="course-category" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Categoría</label>
                            <select
                                id="course-category"
                                value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        {/* Difficulty */}
                        <div className="space-y-1">
                            <label htmlFor="course-difficulty" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Dificultad</label>
                            <select
                                id="course-difficulty"
                                value={form.difficulty}
                                onChange={e => setForm({ ...form, difficulty: e.target.value as any })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                        {/* Duration */}
                        <div className="space-y-1">
                            <label htmlFor="course-duration" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Duración</label>
                            <input
                                id="course-duration"
                                type="text"
                                placeholder="2 horas"
                                value={form.duration}
                                onChange={e => setForm({ ...form, duration: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500"
                            />
                        </div>
                        {/* Instructor */}
                        <div className="space-y-1">
                            <label htmlFor="course-instructor" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Instructor</label>
                            <input
                                id="course-instructor"
                                type="text"
                                placeholder="Pandora's Team"
                                value={form.instructor}
                                onChange={e => setForm({ ...form, instructor: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500"
                            />
                        </div>
                        {/* Image URL */}
                        <div className="space-y-1 md:col-span-2">
                            <label htmlFor="course-image" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Image URL (opcional)</label>
                            <input
                                id="course-image"
                                type="text"
                                placeholder="https://..."
                                value={form.imageUrl}
                                onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500"
                            />
                        </div>
                        {/* XP / Credits */}
                        <div className="grid grid-cols-2 gap-3 md:col-span-2">
                            <div className="space-y-1">
                                <label htmlFor="course-xp" className="text-xs text-orange-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> XP Reward
                                </label>
                                <input
                                    id="course-xp"
                                    type="number"
                                    value={form.xpReward}
                                    onChange={e => setForm({ ...form, xpReward: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="course-credits" className="text-xs text-green-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                                    <Coins className="w-3 h-3" /> Credits Reward
                                </label>
                                <input
                                    id="course-credits"
                                    type="number"
                                    value={form.creditsReward}
                                    onChange={e => setForm({ ...form, creditsReward: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-green-500"
                                />
                            </div>
                        </div>
                        {/* Skills */}
                        <div className="space-y-1">
                            <label htmlFor="course-skills" className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                                <Tag className="w-3 h-3" /> Skills (separados por coma)
                            </label>
                            <input
                                id="course-skills"
                                type="text"
                                placeholder="Lending, Borrowing, Yield Farming"
                                value={form.skillsCovered}
                                onChange={e => setForm({ ...form, skillsCovered: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500"
                            />
                        </div>
                        {/* Prerequisites */}
                        <div className="space-y-1">
                            <label htmlFor="course-prereqs" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Prerequisites (IDs separados por coma)</label>
                            <input
                                id="course-prereqs"
                                type="text"
                                placeholder="defi-basics, web3-security"
                                value={form.prerequisites}
                                onChange={e => setForm({ ...form, prerequisites: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="course-modules" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Módulos (JSON Array)</label>
                                <button 
                                    onClick={() => setShowModuleHelp(true)}
                                    className="text-[10px] text-cyan-500 hover:text-cyan-400 flex items-center gap-1 font-bold"
                                >
                                    <HelpCircle className="w-3 h-3" />
                                    Ver Formato
                                </button>
                            </div>
                            <textarea
                                id="course-modules"
                                placeholder='[{"id":"m1","title":"Intro","type":"video","duration":"15 min"}]'
                                value={form.modules}
                                onChange={e => setForm({ ...form, modules: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none focus:border-cyan-500 h-24 resize-none"
                            />
                        </div>
                        {/* Active toggle */}
                        <div className="flex items-center gap-3">
                            <label htmlFor="course-active-toggle" className="flex items-center gap-2 cursor-pointer">
                                <div
                                    id="course-active-toggle"
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Toggle active status"
                                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setForm({ ...form, isActive: !form.isActive }); } }}
                                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${form.isActive ? 'bg-cyan-600' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? 'left-5' : 'left-0.5'}`} />
                                </div>
                                <span className="text-sm text-gray-300">Activo</span>
                            </label>
                        </div>
                        {/* Order */}
                        <div className="space-y-1">
                            <label htmlFor="course-order" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Order Index</label>
                            <input
                                id="course-order"
                                type="number"
                                value={form.orderIndex}
                                onChange={e => setForm({ ...form, orderIndex: parseInt(e.target.value) || 0 })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-5">
                        <button
                            onClick={() => { setCreating(false); setEditingId(null); }}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {editingId ? 'Actualizar' : 'Publicar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Course List */}
            {loading ? (
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-zinc-800/50 rounded-xl" />
                    ))}
                </div>
            ) : courses.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-700/50 rounded-xl">
                    <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-semibold mb-1">No hay cursos</p>
                    <p className="text-gray-600 text-sm mb-4">Usa "Seed Inicial" para cargar los cursos base o crea uno nuevo</p>
                    <button onClick={handleSeed} disabled={seeding} className="px-4 py-2 text-sm font-bold bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg">
                        {seeding ? 'Seeding...' : '🌱 Cargar Seed'}
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {courses.map(course => (
                        <div
                            key={course.id}
                            className={`bg-zinc-900/50 border rounded-xl overflow-hidden transition-colors ${course.isActive ? 'border-zinc-800' : 'border-zinc-800/40 opacity-60'}`}
                        >
                            {/* Row */}
                            <div className="flex items-center gap-3 px-4 py-3">
                                <GripVertical className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-white text-sm truncate">{course.title}</span>
                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${DIFF_COLORS[course.difficulty] || ''}`}>
                                            {course.difficulty}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{course.category}</span>
                                        {!course.isActive && <span className="text-[9px] font-bold text-zinc-500 uppercase">INACTIVO</span>}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-[10px] text-gray-500">
                                        <span className="font-mono text-zinc-600">{course.id}</span>
                                        <span className="flex items-center gap-0.5">
                                            <Zap className="w-2.5 h-2.5 text-orange-400" />
                                            {course.xpReward} XP
                                        </span>
                                        <span className="flex items-center gap-0.5">
                                            <Coins className="w-2.5 h-2.5 text-green-400" />
                                            {course.creditsReward} CR
                                        </span>
                                        <span className="flex items-center gap-0.5">
                                            <Users className="w-2.5 h-2.5 text-blue-400" />
                                            {course.totalEnrollments ?? course.enrolledCount}
                                        </span>
                                        <span className="flex items-center gap-0.5">
                                            <BarChart3 className="w-2.5 h-2.5 text-purple-400" />
                                            {course.completionRate}% completado
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => toggleActive(course)}
                                        title={course.isActive ? 'Desactivar' : 'Activar'}
                                        className={`p-1.5 rounded-lg transition-colors ${course.isActive ? 'text-green-400 hover:bg-green-400/10' : 'text-zinc-500 hover:bg-zinc-700'}`}
                                    >
                                        {course.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        onClick={() => startEdit(course)}
                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(course.id)}
                                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setExpandedId(expandedId === course.id ? null : course.id)}
                                        className="p-1.5 text-gray-500 hover:text-white rounded-lg transition-colors"
                                    >
                                        {expandedId === course.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded detail */}
                            {expandedId === course.id && (
                                <div className="px-4 pb-4 pt-1 border-t border-zinc-800/60 space-y-3">
                                    <p className="text-xs text-gray-400">{course.description}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                        <div>
                                            <p className="text-gray-600 mb-0.5">Duración</p>
                                            <p className="text-gray-300">{course.duration}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 mb-0.5">Instructor</p>
                                            <p className="text-gray-300">{course.instructor}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 mb-0.5">Módulos</p>
                                            <p className="text-gray-300">{(course.modules ?? []).length}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 mb-0.5">Completados</p>
                                            <p className="text-gray-300">{course.completedEnrollments ?? 0}</p>
                                        </div>
                                    </div>
                                    {(course.skillsCovered ?? []).length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {(course.skillsCovered ?? []).map(s => (
                                                <span key={s} className="text-[10px] px-2 py-0.5 bg-zinc-800 rounded-full text-gray-400 border border-zinc-700">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {course.imageUrl && (
                                        <a
                                            href={course.imageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-cyan-400 underline"
                                        >
                                            Ver imagen
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Module JSON Help Modal */}
            {showModuleHelp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h5 className="font-bold text-white flex items-center gap-2">
                                <Database className="w-4 h-4 text-cyan-400" />
                                Formato de Módulos (JSON)
                            </h5>
                            <button onClick={() => setShowModuleHelp(false)} className="text-gray-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            <p className="text-xs text-gray-400">
                                Copia y pega este ejemplo para estructurar los módulos del curso. Asegúrate de que el JSON sea un array válido.
                            </p>
                            
                            <div className="relative">
                                <pre className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-[10px] text-cyan-300 font-mono overflow-auto max-h-60 custom-scrollbar">
{`[
  {
    "id": "mod-1",
    "title": "Introducción a DeFi",
    "type": "video",
    "duration": "10 min",
    "description": "Conceptos clave y ecosistema"
  },
  {
    "id": "quiz-1",
    "title": "Evaluación Inicial",
    "type": "quiz",
    "passing_score": 80,
    "question_count": 5
  },
  {
    "id": "mod-2",
    "title": "Pools de Liquidez",
    "type": "article",
    "duration": "15 min"
  }
]`}
                                </pre>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                                    <span className="text-white font-bold block mb-1">types:</span>
                                    video, article, quiz
                                </div>
                                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                                    <span className="text-white font-bold block mb-1">passing_score:</span>
                                    Requerido para tipo "quiz"
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowModuleHelp(false)}
                            className="w-full py-2 bg-cyan-600 text-white font-bold rounded-lg text-xs"
                        >
                            Cerrar Ayuda
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
