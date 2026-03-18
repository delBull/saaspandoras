'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Users, Trophy, BookOpen, Play, CheckCircle2, Lock, Zap, Coins, Award, ChevronRight, AlertCircle, HelpCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

interface Module {
  id: string;
  title: string;
  type: 'video' | 'article' | 'quiz';
  duration?: string;
  description?: string;
  content_url?: string | null;
  content?: string | null;
  is_free_preview?: boolean;
  passing_score?: number;
  question_count?: number;
  questions?: { question: string; options: string[]; correctIndex: number }[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  points: number;
  xpReward: number;
  creditsReward: number;
  skills_covered: string[];
  instructor: string;
  enrolled_students: number;
  completion_rate: number;
  modules: Module[];
  prerequisites: string[];
}

interface Enrollment {
  status: 'in_progress' | 'completed';
  progressPct: number;
  startedAt: string;
  completedAt?: string;
}

const MODULE_ICONS: Record<string, JSX.Element> = {
  video: <Play className="w-4 h-4" />,
  article: <BookOpen className="w-4 h-4" />,
  quiz: <Award className="w-4 h-4" />,
};

const MODULE_COLORS: Record<string, string> = {
  video: 'text-cyan-400 bg-cyan-400/10 border-cyan-500/30',
  article: 'text-blue-400 bg-blue-400/10 border-blue-500/30',
  quiz: 'text-amber-400 bg-amber-400/10 border-amber-500/30',
};

const DIFF_COLORS: Record<string, string> = {
  Beginner: 'text-green-400 bg-green-400/10 border-green-500/30',
  Intermediate: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30',
  Advanced: 'text-red-400 bg-red-400/10 border-red-500/30',
};

const CATEGORY_EMOJI: Record<string, string> = {
  defi: '🪙', nfts: '🎨', security: '🔒', dao: '⚖️', trading: '📊', general: '📚',
};

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Reset quiz state when module changes
  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  }, [selectedModule?.id]);

  useEffect(() => {
    params.then(p => setCourseId(p.courseId));
  }, [params]);

  const fetchCourse = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/education/courses/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Curso no encontrado');
          router.push('/education');
          return;
        }
        throw new Error('Error al cargar curso');
      }
      const data = await res.json() as { course: Course; enrollment: Enrollment | null };
      setCourse(data.course);
      setEnrollment(data.enrollment);
    } catch (err) {
      toast.error('Error al cargar el curso');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (courseId) fetchCourse(courseId);
  }, [courseId, fetchCourse]);

  const handleStart = async () => {
    if (!courseId) return;
    setStarting(true);
    try {
      const res = await fetch(`/api/education/courses/${courseId}/start`, { method: 'POST' });
      const data = await res.json() as any;
      if (res.ok) {
        setEnrollment({ status: 'in_progress', progressPct: 0, startedAt: new Date().toISOString() });
        toast.success(`¡Curso iniciado! +${Math.round((course?.xpReward ?? 50) * 0.1)} XP`, {
          description: 'Empieza con el primer módulo abajo ↓'
        });
      } else {
        toast.error(data.message ?? 'Error al iniciar');
      }
    } catch {
      toast.error('Error de red');
    } finally {
      setStarting(false);
    }
  };

  const handleComplete = async () => {
    if (!courseId || !course) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/education/courses/${courseId}/complete`, { method: 'POST' });
      const data = await res.json() as any;
      if (res.ok) {
        if (!isCompleted) {
          setEnrollment(prev => prev ? { ...prev, status: 'completed', progressPct: 100, completedAt: new Date().toISOString() } : prev);
        }
        
        if (data.isReview) {
          toast.success(`Revisión finalizada ✅`, {
            description: 'Has vuelto a revisar el contenido del curso.'
          });
        } else {
          toast.success(`🎉 ¡Curso completado! +${course.xpReward} XP, +${course.creditsReward} Credits`, {
            description: 'Las recompensas se han acreditado a tu perfil'
          });
        }
      } else {
        toast.error(data.message ?? 'Error al completar');
      }
    } catch {
      toast.error('Error de red');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-zinc-800 rounded" />
        <div className="h-48 bg-zinc-800 rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-zinc-800 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!course) return null;

  const catEmoji = CATEGORY_EMOJI[course.category?.toLowerCase()] ?? '📚';
  const isNotStarted = !enrollment;
  const isInProgress = enrollment?.status === 'in_progress';
  const isCompleted = enrollment?.status === 'completed';
  const totalModules = course.modules?.length ?? 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-32">
      {/* Hero header */}
      <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-8">
          <button
            onClick={() => router.push('/education')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Educación
          </button>

          <div className="flex items-start gap-4">
            <div className="text-5xl flex-shrink-0">{catEmoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${DIFF_COLORS[course.difficulty] ?? ''}`}>
                  {course.difficulty}
                </span>
                <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-full">
                  {course.category}
                </span>
                {isCompleted && (
                  <span className="text-xs font-bold text-green-400 bg-green-400/10 border border-green-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completado
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{course.title}</h1>
              <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">{course.description}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6 mt-6 text-sm text-gray-400">
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400" />{course.duration}</div>
            <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-purple-400" />{totalModules} módulos</div>
            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" />{(course.enrolled_students ?? 0).toLocaleString()} estudiantes</div>
            <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" />{course.completion_rate}% completan</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main — Module List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress bar */}
          {isInProgress && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/80 border border-cyan-500/30 rounded-xl p-4"
            >
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400 font-medium">Progreso del curso</span>
                <span className="text-cyan-400 font-bold">{enrollment.progressPct}%</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${enrollment.progressPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Marca el curso como completado cuando termines todos los módulos</p>
            </motion.div>
          )}

          {/* Modules */}
          <div>
            <h2 className="text-base font-bold text-white mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Contenido del Curso
              </div>
              <button 
                onClick={() => setShowInfo(true)}
                className="p-1 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-cyan-400 transition-all"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </h2>
            <div className="space-y-2">
              {(course.modules ?? []).length === 0 ? (
                <div className="text-center py-10 text-gray-600 border border-dashed border-zinc-800 rounded-xl">
                  <BookOpen className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">Módulos en preparación</p>
                </div>
              ) : (
                (course.modules ?? []).map((mod, idx) => {
                  const isLocked = !isInProgress && !isCompleted && !mod.is_free_preview;
                  return (
                    <motion.div
                      key={mod.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => {
                        if (isLocked) {
                          toast.error('Módulo bloqueado', {
                            description: 'Inicia el curso para desbloquear este contenido'
                          });
                          return;
                        }
                        setSelectedModule(mod);
                      }}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                        isLocked
                          ? 'bg-zinc-900/30 border-zinc-800/40 opacity-60 cursor-not-allowed'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-800/40 cursor-pointer active:scale-[0.98]'
                      }`}
                    >
                      {/* Index / icon */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border text-xs font-bold ${
                        MODULE_COLORS[mod.type] ?? 'text-gray-400 bg-gray-400/10 border-gray-500/30'
                      }`}>
                        {isLocked ? <Lock className="w-3.5 h-3.5" /> : (MODULE_ICONS[mod.type] ?? <BookOpen className="w-3.5 h-3.5" />)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white leading-tight">{mod.title}</span>
                          {mod.is_free_preview && (
                            <span className="text-[9px] font-bold uppercase text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-500/30">Preview</span>
                          )}
                          {mod.type === 'quiz' && mod.passing_score && (
                            <span className="text-[9px] font-bold uppercase text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                              {mod.passing_score}% para pasar
                            </span>
                          )}
                        </div>
                        {mod.description && (
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{mod.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                          <span className="capitalize">{mod.type}</span>
                          {mod.duration && <><span>·</span><span>{mod.duration}</span></>}
                          {mod.question_count && <><span>·</span><span>{mod.question_count} preguntas</span></>}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isLocked ? 'text-zinc-700' : 'text-zinc-600'}`} />
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Skills */}
          {(course.skills_covered ?? []).length > 0 && (
            <div>
              <h2 className="text-base font-bold text-white mb-3">🎯 Skills que aprenderás</h2>
              <div className="flex flex-wrap gap-2">
                {(course.skills_covered ?? []).map(skill => (
                  <span key={skill} className="text-xs text-gray-300 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — CTA Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Reward card */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm">Al completar este curso</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Zap className="w-4 h-4 text-orange-400" />
                    Experiencia (XP)
                  </div>
                  <span className="font-bold text-orange-400">+{course.xpReward}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Coins className="w-4 h-4 text-green-400" />
                    Harvest Credits
                  </div>
                  <span className="font-bold text-green-400">+{course.creditsReward}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Award className="w-4 h-4 text-purple-400" />
                    Achievement desbloqueado
                  </div>
                  <span className="font-bold text-purple-400">1</span>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Instructor</span>
                  <span className="text-gray-300 font-medium">{course.instructor}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Duración total</span>
                  <span className="text-gray-300 font-medium">{course.duration}</span>
                </div>
              </div>

              {/* CTA */}
              {isCompleted ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 w-full py-3 px-4 bg-green-600/20 border border-green-500/30 text-green-400 rounded-xl text-sm font-bold justify-center">
                    <CheckCircle2 className="w-4 h-4" /> Curso completado ✅
                  </div>
                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {completing ? (
                      <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Terminar Revisión
                  </button>
                </div>
              ) : isInProgress ? (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    Completa todos los módulos antes de marcar como terminado
                  </div>
                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {completing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trophy className="w-4 h-4" />
                    )}
                    Marcar como completado
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={starting}
                  className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
                >
                  {starting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Iniciar Curso
                </button>
              )}
            </div>

            {/* Prerequisites */}
            {(course.prerequisites ?? []).length > 0 && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Requisitos previos</h3>
                <div className="space-y-1.5">
                  {(course.prerequisites ?? []).map(prereq => (
                    <button
                      key={prereq}
                      onClick={() => router.push(`/education/course/${prereq}`)}
                      className="w-full flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors text-left"
                    >
                      <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                      {prereq.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module Modal */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setSelectedModule(null)}
            onKeyDown={(e) => e.key === 'Escape' && setSelectedModule(null)}
            role="button"
            tabIndex={0}
            aria-label="Cerrar modal"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${MODULE_COLORS[selectedModule.type] ?? ''}`}>
                  {MODULE_ICONS[selectedModule.type] ?? <BookOpen className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight uppercase italic">{selectedModule.title}</h3>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">{selectedModule.type} · {selectedModule.duration || '5 min'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedModule(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 rotate-90" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                {selectedModule.type === 'video' ? (
                  <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
                    {selectedModule.content_url ? (
                      <div className="aspect-video relative w-full">
                        <iframe
                          src={selectedModule.content_url}
                          title={selectedModule.title}
                          className="absolute inset-0 w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="aspect-video flex flex-col items-center justify-center p-6 text-center">
                        <Play className="w-16 h-16 text-cyan-500 mb-4 opacity-50" />
                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Video no disponible</p>
                      </div>
                    )}
                    {selectedModule.description && (
                        <div className="p-6 border-t border-zinc-800 bg-zinc-950/50">
                            <p className="text-zinc-400 text-sm leading-relaxed">{selectedModule.description}</p>
                        </div>
                    )}
                  </div>
                ) : selectedModule.type === 'article' && selectedModule.content ? (
                  <div className="space-y-6">
                    {selectedModule.description && (
                      <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
                        <p className="text-zinc-400 text-sm leading-relaxed italic border-l-2 border-cyan-500 pl-4">
                          {selectedModule.description}
                        </p>
                      </div>
                    )}
                    <div 
                      className="prose prose-invert prose-zinc max-w-none text-zinc-300 text-sm leading-loose prose-headings:text-white prose-a:text-cyan-400 prose-strong:text-white prose-strong:font-bold prose-ul:list-disc prose-ol:list-decimal rounded-2xl p-6 bg-zinc-900/20 border border-zinc-800/50"
                      dangerouslySetInnerHTML={{ __html: selectedModule.content }}
                    />
                  </div>
                ) : selectedModule.type === 'quiz' && selectedModule.questions && selectedModule.questions.length > 0 ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-3xl">
                       <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                           <Award className="w-4 h-4 text-amber-400" />
                           {selectedModule.title}
                       </h4>
                       <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                        {selectedModule.description || 'Responde a las siguientes preguntas para completar este módulo.'}
                       </p>
                       <div className="flex items-center gap-4 text-xs font-bold">
                           <span className="text-amber-400 px-2 py-1 bg-amber-400/10 rounded">Puntuación mínima: {selectedModule.passing_score ?? 0}%</span>
                           <span className="text-zinc-400 px-2 py-1 bg-zinc-800 rounded">{(selectedModule.questions || []).length} Preguntas</span>
                       </div>
                    </div>

                    <div className="space-y-8">
                        {(selectedModule.questions || []).map((q, qIndex) => (
                            <div key={qIndex} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                                <h5 className="text-white font-bold mb-4">{qIndex + 1}. {q.question}</h5>
                                <div className="space-y-2">
                                    {q.options.map((opt, oIndex) => {
                                        const isSelected = quizAnswers[qIndex] === oIndex;
                                        const isCorrect = q.correctIndex === oIndex;
                                        const showSuccess = quizSubmitted && isCorrect;
                                        const showError = quizSubmitted && isSelected && !isCorrect;

                                        let borderClass = 'border-zinc-700 hover:border-cyan-500/50 hover:bg-zinc-800';
                                        if (isSelected) borderClass = 'border-cyan-500 bg-cyan-500/10';
                                        if (showSuccess) borderClass = 'border-green-500 bg-green-500/10';
                                        if (showError) borderClass = 'border-red-500 bg-red-500/10';

                                        return (
                                            <button
                                                key={oIndex}
                                                disabled={quizSubmitted}
                                                onClick={() => setQuizAnswers(prev => ({ ...prev, [qIndex]: oIndex }))}
                                                className={`w-full text-left p-4 rounded-xl border transition-all text-sm flex items-center gap-3 ${borderClass}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center
                                                    ${isSelected ? 'border-cyan-500' : 'border-zinc-600'}
                                                    ${showSuccess ? 'border-green-500' : ''}
                                                    ${showError ? 'border-red-500' : ''}
                                                `}>
                                                    {(isSelected || showSuccess || showError) && (
                                                        <div className={`w-2 h-2 rounded-full 
                                                            ${(showSuccess) ? 'bg-green-500' : showError ? 'bg-red-500' : 'bg-cyan-500'}
                                                        `} />
                                                    )}
                                                </div>
                                                <span className={showSuccess ? 'text-green-400 font-medium' : showError ? 'text-red-400' : 'text-zinc-300'}>{opt}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {!quizSubmitted ? (
                        <button
                            onClick={() => {
                                const total = (selectedModule.questions || []).length;
                                let correct = 0;
                                (selectedModule.questions || []).forEach((q, idx) => {
                                    if (quizAnswers[idx] === q.correctIndex) correct++;
                                });
                                const score = total > 0 ? Math.round((correct / total) * 100) : 0;
                                setQuizScore(score);
                                setQuizSubmitted(true);
                            }}
                            disabled={Object.keys(quizAnswers).length !== (selectedModule.questions || []).length}
                            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-cyan-900/20"
                        >
                            Enviar Respuestas
                        </button>
                    ) : (
                        <div className={`p-6 rounded-2xl border text-center ${quizScore >= (selectedModule.passing_score ?? 0) ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                            <h4 className={`text-2xl font-black mb-2 ${quizScore >= (selectedModule.passing_score ?? 0) ? 'text-green-400' : 'text-red-400'}`}>
                                {quizScore}% — {quizScore >= (selectedModule.passing_score ?? 0) ? '¡Aprobado!' : 'No Aprobado'}
                            </h4>
                            <p className="text-zinc-400 text-sm mb-6">
                                {quizScore >= (selectedModule.passing_score ?? 0) 
                                    ? '¡Felicidades! Has superado la puntuación mínima requerida.' 
                                    : `Necesitabas un ${selectedModule.passing_score ?? 0}% para aprobar. Por favor, revisa el material e inténtalo de nuevo.`}
                            </p>
                            {quizScore >= (selectedModule.passing_score ?? 0) ? (
                                <button
                                    onClick={() => {
                                        toast.success('¡Quiz completado!', { description: 'Has progresado en tu formación.' });
                                        setSelectedModule(null);
                                        if (enrollment && enrollment.status === 'in_progress') {
                                            const newPct = Math.min(enrollment.progressPct + Math.floor(100 / totalModules), 100);
                                            setEnrollment({...enrollment, progressPct: newPct});
                                        }
                                    }}
                                    className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors inline-block"
                                >
                                    Completar Módulo y Continuar
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); setQuizScore(0); }}
                                    className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors inline-block border border-zinc-700"
                                >
                                    Reintentar Quiz
                                </button>
                            )}
                        </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl">
                       <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                           <BookOpen className="w-4 h-4 text-cyan-400" />
                           Resumen del Módulo
                       </h4>
                       <p className="text-zinc-400 text-sm leading-relaxed italic">
                        {selectedModule.description || `En este módulo exploraremos los conceptos fundamentales de ${course.title} enfocados en ${selectedModule.title}. Aprenderás los mecanismos clave, riesgos y oportunidades dentro del ecosistema Pandoras.`}
                       </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Dificultad</p>
                            <p className="text-xs text-white font-bold">{course.difficulty}</p>
                        </div>
                        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Categoría</p>
                            <p className="text-xs text-white font-bold uppercase">{course.category}</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <h4 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                          <Zap className="w-4 h-4 text-cyan-400" />
                          Lo que aprenderás
                      </h4>
                      <ul className="space-y-3">
                        {['Conceptos básicos y terminología', 'Mecanismos de operación en Pandoras', 'Mejores prácticas y seguridad'].map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                            <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-cyan-500" />
                            </div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
               <button
                onClick={() => setSelectedModule(null)}
                className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Cerrar Módulo
              </button>
              {selectedModule.type !== 'quiz' && (
                  <button
                    onClick={() => {
                        toast.success('¡Módulo completado!', {
                            description: 'Has progresado en tu formación.'
                        });
                        setSelectedModule(null);
                        // Update local progress if in progress
                        if (enrollment && enrollment.status === 'in_progress') {
                            const newPct = Math.min(enrollment.progressPct + Math.floor(100 / totalModules), 100);
                            setEnrollment({...enrollment, progressPct: newPct});
                        }
                    }}
                    className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-cyan-900/20"
                  >
                    Completar Módulo
                  </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Info Modal (Unified Retrieve/Educational Info) */}
      {showInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            onClick={() => setShowInfo(false)}
            onKeyDown={(e) => e.key === 'Escape' && setShowInfo(false)}
            role="button"
            tabIndex={0}
            aria-label="Cerrar info"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl space-y-6"
          >
            <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 mb-2">
                <HelpCircle className="w-6 h-6 text-cyan-400" />
            </div>
            
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-white uppercase italic">Academia Modular Pandoras</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                    Nuestros cursos están diseñados para ser consumidos en pequeñas dosis. Cada módulo completado otorga <span className="text-orange-400 font-bold">XP</span> para tu rango y <span className="text-green-400 font-bold">Credits</span> para el ecosistema.
                </p>
            </div>

            <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800 space-y-3">
                <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-cyan-500 text-black rounded text-[10px] flex items-center justify-center font-black mt-0.5">1</div>
                    <p className="text-xs text-zinc-300"><span className="text-white font-bold">Sincronización:</span> Tus logros se guardan localmente y se sincronizan con tu perfil de Telegram al marcar el curso como terminado.</p>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-cyan-500 text-black rounded text-[10px] flex items-center justify-center font-black mt-0.5">2</div>
                    <p className="text-xs text-zinc-300"><span className="text-white font-bold">Multi-formato:</span> Combina videos, lecturas y evaluaciones para una mejor retención.</p>
                </div>
            </div>

            <button
                onClick={() => setShowInfo(false)}
                className="w-full py-4 bg-zinc-100 text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95"
            >
                Entendido
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
