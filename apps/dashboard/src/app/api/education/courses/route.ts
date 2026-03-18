import { NextResponse } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "~/db";
import { courses, courseEnrollments } from "~/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

// GET - Listar cursos activos + progreso del usuario
export async function GET(_request: Request) {
  try {
    const { session } = await getAuth(await headers());
    const walletAddress = session?.address?.toLowerCase();

    if (!walletAddress) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Obtener todos los cursos activos
    const allCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.isActive, true))
      .orderBy(courses.orderIndex);

    if (allCourses.length === 0) {
      return NextResponse.json({ courses: [], total: 0, user_wallet: walletAddress });
    }

    // Obtener enrollments del usuario
    const enrollments = await db
      .select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.userId, walletAddress));

    const enrollmentMap = new Map(enrollments.map(e => [e.courseId, e]));

    // Obtener estadísticas globales agrupadas por curso
    const globalStats = await db
      .select({
        courseId: courseEnrollments.courseId,
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where status = 'completed')::int`,
      })
      .from(courseEnrollments)
      .groupBy(courseEnrollments.courseId);

    const statsMap = new Map(globalStats.map(s => [s.courseId, s]));

    // Combinar datos
    const coursesWithProgress = allCourses.map(course => {
      const enrollment = enrollmentMap.get(course.id);
      const stats = statsMap.get(course.id);
      
      const enrolledCount = stats?.total ?? 0;
      const completedCount = stats?.completed ?? 0;
      const completionRate = enrolledCount > 0 
        ? Math.round((completedCount / enrolledCount) * 100) 
        : 0;

      return {
        ...course,
        // translate difficulty for legacy frontend compat
        difficulty: course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1),
        points: course.xpReward,
        skills_covered: course.skillsCovered,
        enrolled_students: enrolledCount,
        completion_rate: completionRate,
        user_progress: enrollment
          ? (enrollment.status as 'in_progress' | 'completed')
          : 'not_started',
        progress_percentage: enrollment?.progressPct ?? 0,
      };
    });

    return NextResponse.json({
      courses: coursesWithProgress,
      total: coursesWithProgress.length,
      user_wallet: walletAddress,
    });

  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

// POST - Crear nuevo curso (solo admin)
export async function POST(request: Request) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address || !await isAdmin(session.address)) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await request.json() as {
      id: string;
      title: string;
      description: string;
      category: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      duration: string;
      imageUrl?: string;
      xpReward?: number;
      creditsReward?: number;
      prerequisites?: string[];
      modules?: Record<string, unknown>[];
      skillsCovered?: string[];
      instructor?: string;
      orderIndex?: number;
    };

    if (!body.id || !body.title || !body.description || !body.category || !body.difficulty || !body.duration) {
      return NextResponse.json({ message: "Faltan campos requeridos: id, title, description, category, difficulty, duration" }, { status: 400 });
    }

    const newCourse = await db
      .insert(courses)
      .values({
        id: body.id,
        title: body.title,
        description: body.description,
        category: body.category,
        difficulty: body.difficulty,
        duration: body.duration,
        imageUrl: body.imageUrl,
        xpReward: body.xpReward ?? 50,
        creditsReward: body.creditsReward ?? 10,
        prerequisites: body.prerequisites ?? [],
        modules: body.modules ?? [],
        skillsCovered: body.skillsCovered ?? [],
        instructor: body.instructor ?? "Pandora's Team",
        orderIndex: body.orderIndex ?? 0,
      })
      .returning();

    return NextResponse.json({ success: true, course: newCourse[0] }, { status: 201 });

  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ message: "Ya existe un curso con ese ID" }, { status: 409 });
    }
    console.error("Error creating course:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
