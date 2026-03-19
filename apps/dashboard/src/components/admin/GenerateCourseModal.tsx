'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, BrainCircuit, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface GenerateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (courseData: any) => void;
}

export function GenerateCourseModal({ isOpen, onClose, onSuccess }: GenerateCourseModalProps) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [tone, setTone] = useState('Motivacional, conciso y directo');
  
  const [phase, setPhase] = useState<'idle' | 'outline' | 'modules' | 'quiz'>('idle');
  const [progressMsg, setProgressMsg] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error('El tema es obligatorio');

    try {
      // PHASE 1: Outline
      setPhase('outline');
      setProgressMsg('Dise\u00F1ando estructura modular y hooks de dopamina...');
      
      const res1 = await fetch('/api/admin/courses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'outline', topic, difficulty, tone })
      });
      if (!res1.ok) throw new Error('Error generando estructura');
      const outlineData = await res1.json();

      // PHASE 2: Modules Content
      setPhase('modules');
      setProgressMsg('Redactando lunas y estrellas (micro-dosis de contenido)...');

      const res2 = await fetch('/api/admin/courses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'modules', topic, difficulty, tone, currentState: outlineData })
      });
      if (!res2.ok) throw new Error('Error generando m\u00F3dulos');
      const modulesData = await res2.json();

      // Merge modules content into outline
      const mergedOutline = { ...outlineData };
      mergedOutline.modules = mergedOutline.modules.map((mod: any) => {
        const enriched = modulesData.modules?.find((m: any) => m.id === mod.id);
        return enriched ? { ...mod, ...enriched } : mod;
      });

      // PHASE 3: Quizzes
      setPhase('quiz');
      setProgressMsg('Formulando trampas y escenarios gamificados...');

      const res3 = await fetch('/api/admin/courses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'quiz', topic, difficulty, tone, currentState: mergedOutline })
      });
      if (!res3.ok) throw new Error('Error generando quizzes');
      const quizData = await res3.json();

      // Merge final quiz questions
      const finalCourse = { ...mergedOutline };
      const quizModuleIndex = finalCourse.modules.findIndex((m: any) => m.type === 'quiz');
      if (quizModuleIndex !== -1) {
        finalCourse.modules[quizModuleIndex].questions = quizData.questions || [];
        finalCourse.modules[quizModuleIndex].question_count = quizData.questions?.length || 5;
        finalCourse.modules[quizModuleIndex].passing_score = 80;
        // Dynamically calculate quiz duration
        finalCourse.modules[quizModuleIndex].duration = `${Math.max(1, Math.ceil((quizData.questions?.length || 5) * 0.5))} min`;
      }

      // Automatically construct valid Form object
      const totalMins = finalCourse.modules.reduce((acc: number, m: any) => {
        const minsMatch = String(m.duration || '').match(/(\d+)/);
        return acc + (minsMatch?.[1] ? parseInt(minsMatch[1], 10) : 0);
      }, 0);
      const displayDuration = totalMins > 0 ? (totalMins >= 60 ? `${Math.floor(totalMins/60)}h ${totalMins%60}m` : `${totalMins} min`) : '45 min';

      const finalForm = {
        title: finalCourse.title,
        description: finalCourse.description,
        difficulty: finalCourse.difficulty?.toLowerCase() || 'beginner',
        category: 'DeFi',
        duration: displayDuration,
        skillsCovered: (finalCourse.skills_covered || []).join(', '),
        prerequisites: (finalCourse.prerequisites || []).join(', '),
        modules: JSON.stringify(finalCourse.modules, null, 2),
      };

      toast.success('¡Curso M\u00E1gico generado!');
      setPhase('idle');
      onSuccess(finalForm);
      onClose();

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'La IA tropez\u00F3 en el camino. Intenta de nuevo.');
      setPhase('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            AI Course Engine
          </h3>
          <button onClick={onClose} disabled={phase !== 'idle'} className="text-gray-500 hover:text-white disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {phase !== 'idle' ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 flex items-center justify-center relative z-10 bg-zinc-950">
                <BrainCircuit className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
            </div>
            
            <div className="space-y-4 w-full">
              <h4 className="text-white font-bold">{progressMsg}</h4>
              <div className="flex flex-col gap-2 max-w-xs mx-auto text-left text-xs">
                 <div className={`flex items-center gap-2 ${phase === 'outline' ? 'text-cyan-400 font-bold' : phase === 'modules' || phase === 'quiz' ? 'text-green-400' : 'text-zinc-600'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> 1. Estructura y Hooks
                 </div>
                 <div className={`flex items-center gap-2 ${phase === 'modules' ? 'text-cyan-400 font-bold' : phase === 'quiz' ? 'text-green-400' : 'text-zinc-600'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> 2. Módulos Gamificados
                 </div>
                 <div className={`flex items-center gap-2 ${phase === 'quiz' ? 'text-cyan-400 font-bold' : 'text-zinc-600'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> 3. Quizzes Inteligentes
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 relative">
             <div className="space-y-1">
                <label htmlFor="ai-topic" className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tema Pincipal del Curso</label>
                <input
                  id="ai-topic"
                  type="text"
                  placeholder="Ej. Introducci\u00F3n a los Rollups de Ethereum"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 transition-colors"
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label htmlFor="ai-difficulty" className="text-xs text-gray-400 font-bold uppercase tracking-wider">Dificultad</label>
                    <select
                        id="ai-difficulty"
                        value={difficulty}
                        onChange={e => setDifficulty(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 appearance-none"
                    >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="ai-tone" className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tono / Estilo</label>
                    <select
                        id="ai-tone"
                        value={tone}
                        onChange={e => setTone(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 appearance-none"
                    >
                        <option value="Motivacional, dopamin\u00E9rgico">Cripto / Degen</option>
                        <option value="Directo, t\u00E9cnico y conciso">T\u00E9cnico (Devs)</option>
                        <option value="Amigable, para novatos">Amigable (No-coiners)</option>
                    </select>
                </div>
             </div>
             
             <div className="pt-4">
                <button
                   onClick={handleGenerate}
                   className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-cyan-900/30"
                >
                    Generar Curso M\u00E1gicamente
                    <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-[10px] text-zinc-500 mt-3">
                    Este proceso tomar\u00E1 \u00B120 segundos. Se generar\u00E1 un borrador para tu revisi\u00F3n antes de publicarlo.
                </p>
             </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
