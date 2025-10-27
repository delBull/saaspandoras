'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@saasfly/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { BookOpenIcon, ClockIcon, UserGroupIcon, TrophyIcon, PlayIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';

// Force dynamic rendering - this page uses cookies and should not be prerendered
export const dynamic = 'force-dynamic';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  points: number;
  skills_covered: string[];
  instructor: string;
  enrolled_students: number;
  completion_rate: number;
  user_progress: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
}

export default function EducationPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingCourseId, setStartingCourseId] = useState<string | null>(null);

  useEffect(() => {
    void fetchCourses();
  }, []);

  // Mostrar toast de datos de prueba al cargar la página
  useEffect(() => {
    toast.info("📚 Esta sección muestra cursos de ejemplo. Estamos trabajando en el contenido educativo completo.", {
      duration: 6000,
      description: "Próximamente tendrás acceso a cursos interactivos reales con quizzes y modulos."
    });
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/education/courses');
      const data = await response.json() as { courses?: Course[]; message?: string };

      if (response.ok) {
        setCourses(data.courses?? []);
      } else {
        console.error('Error fetching courses:', data.message);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startCourse = async (courseId: string) => {
    setStartingCourseId(courseId);
    try {
      const response = await fetch(`/api/education/courses/${courseId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json() as { message?: string } & Record<string, unknown>;

      if (response.ok) {
        // Update local state to reflect started course
        setCourses(prev => prev.map(course =>
          course.id === courseId
            ? { ...course, user_progress: 'in_progress', progress_percentage: 0 }
            : course
        ));

        // Navigate to course page
        window.location.href = `/education/course/${courseId}`;
      } else {
        console.error('Error starting course:', data.message);
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to start course:', error);
      alert('Error al iniciar el curso. Inténtalo de nuevo.');
    } finally {
      setStartingCourseId(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'defi': return '🪙';
      case 'nfts': return '🎨';
      case 'security': return '🔒';
      default: return '📚';
    }
  };

  // Simple progress bar component
  const ProgressBar = ({ value, className }: { value: number; className?: string }) => (
    <div className={`w-full bg-zinc-700 rounded-full h-2 ${className}`}>
      <div
        className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      ></div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 mb-6 bg-zinc-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-zinc-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpenIcon className="w-8 h-8 text-cyan-400" />
            Educación Web3
          </h1>
          <p className="text-gray-400 mt-1">
            Aprende skills Web3 avanzados y gana puntos mientras lo haces
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Cursos Disponibles</div>
          <div className="text-2xl font-bold text-cyan-400">{courses.length}</div>
        </div>
      </div>

      {/* Progress Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border border-cyan-700/50 rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Tu Progreso de Aprendizaje</h3>
            <p className="text-gray-400 text-sm">
              Completa cursos para obtener puntos, achievements y conocimientos Web3
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Completados</div>
            <div className="text-2xl font-bold text-cyan-400">
              {courses.filter(c => c.user_progress === 'completed').length}
            </div>
            <div className="text-sm text-gray-400">de {courses.length}</div>
          </div>
        </div>
      </motion.div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-200 h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{getCategoryIcon(course.category)}</div>
                  <div
                    className={`px-2 py-1 text-xs border rounded ${getDifficultyColor(course.difficulty)}`}
                  >
                    {course.difficulty}
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight">{course.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {course.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                {/* Course Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <ClockIcon className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrophyIcon className="w-4 h-4 text-yellow-500" />
                      <span className="text-cyan-400 font-semibold">+{course.points}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <UserGroupIcon className="w-4 h-4" />
                      <span>{course.enrolled_students?.toLocaleString() || 0} estudiantes</span>
                    </div>
                    <div>{course.completion_rate}% completan</div>
                  </div>

                  {/* Progress for started courses */}
                  {course.user_progress && course.user_progress !== 'not_started' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Progreso</span>
                        <span className={`text-sm font-medium ${
                          course.user_progress === 'completed' ? 'text-green-400' : 'text-cyan-400'
                        }`}>
                          {course.user_progress === 'completed' ? 'Completado' :
                           `${course.progress_percentage || 0}%`}
                        </span>
                      </div>
                      <ProgressBar
                        value={course.user_progress === 'completed' ? 100 : (course.progress_percentage || 0)}
                      />
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  {course.user_progress === 'completed' ? (
                    <Button
                      disabled
                      className="w-full bg-green-600/20 text-green-400 border-green-600/50 cursor-not-allowed"
                    >
                      ✅ Completado
                    </Button>
                  ) : course.user_progress === 'in_progress' ? (
                    <Link href={`/education/course/${course.id}`}>
                      <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                        Continuar Curso
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={() => startCourse(course.id)}
                      disabled={startingCourseId === course.id}
                      className="w-full bg-lime-600 hover:bg-lime-700 disabled:opacity-50"
                    >
                      {startingCourseId === course.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Iniciando...
                        </>
                      ) : (
                        <>
                          <PlayIcon className="w-4 h-4 mr-2" />
                          Iniciar (+10 pts)
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {courses.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <BookOpenIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No hay cursos disponibles</h3>
          <p className="text-gray-400">Próximamente tendremos contenido educativo exclusivo.</p>
        </div>
      )}
    </div>
  );
}
